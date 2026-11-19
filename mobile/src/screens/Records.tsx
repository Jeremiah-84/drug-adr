import { useApp } from '../state';
import { Back, Heading } from '../ui';

const WEEK: [string, number][] = [['월', 100], ['화', 100], ['수', 67], ['목', 100], ['금', 100], ['토', 67], ['일', 33]];
const SCANS = [
  { day: '18', mon: 'NOV', t: '서울내과의원 처방전', s: '4개 약 · 주의 3건', kind: '처방전' },
  { day: '09', mon: 'NOV', t: '타이레놀 8시간 ER', s: '1개 약 · 주의 없음', kind: '바코드' },
  { day: '27', mon: 'OCT', t: '흰색 원형 알약 "YH"', s: '후보 2개', kind: '알약' },
  { day: '14', mon: 'OCT', t: '푸른숲약국 약봉투', s: '3개 약 · 주의 1건', kind: '약봉투' },
];
const REPORT_STATS = [{ v: '83', k: '복용 완료' }, { v: '10', k: '누락' }, { v: '2', k: '증상 기록' }];
const SYMPTOM_LOG = [{ d: '11.12', n: '어지러움', drug: '리리카 의심' }, { d: '11.05', n: '발목 부음', drug: '아모잘탄 의심' }];

export function History() {
  const { go, t, L } = useApp();
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
          <span className="display" style={{ fontSize: 52, lineHeight: 0.9, color: 'var(--gold-light)' }}>92<span style={{ fontSize: 24 }}>%</span></span>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', height: 56 }}>
            {WEEK.map(([d, p], i) => (
              <div key={i} className="col" style={{ alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: Math.round(p * 0.44), borderRadius: 4, background: i === 6 ? 'rgba(201,164,92,.35)' : '#c9a45c' }} />
                <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>{L(d)}</span>
              </div>
            ))}
          </div>
        </div>
      </button>
      <div className="label">{t.scanRec}</div>
      <div className="col" style={{ gap: 10 }}>
        {SCANS.map(sc => (
          <button key={sc.t} onClick={() => go('results')} className="row" style={{ gap: 14, padding: 14, borderRadius: 16, background: 'var(--card)' }}>
            <div style={{ width: 46, flex: 'none', textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 24, color: 'var(--gold-light)', lineHeight: 1 }}>{sc.day}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{sc.mon}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{L(sc.t)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{L(sc.s)}</div>
            </div>
            <span className="kind" style={{ flex: 'initial' }}>{L(sc.kind)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Report() {
  const { flash, t, L } = useApp();
  return (
    <div className="screen">
      <Back />
      <Heading eyebrow="HEALTH REPORT · NOV" title={t.reportTitle} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <div style={{ width: 190, height: 190, borderRadius: '50%', background: 'conic-gradient(#c9a45c 0 89%,rgba(201,164,92,.14) 89% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="col" style={{ width: 170, height: 170, borderRadius: '50%', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span className="display" style={{ fontSize: 56, color: 'var(--gold-light)', lineHeight: 1 }}>89<span style={{ fontSize: 24 }}>%</span></span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.monthRate}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {REPORT_STATS.map(r => (
          <div key={r.k} style={{ borderRadius: 14, padding: 12, background: 'var(--card)', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 26, lineHeight: 1.1 }}>{r.v}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{L(r.k)}</div>
          </div>
        ))}
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{t.symLog}</div>
        {SYMPTOM_LOG.map(x => (
          <div key={x.d} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--card)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--gold)', width: 44, flex: 'none' }}>{x.d}</span>
            <span style={{ flex: 1 }}>{L(x.n)}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{L(x.drug)}</span>
          </div>
        ))}
      </div>
      <button className="btn-gold" onClick={() => flash(L('PDF를 만들었어요 · 다운로드 폴더'))}>{t.pdf}</button>
    </div>
  );
}
