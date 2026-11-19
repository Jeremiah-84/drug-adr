import { bpSt, gluSt, nowHM, todayMD, type Badge as BadgeT } from '../data';
import { trBadge } from '../derive';
import { useApp, type VitalsTab } from '../state';
import { Back, Badge, Heading, SecHead, Segment, Sheet, Stats } from '../ui';
import { Minus, Plus } from '../icons';

const CHART_H = 140;
const px = (v: number, lo: number, hi: number) => Math.max(0, Math.min(CHART_H, (v - lo) / (hi - lo) * CHART_H));
const avg = <T,>(a: T[], f: (x: T) => number) => Math.round(a.reduce((s, e) => s + f(e), 0) / a.length);
const BAR = 'color-mix(in srgb,var(--color-accent) 35%,transparent)';

type Row = BadgeT & { d: string; time: string; big: string; sub: string };
type Col = { d: string; b: number; h: number; bg: string; bd: string };
type View = {
  unit: string; addLabel: string; rows: Row[]; last: Row | null;
  refs: { b: number; l: string }[];
  cols: Col[];
  stats: { v: string; k: string }[];
  note: string;
};

function useVitalsView(): View {
  const { s, me, L, F } = useApp();
  const bp = me.bp, glu = me.glu;
  if (s.vt === 'bp') {
    const rows = bp.map(e => ({ ...trBadge(bpSt(e.s, e.di), L), d: e.d, time: e.time, big: `${e.s}/${e.di}`, sub: F('맥박 {0}', e.p) }));
    const last7 = bp.slice(0, 7).reverse();
    return {
      unit: 'mmHg', addLabel: L('혈압 기록하기'), rows, last: rows.length ? { ...rows[0], sub: F('맥박 {0} bpm', bp[0].p) } : null,
      refs: [{ b: px(140, 50, 180), l: '140' }, { b: px(90, 50, 180), l: '90' }],
      cols: last7.map(e => ({
        d: e.d.slice(3), b: px(e.di, 50, 180), h: Math.max(6, px(e.s, 50, 180) - px(e.di, 50, 180)),
        bg: bpSt(e.s, e.di).t === '높음' ? 'color-mix(in srgb,var(--color-accent-800) 45%,transparent)' : BAR,
        bd: bpSt(e.s, e.di).t === '높음' ? 'var(--color-accent-800)' : 'var(--color-accent)',
      })),
      stats: [
        { v: last7.length ? `${avg(last7, e => e.s)}/${avg(last7, e => e.di)}` : '-', k: L('7일 평균') },
        { v: last7.length ? `${Math.max(...last7.map(e => e.s))}` : '-', k: L('최고 수축기') },
        { v: last7.length ? `${avg(last7, e => e.p)}` : '-', k: L('평균 맥박') },
      ],
      note: L('아침에 약 먹기 전, 매일 같은 시간에 재면 변화를 비교하기 좋아요.'),
    };
  }
  const rows = glu.map(e => ({ ...trBadge(gluSt(e.v, e.when), L), d: e.d, time: e.time, big: `${e.v}`, sub: L(e.when) }));
  const last7 = glu.slice(0, 7).reverse();
  const fast = glu.filter(e => e.when === '공복').slice(0, 7);
  return {
    unit: 'mg/dL', addLabel: L('혈당 기록하기'), rows, last: rows[0] || null,
    refs: [{ b: px(126, 60, 220), l: '126' }, { b: px(200, 60, 220), l: '200' }],
    cols: last7.map(e => ({ d: e.d.slice(3), b: 0, h: px(e.v, 60, 220), bg: e.when === '공복' ? BAR : 'transparent', bd: e.when === '공복' ? 'var(--color-accent)' : 'var(--color-neutral-600)' })),
    stats: [
      { v: fast.length ? `${avg(fast, e => e.v)}` : '-', k: L('공복 평균') },
      { v: last7.length ? `${Math.max(...last7.map(e => e.v))}` : '-', k: L('7일 최고') },
      { v: `${last7.length}`, k: L('측정 횟수') },
    ],
    note: L('금색으로 채운 막대는 공복, 빈 막대는 식후·취침 전 측정값이에요.'),
  };
}

