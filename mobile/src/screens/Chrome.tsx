import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Screen } from '../config';
import { useApp, type ScanMode } from '../state';
import { barcodeDetector, code13, findInText, loadIndex, lookupBarcode, ocr, photoCanvas } from '../real';

const MODES: Record<ScanMode, [string, string, { l: number; t: number; h: number }]> = {
  rx: ['처방전·약봉투', '처방전이나 약봉투의 글자가 네모 안에 들어오게 비춰주세요', { l: 30, t: 170, h: 380 }],
  barcode: ['바코드', '약 상자의 바코드를 가로로 맞춰주세요', { l: 40, t: 280, h: 150 }],
  pill: ['알약 모양', '알약에 새겨진 글자와 모양·색으로 찾아요. 아래 버튼을 누르세요', { l: 90, t: 240, h: 200 }],
};

const corner = (pos: CSSProperties, sides: ('Left' | 'Right' | 'Top' | 'Bottom')[], radius: string): CSSProperties => ({
  position: 'absolute', width: 28, height: 28, ...pos, [radius]: 10,
  ...Object.fromEntries(sides.map(s => [`border${s}`, '2px solid #c9a45c'])),
});

const round40: CSSProperties = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/** Full-screen camera. Text and barcodes are read on this device; nothing is uploaded. */
export function ScanOverlay() {
  const { s, set, back, go, showFound, L, F } = useApp();
  const [, hint, frame] = MODES[s.mode];
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
  return (
    <div className="col" style={{ position: 'absolute', inset: 0, background: '#040807', zIndex: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,#0a1410 0 12px,#0c1813 12px 24px)' }} />
      <video ref={video} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: live ? 1 : 0 }} />
      {!live && <span style={{ position: 'absolute', top: '46%', left: 24, right: 24, textAlign: 'center', fontSize: 12, color: '#6d7e75', lineHeight: 1.6 }}>{L('카메라를 쓸 수 없으면 아래 버튼으로 사진을 고르세요')}</span>}
      <input ref={file} type="file" accept="image/*" hidden onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '44px 18px 0' }}>
        <button aria-label="Close" onClick={back} style={{ ...round40, color: 'var(--ink)', fontSize: 18 }}>×</button>
        <span className="display" style={{ letterSpacing: '.3em', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>SCAN</span>
        <div style={{ ...round40, color: 'var(--gold-light)', fontSize: 11 }}>{s.mode === 'barcode' && live ? 'AUTO' : ''}</div>
      </div>
      <div style={{ position: 'absolute', left: frame.l, right: frame.l, top: frame.t, height: frame.h, transition: 'all .35s ease' }}>
        <span style={corner({ left: 0, top: 0 }, ['Left', 'Top'], 'borderTopLeftRadius')} />
        <span style={corner({ right: 0, top: 0 }, ['Right', 'Top'], 'borderTopRightRadius')} />
        <span style={corner({ left: 0, bottom: 0 }, ['Left', 'Bottom'], 'borderBottomLeftRadius')} />
        <span style={corner({ right: 0, bottom: 0 }, ['Right', 'Bottom'], 'borderBottomRightRadius')} />
        {(reading || (s.mode === 'barcode' && live)) && (
          <div style={{ position: 'absolute', left: 8, right: 8, height: 2, background: 'linear-gradient(90deg,transparent,#e8d39a,transparent)', boxShadow: '0 0 16px 4px rgba(232,211,154,.45)', animation: 'msBeam 1.6s ease-in-out infinite' }} />
        )}
      </div>
      <div className="col" style={{ marginTop: 'auto', position: 'relative', padding: '0 20px 34px', alignItems: 'center', gap: 18 }}>
        <div aria-live="polite" style={{ fontSize: 13.5, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.6, minHeight: 44, textShadow: '0 1px 6px rgba(0,0,0,.8)' }}>
          {busy || L(hint)}
          {!busy && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{L('사진은 이 기기 안에서만 처리합니다')}</div>}
        </div>
        <div className="segment" style={{ background: 'rgba(16,42,32,.9)', borderColor: 'rgba(201,164,92,.2)' }}>
          {(Object.keys(MODES) as ScanMode[]).map(k => (
            <button key={k} className={s.mode === k ? 'on' : ''} onClick={() => { setBusy(''); seen.current.clear(); set({ mode: k }); }}
              style={{ flex: 'none', padding: '8px 12px', fontSize: 12.5 }}>{L(MODES[k][0])}</button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <button aria-label={L('사진 고르기')} onClick={() => file.current?.click()}
            style={{ width: 48, height: 48, borderRadius: 12, background: 'repeating-linear-gradient(135deg,#183a2c 0 5px,#143326 5px 10px)', border: '1px solid rgba(201,164,92,.3)', color: 'var(--gold-light)', fontSize: 10.5 }}>{L('사진')}</button>
          <button aria-label="Shutter" onClick={shutter} className="shutter"
            style={{ width: 78, height: 78, borderRadius: '50%', border: '2px solid #c9a45c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'var(--gold-orb)' }} />
          </button>
          <button aria-label="Flash" onClick={toggleTorch} disabled={torch === null}
            style={{ ...round40, width: 48, height: 48, color: torch ? '#0b1d16' : 'var(--gold-light)', background: torch ? 'var(--gold-orb)' : 'rgba(0,0,0,.5)', fontSize: 15, opacity: torch === null ? 0.35 : 1 }}>⚡</button>
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
      <div style={{ fontSize: 10.5, color: 'var(--faint)', margin: '0 0 4px' }}>{L('광고')}</div>
      <iframe src="../ad.html" title={L('광고')} onLoad={() => setOk(true)} loading="lazy"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin" referrerPolicy="no-referrer"
        style={{ width: '100%', height: 80, border: 0, borderRadius: 12, background: '#f4f1ea' }} />
    </div>
  );
}

const NAV: { k: Screen; l: string; r?: string; rot?: string }[] = [
  { k: 'home', l: '홈', r: '50%', rot: 'none' },
  { k: 'history', l: '기록', r: '2px', rot: 'none' },
  { k: 'scan', l: '스캔' },
  { k: 'search', l: '내 약', r: '2px', rot: 'rotate(45deg)' },
  { k: 'my', l: '마이', r: '50%', rot: 'none' },
];
const TAB_OF: Partial<Record<Screen, Screen>> = {
  home: 'home', results: 'home', detail: 'search', symptom: 'home', schedule: 'home', vitals: 'home', pill: 'home',
  pharmacy: 'my', history: 'history', report: 'history', search: 'search', my: 'my', family: 'my',
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
