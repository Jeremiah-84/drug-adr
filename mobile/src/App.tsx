import { useEffect, useMemo, useRef, type ReactNode } from 'react';
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

const SCREENS: Partial<Record<Screen, () => ReactNode>> = {
  home: Home, results: Results, detail: Detail, symptom: Symptom, schedule: Schedule, vitals: Vitals,
  history: History, report: Report, search: Search, pill: Pill, my: My, family: Family, pharmacy: Pharmacy,
};

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
      return { stack: st.stack.length > 1 ? st.stack.slice(0, -1).filter(k => k !== 'scanning') : ['home'] };
    });
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [set]);

  const q = useMemo(quoteOfDay, []);
  const quote = useMemo(() => ({ t: L(q.t), a: L(q.a), en: q.en }), [q, L]);
  const dateStr = useMemo(() => { const d = new Date(); return `${d.getMonth() + 1}.${d.getDate()}`; }, []);

  const View = SCREENS[screen];
  const bottom = scanLike || screen === 'pharmacy' ? 0 : 88;

  return (
    <div className="stage">
      <div className="device">
        <div className="viewport">
          <div className="statusbar" aria-hidden>
            <span>9:41</span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#000', boxShadow: '0 0 0 2px #111' }} />
            <span className="row" style={{ gap: 5 }}>
              <span style={{ width: 14, height: 9, borderRadius: 2, border: '1.4px solid #f1ead9' }} />
              <span style={{ fontSize: 11 }}>87%</span>
            </span>
          </div>

          <main ref={scrollRef} className="scroll" style={{ bottom }}>
            {View && <View />}
          </main>

          {scanLike && <ScanOverlay />}
          {!scanLike && screen !== 'pharmacy' && <BottomNav />}
          <TimeSheet />
          <VitalsSheet />
          {s.splash && (
            <Splash key={`${s.splashKey}-${s.lang}`} quote={quote} dateStr={dateStr} cjk={s.lang === 'zh' || s.lang === 'ja'}
              skip={L('화면을 누르면 건너뜁니다')} sub={L('메디스캔 프로')} onDone={() => set({ splash: false })} />
          )}
          {s.toast && <div className="toast" role="status">{s.toast}</div>}
          <div className="home-indicator" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
