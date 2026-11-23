import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../state';
import { ingName, loadPills, pillSearch, pillToFound, search, type Found, type PillQuery, type PillRow } from '../real';
import { Back, Chip, Heading, Sheet } from '../ui';
import { SlotChips } from './Drugs';
import type { SlotKey } from '../data';
import { MyMedsList } from './MyMeds';
import { ChevronRight, Pill as PillIcon, Search as SearchIcon, X } from '../icons';

/** "내 약" tab: the saved list, plus type-ahead search over ingredient and product names. */
export function Search() {
  const { s, me, set, go, openDrug, t, L, F } = useApp();
  const hits = useMemo(() => (s.D ? search(s.query, s.lang) : []), [s.D, s.query, s.lang]);
  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <Heading eyebrow="MY MEDICINES" title={L('내 약')} sub={L('약 이름, 성분, 제품명으로 찾아 추가하세요.')} />
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: 15, color: 'var(--color-neutral-500)' }}><SearchIcon /></span>
        <input className="inp" style={{ paddingLeft: 40 }} type="search" value={s.query} onChange={e => set({ query: e.target.value })}
          placeholder={L('예: 타이레놀, 리리카, 메트포르민')} aria-label={L('약 검색')} autoComplete="off" />
      </div>
      {s.dataErr && <div style={{ fontSize: 13, color: 'var(--color-accent-800)' }}>{L('정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')}</div>}
      {s.query.trim() !== '' && (
        <div className="col rule-top" style={{ marginTop: -8 }}>
          {!s.D && <div className="sub" style={{ padding: '14px 0' }}>{L('불러오는 중…')}</div>}
          {s.D && !hits.length && <div className="sub" style={{ padding: '14px 0' }}>{L('찾는 약이 없어요. 다른 이름으로 찾아 보세요.')}</div>}
          {hits.map(h => (
            <button key={h.key} className="tap hov row" onClick={() => { set({ query: '' }); openDrug({ name: h.label, ids: h.ids }); }}
              style={{ width: '100%', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span className="serif" style={{ fontSize: 14.5 }}>{h.label}</span>
                <span className="sub ellip" style={{ fontSize: 12 }}>{h.sub}</span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="label">{F('등록한 약 {0}개', me.meds.length)}</span>
        <span className="row" style={{ gap: 14 }}>
          <button className="tap" onClick={() => go('pill')} style={{ fontSize: 12.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('모양으로 찾기')} ›</button>
          <button className="tap" onClick={() => go('scan')} style={{ fontSize: 12.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('스캔으로 추가')} ›</button>
        </span>
      </div>
      {!me.meds.length && <div className="empty">{L('아직 등록한 약이 없어요.')}</div>}
      <MyMedsList />
      {me.meds.length > 0 && <button className="btn btn-secondary cta" onClick={() => go('symptom')}>{t.compare}</button>}
    </div>
  );
}

// Shapes as MFDS names them, most common first, each with a small outline drawn the same way.
const poly = (n: number, r = 8.5, rot = -90) =>
  Array.from({ length: n }, (_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return `${(12 + r * Math.cos(a)).toFixed(1)},${(12 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const SHAPES: [string, JSX.Element][] = [
  ['원형', <circle cx="12" cy="12" r="8" />],
  ['타원형', <ellipse cx="12" cy="12" rx="9.5" ry="6" />],
  ['장방형', <rect x="2.5" y="7" width="19" height="10" rx="5" />],
  ['삼각형', <polygon points={poly(3, 9.5, -90)} />],
  ['사각형', <rect x="5" y="5" width="14" height="14" rx="2.5" />],
  ['마름모형', <polygon points={poly(4, 9.5, -90)} />],
  ['오각형', <polygon points={poly(5)} />],
  ['육각형', <polygon points={poly(6, 8.5, 0)} />],
  ['팔각형', <polygon points={poly(8, 8.5, 22.5)} />],
  ['기타', <path d="M6 9c0-3 3-5 6-4.5s4 3 6 3.5c2 1 1.5 5-1 7s-5 4.5-8 3.5S6 14 6 9Z" strokeDasharray="2.2 2" />],
];
const ShapeIcon = ({ children }: { children: JSX.Element }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>{children}</svg>
);
const COLORS: [string, string][] = [
  ['하양', '#f7f5f0'], ['노랑', '#f1d36b'], ['주황', '#f0a35c'], ['분홍', '#f2b5c4'], ['빨강', '#e06a5c'], ['갈색', '#a87a52'],
  ['연두', '#b9dc7a'], ['초록', '#5fae7c'], ['청록', '#4fb3a9'], ['파랑', '#6fa0dc'], ['남색', '#3b4f8f'], ['보라', '#a98bd6'],
  ['자주', '#9b4f86'], ['회색', '#a3a8a6'], ['검정', '#333'], ['투명', 'linear-gradient(135deg,rgba(255,255,255,.9),rgba(190,200,205,.5))'],
];
const FORMS: [string, string][] = [['tab', '정제 (알약)'], ['hard', '딱딱한 캡슐'], ['soft', '말랑한 캡슐']];
const PAGE = 30;
const chip = { padding: '7px 11px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 } as const;
// Kept while the app is open, so coming back from a medicine's page shows the same search.
let lastQ: PillQuery = { imprint: '', shape: '', color: '', form: '' };

/** Pill picture from the MFDS site; a striped plate when there is none or it does not load. */
function PillImg({ src, w, h }: { src: string; w: number; h: number }) {
  const [bad, setBad] = useState(false);
  const box = { width: w, height: h, flex: 'none', borderWidth: 3 } as const;
  return src && !bad
    ? <img className="plate" src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} style={{ ...box, objectFit: 'cover', background: '#fff' }} />
    : <span className="plate" style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-neutral-500)', background: 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-100) 5px 10px)' }}><PillIcon size={Math.min(22, h - 8)} /></span>;
}

/** Pill identification by imprint, shape, color and form (MFDS 낱알식별 data). */
export function Pill() {
  const { s, L, F } = useApp();
  const [q, setQ0] = useState<PillQuery>(lastQ);
  const setQ = (x: PillQuery) => { lastQ = x; setQ0(x); };
  const [rows, setRows] = useState<PillRow[] | null>(null);
  const [err, setErr] = useState(false);
  const [img, setImg] = useState('');
  const [n, setN] = useState(PAGE);
  const [open, setOpen] = useState<PillRow | null>(null);
  const any = !!(q.imprint.trim() || q.shape || q.color || q.form);
  useEffect(() => { loadPills().then(p => setImg(p.img)).catch(() => setErr(true)); }, []);
  useEffect(() => {
    setN(PAGE);
    if (!any) { setRows(null); return; }
    const id = setTimeout(() => { pillSearch(q).then(r => { setErr(false); setRows(r); }).catch(() => setErr(true)); }, 150);
    return () => clearTimeout(id);
  }, [q, any]);
  const toggle = (k: 'shape' | 'color' | 'form', v: string) => setQ({ ...q, [k]: q[k] === v ? '' : v });
  const desc = (r: PillRow) => [[r[1], r[2]].filter(Boolean).join(' / ') || L('글자 없음'), L(r[3]), [r[4], r[5]].filter(Boolean).map(c => c.split(/,\s*/).map(L).join('·')).join(' / ')].filter(Boolean).join(' · ');
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="PILL ID" title={L('알약 모양으로 찾기')} sub={L('알약에 새겨진 글자, 모양, 색을 골라 주세요.')} />
      <div className="col" style={{ gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <input className="inp" value={q.imprint} onChange={e => setQ({ ...q, imprint: e.target.value })} placeholder={L('새겨진 글자 (예: YH, 10)')} aria-label={L('새겨진 글자')} autoComplete="off" autoCapitalize="characters" style={{ paddingRight: 44 }} />
          {q.imprint && <button className="tap" aria-label={L('입력 지우기')} onClick={() => setQ({ ...q, imprint: '' })} style={{ position: 'absolute', right: 10, top: 0, bottom: 0, padding: '0 6px', color: 'var(--color-neutral-500)' }}><X size={16} /></button>}
        </div>
        <span className="fine" style={{ margin: 0 }}>{L('앞이나 뒤 한쪽 글자만 넣어도 돼요. 글자가 없으면 비워 두세요.')}</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{L('모양')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SHAPES.map(([x, d]) => <Chip key={x} on={q.shape === x} onClick={() => toggle('shape', x)} style={chip}><ShapeIcon>{d}</ShapeIcon>{L(x)}</Chip>)}
        </div>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{L('색')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(([x, c]) => (
            <Chip key={x} on={q.color === x} onClick={() => toggle('color', x)} style={chip}>
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c, border: '1px solid var(--color-neutral-500)', flex: 'none' }} />{L(x)}
            </Chip>
          ))}
        </div>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{L('제형')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FORMS.map(([k, l]) => <Chip key={k} on={q.form === k} onClick={() => toggle('form', k)} style={chip}>{L(l)}</Chip>)}
        </div>
      </div>

      {err && <div style={{ fontSize: 13, color: 'var(--color-accent-800)' }}>{L('정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')}</div>}
      {!any && !err && <div className="sub">{L('조건을 하나 이상 고르면 후보가 나와요.')}</div>}
      {any && !err && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="label">{rows === null ? L('찾는 중…') : F('후보 {0}개', rows.length.toLocaleString())}</span>
          <button className="tap" onClick={() => setQ({ imprint: '', shape: '', color: '', form: '' })} style={{ fontSize: 12.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('조건 모두 지우기')}</button>
        </div>
      )}
      {rows && !rows.length && <div className="empty">{L('맞는 알약이 없어요. 글자 일부만 넣거나 조건을 줄여 보세요.')}</div>}
      {rows && rows.length > 0 && (
        <div className="col rule-top" style={{ marginTop: -8 }}>
          {rows.slice(0, n).map((r, i) => (
            <button key={i + r[8] + r[0]} onClick={() => setOpen(r)} className="tap hov row" style={{ gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-divider)', width: '100%' }}>
              <PillImg src={img && r[8] ? img + r[8] : ''} w={64} h={38} />
              <span className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span className="serif" style={{ fontSize: 14.5, wordBreak: 'keep-all' }}>{r[0]}</span>
                <span className="sub" style={{ fontSize: 12 }}>{desc(r)}</span>
                {!r[7] && <span className="muted" style={{ fontSize: 11.5 }}>{L('성분 정보 없음')}</span>}
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {rows.length > n && <button className="btn btn-secondary cta" style={{ marginTop: 14 }} onClick={() => setN(n + PAGE)}>{F('더 보기 ({0}개 남음)', (rows.length - n).toLocaleString())}</button>}
        </div>
      )}
      <div className="fine">{L('모양이 같은 약이 여러 개일 수 있어요. 확실하지 않으면 약사에게 확인하세요.')} {L('자료: 식약처 의약품 낱알식별 정보')}</div>
      {open && <PillSheet r={open} img={img && open[8] ? img + open[8] : ''} desc={desc(open)} lang={s.lang} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** One pill: bigger picture, what is printed on it, and add it to my medicines or open its page. */
function PillSheet({ r, img, desc, lang, onClose }: { r: PillRow; img: string; desc: string; lang: string; onClose: () => void }) {
  const { me, openDrug, addMeds, flash, L } = useApp();
  const [f, setF] = useState<Found | null | undefined>(undefined);
  const [slots, setSlots] = useState<SlotKey[]>(['m']);
  useEffect(() => { pillToFound(r).then(setF).catch(() => setF(null)); }, [r]);
  const mine = f && me.meds.some(m => m.key === f.ids.slice().sort().join('+'));
  const line = (k: string, v: string) => v ? (
    <div className="row" style={{ gap: 12, padding: '7px 0', borderBottom: '1px solid var(--color-divider)', alignItems: 'baseline' }}>
      <span className="label" style={{ width: 72, flex: 'none' }}>{L(k)}</span>
      <span style={{ fontSize: 14, flex: 1, minWidth: 0, wordBreak: 'keep-all' }}>{v}</span>
    </div>
  ) : null;
  // Drawn over the whole phone frame (like the other sheets), not inside the scrolled page.
  const host = document.querySelector('.ms-phone');
  const sheet = (
    <Sheet onClose={onClose} gap={12} label={r[0]}>
      <div className="row" style={{ gap: 16, alignItems: 'center' }}>
        <PillImg src={img} w={104} h={62} />
        <div className="col" style={{ minWidth: 0, gap: 4 }}>
          <span className="serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.35, wordBreak: 'keep-all' }}>{r[0]}</span>
          <span className="sub" style={{ fontSize: 12.5 }}>{r[9]}</span>
        </div>
      </div>
      <div className="col rule-top">
        {line('새긴 글자', [`${L('앞')} ${r[1] || '—'}`, `${L('뒤')} ${r[2] || '—'}`].join('  ·  '))}
        {line('모양·색', desc.split(' · ').slice(1).join(' · '))}
        {line('제형', r[6])}
        {f && line('성분', f.ids.map(i => ingName(i, lang)).join(' · '))}
      </div>
      {f === undefined && <div className="sub">{L('불러오는 중…')}</div>}
      {f === null && <div className="sub">{L('이 알약의 성분 정보는 아직 없어요')}</div>}
      {f && (mine ? (
        <div className="sub" style={{ color: 'var(--color-accent-700)' }}>✓ {L('이미 내 약에 있어요')}</div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          <span className="label">{L('언제 드세요? 눌러서 여러 개 고를 수 있어요')}</span>
          <SlotChips value={slots} onChange={setSlots} />
          <button className="btn btn-primary cta" onClick={() => { addMeds([f], slots); flash(L('내 약에 추가했어요')); onClose(); }}>{L('내 약에 추가')}</button>
        </div>
      ))}
      {f && <button className="btn btn-secondary cta" onClick={() => { onClose(); openDrug(f); }}>{L('이 약의 부작용·복용 정보 보기')}</button>}
      <div className="fine" style={{ margin: 0 }}>{L('모양이 같은 약이 여러 개일 수 있어요. 확실하지 않으면 약사에게 확인하세요.')}</div>
    </Sheet>
  );
  return host ? createPortal(sheet, host) : sheet;
}
