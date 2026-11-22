import { useEffect, useState } from 'react';
import { useApp } from '../state';
import { SDK_DEF, type SdkSize, sdkConflicts } from '../sudoku';
import { Back, Heading, Segment } from '../ui';
import { Delete, Lightbulb } from '../icons';
import { PlaceLine, Ranking, useRecord } from './Ranks';
import { AdSlot } from './Chrome';

export function Puzzle() {
  const { s: st, sdk, flash, L, F } = useApp();
  const z = st.sdk;
  const n = z.n, { bh, bw } = SDK_DEF[n];
  const done = !!z.end;
  const conflicts = sdkConflicts(z);
  const left = z.cells.filter(v => !v).length;
  const sy = Math.floor(z.sel / n), sx = z.sel % n, selV = z.sel >= 0 ? z.cells[z.sel] : 0;
  const counts: Record<number, number> = {};
  z.cells.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
  const line = '1px solid var(--color-divider)', thick = '2px solid var(--color-text)';

  // re-render once a second so the finished time stays accurate while playing
  const [, tick] = useState(0);
  useEffect(() => { if (done) return; const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, [done]);
  const secs = Math.round(((z.end || Date.now()) - z.start) / 1000);
  const board = n === 6 ? 'sdk6' : 'sdk9';
  // one id per puzzle: the same finished game is never counted twice
  const gid = `sdk:${n}:${z.seed}:${new Date().toDateString()}`;
  const place = useRecord(board, gid, done, secs, z.hints);

  const press = (v: number) => {
    if (z.sel < 0) return flash(L('칸을 먼저 골라 주세요'));
    sdk.put(v);
  };

  return (
    <div className="page" style={{ gap: 18 }}>
      <Back />
      <Heading eyebrow="DAILY SUDOKU" title={L('오늘의 스도쿠')} sub={<span className="lead" style={{ fontStyle: 'normal' }}>{L('가로줄, 세로줄, 굵은 선 상자 안에 같은 숫자가 겹치지 않게 채워 보세요. 칸을 누르고 아래 숫자를 고르면 됩니다.')}</span>} />
      <Segment<'6' | '9'> items={[['6', L('쉬움 · 6×6')], ['9', L('보통 · 9×9')]]} value={String(n) as '6' | '9'} onPick={v => sdk.size(Number(v) as SdkSize)}
        itemStyle={{ padding: '11px 0', fontSize: 14, fontWeight: 600 }} />
      <div role="grid" aria-label={L('오늘의 스도쿠')} style={{ display: 'grid', gridTemplateColumns: `repeat(${n},minmax(0,1fr))`, border: '2px solid var(--color-text)', aspectRatio: '1 / 1', width: '100%' }}>
        {z.cells.map((v, i) => {
          const y = Math.floor(i / n), x = i % n, g = !!z.given[i], bad = conflicts.has(i), sel = i === z.sel;
          const peer = z.sel >= 0 && (y === sy || x === sx || (Math.floor(y / bh) === Math.floor(sy / bh) && Math.floor(x / bw) === Math.floor(sx / bw)));
          return (
            <button key={i} role="gridcell" aria-selected={sel} aria-label={`${y + 1}-${x + 1}${v ? ': ' + v : ''}`} onClick={() => sdk.select(i)}
              className="tnum"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, border: 0,
                fontFamily: "'Lora',serif", fontSize: n === 6 ? 30 : 22, fontWeight: g ? 700 : 600,
                color: bad && !g ? 'var(--color-accent-900)' : g ? 'var(--color-text)' : 'var(--color-accent-700)',
                background: sel ? 'var(--color-accent-200)' : bad ? 'var(--color-accent-100)' : selV && v === selV ? 'color-mix(in srgb,var(--color-accent) 16%,transparent)' : peer ? 'var(--color-neutral-200)' : 'transparent',
                borderRight: x === n - 1 ? 'none' : (x + 1) % bw === 0 ? thick : line,
                borderBottom: y === n - 1 ? 'none' : (y + 1) % bh === 0 ? thick : line,
                transition: 'background .12s', minWidth: 0,
              }}>{v || ''}</button>
          );
        })}
      </div>
      {done ? (
        <>
        <div style={{ padding: '16px 4px', borderTop: '1px solid var(--color-accent)', borderBottom: '1px solid var(--color-accent)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
          <span className="kicker">COMPLETE</span>
          <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{L('오늘의 퍼즐을 완성했습니다')}</span>
          <span className="sub">{F('{0}분 {1}초 · 힌트 {2}번 사용', Math.floor(secs / 60), secs % 60, z.hints)}</span>
          <PlaceLine place={place} />
        </div>
          <AdSlot />
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n === 6 ? 6 : 5},minmax(0,1fr))`, gap: 8 }}>
            {[...Array(n).keys()].map(i => i + 1).map(v => (
              <button key={v} className="btn btn-secondary" onClick={() => press(v)}
                style={{ height: 54, padding: 0, fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 600, opacity: (counts[v] || 0) >= n ? 0.45 : 1 }}>{v}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            <button className="btn btn-secondary cta" onClick={() => sdk.put(0)}><Delete />{L('지우기')}</button>
            <button className="btn btn-secondary cta" onClick={sdk.hint}><Lightbulb />{L('힌트')}</button>
          </div>
        </>
      )}
      <Ranking board={board} mine={done ? gid : undefined} title={n === 6 ? L('나의 순위 · 6×6') : L('나의 순위 · 9×9')} />
      <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, paddingTop: 12, borderTop: '1px solid var(--color-divider)' }}>
        <span style={{ fontStyle: 'italic' }}>{F('{0}칸 남음 · 힌트 {1}번', left, z.hints)}</span>
        <button className="tap link-u" onClick={sdk.fresh}>{L('새 퍼즐')}</button>
      </div>
    </div>
  );
}
