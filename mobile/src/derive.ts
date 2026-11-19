import { DRUGS, LV, SLOTS, type Drug, type DrugId, type Level, type SlotKey } from './data';
import type { AppState } from './state';

export type DrugView = Drug & { id: DrugId };
export const drugView = (id: DrugId): DrugView => ({ ...DRUGS[id], id });

export type SlotView = { k: SlotKey; time: string; label: string; drugs: DrugView[]; taken: boolean; remind: boolean };

export const slotViews = (s: AppState): SlotView[] =>
  SLOTS.map(x => ({ k: x.k, label: x.label, time: s.times[x.k], drugs: x.drugs.map(drugView), taken: s.taken[x.k], remind: s.remind[x.k] }));

export const topLevel = (d: Drug): Level => Math.max(...d.adr.map(a => a[1])) as Level;
export const watchCount = (d: Drug) => d.adr.filter(a => a[1] >= 3).length;
export const levelBadge = (lv: Level) => LV[lv];

/** Copy a status badge with its label translated. */
export const trBadge = <B extends { t: string }>(b: B, L: (s: string) => string): B => ({ ...b, t: L(b.t) });
