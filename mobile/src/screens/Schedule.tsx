import { slotViews } from '../derive';
import type { SlotKey } from '../data';
import { useApp } from '../state';
import { Back, Chip, Sheet, Toggle } from '../ui';

const p2 = (n: number) => String(n).padStart(2, '0');
const PRESETS: Record<SlotKey, string[]> = {
  m: ['07:00', '07:30', '08:00', '09:00'],
  e: ['18:00', '18:30', '19:00', '20:00'],
  n: ['21:30', '22:00', '22:30', '23:00'],
};

export function Schedule() {
  const { s, me, set, t, L } = useApp();
  const edit = (k: SlotKey) => {
    const [h, mi] = s.times[k].split(':').map(Number);
    set({ timeEdit: k, draft: { h, mi } });
  };
  return (
    <div className="screen">
      <Back />
      <div>
        <div className="eyebrow">REMINDERS</div>
        <div className="title">{t.sched}</div>
        <div className="sub">{t.editHint}</div>
      </div>
      {!me.meds.length && <div style={{ border: '1px dashed rgba(201,164,92,.3)', borderRadius: 16, padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{L('약을 등록하면 먹는 시간별로 모아서 보여드려요.')}</div>}
      {slotViews(s, me).map(x => (
        <div key={x.k} className="col" style={{ borderRadius: 20, padding: 18, background: 'var(--card)', border: '1px solid rgba(201,164,92,.14)', gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <button className="display time-edit" onClick={() => edit(x.k)}
              style={{ fontSize: 34, lineHeight: 1, color: 'var(--gold-light)', borderBottom: '1px dashed rgba(201,164,92,.5)', paddingBottom: 2 }}>{x.time}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{L(x.label)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{L(x.taken ? '오늘 복용 완료' : '복용 전')}</div>
            </div>
            <Toggle on={x.remind} onClick={() => { if (!x.remind && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); set(st => ({ remind: { ...st.remind, [x.k]: !st.remind[x.k] } })); }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {!x.meds.length && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{L('이 시간에 먹는 약이 없어요')}</span>}
            {x.meds.map(dr => (
              <span key={dr.key} className="row" style={{ gap: 6, fontSize: 12.5, padding: '5px 10px', borderRadius: 999, background: 'var(--bg)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dr.color }} />{dr.name}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{t.schedNote}</div>
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
  const arrow = { width: 64, height: 44, borderRadius: 14, border: '1px solid rgba(201,164,92,.35)', fontSize: 14 };
  return (
    <Sheet onClose={() => set({ timeEdit: null })} gap={18}>
      <div className="col" style={{ gap: 4 }}>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{t.timeTitle}</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L(slot.label)} · {slot.meds.map(d => d.name).join(' · ')}</span>
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
        {cols.map(c => (
          <div key={c.l} className="col" style={{ alignItems: 'center', gap: 6 }}>
            <button aria-label={`${c.l} +`} className="stepper" style={arrow} onClick={c.inc}>▲</button>
            <span className="display" style={{ fontSize: 64, lineHeight: 1, color: 'var(--gold-light)', width: 96, textAlign: 'center' }}>{c.v}</span>
            <button aria-label={`${c.l} −`} className="stepper" style={arrow} onClick={c.dec}>▼</button>
            <span style={{ fontSize: 11, color: 'var(--faint)' }}>{c.l}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PRESETS[slot.k].map(p => {
          const [hh, mm] = p.split(':').map(Number);
          return <Chip key={p} on={p === cur} style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => set({ draft: { h: hh, mi: mm } })}>{p}</Chip>;
        })}
      </div>
      <button className="btn-gold" style={{ height: 52, fontSize: 15 }} onClick={save}>{t.save}</button>
    </Sheet>
  );
}
