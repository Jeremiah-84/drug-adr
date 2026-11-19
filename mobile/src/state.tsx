import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SLOT_KEYS, SLOT_TIME, type BpEntry, type GluEntry, type SlotKey } from './data';
import { format, translate, uiStrings, type Lang, type UiStrings } from './i18n';
import { config, type Screen } from './config';
import { loadDetail, loadIndex, type Detail, type Found, type Index } from './real';
import { sdkLoad, sdkValid, type SdkSize, type SdkState } from './sudoku';

export type DetailTab = 'adr' | 'organ' | 'how';
export type ScanMode = 'rx' | 'barcode' | 'pill';
export type VitalsTab = 'bp' | 'glu';
export type VitalsForm = { s: number | string; di: number | string; p: number | string; v: number | string; when: string };

/** A medicine the person takes: a product (or ingredient) and the times of day it is taken. */
export type Med = { key: string; name: string; ids: string[]; slots: SlotKey[]; color: string };
export type ScanRec = { at: number; kind: 'rx' | 'barcode' | 'pill' | 'photo'; found: Found[] };
export type SymRec = { d: string; text: string; drugs: string };
export type Member = {
  id: string; name: string; rel: string; born?: string;
  /** First day medicines were saved (YYYY-MM-DD); adherence counts from here. */
  since?: string;
  meds: Med[]; bp: BpEntry[]; glu: GluEntry[];
  /** taken[YYYY-MM-DD] = slots marked as taken that day */
  taken: Record<string, SlotKey[]>;
  scans: ScanRec[]; syms: SymRec[];
};

export type Role = 'patient' | 'pro';
type Saved = {
  v: 1; lang: Lang; times: Record<SlotKey, string>; remind: Record<SlotKey, boolean>; member: number; members: Member[];
  /** First-run introduction finished (role picked). */
  onboarded?: boolean;
  role?: Role;
  /** Today's quiz answer: day key + picked option. */
  quiz?: { d: string; pick: number };
};

export type AppState = Saved & {
  /** Minutes since local midnight, refreshed every 15 s (drives the ±2 h dose window). */
  now: number;
  onb: number;
  sdk: SdkState;
  splash: boolean;
  splashKey: number;
  stack: Screen[];
  timeEdit: SlotKey | null;
  draft: { h: number; mi: number };
  vt: VitalsTab;
  sheet: boolean;
  form: VitalsForm;
  mode: ScanMode;
  /** The medicine open on the detail screen. */
  drug: Found;
  dtab: DetailTab;
  /** Problems picked on the symptom screen, and the free text typed there. */
  sym: string[];
  symText: string;
  /** Last scan / pill / barcode result shown on the results screen. */
  found: ScanRec | null;
  query: string;
  toast: string;
  D: Index | null;
  dataErr: boolean;
  details: Record<string, Detail | 'err'>;
};

const KEY = 'mediscan.v1';
const SDK_KEY = 'mediscan.sudoku';
/** "Mark as taken" works only within this many minutes either side of the set dose time. */
export const WINDOW_MIN = 120;
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

type SdkSaved = { day: string; n: SdkSize; seed: number; sol: number[]; given: number[]; cells: number[]; hints: number; done: boolean; elapsed: number };
const daySeed = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
function sdkRestore(): SdkState {
  try {
    const z = JSON.parse(localStorage.getItem(SDK_KEY) || 'null') as SdkSaved | null;
    if (z && z.day === dayKey() && Array.isArray(z.cells) && (z.n === 6 || z.n === 9)) {
      return { n: z.n, seed: z.seed, sol: z.sol, given: z.given, cells: z.cells, hints: z.hints, sel: -1, start: Date.now() - (z.elapsed || 0), end: z.done ? Date.now() : 0 };
    }
  } catch { /* ignore */ }
  return sdkLoad(6, daySeed());
}
const PALETTE = ['#efe9da', '#e3b37a', '#f6f3ec', '#e9b6b0', '#b9d3c4', '#d8c48a', '#c8bfe0', '#f2d2a9', '#a9c7d8', '#e7a7a0'];

export const newMember = (name: string, rel: string): Member => ({
  id: String(Date.now()) + Math.random().toString(36).slice(2, 6), name, rel, meds: [], bp: [], glu: [], taken: {}, scans: [], syms: [],
});

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function loadSaved(): Saved {
  const fresh: Saved = { v: 1, lang: config.lang, times: { ...SLOT_TIME }, remind: { m: false, l: false, e: false, n: false }, member: 0, members: [newMember('', '나')], onboarded: false, role: 'patient' };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const s = JSON.parse(raw) as Saved;
    if (s.v !== 1 || !Array.isArray(s.members) || !s.members.length) return fresh;
    if (new URLSearchParams(location.search).get('lang')) s.lang = config.lang;
    s.member = Math.min(Math.max(0, s.member | 0), s.members.length - 1);
    // Older saves have no lunch slot: fill in defaults for any missing time.
    // Saves from before the first-run introduction existed belong to people already using the app.
    if (s.onboarded === undefined) s.onboarded = true;
    return { ...fresh, ...s, times: { ...fresh.times, ...s.times }, remind: { ...fresh.remind, ...s.remind } };
  } catch { return fresh; }
}

