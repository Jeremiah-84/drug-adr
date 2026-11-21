import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state';
import { XPUZZLES, layout, syllables, xwNew, xwRestore, xwSave, type XEntry, type XState } from '../xword';
import { Back, Heading } from '../ui';
import { Delete, Lightbulb } from '../icons';
import { PlaceLine, Ranking, useRecord } from './Ranks';

/** Daily Korean crossword. Pick a square or a clue, then type the whole answer and press 넣기.
 *  Typing the whole word in one box keeps the Korean keyboard working normally and is easier
 *  for older users than filling one square at a time. */
export function Crossword() {
  const { flash, L, F } = useApp();
  const [z, setZ] = useState<XState>(xwRestore);
  const p = XPUZZLES[z.idx];
  const { sol, entries } = useMemo(() => layout(p), [p]);
  const [cur, setCur] = useState(0);
  const [cell, setCell] = useState(-1);
  const [text, setText] = useState('');
  const [miss, setMiss] = useState<number[]>([]);
  const inp = useRef<HTMLInputElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const e = entries[cur];
  const done = !!z.end;

  useEffect(() => { xwSave(z); }, [z]);
  // a new day while the screen is open brings the new puzzle
  useEffect(() => {
    const vis = () => { if (!document.hidden) { const n = xwRestore(); if (n.idx !== z.idx && !n.cells.some(Boolean)) { setZ(n); setCur(0); } } };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [z.idx]);

  const solvedWord = (x: XEntry, cells = z.cells) => x.cells.every(c => cells[c] === sol[c]);
  const left = entries.filter(x => !solvedWord(x)).length;

  const finish = (cells: string[], st: XState) => {
    if (cells.every((v, i) => v === sol[i])) return { ...st, cells, end: Date.now() };
    return { ...st, cells };
  };

  const pick = (i: number, focus = false) => {
    setCur(i); setText(''); setMiss([]);
    // bring the answer box into view and open the keyboard, so one tap is enough to start typing
    if (focus) setTimeout(() => { inp.current?.focus({ preventScroll: true }); card.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30);
  };
  // tapping a square picks the word through it; tapping the same square again switches across/down
  const tapCell = (c: number) => {
    if (!sol[c]) return;
    const hits = entries.map((x, i) => (x.cells.includes(c) ? i : -1)).filter(i => i >= 0);
    const next = c === cell && hits.length > 1 ? hits.find(i => i !== cur)! : hits.includes(cur) ? cur : hits[0];
    setCell(c);
    pick(next, true);
  };

  const submit = () => {
    if (done) return;
    const t = syllables(inp.current?.value ?? text);
    if (!t.length) return flash(L('답을 먼저 써 주세요'));
    if (t.length !== e.len) return flash(F('{0}글자로 써 주세요', e.len));
    const cells = z.cells.slice();
    e.cells.forEach((c, i) => { if (!z.shown.includes(c)) cells[c] = t[i]; });
    setText('');
    if (inp.current) inp.current.value = '';
    const ok = e.cells.every(c => cells[c] === sol[c]);
    const nz = finish(cells, z);
    setZ(nz);
    if (ok) {
      setMiss([]);
      if (!nz.end) {
        flash(L('정답입니다!'));
        // move on to the next unsolved clue
        const n = entries.findIndex((x, i) => i > cur && !solvedWord(x, cells));
        const m = n >= 0 ? n : entries.findIndex(x => !solvedWord(x, cells));
        if (m >= 0) pick(m);
      }
    } else {
      setMiss(e.cells.filter(c => cells[c] !== sol[c]));
      flash(L('아쉬워요. 다시 생각해 보세요'));
    }
  };

  const hint = () => {
    if (done) return;
    const c = e.cells.find(c => z.cells[c] !== sol[c]);
    if (c === undefined) return flash(L('이미 맞힌 낱말입니다'));
    const cells = z.cells.slice();
    cells[c] = sol[c];
    setMiss(m => m.filter(x => x !== c));
    setZ(finish(cells, { ...z, hints: z.hints + 1, shown: [...z.shown, c] }));
  };

  const clear = () => {
    if (done) return;
    const cells = z.cells.slice();
    // keep letters that are shared with an already-correct crossing word or opened by a hint
    e.cells.forEach(c => {
      if (z.shown.includes(c)) return;
      const other = entries.find(x => x !== e && x.cells.includes(c));
      if (other && solvedWord(other)) return;
      cells[c] = '';
    });
    setMiss([]);
    setZ({ ...z, cells });
  };

  const fresh = () => { const n = xwNew(z.idx + 1); setZ(n); setCur(0); setCell(-1); setMiss([]); setText(''); };

  // keep the timer accurate while playing
  const [, tick] = useState(0);
  useEffect(() => { if (done) return; const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, [done]);
  const secs = Math.round(((z.end || Date.now()) - z.start) / 1000);
  const gid = `xw:${z.idx}:${new Date().toDateString()}`;
  const place = useRecord('xw', gid, done, secs, z.hints);

  const nos = new Map(entries.map(x => [x.cells[0], x.no]));
  const dirL = (x: XEntry) => (x.d === 'a' ? L('가로') : L('세로'));
  const line = '1px solid var(--color-text)';

  return (
    <div className="page" style={{ gap: 18 }}>
      <Back />
      <Heading eyebrow="DAILY CROSSWORD" title={L('오늘의 십자말 퀴즈')}
        sub={<span className="lead" style={{ fontStyle: 'normal' }}>{L('칸이나 아래 문제를 누르고, 답을 낱말 그대로 써서 넣기를 누르세요. 같은 칸을 한 번 더 누르면 가로·세로가 바뀝니다.')}</span>} />

      <div role="grid" aria-label={L('오늘의 십자말 퀴즈')}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${p.w},minmax(0,1fr))`, width: '100%', maxWidth: p.w * 64, alignSelf: 'center', gap: 3 }}>
        {sol.map((s, c) => {
          if (!s) return <span key={c} aria-hidden="true" style={{ aspectRatio: '1 / 1' }} />;
          const inCur = e.cells.includes(c), v = z.cells[c];
          const wrong = miss.includes(c), hinted = z.shown.includes(c);
          return (
            <button key={c} role="gridcell" aria-selected={inCur} onClick={() => tapCell(c)}
              aria-label={`${nos.get(c) ? nos.get(c) + ' ' : ''}${v || L('빈칸')}`}
              style={{
                position: 'relative', aspectRatio: '1 / 1', minWidth: 0, padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: line, borderWidth: inCur ? 2 : 1, borderColor: inCur ? 'var(--color-accent)' : 'var(--color-text)',
                background: done ? 'var(--color-accent-100)' : c === cell && inCur ? 'var(--color-accent-200)' : inCur ? 'var(--color-accent-100)' : 'var(--color-bg, transparent)',
                fontFamily: "var(--ms-serif)", fontSize: p.w >= 7 ? 22 : 25, fontWeight: 700, lineHeight: 1,
                color: wrong ? 'var(--xw-bad)' : hinted ? 'var(--color-accent-700)' : 'var(--color-text)',
                textDecoration: wrong ? 'line-through' : 'none', transition: 'background .12s',
              }}>
              {nos.get(c) && <span className="tnum" style={{ position: 'absolute', top: 2, left: 3, fontSize: 11, fontWeight: 700, fontFamily: "'Lora',serif", color: 'var(--color-accent-700)' }}>{nos.get(c)}</span>}
              {v}
            </button>
          );
        })}
      </div>

      {done ? (
        <div style={{ padding: '16px 4px', borderTop: '1px solid var(--color-accent)', borderBottom: '1px solid var(--color-accent)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
          <span className="kicker">COMPLETE</span>
          <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{L('오늘의 퀴즈를 모두 맞혔습니다')}</span>
          <span className="sub">{F('{0}분 {1}초 · 힌트 {2}번 사용', Math.floor(secs / 60), secs % 60, z.hints)}</span>
          <PlaceLine place={place} />
        </div>
      ) : (
        <div ref={card} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 18px', border: '1px solid var(--color-accent)', background: 'color-mix(in srgb,var(--color-accent) 6%,transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span className="tnum" style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: 'var(--color-accent)' }}>{e.no}</span>
            <span className="serif" style={{ fontSize: 15, fontWeight: 700 }}>{dirL(e)}</span>
            <span className="muted" style={{ fontSize: 14 }}>· {F('{0}글자', e.len)}</span>
            {e.m && <span className="chip" style={{ fontSize: 12, borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)' }}>{L('약 상식')}</span>}
          </div>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 500, wordBreak: 'keep-all' }}>{e.c}</div>
          <form onSubmit={ev => { ev.preventDefault(); submit(); }} style={{ display: 'flex', gap: 8 }}>
            <input ref={inp} className="inp" value={text} onChange={ev => setText(ev.target.value)} lang="ko" autoComplete="off" autoCorrect="off" spellCheck={false}
              enterKeyHint="done" aria-label={F('{0}번 {1} 답', e.no, dirL(e))}
              placeholder={e.cells.map(c => (z.cells[c] && z.cells[c] === sol[c] ? z.cells[c] : '○')).join('')}
              style={{ flex: 1, minWidth: 0, height: 56, fontSize: 22, letterSpacing: '.12em', fontFamily: 'var(--ms-serif)' }} />
            <button type="submit" className="btn btn-primary cta" style={{ height: 56, minWidth: 84, fontSize: 17 }}>{L('넣기')}</button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            <button className="btn btn-secondary cta" onClick={clear} style={{ height: 52, fontSize: 15.5 }}><Delete />{L('지우기')}</button>
            <button className="btn btn-secondary cta" onClick={hint} style={{ height: 52, fontSize: 15.5 }}><Lightbulb />{L('한 글자 힌트')}</button>
          </div>
        </div>
      )}

      {(['a', 'd'] as const).map(d => (
        <div key={d} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--color-text)' }}>
            {d === 'a' ? L('가로 열쇠') : L('세로 열쇠')}
          </div>
          {entries.map((x, i) => x.d !== d ? null : (
            <button key={i} className="tap hov" onClick={() => pick(i, true)} aria-current={i === cur}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 4px', minHeight: 52, textAlign: 'left', borderBottom: '1px solid var(--color-divider)', background: i === cur && !done ? 'var(--color-accent-100)' : 'transparent' }}>
              <span className="tnum" style={{ fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 700, width: 22, flex: 'none', color: 'var(--color-accent)', lineHeight: 1.45 }}>{x.no}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, lineHeight: 1.55, wordBreak: 'keep-all', color: solvedWord(x) ? 'var(--color-neutral-600)' : 'var(--color-text)', textDecoration: solvedWord(x) ? 'line-through' : 'none' }}>
                {x.c} <span className="muted" style={{ fontSize: 13 }}>({F('{0}글자', x.len)})</span>
              </span>
              {solvedWord(x) && <span aria-label={L('맞힘')} style={{ flex: 'none', color: 'var(--color-accent)', fontSize: 18, fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
      ))}

      <Ranking board="xw" mine={done ? gid : undefined} title={L('나의 순위')} />
      <div className="fine">{L('약에 관한 문제는 식약처 의약품 허가정보(첨부문서)의 내용에 맞춰 만들었습니다. 내 약에 대한 판단은 의사·약사와 상의하세요.')}</div>
      <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, paddingTop: 12, borderTop: '1px solid var(--color-divider)' }}>
        <span style={{ fontStyle: 'italic' }}>{F('{0}개 남음 · 힌트 {1}번', left, z.hints)}</span>
        <button className="tap link-u" onClick={fresh} style={{ fontSize: 14, padding: '8px 0' }}>{L('다른 퍼즐')}</button>
      </div>
    </div>
  );
}
