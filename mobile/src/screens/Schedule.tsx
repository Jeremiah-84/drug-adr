import { slotViews } from '../derive';
import type { SlotKey } from '../data';
import { useApp } from '../state';
import { Back, Chip, Heading, Sheet, Toggle } from '../ui';
import { ChevronDown, ChevronUp } from '../icons';

const p2 = (n: number) => String(n).padStart(2, '0');
const PRESETS: Record<SlotKey, string[]> = {
  m: ['07:00', '07:30', '08:00', '09:00'],
  l: ['12:00', '12:30', '13:00', '13:30'],
  e: ['18:00', '18:30', '19:00', '20:00'],
  n: ['21:30', '22:00', '22:30', '23:00'],
};

export function Schedule() {
  const { s, me, set, takeSlot, flash, t, L, F } = useApp();
  const edit = (k: SlotKey) => {
    const [h, mi] = s.times[k].split(':').map(Number);
    set({ timeEdit: k, draft: { h, mi } });
  };
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="SCHEDULE" title={t.sched} sub={t.editHint} />
      {!me.meds.length && <div className="empty">{L('약을 등록하면 먹는 시간별로 모아서 보여드려요.')}</div>}
      <div className="col rule-top">
        {slotViews(s, me).map(x => {
          const has = x.meds.length > 0;
          const status = !has ? L('이 시간에 먹는 약이 없어요') : x.ss === 'done' ? L('오늘 복용 완료') : x.ss === 'open' ? F('{0}까지 기록 가능', x.until) : x.ss === 'early' ? F('{0}부터 기록 가능', x.from) : L('기록 시간 지남 · 누락');
          const c = !has ? 'var(--color-neutral-600)' : x.ss === 'done' || x.ss === 'open' ? 'var(--color-accent-700)' : x.ss === 'missed' ? 'var(--color-accent-800)' : 'var(--color-neutral-600)';
          return (
            <div key={x.k} style={{ padding: '20px 0', borderBottom: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button className="tap g tnum time-edit" onClick={() => edit(x.k)} aria-label={t.timeTitle}
                  style={{ fontSize: 40, lineHeight: 1, borderBottom: '1px solid var(--color-accent)', paddingBottom: 2 }}>{x.time}</button>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 14.5, fontWeight: 600 }}>{L(x.label)}</div>
                  <div style={{ fontSize: 12, color: c, fontStyle: 'italic' }}>{status}</div>
                </div>
                <Toggle on={x.remind} label={L(x.label)} onClick={() => { if (!x.remind && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); set(st => ({ remind: { ...st.remind, [x.k]: !st.remind[x.k] } })); }} />
              </div>
              {has && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {x.meds.map(dr => (
                    <span key={dr.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '4px 10px', borderRadius: 3, border: '1px solid var(--color-divider)' }}>
                      <span className="pill-swatch" style={{ width: 14, height: 7, background: dr.color }} />{dr.name}
                    </span>
                  ))}
                </div>
              )}
              {has && x.ss === 'open' && (
                <button className="btn btn-primary serif" style={{ height: 40, fontFamily: 'var(--ms-serif)', fontSize: 13.5 }}
                  onClick={() => { takeSlot(x.k); flash(F('{0} {1} 복용을 기록했어요', x.time, L(x.label))); }}>{t.done}</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="muted just" style={{ fontSize: 12, lineHeight: 1.75 }}>
        {F('복용 완료는 설정 시간 전후 {0}시간 안에서만 기록할 수 있습니다.', 2)} {t.schedNote}
      </div>
    </div>
  );
}

/** Bottom sheet for changing a dose time (hours by 1, minutes by 5, plus four presets per slot). */
export function TimeSheet() {
  const { s, me, set, flash, t, L, F } = useApp();
  if (!s.timeEdit) return null;
  const slot = slotViews(s, me).find(x => x.k === s.timeEdit)!;
  const cur = p2(s.draft.h) + ':' + p2(s.draft.mi);
  const step = (dh: number, dm: number) => () => set(x => {
    const m = (x.draft.h * 60 + x.draft.mi + dh * 60 + dm + 1440) % 1440;
    return { draft: { h: Math.floor(m / 60), mi: m % 60 } };
  });
  const cols = [
    { v: p2(s.draft.h), l: t.hour, inc: step(1, 0), dec: step(-1, 0) },
    { v: p2(s.draft.mi), l: t.minute, inc: step(0, 5), dec: step(0, -5) },
  ];
  const save = () => {
    const k = slot.k;
    set(x => ({ timeEdit: null, times: { ...x.times, [k]: cur } }));
    flash(F('{0} 복용 시간을 {1}(으)로 바꿨어요', L(slot.label), cur));
  };
  return (
    <Sheet onClose={() => set({ timeEdit: null })} label={t.timeTitle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{t.timeTitle}</span>
        <span className="sub">{L(slot.label)}{slot.meds.length ? ' · ' + slot.meds.map(d => d.name).join(' · ') : ''}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        {cols.map(c => (
          <div key={c.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-secondary" aria-label={`${c.l} +`} onClick={c.inc} style={{ width: 64, height: 40 }}><ChevronUp /></button>
            <span className="g tnum" style={{ fontSize: 64, lineHeight: 1, width: 96, textAlign: 'center' }}>{c.v}</span>
            <button className="btn btn-secondary" aria-label={`${c.l} −`} onClick={c.dec} style={{ width: 64, height: 40 }}><ChevronDown /></button>
            <span className="muted" style={{ fontSize: 11 }}>{c.l}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PRESETS[slot.k].map(p => {
          const [hh, mm] = p.split(':').map(Number);
          return <Chip key={p} on={p === cur} style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => set({ draft: { h: hh, mi: mm } })}><span className="tnum">{p}</span></Chip>;
        })}
      </div>
      <button className="btn btn-primary cta" style={{ height: 48, fontSize: 15 }} onClick={save}>{t.save}</button>
    </Sheet>
  );
}
