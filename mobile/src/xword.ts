// Daily Korean crossword (십자말 퀴즈). Puzzles come from src/xwords.json, built by
// scripts/make_xwords.mjs from the word bank in scripts/xword_bank.mjs. One syllable per cell.
import RAW from './xwords.json';

export interface XWord { y: number; x: number; d: 'a' | 'd'; a: string; c: string; m?: 1 }
export interface XPuzzle { w: number; h: number; words: XWord[] }
/** A placed word with its clue number and the grid cells it covers. */
export interface XEntry extends XWord { no: number; cells: number[]; len: number }

export const XPUZZLES = RAW as XPuzzle[];
const KEY = 'mediscan.xword';

const daySeed = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayIdx = () => daySeed() % XPUZZLES.length;

/** Grid answer letters ('' for a blank square) and numbered entries in reading order. */
export function layout(p: XPuzzle) {
  const sol: string[] = Array(p.w * p.h).fill('');
  const starts = new Map<number, number>();
  const pos = (w: XWord, i: number) => (w.y + (w.d === 'd' ? i : 0)) * p.w + w.x + (w.d === 'a' ? i : 0);
  p.words.forEach(w => [...w.a].forEach((s, i) => { sol[pos(w, i)] = s; }));
  [...new Set(p.words.map(w => w.y * p.w + w.x))].sort((a, b) => a - b).forEach((c, i) => starts.set(c, i + 1));
  const entries: XEntry[] = p.words
    .map(w => ({ ...w, no: starts.get(w.y * p.w + w.x)!, len: [...w.a].length, cells: [...w.a].map((_, i) => pos(w, i)) }))
    .sort((a, b) => (a.d === b.d ? a.no - b.no : a.d === 'a' ? -1 : 1));
  return { sol, entries, starts };
}

export interface XState {
  idx: number; cells: string[]; hints: number; start: number; end: number;
  /** cells opened by a hint stay fixed */
  shown: number[];
}

export function xwNew(idx: number): XState {
  const p = XPUZZLES[((idx % XPUZZLES.length) + XPUZZLES.length) % XPUZZLES.length];
  return { idx: XPUZZLES.indexOf(p), cells: Array(p.w * p.h).fill(''), hints: 0, start: Date.now(), end: 0, shown: [] };
}

type Saved = { day: string; idx: number; cells: string[]; hints: number; shown: number[]; done: boolean; elapsed: number };

/** Today's progress: the same puzzle comes back until the date changes. */
export function xwRestore(): XState {
  try {
    const z = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null;
    if (z && z.day === dayKey() && XPUZZLES[z.idx] && Array.isArray(z.cells) && z.cells.length === XPUZZLES[z.idx].w * XPUZZLES[z.idx].h) {
      return { idx: z.idx, cells: z.cells, hints: z.hints || 0, shown: z.shown || [], start: Date.now() - (z.elapsed || 0), end: z.done ? Date.now() : 0 };
    }
  } catch { /* ignore */ }
  return xwNew(todayIdx());
}

export function xwSave(z: XState) {
  const out: Saved = { day: dayKey(), idx: z.idx, cells: z.cells, hints: z.hints, shown: z.shown, done: !!z.end, elapsed: (z.end || Date.now()) - z.start };
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* ignore */ }
}

/** Only whole Hangul syllables count; spaces and stray jamo are dropped. */
export const syllables = (t: string) => [...t.normalize('NFC')].filter(ch => /[가-힣]/.test(ch));