const initialState = (): AppState => {
  const saved = loadSaved();
  const start: Screen = config.screen === 'home' && !saved.onboarded ? 'onboarding' : config.screen;
  return {
  ...saved,
  now: nowMin(),
  onb: 0,
  sdk: sdkRestore(),
  splash: config.splash && start === 'home',
  splashKey: 0,
  stack: start === 'home' || start === 'onboarding' ? [start] : ['home', start],
  timeEdit: null,
  draft: { h: 8, mi: 0 },
  vt: 'bp',
  sheet: false,
  form: { s: 120, di: 80, p: 70, v: 100, when: '공복' },
  mode: 'rx',
  drug: { name: '', ids: [] },
  dtab: 'adr',
  sym: [],
  symText: '',
  found: null,
  query: '',
  toast: '',
  D: null,
  dataErr: false,
  details: {},
  };
};

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

export type App = {
  s: AppState;
  screen: Screen;
  me: Member;
  set: (p: Patch) => void;
  /** Change the current family member's record. */
  edit: (f: (m: Member) => Partial<Member>) => void;
  go: (s: Screen) => void;
  tab: (s: Screen) => void;
  back: () => void;
  flash: (msg: string) => void;
  openDrug: (f: Found) => void;
  need: (ids: string[]) => void;
  addMeds: (list: Found[], slots?: SlotKey[]) => number;
  showFound: (r: ScanRec) => void;
  takeSlot: (k: SlotKey) => void;
  sdk: {
    select: (i: number) => void; put: (v: number) => void; hint: () => void; size: (n: SdkSize) => void; fresh: () => void;
  };
  t: UiStrings;
  L: (s: string) => string;
  F: (key: string, ...args: (string | number)[]) => string;
};

const Ctx = createContext<App | null>(null);

