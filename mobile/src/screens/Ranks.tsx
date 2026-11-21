import { useEffect, useState } from 'react';
import { useApp } from '../state';
import { clearRanks, mmss, placeOf, ranks, record, type Board } from '../ranks';

const LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' } as const;

/** Counts a finished game once and returns the place it took (0 = outside the top 5). */
export function useRecord(board: Board, id: string, done: boolean, secs: number, hints: number) {
  const [place, setPlace] = useState(0);
  useEffect(() => {
    if (!done) { setPlace(0); return; }
    const p = record(board, id, secs, hints);
    setPlace(p >= 0 ? p : placeOf(board, id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, id, done]);
  return place;
}

/** One line for the COMPLETE box. */
export function PlaceLine({ place }: { place: number }) {
  const { L, F } = useApp();
  return (
    <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: place ? 'var(--color-accent-700)' : 'var(--color-neutral-700)' }}>
      {place === 1 ? L('🏆 새 1위 기록입니다!') : place ? F('나의 순위 {0}위에 올랐습니다', place) : L('이번에는 5위 안에 들지 못했어요')}
    </span>
  );
}

/** Top-5 table, kept on this phone only. */
export function Ranking({ board, mine, title }: { board: Board; mine?: string; title: string }) {
  const { L, F, s } = useApp();
  const [, bump] = useState(0);
  const [ask, setAsk] = useState(false);
  const list = ranks(board);
  const date = (t: number) => new Date(t).toLocaleDateString(LOCALE[s.lang], { month: 'numeric', day: 'numeric' });
  return (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--color-text)' }}>
        <span className="serif" style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        <span className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>{L('힌트 적은 순 · 빠른 순')}</span>
      </div>
      {!list.length ? (
        <div className="muted" style={{ fontSize: 14, padding: '14px 4px', fontStyle: 'italic', wordBreak: 'keep-all' }}>{L('아직 기록이 없어요. 퍼즐을 완성하면 여기에 남습니다.')}</div>
      ) : list.map((r, i) => {
        const me = !!mine && r.id === mine;
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', minHeight: 48, borderBottom: '1px solid var(--color-divider)', background: me ? 'var(--color-accent-100)' : 'transparent' }}>
            <span className="tnum" style={{ width: 26, flex: 'none', textAlign: 'center', fontFamily: "'Lora',serif", fontSize: i === 0 ? 22 : 18, fontWeight: 700, color: i < 3 ? 'var(--color-accent)' : 'var(--color-neutral-600)' }}>{i + 1}</span>
            <span className="tnum" style={{ fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 600, minWidth: 54 }}>{mmss(r.t)}</span>
            <span className="chip" style={{ fontSize: 12, borderColor: r.h ? 'var(--color-divider)' : 'var(--color-accent)', color: r.h ? 'var(--color-neutral-700)' : 'var(--color-accent-700)' }}>
              {r.h ? F('힌트 {0}번', r.h) : L('힌트 없이')}
            </span>
            <span style={{ flex: 1 }} />
            {me && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-700)' }}>{L('이번 기록')}</span>}
            <span className="muted tnum" style={{ fontSize: 12.5 }}>{date(r.at)}</span>
          </div>
        );
      })}
      {list.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, paddingTop: 6, fontSize: 13 }}>
          {ask ? (
            <>
              <span className="muted" style={{ padding: '8px 0' }}>{L('이 순위를 모두 지울까요?')}</span>
              <button className="tap link-u" style={{ padding: '8px 0', color: 'var(--color-accent-800)' }} onClick={() => { clearRanks(board); setAsk(false); bump(x => x + 1); }}>{L('지우기')}</button>
              <button className="tap link-u" style={{ padding: '8px 0' }} onClick={() => setAsk(false)}>{L('취소')}</button>
            </>
          ) : (
            <button className="tap link-u muted" style={{ padding: '8px 0' }} onClick={() => setAsk(true)}>{L('순위 지우기')}</button>
          )}
        </div>
      )}
    </section>
  );
}
