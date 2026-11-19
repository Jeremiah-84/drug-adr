import { adherence } from '../derive';
import { useApp } from '../state';
import { Back, Heading } from '../ui';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const KIND: Record<string, string> = { rx: '처방전', photo: '사진', barcode: '바코드', pill: '알약' };

export function History() {
  const { me, go, showFound, t, L, F } = useApp();
  const wk = adherence(me, 7);
  const labels = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return DAYS[d.getDay()]; });
  return (
    <div className="screen tab">
      <div>
        <div className="eyebrow">RECORDS</div>
        <div className="title" style={{ fontSize: 24 }}>{t.records}</div>
      </div>
      <button onClick={() => go('report')} className="col"
        style={{ borderRadius: 22, padding: 18, background: 'var(--hero)', border: '1px solid rgba(201,164,92,.3)', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', alignSelf: 'stretch' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t.weekRate}</span>
          <span style={{ fontSize: 12.5, color: 'var(--gold)' }}>{t.reportLink}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, alignSelf: 'stretch' }}>
          <span className="display" style={{ fontSize: 52, lineHeight: 0.9, color: 'var(--gold-light)' }}>{wk.pct === null ? '—' : wk.pct}{wk.pct !== null && <span style={{ fontSize: 24 }}>%</span>}</span>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', height: 56 }}>
            {wk.per.map((p, i) => (
              <div key={i} className="col" style={{ alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: Math.max(3, Math.round((p ?? 0) * 0.44)), borderRadius: 4, background: p === null ? 'rgba(201,164,92,.18)' : i === 6 ? 'rgba(201,164,92,.55)' : '#c9a45c' }} />
                <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>{L(labels[i])}</span>
              </div>
            ))}
          </div>
        </div>
        {wk.pct === null && <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'flex-start' }}>{L('홈에서 "복용 완료"를 누르면 여기에 쌓여요')}</span>}
      </button>
      <div className="label">{t.scanRec}</div>
      {!me.scans.length && <div style={{ border: '1px dashed rgba(201,164,92,.3)', borderRadius: 16, padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>{L('아직 스캔 기록이 없어요')}</div>}
      <div className="col" style={{ gap: 10 }}>
        {me.scans.map(sc => {
          const d = new Date(sc.at);
          return (
            <button key={sc.at} onClick={() => showFound(sc)} className="row" style={{ gap: 14, padding: 14, borderRadius: 16, background: 'var(--card)' }}>
              <div style={{ width: 46, flex: 'none', textAlign: 'center' }}>
                <div className="display" style={{ fontSize: 24, color: 'var(--gold-light)', lineHeight: 1 }}>{String(d.getDate()).padStart(2, '0')}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{MON[d.getMonth()]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.found.map(f => f.name).join(', ')}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{F('{0}개 약', sc.found.length)}</div>
              </div>
              <span className="kind" style={{ flex: 'initial' }}>{L(KIND[sc.kind])}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Report() {
  const { me, t, L } = useApp();
  const now = new Date();
  const days = now.getDate();
  const m = adherence(me, days);
  const pct = m.pct ?? 0;
  const stats = [{ v: m.done, k: '복용 완료' }, { v: m.missed, k: '누락' }, { v: me.syms.length, k: '증상 기록' }];
  return (
    <div className="screen">
      <Back />
      <Heading eyebrow={`HEALTH REPORT · ${MON[now.getMonth()]}`} title={L('이번 달 건강 리포트')} sub={me.meds.map(x => x.name).join(', ') || undefined} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <div style={{ width: 190, height: 190, borderRadius: '50%', background: `conic-gradient(#c9a45c 0 ${pct}%,rgba(201,164,92,.14) ${pct}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="col" style={{ width: 170, height: 170, borderRadius: '50%', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span className="display" style={{ fontSize: 56, color: 'var(--gold-light)', lineHeight: 1 }}>{m.pct === null ? '—' : m.pct}{m.pct !== null && <span style={{ fontSize: 24 }}>%</span>}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.monthRate}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {stats.map(r => (
          <div key={r.k} style={{ borderRadius: 14, padding: 12, background: 'var(--card)', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 26, lineHeight: 1.1 }}>{r.v}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{L(r.k)}</div>
          </div>
        ))}
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{t.symLog}</div>
        {!me.syms.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{L('증상 체크에서 "이 증상 기록해 두기"를 누르면 여기에 남아요')}</div>}
        {me.syms.map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--card)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--gold)', width: 44, flex: 'none' }}>{x.d}</span>
            <span style={{ flex: 1 }}>{x.text}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 120, textAlign: 'right' }}>{x.drugs}</span>
          </div>
        ))}
      </div>
      <button className="btn-gold" onClick={() => window.print()}>{L('인쇄하거나 PDF로 저장')}</button>
    </div>
  );
}