export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setState] = useState<AppState>(initialState);
  const timers = useRef<{ toast?: number }>({});
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => () => { Object.values(timers.current).forEach(id => clearTimeout(id)); }, []);

  // Load the drug index once.
  useEffect(() => {
    loadIndex().then(D => setState(st => ({ ...st, D }))).catch(() => setState(st => ({ ...st, dataErr: true })));
  }, []);

  // Save what the person entered (on this device only).
  const savedRef = useRef('');
  useEffect(() => {
    const out: Saved = { v: 1, lang: s.lang, times: s.times, remind: s.remind, member: s.member, members: s.members, onboarded: s.onboarded, role: s.role, quiz: s.quiz };
    const j = JSON.stringify(out);
    if (j === savedRef.current) return;
    savedRef.current = j;
    try { localStorage.setItem(KEY, j); } catch { /* storage full or blocked: keep working in memory */ }
  }, [s.lang, s.times, s.remind, s.member, s.members, s.onboarded, s.role, s.quiz]);

  // Sudoku progress is saved per day, so leaving and coming back resumes the same puzzle.
  useEffect(() => {
    const z = s.sdk;
    const out: SdkSaved = { day: dayKey(), n: z.n, seed: z.seed, sol: z.sol, given: z.given, cells: z.cells, hints: z.hints, done: !!z.end, elapsed: (z.end || Date.now()) - z.start };
    try { localStorage.setItem(SDK_KEY, JSON.stringify(out)); } catch { /* ignore */ }
  }, [s.sdk]);

  // Clock for the dose window; a new day brings a new puzzle.
  useEffect(() => {
    let day = dayKey();
    const tick = () => setState(st => {
      const n = nowMin(), d = dayKey();
      if (d !== day) { day = d; return { ...st, now: n, sdk: sdkLoad(6, daySeed()) }; }
      return n === st.now ? st : { ...st, now: n };
    });
    const id = window.setInterval(tick, 15000);
    const vis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const set = useCallback((p: Patch) => setState(st => ({ ...st, ...(typeof p === 'function' ? p(st) : p) })), []);
  const edit = useCallback((f: (m: Member) => Partial<Member>) => setState(st => {
    const members = st.members.slice();
    members[st.member] = { ...members[st.member], ...f(members[st.member]) };
    return { ...st, members };
  }), []);
  const go = useCallback((sc: Screen) => set(st => ({ stack: [...st.stack, sc] })), [set]);
  const tab = useCallback((sc: Screen) => set({ stack: [sc] }), [set]);
  const back = useCallback(() => set(st => ({ stack: st.stack.length > 1 ? st.stack.slice(0, -1) : ['home'] })), [set]);

  const flash = useCallback((msg: string) => {
    clearTimeout(timers.current.toast);
    set({ toast: msg });
    timers.current.toast = window.setTimeout(() => set({ toast: '' }), 2200);
  }, [set]);

  const need = useCallback((ids: string[]) => {
    for (const id of ids) {
      if (stateRef.current.details[id]) continue;
      loadDetail(id).then(d => set(st => ({ details: { ...st.details, [id]: d } })))
        .catch(() => set(st => ({ details: { ...st.details, [id]: 'err' } })));
    }
  }, [set]);

  const openDrug = useCallback((f: Found) => { need(f.ids); set(st => ({ drug: f, dtab: 'adr', stack: [...st.stack, 'detail'] })); }, [set, need]);

  const addMeds = useCallback((list: Found[], slots: SlotKey[] = ['m']) => {
    if (!slots.length) slots = ['m'];
    const cur = stateRef.current.members[stateRef.current.member].meds;
    const have = new Set(cur.map(m => m.ids.slice().sort().join('+')));
    const add: Med[] = [];
    list.forEach(f => {
      const k = f.ids.slice().sort().join('+');
      if (!f.ids.length || have.has(k)) return;
      have.add(k);
      add.push({ key: k, name: f.name, ids: f.ids, slots, color: PALETTE[(cur.length + add.length) % PALETTE.length] });
    });
    if (add.length) { edit(m => ({ meds: [...m.meds, ...add], since: m.since || dayKey() })); add.forEach(m => need(m.ids)); }
    return add.length;
  }, [edit, need]);

  const showFound = useCallback((r: ScanRec) => {
    if (r.found.length) edit(m => ({ scans: [r, ...m.scans].slice(0, 30) }));
    r.found.forEach(f => need(f.ids));
    set(x => ({ found: r, stack: [...x.stack.filter(k => k !== 'scan' && k !== 'pill'), 'results'] }));
  }, [edit, set, need]);

  // Load label data for the medicines already saved.
  const me = s.members[s.member];
  useEffect(() => { need(me.meds.flatMap(m => m.ids)); }, [me.id, me.meds.length, need]);

  // Dose reminders while the app is open (web apps cannot ring once fully closed).
  useEffect(() => {
    const fired = new Set<string>();
    const id = window.setInterval(() => {
      const st = stateRef.current, m = st.members[st.member];
      const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const k of SLOT_KEYS) {
        if (!st.remind[k] || st.times[k] !== hm || !m.meds.some(x => x.slots.includes(k))) continue;
        const tag = dayKey() + k;
        if (fired.has(tag) || (m.taken[dayKey()] || []).includes(k)) continue;
        fired.add(tag);
        const body = m.meds.filter(x => x.slots.includes(k)).map(x => x.name).join(', ');
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification(translate(st.lang, '복용할 시간이에요') + ' · ' + st.times[k], { body, icon: './icon-192.png' }); } catch { /* ignore */ }
      }
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const takeSlot = useCallback((k: SlotKey) => {
    edit(m => { const d = dayKey(), cur = m.taken[d] || []; return cur.includes(k) ? {} : { taken: { ...m.taken, [d]: [...cur, k] } }; });
  }, [edit]);

  const sdk = useMemo(() => {
    const upd = (f: (z: SdkState) => SdkState | null) => setState(st => { const z = f(st.sdk); return z ? { ...st, sdk: z } : st; });
    return {
      select: (i: number) => upd(z => ({ ...z, sel: i })),
      put: (v: number) => upd(q => {
        if (q.sel < 0 || q.given[q.sel] || q.end) return null;
        const cells = q.cells.slice(); cells[q.sel] = v;
        const full = cells.every(c => c) && sdkValid(cells, q.n);
        return { ...q, cells, end: full ? Date.now() : 0 };
      }),
      hint: () => upd(q => {
        const i = q.sel >= 0 && !q.given[q.sel] && q.cells[q.sel] !== q.sol[q.sel] ? q.sel : q.cells.findIndex((c, k) => c !== q.sol[k]);
        if (i < 0 || q.end) return null;
        const cells = q.cells.slice(); cells[i] = q.sol[i];
        const full = cells.every((c, k) => c === q.sol[k]);
        return { ...q, cells, sel: i, hints: q.hints + 1, end: full ? Date.now() : 0 };
      }),
      size: (n: SdkSize) => upd(q => (q.n === n ? null : sdkLoad(n, q.seed))),
      fresh: () => upd(q => sdkLoad(q.n, q.seed + 1)),
    };
  }, []);

  const value = useMemo<App>(() => {
    const lang = s.lang;
    return {
      s, me: s.members[s.member], screen: s.stack[s.stack.length - 1], set, edit, go, tab, back, flash, openDrug, need, addMeds, showFound, takeSlot, sdk,
      t: uiStrings(lang),
      L: (x: string) => translate(lang, x),
      F: (key: string, ...args: (string | number)[]) => format(lang, key, ...args),
    };
  }, [s, set, edit, go, tab, back, flash, openDrug, need, addMeds, showFound, takeSlot, sdk]);

  useEffect(() => { document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : s.lang; }, [s.lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
