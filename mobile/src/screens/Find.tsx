import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state';
import { loadPills, pillSearch, pillToFound, search, type PillRow } from '../real';
import { Back, Chip, Heading } from '../ui';
import { MyMedsList } from './MyMeds';
import { ChevronRight, Search as SearchIcon } from '../icons';

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
        <button className="tap" onClick={() => go('scan')} style={{ fontSize: 12.5, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>{L('스캔으로 추가')} ›</button>
      </div>
      {!me.meds.length && <div className="empty">{L('아직 등록한 약이 없어요.')}</div>}
      <MyMedsList />
      {me.meds.length > 0 && <button className="btn btn-secondary cta" onClick={() => go('symptom')}>{t.compare}</button>}
    </div>
  );
}

const SHAPES = ['원형', '타원형', '장방형', '삼각형', '사각형', '마름모형', '오각형', '육각형', '팔각형', '기타'];
const COLORS: [string, string][] = [['하양', '#f4f2ee'], ['노랑', '#f1d36b'], ['주황', '#f0a35c'], ['분홍', '#f2b5c4'], ['빨강', '#e06a5c'], ['갈색', '#a87a52'], ['연두', '#b9dc7a'], ['초록', '#5fae7c'], ['파랑', '#6fa0dc'], ['보라', '#a98bd6'], ['회색', '#a3a8a6'], ['검정', '#333']];

/** Pill identification by imprint, shape and color (MFDS 낱알식별 data). */
export function Pill() {
  const { s, showFound, flash, L, F } = useApp();
  const [q, setQ] = useState({ imprint: '', shape: '', color: '' });
  const [rows, setRows] = useState<PillRow[] | null>(null);
  const [img, setImg] = useState('');
  useEffect(() => { loadPills().then(p => setImg(p.img)).catch(() => setRows([])); }, []);
  useEffect(() => {
    if (!q.imprint && !q.shape && !q.color) { setRows(null); return; }
    const id = setTimeout(() => { pillSearch(q).then(setRows).catch(() => setRows([])); }, 150);
    return () => clearTimeout(id);
  }, [q]);
  const pick = async (r: PillRow) => {
    const f = await pillToFound(r);
    if (!f) { flash(L('이 알약의 성분 정보는 아직 없어요')); return; }
    showFound({ at: Date.now(), kind: 'pill', found: [f] });
  };
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="PILL ID" title={L('알약 모양으로 찾기')} sub={L('알약에 새겨진 글자, 모양, 색을 골라 주세요.')} />
      <input className="inp" value={q.imprint} onChange={e => setQ({ ...q, imprint: e.target.value })} placeholder={L('새겨진 글자 (예: YH, 10)')} aria-label={L('새겨진 글자')} autoComplete="off" />
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{L('모양')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SHAPES.map(x => <Chip key={x} on={q.shape === x} onClick={() => setQ({ ...q, shape: q.shape === x ? '' : x })} style={{ padding: '6px 11px', fontSize: 12.5 }}>{L(x)}</Chip>)}
        </div>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{L('색')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(([x, c]) => (
            <Chip key={x} on={q.color === x} onClick={() => setQ({ ...q, color: q.color === x ? '' : x })} style={{ padding: '6px 11px', fontSize: 12.5 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid var(--color-neutral-500)', marginRight: 5, verticalAlign: 'middle' }} />{L(x)}
            </Chip>
          ))}
        </div>
      </div>
      {rows === null && <div className="sub">{L('조건을 하나 이상 고르면 후보가 나와요.')}</div>}
      {rows && <div className="label">{F('후보 {0}개', rows.length >= 40 ? '40+' : rows.length)}</div>}
      <div className={'col' + (rows?.length ? ' rule-top' : '')}>
        {(rows || []).map(r => (
          <button key={r[8] + r[0]} onClick={() => pick(r)} className="tap hov row" style={{ gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
            {img && r[8] ? <img className="plate" src={img + r[8]} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: 60, height: 36, objectFit: 'cover', flex: 'none', borderWidth: 3 }} />
              : <span className="plate" style={{ width: 60, height: 36, flex: 'none', borderWidth: 3, background: 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-100) 5px 10px)' }} />}
            <span className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <span className="serif" style={{ fontSize: 14 }}>{r[0]}</span>
              <span className="sub" style={{ fontSize: 11.5 }}>{[r[1], r[2]].filter(Boolean).join(' / ') || '—'} · {r[3]} · {r[4]}{s.lang === 'ko' ? '' : ''}</span>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <div className="fine">{L('모양이 같은 약이 여러 개일 수 있어요. 확실하지 않으면 약사에게 확인하세요.')}</div>
    </div>
  );
}
