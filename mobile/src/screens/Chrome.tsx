import type { CSSProperties } from 'react';
import type { Screen } from '../config';
import { useApp, type ScanMode } from '../state';

const MODES: Record<ScanMode, [string, string, { l: number; t: number; h: number }]> = {
  rx: ['처방전·약봉투', '처방전이나 약봉투의 글자가 네모 안에 들어오게 비춰주세요', { l: 30, t: 170, h: 380 }],
  barcode: ['바코드', '약 상자의 바코드를 가로로 맞춰주세요', { l: 40, t: 280, h: 150 }],
  pill: ['알약 모양', '알약 하나를 어두운 바탕 위에 올려 가까이 비춰주세요', { l: 90, t: 240, h: 200 }],
};

const corner = (pos: CSSProperties, sides: ('Left' | 'Right' | 'Top' | 'Bottom')[], radius: string): CSSProperties => ({
  position: 'absolute', width: 28, height: 28, ...pos, [radius]: 10,
  ...Object.fromEntries(sides.map(s => [`border${s}`, '2px solid #c9a45c'])),
});

const round40: CSSProperties = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/** Full-screen camera view. A real build would put the camera stream under the hatch pattern. */
export function ScanOverlay() {
  const { s, screen, set, back, shutter, L } = useApp();
  const [, hint, frame] = MODES[s.mode];
  const scanning = screen === 'scanning';
  return (
    <div className="col" style={{ position: 'absolute', inset: 0, background: '#040807', zIndex: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,#0a1410 0 12px,#0c1813 12px 24px)' }} />
      <span style={{ position: 'absolute', top: '46%', left: 0, right: 0, textAlign: 'center', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10.5, color: '#4d5e55' }}>camera preview</span>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '44px 18px 0' }}>
        <button aria-label="Close" onClick={back} style={{ ...round40, color: 'var(--ink)', fontSize: 18 }}>×</button>
        <span className="display" style={{ letterSpacing: '.3em', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>SCAN</span>
        <div style={{ ...round40, color: 'var(--gold-light)', fontSize: 11 }}>AUTO</div>
      </div>
      <div style={{ position: 'absolute', left: frame.l, right: frame.l, top: frame.t, height: frame.h, transition: 'all .35s ease' }}>
        <span style={corner({ left: 0, top: 0 }, ['Left', 'Top'], 'borderTopLeftRadius')} />
        <span style={corner({ right: 0, top: 0 }, ['Right', 'Top'], 'borderTopRightRadius')} />
        <span style={corner({ left: 0, bottom: 0 }, ['Left', 'Bottom'], 'borderBottomLeftRadius')} />
        <span style={corner({ right: 0, bottom: 0 }, ['Right', 'Bottom'], 'borderBottomRightRadius')} />
        {scanning && (
          <div style={{ position: 'absolute', left: 8, right: 8, height: 2, background: 'linear-gradient(90deg,transparent,#e8d39a,transparent)', boxShadow: '0 0 16px 4px rgba(232,211,154,.45)', animation: 'msBeam 1.6s ease-in-out infinite' }} />
        )}
      </div>
      <div className="col" style={{ marginTop: 'auto', position: 'relative', padding: '0 20px 34px', alignItems: 'center', gap: 18 }}>
        <div aria-live="polite" style={{ fontSize: 13.5, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.6, minHeight: 44 }}>
          {L(scanning ? '읽는 중… 사진은 이 기기 안에서만 처리합니다' : hint)}
        </div>
        <div className="segment" style={{ background: 'rgba(16,42,32,.9)', borderColor: 'rgba(201,164,92,.2)' }}>
          {(Object.keys(MODES) as ScanMode[]).map(k => (
            <button key={k} className={s.mode === k ? 'on' : ''} onClick={() => set({ mode: k })}
              style={{ flex: 'none', padding: '8px 12px', fontSize: 12.5 }}>{L(MODES[k][0])}</button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'repeating-linear-gradient(135deg,#183a2c 0 5px,#143326 5px 10px)', border: '1px solid rgba(201,164,92,.3)' }} />
          <button aria-label="Shutter" onClick={shutter} className="shutter"
            style={{ width: 78, height: 78, borderRadius: '50%', border: '2px solid #c9a45c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'var(--gold-orb)' }} />
          </button>
          <div style={{ ...round40, width: 48, height: 48, color: 'var(--gold-light)', fontSize: 11 }}>⚡</div>
        </div>
      </div>
    </div>
  );
}

const NAV: { k: Screen; l: string; r?: string; rot?: string }[] = [
  { k: 'home', l: '홈', r: '50%', rot: 'none' },
  { k: 'history', l: '기록', r: '2px', rot: 'none' },
  { k: 'scan', l: '스캔' },
  { k: 'chat', l: '상담', r: '2px', rot: 'rotate(45deg)' },
  { k: 'my', l: '마이', r: '50%', rot: 'none' },
];
const TAB_OF: Partial<Record<Screen, Screen>> = {
  home: 'home', results: 'home', detail: 'home', symptom: 'home', schedule: 'home', vitals: 'home',
  pharmacy: 'my', history: 'history', report: 'history', chat: 'chat', my: 'my', family: 'my',
};

export function BottomNav() {
  const { screen, go, tab, L } = useApp();
  const cur = TAB_OF[screen];
  return (
    <nav style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, background: 'var(--bg-deep)', borderTop: '1px solid rgba(201,164,92,.16)', display: 'flex', alignItems: 'flex-start', padding: '8px 6px 0', zIndex: 10 }}>
      {NAV.map(n => {
        const on = cur === n.k, c = on ? 'var(--gold-light)' : 'var(--faint)';
        return (
          <button key={n.k} onClick={() => (n.k === 'scan' ? go('scan') : tab(n.k))} aria-current={on ? 'page' : undefined}
            className="col" style={{ flex: 1, alignItems: 'center', gap: 5, paddingTop: 6 }}>
            {n.k === 'scan' ? (
              <div style={{ width: 54, height: 54, marginTop: -22, borderRadius: '50%', background: 'var(--gold-orb)', boxShadow: '0 8px 20px rgba(0,0,0,.4),0 0 0 4px #08170f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 20, height: 16, border: '2px solid #0b1d16', borderRadius: 4 }} />
              </div>
            ) : (
              <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: n.r, transform: n.rot, background: c }} />
              </span>
            )}
            <span style={{ fontSize: 11, color: c, fontWeight: on ? 700 : 400 }}>{L(n.l)}</span>
          </button>
        );
      })}
    </nav>
  );
}
