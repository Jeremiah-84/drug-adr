import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Screen } from '../config';
import { useApp, type ScanMode } from '../state';
import { BookOpen, House, Pill as PillIcon, ScanLine, User, X, Zap } from '../icons';
import { barcodeDetector, code13, findInText, loadIndex, lookupBarcode, ocr, photoCanvas } from '../real';

const MODES: Record<ScanMode, [string, string]> = {
  rx: ['처방전·약봉투', '처방전이나 약봉투의 글자가 네모 안에 들어오게 비춰주세요'],
  barcode: ['바코드', '약 상자의 바코드를 가로로 맞춰주세요'],
  pill: ['알약 모양', '알약에 새겨진 글자와 모양·색으로 찾아요. 아래 버튼을 누르세요'],
};

// Frame geometry from the design (390×844), relative to the viewport height so it keeps its proportions.
const FRAMES: Record<ScanMode, CSSProperties> = {
  rx: { left: 30, right: 30, top: '20%', height: '45%' },
  barcode: { left: 40, right: 40, top: '34%', height: 150 },
  pill: { left: 'calc(50% - 100px)', right: 'calc(50% - 100px)', top: '29%', height: 200 },
};
const corner = (pos: CSSProperties): CSSProperties => ({ position: 'absolute', width: 26, height: 26, ...pos });
const gold = '1.5px solid var(--color-accent-400)';

