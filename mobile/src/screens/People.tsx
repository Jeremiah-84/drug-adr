import { MEMBERS, PHARM, REPLIES } from '../data';
import type { Lang } from '../i18n';
import { useApp, type PlaceFilter } from '../state';
import { Back, Chip, Toggle } from '../ui';

export function Chat() {
  const { s, send, t, L } = useApp();
  return (
    <div className="col" style={{ padding: '14px 18px 16px', gap: 14, minHeight: '100%' }}>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #c9a45c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 12, height: 12, background: 'var(--gold)', transform: 'rotate(45deg)' }} />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{t.chatTitle}</div>
          <div className="display" style={{ fontSize: 12.5, letterSpacing: '.14em', color: 'var(--gold)', fontWeight: 600 }}>MEDISCAN CONCIERGE</div>
        </div>
      </div>
      <div className="col" style={{ gap: 10 }} aria-live="polite">
        {s.messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '11px 14px', fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap',
              borderRadius: m.me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.me ? 'linear-gradient(180deg,#dcc07f,#c4a058)' : 'var(--card)',
              color: m.me ? 'var(--bg)' : 'var(--ink)',
            }}>{L(m.text)}</div>
          </div>
        ))}
        {s.typing && (
          <div style={{ display: 'flex', gap: 5, padding: '14px 16px', background: 'var(--card)', borderRadius: '18px 18px 18px 4px', alignSelf: 'flex-start', width: 'fit-content' }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: `msDot 1.2s ${i * 0.18}s infinite` }} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {Object.keys(REPLIES).map(q => (
          <button key={q} onClick={() => send(q)} className="suggest"
            style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(201,164,92,.4)', color: 'var(--gold-light)', fontSize: 12.5 }}>{L(q)}</button>
        ))}
      </div>
    </div>
  );
}

export function ChatInput() {
  const { s, set, send, t } = useApp();
  return (
    <div className="row" style={{ position: 'absolute', left: 0, right: 0, bottom: 88, padding: '10px 14px', background: 'var(--bg)', borderTop: '1px solid rgba(201,164,92,.12)', gap: 8 }}>
      <input value={s.input} onChange={e => set({ input: e.target.value })} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(s.input); }}
        placeholder={t.askPh} aria-label={t.askPh}
        style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 22, border: '1px solid rgba(201,164,92,.3)', background: 'var(--card)', color: 'var(--ink)', padding: '0 16px', fontSize: 13.5, outline: 'none' }} />
      <button aria-label="Send" onClick={() => send(s.input)}
        style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--gold-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 700 }}>↑</button>
    </div>
  );
}

const LANG_ITEMS: [Lang, string][] = [['ko', '한국어'], ['en', 'English'], ['zh', '中文'], ['ja', '日本語']];

const avatar = { width: 36, height: 36, margin: '0 auto', borderRadius: '50%', border: '1px solid rgba(201,164,92,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--gold-light)' } as const;

