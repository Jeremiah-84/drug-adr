import { useState } from 'react';
import { adherence } from '../derive';
import { useApp } from '../state';
import { Back, Heading, SecHead, Stats } from '../ui';
import { ChevronRight } from '../icons';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const KIND: Record<string, string> = { rx: '처방전', photo: '사진', barcode: '바코드', pill: '알약' };

export function History() {
  const { me, go, showFound, edit, t, L, F } = useApp();
  const [editing, setEditing] = useState(false);
  const [ask, setAsk] = useState<number | 'all' | null>(null);
  const drop = (at: number) => { edit(m => ({ scans: m.scans.filter(x => x.at !== at) })); setAsk(null); if (me.scans.length <= 1) setEditing(false); };
  const dropAll = () => { edit(() => ({ scans: [] })); setAsk(null); setEditing(false); };
  const wk = adherence(me, 7);
  const month = adherence(me, new Date().getDate());
  const labels = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return DAYS[d.getDay()]; });
  return (
    <div className="page" style={{ paddingTop: 16, gap: 22 }}>
      <Heading eyebrow="RECORDS" title={t.records} />
      <button className="tap hov" onClick={() => go('report')}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, padding: '20px 0', borderTop: '1px solid var(--color-text)', borderBottom: '1px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="sub">{t.weekRate} · <span className="link-u">{L('건강 리포트')}</span></span>
          <span className="g tnum" style={{ fontSize: 64, lineHeight: 0.85 }}>{wk.pct === null ? '—' : wk.pct}{wk.pct !== null && <span style={{ fontSize: 26, color: 'var(--color-accent-700)' }}>%</span>}</span>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end', height: 64 }}>
          {wk.per.map((p, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: Math.max(2, Math.round((p ?? 0) * 0.46)), border: `1px solid ${p === null ? 'var(--color-divider)' : 'var(--color-accent)'}`, background: i === 6 || p === null ? 'transparent' : 'color-mix(in srgb,var(--color-accent) 35%,transparent)' }} />
              <span className="muted" style={{ fontSize: 10 }}>{L(labels[i])}</span>
            </div>
          ))}
        </div>
      </button>
      {wk.pct === null && <span className="sub" style={{ marginTop: -12 }}>{L('홈에서 "복용 완료"를 누르면 여기에 쌓여요')}</span>}
      <Stats items={[{ v: String(month.done), k: L('복용 완료') }, { v: String(month.missed), k: L('누락') }, { v: String(me.scans.length), k: L('스캔') }]} />
      <div className="col">
        <SecHead name={t.scanRec} en="SCANS" />
        {me.scans.length > 0 && (
          <div className="row" style={{ justifyContent: 'space-between', paddingTop: 8 }}>
            <span className="sub" style={{ fontSize: 12 }}>{editing ? L('지울 기록의 ✕를 누르세요') : L('편집을 누르면 기록을 지울 수 있어요')}</span>
            <button onClick={() => { setEditing(v => !v); setAsk(null); }} className="tap" style={{ fontSize: 13, color: 'var(--color-accent-700)', fontWeight: editing ? 600 : 400, padding: '4px 0 4px 12px' }}>{editing ? L('완료') : L('편집')}</button>
          </div>
        )}
        {!me.scans.length && <div className="empty" style={{ marginTop: 14 }}>{L('아직 스캔 기록이 없어요')}</div>}
        {me.scans.map(sc => {
          const d = new Date(sc.at);
          return (
            <div key={sc.at} className="col" style={{ borderBottom: '1px solid var(--color-divider)' }}>
              <div className="row" style={{ gap: 10 }}>
                <button className="tap hov" onClick={() => { if (!editing) showFound(sc); }}
                  style={{ flex: 1, minWidth: 0, display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0' }}>
                  <div style={{ width: 40, flex: 'none', textAlign: 'center' }}>
                    <div className="g tnum" style={{ fontSize: 26, lineHeight: 1 }}>{String(d.getDate()).padStart(2, '0')}</div>
                    <div className="g" style={{ fontSize: 10.5, letterSpacing: '.14em', fontWeight: 700, color: 'var(--color-accent-700)' }}>{MON[d.getMonth()]}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif ellip" style={{ fontSize: 14.5, fontWeight: 600 }}>{sc.found.map(f => f.name).join(', ')}</div>
                    <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>{F('{0}개 약', sc.found.length)}</div>
                  </div>
                  <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 3, border: '1px solid var(--color-accent)', color: 'var(--color-accent-700)', flex: 'none' }}>{L(KIND[sc.kind])}</span>
                </button>
                {editing && (
                  <button aria-label={L('지우기')} onClick={() => setAsk(a => a === sc.at ? null : sc.at)}
                    style={{ width: 34, height: 34, flex: 'none', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)', color: 'var(--color-accent-800)', fontSize: 15, background: 'none', cursor: 'pointer' }}>✕</button>
                )}
              </div>
              {ask === sc.at && (
                <div className="row" style={{ gap: 8, padding: '10px 12px', marginBottom: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)' }}>
                  <span className="serif" style={{ flex: 1, fontSize: 13 }}>{L('이 스캔 기록을 지울까요?')}</span>
                  <button className="btn btn-secondary" onClick={() => setAsk(null)} style={{ height: 32 }}>{L('취소')}</button>
                  <button className="btn btn-primary" onClick={() => drop(sc.at)} style={{ height: 32 }}>{L('지우기')}</button>
                </div>
              )}
            </div>
          );
        })}
        {editing && me.scans.length > 1 && (ask === 'all' ? (
          <div className="row" style={{ gap: 8, padding: '10px 12px', marginTop: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)' }}>
            <span className="serif" style={{ flex: 1, fontSize: 13 }}>{F('스캔 기록 {0}개를 모두 지울까요?', me.scans.length)}</span>
            <button className="btn btn-secondary" onClick={() => setAsk(null)} style={{ height: 32 }}>{L('취소')}</button>
            <button className="btn btn-primary" onClick={dropAll} style={{ height: 32 }}>{L('지우기')}</button>
          </div>
        ) : (
          <button className="tap link-u" onClick={() => setAsk('all')} style={{ fontSize: 12.5, alignSelf: 'flex-start', marginTop: 12 }}>{L('스캔 기록 모두 지우기')}</button>
        ))}
      </div>
      <button className="tap hov" onClick={() => go('report')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: '1px solid var(--color-text)', borderBottom: '1px solid var(--color-divider)' }}>
        <span className="serif" style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{L('이번 달 건강 리포트')}</span>
        <span className="sub">{L('진료 때 보여주기')}</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function Report() {
  const { me, t, L } = useApp();
  const now = new Date();
  const m = adherence(me, now.getDate());
  const pct = m.pct ?? 0;
  return (
    <div className="page">
      <Back />
      <Heading eyebrow={`HEALTH REPORT · ${MON[now.getMonth()]}`} title={L('이번 달 건강 리포트')} sub={me.meds.map(x => x.name).join(', ') || undefined} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <div style={{ width: 190, height: 190, borderRadius: '50%', background: `conic-gradient(var(--color-accent) 0 ${pct}%,var(--color-neutral-200) ${pct}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="col" style={{ width: 176, height: 176, borderRadius: '50%', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span className="g tnum" style={{ fontSize: 58, lineHeight: 1 }}>{m.pct === null ? '—' : m.pct}{m.pct !== null && <span style={{ fontSize: 24, color: 'var(--color-accent-700)' }}>%</span>}</span>
            <span className="sub">{t.monthRate}</span>
          </div>
        </div>
      </div>
      <Stats items={[{ v: String(m.done), k: L('복용 완료') }, { v: String(m.missed), k: L('누락') }, { v: String(me.syms.length), k: L('증상 기록') }]} />
      <div className="col">
        <SecHead name={t.symLog} en="SYMPTOMS" />
        {!me.syms.length && <div className="sub" style={{ padding: '12px 0' }}>{L('증상 체크에서 "이 증상 기록해 두기"를 누르면 여기에 남아요')}</div>}
        {me.syms.map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
            <span className="g tnum" style={{ color: 'var(--color-accent-700)', width: 44, flex: 'none', fontWeight: 700 }}>{x.d}</span>
            <span className="serif" style={{ flex: 1 }}>{x.text}</span>
            <span className="muted" style={{ fontSize: 12, maxWidth: 120, textAlign: 'right', fontStyle: 'italic' }}>{x.drugs}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary cta" onClick={() => window.print()}>{L('인쇄하거나 PDF로 저장')}</button>
    </div>
  );
}
