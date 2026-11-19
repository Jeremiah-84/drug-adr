import { LANGS, type Lang } from './i18n';

export const SCREENS = ['home', 'scan', 'scanning', 'results', 'detail', 'symptom', 'schedule', 'vitals', 'history', 'report', 'search', 'pill', 'my', 'family', 'pharmacy'] as const;
export type Screen = (typeof SCREENS)[number];

/**
 * Launch options — the prototype's "Tweaks" panel, as URL query parameters:
 *   ?lang=ko|en|zh|ja   starting language (default ko)
 *   ?splash=0           skip the quote splash on load
 *   ?quote=0..9         force a specific quote (default: one per day)
 *   ?screen=<name>      open a screen directly (home, scan, results, detail, …)
 */
const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const num = (v: string | null, lo: number, hi: number, d: number) => {
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const lang = q.get('lang') as Lang | null;
const screen = q.get('screen') as Screen | null;

export const config = {
  lang: lang && LANGS.includes(lang) ? lang : ('ko' as Lang),
  splash: q.get('splash') !== '0',
  quoteIndex: Math.round(num(q.get('quote'), -1, 9, -1)),
  screen: screen && SCREENS.includes(screen) && screen !== 'scanning' ? screen : ('home' as Screen),
};
