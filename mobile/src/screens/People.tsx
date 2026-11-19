import { useState } from 'react';
import type { Lang } from '../i18n';
import { adherence } from '../derive';
import { newMember, useApp } from '../state';
import { Back, Chip } from '../ui';

const LANG_ITEMS: [Lang, string][] = [['ko', '한국어'], ['en', 'English'], ['zh', '中文'], ['ja', '日本語']];

const avatar = { width: 36, height: 36, margin: '0 auto', borderRadius: '50%', border: '1px solid rgba(201,164,92,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--gold-light)' } as const;
const initialOf = (name: string, rel: string) => (name || rel || '?').slice(0, 1);

export function My() {
  const { s, me, set, go, flash, t, L, F } = useApp();
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
    { t: '혈압·당뇨 수첩', v: '', go: () => go('vitals') },
    { t: '가족·보호자 관리', v: F('{0}명', s.members.length), go: () => go('family') },
    { t: '병원·약국 찾기', v: '', go: () => go('pharmacy') },
    { t: '건강 리포트', v: '', go: () => go('report') },
    { t: '오늘의 문장 다시 보기', v: '', go: () => set(x => ({ splash: true, splashKey: x.splashKey + 1 })) },
    { t: '의료진용 웹 버전', v: '', go: () => { location.href = '../index.html'; } },
    { t: '개인정보 처리방침', v: '', go: () => { location.href = '../privacy.html'; } },
  ];
  return (
    <div className="screen tab">
      <div className="eyebrow">MY PAGE</div>
      <div className="row" style={{ gap: 14 }}>
        <div className="serif" style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', background: 'linear-gradient(140deg,#e8d39a,#a8843f)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{initialOf(me.name, L(me.rel))}</div>
        {editing ? (
          <div className="row" style={{ gap: 8, flex: 1 }}>
            <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder={L('이름 (선택)')} aria-label={L('이름')} style={{ height: 42 }} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveName(); }} />
            <button className="btn-gold" onClick={saveName} style={{ height: 42, padding: '0 14px', flex: 'none' }}>{t.save}</button>
          </div>
        ) : (
          <button onClick={() => { setName(me.name); setEditing(true); }} style={{ textAlign: 'left' }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{me.name || L(me.rel)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{F('복용 중 {0}개', me.meds.length)} · <span style={{ textDecoration: 'underline' }}>{L('이름 바꾸기')}</span></div>
          </button>
        )}
      </div>

      <div className="col" style={{ gap: 10 }}>
        <div className="label">{t.family}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {s.members.slice(0, 3).map((m, i) => {
            const on = s.member === i;
            return (
              <button key={m.id} onClick={() => { set({ member: i }); flash(F('{0} 님 화면으로 전환했어요', m.name || L(m.rel))); }}
                style={{ flex: 1, minWidth: 0, borderRadius: 16, padding: '12px 8px', textAlign: 'center', border: `1px solid ${on ? '#c9a45c' : 'rgba(241,234,217,.1)'}`, background: on ? 'rgba(201,164,92,.1)' : 'var(--card)' }}>
                <div className="serif" style={avatar}>{initialOf(m.name, L(m.rel))}</div>
                <div style={{ fontSize: 12.5, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{L(m.rel)}</div>
              </button>
            );
          })}
          <button onClick={() => go('family')} style={{ flex: 1, minWidth: 0, borderRadius: 16, padding: '12px 8px', textAlign: 'center', border: '1px dashed rgba(201,164,92,.35)' }}>
            <div style={{ ...avatar, border: 0, color: 'var(--gold)', fontSize: 20, fontWeight: 400 }}>+</div>
            <div style={{ fontSize: 12.5, marginTop: 6, color: 'var(--muted)' }}>{t.manage}</div>
          </button>
        </div>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <div className="label">{t.langLabel}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANG_ITEMS.map(([k, l]) => (
            <Chip key={k} on={s.lang === k} onClick={() => set({ lang: k })} style={{ flex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13 }}>{l}</Chip>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {menu.map(m => (
          <button key={m.t} onClick={m.go} className="row" style={{ width: '100%', gap: 12, padding: '15px 16px', borderBottom: '1px solid rgba(241,234,217,.06)' }}>
            <span style={{ flex: 1, fontSize: 14.5, textAlign: 'left' }}>{L(m.t)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{m.v}</span>
            <span style={{ color: 'var(--gold)' }}>›</span>
          </button>
        ))}
      </div>
      <div className="fine">{ver ? F('데이터 {0} 갱신', ver) + ' · ' : ''}{L('사진과 기록은 이 기기 안에만 저장되고 서버로 보내지 않아요.')}</div>
    </div>
  );
}

const RELS = ['나', '어머니', '아버지', '배우자', '아들', '딸', '할머니', '할아버지', '기타'];

export function Family() {
  const { s, set, flash, t, L, F } = useApp();
  const [name, setName] = useState('');
  const [rel, setRel] = useState('어머니');
  const add = () => {
    set(x => ({ members: [...x.members, newMember(name.trim(), rel)] }));
    setName(''); flash(L('가족을 추가했어요'));
  };
  const remove = (i: number) => {
    if (!confirmDelete()) return;
    set(x => { const members = x.members.filter((_, j) => j !== i); return { members, member: x.member === i ? 0 : x.member > i ? x.member - 1 : x.member }; });
  };
  return (
    <div className="screen" style={{ gap: 16 }}>
      <Back />
      <div>
        <div className="eyebrow">FAMILY CARE</div>
        <div className="title">{t.familyTitle}</div>
        <div className="sub">{L('가족마다 약과 기록을 따로 관리해요. 이 휴대폰 안에만 저장돼요.')}</div>
      </div>
      {s.members.map((m, i) => {
        const r = adherence(m, 7);
        return (
          <div key={m.id} className="card col" style={{ padding: 16, gap: 12, border: s.member === i ? '1px solid #c9a45c' : undefined }}>
            <div className="row" style={{ gap: 12 }}>
              <div className="serif" style={{ ...avatar, width: 42, height: 42, margin: 0 }}>{initialOf(m.name, L(m.rel))}</div>
              <button style={{ flex: 1, textAlign: 'left' }} onClick={() => set({ member: i })}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{m.name || L(m.rel)} {m.name && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {L(m.rel)}</span>}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{F('복용 중 {0}개', m.meds.length)}{s.member === i ? ' · ' + L('지금 보는 중') : ''}</div>
              </button>
              <span className="display" style={{ fontSize: 24, color: 'var(--gold-light)' }}>{r.pct === null ? '—' : r.pct + '%'}</span>
            </div>
            {s.members.length > 1 && i > 0 && (
              <button onClick={() => remove(i)} style={{ alignSelf: 'flex-end', fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>{L('삭제')}</button>
            )}
          </div>
        );
      })}
      <div className="card col" style={{ padding: 16, gap: 10 }}>
        <div className="label">{L('가족 추가')}</div>
        <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder={L('이름 (선택)')} aria-label={L('이름')} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RELS.slice(1).map(x => <Chip key={x} on={rel === x} onClick={() => setRel(x)} style={{ padding: '6px 11px', fontSize: 12.5 }}>{L(x)}</Chip>)}
        </div>
        <button className="btn-line" style={{ fontWeight: 400 }} onClick={add}>{L('추가하기')}</button>
      </div>
    </div>
  );
}
const confirmDelete = () => { try { return window.confirm('이 가족의 약과 기록을 모두 지울까요?'); } catch { return true; } };

const PINS = [{ x: '46%', y: '44%', s: 18, bg: '#e8d39a' }, { x: '30%', y: '30%', s: 12, bg: '#c9a45c' }, { x: '66%', y: '58%', s: 12, bg: '#c9a45c' }, { x: '20%', y: '68%', s: 12, bg: '#9ccbb6' }];
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
    <div className="col" style={{ gap: 16, paddingBottom: 28 }}>
      <div style={{ position: 'relative', height: 220, background: 'repeating-linear-gradient(135deg,#123126 0 10px,#0f2b21 10px 20px)' }}>
        <button onClick={back} className="row" style={{ position: 'absolute', top: 10, left: 14, height: 36, padding: '0 14px', borderRadius: 18, background: 'rgba(11,29,22,.85)', color: 'var(--gold)', fontSize: 13.5 }}>‹ {t.back}</button>
        {PINS.map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: '50%', background: p.bg, border: '2px solid #0b1d16', boxShadow: '0 0 0 4px rgba(201,164,92,.18)' }} />
        ))}
      </div>
      <div className="col" style={{ padding: '0 20px', gap: 12 }}>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{t.nearby}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{L('지도 앱이나 공공 안내 사이트로 이어져요. 운영 시간은 방문 전 전화로 확인하세요.')}</div>
        {PLACES.map(p => (
          <a key={p.t} href={p.url} target="_blank" rel="noreferrer" className="row" style={{ gap: 12, padding: 14, borderRadius: 16, background: 'var(--card)', color: 'var(--ink)', textDecoration: 'none' }}>
            <span className="kind">{L(p.k)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{L(p.t)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{L(p.sub)}</div>
            </div>
            <span style={{ color: 'var(--gold)' }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
