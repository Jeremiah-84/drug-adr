import { useState } from 'react';
import { useApp, type Role } from '../state';
import { Toggle as Switch } from '../ui';
import { LangButton, ROLES } from './People';

const TXT: Record<string, string> = {
  skip: '건너뛰기', onbTitle1: '약을 읽고, 기록하고,', onbTitle2: '제때 챙기는 일',
  onbLead: '처방전과 약봉투를 촬영하면 식약처 허가정보를 바탕으로 복용법과 주의할 이상반응을 정리해 드립니다. 환자와 보호자, 의료 관계자 모두를 위한 복약 수첩입니다.',
  onbRoleQ: '어떤 분이 사용하시나요?', onbRoleSub: '역할에 따라 약 정보의 깊이가 달라집니다. 설정에서 언제든 바꿀 수 있습니다.',
  onbPermQ: '두 가지만 허락해 주세요', onbPrivacy: '사진과 처방 내용은 이 기기 안에서만 처리하며, 진단이나 처방 변경은 반드시 의사·약사와 상의하세요.', prev: '이전',
};

export function Onboarding() {
  const { s, set, flash, L } = useApp();
  const onb = s.onb, role = s.role || 'patient';
  const [perm, setPerm] = useState({
    cam: false,
    noti: 'Notification' in window && Notification.permission === 'granted',
  });
  const t = (k: string) => L(TXT[k]);
  const setState = set;
  const enterApp = () => set(x => ({ stack: ['home'], onb: 0, onboarded: true, splash: true, splashKey: x.splashKey + 1 }));
  const ask = async (k: 'cam' | 'noti') => {
    if (perm[k]) { setPerm(p => ({ ...p, [k]: false })); return; }
    try {
      if (k === 'cam') {
        const st = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        st.getTracks().forEach(x => x.stop());
        setPerm(p => ({ ...p, cam: true }));
      } else {
        const r = 'Notification' in window ? await Notification.requestPermission() : 'denied';
        setPerm(p => ({ ...p, noti: r === 'granted' }));
        if (r !== 'granted') flash(L('알림이 꺼져 있어요. 브라우저 설정에서 켤 수 있어요'));
      }
    } catch { flash(L('허용되지 않았어요. 나중에 설정에서 바꿀 수 있어요')); }
  };
  const cta = ['시작하기', '다음', '메디스캔 열기'][onb];

  return (
    <div style={{ minHeight: '100%', padding: '20px 30px 34px', display: 'flex', flexDirection: 'column' }} className="onb">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 36 }}>
        <div className="g" style={{ display: 'flex', gap: 14, fontSize: 14, fontWeight: 700, letterSpacing: '.08em' }}>
          {['I', 'II', 'III'].map((n, i) => (
            <span key={n} style={{ color: i === onb ? 'var(--color-accent-700)' : 'var(--color-neutral-400)', borderBottom: `1px solid ${i === onb ? 'var(--color-accent)' : 'transparent'}`, paddingBottom: 2 }}>{n}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <LangButton />
          <button className="tap muted" style={{ fontSize: 13 }} onClick={enterApp}>{t('skip')}</button>
        </div>
      </div>

      {onb === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '40px 0 20px' }}>
          <div className="kicker" style={{ letterSpacing: '.32em' }}>MEDISCAN</div>
          <div className="g" style={{ fontSize: 64, lineHeight: 0.95, fontWeight: 400, letterSpacing: '-.01em' }}>Medi<br /><span style={{ fontStyle: 'italic' }}>Scan</span></div>
          <div style={{ width: 48, height: 1, background: 'var(--color-accent)' }} />
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.5 }}>{t('onbTitle1')}<br />{t('onbTitle2')}</div>
          <div className="just" style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--color-neutral-800)' }}>{t('onbLead')}</div>
        </div>
      )}

      {onb === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '44px 0 20px' }}>
          <div className="kicker">WHO IS READING</div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.4 }}>{t('onbRoleQ')}</div>
          <div className="muted just" style={{ fontSize: 13.5, lineHeight: 1.75 }}>{t('onbRoleSub')}</div>
          <div className="col" style={{ borderTop: '1px solid var(--color-divider)', marginTop: 8 }} role="radiogroup">
            {(Object.keys(ROLES) as Role[]).map(k => {
              const on = role === k, r = ROLES[k];
              return (
                <button key={k} type="button" role="radio" aria-checked={on} className="tap hov6" onClick={() => setState({ role: k })}
                  style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 4px', borderBottom: '1px solid var(--color-divider)' }}>
                  <span style={{ width: 18, height: 18, flex: 'none', marginTop: 3, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-neutral-400)'}`, boxShadow: 'inset 0 0 0 4px var(--color-bg)', background: on ? 'var(--color-accent)' : 'transparent' }} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="serif" style={{ fontSize: 16.5, fontWeight: 600 }}>{L(r.t)}</span>
                    <span className="muted" style={{ fontSize: 13, lineHeight: 1.65 }}>{L(r.s)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {onb === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '44px 0 20px' }}>
          <div className="kicker">PERMISSIONS</div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.4 }}>{t('onbPermQ')}</div>
          <div className="col" style={{ borderTop: '1px solid var(--color-divider)', marginTop: 8 }}>
            {([['cam', '카메라', '처방전과 약봉투, 알약을 촬영해 읽습니다.'], ['noti', '복약 알림', '복용 시간에 휴대폰 알림을 보내드립니다. 앱이 열려 있거나 백그라운드에 있을 때 울립니다.']] as const).map(([k, title, s]) => (
              <div key={k} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 4px', borderBottom: '1px solid var(--color-divider)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 600 }}>{L(title)}</span>
                  <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.65 }}>{L(s)}</span>
                </div>
                <Switch on={perm[k]} label={L(title)} onClick={() => ask(k)} />
              </div>
            ))}
          </div>
          <div className="muted just" style={{ fontSize: 12, lineHeight: 1.7, fontStyle: 'italic' }}>{t('onbPrivacy')}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary serif" style={{ height: 50, fontFamily: 'var(--ms-serif)', fontWeight: 600, fontSize: 15, width: '100%' }}
          onClick={() => (onb < 2 ? setState({ onb: onb + 1 }) : enterApp())}>{L(cta)}</button>
        {onb > 0 && <button className="tap muted" style={{ textAlign: 'center', fontSize: 13, padding: 6 }} onClick={() => setState({ onb: Math.max(0, onb - 1) })}>{t('prev')}</button>}
      </div>
    </div>
  );
}