/** Full-screen camera. Text and barcodes are read on this device; nothing is uploaded. */
export function ScanOverlay() {
  const { s, set, back, go, showFound, L, F } = useApp();
  const [, hint] = MODES[s.mode];
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState('');
  const [torch, setTorch] = useState<boolean | null>(null);
  const seen = useRef(new Set<string>());

  // Camera on while this screen is open.
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (stop) { st.getTracks().forEach(x => x.stop()); return; }
        stream.current = st;
        const v = video.current!;
        v.srcObject = st; await v.play(); setLive(true);
        const caps = (st.getVideoTracks()[0].getCapabilities?.() || {}) as { torch?: boolean };
        if (caps.torch) setTorch(false);
      } catch { setLive(false); }
    })();
    return () => { stop = true; stream.current?.getTracks().forEach(x => x.stop()); stream.current = null; };
  }, []);

  const found = async (code: string) => {
    const c = code13(code);
    if (!c || seen.current.has(c)) return false;
    seen.current.add(c);
    const f = await lookupBarcode(c);
    if (f) { if (navigator.vibrate) navigator.vibrate(60); showFound({ at: Date.now(), kind: 'barcode', found: [f] }); return true; }
    setBusy(F('등록되지 않은 바코드예요 ({0})', c));
    return false;
  };

  // Barcode mode: keep looking at the video.
  useEffect(() => {
    if (s.mode !== 'barcode' || !live) return;
    let on = true, run = false;
    const id = window.setInterval(async () => {
      if (run || !video.current || video.current.readyState < 2) return;
      run = true;
      try { const d = await barcodeDetector(); for (const b of await d.detect(video.current)) { if (!on) break; if (await found(b.rawValue)) { on = false; break; } } } catch { /* keep trying */ }
      run = false;
    }, 300);
    return () => { on = false; clearInterval(id); };
  }, [s.mode, live]);

  const readText = async (img: Blob | HTMLCanvasElement, kind: 'rx' | 'photo') => {
    setBusy(L('글자 읽기 준비 중… 처음 한 번은 조금 걸려요'));
    try {
      await loadIndex();
      const text = await ocr(img, p => setBusy(F('글자를 읽는 중… {0}%', p)));
      setBusy('');
      showFound({ at: Date.now(), kind, found: findInText(text) });
    } catch { setBusy(L('글자를 읽지 못했어요. 다시 찍어 주세요')); }
  };

  const grab = (): HTMLCanvasElement | null => {
    const v = video.current;
    if (!v || !live || !v.videoWidth) return null;
    const c = document.createElement('canvas'), k = Math.min(1, 2400 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    const g = c.getContext('2d')!; g.filter = 'grayscale(1) contrast(1.3)'; g.drawImage(v, 0, 0, c.width, c.height);
    return c;
  };

  const shutter = async () => {
    if (busy && !/다시|등록/.test(busy)) return;
    if (s.mode === 'pill') { go('pill'); return; }
    const c = grab();
    if (!c) { file.current?.click(); return; }
    if (s.mode === 'rx') { readText(c, 'rx'); return; }
    try { const d = await barcodeDetector(); const r = await d.detect(c); let ok = false; for (const b of r) if (await found(b.rawValue)) { ok = true; break; } if (!ok && !r.length) setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
    catch { setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (s.mode === 'barcode') {
      try { const d = await barcodeDetector(); const r = await d.detect(await photoCanvas(f, 1600)); seen.current.clear(); for (const b of r) if (await found(b.rawValue)) return; setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
      catch { setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
      return;
    }
    readText(f, 'photo');
  };

  const toggleTorch = async () => {
    const tr = stream.current?.getVideoTracks()[0];
    if (!tr || torch === null) return;
    try { await tr.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); } catch { /* not supported */ }
  };

  const reading = !!busy && /%|준비/.test(busy);
  const fr = FRAMES[s.mode];
  const ring = { width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: 'inherit' } as const;
  return (
    <div className="col" style={{ position: 'absolute', inset: 0, background: 'var(--ms-dark)', zIndex: 20, color: '#f8f4f4' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.015) 0 12px,transparent 12px 24px)' }} />
      <video ref={video} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: live ? 1 : 0 }} />
      {!live && <span style={{ position: 'absolute', top: '46%', left: 24, right: 24, textAlign: 'center', fontSize: 12, fontStyle: 'italic', color: 'var(--color-neutral-500)', lineHeight: 1.6 }}>{L('카메라를 쓸 수 없으면 아래 버튼으로 사진을 고르세요')}</span>}
      <input ref={file} type="file" accept="image/*" hidden onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'calc(var(--ms-top) + 8px) 22px 0' }}>
        <button aria-label="Close" onClick={back} style={ring}><X /></button>
        <span className="g" style={{ letterSpacing: '.32em', fontSize: 14, color: 'var(--color-accent-400)', fontWeight: 700 }}>SCAN</span>
        <div className="g" style={{ ...ring, fontSize: 11, letterSpacing: '.08em', fontWeight: 700, opacity: s.mode === 'barcode' && live ? 1 : 0 }}>AUTO</div>
      </div>
      <div style={{ position: 'absolute', ...fr, transition: 'all .35s ease', border: '1px solid rgba(225,173,102,.25)' }}>
        <span style={corner({ left: -1, top: -1, borderLeft: gold, borderTop: gold })} />
        <span style={corner({ right: -1, top: -1, borderRight: gold, borderTop: gold })} />
        <span style={corner({ left: -1, bottom: -1, borderLeft: gold, borderBottom: gold })} />
        <span style={corner({ right: -1, bottom: -1, borderRight: gold, borderBottom: gold })} />
        {(reading || (s.mode === 'barcode' && live)) && (
          <div style={{ position: 'absolute', left: 10, right: 10, height: 1, background: 'linear-gradient(90deg,transparent,#e1ad66,transparent)', boxShadow: '0 0 12px 2px rgba(225,173,102,.35)', animation: 'msBeam 1.6s ease-in-out infinite' }} />
        )}
      </div>
      <div className="col" style={{ marginTop: 'auto', position: 'relative', padding: '0 22px calc(36px + env(safe-area-inset-bottom, 0px))', alignItems: 'center', gap: 18 }}>
        <div className="serif" aria-live="polite" style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.7, minHeight: 48, maxWidth: 300, textShadow: '0 1px 6px rgba(0,0,0,.8)' }}>
          {busy || L(hint)}
          {!busy && <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--color-neutral-400)' }}>{L('사진은 이 기기 안에서만 처리합니다')}</div>}
        </div>
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.18)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(0,0,0,.35)' }} role="radiogroup">
          {(Object.keys(MODES) as ScanMode[]).map(k => (
            <button key={k} role="radio" aria-checked={s.mode === k} onClick={() => { setBusy(''); seen.current.clear(); set({ mode: k }); }}
              style={{ whiteSpace: 'nowrap', padding: '8px 13px', fontSize: 12.5, background: 'none', border: 0, color: s.mode === k ? 'var(--color-accent-300)' : 'var(--color-neutral-400)', boxShadow: s.mode === k ? 'inset 0 0 0 1px var(--color-accent-400)' : 'none' }}>
              {L(MODES[k][0])}
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <button aria-label={L('사진 고르기')} onClick={() => file.current?.click()} className="serif"
            style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,.08)', outline: '1px solid rgba(255,255,255,.18)', background: 'repeating-linear-gradient(135deg,#3a3634 0 5px,#2f2c2a 5px 10px)', color: 'var(--color-accent-300)', fontSize: 11 }}>{L('사진')}</button>
          <button aria-label="Shutter" onClick={shutter} className="shutter"
            style={{ width: 76, height: 76, borderRadius: '50%', border: '1px solid var(--color-accent-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', padding: 0 }}>
            <span style={{ width: 62, height: 62, borderRadius: '50%', border: '1.5px solid var(--color-accent-400)' }} />
          </button>
          <button aria-label="Flash" onClick={toggleTorch} disabled={torch === null}
            style={{ ...ring, width: 52, height: 52, color: torch ? 'var(--color-accent-300)' : 'inherit', borderColor: torch ? 'var(--color-accent-400)' : 'rgba(255,255,255,.2)', opacity: torch === null ? 0.35 : 1 }}><Zap /></button>
        </div>
      </div>
    </div>
  );
}

/** Non-drug ad banner (same ad page and disclosure as the web app). */
export function AdSlot() {
  const { L } = useApp();
  const [ok, setOk] = useState(false);
  return (
    <div style={{ display: ok ? 'block' : 'none' }}>
      <div className="muted" style={{ fontSize: 10.5, fontStyle: 'italic', margin: '0 0 4px' }}>{L('광고')}</div>
      <iframe src="../ad.html" title={L('광고')} onLoad={() => setOk(true)} loading="lazy"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin" referrerPolicy="no-referrer"
        style={{ width: '100%', height: 80, border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)' }} />
    </div>
  );
}

const NAV = [
  { k: 'home', l: '홈', Icon: House },
  { k: 'history', l: '기록', Icon: BookOpen },
  { k: 'scan', l: '스캔', Icon: ScanLine },
  { k: 'search', l: '내 약', Icon: PillIcon },
  { k: 'my', l: '마이', Icon: User },
] as const;
const TAB_OF: Partial<Record<Screen, Screen>> = {
  home: 'home', results: 'home', detail: 'search', symptom: 'home', schedule: 'home', vitals: 'home', pill: 'home', today: 'home', puzzle: 'home',
  pharmacy: 'my', history: 'history', report: 'history', search: 'search', my: 'my', family: 'my',
};

export function BottomNav() {
  const { screen, go, tab, L } = useApp();
  const cur = TAB_OF[screen];
  return (
    <nav className="nav-bar">
      {NAV.map(({ k, l, Icon }) => (
        <button key={k} className={cur === k ? 'on' : ''} aria-current={cur === k ? 'page' : undefined}
          onClick={() => (k === 'scan' ? go('scan') : tab(k))}>
          <span className="ic"><Icon /></span>
          <span className="lb">{L(l)}</span>
        </button>
      ))}
    </nav>
  );
}
