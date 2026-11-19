import { useEffect, useMemo, useState } from 'react';
import { LV, SLOT_KEYS, SLOT_SHORT, TAG, type Level, type SlotKey } from '../data';
import { drugInfo, organView, topLevel, trBadge, watchCount } from '../derive';
import { useApp } from '../state';
import { ingName, matchProblems, nedrugLink, probName, type Found } from '../real';
import { Back, Badge, Chip, Heading } from '../ui';

export const pillIcon = (color: string) => (
  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg)', border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <span style={{ width: 20, height: 11, borderRadius: 6, background: color }} />
  </div>
);

const KIND: Record<string, string> = { rx: '처방전 글자 인식', photo: '사진 글자 인식', barcode: '바코드', pill: '알약 모양' };
const keyOf = (f: Found) => f.ids.slice().sort().join('+');

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
          <button key={k} aria-pressed={on} onClick={() => toggle(k)} className={'chip' + (on ? ' on' : '')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: compact ? '6px 2px' : '9px 2px', borderRadius: 12, minHeight: compact ? 40 : 48 }}>
            <span style={{ fontSize: compact ? 13 : 14, fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{L(SLOT_SHORT[k])}</span>
            <span style={{ fontSize: 10.5, opacity: 0.75 }}>{s.times[k]}</span>
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
  const top = LV[topLevel(info.rows)], n = watchCount(info.rows);
  return (
    <div className="card col" style={{ padding: 16, gap: 12, border: '1px solid rgba(201,164,92,.14)' }}>
    <div className="row" style={{ gap: 14 }}>
      <button onClick={onOpen} className="row hoverable" style={{ flex: 1, minWidth: 0, gap: 14, textAlign: 'left' }}>
        {pillIcon(color)}
        <div className="col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{f.ids.map(i => ingName(i, s.lang)).join(' · ')}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {info.loading ? <span className="badge" style={{ color: 'var(--muted)', border: '1px solid rgba(241,234,217,.14)' }}>{L('불러오는 중…')}</span>
              : info.rows.length ? <>
                <Badge b={{ t: n ? F('흔한 이상반응 {0}', n) : F('최고 단계 · {0}', L(top.t)), c: top.c, bg: top.bg }} />
                <span className="badge" style={{ fontWeight: 400, border: '1px solid rgba(241,234,217,.14)', color: 'var(--ink-body)' }}>{F('이상반응 {0}개', info.rows.length)}</span>
              </> : <span className="badge" style={{ fontWeight: 400, border: '1px solid rgba(241,234,217,.14)', color: 'var(--muted)' }}>{L('정리된 이상반응 없음')}</span>}
          </div>
        </div>
      </button>
      {right ?? <span className="chev">›</span>}
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
  useEffect(() => { setPick(Object.fromEntries((r?.found || []).map(f => [keyOf(f), !have.has(keyOf(f))]))); }, [r]);
  if (!r) return <div className="screen"><Back /></div>;
  const chosen = r.found.filter(f => pick[keyOf(f)] && !have.has(keyOf(f)));
  const add = () => {
    const n = addMeds(chosen, slots);
    flash(n ? F('내 약에 {0}개를 추가했어요', n) : L('이미 모두 등록된 약이에요'));
    if (n) go('schedule');
  };
  const when = new Date(r.at).toLocaleDateString(s.lang === 'ko' ? 'ko-KR' : s.lang === 'en' ? 'en-US' : s.lang === 'zh' ? 'zh-CN' : 'ja-JP');
  return (
    <div className="screen" style={{ gap: 16 }}>
      <Back />
      <Heading eyebrow="SCAN RESULT" title={r.found.length ? F('{0}개의 약을 찾았어요', r.found.length) : L('약 이름을 찾지 못했어요')}
        sub={`${when} · ${L(KIND[r.kind])}`} size={24} />
      {!r.found.length && (
        <div className="col" style={{ gap: 10 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-body)', lineHeight: 1.7 }}>{L('글자가 흐리거나 약 이름이 잘렸을 수 있어요. 밝은 곳에서 약 이름이 크게 나오게 다시 찍거나, 이름으로 찾아 주세요.')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={() => go('scan')}>{L('다시 스캔')}</button>
            <button className="btn-line" style={{ flex: 1 }} onClick={() => go('search')}>{L('이름으로 찾기')}</button>
          </div>
        </div>
      )}
      <div className="col" style={{ gap: 10 }}>
        {r.found.map((f, i) => {
          const k = keyOf(f), owned = have.has(k);
          return (
            <DrugRow key={k} f={f} color={['#efe9da', '#e3b37a', '#f6f3ec', '#e9b6b0', '#b9d3c4'][i % 5]} onOpen={() => openDrug(f)}
              right={owned ? <span style={{ fontSize: 11.5, color: 'var(--muted)', flex: 'none' }}>{L('등록됨')}</span>
                : <button role="checkbox" aria-checked={!!pick[k]} aria-label={L('추가할 약으로 고르기')} onClick={() => setPick(p => ({ ...p, [k]: !p[k] }))}
                  style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, border: '1.5px solid #c9a45c', background: pick[k] ? 'var(--gold-orb)' : 'transparent', color: '#0b1d16', fontWeight: 700 }}>{pick[k] ? '✓' : ''}</button>} />
          );
        })}
      </div>
      {chosen.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--gold)' }}>{L('언제 드세요? 눌러서 여러 개 고를 수 있어요')}</span>
          <SlotChips value={slots} onChange={setSlots} />
        </div>
      )}
      {r.found.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-gold" style={{ flex: 1 }} disabled={!chosen.length} onClick={add}>{chosen.length ? F('내 약에 추가 ({0})', chosen.length) : t.addSched}</button>
          <button className="btn-line" style={{ flex: 1 }} onClick={() => go('symptom')}>{t.bySym}</button>
        </div>
      )}
    </div>
  );
}

