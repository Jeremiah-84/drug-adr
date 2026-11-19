import { bpSt, gluSt } from '../data';
import { slotViews, stampMonth, trBadge, adherence } from '../derive';
import { quizOf, storyOf, pageNo } from '../daily';
import { dayKey, useApp } from '../state';
import type { Screen } from '../config';
import { Badge, SecHead } from '../ui';
import { ChevronRight, Clock, ScanLine, Stethoscope, MapPin } from '../icons';
import { AdSlot } from './Chrome';
import { LangButton } from './People';

const LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' } as const;
const ROMAN = ['I', 'II', 'III', 'IV'];

const QUICK: { t: string; en: string; Icon: typeof ScanLine; go: Screen }[] = [
  { t: '처방약 스캔', en: 'SCAN', Icon: ScanLine, go: 'scan' },
  { t: '증상 체크', en: 'SYMPTOM', Icon: Stethoscope, go: 'symptom' },
  { t: '복약 일정', en: 'SCHEDULE', Icon: Clock, go: 'schedule' },
  { t: '병원·약국 찾기', en: 'NEARBY', Icon: MapPin, go: 'pharmacy' },
];

export function Home() {
  const { s, me, go, tab, flash, t, L, F, showFound, takeSlot, edit } = useApp();
  const slots = slotViews(s, me).filter(x => x.meds.length);
  const next = slots.find(x => x.ss === 'open' || x.ss === 'early');
  const missed = slots.filter(x => x.ss === 'missed');
  const doneCount = slots.filter(x => x.taken).length;
  const allDone = slots.length > 0 && doneCount === slots.length;
  const nOpen = next?.ss === 'open';
  const bp = me.bp[0], glu = me.glu[0];
  const now = new Date();
  const h = now.getHours();
  const greet = L(h < 12 ? '좋은 아침이에요,' : h < 18 ? '좋은 오후예요,' : '편안한 저녁이에요,');
  const who = me.name ? L(me.name) + t.nim : L('오늘도 건강하세요');
  const dateStr = now.toLocaleDateString(LOCALE[s.lang], { month: 'long', day: 'numeric', weekday: 'long' });
  const initial = (me.name || L(me.rel)).slice(0, 1);
  const lastScan = me.scans[0];
  const story = storyOf(me).item, quiz = quizOf(me).item;
  const qDone = s.quiz?.d === dayKey();
  const quizState = !qDone ? '아직 풀지 않음' : s.quiz!.pick === quiz.a ? '정답' : '풀이 완료';
  const stamps = stampMonth(me);
  const z = s.sdk;
  const left = z.cells.filter(v => !v).length;

  const takeNext = () => {
    if (!next) return;
    if (!nOpen) { flash(F('{0}부터 기록할 수 있습니다', next.from)); return; }
    takeSlot(next.k);
    flash(F('{0} {1} 복용을 기록했어요', next.time, L(next.label)));
  };

  return (
    <div style={{ padding: '12px 26px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--color-divider)' }}>
        <span className="g" style={{ fontSize: 15, letterSpacing: '.3em', fontWeight: 700 }}>MEDISCAN</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <LangButton />
          <button className="tap avatar" aria-label="My" onClick={() => tab('my')} style={{ width: 36, height: 36, fontSize: 14 }}>{initial}</button>
        </div>
      </div>

      <div className="head-block">
        <span className="sub">{dateStr}{s.role === 'pro' ? ' · ' + L('의료진용') : ''}</span>
        <span className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.4 }}>{greet}<br />{who}</span>
      </div>

      <button className="tap hov" onClick={() => go('today')}
        style={{ borderTop: '1px solid var(--color-text)', borderBottom: '1px solid var(--color-divider)', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
          <span className="kicker">TODAY'S PAGE</span>
          <span className="g tnum muted" style={{ fontSize: 13, fontWeight: 700 }}>No. {pageNo()}</span>
        </div>
        <span className="serif" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45 }}>{L(story.title)}</span>
        <span className="just" style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--color-neutral-800)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{L(story.lead)}</span>
        <div style={{ display: 'flex', gap: 18, fontSize: 12.5, color: 'var(--color-accent-700)', fontStyle: 'italic', flexWrap: 'wrap' }}>
          <span>{L('오늘의 문제')} · {L(quizState)}</span>{me.meds.length > 0 && <span>{F('장서표 · {0}일', stamps.count)}</span>}
        </div>
      </button>

      {!me.meds.length ? (
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 5, border: '1px solid color-mix(in srgb,var(--color-accent) 30%,transparent)', borderRadius: 2, pointerEvents: 'none' }} />
          <span className="kicker">GET STARTED</span>
          <span className="serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.45 }}>{L('먹고 있는 약을 등록해 보세요')}</span>
          <span className="just" style={{ fontSize: 13, color: 'var(--color-neutral-800)', lineHeight: 1.75 }}>{L('처방전·약봉투를 찍거나, 약 상자 바코드를 비추거나, 이름으로 찾을 수 있어요.')}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, position: 'relative' }}>
            <button className="btn btn-primary cta" style={{ flex: 1 }} onClick={() => go('scan')}>{L('스캔하기')}</button>
            <button className="btn btn-secondary cta" style={{ flex: 1 }} onClick={() => tab('search')}>{L('이름으로 찾기')}</button>
          </div>
        </div>
      ) : next ? (
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 22, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 5, border: '1px solid color-mix(in srgb,var(--color-accent) 30%,transparent)', borderRadius: 2, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="kicker">NEXT DOSE</span>
            <span className="sub">{L(next.label)}</span>
          </div>
          <div className="g tnum" style={{ fontSize: 60, lineHeight: 1, fontWeight: 400 }}>{next.time}</div>
          <div className="col">
            {next.meds.map(dr => (
              <div key={dr.key} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, padding: '9px 0', borderTop: '1px solid var(--color-divider)' }}>
                <span className="pill-swatch" style={{ background: dr.color }} />
                <span className="ellip" style={{ flex: 1, minWidth: 0 }}>{dr.name}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary cta" aria-disabled={!nOpen} onClick={takeNext} style={{ position: 'relative', height: 46 }}>
            {nOpen ? L('복용 완료로 기록') : F('{0}부터 기록할 수 있습니다', next.from)}
          </button>
          <span className="sub" style={{ fontSize: 12, textAlign: 'center', marginTop: -6 }}>
            {nOpen ? F('{0}까지 기록할 수 있습니다', next.until) : F('설정 시간 {0} 전후 {1}시간 안에만 누를 수 있습니다', next.time, 2)}
          </span>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="kicker">ALL DONE</span>
          <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{L(allDone ? '오늘 복용을 모두 마쳤습니다' : '오늘 남은 복약이 없습니다')}</span>
          {allDone && <button className="tap" onClick={() => go('today')} style={{ fontSize: 13, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{F('오늘의 장서표가 찍혔습니다 · {0}월 {1}일째', stamps.month, stamps.count)}</button>}
          {doneCount > 0 && <button className="tap link-u" onClick={() => edit(m => ({ taken: { ...m.taken, [dayKey()]: [] } }))} style={{ fontSize: 12.5, alignSelf: 'flex-start' }}>{t.undo}</button>}
        </div>
      )}
      {missed.length > 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)', fontStyle: 'italic', marginTop: -10 }}>
          {F('기록 시간을 놓친 복약 · {0}', missed.map(x => L(x.label)).join(', '))}
        </div>
      )}

      {slots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="muted">{t.today}</span>
            <span className="tnum" style={{ color: 'var(--color-accent-700)' }}>{doneCount} / {slots.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${slots.length},minmax(0,1fr))`, gap: 10 }}>
            {slots.map((sl, i) => (
              <div key={sl.k} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ height: 2, width: '100%', background: sl.taken ? 'var(--color-accent)' : sl.ss === 'missed' ? 'var(--color-accent-800)' : 'var(--color-divider)', opacity: sl.ss === 'missed' ? 0.4 : 1 }} />
                <span className="g" style={{ fontSize: 13, fontWeight: 700, color: sl.taken ? 'var(--color-accent-700)' : 'var(--color-neutral-500)' }}>{ROMAN[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderTop: '1px solid var(--color-divider)', borderLeft: '1px solid var(--color-divider)' }}>
        {QUICK.map(({ t: label, en, Icon, go: to }) => (
          <button key={en} className="tap hov6" onClick={() => go(to)}
            style={{ padding: '18px 16px', borderRight: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Icon stroke="var(--color-accent)" />
            <div>
              <div className="serif" style={{ fontSize: 14.5, fontWeight: 600 }}>{L(label)}</div>
              <div className="g muted" style={{ fontSize: 11.5, letterSpacing: '.14em', fontWeight: 700, marginTop: 2 }}>{en}</div>
            </div>
          </button>
        ))}
      </div>

      <button className="tap col" onClick={() => go('vitals')}>
        <div className="sec-head" style={{ width: '100%' }}><span className="name">{L('혈압 · 당뇨 수첩')}</span><span className="tag-en">VITALS</span></div>
        <div className="hov" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', padding: '16px 0', borderBottom: '1px solid var(--color-divider)', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 14 }}>
            <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{t.bp}{bp ? ' · ' + bp.time : ''}</span>
            {bp ? <>
              <span className="g tnum" style={{ fontSize: 32, lineHeight: 1 }}>{bp.s}<span style={{ color: 'var(--color-neutral-500)' }}>/</span>{bp.di}</span>
              <Badge b={trBadge(bpSt(bp.s, bp.di), L)} style={{ fontSize: 10.5, padding: '1px 8px' }} />
            </> : <span className="muted" style={{ fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>{L('기록 없음')}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, borderLeft: '1px solid var(--color-divider)' }}>
            <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{t.glu}{glu ? ' · ' + L(glu.when) : ''}</span>
            {glu ? <>
              <span className="g tnum" style={{ fontSize: 32, lineHeight: 1 }}>{glu.v}<span className="muted" style={{ fontSize: 13 }}> mg/dL</span></span>
              <Badge b={trBadge(gluSt(glu.v, glu.when), L)} style={{ fontSize: 10.5, padding: '1px 8px' }} />
            </> : <span className="muted" style={{ fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>{L('기록 없음')}</span>}
          </div>
        </div>
      </button>

      {s.members.length > 1 && (
        <div className="col">
          <SecHead name={L('가족 복약 확인')} en="FAMILY" onClick={() => go('family')} />
          {s.members.map(m => {
            const sv = slotViews(s, m).filter(x => x.meds.length);
            const miss = sv.find(x => x.ss === 'missed');
            const done = sv.filter(x => x.taken).length;
            const rate = adherence(m, 7).pct;
            return (
              <button key={m.id} className="tap hov" onClick={() => go('family')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <span className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{(m.name || L(m.rel)).slice(0, 1)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 14 }}>{m.name || L(m.rel)} {m.name && <span className="muted" style={{ fontSize: 12 }}>· {L(m.rel)}</span>}</div>
                  <div style={{ fontSize: 12, fontStyle: 'italic', color: miss ? 'var(--color-accent-800)' : 'var(--color-neutral-600)' }}>
                    {!sv.length ? L('등록한 약 없음') : miss ? F('오늘 {0} 복용 누락', L(miss.label)) : done === sv.length ? L('오늘 복용 완료') : F('오늘 {0}/{1} 복용', done, sv.length)}
                  </div>
                </div>
                <span className="g tnum" style={{ fontSize: 22 }}>{rate === null ? '—' : rate + '%'}</span>
              </button>
            );
          })}
        </div>
      )}

      <button className="tap hov" onClick={() => go('puzzle')}
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-text)', borderBottom: '1px solid var(--color-divider)' }}>
        <div style={{ width: 52, height: 52, flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1.5px solid var(--color-text)' }}>
          {[5, '', 3, '', 1, '', 7, '', 9].map((v, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Lora',serif", fontSize: 11, fontWeight: 600, borderRight: i % 3 < 2 ? '1px solid var(--color-divider)' : 'none', borderBottom: i < 6 ? '1px solid var(--color-divider)' : 'none', color: 'var(--color-accent-700)' }}>{v}</span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('두뇌 쉼터 · 매일 새 퍼즐')}</div>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{L('오늘의 스도쿠')}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{z.end ? F('오늘 완성 · 힌트 {0}번', z.hints) : F('{0}칸 남았습니다', left)}</div>
        </div>
        <ChevronRight />
      </button>

      {lastScan && (
        <button className="tap" onClick={() => showFound(lastScan)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
          <div className="plate" style={{ width: 52, height: 64, flex: 'none', background: 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-100) 5px 10px)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('최근 스캔')} · {new Date(lastScan.at).toLocaleDateString(LOCALE[s.lang], { month: 'short', day: 'numeric' })}</div>
            <div className="serif ellip" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{lastScan.found.map(f => f.name).join(', ')}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>{F('{0}개 약', lastScan.found.length)}</div>
          </div>
          <ChevronRight />
        </button>
      )}
      <AdSlot />
      <div className="fine" style={{ paddingTop: 14, borderTop: '1px solid var(--color-divider)' }}>{t.disclaimer}</div>
    </div>
  );
}
