import { useEffect, useRef, useState } from 'react';
import type { Quote } from './data';

type Props = { quote: Quote; dateStr: string; cjk: boolean; skip: string; sub: string; onDone: () => void };

const SERIF = '"Noto Serif KR", "Noto Serif JP", "Noto Serif SC", serif';
const SANS = '"Noto Sans KR", "Noto Sans JP", "Noto Sans SC", sans-serif';
const DISPLAY = '"Cormorant Garamond", serif';

// Timeline (ms): fade in → hold → wind sweeps the line into gold dust → brand → done.
const T_IN = 1400, T_WIND = 3600, T_SWEEP = 2100, T_BRAND = 6600, T_END = 8400;

type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; r: number; g: number; b: number; a: number; life: number; dec: number; on: boolean; s: number; ph: number; tw: number };

/**
 * "Today's line": a philosopher's quote fades in, then a wind front sweeps from the left and
 * scatters it into fine gold particles, followed by the MEDISCAN PRO mark. Tap to skip.
 * Ported from the prototype's canvas animation; layout is relative to the 380×820 design frame.
 */
export function Splash({ quote, dateStr, cjk, skip, sub, onDone }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [closing, setClosing] = useState(false);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setClosing(true);
    setTimeout(() => onDoneRef.current(), 450);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const cv = ref.current!;
    let raf = 0, dead = false;
    const W = cv.clientWidth || 380, H = cv.clientHeight || 820;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const off = document.createElement('canvas');
    off.width = W * dpr; off.height = H * dpr;
    const o = off.getContext('2d', { willReadFrequently: true })!;
    o.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2 - 15; // 190, 395 in the 380×820 frame
    const dust = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.08 + Math.random() * 0.2, s: 0.6 + Math.random() * 1.2, a: 0.08 + Math.random() * 0.2 }));
    const spacing = (c: CanvasRenderingContext2D, v: string) => { if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v; };

    const run = () => {
      o.textAlign = 'center'; o.textBaseline = 'alphabetic';
      o.font = `500 22px ${SERIF}`;
      const maxW = Math.min(290, W - 90);
      const words = cjk ? Array.from(quote.t) : quote.t.split(' '), sep = cjk ? '' : ' ';
      const lines: string[] = [];
      let cur = '';
      words.forEach(w => { const t = cur ? cur + sep + w : w; if (o.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
      lines.push(cur);
      const lh = 42, bh = lines.length * lh, top = cy - bh / 2;

      spacing(o, '4px'); o.font = `600 12px ${DISPLAY}`; o.fillStyle = '#c9a45c';
      o.fillText("TODAY'S LINE · " + dateStr, cx + 2, top - 50);
      spacing(o, '0px'); o.fillRect(cx - 12, top - 30, 24, 1);
      o.font = `500 22px ${SERIF}`; o.fillStyle = '#f1ead9';
      lines.forEach((l, i) => o.fillText(l, cx, top + (i + 1) * lh - 12));
      o.font = `400 14px ${SANS}`; o.fillStyle = '#c9a45c';
      o.fillText('— ' + quote.a, cx, top + bh + 30);
      spacing(o, '3px'); o.font = `600 12px ${DISPLAY}`; o.fillStyle = '#7f8f86';
      o.fillText(quote.en.toUpperCase(), cx + 2, top + bh + 54);

      // Sample the rendered text into particles.
      const y0 = Math.max(0, Math.floor(top - 72)), y1 = Math.min(H, Math.ceil(top + bh + 70));
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const ps: P[] = [];
      let minX = W, maxX = 0;
      const STEP = 0.75;
      for (let y = y0; y < y1; y += STEP) for (let x = 0; x < W; x += STEP) {
        const i = (Math.round((y + STEP / 2) * dpr) * off.width + Math.round((x + STEP / 2) * dpr)) * 4;
        if (img[i + 3] > 40) {
          ps.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, r: img[i], g: img[i + 1], b: img[i + 2], a: img[i + 3] / 255, life: 1, dec: 0.004 + Math.random() * 0.009, on: false, s: 0.5 + Math.random() * 0.9, ph: Math.random() * 6.28, tw: 0.5 + Math.random() * 1.5 });
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        }
      }
      const jit = (y: number) => Math.sin(y * 0.09) * 16 + Math.sin(y * 0.023 + 1) * 28;
      const t0 = performance.now();

      const frame = (now: number) => {
        if (dead) return;
        const t = now - t0;
        ctx.clearRect(0, 0, W, H);
        dust.forEach(d => {
          d.x += d.v; d.y -= d.v * 0.3;
          if (d.x > W) { d.x = -4; d.y = Math.random() * H; }
          ctx.fillStyle = `rgba(201,164,92,${d.a})`; ctx.fillRect(d.x, d.y, d.s, d.s);
        });
        if (t > T_WIND) {
          const front = minX - 60 + (maxX - minX + 120) * Math.min(1, (t - T_WIND) / T_SWEEP);
          for (let y = y0; y < y1; y += 1) { const w = front + jit(y); if (w > 0) o.clearRect(0, y, w, 1); }
          for (const p of ps) {
            if (!p.on && p.hx < front + jit(p.hy)) { p.on = true; p.vx = 0.3 + Math.random() * 1.9; p.vy = (Math.random() - 0.65) * 1.6; }
          }
        }
        const e = Math.min(1, t / T_IN), ease = 1 - Math.pow(1 - e, 3);
        ctx.globalAlpha = ease; ctx.drawImage(off, 0, (1 - ease) * 10, W, H); ctx.globalAlpha = 1;
        for (const p of ps) {
          if (!p.on || p.life <= 0) continue;
          const sw = Math.sin(p.y * 0.035 + t * 0.002 + p.ph), cw = Math.cos(p.x * 0.028 - t * 0.0016 + p.ph);
          p.vx += 0.025 + Math.random() * 0.06 + cw * 0.03; p.vy += -0.014 + sw * 0.07 * p.tw;
          p.vx *= 0.982; p.vy *= 0.975; p.x += p.vx; p.y += p.vy; p.life -= p.dec;
          const k = 1 - p.life, r = p.r + (232 - p.r) * k, g = p.g + (211 - p.g) * k, b = p.b + (154 - p.b) * k;
          const flick = 0.75 + 0.25 * Math.sin(t * 0.02 + p.ph * 3);
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, p.a * p.life * flick)})`;
          const sz = p.s * (0.35 + 0.65 * p.life); ctx.fillRect(p.x, p.y, sz, sz);
        }
        if (t > T_BRAND) {
          const a = Math.min(1, (t - T_BRAND) / 900);
          ctx.globalAlpha = a; ctx.textAlign = 'center';
          spacing(ctx, '8px'); ctx.font = `600 17px ${DISPLAY}`; ctx.fillStyle = '#e8d39a';
          ctx.fillText('MEDISCAN PRO', cx + 4, cy + 5 + (1 - a) * 6);
          spacing(ctx, '2px'); ctx.font = `400 12px ${SANS}`; ctx.fillStyle = '#a3b0a7';
          ctx.fillText(sub, cx + 1, cy + 33 + (1 - a) * 6);
          ctx.globalAlpha = 1;
        }
        if (t > T_END) { finishRef.current(); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      // Respect reduced motion: show the line briefly without the particle effect.
      const id = setTimeout(() => finishRef.current(), 3000);
      return () => { dead = true; clearTimeout(id); };
    }
    Promise.race([
      Promise.all([
        document.fonts.load(`500 22px "Noto Serif KR"`, quote.t),
        document.fonts.load(`400 14px "Noto Sans KR"`, quote.a),
        document.fonts.load(`600 12px "Cormorant Garamond"`, 'A'),
      ]),
      new Promise(r => setTimeout(r, 1500)),
    ]).catch(() => {}).then(() => { if (!dead) run(); });
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [quote, dateStr, cjk, sub]);

  return (
    <div onClick={finish} role="button" aria-label={skip}
      style={{ position: 'absolute', inset: 0, zIndex: 25, cursor: 'pointer', background: 'radial-gradient(110% 70% at 50% 45%,#143628 0%,#0a1912 70%)', opacity: closing ? 0 : 1, transition: 'opacity .45s ease' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      {matchMedia?.('(prefers-reduced-motion: reduce)').matches && (
        <div className="col" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 45px', textAlign: 'center' }}>
          <span className="serif" style={{ fontSize: 22, lineHeight: 1.6, color: 'var(--ink)' }}>{quote.t}</span>
          <span style={{ fontSize: 14, color: 'var(--gold)' }}>— {quote.a}</span>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', fontSize: 11.5, color: 'var(--faint)', letterSpacing: '.04em' }}>{skip}</div>
    </div>
  );
}
