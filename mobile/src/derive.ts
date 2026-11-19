import { LV, SLOT_KEYS, SLOT_LABEL, type Level, type SlotKey, type Tag } from './data';
import type { AppState, Med, Member } from './state';
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

export type SlotView = { k: SlotKey; time: string; label: string; meds: Med[]; taken: boolean; remind: boolean };
export const slotViews = (s: AppState, me: Member): SlotView[] => {
  const today = me.taken[todayKey()] || [];
  return SLOT_KEYS.map(k => ({ k, label: SLOT_LABEL[k], time: s.times[k], meds: me.meds.filter(m => m.slots.includes(k)), taken: today.includes(k), remind: s.remind[k] }))
    .sort((a, b) => a.time.localeCompare(b.time));
};
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Share of planned doses marked as taken over the last `days` days (today included). */
export function adherence(me: Member, days: number): { pct: number | null; per: (number | null)[]; done: number; missed: number } {
  const planned = SLOT_KEYS.filter(k => me.meds.some(m => m.slots.includes(k)));
  const per: (number | null)[] = []; let done = 0, total = 0;
  // Count only from the day medicines were first saved, so earlier days are not "missed".
  const start = me.since || Object.keys(me.taken).sort()[0] || todayKey();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
