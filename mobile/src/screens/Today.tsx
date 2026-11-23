import { dayKey, dayPlus, useApp } from '../state';
import { fmtDay } from './Drugs';
import { pageNo, quizOf, storyOf } from '../daily';
import { stampMonth } from '../derive';
import { Back } from '../ui';
import { DiaryCalendar, diaryMonthName } from './Diary';
import type { ReactNode } from 'react';

function Section({ n, title, en, children, gap = 12 }: { n: string; title: string; en: string; children: ReactNode; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {/* The title keeps its words together; a long English name drops to its own line instead of
          squeezing the title into one letter per line. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 2, paddingBottom: 10, borderBottom: '1px solid var(--color-text)' }}>
        <span className="g" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>{n}</span>
        <span className="serif" style={{ fontSize: 15, fontWeight: 600, flex: '1 0 auto', wordBreak: 'keep-all' }}>{title}</span>
        <span className="g muted" style={{ fontSize: 12, letterSpacing: '.16em', fontWeight: 700, marginLeft: 'auto', textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{en}</span>
      </div>
      {children}
    </div>
  );
}

const KEYS = ['A', 'B', 'C', 'D'];

export function Today() {
  const { s, me, set, L, F } = useApp();
  const st = storyOf(me), story = st.item, quiz = quizOf(me).item;
  const picked = s.quiz?.d === dayKey() ? s.quiz.pick : null, done = picked !== null;
  const sm = stampMonth(me);
  const [vy, vm] = s.diaryYM, vsm = vy === sm.year && vm === sm.month - 1 ? sm : stampMonth(me, vy, vm);
  // Prescriptions with a last day, still running or finished within the last week.
  const ending = me.meds.filter(m => m.until && m.until >= dayPlus(-7)).sort((a, b) => a.until!.localeCompare(b.until!));
  const taken = sm.todayDone, count = sm.count;
  const dateStr = new Date().toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[s.lang], { month: 'long', day: 'numeric', weekday: 'long' });
  const para = { fontSize: 13.5, lineHeight: 1.9, color: 'var(--color-neutral-800)' } as const;

  return (
    <div className="page" style={{ paddingBottom: 34, gap: 26 }}>
      <Back />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center', alignItems: 'center' }}>
        <span className="kicker tnum" style={{ letterSpacing: '.3em' }}>TODAY'S PAGE · No. {pageNo()}</span>
        <span className="title">{L('오늘의 페이지')}</span>
        <span className="sub">{dateStr} · {L('매일 새로 넘겨집니다')}</span>
        <div style={{ width: 40, height: 1, background: 'var(--color-accent)', marginTop: 6 }} />
      </div>

      <Section n="I." title={L('오늘의 약 이야기')} en={story.en}>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5 }}>{L(story.title)}</span>
        <span className="just" style={para}>{L(story.lead)}</span>
        <span className="just" style={para}>{L(story.body)}</span>
        <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.7 }}>{st.mine ? L('내가 먹는 약') + ' · ' : ''}{L('약의 유래를 소개하는 읽을거리입니다. 복용법은 첨부문서와 의사·약사의 안내를 따르세요.')}</span>
      </Section>

      <Section n="II." title={L('오늘의 문제')} en="QUIZ">
        <span className="serif" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.6 }}>{L(quiz.q)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quiz.o.map((o, i) => {
            const right = done && i === quiz.a, wrong = done && i === picked && i !== quiz.a;
            return (
              <button key={i} className="tap hov6" disabled={done} onClick={() => set({ quiz: { d: dayKey(), pick: i } })}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: `1px solid ${right ? 'var(--color-accent)' : 'var(--color-divider)'}`, borderRadius: 'var(--radius-md)', color: wrong ? 'var(--color-neutral-600)' : 'var(--color-text)', cursor: done ? 'default' : 'pointer' }}>
                <span className="g" style={{ width: 16, fontSize: 16, fontWeight: 700, color: 'var(--color-accent)' }}>{KEYS[i]}</span>
                <span style={{ flex: 1, fontSize: 14, textDecoration: wrong ? 'line-through' : 'none' }}>{L(o)}</span>
                <span style={{ fontSize: 11.5, fontStyle: 'italic', color: right ? 'var(--color-accent-700)' : 'var(--color-neutral-600)' }}>{right ? L('정답') : wrong ? L('내 선택') : ''}</span>
              </button>
            );
          })}
        </div>
        {done && (
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--color-accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="serif" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent-800)' }}>
              {picked === quiz.a ? L('정답입니다.') : F('아쉽네요. 정답은 {0}입니다.', KEYS[quiz.a])}
            </span>
            <span className="just" style={{ ...para, lineHeight: 1.85 }}>{L(quiz.why)}</span>
            <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{L(quiz.src)} · {L('내일 새 문제가 나옵니다')}</span>
          </div>
        )}
      </Section>

      <Section n="III." title={L('복약 다이어리')} en={diaryMonthName(vm)} gap={14}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--color-neutral-800)', maxWidth: 200 }}>{L('하루 복약을 모두 지키면 도장이 찍힙니다.')}</span>
          <span className="g tnum" style={{ fontSize: 40, lineHeight: 0.9, whiteSpace: 'nowrap' }}>{vsm.count}<span className="muted" style={{ fontSize: 18 }}> / {vsm.total}</span></span>
        </div>
        <DiaryCalendar />
        {ending.length > 0 && (
          <div className="col" style={{ gap: 6, padding: '10px 0', borderTop: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)' }}>
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="cal-end" style={{ position: 'static' }}>{L('끝')}</span>{L('처방받은 약이 끝나는 날')}</span>
            {ending.map(m => {
              const left = Math.round((new Date(m.until + 'T12:00:00').getTime() - new Date(dayKey() + 'T12:00:00').getTime()) / 86400000);
              return (
                <div key={m.key} className="row" style={{ justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                  <span className="serif ellip" style={{ flex: 1, minWidth: 0 }}>{m.name}</span>
                  <span className="tnum" style={{ flex: 'none', color: left < 0 ? 'var(--color-neutral-600)' : 'var(--color-accent-700)' }}>
                    {F('{0}까지', fmtDay(m.until!, s.lang))} · {left < 0 ? L('끝남') : left === 0 ? L('오늘까지') : F('{0}일 남음', left)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {vsm === sm && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 1, background: 'var(--color-divider)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: -1, height: 3, width: Math.round(count / sm.total * 100) + '%', background: 'var(--color-accent)' }} />
          </div>
          <span className="muted" style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.7 }}>
            {!me.meds.length ? L('약을 등록하고 복용을 기록하면 날마다 도장이 찍힙니다.')
              : taken ? F('오늘 도장이 찍혔습니다. 한 달을 모두 채우면 장식된 {0}월호 표지가 완성됩니다.', sm.month)
              : F('오늘 남은 복약을 마치면 {0}일에 도장이 찍힙니다. 한 달을 모두 채우면 {1}월호 표지가 완성됩니다.', new Date().getDate(), sm.month)}
          </span>
        </div>}
      </Section>
    </div>
  );
}
