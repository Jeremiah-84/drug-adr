import { useEffect, useMemo, useState } from 'react';
import { levels, SLOT_KEYS, SLOT_SHORT, TAG, type Level, type SlotKey } from '../data';
import { drugInfo, organView, topLevel, trBadge, watchCount } from '../derive';
import { useApp } from '../state';
import { ingName, matchProblems, nedrugLink, probName, type Found } from '../real';
import { Back, Badge, Chip, Heading } from '../ui';
import { ChevronRight } from '../icons';

export const pillIcon = (color: string) => (
  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--color-divider)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <span style={{ width: 20, height: 10, borderRadius: 5, background: color, border: '1px solid var(--color-neutral-500)' }} />
  </div>
);

const KIND: Record<string, string> = { rx: '처방전 글자 인식', photo: '사진 글자 인식', barcode: '바코드', qr: 'QR 코드', pill: '알약 모양' };
const keyOf = (f: Found) => f.ids.slice().sort().join('+');
/** Times of day for "1일 N회": 1 → 아침, 2 → 아침·저녁, 3 → 아침·점심·저녁, 4 → 자기 전까지. */
const SLOTS_FOR: Record<number, SlotKey[]> = { 1: ['m'], 2: ['m', 'e'], 3: ['m', 'l', 'e'], 4: ['m', 'l', 'e', 'n'] };
const keyPlus = (from: number, n: number) => { const d = new Date(from); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** "11월 26일" style date in the app language. */
export const fmtDay = (key: string, lang: string) => new Date(key + 'T12:00:00').toLocaleDateString({ ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[lang] || 'ko-KR', { month: 'long', day: 'numeric' });

/** Tap-to-choose times of day (아침·점심·저녁·자기 전); several can be on, at least one stays on. */
export function SlotChips({ value, onChange, compact }: { value: SlotKey[]; onChange: (v: SlotKey[]) => void; compact?: boolean }) {
  const { s, L, flash } = useApp();
  const toggle = (k: SlotKey) => {
    if (value.includes(k)) {
      if (value.length === 1) { flash(L('하루에 한 번은 골라 주세요')); return; }
      onChange(value.filter(x => x !== k));
    } else onChange(SLOT_KEYS.filter(x => x === k || value.includes(x)));
  };
  return (
    <div role="group" aria-label={L('먹는 시간')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {SLOT_KEYS.map(k => {
        const on = value.includes(k);
        return (
          <button key={k} aria-pressed={on} onClick={() => toggle(k)} className={'pick' + (on ? ' on' : '')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: compact ? '6px 2px' : '9px 2px', minHeight: compact ? 40 : 48 }}>
            <span className="serif" style={{ fontSize: compact ? 13 : 14, fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{L(SLOT_SHORT[k])}</span>
            <span className="tnum" style={{ fontSize: 10.5, opacity: 0.75 }}>{s.times[k]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** One found / saved medicine with its strongest side-effect tier. */
export function DrugRow({ f, color, right, onOpen, foot }: { f: Found; color: string; right?: React.ReactNode; onOpen: () => void; foot?: React.ReactNode }) {
  const { s, L, F } = useApp();
  const info = drugInfo(f, s.details, s.D, s.lang);
  const pro = s.role === 'pro', LV = levels(s.role);
  const top = LV[topLevel(info.rows)], n = watchCount(info.rows);
  return (
    <div className="col" style={{ padding: '16px 0', gap: 12, borderBottom: '1px solid var(--color-divider)' }}>
      <div className="row" style={{ gap: 14 }}>
        <button onClick={onOpen} className="tap hov row" style={{ flex: 1, minWidth: 0, gap: 14 }}>
          {pillIcon(color)}
          <div className="col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <div className="serif" style={{ fontSize: 15.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
            <div className="sub">{f.ids.map(i => ingName(i, s.lang)).join(' · ')}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {info.loading ? <Badge b={{ t: L('불러오는 중…'), c: 'var(--color-neutral-600)', bd: 'var(--color-divider)' }} />
                : info.rows.length ? <>
                  {pro ? <Badge b={{ t: n ? F('흔한 이상반응 {0}', n) : F('최고 단계 · {0}', L(top.t)), c: top.c, bd: top.bd }} />
                    : n > 0 && <Badge b={{ t: F('가능성 있는 이상반응 {0}', n), c: top.c, bd: top.bd }} />}
                  <Badge b={{ t: F('이상반응 {0}개', info.rows.length), c: 'var(--color-neutral-700)', bd: 'var(--color-divider)' }} />
                </> : <Badge b={{ t: L('정리된 이상반응 없음'), c: 'var(--color-neutral-600)', bd: 'var(--color-divider)' }} />}
            </div>
          </div>
        </button>
        {right ?? <ChevronRight style={{ flex: 'none' }} />}
      </div>
      {foot}
    </div>
  );
}

export function Results() {
  const { s, me, go, addMeds, openDrug, flash, t, L, F } = useApp();
  const r = s.found;
  const have = useMemo(() => new Set(me.meds.map(m => m.key)), [me.meds]);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [slots, setSlots] = useState<SlotKey[]>(['m']);
  // Per-medicine times of day and last day, filled from "1일 3회 · 7일분" when the paper shows it.
  const [per, setPer] = useState<Record<string, { slots: SlotKey[]; days?: number }>>({});
  useEffect(() => {
    setPick(Object.fromEntries((r?.found || []).map(f => [keyOf(f), !have.has(keyOf(f))])));
    setPer(Object.fromEntries((r?.found || []).map(f => [keyOf(f), { slots: SLOTS_FOR[f.times || 0] || ['m'], days: f.days }])));
  }, [r]);
  if (!r) return <div className="page"><Back /></div>;
  const chosen = r.found.filter(f => pick[keyOf(f)] && !have.has(keyOf(f)));
  const dosed = r.found.some(f => f.times || f.days);
  const untilOf = (k: string) => per[k]?.days ? keyPlus(r.at, per[k].days! - 1) : undefined;
  const add = () => {
    const n = addMeds(chosen, slots, dosed ? Object.fromEntries(chosen.map(f => [keyOf(f), { slots: per[keyOf(f)]?.slots, until: untilOf(keyOf(f)) }])) : {});
    flash(n ? F('내 약에 {0}개를 추가했어요', n) : L('이미 모두 등록된 약이에요'));
    if (n) go('schedule');
  };
  const when = new Date(r.at).toLocaleDateString(s.lang === 'ko' ? 'ko-KR' : s.lang === 'en' ? 'en-US' : s.lang === 'zh' ? 'zh-CN' : 'ja-JP');
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="SCAN RESULT" title={r.found.length ? F('{0}개의 약을 찾았어요', r.found.length) : L('약 이름을 찾지 못했어요')}
        sub={`${when} · ${L(KIND[r.kind])}`} size={24} />
      {!r.found.length && (
        <div className="col" style={{ gap: 10 }}>
          <div className="lead">{L('글자가 흐리거나 약 이름이 잘렸을 수 있어요. 밝은 곳에서 약 이름이 크게 나오게 다시 찍거나, 이름으로 찾아 주세요.')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary cta" style={{ flex: 1 }} onClick={() => go('scan')}>{L('다시 스캔')}</button>
            <button className="btn btn-secondary cta" style={{ flex: 1 }} onClick={() => go('search')}>{L('이름으로 찾기')}</button>
          </div>
        </div>
      )}
      <div className="col rule-top">
        {r.found.map((f, i) => {
          const k = keyOf(f), owned = have.has(k), pk = per[k], until = untilOf(k);
          return (
            <DrugRow key={k} f={f} color={['#efe9da', '#e3b37a', '#f6f3ec', '#e9b6b0', '#b9d3c4'][i % 5]} onOpen={() => openDrug(f)}
              right={owned ? <span className="sub" style={{ fontSize: 11.5, flex: 'none' }}>{L('등록됨')}</span>
                : <button role="checkbox" aria-checked={!!pick[k]} aria-label={L('추가할 약으로 고르기')} onClick={() => setPick(p => ({ ...p, [k]: !p[k] }))}
                  className={'tick' + (pick[k] ? ' on' : '')}>{pick[k] ? '✓' : ''}</button>}
              foot={(f.guess || (dosed && !owned && pick[k] && pk)) ? (
                <div className="col" style={{ gap: 8 }}>
                  {f.guess && <span style={{ fontSize: 12, color: 'var(--color-accent-800)', fontStyle: 'italic' }}>{L('글자가 흐려 비슷한 이름으로 찾았어요. 맞는 약인지 확인해 주세요.')}</span>}
                  {dosed && !owned && pick[k] && pk && <>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--color-accent-700)' }}>
                      {[f.times ? F('1일 {0}회', f.times) : L('복용 횟수를 못 읽었어요'), pk.days ? F('{0}일분', pk.days) : ''].filter(Boolean).join(' · ')}
                    </span>
                    {until && <span className="muted">{F('{0}까지', fmtDay(until, s.lang))}</span>}
                    {pk.days && <button className="tap link-u" style={{ fontSize: 12, color: 'var(--color-neutral-700)' }} onClick={() => setPer(p => ({ ...p, [k]: { ...p[k], days: undefined } }))}>{L('기간 빼기')}</button>}
                  </div>
                  <SlotChips compact value={pk.slots} onChange={v => setPer(p => ({ ...p, [k]: { ...p[k], slots: v } }))} />
                  </>}
                </div>
              ) : undefined} />
          );
        })}
      </div>
      {dosed && chosen.length > 0 && <span className="sub" style={{ fontSize: 12.5, marginTop: -6 }}>{L('처방전에 적힌 복용 횟수와 일수로 먹는 시간을 골라 두었어요. 맞는지 확인하고 눌러서 바꿀 수 있어요.')}</span>}
      {!dosed && chosen.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          <span className="label">{L('언제 드세요? 눌러서 여러 개 고를 수 있어요')}</span>
          <SlotChips value={slots} onChange={setSlots} />
        </div>
      )}
      {r.found.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary cta" style={{ flex: 1 }} disabled={!chosen.length} onClick={add}>{chosen.length ? F('내 약에 추가 ({0})', chosen.length) : t.addSched}</button>
          <button className="btn btn-secondary cta" style={{ flex: 1 }} onClick={() => go('symptom')}>{t.bySym}</button>
        </div>
      )}
    </div>
  );
}

const DETAIL_TABS = [['how', '복용·출처'], ['adr', '이상반응'], ['organ', '신·간기능']] as const;
const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--color-divider)' } as const;

export function Detail() {
  const { s, me, set, edit, go, addMeds, flash, t, L, F } = useApp();
  const f = s.drug;
  const info = drugInfo(f, s.details, s.D, s.lang);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const mine = me.meds.find(m => m.key === keyOf(f));
  const organ = [
    { title: '신기능 저하', v: organView(info.dets, 'renal') },
    { title: '간기능 저하', v: organView(info.dets, 'hepatic') },
  ];
  const en = f.ids.map(i => s.D?.drugs.find(d => d.id === i)?.en || '').filter(Boolean).join(' / ').toUpperCase();
  const rows = all ? info.rows : info.rows.slice(0, 12);
  const top = info.rows[0];
  const [pickSlots, setPickSlots] = useState<SlotKey[]>(['m']);
  const setSlots = (v: SlotKey[]) => {
    if (!mine) return;
    edit(m => ({ meds: m.meds.map(x => x.key !== mine.key ? x : { ...x, slots: v }) }));
  };
  const pro = s.role === 'pro', LV = levels(s.role);
  return (
    <div className="page">
      <Back />
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div className="plate" style={{ width: 84, height: 84, flex: 'none', background: 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 6px,var(--color-neutral-100) 6px 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 34, height: 16, borderRadius: 8, background: mine?.color || '#efe9da', border: '1px solid var(--color-neutral-500)' }} />
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="kicker ellip" style={{ letterSpacing: '.2em' }}>{en}</span>
          <span className="serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.35, wordBreak: 'keep-all' }}>{f.name}</span>
          <span className="sub">{f.ids.map(i => ingName(i, s.lang)).join(' · ')}</span>
          {pro && info.dets.map(({ id, d }) => <span key={id} className="muted tnum" style={{ fontSize: 11.5 }}>{L('품목기준코드')} {d.seq}</span>)}
        </div>
      </div>
      {mine ? (
        <div className="col" style={{ gap: 8 }}>
          <span className="label">{L('먹는 시간 · 눌러서 바꾸세요')}</span>
          <SlotChips value={mine.slots} onChange={setSlots} />
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          <span className="label">{L('언제 드세요? 눌러서 여러 개 고를 수 있어요')}</span>
          <SlotChips value={pickSlots} onChange={setPickSlots} />
          <button className="btn btn-primary cta" onClick={() => { addMeds([f], pickSlots); flash(L('내 약에 추가했어요')); }}>{L('내 약에 추가')}</button>
        </div>
      )}

      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--color-divider)' }}>
        {DETAIL_TABS.map(([k, l]) => {
          const on = s.dtab === k;
          return (
            <button key={k} role="tab" aria-selected={on} className="tap serif" onClick={() => set({ dtab: k })}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0 11px', fontSize: 14, color: on ? 'var(--color-accent-700)' : 'var(--color-neutral-600)', borderBottom: `1px solid ${on ? 'var(--color-accent)' : 'transparent'}`, marginBottom: -1 }}>
              {L(l)}
            </button>
          );
        })}
      </div>

      {info.loading && !info.dets.length && <div className="sub">{L('첨부문서를 불러오는 중…')}</div>}
      {info.err && !info.dets.length && <div style={{ fontSize: 13, color: 'var(--color-accent-800)' }}>{L('정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')}</div>}

      {s.dtab === 'adr' && info.dets.length > 0 && (
        <div className="col">
          {!info.rows.length && <div className="sub">{L('첨부문서에서 정리된 이상반응 항목이 없어요.')}</div>}
          {rows.map(a => (
            <button key={a.pid} onClick={() => setOpen(open === a.pid ? null : a.pid)} className="tap hov col" style={{ ...row, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div className="row" style={{ gap: 12, width: '100%' }}>
                <span style={{ flex: 1, fontSize: 14 }}>{a.name}{a.ing && <span className="muted" style={{ fontSize: 11.5 }}> · {a.ing}</span>}</span>
                {pro && <span className="muted" style={{ fontSize: 11.5, flex: 'none', maxWidth: 90, textAlign: 'right' }}>{L(a.freq)}</span>}
                <span style={{ width: 78, flex: 'none', textAlign: 'center', fontSize: 11, padding: '2px 0', borderRadius: 3, border: `1px solid ${LV[a.lv].bd}`, color: LV[a.lv].c }}>{L(LV[a.lv].t)}</span>
              </div>
              {open === a.pid && <span className="serif just" style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--color-neutral-800)' }}>“{a.quote}”</span>}
            </button>
          ))}
          {info.rows.length > 12 && !all && <button className="btn btn-secondary cta" onClick={() => setAll(true)} style={{ marginTop: 12 }}>{F('모두 보기 ({0})', info.rows.length)}</button>}
          {top && (
            <div style={{ marginTop: 22, padding: '18px 4px 0', borderTop: '1px solid var(--color-accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="kicker" style={{ letterSpacing: '.2em' }}>FROM THE PACKAGE INSERT</span>
              <span className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{t.evidence} · {top.name}</span>
              <span className="serif just" style={{ fontSize: 14, lineHeight: 1.85 }}>“{top.quote}”</span>
              {info.dets.map(({ id, d }) => (
                <a key={id} href={nedrugLink(d.seq)} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontStyle: 'italic' }}>{t.source}{info.dets.length > 1 ? ' · ' + ingName(id, s.lang) : ''}</a>
              ))}
            </div>
          )}
          <div className="fine" style={{ marginTop: 14 }}>{L('항목을 누르면 첨부문서 원문 문장이 보여요.')}</div>
          <button className="btn btn-secondary cta" onClick={() => go('symptom')} style={{ marginTop: 12 }}>{t.compare}</button>
        </div>
      )}

      {s.dtab === 'organ' && info.dets.length > 0 && (
        <div className="col">
          {organ.map(o => {
            const b = o.v.tag ? TAG[o.v.tag] : null;
            return (
              <div key={o.title} style={{ padding: '16px 0', borderBottom: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{L(o.title)}</span>
                  {b ? <Badge b={{ t: L(o.v.tag === '용량' ? '용량 조절' : o.v.tag === '불필요' ? '조절 불필요' : o.v.tag!), c: b.c, bd: b.bd }} style={{ padding: '2px 10px', alignSelf: 'center' }} />
                    : <span className="sub" style={{ fontSize: 11.5 }}>{L('기재 없음')}</span>}
                </div>
                {o.v.lines.map(x => <div key={x} className="just" style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--color-neutral-800)' }}>{x}</div>)}
                {!o.v.lines.length && <div className="sub">{L('첨부문서에 따로 적힌 내용이 없어요.')}</div>}
              </div>
            );
          })}
          <div className="fine" style={{ marginTop: 12 }}>{t.organNote}</div>
        </div>
      )}

      {s.dtab === 'how' && (
        <div className="col">
          {info.dets.map(({ id, d }) => (
            <div key={id} className="col" style={{ borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ display: 'flex', gap: 16, padding: '14px 0 6px' }}><span className="label" style={{ width: 72, flex: 'none' }}>{L('기준 제품')}</span><span style={{ fontSize: 13.5, lineHeight: 1.7 }}>{d.product}</span></div>
              <div style={{ display: 'flex', gap: 16, padding: '6px 0' }}><span className="label" style={{ width: 72, flex: 'none' }}>{L('개정일')}</span><span className="tnum" style={{ fontSize: 13.5 }}>{d.date ? `${d.date.slice(0, 4)}.${d.date.slice(4, 6)}.${d.date.slice(6, 8)}` : '—'}</span></div>
              <a href={nedrugLink(d.seq)} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontStyle: 'italic', padding: '6px 0 14px' }}>{L('복용법·용량은 식약처 원문에서 확인하세요 ↗')}</a>
            </div>
          ))}
          <div className="fine" style={{ marginTop: 12 }}>{L('복용량과 횟수는 처방받은 대로 드세요. 바꾸고 싶으면 의사·약사와 상의하세요.')}</div>
          {mine && (
            <button className="tap link-u" onClick={() => { edit(m => ({ meds: m.meds.filter(x => x.key !== mine.key) })); flash(L('내 약에서 뺐어요')); }}
              style={{ alignSelf: 'flex-start', fontSize: 12.5, marginTop: 14 }}>{L('내 약에서 빼기')}</button>
          )}
        </div>
      )}
    </div>
  );
}

const COMMON = ['dizziness', 'somnolence', 'edema', 'nausea', 'diarrhea', 'myalgia', 'rash', 'cough', 'headache', 'lft', 'renal_fx', 'weight_gain'];

export function Symptom() {
  const { s, me, set, edit, openDrug, flash, t, L } = useApp();
  const LV = levels(s.role);
  const matched = useMemo(() => (s.D && s.symText.trim() ? matchProblems(s.D, s.symText) : []), [s.D, s.symText]);
  const picked = [...new Set([...(matched.length ? [matched[0]] : []), ...s.sym])];
  const infos = me.meds.map(m => ({ m, info: drugInfo(m, s.details, s.D, s.lang) }));
  const resFor = (pid: string) => infos.map(({ m, info }) => ({ m, a: info.rows.find(r => r.pid === pid), loading: info.loading }))
    .filter(x => x.a).sort((a, b) => b.a!.lv - a.a!.lv);
  const logIt = () => {
    const d = new Date(), dd = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    const text = picked.map(p => probName(s.D, p, s.lang)).join(', ');
    const drugs = [...new Set(picked.flatMap(p => resFor(p).filter(x => x.a!.lv >= 3).map(x => x.m.name)))].slice(0, 3).join(', ');
    edit(m => ({ syms: [{ d: dd, text, drugs }, ...m.syms].slice(0, 50) }));
    flash(L('증상을 기록했어요'));
  };
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="SYMPTOM CHECK" title={t.symQ} sub={t.symSub} />
      <input className="inp" value={s.symText} onChange={e => set({ symText: e.target.value })} placeholder={L('예: 다리가 부어요, 졸려요, 간수치')} aria-label={L('증상 직접 입력')} />
      {s.symText.trim() && !matched.length && s.D && <div className="sub">{L('맞는 증상을 찾지 못했어요. 다른 말로 적거나 아래에서 골라 주세요.')}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {COMMON.map(n => {
          const on = s.sym.includes(n);
          return (
            <Chip key={n} on={on} style={{ padding: '7px 13px', fontSize: 13.5 }}
              onClick={() => set(x => ({ sym: on ? x.sym.filter(y => y !== n) : [...x.sym, n] }))}>{probName(s.D, n, s.lang).split('·')[0].split('(')[0]}</Chip>
          );
        })}
      </div>
      {!me.meds.length && <div className="empty">{L('먼저 먹고 있는 약을 등록해 주세요. 등록한 약 중에서 원인일 수 있는 약을 찾아드려요.')}</div>}
      {me.meds.length > 0 && picked.map(pid => {
        const res = resFor(pid);
        return (
          <div key={pid} className="col">
            <div className="sec-head"><span className="name">{probName(s.D, pid, s.lang)}</span></div>
            {res.map(({ m, a }) => (
              <button key={m.key} onClick={() => openDrug(m)} className="tap hov" style={row}>
                <span className="pill-swatch" style={{ background: m.color }} />
                <span className="serif" style={{ flex: 1, fontSize: 14 }}>{m.name}</span>
                <Badge b={trBadge(LV[a!.lv], L)} style={{ alignSelf: 'center' }} />
              </button>
            ))}
            {!res.length && <div className="sub" style={{ padding: '10px 0' }}>{L('등록한 약의 첨부문서에는 이 증상이 적혀 있지 않아요.')}</div>}
          </div>
        );
      })}
      {me.meds.length > 0 && !picked.length && <div className="empty">{t.symEmpty}</div>}
      {me.meds.length > 0 && picked.length > 0 && <button className="btn btn-secondary cta" onClick={logIt}>{L('이 증상 기록해 두기')}</button>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 11 }} className="muted">
        {([4, 3, 2, 1] as Level[]).map(k => (
          <span key={k} className="row" style={{ gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, border: `1px solid ${LV[k].bd}` }} /><span style={{ color: LV[k].c }}>{L(LV[k].t)}</span> · {L(LV[k].d)}
          </span>
        ))}
      </div>
      <div className="fine">{L('첨부문서에 적힌 내용을 보여드리는 것이며, 진단이 아니에요. 증상이 심하거나 계속되면 의사·약사와 상의하세요.')}</div>
    </div>
  );
}
