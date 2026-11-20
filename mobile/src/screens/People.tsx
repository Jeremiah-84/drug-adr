import { useState } from 'react';
import { LANGS, type Lang } from '../i18n';
import { adherence, slotViews } from '../derive';
import { newMember, useApp, type Role, type TextSize, type Theme } from '../state';
import { Back, Chip, Heading, Segment } from '../ui';
import { ChevronLeft, ChevronRight, Plus } from '../icons';
import { toggleDiag } from '../Diag';

const LANG_NAMES: Record<Lang, string> = { ko: '한국어', en: 'English', zh: '中文', ja: '日本語' };
const LANG_CODES: Record<Lang, string> = { ko: 'KO', en: 'EN', zh: '中', ja: '日' };
const ROLES: Record<Role, { t: string; s: string; meta: string }> = {
  patient: { t: '환자 · 보호자', s: '내 약과 가족의 복약을 관리합니다.', meta: '환자용' },
  pro: { t: '의료 관계자', s: '의사 · 약사 · 간호사. 성분 코드와 허가정보 원문을 함께 봅니다.', meta: '의료진용' },
};
export { ROLES };
const initialOf = (name: string, rel: string) => (name || rel || '?').slice(0, 1);

/** Small outlined language cycler (KO → EN → 中 → 日). */
export function LangButton() {
  const { s, set } = useApp();
  const next = LANGS[(LANGS.indexOf(s.lang) + 1) % LANGS.length];
  return (
    <button type="button" className="g lang-btn" aria-label={`Language: ${LANG_NAMES[s.lang]}`} onClick={() => set({ lang: next })}
      style={{ height: 32, minWidth: 38, padding: '0 10px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', background: 'none', color: 'var(--color-text)' }}>
      {LANG_CODES[s.lang]}
    </button>
  );
}

/** App build number shown in 마이 so we can tell whether a phone has the latest version.
 *  Keep it equal to the number in public/sw.js's cache name. */
const APP_BUILD = 26;

