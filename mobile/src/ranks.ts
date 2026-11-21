// On-device top-5 records for the puzzle games. Nothing leaves the phone.
// Fewer hints rank higher (no hints first), then the faster time.
export type Board = 'sdk6' | 'sdk9' | 'xw';
export interface Rec { t: number; h: number; at: number; id: string }

const KEY = 'mediscan.ranks';
const TOP = 5;
type Saved = { b: Partial<Record<Board, Rec[]>>; ids: string[] };

function load(): Saved {
  try {
    const z = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null;
    if (z && typeof z === 'object' && z.b && Array.isArray(z.ids)) return z;
  } catch { /* ignore */ }
  return { b: {}, ids: [] };
}
function save(z: Saved) { try { localStorage.setItem(KEY, JSON.stringify(z)); } catch { /* ignore */ } }

export const better = (a: Rec, b: Rec) => a.h - b.h || a.t - b.t || a.at - b.at;
export const ranks = (b: Board): Rec[] => (load().b[b] || []).slice().sort(better).slice(0, TOP);

/** Records one finished puzzle once (the id stops the same game counting twice).
 *  Returns the place it took (1–5), 0 if it did not make the top 5, or -1 if already counted. */
export function record(b: Board, id: string, secs: number, hints: number): number {
  const z = load();
  if (z.ids.includes(id)) return -1;
  const r: Rec = { t: Math.max(1, Math.round(secs)), h: hints, at: Date.now(), id };
  const list = [...(z.b[b] || []), r].sort(better).slice(0, TOP);
  z.b[b] = list;
  z.ids = [...z.ids, id].slice(-60);
  save(z);
  return list.indexOf(r) + 1;
}
/** Place an already-counted game holds now (0 when it has dropped out). */
export const placeOf = (b: Board, id: string) => ranks(b).findIndex(r => r.id === id) + 1;

export function clearRanks(b: Board) { const z = load(); delete z.b[b]; save(z); }

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
