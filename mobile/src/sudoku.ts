export type SdkSize = 6 | 9;
export const SDK_DEF: Record<SdkSize, { bh: number; bw: number; remove: number }> = {
  6: { bh: 2, bw: 3, remove: 16 },
  9: { bh: 3, bw: 3, remove: 42 },
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(a: T[], r: () => number) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const range = (n: number) => [...Array(n).keys()];

export function sdkValid(c: number[], n: SdkSize) {
  const { bh, bw } = SDK_DEF[n];
  const seen = new Set<string>();
  for (let i = 0; i < n * n; i++) {
    const y = Math.floor(i / n), x = i % n, v = c[i];
    for (const k of ['r' + y + v, 'c' + x + v, 'b' + Math.floor(y / bh) + Math.floor(x / bw) + v]) {
      if (seen.has(k)) return false;
      seen.add(k);
    }
  }
  return true;
}

export function makeSudoku(n: SdkSize, seed: number) {
  const { bh, bw, remove } = SDK_DEF[n];
  const r = rng(seed * 7919 + n);
  const base = (y: number, x: number) => (bw * (y % bh) + Math.floor(y / bh) + x) % n;
  const rows = shuffle(range(n / bh), r).flatMap(b => shuffle(range(bh), r).map(i => b * bh + i));
  const cols = shuffle(range(n / bw), r).flatMap(b => shuffle(range(bw), r).map(i => b * bw + i));
  const digits = shuffle(range(n).map(i => i + 1), r);
  const sol: number[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) sol.push(digits[base(rows[y], cols[x])]);
  const given = sol.slice();
  shuffle(range(n * n), r).slice(0, remove).forEach(i => { given[i] = 0; });
  return { sol, given };
}

export interface SdkState {
  n: SdkSize; seed: number; sol: number[]; given: number[]; cells: number[];
  sel: number; hints: number; start: number; end: number;
}

export function sdkLoad(n: SdkSize, seed: number): SdkState {
  const p = makeSudoku(n, seed);
  return { n, seed, sol: p.sol, given: p.given, cells: p.given.slice(), sel: -1, hints: 0, start: Date.now(), end: 0 };
}

export function sdkConflicts(z: SdkState) {
  const { n } = z, { bh, bw } = SDK_DEF[n];
  const out = new Set<number>();
  for (let i = 0; i < n * n; i++) {
    const v = z.cells[i];
    if (!v) continue;
    const y = Math.floor(i / n), x = i % n;
    for (let j = 0; j < n * n; j++) {
      if (j === i || z.cells[j] !== v) continue;
      const y2 = Math.floor(j / n), x2 = j % n;
      if (y2 === y || x2 === x || (Math.floor(y2 / bh) === Math.floor(y / bh) && Math.floor(x2 / bw) === Math.floor(x / bw))) {
        out.add(i);
        break;
      }
    }
  }
  return out;
}
