// Real data layer: the same files the web app and the Chrome extension use (docs/data, docs/vendor).
// Everything runs on this device. Photos are read here and never uploaded.
import { ALIAS_EN, ALIAS_KO, PROB_EN } from './probs';
import type { Level } from './data';

const DATA = '../data/';
const VENDOR = '../vendor/';

export type IndexDrug = { id: string; ko: string; en: string; brand?: string; seq?: string; form?: string[]; p?: string[] };
export type Problem = { id: string; category: string; name: string; alias?: string[] };
export type Index = { version: string; drugs: IndexDrug[]; problems: Problem[]; products: Record<string, string[]>; pform: Record<string, string> };
/** adr[problemId] = [level, frequency text, quote from the label] */
export type Detail = {
  product: string; date: string; seq: string;
  adr: Record<string, [Level, string, string]>;
  organ?: { renal?: { t: string[]; e: [string, string][] }; hepatic?: { t: string[]; e: [string, string][] } };
};

export const norm = (s: string) => String(s || '').toLowerCase().replace(/\s+/g, '');

let indexP: Promise<Index> | null = null;
let byId: Record<string, IndexDrug> = {};
let prods: { name: string; n: string; ids: string[]; form: string[] | null }[] = [];

export function loadIndex(): Promise<Index> {
  if (!indexP) {
    indexP = fetch(DATA + 'index.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((D: Index) => {
      byId = Object.fromEntries(D.drugs.map(d => [d.id, d]));
      prods = Object.entries(D.products || {}).map(([name, ids]) => ({ name, n: norm(name), ids, form: D.pform?.[name] ? D.pform[name].split('·') : null }));
      for (const p of D.problems) {
        const a = (ALIAS_KO[p.id] || '').split(',').concat((ALIAS_EN[p.id] || '').split(',')).filter(Boolean);
        a.push(...p.name.split(/[·(),\s]+/).filter(x => x.length >= 2));
        a.push(...(PROB_EN[p.id] || '').toLowerCase().split(/[/(),]+/).map(x => x.trim()).filter(x => x.length >= 3));
        p.alias = [...new Set(a.map(norm))];
      }
      return D;
    });
    indexP.catch(() => { indexP = null; });
  }
  return indexP;
}

export const drugById = (id: string): IndexDrug | undefined => byId[id];

