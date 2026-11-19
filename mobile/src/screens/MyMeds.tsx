import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp, type Med } from '../state';
import { DrugRow, SlotChips } from './Drugs';

const HOLD_MS = 450;
const GAP = 10;

type Drag = { key: string; from: number; y0: number; dy: number; tops: number[]; hs: number[] };

/** Where the dragged row would land, from the row centres measured when the drag began. */
function targetIndex(d: Drag): number {
  const c = d.tops[d.from] + d.hs[d.from] / 2 + d.dy;
  let to = 0;
  d.tops.forEach((t, i) => { if (i !== d.from && c > t + d.hs[i] / 2) to++; });
  return to;
}

/**
 * The saved medicines. Long-press a row (or tap 편집) to enter edit mode:
 * drag rows by holding them, and remove a medicine with ✕ then a confirm.
 */
export function MyMedsList() {
  const { me, edit, openDrug, flash, L, F } = useApp();
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [ask, setAsk] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  const hold = useRef<{ t?: number; x: number; y: number; key: string; id: number } | null>(null);
  const swallowClick = useRef(false);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;

  // While dragging, stop the page from scrolling under the finger.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const stop = (e: TouchEvent) => { if (dragRef.current && e.cancelable) e.preventDefault(); };
    el.addEventListener('touchmove', stop, { passive: false });
    return () => el.removeEventListener('touchmove', stop);
  }, []);

  useEffect(() => { if (!me.meds.length) setEditing(false); }, [me.meds.length]);

  // A long-press turns on edit mode, which makes rows shorter: measure them after that render.
  const pending = useRef<{ key: string; y: number; tgt: Element; id: number } | null>(null);
  useLayoutEffect(() => {
    const q = pending.current;
    if (!q || !editing) return;
    pending.current = null;
    startDrag(q.key, q.y, q.tgt, q.id);
  }, [editing]);

  const startDrag = (key: string, y: number, target: Element, pointerId: number) => {
    const list = me.meds.map(m => rows.current[m.key]?.getBoundingClientRect());
    if (list.some(r => !r)) return;
    try { (target as HTMLElement).setPointerCapture(pointerId); } catch { /* pointer already gone */ }
    setDrag({ key, from: me.meds.findIndex(m => m.key === key), y0: y, dy: 0, tops: list.map(r => r!.top), hs: list.map(r => r!.height) });
    try { navigator.vibrate?.(15); } catch { /* not supported */ }
  };

  const cancelHold = () => { if (hold.current?.t) clearTimeout(hold.current.t); hold.current = null; };

  const onDown = (m: Med) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || ask) return;
    const tgt = e.currentTarget, x = e.clientX, y = e.clientY, id = e.pointerId;
    // In edit mode the grip starts a drag at once.
    if (editing && (e.target as HTMLElement).closest('[data-grip]')) { e.preventDefault(); startDrag(m.key, y, tgt, id); return; }
    if ((e.target as HTMLElement).closest('[aria-pressed],[data-del]')) return;
    cancelHold();
    hold.current = { x, y, key: m.key, id, t: window.setTimeout(() => {
      hold.current = null;
      swallowClick.current = true;
      if (editing) startDrag(m.key, y, tgt, id);
      else { pending.current = { key: m.key, y, tgt, id }; setEditing(true); }
    }, HOLD_MS) };
  };

  const onMove = (e: React.PointerEvent) => {
    const h = hold.current;
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) cancelHold();
    if (dragRef.current) setDrag(d => d && { ...d, dy: e.clientY - d.y0 });
  };

  const onUp = () => {
    cancelHold();
    if (swallowClick.current) setTimeout(() => { swallowClick.current = false; }, 0);
    const d = dragRef.current;
    if (!d) return;
    const to = targetIndex(d);
    setDrag(null);
    if (to !== d.from) edit(x => { const meds = x.meds.slice(); const [mv] = meds.splice(d.from, 1); meds.splice(to, 0, mv); return { meds }; });
  };

  const remove = (m: Med) => {
    edit(x => ({ meds: x.meds.filter(y => y.key !== m.key) }));
    setAsk(null);
    flash(F('{0}을(를) 내 약에서 지웠어요', m.name));
  };

  const to = drag ? targetIndex(drag) : -1;
  const shift = (i: number) => {
    if (!drag || i === drag.from) return 0;
    const h = drag.hs[drag.from] + GAP;
    if (drag.from < i && i <= to) return -h;
    if (to <= i && i < drag.from) return h;
    return 0;
  };

  return (
    <>
      {me.meds.length > 0 && (
        <div className="row" style={{ justifyContent: 'space-between', marginTop: -4 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{editing ? L('잡고 끌어서 순서를 바꾸세요') : L('길게 누르면 순서를 바꾸거나 지울 수 있어요')}</span>
          <button onClick={() => { setEditing(v => !v); setAsk(null); }} style={{ fontSize: 13, color: 'var(--gold)', fontWeight: editing ? 600 : 400, padding: '4px 0 4px 12px' }}>{editing ? L('완료') : L('편집')}</button>
        </div>
      )}
      <div ref={box} className="col" style={{ gap: GAP, userSelect: 'none', WebkitUserSelect: 'none' }}
        onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onContextMenu={e => e.preventDefault()}
        onClickCapture={e => { if (swallowClick.current) { swallowClick.current = false; e.stopPropagation(); e.preventDefault(); } }}>
        {me.meds.map((m, i) => {
          const isDrag = drag?.key === m.key;
          return (
            <div key={m.key} ref={el => { rows.current[m.key] = el; }} onPointerDown={onDown(m)}
              style={{
                transform: `translateY(${isDrag ? drag!.dy : shift(i)}px)${isDrag ? ' scale(1.02)' : ''}`,
                transition: isDrag ? 'none' : 'transform .18s ease',
                position: 'relative', zIndex: isDrag ? 5 : 1,
                boxShadow: isDrag ? '0 14px 30px rgba(0,0,0,.45)' : 'none', borderRadius: 20,
                WebkitTouchCallout: 'none',
              } as React.CSSProperties}>
              <DrugRow f={m} color={m.color} onOpen={() => { if (!editing) openDrug(m); }}
                right={editing ? (
                  <div className="row" style={{ gap: 6, flex: 'none' }}>
                    <button data-del aria-label={L('지우기')} onClick={() => setAsk(a => a === m.key ? null : m.key)}
                      style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(235,154,137,.5)', color: '#eb9a89', fontSize: 15 }}>✕</button>
                    <span data-grip aria-label={L('잡고 끌어서 순서 바꾸기')} role="button"
                      style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18, cursor: 'grab', touchAction: 'none' }}>≡</span>
                  </div>
                ) : undefined}
                foot={ask === m.key ? (
                  <div className="row" style={{ gap: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(235,154,137,.1)', border: '1px solid rgba(235,154,137,.3)' }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{L('이 약을 내 약에서 지울까요?')}</span>
                    <button onClick={() => setAsk(null)} style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 8px' }}>{L('취소')}</button>
                    <button onClick={() => remove(m)} style={{ fontSize: 13, fontWeight: 600, color: '#0b1d16', background: '#eb9a89', borderRadius: 8, padding: '6px 12px' }}>{L('지우기')}</button>
                  </div>
                ) : editing ? undefined : (
                  <SlotChips compact value={m.slots} onChange={v => edit(x => ({ meds: x.meds.map(y => y.key === m.key ? { ...y, slots: v } : y) }))} />
                )} />
            </div>
          );
        })}
      </div>
    </>
  );
}