export function My() {
  const { s, me, set, go, tab, flash, t, L, F } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const reminders = Object.values(s.remind).filter(Boolean).length;
  const ver = s.D?.version ? `${s.D.version.slice(0, 4)}.${s.D.version.slice(5, 7)}.${s.D.version.slice(8, 10)}` : '';
  const saveName = () => {
    set(x => { const members = x.members.slice(); members[x.member] = { ...members[x.member], name: name.trim() }; return { members }; });
    setEditing(false);
  };
  const askNotify = async () => {
    if (!('Notification' in window)) { flash(L('이 브라우저는 알림을 지원하지 않아요')); return; }
    const p = await Notification.requestPermission();
    flash(L(p === 'granted' ? '알림을 허용했어요' : '알림이 꺼져 있어요. 브라우저 설정에서 켤 수 있어요'));
  };
  const menu = [
    { t: '복약 알림 설정', v: reminders ? F('{0}개 켜짐', reminders) : '', go: () => go('schedule') },
    { t: '휴대폰 알림 허용', v: 'Notification' in window ? L(Notification.permission === 'granted' ? '허용됨' : '꺼짐') : '', go: askNotify },
    { t: '혈압 · 당뇨 수첩', v: '', go: () => go('vitals') },
    { t: '가족 · 보호자 관리', v: F('{0}명', s.members.length), go: () => go('family') },
    { t: '복약 기록', v: '', go: () => tab('history') },
    { t: '건강 리포트', v: '', go: () => go('report') },
    { t: '병원·약국 찾기', v: '', go: () => go('pharmacy') },
    { t: '오늘의 문장 다시 보기', v: '', go: () => set(x => ({ splash: true, splashKey: x.splashKey + 1 })) },
    { t: '온보딩 다시 보기', v: '', go: () => set({ stack: ['onboarding'], onb: 0 }) },
    { t: '의료진용 웹 버전', v: '', go: () => { location.href = '../index.html'; } },
    { t: '개인정보 처리방침', v: '', go: () => { location.href = '../privacy.html'; } },
  ];
  const role = s.role || 'patient';
  return (
    <div className="page" style={{ paddingTop: 16, gap: 22 }}>
      <span className="kicker">PROFILE</span>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', paddingBottom: 22, borderBottom: '1px solid var(--color-divider)' }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 22, boxShadow: 'inset 0 0 0 4px var(--color-bg),inset 0 0 0 5px color-mix(in srgb,var(--color-accent) 40%,transparent)' }}>{initialOf(me.name, L(me.rel))}</div>
        {editing ? (
          <div className="row" style={{ gap: 8, flex: 1, minWidth: 0 }}>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder={L('이름 (선택)')} aria-label={L('이름')} style={{ height: 42 }} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveName(); }} />
            <button className="btn btn-primary" onClick={saveName} style={{ height: 42, flex: 'none' }}>{t.save}</button>
          </div>
        ) : (
          <button className="tap" onClick={() => { setName(me.name); setEditing(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{me.name || L(me.rel)}</span>
            <span className="sub">{L(ROLES[role].meta)} · {F('복용 중 {0}개', me.meds.length)} · <span className="link-u">{L('이름 바꾸기')}</span></span>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{L('사용자 역할')}</span>
        <Segment<Role> items={(Object.keys(ROLES) as Role[]).map(k => [k, L(ROLES[k].t)])} value={role} onPick={k => set({ role: k })} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{t.langLabel}</span>
        <Segment<Lang> small items={LANGS.map(k => [k, LANG_NAMES[k]])} value={s.lang} onPick={k => set({ lang: k })} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{L('글자 크기')}</span>
        <Segment<TextSize> items={[['m', L('보통')], ['l', L('크게')], ['xl', L('아주 크게')]]} value={s.text || 'm'} onPick={k => set({ text: k })} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{L('화면 색')}</span>
        <Segment<Theme> small items={[['light', L('밝게')], ['dark', L('어둡게')], ['auto', L('기기 설정 따르기')]]} value={s.theme || 'light'} onPick={k => set({ theme: k })} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{t.family}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {s.members.slice(0, 3).map((m, i) => {
            const on = s.member === i;
            return (
              <button key={m.id} className="tap fam-card" onClick={() => { set({ member: i }); flash(F('{0} 님 화면으로 전환했어요', m.name || L(m.rel))); }}
                style={{ flex: 1, minWidth: 0, padding: '12px 6px', textAlign: 'center', border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-divider)'}`, borderRadius: 'var(--radius-md)' }}>
                <div className="avatar" style={{ width: 34, height: 34, margin: '0 auto', fontSize: 13 }}>{initialOf(m.name, L(m.rel))}</div>
                <div className="ellip" style={{ fontSize: 12, marginTop: 6, color: on ? 'var(--color-accent-700)' : undefined }}>{L(m.rel)}</div>
              </button>
            );
          })}
          <button className="tap fam-card" onClick={() => go('family')}
            style={{ flex: 1, minWidth: 0, padding: '12px 6px', textAlign: 'center', border: '1px dashed var(--color-neutral-400)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: 34, height: 34, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><Plus /></div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t.manage}</div>
          </button>
        </div>
      </div>
      <div className="col rule-top">
        {menu.map(mn => (
          <button key={mn.t} className="tap hov" onClick={mn.go} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <span className="serif" style={{ flex: 1, fontSize: 14.5 }}>{L(mn.t)}</span>
            <span className="sub">{mn.v}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <div className="fine"><span onClick={toggleDiag}>{'v' + APP_BUILD}</span>{' · '}{ver ? F('데이터 {0} 갱신', ver) + ' · ' : ''}{L('사진과 기록은 이 기기 안에만 저장되고 서버로 보내지 않아요.')}</div>
    </div>
  );
}

const RELS = ['나', '어머니', '아버지', '배우자', '아들', '딸', '할머니', '할아버지', '기타'];

export function Family() {
  const { s, set, flash, t, L, F } = useApp();
  const [name, setName] = useState('');
  const [rel, setRel] = useState('어머니');
  const [del, setDel] = useState<number | null>(null);
  const add = () => {
    set(x => ({ members: [...x.members, newMember(name.trim(), rel)] }));
    setName(''); flash(L('가족을 추가했어요'));
  };
  const remove = (i: number) => {
    set(x => { const members = x.members.filter((_, j) => j !== i); return { members, member: x.member === i ? 0 : x.member > i ? x.member - 1 : x.member }; });
    setDel(null);
  };
  return (
    <div className="page">
      <Back />
      <Heading eyebrow="FAMILY CARE" title={t.familyTitle} sub={L('가족마다 약과 기록을 따로 관리해요. 이 휴대폰 안에만 저장돼요.')} />
      <div className="col rule-top">
        {s.members.map((m, i) => {
          const r = adherence(m, 7);
          const sv = slotViews(s, m).filter(x => x.meds.length);
          return (
            <div key={m.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="avatar" style={{ width: 42, height: 42, fontSize: 15, borderWidth: s.member === i ? 2 : 1 }}>{initialOf(m.name, L(m.rel))}</span>
                <button className="tap" style={{ flex: 1, minWidth: 0 }} onClick={() => set({ member: i })}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{m.name || L(m.rel)} {m.name && <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>· {L(m.rel)}</span>}</div>
                  <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>{F('복용 중 {0}개', m.meds.length)}{s.member === i ? ' · ' + L('지금 보는 중') : ''}</div>
                </button>
                <div style={{ textAlign: 'right' }}>
                  <div className="g tnum" style={{ fontSize: 26, lineHeight: 1 }}>{r.pct === null ? '—' : r.pct + '%'}</div>
                  <div className="muted" style={{ fontSize: 10.5 }}>{L('이번 주')}</div>
                </div>
              </div>
              {sv.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sv.length},minmax(0,1fr))`, gap: 10 }}>
                  {sv.map(x => {
                    const miss = x.ss === 'missed';
                    return (
                      <div key={x.k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ height: 2, background: miss ? 'var(--color-accent-800)' : x.taken ? 'var(--color-accent)' : 'var(--color-divider)' }} />
                        <span style={{ fontSize: 11, color: miss ? 'var(--color-accent-800)' : x.taken ? 'var(--color-accent-700)' : 'var(--color-neutral-600)' }}>
                          {L(x.label)} · {L(miss ? '누락' : x.taken ? '완료' : '예정')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {i > 0 && (del === i ? (
                <div className="row" style={{ gap: 10, justifyContent: 'flex-end', fontSize: 12.5 }}>
                  <span className="muted" style={{ fontStyle: 'italic' }}>{L('이 가족의 약과 기록을 모두 지울까요?')}</span>
                  <button className="btn btn-secondary" style={{ height: 32 }} onClick={() => setDel(null)}>{L('취소')}</button>
                  <button className="btn btn-primary" style={{ height: 32 }} onClick={() => remove(i)}>{L('삭제')}</button>
                </div>
              ) : (
                <button className="tap link-u" onClick={() => setDel(i)} style={{ alignSelf: 'flex-end', fontSize: 12 }}>{L('삭제')}</button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="col" style={{ gap: 12 }}>
        <span className="label">{L('가족 추가')}</span>
        <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder={L('이름 (선택)')} aria-label={L('이름')} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RELS.slice(1).map(x => <Chip key={x} on={rel === x} onClick={() => setRel(x)} style={{ padding: '6px 11px', fontSize: 12.5 }}>{L(x)}</Chip>)}
        </div>
        <button className="btn btn-primary cta" onClick={add}>{L('추가하기')}</button>
      </div>
      <div className="fine">{L('가족의 약과 기록은 이 휴대폰 안에서 따로 관리합니다. 다른 휴대폰과 자동으로 공유되지는 않아요.')}</div>
    </div>
  );
}

const naver = (q: string) => 'https://map.naver.com/p/search/' + encodeURIComponent(q);
const PLACES: { k: string; t: string; sub: string; url: string }[] = [
  { k: '약국', t: '가까운 약국', sub: '지도에서 내 주변 약국 보기', url: naver('약국') },
  { k: '병원', t: '가까운 병원·의원', sub: '지도에서 내 주변 병원 보기', url: naver('병원') },
  { k: '야간', t: '심야·휴일 약국', sub: '대한약사회 휴일지킴이약국', url: 'https://www.pharm114.or.kr/' },
  { k: '야간', t: '응급실·달빛어린이병원', sub: '중앙응급의료센터 응급의료포털 E-Gen', url: 'https://www.e-gen.or.kr/' },
];

export function Pharmacy() {
  const { back, t, L } = useApp();
  return (
    <div className="col" style={{ gap: 18, paddingBottom: 28 }}>
      <div className="plate" style={{ position: 'relative', height: 210, margin: '0 0 4px', background: 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 10px,var(--color-neutral-100) 10px 20px)' }}>
        <button onClick={back} className="back" style={{ position: 'absolute', top: 8, left: 14, padding: '0 12px', height: 34, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)' }}><ChevronLeft />{t.back}</button>
        {[{ x: '46%', y: '44%', s: 16 }, { x: '30%', y: '30%', s: 11 }, { x: '66%', y: '58%', s: 11 }, { x: '20%', y: '68%', s: 11 }].map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: '50%', border: '1.5px solid var(--color-accent)', boxShadow: 'inset 0 0 0 3px var(--color-bg)', background: 'var(--color-accent)' }} />
        ))}
      </div>
      <div className="col" style={{ padding: '0 26px', gap: 14 }}>
        <Heading eyebrow="NEARBY" title={t.nearby} sub={L('지도 앱이나 공공 안내 사이트로 이어져요. 운영 시간은 방문 전 전화로 확인하세요.')} size={21} />
        <div className="col rule-top">
          {PLACES.map(p => (
            <a key={p.t} href={p.url} target="_blank" rel="noreferrer" className="hov" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: '1px solid var(--color-divider)', color: 'var(--color-text)', textDecoration: 'none' }}>
              <span className="chip" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)', alignSelf: 'center' }}>{L(p.k)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 14.5, fontWeight: 600 }}>{L(p.t)}</div>
                <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>{L(p.sub)}</div>
              </div>
              <span style={{ color: 'var(--color-accent-700)' }}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
