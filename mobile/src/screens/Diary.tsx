import { useRef, useState } from 'react';
import { dayKey, useApp, type DiaryEntry } from '../state';
import { stampMonth } from '../derive';
import { HOLIDAY_YEARS, holidaysOf, type Holiday } from '../holidays';
import { Sheet } from '../ui';

/** Simple stickers for a day (how I felt, hospital, exercise, …). Saved as the emoji itself. */
export const STICKERS = ['😊', '🙂', '😐', '😣', '🤒', '😴', '💊', '🏥', '🩺', '💉', '🩸', '🏃', '⭐', '❤️', '🎂', '☕', '☀️', '🌧️'];
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const [MIN_Y, MAX_Y] = HOLIDAY_YEARS;
const ymKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/** Month heading that the 복약 장서표 section shows on its right. */
export const diaryMonthName = (m: number) => MONTHS[m];

/**
 * The diary calendar: stamps for days every dose was taken, stickers and memos the person adds,
 * and Korean public holidays / 명절. Arrows, a sideways swipe, or the year-month picker move it.
 */
export function DiaryCalendar() {
  const { s, me, set, L, F } = useApp();
  const [y, mo] = s.diaryYM;
  const [pick, setPick] = useState<number | null>(null); // year shown in the picker, or closed
  const [dir, setDir] = useState<'' | 'from-l'>('');
  const sm = stampMonth(me, y, mo);
  const hol = holidaysOf(y);
  const diary = me.diary || {};
  const now = new Date();
  const canPrev = y > MIN_Y || mo > 0, canNext = y < MAX_Y || mo < 11;
  const move = (n: number) => {
    const d = new Date(y, mo + n, 1);
    if (d.getFullYear() < MIN_Y || d.getFullYear() > MAX_Y) return;
    setDir(n < 0 ? 'from-l' : '');
    set({ diaryYM: [d.getFullYear(), d.getMonth()] });
  };
  const jump = (yy: number, mm: number) => { setDir(yy * 12 + mm < y * 12 + mo ? 'from-l' : ''); set({ diaryYM: [yy, mm] }); setPick(null); };

  // Swipe left / right on the days to turn the month.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onEnd = (e: React.TouchEvent) => {
    const a = touch.current; touch.current = null;
    if (!a) return;
    const t = e.changedTouches[0], dx = t.clientX - a.x, dy = t.clientY - a.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  };

  const label = (n: number) => new Date(y, n, 1).toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[s.lang], { month: 'short' });
  const prefix = ymKey(y, mo) + '-';
  // This month's holidays, 명절 and memos, listed under the calendar.
  const notes: { k: string; hs: Holiday[]; e?: DiaryEntry }[] = [];
  for (let d = 1; d <= sm.total; d++) {
    const k = prefix + String(d).padStart(2, '0'), hs = hol[k] || [], e = diary[k];
    if (hs.length || e?.memo || e?.st) notes.push({ k, hs, e });
  }
  const fmt = (k: string) => new Date(k + 'T12:00:00').toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[s.lang], { month: 'short', day: 'numeric', weekday: 'short' });

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="cal-head">
        <button className="cal-arrow tap" onClick={() => move(-1)} disabled={!canPrev} aria-label={L('이전 달')}>‹</button>
        <button className="cal-ym tap hov6" onClick={() => setPick(pick === null ? y : null)} aria-expanded={pick !== null} aria-label={L('년·월 고르기')}>
          <span className="serif tnum" style={{ fontSize: 19, fontWeight: 600 }}>{F('{0}년 {1}월', y, mo + 1)}</span>
        </button>
        <button className="cal-arrow tap" onClick={() => move(1)} disabled={!canNext} aria-label={L('다음 달')}>›</button>
      </div>

      {pick !== null && (
        <div className="col" style={{ gap: 10, padding: 12, border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)' }}>
          <div className="cal-head">
            <button className="cal-arrow tap" onClick={() => setPick(Math.max(MIN_Y, pick - 1))} disabled={pick <= MIN_Y} aria-label={L('이전 해')}>‹</button>
            <span className="serif tnum" style={{ fontSize: 17, fontWeight: 600 }}>{F('{0}년', pick)}</span>
            <button className="cal-arrow tap" onClick={() => setPick(Math.min(MAX_Y, pick + 1))} disabled={pick >= MAX_Y} aria-label={L('다음 해')}>›</button>
          </div>
          <div className="cal-pick">
            {Array.from({ length: 12 }, (_, n) => (
              <button key={n} className={'pick' + (pick === y && n === mo ? ' on' : '')} style={{ minHeight: 40 }} onClick={() => jump(pick, n)}>
                <span className="serif" style={{ fontSize: 14 }}>{label(n)}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => jump(now.getFullYear(), now.getMonth())}>{L('이번 달로 돌아가기')}</button>
        </div>
      )}

      <div key={ymKey(y, mo)} className={'cal-grid ' + dir} onTouchStart={onStart} onTouchEnd={onEnd}>
        {WEEK.map((w, i) => (
          <span key={w} style={{ textAlign: 'center', fontSize: 10.5, color: i === 0 ? 'var(--cal-red)' : 'var(--color-neutral-600)' }}>{L(w)}</span>
        ))}
        {Array.from({ length: sm.first }, (_, i) => <span key={'b' + i} />)}
        {sm.days.map(({ d, kind, ends }) => {
          const k = prefix + String(d).padStart(2, '0');
          const hs = hol[k] || [], red = hs.some(h => h.red) || (sm.first + d - 1) % 7 === 0;
          const name = (hs.find(h => h.red) || hs[0])?.name;
          const e = diary[k];
          const st = kind === 'stamp'
            ? { bs: 'solid', bd: 'var(--color-accent-700)', sh: 'inset 0 0 0 3px var(--color-bg), inset 0 0 0 4px var(--color-accent)', bg: 'color-mix(in srgb,var(--color-accent) 8%,transparent)', c: 'var(--color-accent-700)', rot: ((d * 37) % 17 - 8) + 'deg' }
            : kind === 'today' ? { bs: 'dashed', bd: 'var(--color-accent)', sh: 'none', bg: 'transparent', c: 'var(--color-accent-700)', rot: '0deg' }
            : kind === 'miss' ? { bs: 'solid', bd: 'var(--color-neutral-300)', sh: 'none', bg: 'transparent', c: 'var(--color-neutral-500)', rot: '0deg' }
            : { bs: 'solid', bd: 'transparent', sh: 'none', bg: 'transparent', c: kind === 'future' ? 'var(--color-neutral-600)' : 'var(--color-neutral-500)', rot: '0deg' };
          const c = red && kind !== 'stamp' ? 'var(--cal-red)' : st.c;
          const tip = [hs.map(h => L(h.name)).join(', '), ends.length ? ends.join(', ') + ' · ' + L('마지막 날') : '', e?.memo || ''].filter(Boolean).join(' · ');
          return (
            <button key={d} className={'cal-day tap' + (s.diaryDay === k ? ' sel' : '')} onClick={() => set({ diaryDay: k })}
              aria-label={fmt(k) + (tip ? ' · ' + tip : '')} title={tip || undefined}>
              <div className="g tnum" style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: `1px ${st.bs} ${st.bd}`, boxShadow: st.sh, background: st.bg, transform: `rotate(${st.rot})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c, opacity: kind === 'future' && !red ? 0.85 : 1 }}>{d}</div>
              {name ? <span className={'cal-hol' + (hs.some(h => h.red) ? '' : ' soft')}>{L(name)}</span> : e?.memo ? <span className="cal-memo" /> : null}
              {name && e?.memo && <span className="cal-memo" />}
              {e?.st && <span className="cal-st" aria-hidden="true">{e.st}</span>}
              {ends.length > 0 && <span className="cal-end" aria-hidden="true">{L('끝')}</span>}
            </button>
          );
        })}
      </div>
      <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' }}>
        {L('날짜를 누르면 스티커와 메모를 남길 수 있어요. 옆으로 밀면 달이 넘어갑니다.')}
      </span>

      {notes.length > 0 && (
        <div className="col" style={{ borderTop: '1px solid var(--color-divider)' }}>
          {notes.map(({ k, hs, e }) => (
            <button key={k} className="tap hov6" onClick={() => set({ diaryDay: k })}
              style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 2px', borderBottom: '1px solid var(--color-divider)', textAlign: 'left' }}>
              <span className="tnum" style={{ flex: 'none', width: 92, fontSize: 12.5, color: hs.some(h => h.red) ? 'var(--cal-red)' : 'var(--color-neutral-700)' }}>{fmt(k)}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {hs.length > 0 && <span className="serif" style={{ fontSize: 13.5, color: hs.some(h => h.red) ? 'var(--cal-red)' : 'var(--color-accent-700)' }}>{hs.map(h => L(h.name)).join(' · ')}</span>}
                {(e?.st || e?.memo) && <span style={{ fontSize: 13.5, lineHeight: 1.55, overflowWrap: 'anywhere' }}>{e.st ? e.st + ' ' : ''}{e.memo}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bottom sheet for one day: pick a sticker and write a short memo (saved on this phone only). */
export function DiarySheet() {
  const { s, me, set, edit, L, flash } = useApp();
  const k = s.diaryDay;
  if (!k) return null;
  return <DayEditor key={k + me.id} k={k} entry={(me.diary || {})[k]} close={() => set({ diaryDay: null })}
    save={(e) => {
      edit(m => {
        const next = { ...(m.diary || {}) };
        const memo = (e.memo || '').trim();
        if (!e.st && !memo) delete next[k]; else next[k] = { ...(e.st ? { st: e.st } : {}), ...(memo ? { memo } : {}) };
        return { diary: next };
      });
    }} L={L} flash={flash} lang={s.lang} />;
}

function DayEditor({ k, entry, close, save, L, flash, lang }: {
  k: string; entry?: DiaryEntry; close: () => void; save: (e: DiaryEntry) => void; L: (s: string) => string; flash: (m: string) => void; lang: string;
}) {
  const [st, setSt] = useState(entry?.st || '');
  const [memo, setMemo] = useState(entry?.memo || '');
  const hs = holidaysOf(+k.slice(0, 4))[k] || [];
  const title = new Date(k + 'T12:00:00').toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[lang], { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const changed = st !== (entry?.st || '') || memo.trim() !== (entry?.memo || '');
  const done = () => { if (changed) { save({ st, memo }); flash(L('다이어리에 저장했어요')); } close(); };
  const clear = () => { save({}); flash(L('지웠어요')); close(); };
  return (
    <Sheet onClose={done} gap={16} label={title}>
      <div className="col" style={{ gap: 4 }}>
        <span className="kicker">DIARY{k === dayKey() ? ' · TODAY' : ''}</span>
        <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{title}</span>
        {hs.length > 0 && <span className="serif" style={{ fontSize: 14, color: hs.some(h => h.red) ? 'var(--cal-red)' : 'var(--color-accent-700)' }}>{hs.map(h => L(h.name)).join(' · ')}</span>}
      </div>
      <div className="col" style={{ gap: 8 }}>
        <span className="label">{L('스티커')}</span>
        <div className="st-grid" role="radiogroup" aria-label={L('스티커')}>
          {STICKERS.map(x => (
            <button key={x} role="radio" aria-checked={st === x} className={'tap' + (st === x ? ' on' : '')} onClick={() => setSt(st === x ? '' : x)}>{x}</button>
          ))}
        </div>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <span className="label">{L('메모')}</span>
        <textarea className="memo-box" value={memo} maxLength={200} onChange={e => setMemo(e.target.value)}
          placeholder={L('예: 오전 10시 병원 예약, 오후에 두통 조금')} aria-label={L('메모')} />
        <span className="muted tnum" style={{ fontSize: 11, textAlign: 'right' }}>{memo.length} / 200</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {(entry?.st || entry?.memo) && <button className="btn" style={{ flex: 1 }} onClick={clear}>{L('지우기')}</button>}
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={done}>{L('저장')}</button>
      </div>
      <span className="fine">{L('스티커와 메모는 이 휴대폰에만 저장됩니다.')}</span>
    </Sheet>
  );
}
