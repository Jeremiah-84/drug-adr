import { LV, SLOT_KEYS, SLOT_LABEL, type Level, type SlotKey, type Tag } from './data';
import { WINDOW_MIN, medsOn, type AppState, type Med, type Member } from './state';
import { ingName, probName, type Detail, type Found, type Index } from './real';

export type AdrRow = { pid: string; name: string; lv: Level; freq: string; quote: string; ing: string };
export type DrugInfo = { rows: AdrRow[]; loading: boolean; err: boolean; dets: { id: string; d: Detail }[] };

/** Frequency words only (the person asked for tiers, not percentages). */
const WORDS = ['매우 흔하게', '흔하지 않게', '매우 드물게', '흔하게', '때때로', '드물게'];
export const freqWord = (s: string) => WORDS.find(w => (s || '').includes(w)) || '';

export function drugInfo(f: Found, details: AppState['details'], D: Index | null, lang: string): DrugInfo {
  const dets: { id: string; d: Detail }[] = [];
  let loading = false, err = false;
  for (const id of f.ids) {
    const d = details[id];
    if (!d) loading = true; else if (d === 'err') err = true; else dets.push({ id, d });
  }
  const best: Record<string, AdrRow> = {};
  for (const { id, d } of dets) {
    for (const [pid, [lv, fr, q]] of Object.entries(d.adr || {})) {
      if (!best[pid] || lv > best[pid].lv) best[pid] = { pid, name: probName(D, pid, lang), lv, freq: freqWord(fr), quote: q, ing: f.ids.length > 1 ? ingName(id, lang) : '' };
    }
  }
  const rows = Object.values(best).sort((a, b) => b.lv - a.lv || a.name.localeCompare(b.name));
  return { rows, loading, err, dets };
}

export const topLevel = (rows: AdrRow[]): Level => (rows.length ? Math.max(...rows.map(r => r.lv)) : 1) as Level;
export const watchCount = (rows: AdrRow[]) => rows.filter(a => a.lv >= 4).length;
export const levelBadge = (lv: Level) => LV[lv];

const ORDER = ['금기', '용량 조절', '주의', '조절 불필요'];
const TAG_OF: Record<string, Tag> = { '금기': '금기', '용량 조절': '용량', '주의': '주의', '조절 불필요': '불필요' };
export type OrganView = { tag: Tag | null; lines: string[] };
export function organView(dets: { d: Detail }[], which: 'renal' | 'hepatic'): OrganView {
  let tag: string | null = null; const lines: string[] = [];
  for (const { d } of dets) {
    const o = d.organ?.[which];
    if (!o) continue;
    for (const t of o.t || []) if (tag === null || ORDER.indexOf(t) < ORDER.indexOf(tag)) tag = t;
    for (const [, x] of o.e || []) if (lines.length < 4 && !lines.includes(x)) lines.push(x);
  }
  return { tag: tag ? TAG_OF[tag] ?? '주의' : null, lines };
}

/** done = recorded today; open = inside the ±2 h window; early = before it; missed = window passed unrecorded. */
export type SlotState = 'done' | 'open' | 'early' | 'missed';
export type SlotView = { k: SlotKey; time: string; label: string; meds: Med[]; taken: boolean; remind: boolean; ss: SlotState; from: string; until: string };
export const toMin = (t: string) => { const [h, m] = String(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const fmtMin = (m: number) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const slotViews = (s: AppState, me: Member): SlotView[] => {
  const today = me.taken[todayKey()] || [];
  return SLOT_KEYS.map(k => {
    const time = s.times[k], tm = toMin(time), taken = today.includes(k), d = s.now - tm;
    const ss: SlotState = taken ? 'done' : d < -WINDOW_MIN ? 'early' : d > WINDOW_MIN ? 'missed' : 'open';
    return { k, label: SLOT_LABEL[k], time, meds: medsOn(me.meds, todayKey()).filter(m => m.slots.includes(k)), taken, remind: s.remind[k], ss, from: fmtMin(tm - WINDOW_MIN), until: fmtMin(tm + WINDOW_MIN) };
  }).sort((a, b) => a.time.localeCompare(b.time));
};

/** Stamp calendar for the current month: a stamp on each day every planned dose was recorded. */
/** `ends` = names of prescriptions whose last day is this day. */
export type StampDay = { d: number; kind: 'stamp' | 'today' | 'miss' | 'none' | 'future'; ends: string[] };
/** `y`/`mo` (0-based month) pick another month for the diary; the current month by default. */
export function stampMonth(me: Member, y = new Date().getFullYear(), mo = new Date().getMonth()): { days: StampDay[]; count: number; total: number; first: number; month: number; year: number; todayDone: boolean } {
  const tk = todayKey();
  const total = new Date(y, mo + 1, 0).getDate(), first = new Date(y, mo, 1).getDay();
  const plannedOn = (key: string) => SLOT_KEYS.filter(k => medsOn(me.meds, key).some(m => m.slots.includes(k)));
  const start = me.since || Object.keys(me.taken).sort()[0] || todayKey();
  const full = (key: string) => { const p = plannedOn(key); return p.length > 0 && p.every(k => (me.taken[key] || []).includes(k)); };
  let count = 0;
  const days: StampDay[] = [];
  for (let d = 1; d <= total; d++) {
    const key = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let kind: StampDay['kind'];
    if (key > tk) kind = 'future';
    else if (full(key)) kind = 'stamp';
    else if (key === tk) kind = 'today';
    else kind = key < start || !plannedOn(key).length ? 'none' : 'miss';
    if (kind === 'stamp') count++;
    days.push({ d, kind, ends: me.meds.filter(m => m.until === key).map(m => m.name) });
  }
  return { days, count, total, first, month: mo + 1, year: y, todayDone: full(todayKey()) };
}
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Share of planned doses marked as taken over the last `days` days (today included). */
export function adherence(me: Member, days: number): { pct: number | null; per: (number | null)[]; done: number; missed: number } {
  const per: (number | null)[] = []; let done = 0, total = 0;
  // Count only from the day medicines were first saved, so earlier days are not "missed".
  const start = me.since || Object.keys(me.taken).sort()[0] || todayKey();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const planned = SLOT_KEYS.filter(x => medsOn(me.meds, k).some(m => m.slots.includes(x)));
    if (!planned.length || k < start) { per.push(null); continue; }
    const n = (me.taken[k] || []).filter(x => planned.includes(x)).length;
    // Today counts only once something is recorded, so the morning does not read as "missed".
    if (i === 0 && n === 0) { per.push(null); continue; }
    per.push(Math.round((n / planned.length) * 100)); done += n; total += planned.length;
  }
  return { pct: total ? Math.round((done / total) * 100) : null, per, done, missed: total - done };
}

/** Badge color class for a medicine dot. */
export const trBadge = <B extends { t: string }>(b: B, L: (s: string) => string): B => ({ ...b, t: L(b.t) });
