import type { CSSProperties } from 'react';
import { bpSt, gluSt } from '../data';
import { slotViews, trBadge } from '../derive';
import { dayKey, useApp } from '../state';
import type { Screen } from '../config';
import { Badge, Dot } from '../ui';
import { AdSlot } from './Chrome';

const LANG_CODE = { ko: 'KO', en: 'EN', zh: '中', ja: '日' } as const;
const NEXT_LANG = { ko: 'en', en: 'zh', zh: 'ja', ja: 'ko' } as const;
const LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' } as const;

const QUICK: { t: string; en: string; r: string; rot: string; go: Screen }[] = [
  { t: '처방약 스캔', en: 'SCAN', r: '2px', rot: 'none', go: 'scan' },
  { t: '증상 체크', en: 'SYMPTOM', r: '50%', rot: 'none', go: 'symptom' },
  { t: '복약 일정', en: 'REMINDERS', r: '0', rot: 'rotate(45deg)', go: 'schedule' },
  { t: '병원·약국 찾기', en: 'NEARBY', r: '50% 50% 50% 0', rot: 'rotate(-45deg)', go: 'pharmacy' },
];

const ring: CSSProperties = { width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export function Home() {
  const { s, me, set, edit, go, tab, flash, t, L, F, showFound } = useApp();
  const slots = slotViews(s, me).filter(x => x.meds.length);
  const next = slots.find(x => !x.taken);
  const doneCount = slots.filter(x => x.taken).length;
  const bp = me.bp[0], glu = me.glu[0];
  const now = new Date();
  const h = now.getHours();
  const greet = L(h < 12 ? '좋은 아침이에요,' : h < 18 ? '좋은 오후예요,' : '편안한 저녁이에요,');
  const who = me.name ? L(me.name) + t.nim : L('오늘도 건강하세요');
  const dateStr = now.toLocaleDateString(LOCALE[s.lang], { month: 'long', day: 'numeric', weekday: 'long' });
  const initial = (me.name || L(me.rel)).slice(0, 1);
  const lastScan = me.scans[0];

  const takeNext = () => {
    if (!next) return;
    edit(m => { const k = dayKey(); return { taken: { ...m.taken, [k]: [...(m.taken[k] || []), next.k] } }; });
    flash(F('{0} {1} 복용을 기록했어요', next.time, L(next.label)));
  };

  return (
    <div className="screen tab">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="display" style={{ fontSize: 15, letterSpacing: '.32em', color: 'var(--gold)', fontWeight: 600 }}>MEDISCAN PRO</div>
        <div className="row" style={{ gap: 10 }}>
          <button aria-label="Language" onClick={() => set(x => ({ lang: NEXT_LANG[x.lang] }))} className="display"
            style={{ height: 36, padding: '0 12px', borderRadius: 18, border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'center', fontWeight: 600, letterSpacing: '.12em', fontSize: 13, color: 'var(--gold-light)' }}>
            {LANG_CODE[s.lang]}
          </button>
          <button aria-label={t.sched} onClick={() => go('schedule')} style={ring}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
          </button>
          <button aria-label="My" onClick={() => tab('my')} className="serif"
            style={{ ...ring, border: 0, background: 'linear-gradient(140deg,#e8d39a,#a8843f)', color: 'var(--bg)', fontWeight: 700, fontSize: 14 }}>
            {initial}
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{dateStr}</div>
        <div className="serif" style={{ fontSize: 25, lineHeight: 1.35, fontWeight: 600, marginTop: 4 }}>
          {greet}<br />{who}
        </div>
      </div>

      {!me.meds.length ? (
        <div className="hero col" style={{ padding: 20, gap: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(201,164,92,.18)' }} />
          <span className="eyebrow">GET STARTED</span>
          <span className="serif" style={{ fontSize: 19, lineHeight: 1.45 }}>{L('먹고 있는 약을 등록해 보세요')}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.6 }}>{L('처방전·약봉투를 찍거나, 약 상자 바코드를 비추거나, 이름으로 찾을 수 있어요.')}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn-gold" style={{ flex: 1, height: 46 }} onClick={() => go('scan')}>{L('스캔하기')}</button>
            <button className="btn-line" style={{ flex: 1, height: 46 }} onClick={() => tab('search')}>{L('이름으로 찾기')}</button>
          </div>
        </div>
      ) : next ? (
        <div className="hero col" style={{ padding: 20, gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(201,164,92,.18)' }} />
          <div style={{ position: 'absolute', right: -12, top: -12, width: 94, height: 94, borderRadius: '50%', border: '1px solid rgba(201,164,92,.14)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">NEXT DOSE</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{L(next.label)}</span>
          </div>
          <div className="display" style={{ fontSize: 54, lineHeight: 1, color: 'var(--gold-light)', fontWeight: 500 }}>{next.time}</div>
          <div className="col" style={{ gap: 8 }}>
            {next.meds.map(dr => (
              <div key={dr.key} className="row" style={{ gap: 10, fontSize: 14 }}>
                <Dot color={dr.color} ring />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dr.name}</span>
              </div>
            ))}
          </div>
          <button className="btn-gold" onClick={takeNext} style={{ marginTop: 4, height: 48, fontSize: 15, letterSpacing: '.02em', position: 'relative' }}>{t.done}</button>
        </div>
      ) : (
        <div className="col" style={{ borderRadius: 22, padding: 22, border: '1px solid rgba(201,164,92,.35)', background: 'var(--card)', gap: 6 }}>
          <span className="eyebrow">ALL DONE</span>
          <span className="serif" style={{ fontSize: 19 }}>{t.allDone}</span>
          <button onClick={() => edit(m => ({ taken: { ...m.taken, [dayKey()]: [] } }))}
            style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', alignSelf: 'flex-start' }}>{t.undo}</button>
        </div>
      )}

      {slots.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>{t.today}</span>
            <span style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{doneCount} / {slots.length}{t.times}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${slots.length},1fr)`, gap: 6 }}>
            {slots.map(x => <div key={x.k} style={{ height: 4, borderRadius: 2, background: x.taken ? '#c9a45c' : 'rgba(201,164,92,.18)' }} />)}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUICK.map(q => (
          <button key={q.en} onClick={() => go(q.go)} className="card card-line hoverable col" style={{ padding: 16, gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(201,164,92,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: 9, height: 9, background: 'var(--gold)', borderRadius: q.r, transform: q.rot }} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{L(q.t)}</div>
              <div className="display" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, letterSpacing: '.08em', fontWeight: 600 }}>{q.en}</div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => go('vitals')} className="card card-line hoverable" style={{ overflow: 'hidden', display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>{t.notebook}</span>
          <span className="display" style={{ fontSize: 11.5, letterSpacing: '.14em', color: 'var(--gold)', fontWeight: 600 }}>VITALS ›</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 0 14px' }}>
          <div className="col" style={{ padding: '0 16px', gap: 4, borderRight: '1px solid rgba(241,234,217,.08)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.bp}{bp ? ' · ' + bp.time : ''}</span>
            {bp ? <>
              <span className="display" style={{ fontSize: 30, lineHeight: 1 }}>{bp.s}<span style={{ color: 'var(--faint)' }}>/</span>{bp.di}</span>
              <Badge b={trBadge(bpSt(bp.s, bp.di), L)} style={{ alignSelf: 'flex-start', fontSize: 10.5 }} />
            </> : <span style={{ fontSize: 13, color: 'var(--faint)', padding: '8px 0' }}>{L('기록 없음')}</span>}
          </div>
          <div className="col" style={{ padding: '0 16px', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.glu}{glu ? ' · ' + L(glu.when) : ''}</span>
            {glu ? <>
              <span className="display" style={{ fontSize: 30, lineHeight: 1 }}>{glu.v}<span style={{ fontSize: 13, color: 'var(--faint)' }}> mg/dL</span></span>
              <Badge b={trBadge(gluSt(glu.v, glu.when), L)} style={{ alignSelf: 'flex-start', fontSize: 10.5 }} />
            </> : <span style={{ fontSize: 13, color: 'var(--faint)', padding: '8px 0' }}>{L('기록 없음')}</span>}
          </div>
        </div>
      </button>

      {lastScan && (
        <button onClick={() => showFound(lastScan)} className="card card-line row" style={{ padding: 16, gap: 14 }}>
          <div style={{ width: 46, height: 56, borderRadius: 8, background: 'var(--hatch)', border: '1px solid rgba(201,164,92,.25)', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: 'var(--gold)' }}>{L('최근 스캔')} · {new Date(lastScan.at).toLocaleDateString(LOCALE[s.lang], { month: 'short', day: 'numeric' })}</div>
            <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastScan.found.map(f => f.name).join(', ')}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{F('{0}개 약', lastScan.found.length)}</div>
          </div>
          <span className="chev">›</span>
        </button>
      )}
      <AdSlot />
      <div className="fine">{t.disclaimer}</div>
    </div>
  );
}
