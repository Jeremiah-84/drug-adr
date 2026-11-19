import type { CSSProperties, ReactNode } from 'react';
import type { Badge as BadgeT } from './data';
import { useApp } from './state';

export function Back() {
  const { back, t } = useApp();
  return <button className="back" onClick={back}>‹ {t.back}</button>;
}

export function Heading({ eyebrow, title, sub, size = 23 }: { eyebrow: string; title: string; sub?: ReactNode; size?: number }) {
  return (
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <div className="title" style={{ fontSize: size }}>{title}</div>
      {sub != null && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Badge({ b, style }: { b: BadgeT; style?: CSSProperties }) {
  return <span className="badge" style={{ background: b.bg, color: b.c, ...style }}>{b.t}</span>;
}

/** Switch; `size` is the track width (46 → 28 tall, 42 → 26 tall) to match the two sizes in the design. */
export function Toggle({ on, onClick, size = 46 }: { on: boolean; onClick: () => void; size?: 46 | 42 }) {
  const h = size === 46 ? 28 : 26, knob = size === 46 ? 22 : 20;
  return (
    <button role="switch" aria-checked={on} className={'toggle' + (on ? ' on' : '')} onClick={onClick}
      style={{ width: size, height: h, borderRadius: h / 2 }}>
      <span style={{ width: knob, height: knob, left: on ? size - knob - 3 : 3 }} />
    </button>
  );
}

export function Chip({ on, onClick, children, style }: { on: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return <button className={'chip' + (on ? ' on' : '')} onClick={onClick} style={style}>{children}</button>;
}

export function Segment<K extends string>({ items, value, onPick, style, itemStyle }: {
  items: [K, string][]; value: K; onPick: (k: K) => void; style?: CSSProperties; itemStyle?: CSSProperties;
}) {
  return (
    <div className="segment" style={style}>
      {items.map(([k, l]) => (
        <button key={k} className={value === k ? 'on' : ''} onClick={() => onPick(k)} style={itemStyle}>{l}</button>
      ))}
    </div>
  );
}

export function Dot({ color, size = 10, ring }: { color: string; size?: number; ring?: boolean }) {
  return <span style={{ width: size, height: size, flex: 'none', borderRadius: '50%', background: color, boxShadow: ring ? '0 0 0 2px rgba(255,255,255,.08)' : undefined }} />;
}

export function Sheet({ onClose, gap, children }: { onClose: () => void; gap: number; children: ReactNode }) {
  return (
    <div className="sheet-wrap">
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" style={{ gap }}>
        <div className="grabber" />
        {children}
      </div>
    </div>
  );
}
