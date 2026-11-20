// Builds src/xwords.json: a fixed set of small Korean crosswords (one syllable per cell) from the
// word bank in xword_bank.mjs. Run: node scripts/make_xwords.mjs
// Each puzzle is checked so that every run of two or more letters in the grid is one of its words,
// all words are connected, and no word repeats inside a puzzle.
import { writeFileSync } from 'node:fs';
import { BANK } from './xword_bank.mjs';

const SIZE = 7, COUNT = 60, MIN_WORDS = 7, MAX_WORDS = 9, MIN_MED = 3;
const words = BANK.map(([t, w, c]) => ({ t, w: [...w], c, k: w }));
const bySyl = new Map();
for (const o of words) o.w.forEach((ch, i) => { if (!bySyl.has(ch)) bySyl.set(ch, []); bySyl.get(ch).push([o, i]); });
{
  const seen = new Set();
  for (const x of words) {
    const k = x.w.join('');
    if (seen.has(k)) throw new Error('duplicate word ' + k);
    seen.add(k);
    if (!/^[가-힣]+$/.test(k)) throw new Error('not hangul ' + k);
    if (x.w.length < 2 || x.w.length > SIZE) throw new Error('bad length ' + k);
  }
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function build(seed, use) {
  const r = rng(seed);
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
  const at = (y, x) => (y < 0 || x < 0 || y >= SIZE || x >= SIZE ? '' : g[y][x]);
  const placed = [];
  const used = new Set();
  const pool = shuffle(words.slice(), r);

  const fits = (w, y, x, d) => {
    const dy = d === 'd' ? 1 : 0, dx = d === 'a' ? 1 : 0;
    const L = w.length;
    if (y < 0 || x < 0 || y + dy * (L - 1) >= SIZE || x + dx * (L - 1) >= SIZE) return -1;
    if (at(y - dy, x - dx) || at(y + dy * L, x + dx * L)) return -1;
    let cross = 0;
    for (let i = 0; i < L; i++) {
      const cy = y + dy * i, cx = x + dx * i, v = g[cy][cx];
      if (v) { if (v !== w[i]) return -1; cross++; continue; }
      // a new letter must not touch other letters side-on
      if (at(cy + dx, cx + dy) || at(cy - dx, cx - dy)) return -1;
    }
    return cross === L ? -1 : cross;
  };
  const put = (o, y, x, d) => {
    const dy = d === 'd' ? 1 : 0, dx = d === 'a' ? 1 : 0;
    o.w.forEach((s, i) => { g[y + dy * i][x + dx * i] = s; });
    placed.push({ y, x, d, w: o.w.join(''), c: o.c, t: o.t });
    used.add(o.w.join(''));
  };

  const first = pool.find(o => o.t === 'm' && o.w.length >= 3 && o.w.length <= 5 && (use.get(o.k) || 0) < 4);
  const fy = Math.floor(SIZE / 2) - 1 + Math.floor(r() * 3), fx = Math.floor((SIZE - first.w.length) / 2);
  put(first, fy, fx, 'a');

  for (let round = 0; round < MAX_WORDS - 1; round++) {
    let best = null;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const ch = g[y][x];
      if (!ch) continue;
      for (const [o, i] of bySyl.get(ch) || []) {
        const k = o.k;
        if (used.has(k)) continue;
        // skip words that contain or are contained by a placed word (too easy / ambiguous)
        if (placed.some(p => p.w.includes(k) || k.includes(p.w))) continue;
        for (const d of ['a', 'd']) {
          const sy = d === 'd' ? y - i : y, sx = d === 'a' ? x - i : x;
          const c = fits(o.w, sy, sx, d);
          if (c < 1) continue;
          const sc = c * 10 + o.w.length + (o.t === 'm' ? 3 : 0) + r() * 6 - (use.get(k) || 0) * 2;
          if (!best || sc > best.sc) best = { o, y: sy, x: sx, d, sc };
        }
      }
    }
    if (!best) break;
    put(best.o, best.y, best.x, best.d);
  }
  return { g, placed };
}

// every horizontal/vertical run of length >= 2 must be a placed word
function check(g, placed) {
  const set = new Set(placed.map(p => `${p.d}${p.y},${p.x}:${p.w}`));
  let n = 0;
  for (const d of ['a', 'd']) for (let i = 0; i < SIZE; i++) {
    let j = 0;
    while (j < SIZE) {
      const v = (k) => (d === 'a' ? g[i][k] : g[k][i]);
      if (!v(j)) { j++; continue; }
      let e = j; let s = '';
      while (e < SIZE && v(e)) { s += v(e); e++; }
      if (e - j >= 2) {
        const key = d === 'a' ? `a${i},${j}:${s}` : `d${j},${i}:${s}`;
        if (!set.has(key)) return false;
        n++;
      }
      j = e;
    }
  }
  return n === placed.length;
}

const use = new Map();
const out = [];
for (let n = 0; n < COUNT; n++) {
  let pick = null;
  for (let k = 0; k < 1500; k++) {
    const seed = n * 10000 + k + 1;
    const { g, placed } = build(seed, use);
    const med = placed.filter(p => p.t === 'm').length;
    if (placed.length < MIN_WORDS || med < MIN_MED) continue;
    // the same word may come back, but not in more than 6 of the puzzles
    if (placed.some(p => (use.get(p.w) || 0) >= 6)) continue;
    let y0 = SIZE, y1 = 0, x0 = SIZE, x1 = 0;
    g.forEach((row, y) => row.forEach((v, x) => { if (v) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } }));
    const h = y1 - y0 + 1, w = x1 - x0 + 1;
    if (h < 5 || w < 5) continue;
    const sc = placed.length * 3 + med - placed.reduce((s, p) => s + (use.get(p.w) || 0), 0);
    if (!pick || sc > pick.sc) pick = { g, placed, sc, y0, x0, h, w };
  }
  if (!pick) throw new Error('no puzzle for #' + n);
  const { g, placed, y0, x0, h, w } = pick;
  if (!check(g, placed)) throw new Error('grid check failed for #' + n);
  placed.forEach(p => use.set(p.w, (use.get(p.w) || 0) + 1));
  out.push({
    w, h,
    words: placed.map(p => ({ y: p.y - y0, x: p.x - x0, d: p.d, a: p.w, c: p.c, ...(p.t === 'm' ? { m: 1 } : {}) })),
  });
}
if (out.length < COUNT) throw new Error('only ' + out.length + ' puzzles');
writeFileSync(new URL('../src/xwords.json', import.meta.url), JSON.stringify(out) + '\n');
const avg = out.reduce((s, p) => s + p.words.length, 0) / out.length;
console.log(`${out.length} puzzles, avg ${avg.toFixed(1)} words, ${use.size} distinct words of ${words.length}`);
for (const p of out.slice(0, 2)) {
  const G = Array.from({ length: p.h }, () => Array(p.w).fill('□'));
  p.words.forEach(o => [...o.a].forEach((s, i) => { G[o.y + (o.d === 'd' ? i : 0)][o.x + (o.d === 'a' ? i : 0)] = s; }));
  console.log(G.map(r => r.join('')).join('\n') + '\n' + p.words.map(o => o.a).join(' ') + '\n');
}
