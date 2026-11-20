import { useState } from 'react';
import { adherence } from '../derive';
import { dayKey, dayPlus, medsOn, useApp } from '../state';
import { SLOT_KEYS, SLOT_SHORT, type SlotKey } from '../data';
import { Back, Heading, SecHead, Stats } from '../ui';
import { ChevronRight } from '../icons';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const KIND: Record<string, string> = { rx: '처방전', photo: '사진', barcode: '바코드', qr: 'QR', pill: '알약' };

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
      {me.meds.length > 0 && (
        <button className="tap hov row" onClick={() => go('doselog')} style={{ justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)', marginTop: -6 }}>
          <span className="col" style={{ gap: 2, alignItems: 'flex-start' }}>
            <span className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{L('날짜별 복약 기록')}</span>
            <span className="sub" style={{ fontSize: 12 }}>{L('먹은 시간을 눌러 기록을 고칠 수 있어요')}</span>
          </span>
          <ChevronRight />
        </button>
      )}
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
                <button className="tap hov" onClick={() => { if (!editing) showFound(sc, false); }}
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
  const { me, edit, flash, t, L } = useApp();
  const [ask, setAsk] = useState<number | null>(null);
  const dropSym = (i: number) => { edit(m => ({ syms: m.syms.filter((_, j) => j !== i) })); setAsk(null); flash(L('기록을 지웠어요')); };
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
          <div key={i} className="col" style={{ borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ display: 'flex', gap: 12, padding: '12px 0', fontSize: 13.5, alignItems: 'center' }}>
              <span className="g tnum" style={{ color: 'var(--color-accent-700)', width: 44, flex: 'none', fontWeight: 700 }}>{x.d}</span>
              <span className="serif" style={{ flex: 1 }}>{x.text}</span>
              <span className="muted" style={{ fontSize: 12, maxWidth: 110, textAlign: 'right', fontStyle: 'italic' }}>{x.drugs}</span>
              <button className="no-print" aria-label={L('지우기')} onClick={() => setAsk(a => a === i ? null : i)}
                style={{ width: 32, height: 32, flex: 'none', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-divider)', color: 'var(--color-accent-800)', fontSize: 14, background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            {ask === i && (
              <div className="row no-print" style={{ gap: 8, padding: '10px 12px', marginBottom: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)' }}>
                <span className="serif" style={{ flex: 1, fontSize: 13 }}>{L('이 증상 기록을 지울까요?')}</span>
                <button className="btn btn-secondary" onClick={() => setAsk(null)} style={{ height: 32 }}>{L('취소')}</button>
                <button className="btn btn-primary" onClick={() => dropSym(i)} style={{ height: 32 }}>{L('지우기')}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-primary cta" onClick={() => window.print()}>{L('인쇄하거나 PDF로 저장')}</button>
    </div>
  );
}

/**
 * Taken log by day: tap a time of day to mark it taken or not. Unlike the home button (only within
 * 2 hours of the dose time), past days can be corrected here, e.g. a dose taken but not pressed.
 */
export function DoseLog() {
  const { me, edit, flash, L, F, s } = useApp();
  const today = dayKey();
  const start = me.since || Object.keys(me.taken).sort()[0] || today;
  const days: string[] = [];
  for (let i = 0; i < 31; i++) { const k = dayPlus(-i); if (k < start) break; days.push(k); }
  const toggle = (d: string, k: SlotKey) => {
    const on = (me.taken[d] || []).includes(k);
    edit(m => { const cur = m.taken[d] || []; return { taken: { ...m.taken, [d]: on ? cur.filter(x => x !== k) : SLOT_KEYS.filter(x => x === k || cur.includes(x)) } }; });
    flash(on ? L('먹지 않은 것으로 고쳤어요') : L('먹은 것으로 고쳤어요'));
  };
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[s.lang], { month: 'short', day: 'numeric', weekday: 'short' });
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="DOSE LOG" title={L('날짜별 복약 기록')} sub={L('먹은 시간은 ✓로 표시돼요. 잘못 눌렀거나 먹고 누르지 못했다면 눌러서 고쳐 주세요.')} size={24} />
      <div className="col rule-top">
        {!days.length && <div className="empty" style={{ marginTop: 14 }}>{L('아직 복약 기록이 없어요')}</div>}
        {days.map(d => {
          const planned = SLOT_KEYS.filter(k => medsOn(me.meds, d).some(m => m.slots.includes(k)));
          const taken = me.taken[d] || [];
          const done = planned.filter(k => taken.includes(k)).length;
          if (!planned.length) return null;
          return (
            <div key={d} className="col" style={{ gap: 8, padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="serif" style={{ fontSize: 14.5, fontWeight: 600 }}>{d === today ? `${fmt(d)} · ${L('오늘')}` : fmt(d)}</span>
                <span className="tnum" style={{ fontSize: 12.5, color: done === planned.length ? 'var(--color-accent-700)' : 'var(--color-neutral-600)' }}>{F('{0} / {1} 복용', done, planned.length)}</span>
              </div>
              <div role="group" aria-label={fmt(d)} style={{ display: 'grid', gridTemplateColumns: `repeat(${planned.length}, 1fr)`, gap: 6 }}>
                {planned.map(k => {
                  const on = taken.includes(k);
                  return (
                    <button key={k} aria-pressed={on} onClick={() => toggle(d, k)} className={'pick' + (on ? ' on' : '')} style={{ minHeight: 40, padding: '6px 2px' }}>
                      <span className="serif" style={{ fontSize: 13.5, fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{L(SLOT_SHORT[k])}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fine">{L('복약률과 도장은 고친 기록으로 다시 계산돼요.')}</div>
    </div>
  );
}
