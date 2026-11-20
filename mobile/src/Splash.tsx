import { useEffect, useRef, useState } from 'react';
import type { Quote } from './data';

interface Props {
  quote: Quote;
  dateStr: string;
  font: string;
  cjk: boolean;
  skip: string;
  sub: string;
  onDone: () => void;
}

interface Particle {
  hx: number; hy: number; x: number; y: number; vx: number; vy: number;
  r: number; g: number; b: number; a: number; life: number; dec: number; on: boolean; s: number; ph: number; tw: number;
}

const GOLD = '#e1ad66', PAPER = '#f3f2f2', MUTED = '#9b9797';

/** "Today's line": a philosopher's quote that blows away in the wind, then the wordmark. */
export function Splash({ quote, dateStr, font, cjk, skip, sub, onDone }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setClosing(true);
    setTimeout(() => onDoneRef.current(), 450);
  };

  useEffect(() => {
    let raf = 0, dead = false;
    const cv = ref.current!;
    const W = cv.clientWidth || 390, H = cv.clientHeight || 844;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const off = document.createElement('canvas');
    off.width = W * dpr; off.height = H * dpr;
    const o = off.getContext('2d', { willReadFrequently: true })!;
    o.scale(dpr, dpr);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dust = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.06 + Math.random() * 0.16, s: 0.6 + Math.random() * 1.1, a: 0.06 + Math.random() * 0.16 }));
    const spacing = (c: CanvasRenderingContext2D, v: string) => { if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = v; };
    const cx = W / 2, cy = H / 2;
    const maxW = Math.min(290, W - 100);

    const run = () => {
      o.textAlign = 'center'; o.textBaseline = 'alphabetic';
      o.font = `400 22px "${font}", serif`;
      const words = cjk ? Array.from(quote.t) : quote.t.split(' '), sep = cjk ? '' : ' ', lines: string[] = [];
      let cur = '';
      words.forEach(w => { const t = cur ? cur + sep + w : w; if (o.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
      lines.push(cur);
      const lh = 42, bh = lines.length * lh, top = cy - 17 - bh / 2;
      spacing(o, '4px'); o.font = '600 12px "Cormorant Garamond", serif'; o.fillStyle = GOLD;
      o.fillText("TODAY'S LINE · " + dateStr, cx + 2, top - 54);
      spacing(o, '0px'); o.fillRect(cx - 16, top - 32, 32, 1);
      o.font = `400 22px "${font}", serif`; o.fillStyle = PAPER;
      lines.forEach((l, i) => o.fillText(l, cx, top + (i + 1) * lh - 12));
      o.font = 'italic 400 15px "Lora", "Noto Serif KR", serif'; o.fillStyle = GOLD;
      o.fillText('— ' + quote.a, cx, top + bh + 30);
      spacing(o, '3px'); o.font = '600 12px "Cormorant Garamond", serif'; o.fillStyle = MUTED;
      o.fillText(quote.en.toUpperCase(), cx + 2, top + bh + 54);

      const y0 = Math.max(0, Math.floor(top - 72)), y1 = Math.min(H, Math.ceil(top + bh + 70));
      const img = o.getImageData(0, 0, off.width, off.height).data, ps: Particle[] = [];
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
      const T_IN = 1400, T_WIND = 3600, T_SWEEP = 2100, T_BRAND = 6600, T_END = 8400;
      const t0 = performance.now();
      const frame = (now: number) => {
        if (dead) return;
        const t = now - t0;
        ctx.clearRect(0, 0, W, H);
        dust.forEach(d => { d.x += d.v; d.y -= d.v * 0.3; if (d.x > W) { d.x = -4; d.y = Math.random() * H; } ctx.fillStyle = `rgba(225,173,102,${d.a})`; ctx.fillRect(d.x, d.y, d.s, d.s); });
        if (t > T_WIND && !reduce) {
          const front = minX - 60 + (maxX - minX + 120) * Math.min(1, (t - T_WIND) / T_SWEEP);
          for (let y = y0; y < y1; y += 1) { const w = front + jit(y); if (w > 0) o.clearRect(0, y, w, 1); }
          ps.forEach(p => { if (!p.on && p.hx < front + jit(p.hy)) { p.on = true; p.vx = 0.3 + Math.random() * 1.9; p.vy = (Math.random() - 0.65) * 1.6; } });
        }
        const e = Math.min(1, t / T_IN), ease = 1 - Math.pow(1 - e, 3);
        const fadeOut = reduce && t > T_WIND ? Math.max(0, 1 - (t - T_WIND) / 800) : 1;
        ctx.globalAlpha = ease * fadeOut; ctx.drawImage(off, 0, (1 - ease) * 10, W, H); ctx.globalAlpha = 1;
        ps.forEach(p => {
          if (!p.on || p.life <= 0) return;
          const sw = Math.sin(p.y * 0.035 + t * 0.002 + p.ph), cw = Math.cos(p.x * 0.028 - t * 0.0016 + p.ph);
          p.vx += 0.025 + Math.random() * 0.06 + cw * 0.03; p.vy += -0.014 + sw * 0.07 * p.tw;
          p.vx *= 0.982; p.vy *= 0.975; p.x += p.vx; p.y += p.vy; p.life -= p.dec;
          const k = 1 - p.life, r = p.r + (225 - p.r) * k, g = p.g + (173 - p.g) * k, b = p.b + (102 - p.b) * k;
          const flick = 0.75 + 0.25 * Math.sin(t * 0.02 + p.ph * 3);
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, p.a * p.life * flick)})`;
          const s = p.s * (0.35 + 0.65 * p.life);
          ctx.fillRect(p.x, p.y, s, s);
        });
        if (t > T_BRAND) {
          const a = Math.min(1, (t - T_BRAND) / 900);
          ctx.globalAlpha = a; ctx.textAlign = 'center';
          spacing(ctx, '9px'); ctx.font = '600 17px "Cormorant Garamond", serif'; ctx.fillStyle = PAPER;
          ctx.fillText('MEDISCAN PRO', cx + 4, cy - 12 + (1 - a) * 6);
          spacing(ctx, '0px'); ctx.fillStyle = GOLD; ctx.fillRect(cx - 16, cy + 6 + (1 - a) * 6, 32, 1);
          ctx.font = 'italic 400 13px "Lora", "Noto Serif KR", serif'; ctx.fillStyle = MUTED;
          ctx.fillText(sub, cx, cy + 32 + (1 - a) * 6);
          ctx.globalAlpha = 1;
        }
        if (t > T_END) { finish(); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    Promise.race([
      Promise.all([
        document.fonts.load(`400 22px "${font}"`, quote.t),
        document.fonts.load('italic 400 15px "Lora"', 'a'),
        document.fonts.load('600 12px "Cormorant Garamond"', 'A'),
      ]),
      new Promise(r => setTimeout(r, 1500)),
    ]).catch(() => {}).then(() => { if (!dead) run(); });
    return () => { dead = true; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div onClick={finish} role="button" aria-label={skip} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish(); }}
      style={{ position: 'absolute', inset: 0, zIndex: 45, cursor: 'pointer', background: 'var(--ms-dark)', opacity: closing ? 0 : 1, transition: 'opacity .45s ease' }}>
      <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(225,173,102,.22)', pointerEvents: 'none' }} />
      <canvas ref={ref} aria-label={`${quote.t} — ${quote.a}`} style={{ width: '100%', height: '100%', display: 'block', position: 'relative' }} />
      <div style={{ position: 'absolute', bottom: 'calc(40px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, textAlign: 'center', fontSize: 11.5, fontStyle: 'italic', fontFamily: "'Lora','Noto Serif KR',serif", color: MUTED }}>{skip}</div>
    </div>
  );
}

