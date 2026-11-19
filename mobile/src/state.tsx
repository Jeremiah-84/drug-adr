import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BP0, GLU0, REPLIES, type BpEntry, type DrugId, type GluEntry, type SlotKey } from './data';
import { format, translate, uiStrings, type Lang, type UiStrings } from './i18n';
import { config, type Screen } from './config';

export type DetailTab = 'adr' | 'organ' | 'how';
export type ScanMode = 'rx' | 'barcode' | 'pill';
export type VitalsTab = 'bp' | 'glu';
export type PlaceFilter = '전체' | '병원' | '약국' | '야간';
export type Message = { me: boolean; text: string };
export type VitalsForm = { s: number | string; di: number | string; p: number | string; v: number | string; when: string };

export type AppState = {
  lang: Lang;
  splash: boolean;
  splashKey: number;
  stack: Screen[];
  times: Record<SlotKey, string>;
  timeEdit: SlotKey | null;
  draft: { h: number; mi: number };
  vt: VitalsTab;
  bp: BpEntry[];
  glu: GluEntry[];
  sheet: boolean;
  form: VitalsForm;
  mode: ScanMode;
  drug: DrugId;
  dtab: DetailTab;
  taken: Record<SlotKey, boolean>;
  remind: Record<SlotKey, boolean>;
  sym: string[];
  member: number;
  guard: Record<number, boolean>;
  phf: PlaceFilter;
  input: string;
  typing: boolean;
  toast: string;
  messages: Message[];
};

const GREETING = '안녕하세요, 김지현 님. 복용 중인 4개 약의 허가정보를 바탕으로 답해드릴게요. 무엇이 궁금하세요?';
const FALLBACK_REPLY = '복용 중인 4개 약의 허가정보에서 관련 내용을 찾아봤어요. 해당 내용과 직접 연결되는 기재 사항은 없었습니다. 증상이 계속되면 의사·약사와 상의해 주세요.';

const initialState = (): AppState => ({
  lang: config.lang,
  splash: config.splash && config.screen === 'home',
  splashKey: 0,
  stack: config.screen === 'home' ? ['home'] : ['home', config.screen],
  times: { m: '08:00', e: '19:00', n: '22:00' },
  timeEdit: null,
  draft: { h: 8, mi: 0 },
  vt: 'bp',
  bp: BP0,
  glu: GLU0,
  sheet: false,
  form: { s: 128, di: 82, p: 72, v: 110, when: '공복' },
  mode: 'rx',
  drug: 'lyr',
  dtab: 'adr',
  taken: { m: true, e: false, n: false },
  remind: { m: true, e: true, n: false },
  sym: ['어지러움'],
  member: 0,
  guard: { 0: false, 1: true, 2: false },
  phf: '전체',
  input: '',
  typing: false,
  toast: '',
  messages: [{ me: false, text: GREETING }],
});

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

export type App = {
  s: AppState;
  screen: Screen;
  set: (p: Patch) => void;
  go: (s: Screen) => void;
  tab: (s: Screen) => void;
  back: () => void;
  flash: (msg: string) => void;
  openDrug: (id: DrugId) => void;
  send: (text: string) => void;
  shutter: () => void;
  /** UI strings for the current language. */
  t: UiStrings;
  /** Translate a Korean data string into the current language. */
  L: (s: string) => string;
  /** Translate a Korean template and fill {0}, {1}… */
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
  const timers = useRef<{ scan?: number; reply?: number; toast?: number }>({});
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => () => { Object.values(timers.current).forEach(id => clearTimeout(id)); }, []);

  const set = useCallback((p: Patch) => setState(st => ({ ...st, ...(typeof p === 'function' ? p(st) : p) })), []);
  const go = useCallback((sc: Screen) => set(st => ({ stack: [...st.stack, sc] })), [set]);
  const tab = useCallback((sc: Screen) => set({ stack: [sc] }), [set]);
  const back = useCallback(() => set(st => ({ stack: st.stack.length > 1 ? st.stack.slice(0, -1) : ['home'] })), [set]);

  const flash = useCallback((msg: string) => {
    clearTimeout(timers.current.toast);
    set({ toast: msg });
    timers.current.toast = window.setTimeout(() => set({ toast: '' }), 1800);
  }, [set]);

  const openDrug = useCallback((id: DrugId) => set(st => ({ drug: id, dtab: 'adr', stack: [...st.stack, 'detail'] })), [set]);

  const send = useCallback((text: string) => {
    if (!text.trim() || stateRef.current.typing) return;
    set(st => ({ messages: [...st.messages, { me: true, text }], input: '', typing: true }));
    clearTimeout(timers.current.reply);
    timers.current.reply = window.setTimeout(() => set(st => ({
      typing: false,
      messages: [...st.messages, { me: false, text: REPLIES[text] ?? FALLBACK_REPLY }],
    })), 1300);
  }, [set]);

  const shutter = useCallback(() => {
    const st = stateRef.current;
    if (st.stack[st.stack.length - 1] !== 'scan') return;
    go('scanning');
    clearTimeout(timers.current.scan);
    timers.current.scan = window.setTimeout(() => set(x => ({
      stack: [...x.stack.filter(k => k !== 'scan' && k !== 'scanning'), 'results'],
    })), config.scanSeconds * 1000);
  }, [go, set]);

  const value = useMemo<App>(() => {
    const lang = s.lang;
    return {
      s, screen: s.stack[s.stack.length - 1], set, go, tab, back, flash, openDrug, send, shutter,
      t: uiStrings(lang),
      L: (x: string) => translate(lang, x),
      F: (key: string, ...args: (string | number)[]) => format(lang, key, ...args),
    };
  }, [s, set, go, tab, back, flash, openDrug, send, shutter]);

  useEffect(() => { document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : s.lang; }, [s.lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