export function Vitals() {
  const { s, set, t, L } = useApp();
  const vt = useVitalsView();
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="VITALS NOTEBOOK" title={t.vitalsTitle} />
      <Segment<VitalsTab> items={[['bp', L('혈압')], ['glu', L('혈당')]]} value={s.vt} onPick={k => set({ vt: k })} />
      {!vt.last && (
        <div style={{ paddingTop: 18, borderTop: '1px solid var(--color-text)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="kicker">NO RECORDS YET</span>
          <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{L('아직 기록이 없어요')}</span>
          <span className="lead">{L('아래 버튼으로 첫 기록을 남겨 보세요. 이 휴대폰 안에만 저장돼요.')}</span>
        </div>
      )}
      {vt.last && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 18, borderTop: '1px solid var(--color-text)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="sub" style={{ fontSize: 12 }}>{t.recent} · {vt.last.d} {vt.last.time}</span>
            <span className="g tnum" style={{ fontSize: 56, lineHeight: 0.95 }}>{vt.last.big}<span className="muted" style={{ fontSize: 15 }}> {vt.unit}</span></span>
            <span className="muted" style={{ fontSize: 12.5 }}>{vt.last.sub}</span>
          </div>
          <Badge b={vt.last} style={{ padding: '2px 10px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative', height: CHART_H, borderBottom: '1px solid var(--color-divider)' }} aria-hidden="true">
            {vt.refs.map(rf => (
              <div key={rf.l} style={{ position: 'absolute', left: 0, right: 0, bottom: rf.b, borderTop: '1px dashed var(--color-accent-300)' }}>
                <span className="muted tnum" style={{ position: 'absolute', right: 0, top: -16, fontSize: 10 }}>{rf.l}</span>
              </div>
            ))}
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {vt.cols.map((c, i) => (
                <div key={i} style={{ flex: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '50%', marginLeft: -5, width: 10, bottom: c.b, height: c.h, border: `1px solid ${c.bd}`, background: c.bg }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            {vt.cols.map((c, i) => <span key={i} className="muted tnum" style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{c.d}</span>)}
          </div>
        </div>
        <Stats items={vt.stats} size={28} />
      </>}
      <div className="just" style={{ paddingTop: 14, borderTop: '1px solid var(--color-accent)', fontSize: 13, lineHeight: 1.8, color: 'var(--color-neutral-800)' }}>{vt.note}</div>
      {vt.rows.length > 0 && (
        <div className="col">
          <SecHead name={t.records} />
          {vt.rows.map((r, i) => (
            <div key={vt.rows.length - i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <div className="tnum" style={{ width: 46, flex: 'none' }}>
                <div style={{ fontSize: 12.5, color: 'var(--color-accent-700)' }}>{r.d}</div>
                <div className="muted" style={{ fontSize: 10.5 }}>{r.time}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="g tnum" style={{ fontSize: 22 }}>{r.big}</span> <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{r.sub}</span>
              </div>
              <Badge b={r} style={{ fontSize: 10.5, padding: '1px 8px', alignSelf: 'center' }} />
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-primary cta" onClick={() => set({ sheet: true })}>{vt.addLabel}</button>
      <div className="fine">{t.criteria}</div>
    </div>
  );
}

const WHEN = ['공복', '식후 2시간', '취침 전'];

export function VitalsSheet() {
  const { s, set, edit, flash, t, L, F } = useApp();
  const vt = useVitalsView();
  if (!s.sheet) return null;
  const f = s.form, isBp = s.vt === 'bp';
  const status = trBadge(isBp ? bpSt(+f.s, +f.di) : gluSt(+f.v, f.when), L);
  const fields: ['s' | 'di' | 'p' | 'v', string, string][] = isBp
    ? [['s', '수축기', 'mmHg'], ['di', '이완기', 'mmHg'], ['p', '맥박', 'bpm']]
    : [['v', '혈당', 'mg/dL']];
  const bump = (k: (typeof fields)[number][0], d: number) => () =>
    set(x => ({ form: { ...x.form, [k]: Math.max(0, (Number(x.form[k]) || 0) + d) } }));
  const save = () => {
    const time = nowHM(), d = todayMD();
    if (isBp) edit(m => ({ bp: [{ d, time, s: +f.s || 0, di: +f.di || 0, p: +f.p || 0 }, ...m.bp].slice(0, 400) }));
    else edit(m => ({ glu: [{ d, time, v: +f.v || 0, when: f.when }, ...m.glu].slice(0, 400) }));
    set({ sheet: false });
    flash(isBp ? F('혈압 {0}/{1}을 기록했어요', f.s, f.di) : F('혈당 {0} mg/dL을 기록했어요', f.v));
  };
  return (
    <Sheet onClose={() => set({ sheet: false })} gap={16} label={vt.addLabel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{vt.addLabel}</span>
        <Badge b={status} style={{ padding: '2px 10px', alignSelf: 'center' }} />
      </div>
      {!isBp && (
        <Segment<string> small items={WHEN.map(w => [w, L(w)])} value={f.when} onPick={w => set(x => ({ form: { ...x.form, when: w } }))} />
      )}
      <div className="col rule-top">
        {fields.map(([k, l, u]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 14 }}>{L(l)}</div>
              <div className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{u}</div>
            </div>
            <button className="btn btn-secondary" aria-label={`${L(l)} −`} onClick={bump(k, -1)} style={{ width: 44, height: 44, padding: 0, borderRadius: '50%' }}><Minus size={16} /></button>
            <input value={f[k]} inputMode="numeric" aria-label={L(l)} className="g tnum"
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); set(x => ({ form: { ...x.form, [k]: v } })); }}
              style={{ width: 76, height: 44, textAlign: 'center', background: 'transparent', border: 0, borderBottom: '1px solid var(--color-accent)', borderRadius: 0, color: 'var(--color-text)', fontSize: 34, outline: 'none', padding: 0 }} />
            <button className="btn btn-secondary" aria-label={`${L(l)} +`} onClick={bump(k, 1)} style={{ width: 44, height: 44, padding: 0, borderRadius: '50%' }}><Plus size={16} /></button>
          </div>
        ))}
      </div>
      <button className="btn btn-primary cta" style={{ height: 48, fontSize: 15 }} onClick={save}>{t.save}</button>
    </Sheet>
  );
}