export function My() {
  const { s, set, go, flash, t, L, F } = useApp();
  const me = MEMBERS[s.member];
  const menu = [
    { t: '복약 알림 설정', v: '2개 켜짐', go: () => go('schedule') },
    { t: '혈압·당뇨 수첩', v: '', go: () => go('vitals') },
    { t: '가족·보호자 관리', v: '3명', go: () => go('family') },
    { t: '병원·약국 찾기', v: '', go: () => go('pharmacy') },
    { t: '건강 리포트', v: '11월', go: () => go('report') },
    { t: '오늘의 문장 다시 보기', v: '', go: () => set(x => ({ splash: true, splashKey: x.splashKey + 1 })) },
    { t: '개인정보 처리방침', v: '', go: () => flash(L('개인정보 처리방침')) },
  ];
  return (
    <div className="screen tab">
      <div className="eyebrow">MY PAGE</div>
      <div className="row" style={{ gap: 14 }}>
        <div className="serif" style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(140deg,#e8d39a,#a8843f)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{L(me.initial)}</div>
        <div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{L(me.name)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L(me.meta)}</div>
        </div>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <div className="label">{t.family}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {MEMBERS.map((m, i) => {
            const on = s.member === i;
            return (
              <button key={m.name} onClick={() => { set({ member: i }); flash(F('{0} 님 화면으로 전환했어요', L(m.name))); }}
                style={{ flex: 1, minWidth: 0, borderRadius: 16, padding: '12px 8px', textAlign: 'center', border: `1px solid ${on ? '#c9a45c' : 'rgba(241,234,217,.1)'}`, background: on ? 'rgba(201,164,92,.1)' : 'var(--card)' }}>
                <div className="serif" style={avatar}>{L(m.initial)}</div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}>{L(m.rel)}</div>
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
            <span style={{ flex: 1, fontSize: 14.5 }}>{L(m.t)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L(m.v)}</span>
            <span style={{ color: 'var(--gold)' }}>›</span>
          </button>
        ))}
      </div>
      <div className="fine">{t.dataNote}</div>
    </div>
  );
}

export function Family() {
  const { s, set, t, L } = useApp();
  return (
    <div className="screen" style={{ gap: 16 }}>
      <Back />
      <div>
        <div className="eyebrow">FAMILY CARE</div>
        <div className="title">{t.familyTitle}</div>
      </div>
      {MEMBERS.map((m, i) => (
        <div key={m.name} className="card col" style={{ padding: 16, gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="serif" style={{ ...avatar, width: 42, height: 42, margin: 0 }}>{L(m.initial)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{L(m.name)} <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {L(m.rel)}</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{L(m.meds)}</div>
            </div>
            <span className="display" style={{ fontSize: 24, color: 'var(--gold-light)' }}>{m.rate}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-body)', paddingTop: 10, borderTop: '1px solid rgba(241,234,217,.07)' }}>
            <span>{t.missAlert}</span>
            <Toggle size={42} on={!!s.guard[i]} onClick={() => set(x => ({ guard: { ...x.guard, [i]: !x.guard[i] } }))} />
          </div>
        </div>
      ))}
      <button className="btn-line" style={{ fontWeight: 400 }}>{t.invite}</button>
    </div>
  );
}

const PINS = [{ x: '46%', y: '44%', s: 18, bg: '#e8d39a' }, { x: '30%', y: '30%', s: 12, bg: '#c9a45c' }, { x: '66%', y: '58%', s: 12, bg: '#c9a45c' }, { x: '20%', y: '68%', s: 12, bg: '#9ccbb6' }];
const FILTERS: PlaceFilter[] = ['전체', '병원', '약국', '야간'];

export function Pharmacy() {
  const { s, set, back, t, L } = useApp();
  const list = PHARM.filter(p => s.phf === '전체' || (s.phf === '야간' ? p.night : s.phf === '병원' ? p.kind === 'hos' : p.kind === 'ph'));
  return (
    <div className="col" style={{ gap: 16, paddingBottom: 28 }}>
      <div style={{ position: 'relative', height: 280, background: 'repeating-linear-gradient(135deg,#123126 0 10px,#0f2b21 10px 20px)' }}>
        <button onClick={back} className="row" style={{ position: 'absolute', top: 10, left: 14, height: 36, padding: '0 14px', borderRadius: 18, background: 'rgba(11,29,22,.85)', color: 'var(--gold)', fontSize: 13.5 }}>‹ {t.back}</button>
        <span style={{ position: 'absolute', bottom: 10, right: 14, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10, color: 'var(--faint)' }}>map view</span>
        {PINS.map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: '50%', background: p.bg, border: '2px solid #0b1d16', boxShadow: '0 0 0 4px rgba(201,164,92,.18)' }} />
        ))}
      </div>
      <div className="col" style={{ padding: '0 20px', gap: 12 }}>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{t.nearby}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => <Chip key={f} on={s.phf === f} onClick={() => set({ phf: f })} style={{ padding: '6px 12px', fontSize: 12.5 }}>{L(f)}</Chip>)}
        </div>
        {list.map(p => {
          const night = p.st === '야간';
          return (
            <div key={p.n} className="row" style={{ gap: 12, padding: 14, borderRadius: 16, background: 'var(--card)' }}>
              <span className="kind">{L(p.kind === 'hos' ? '병원' : '약국')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{L(p.n)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.d} · {L(p.h)}</div>
              </div>
              <span className="badge" style={{ padding: '3px 9px', background: night ? 'rgba(156,203,182,.13)' : 'rgba(226,192,113,.14)', color: night ? '#9ccbb6' : '#e2c071' }}>{L(p.st)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