const details: Record<string, Promise<Detail>> = {};
export function loadDetail(id: string): Promise<Detail> {
  if (!details[id]) {
    details[id] = fetch(DATA + 'd/' + encodeURIComponent(detailFile(id)) + '.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    details[id].catch(() => { delete details[id]; });
  }
  return details[id];
}

/** Detail files are named by the index entry's `f` field. */
export function detailFile(id: string) { const d = byId[id] as IndexDrug & { f?: string }; return d?.f || id; }

export type Hit = { key: string; label: string; sub: string; ids: string[] };

/** Type-ahead search over ingredient names (ko/en/brand) and ~20k product names. */
export function search(q: string, lang: string): Hit[] {
  const t = norm(q);
  if (!t) return [];
  const en = lang !== 'ko';
  const ing: Hit[] = Object.values(byId).filter(d => [d.ko, d.en, d.brand].some(x => x && norm(x).includes(t)))
    .slice(0, 8).map(d => ({ key: 'i:' + d.id, label: en && d.en ? cap(d.en) : d.ko, sub: (en ? d.ko : d.en) + (d.brand ? ' · ' + d.brand : ''), ids: [d.id] }));
  const pr: Hit[] = t.length >= 2 ? prods.filter(p => p.n.startsWith(t) || (t.length >= 3 && p.n.includes(t))).slice(0, 12)
    .map(p => ({ key: 'p:' + p.name, label: p.name, sub: p.ids.map(i => ingName(i, lang)).join(' + '), ids: p.ids })) : [];
  return [...ing, ...pr].slice(0, 14);
}

export const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
export const ingName = (id: string, lang: string) => { const d = byId[id]; if (!d) return id; return lang !== 'ko' && d.en ? cap(d.en) : d.ko; };

// --- Find drug names inside free text (OCR of a prescription or pill bag). Same rules as the web app.
const SUF: Record<string, RegExp> = {
  주사: /^[가-힣]{0,6}?(주사|주(?![가-힣])|수액)/,
  외용: /^[가-힣]{0,6}?(연고|크림|겔|로션|패취|패치|플라스타|점안|점비|점이|좌제|외용|스프레이|흡입)/,
  경구: /^[가-힣]{0,6}?(정|캡슐|캅셀|서방|시럽|산|과립|현탁|액|츄|엘릭서|환)/,
};
const FORMS = ['경구', '외용'];
const formOk = (fs?: string[] | null) => (fs && fs.length ? fs : ['경구']).map(x => (x === '기타' ? '주사' : x)).some(x => FORMS.includes(x));
const formAt = (t: string, i: number, len: number) => { const after = t.slice(i + len, i + len + 12); for (const f of ['주사', '외용', '경구']) if (SUF[f].test(after)) return f; return null; };
function hitKey(t: string, k: string, forms: string[] | null | undefined, needSuf: boolean) {
  let i = t.indexOf(k);
  while (i >= 0) { const f = formAt(t, i, k.length); if (f ? FORMS.includes(f) : (!needSuf && formOk(forms))) return true; i = t.indexOf(k, i + 1); }
  return false;
}

/** `times` = doses a day and `days` = days supplied, when a prescription or pill bag shows them. */
export type Found = { name: string; ids: string[]; times?: number; days?: number };
/** Returns products found in the text (product name kept for display), falling back to ingredient names. */
export function findInText(text: string): Found[] {
  const t = norm(text), out: Found[] = [], seen = new Set<string>();
  // Longest product names first so "타이레놀8시간이알서방정" wins over "타이레놀".
  for (const p of [...prods].sort((a, b) => b.n.length - a.n.length)) {
    if (!formOk(p.form)) continue;
    if (hitKey(t, p.n, p.form, p.n.length < 3)) {
      const key = p.ids.join('+');
      if (seen.has(key)) continue;
      seen.add(key); p.ids.forEach(i => seen.add(i)); out.push({ name: p.name, ids: p.ids });
    }
  }
  for (const d of Object.values(byId)) {
    if (seen.has(d.id) || !formOk(d.form)) continue;
    const keys = [d.ko, d.en, d.brand].filter(Boolean).map(x => norm(x!).replace(/\(.*$/, '')).filter(k => k.length >= 3 || (k.length === 2 && /[가-힣]/.test(k)));
    if (keys.some(k => hitKey(t, k, d.form, k.length < 3))) { seen.add(d.id); out.push({ name: d.ko, ids: [d.id] }); }
  }
  return out;
}

const KNUM: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4 };
const isInt = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi;
/**
 * Read "doses a day" and "days supplied" for each medicine found in a prescription or pill bag.
 * A prescription row reads "<name> <dose> <times a day> <days>", so the last three numbers on the
 * medicine's line are used when they make sense. Otherwise a line such as "1일 3회 · 7일분" or
 * "하루 세 번" anywhere on the paper (usual on pill bags) applies to every medicine.
 * Nothing is guessed: if the numbers are not clear, the medicine is left without them.
 */
export function readDosing(text: string, found: Found[]): Found[] {
  const raw = String(text || '');
  const lines = raw.split(/\n+/);
  const strip = (l: string) => l.replace(/\d+(?:[.,]\d+)?\s*(?:mg|밀리그램|㎎|mcg|μg|그램|g|ml|㎖|밀리리터|%|IU|단위)/gi, ' ');
  const flat = raw.replace(/\s+/g, '');
  let gTimes: number | undefined, gDays: number | undefined;
  const t1 = flat.match(/(?:1|한)일(\d)(?:회|번)/) || flat.match(/하루(\d|한|두|세|네)(?:번|회)/);
  if (t1) { const v = KNUM[t1[1]] ?? +t1[1]; if (isInt(v, 1, 4)) gTimes = v; }
  const d1 = flat.match(/(\d{1,3})일분/) || flat.match(/(?:투약|복용|투여)일수[:：]?(\d{1,3})(?!\d)/) || flat.match(/(\d{1,3})일간/);
  if (d1 && isInt(+d1[1], 1, 180)) gDays = +d1[1];
  return found.map(f => {
    const keys = [f.name, ...f.ids.map(i => byId[i]?.ko || '')].map(k => norm(k).replace(/\(.*$/, '').slice(0, 5)).filter(k => k.length >= 2);
    let times: number | undefined, days: number | undefined;
    for (const l of lines) {
      if (!keys.some(k => norm(l).includes(k))) continue;
      const nums = (strip(l).match(/\d+(?:\.\d+)?/g) || []).map(Number);
      if (nums.length < 3) continue;
      const [dose, tm, dy] = nums.slice(-3);
      if (dose > 0 && dose <= 10 && isInt(tm, 1, 4) && isInt(dy, 1, 180)) { times = tm; days = dy; break; }
    }
    times = times ?? gTimes; days = days ?? gDays;
    return { ...f, ...(times ? { times } : {}), ...(days ? { days } : {}) };
  });
}

/** Match a typed symptom ("다리가 부어요", "eGFR 감소", "drowsy") to problem ids, best first. */
export function matchProblems(D: Index, text: string): string[] {
  const t = norm(text);
  if (!t) return [];
  const sc: [number, string][] = [];
  for (const p of D.problems) {
    let best = 0;
    for (const a of p.alias || []) {
      if (a.length < 2 && a !== t) continue;
      if (t === a) best = Math.max(best, 100); else if (t.includes(a)) best = Math.max(best, 50 + a.length); else if (a.startsWith(t) && t.length >= 2) best = Math.max(best, 30 + t.length);
    }
    if (best) sc.push([best, p.id]);
  }
  return sc.sort((a, b) => b[0] - a[0]).slice(0, 5).map(x => x[1]);
}

export const probName = (D: Index | null, id: string, lang: string) => {
  if (lang !== 'ko' && PROB_EN[id]) return PROB_EN[id];
  return D?.problems.find(p => p.id === id)?.name || id;
};

// --- Camera helpers -------------------------------------------------------------------------

const loadScript = (src: string) => new Promise<void>((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => no(new Error(src)); document.head.appendChild(s); });
const here = (p: string) => new URL(p, location.href).href;

type Src = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
async function decode(file: Blob): Promise<Src> {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = URL.createObjectURL(file); }); }
}
/** Grey, slightly contrasted copy of the picture whose long side is `max` px (shrinks or grows). */
function sized(src: Src, max: number, grow = false): HTMLCanvasElement {
  const w0 = src.width, h0 = src.height, k0 = max / Math.max(w0, h0), k = grow ? k0 : Math.min(1, k0), c = document.createElement('canvas');
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  const g = c.getContext('2d')!; g.filter = 'grayscale(1) contrast(1.3)'; g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
export async function photoCanvas(file: Blob, max: number): Promise<HTMLCanvasElement> {
  return sized(await decode(file), max);
}

type TessWorker = { recognize: (img: HTMLCanvasElement) => Promise<{ data: { text: string; confidence: number } }>; setParameters: (p: Record<string, string>) => Promise<unknown> };
let ocrW: Promise<TessWorker> | null = null;
let ocrProg: (p: number) => void = () => {};
function ocrWorker(): Promise<TessWorker> {
  if (!ocrW) {
    ocrW = (async () => {
      const w = window as unknown as { Tesseract?: { createWorker: (...a: unknown[]) => Promise<TessWorker> } };
      if (!w.Tesseract) await loadScript(VENDOR + 'ocr/tesseract.min.js');
      // Korean only: product names on prescriptions and pill bags are Korean, and leaving out
      // the English model makes loading and reading noticeably quicker.
      const wk = await w.Tesseract!.createWorker(['kor'], 1, {
        workerPath: here(VENDOR + 'ocr/worker.min.js'), corePath: here(VENDOR + 'ocr/'), langPath: here(VENDOR + 'ocr/'), gzip: true,
        logger: (m: { status: string; progress?: number }) => { if (m.status === 'recognizing text') ocrProg(Math.round((m.progress || 0) * 100)); },
      });
      // Automatic page layout (Tesseract's mode 3). tesseract.js defaults to "one block of text",
      // which loses most lines of a prescription table.
      await wk.setParameters({ tessedit_pageseg_mode: '3' });
      return wk;
    })();
    ocrW.catch(() => { ocrW = null; });
  }
  return ocrW;
}
/** Start loading the text reader early (camera screen opened, photo picker opened). */
export const warmOcr = () => { ocrWorker().catch(() => {}); };

/**
 * Read the text in a photo (prescription, pill bag) on this device.
 * Tesseract reads best when letters are about 20 px tall, which depends on how close the photo was
 * taken. The first pass uses the size that suits a normal photo of a prescription; only when that
 * pass is unsure (low confidence or no medicine found) are larger and smaller copies tried, and the
 * best reading wins.
 */
export async function ocr(img: Blob | HTMLCanvasElement, onProgress: (p: number) => void, score: (text: string) => number = () => 1): Promise<string> {
  const w = await ocrWorker();
  ocrProg = onProgress;
  const src = img instanceof HTMLCanvasElement ? img : await decode(img);
  const long = Math.max(src.width, src.height);
  const sizes = [Math.min(long, 1700), long > 2000 ? 2400 : Math.min(2400, Math.round(long * 1.4)), 1150].filter((v, i, a) => a.indexOf(v) === i);
  let best = { text: '', s: -1, conf: -1 };
  for (const [i, size] of sizes.entries()) {
    const { data } = await w.recognize(sized(src, size, i === 1));
    const text = (data && data.text) || '', conf = data?.confidence || 0, s = score(text);
    if (s > best.s || (s === best.s && conf > best.conf)) best = { text, s, conf };
    if (s > 0 && conf >= 86) break;
  }
  return best.text;
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
let det: Promise<Detector> | null = null;
export function barcodeDetector(): Promise<Detector> {
  if (!det) {
    det = (async () => {
      const formats = ['ean_13', 'data_matrix', 'code_128'];
      const W = window as unknown as { BarcodeDetector?: { new(o: unknown): Detector; getSupportedFormats: () => Promise<string[]> }; BarcodeDetectionAPI?: { prepareZXingModule: (o: unknown) => void; BarcodeDetector: new (o: unknown) => Detector } };
      if (W.BarcodeDetector) {
        try { const f = await W.BarcodeDetector.getSupportedFormats(); if (f.includes('ean_13') && f.includes('data_matrix')) return new W.BarcodeDetector({ formats }); } catch { /* fall through to the ponyfill */ }
      }
      if (!W.BarcodeDetectionAPI) await loadScript(VENDOR + 'barcode/ponyfill.js');
      const A = W.BarcodeDetectionAPI!;
      A.prepareZXingModule({ overrides: { locateFile: (p: string, pre: string) => (p.endsWith('.wasm') ? here(VENDOR + 'barcode/' + p) : pre + p) } });
      return new A.BarcodeDetector({ formats });
    })();
    det.catch(() => { det = null; });
  }
  return det;
}

/** Korean drug standard code: 880 + company(4) + item(4) + pack(1) + check(1). GS1 DataMatrix carries it after (01). */
export function code13(raw: string): string | null {
  const s = String(raw || '').replace(/\D/g, '');
  if (/^01\d{14}/.test(s) && s.slice(3, 6) === '880') return s.slice(3, 16);
  if (/^880\d{10}$/.test(s)) return s;
  const m = s.match(/880\d{10}/);
  return m ? m[0] : null;
}

let BC: Promise<Record<string, string | string[]>> | null = null;
export async function lookupBarcode(code: string): Promise<Found | null> {
  if (!BC) { BC = fetch(DATA + 'barcode.json').then(r => r.json()).then(j => j.m || {}); BC.catch(() => { BC = null; }); }
  const [m, D] = await Promise.all([BC, loadIndex()]);
  const v = m[code.slice(3, 11)];
  if (!v) return null;
  if (Array.isArray(v)) return { name: v.map(i => ingName(i, 'ko')).join('·'), ids: v };
  const ids = D.products[v];
  return ids && ids.length ? { name: v, ids } : null;
}

// --- Pill identification (MFDS 낱알식별 data) -----------------------------------------------
// r: [product, imprint front, imprint back, shape, color1, color2, form, ?, item seq, company]
export type PillRow = [string, string, string, string, string, string, string, unknown, string, string];
let PILLS: Promise<{ img: string; r: PillRow[] }> | null = null;
export function loadPills() {
  if (!PILLS) { PILLS = fetch(DATA + 'pills.json').then(r => r.json()); PILLS.catch(() => { PILLS = null; }); }
  return PILLS;
}
const pnorm = (s: string) => norm(s).replace(/[^0-9a-z가-힣]/g, '');
export async function pillSearch(q: { imprint: string; shape: string; color: string }): Promise<PillRow[]> {
  const P = await loadPills();
  const t = pnorm(q.imprint);
  const out = P.r.filter(r =>
    (!q.shape || r[3] === q.shape) && (!q.color || (r[4] + ',' + r[5]).includes(q.color)) &&
    (!t || pnorm(r[1]).includes(t) || pnorm(r[2]).includes(t) || pnorm(r[1] + r[2]).includes(t) || pnorm(r[2] + r[1]).includes(t)));
  // Exact imprint first, then pills we have ingredient data for.
  const exact = (r: PillRow) => (t && (pnorm(r[1]) === t || pnorm(r[2]) === t) ? 0 : 1);
  const has = (r: PillRow) => (r[7] ? 0 : 1);
  return out.sort((a, b) => exact(a) - exact(b) || has(a) - has(b)).slice(0, 40);
}

/** Ingredient ids for a pill row: r[7] holds either the ids or a product name from the index. */
export async function pillToFound(r: PillRow): Promise<Found | null> {
  const D = await loadIndex();
  const v = r[7] as string[] | string | 0;
  const ids = Array.isArray(v) ? v : v ? D.products[v] || [] : [];
  return ids.length ? { name: r[0], ids } : null;
}

export const nedrugLink = (seq: string) => `https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${seq}`;
