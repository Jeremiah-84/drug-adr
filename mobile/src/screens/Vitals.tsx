import { bpSt, gluSt, nowHM, todayMD, type Badge as BadgeT } from '../data';
import { trBadge } from '../derive';
import { useApp, type VitalsTab } from '../state';
import { Back, Badge, Chip, Segment, Sheet } from '../ui';

const CHART_H = 140;
const px = (v: number, lo: number, hi: number) => Math.max(0, Math.min(CHART_H, (v - lo) / (hi - lo) * CHART_H));
const avg = <T,>(a: T[], f: (x: T) => number) => Math.round(a.reduce((s, e) => s + f(e), 0) / a.length);
const GOLD_BAR = 'linear-gradient(180deg,#e8d39a,#a8843f)';

type Row = BadgeT & { d: string; time: string; big: string; sub: string };
type View = {
  unit: string; addLabel: string; rows: Row[]; last: Row | null;
  refs: { b: number; l: string }[];
  cols: { d: string; b: number; h: number; bg: string }[];
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
        bg: bpSt(e.s, e.di).t === '높음' ? 'linear-gradient(180deg,#eb9a89,#c9a45c)' : GOLD_BAR,
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
    cols: last7.map(e => ({ d: e.d.slice(3), b: 0, h: px(e.v, 60, 220), bg: e.when === '공복' ? GOLD_BAR : 'linear-gradient(180deg,#9ccbb6,#3f7a63)' })),
    stats: [
      { v: fast.length ? `${avg(fast, e => e.v)}` : '-', k: L('공복 평균') },
      { v: last7.length ? `${Math.max(...last7.map(e => e.v))}` : '-', k: L('7일 최고') },
      { v: `${last7.length}`, k: L('측정 횟수') },
    ],
    note: L('금색은 공복, 녹색은 식후 측정값이에요.'),
  };
}

export function Vitals() {
  const { s, set, t, L } = useApp();
  const vt = useVitalsView();
  return (
    <div className="screen">
      <Back />
      <div>
        <div className="eyebrow">VITALS NOTEBOOK</div>
        <div className="title">{t.vitalsTitle}</div>
      </div>
      <Segment<VitalsTab> items={[['bp', L('혈압')], ['glu', L('혈당')]]} value={s.vt} onPick={k => set({ vt: k })} />

      {!vt.last && (
        <div className="col" style={{ borderRadius: 22, padding: 22, background: 'var(--hero)', border: '1px solid rgba(201,164,92,.3)', gap: 8 }}>
          <span className="eyebrow">NO RECORDS YET</span>
          <span className="serif" style={{ fontSize: 18 }}>{L('아직 기록이 없어요')}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.6 }}>{L('아래 버튼으로 첫 기록을 남겨 보세요. 이 휴대폰 안에만 저장돼요.')}</span>
        </div>
      )}
      {vt.last && <div className="col" style={{ borderRadius: 22, padding: 20, background: 'var(--hero)', border: '1px solid rgba(201,164,92,.3)', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.recent} · {vt.last.d} {vt.last.time}</span>
            <span className="display" style={{ fontSize: 52, lineHeight: 0.95, color: 'var(--gold-light)' }}>{vt.last.big}<span style={{ fontSize: 15, color: 'var(--muted)' }}> {vt.unit}</span></span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-body)' }}>{vt.last.sub}</span>
          </div>
          <Badge b={vt.last} style={{ fontSize: 11.5, padding: '4px 11px' }} />
        </div>
        <div style={{ position: 'relative', height: CHART_H, marginTop: 4 }} aria-hidden>
          {vt.refs.map(r => (
            <div key={r.l} style={{ position: 'absolute', left: 0, right: 0, bottom: r.b, borderTop: '1px dashed rgba(201,164,92,.3)' }}>
              <span style={{ position: 'absolute', right: 0, top: -15, fontSize: 9.5, color: 'var(--faint)' }}>{r.l}</span>
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            {vt.cols.map((c, i) => (
              <div key={i} style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', marginLeft: -4, width: 8, bottom: c.b, height: c.h, borderRadius: 4, background: c.bg }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: -8 }}>
          {vt.cols.map((c, i) => <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--faint)' }}>{c.d}</span>)}
        </div>
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {vt.stats.map(r => (
          <div key={r.k} style={{ borderRadius: 14, padding: '12px 6px', background: 'var(--card)', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>{r.v}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.k}</div>
          </div>
        ))}
      </div>

      <div style={{ borderLeft: '2px solid #c9a45c', padding: '2px 0 2px 14px', fontSize: 12.5, lineHeight: 1.7, color: 'var(--ink-body)' }}>{vt.note}</div>

      {vt.rows.length > 0 && <div className="col" style={{ gap: 8 }}>
        <div className="label">{t.records}</div>
        {vt.rows.map((r, i) => (
          <div key={vt.rows.length - i} className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--card)' }}>
            <div style={{ width: 46, flex: 'none' }}>
              <div style={{ fontSize: 12.5, color: 'var(--gold-light)' }}>{r.d}</div>
              <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>{r.time}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="display" style={{ fontSize: 22 }}>{r.big}</span> <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.sub}</span>
            </div>
            <Badge b={r} style={{ fontSize: 10.5 }} />
          </div>
        ))}
      </div>}
      <button className="btn-gold" onClick={() => set({ sheet: true })}>+ {vt.addLabel}</button>
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
    if (isBp) { edit(m => ({ bp: [{ d, time, s: +f.s || 0, di: +f.di || 0, p: +f.p || 0 }, ...m.bp].slice(0, 400) })); set({ sheet: false }); }
    else { edit(m => ({ glu: [{ d, time, v: +f.v || 0, when: f.when }, ...m.glu].slice(0, 400) })); set({ sheet: false }); }
    flash(isBp ? F('혈압 {0}/{1}을 기록했어요', f.s, f.di) : F('혈당 {0} mg/dL을 기록했어요', f.v));
  };
  const circle = { width: 44, height: 44, borderRadius: '50%', fontSize: 20 };
  return (
    <Sheet onClose={() => set({ sheet: false })} gap={16}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{vt.addLabel}</span>
        <Badge b={status} style={{ fontSize: 11.5, padding: '3px 10px' }} />
      </div>
      {!isBp && (
        <div style={{ display: 'flex', gap: 6 }}>
          {WHEN.map(w => (
            <Chip key={w} on={f.when === w} onClick={() => set(x => ({ form: { ...x.form, when: w } }))} style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 12.5 }}>{L(w)}</Chip>
          ))}
        </div>
      )}
      {fields.map(([k, l, u]) => (
        <div key={k} className="row" style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(241,234,217,.07)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>{L(l)}</div>
            <div style={{ fontSize: 11, color: 'var(--faint)' }}>{u}</div>
          </div>
          <button aria-label={`${L(l)} −`} className="stepper" style={circle} onClick={bump(k, -1)}>−</button>
          <input value={f[k]} inputMode="numeric" aria-label={L(l)} className="display"
            onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); set(x => ({ form: { ...x.form, [k]: v } })); }}
            style={{ width: 76, height: 44, textAlign: 'center', background: 'transparent', border: 0, color: 'var(--gold-light)', fontSize: 34, outline: 'none' }} />
          <button aria-label={`${L(l)} +`} className="stepper" style={circle} onClick={bump(k, 1)}>+</button>
        </div>
      ))}
      <button className="btn-gold" style={{ height: 52, fontSize: 15 }} onClick={save}>{t.save}</button>
    </Sheet>
  );
}