const DETAIL_TABS = [['adr', '이상반응'], ['organ', '신·간기능'], ['how', '복용·출처']] as const;

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
  return (
    <div className="screen">
      <Back />
      <div className="row" style={{ gap: 16 }}>
        <div style={{ width: 84, height: 84, borderRadius: 20, background: 'repeating-linear-gradient(135deg,#183a2c 0 7px,#143326 7px 14px)', border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ width: 34, height: 18, borderRadius: 9, background: mine?.color || '#efe9da', boxShadow: '0 0 0 3px rgba(0,0,0,.2)' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ letterSpacing: '.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{en}</div>
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, marginTop: 4, wordBreak: 'keep-all' }}>{f.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{f.ids.map(i => ingName(i, s.lang)).join(' · ')}</div>
        </div>
      </div>
      {mine ? (
        <div className="col" style={{ gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--gold)' }}>{L('먹는 시간 · 눌러서 바꾸세요')}</span>
          <SlotChips value={mine.slots} onChange={setSlots} />
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--gold)' }}>{L('언제 드세요? 눌러서 여러 개 고를 수 있어요')}</span>
          <SlotChips value={pickSlots} onChange={setPickSlots} />
          <button className="btn-gold" onClick={() => { addMeds([f], pickSlots); flash(L('내 약에 추가했어요')); }} style={{ height: 46 }}>{L('내 약에 추가')}</button>
        </div>
      )}

      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid rgba(201,164,92,.18)' }}>
        {DETAIL_TABS.map(([k, l]) => {
          const on = s.dtab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => set({ dtab: k })}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0 11px', fontSize: 14, color: on ? 'var(--gold-light)' : 'var(--muted)', fontWeight: on ? 700 : 400, borderBottom: `2px solid ${on ? '#c9a45c' : 'transparent'}`, marginBottom: -1 }}>
              {L(l)}
            </button>
          );
        })}
      </div>

      {info.loading && !info.dets.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{L('첨부문서를 불러오는 중…')}</div>}
      {info.err && !info.dets.length && <div style={{ fontSize: 13, color: '#eb9a89' }}>{L('정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')}</div>}

      {s.dtab === 'adr' && info.dets.length > 0 && (
        <div className="col" style={{ gap: 10 }}>
          {!info.rows.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{L('첨부문서에서 정리된 이상반응 항목이 없어요.')}</div>}
          {rows.map(a => (
            <button key={a.pid} onClick={() => setOpen(open === a.pid ? null : a.pid)} className="col" style={{ borderRadius: 14, padding: '13px 14px', background: 'var(--card)', gap: 8, textAlign: 'left' }}>
              <div className="row" style={{ gap: 10, width: '100%' }}>
                <Badge b={trBadge(LV[a.lv], L)} style={{ padding: '3px 9px', flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 14 }}>{a.name}{a.ing && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}> · {a.ing}</span>}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', flex: 'none', maxWidth: 90, textAlign: 'right' }}>{L(a.freq)}</span>
              </div>
              {open === a.pid && <span className="serif" style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--ink-soft)' }}>“{a.quote}”</span>}
            </button>
          ))}
          {info.rows.length > 12 && !all && <button className="btn-line" onClick={() => setAll(true)} style={{ height: 44, fontSize: 13.5, fontWeight: 400 }}>{F('모두 보기 ({0})', info.rows.length)}</button>}
          {top && (
            <div className="col" style={{ borderLeft: '2px solid #c9a45c', padding: '4px 0 4px 14px', marginTop: 6, gap: 6 }}>
              <span style={{ fontSize: 11.5, color: 'var(--gold)', fontWeight: 500 }}>{t.evidence} · {top.name}</span>
              <span className="serif" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)' }}>“{top.quote}”</span>
              {info.dets.map(({ id, d }) => (
                <a key={id} href={nedrugLink(d.seq)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>{t.source}{info.dets.length > 1 ? ' · ' + ingName(id, s.lang) : ''}</a>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.6 }}>{L('항목을 누르면 첨부문서 원문 문장이 보여요.')}</div>
          <button className="btn-line" onClick={() => go('symptom')} style={{ height: 48, fontSize: 14, fontWeight: 400, marginTop: 6 }}>{t.compare}</button>
        </div>
      )}

      {s.dtab === 'organ' && info.dets.length > 0 && (
        <div className="col" style={{ gap: 10 }}>
          {organ.map(o => {
            const b = o.v.tag ? TAG[o.v.tag] : null;
            return (
              <div key={o.title} className="col" style={{ borderRadius: 16, padding: 16, background: 'var(--card)', gap: 8 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{L(o.title)}</span>
                  {b ? <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: b.bg, color: b.c }}>{L(o.v.tag === '용량' ? '용량 조절' : o.v.tag === '불필요' ? '조절 불필요' : o.v.tag!)}</span>
                    : <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{L('기재 없음')}</span>}
                </div>
                {o.v.lines.map(x => <div key={x} style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-body)' }}>{x}</div>)}
                {!o.v.lines.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{L('첨부문서에 따로 적힌 내용이 없어요.')}</div>}
              </div>
            );
          })}
          <div style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.6 }}>{t.organNote}</div>
        </div>
      )}

      {s.dtab === 'how' && (
        <div className="col" style={{ gap: 4 }}>
          {mine ? (
            <div className="col" style={{ gap: 10, padding: '6px 0 14px', borderBottom: '1px solid rgba(241,234,217,.08)' }}>
              <button onClick={() => { edit(m => ({ meds: m.meds.filter(x => x.key !== mine.key) })); flash(L('내 약에서 뺐어요')); }}
                style={{ alignSelf: 'flex-start', fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline' }}>{L('내 약에서 빼기')}</button>
            </div>
          ) : null}
          {info.dets.map(({ id, d }) => (
            <div key={id} className="col" style={{ gap: 4, padding: '14px 0', borderBottom: '1px solid rgba(241,234,217,.08)' }}>
              <div style={{ display: 'flex', gap: 14 }}><span style={{ width: 72, flex: 'none', fontSize: 12.5, color: 'var(--gold)' }}>{L('기준 제품')}</span><span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{d.product}</span></div>
              <div style={{ display: 'flex', gap: 14 }}><span style={{ width: 72, flex: 'none', fontSize: 12.5, color: 'var(--gold)' }}>{L('개정일')}</span><span style={{ fontSize: 13.5 }}>{d.date ? `${d.date.slice(0, 4)}.${d.date.slice(4, 6)}.${d.date.slice(6, 8)}` : '—'}</span></div>
              <a href={nedrugLink(d.seq)} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', marginTop: 4 }}>{L('복용법·용량은 식약처 원문에서 확인하세요 ↗')}</a>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.6, marginTop: 8 }}>{L('복용량과 횟수는 처방받은 대로 드세요. 바꾸고 싶으면 의사·약사와 상의하세요.')}</div>
        </div>
      )}
    </div>
  );
}

const COMMON = ['dizziness', 'somnolence', 'edema', 'nausea', 'diarrhea', 'myalgia', 'rash', 'cough', 'headache', 'lft', 'renal_fx', 'weight_gain'];

export function Symptom() {
  const { s, me, set, edit, openDrug, flash, t, L } = useApp();
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
    <div className="screen">
      <Back />
      <div>
        <div className="eyebrow">SYMPTOM CHECK</div>
        <div className="title">{t.symQ}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>{t.symSub}</div>
      </div>
      <input className="field" value={s.symText} onChange={e => set({ symText: e.target.value })} placeholder={L('예: 다리가 부어요, 졸려요, 간수치')} aria-label={L('증상 직접 입력')} />
      {s.symText.trim() && !matched.length && s.D && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L('맞는 증상을 찾지 못했어요. 다른 말로 적거나 아래에서 골라 주세요.')}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {COMMON.map(n => {
          const on = s.sym.includes(n);
          return (
            <Chip key={n} on={on} style={{ padding: '8px 14px', fontSize: 13.5 }}
              onClick={() => set(x => ({ sym: on ? x.sym.filter(y => y !== n) : [...x.sym, n] }))}>{probName(s.D, n, s.lang).split('·')[0].split('(')[0]}</Chip>
          );
        })}
      </div>
      {!me.meds.length && <div style={{ border: '1px dashed rgba(201,164,92,.3)', borderRadius: 16, padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{L('먼저 먹고 있는 약을 등록해 주세요. 등록한 약 중에서 원인일 수 있는 약을 찾아드려요.')}</div>}
      {me.meds.length > 0 && picked.map(pid => {
        const res = resFor(pid);
        return (
          <div key={pid} className="col" style={{ gap: 8 }}>
            <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold-light)' }}>{probName(s.D, pid, s.lang)}</div>
            {res.map(({ m, a }) => (
              <button key={m.key} onClick={() => openDrug(m)} className="row" style={{ borderRadius: 14, padding: '13px 14px', background: 'var(--card)', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 14, textAlign: 'left' }}>{m.name}</span>
                <Badge b={trBadge(LV[a!.lv], L)} style={{ padding: '3px 9px' }} />
              </button>
            ))}
            {!res.length && <div style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 2px' }}>{L('등록한 약의 첨부문서에는 이 증상이 적혀 있지 않아요.')}</div>}
          </div>
        );
      })}
      {me.meds.length > 0 && !picked.length && (
        <div style={{ border: '1px dashed rgba(201,164,92,.3)', borderRadius: 16, padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>{t.symEmpty}</div>
      )}
      {me.meds.length > 0 && picked.length > 0 && <button className="btn-line" onClick={logIt} style={{ height: 46, fontWeight: 400 }}>{L('이 증상 기록해 두기')}</button>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 11, color: 'var(--muted)' }}>
        {([4, 3, 2, 1] as Level[]).map(k => (
          <span key={k} className="row" style={{ gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: LV[k].c }} />{L(LV[k].t)} · {L(LV[k].d)}
          </span>
        ))}
      </div>
      <div className="fine">{L('첨부문서에 적힌 내용을 보여드리는 것이며, 진단이 아니에요. 증상이 심하거나 계속되면 의사·약사와 상의하세요.')}</div>
    </div>
  );
}
