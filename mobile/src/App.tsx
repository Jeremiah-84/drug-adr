import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { config, type Screen } from './config';
import { QUOTES } from './data';
import { Splash } from './Splash';
import { AppProvider, useApp } from './state';
import { BottomNav, ScanOverlay } from './screens/Chrome';
import { Detail, Results, Symptom } from './screens/Drugs';
import { Home } from './screens/Home';
import { Family, My, Pharmacy } from './screens/People';
import { Pill, Search } from './screens/Find';
import { History, Report } from './screens/Records';
import { Schedule, TimeSheet } from './screens/Schedule';
import { Vitals, VitalsSheet } from './screens/Vitals';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { Puzzle } from './screens/Puzzle';
import { fmtMin } from './derive';

const SCREENS: Partial<Record<Screen, () => ReactNode>> = {
  onboarding: Onboarding, today: Today, puzzle: Puzzle,
  home: Home, results: Results, detail: Detail, symptom: Symptom, schedule: Schedule, vitals: Vitals,
  history: History, report: Report, search: Search, pill: Pill, my: My, family: Family, pharmacy: Pharmacy,
};

/** Body serif per language. */
const SERIF = { ko: "'Noto Serif KR',serif", en: "'Lora','Noto Serif KR',serif", ja: "'Noto Serif JP','Noto Serif KR',serif", zh: "'Noto Serif SC','Noto Serif KR',serif" } as const;
const SPLASH_FONT = { ko: 'Noto Serif KR', en: 'Lora', ja: 'Noto Serif JP', zh: 'Noto Serif SC' } as const;

/** Quote of the day: one per local calendar day, cycling through the ten philosophers. */
const quoteOfDay = () => {
  if (config.quoteIndex >= 0) return QUOTES[config.quoteIndex % QUOTES.length];
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  return QUOTES[day % QUOTES.length];
};

function Shell() {
  const { s, screen, set, L } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scanLike = screen === 'scan' || screen === 'scanning';
  const isOnb = screen === 'onboarding';

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--ms-serif', SERIF[s.lang]);
  }, [s.lang]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [screen]);

  // Android back button / browser back walks the in-app stack instead of leaving the app.
  const depth = s.stack.length;
  const depthRef = useRef(depth);
  useEffect(() => {
    if (depth > depthRef.current) history.pushState({ d: depth }, '');
    depthRef.current = depth;
  }, [depth]);
  useEffect(() => {
    const onPop = () => set(st => {
      if (st.timeEdit) return { timeEdit: null };
      if (st.sheet) return { sheet: false };
      return { stack: st.stack.length > 1 ? st.stack.slice(0, -1).filter(k => k !== 'scanning') : [st.stack[0] === 'onboarding' ? 'onboarding' : 'home'] };
    });
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [set]);

  const q = useMemo(quoteOfDay, []);
  const quote = useMemo(() => ({ t: L(q.t), a: L(q.a), en: q.en }), [q, L]);
  const dateStr = useMemo(() => { const d = new Date(); return `${d.getMonth() + 1}.${d.getDate()}`; }, []);

  const View = SCREENS[screen];
  const showNav = !scanLike && !isOnb && screen !== 'pharmacy';

  return (
    <div className="ms-stage">
      <div className="ms-device">
        <div className="ms-phone">
          <div className="ms-statusbar" style={{ color: scanLike ? '#f8f4f4' : 'var(--color-text)' }} aria-hidden="true">
            <span className="tnum">{fmtMin(s.now)}</span><span className="notch" /><span>87%</span>
          </div>

          <main ref={scrollRef} className="ms-scroll" style={{ bottom: showNav ? 'var(--ms-nav-h)' : 0 }}>
            {View && <View />}
          </main>

          {scanLike && <ScanOverlay />}
          {showNav && <BottomNav />}
          <TimeSheet />
          <VitalsSheet />
          {s.splash && (
            <Splash key={`${s.splashKey}-${s.lang}`} quote={quote} dateStr={dateStr} font={SPLASH_FONT[s.lang]} cjk={s.lang === 'zh' || s.lang === 'ja'}
              skip={L('화면을 누르면 건너뜁니다')} sub={L('메디스캔')} onDone={() => set({ splash: false })} />
          )}
          {s.toast && <div className="toast" role="status">{s.toast}</div>}
          <div className="ms-homebar" style={{ background: scanLike ? 'rgba(255,255,255,.5)' : 'var(--color-neutral-800)' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
