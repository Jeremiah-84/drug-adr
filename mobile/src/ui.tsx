import type { CSSProperties, ReactNode } from 'react';
import type { Badge as BadgeT } from './data';
import { useApp } from './state';

const chevL = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;

export function Back() {
  const { back, t } = useApp();
  return <button className="back" onClick={back}>{chevL}{t.back}</button>;
}

/** Kicker (small caps, gold) over a serif title, with an italic subline. */
export function Heading({ eyebrow, title, sub, size = 24 }: { eyebrow: string; title: string; sub?: ReactNode; size?: number }) {
  return (
    <div className="head-block">
      <span className="kicker">{eyebrow}</span>
      <span className="title" style={{ fontSize: size }}>{title}</span>
      {sub != null && <span className="sub">{sub}</span>}
    </div>
  );
}

/** Status chip drawn as a stroke in the tone's colours. */
export function Badge({ b, style }: { b: BadgeT; style?: CSSProperties }) {
  return <span className="chip" style={{ borderColor: b.bd, color: b.c, ...style }}>{b.t}</span>;
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; size?: number; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={'switch' + (on ? ' on' : '')} onClick={onClick}>
      <span />
    </button>
  );
}

export function Chip({ on, onClick, children, style }: { on: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return <button type="button" aria-pressed={on} className={'pick' + (on ? ' on' : '')} onClick={onClick} style={style}>{children}</button>;
}

export function Segment<K extends string>({ items, value, onPick, style, itemStyle, small }: {
  items: [K, string][]; value: K; onPick: (k: K) => void; style?: CSSProperties; itemStyle?: CSSProperties; small?: boolean;
}) {
  return (
    <div className={'seg2' + (small ? ' sm' : '')} style={style} role="radiogroup">
      {items.map(([k, l]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? 'on' : ''} onClick={() => onPick(k)} style={itemStyle}>{l}</button>
      ))}
    </div>
  );
}

/** Small pill swatch in the medicine's colour. */
export function Dot({ color }: { color: string; size?: number; ring?: boolean }) {
  return <span className="pill-swatch" style={{ background: color }} />;
}

export function Sheet({ onClose, gap = 20, label, children }: { onClose: () => void; gap?: number; label?: string; children: ReactNode }) {
  return (
    <div className="sheet-wrap">
      <button className="sheet-scrim" aria-label="close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} style={{ gap }}>
        <div className="grip" />
        {children}
      </div>
    </div>
  );
}

/** Section heading with a dark rule underneath (name on the left, small-caps English tag on the right). */
export function SecHead({ name, en, onClick }: { name: string; en?: string; onClick?: () => void }) {
  const inner = <><span className="name">{name}</span>{en && <span className="tag-en">{en}</span>}</>;
  return onClick
    ? <button className="tap sec-head" onClick={onClick} style={{ width: '100%' }}>{inner}</button>
    : <div className="sec-head">{inner}</div>;
}

export function Stats({ items, size = 30 }: { items: { v: string; k: string }[]; size?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},minmax(0,1fr))` }}>
      {items.map((r, i) => (
        <div key={i} style={{ textAlign: 'center', padding: '4px 0', borderLeft: i ? '1px solid var(--color-divider)' : 'none' }}>
          <div className="g tnum" style={{ fontSize: size, lineHeight: 1.1 }}>{r.v}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.k}</div>
        </div>
      ))}
    </div>
  );
}
