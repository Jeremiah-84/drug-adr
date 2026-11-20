import { useEffect, useState } from 'react';

/** Hidden diagnostics: tap the version line in 마이 to turn on. A small box at the top of every
 *  screen (just above the tab bar) then shows where the page, the app frame and the scroll box sit, so a screenshot tells
 *  us why a screen looks cut off. Tap the version line again to turn it off; the box itself lets
 *  taps through. */
const KEY = 'mediscan.diag';
export const diagOn = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const toggleDiag = () => {
  try { localStorage.setItem(KEY, diagOn() ? '0' : '1'); } catch { /* ignore */ }
  dispatchEvent(new Event('ms-diag'));
};

const r = (n: number) => Math.round(n * 10) / 10;
function read(): string {
  const de = document.documentElement, b = document.body, vv = window.visualViewport;
  const ph = document.querySelector('.ms-phone') as HTMLElement | null;
  const sc = document.querySelector('.ms-scroll') as HTMLElement | null;
  const v = document.querySelector('.ms-view') as HTMLElement | null;
  const f = v?.firstElementChild as HTMLElement | null;
  const top = (e: Element | null) => (e ? r(e.getBoundingClientRect().top) : '-');
  const h = (e: Element | null) => (e ? r(e.getBoundingClientRect().height) : '-');
  const cs = v ? getComputedStyle(v) : null;
  return [
    `win ${innerWidth}x${innerHeight} sY ${r(scrollY)} de ${de.scrollTop} b ${b.scrollTop} dpr ${devicePixelRatio}`,
    `vv ${vv ? `${r(vv.width)}x${r(vv.height)} s${r(vv.scale)} oT ${r(vv.offsetTop)} pT ${r(vv.pageTop)}` : '-'}`,
    `phone t ${top(ph)} h ${h(ph)} st ${ph?.scrollTop ?? '-'}`,
    `scroll t ${top(sc)} h ${h(sc)} st ${sc?.scrollTop ?? '-'} sh ${sc?.scrollHeight ?? '-'}`,
    `view t ${top(v)} page t ${top(f)} ${cs ? `tf ${cs.transform} op ${cs.opacity} z ${cs.zoom}` : ''}`,
    `cls ${v?.className ?? '-'} txt ${de.dataset.text ?? '-'} ${de.className} hist ${history.length} ${location.hash}`,
  ].join('\n');
}

export function Diag() {
  const [on, setOn] = useState(diagOn);
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const f = () => setOn(diagOn());
    addEventListener('ms-diag', f);
    return () => removeEventListener('ms-diag', f);
  }, []);
  useEffect(() => {
    if (!on) return;
    const tick = () => setTxt(read());
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [on]);
  if (!on) return null;
  return (
    <pre aria-hidden="true"
      style={{ position: 'fixed', left: 4, right: 4, bottom: 'calc(var(--ms-nav-h) + 4px)', zIndex: 9999, margin: 0, padding: 6, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(0,0,0,.78)', color: '#9f9', fontFamily: 'monospace', borderRadius: 6, pointerEvents: 'none' }}>
      {txt}
    </pre>
  );
}
