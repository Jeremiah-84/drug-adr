import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import type { Screen } from '../config';
import { useApp, type ScanMode } from '../state';
import { BookOpen, House, Pill as PillIcon, ScanLine, User, X, Zap } from '../icons';
import { barcodeDetector, code13, findInText, loadIndex, ocr, photoCanvas, readCode, readDosing, warmOcr } from '../real';

const MODES: Record<ScanMode, [string, string]> = {
  rx: ['처방전·약봉투', '처방전이나 약봉투의 글자가 네모 안에 들어오게 비춰주세요'],
  barcode: ['QR·바코드', '약 상자·약봉투의 QR 코드나 바코드를 네모 안에 맞춰주세요'],
  pill: ['알약 모양', '알약에 새겨진 글자와 모양·색으로 찾아요. 아래 버튼을 누르세요'],
};

// Frame geometry from the design (390×844), relative to the viewport height so it keeps its proportions.
const FRAMES: Record<ScanMode, CSSProperties> = {
  rx: { left: 30, right: 30, top: '20%', height: '45%' },
  barcode: { left: 'calc(50% - 120px)', right: 'calc(50% - 120px)', top: '27%', height: 240 },
  pill: { left: 'calc(50% - 100px)', right: 'calc(50% - 100px)', top: '29%', height: 200 },
};
const corner = (pos: CSSProperties): CSSProperties => ({ position: 'absolute', width: 26, height: 26, ...pos });
const gold = '1.5px solid #e1ad66';

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
  // The camera is turned off while a picked photo or a taken shot is being read (saves battery and
  // gives the phone's processor to the text reader); it comes back on if reading fails.
  const [cam, setCam] = useState(true);
  const [still, setStill] = useState('');
  const camOff = () => { stream.current?.getTracks().forEach(x => x.stop()); stream.current = null; setLive(false); setTorch(null); setCam(false); };
  const camOn = () => { setStill(x => { if (x) URL.revokeObjectURL(x); return ''; }); setCam(true); };
  useEffect(() => () => { if (still) URL.revokeObjectURL(still); }, [still]);

  // Start loading the text reader as soon as the scan screen opens.
  useEffect(() => { if (s.mode === 'rx') warmOcr(); }, [s.mode]);

  // Camera on while this screen is open.
  useEffect(() => {
    if (!cam) return;
    let stop = false;
    (async () => {
      try {
        const st = await openCamera(() => stop);
        if (!st) return;
        if (stop) { st.getTracks().forEach(x => x.stop()); return; }
        stream.current = st;
        const v = video.current!;
        v.srcObject = st; await v.play(); setLive(true);
        const tr = st.getVideoTracks()[0];
        const caps = (tr.getCapabilities?.() || {}) as { torch?: boolean; focusMode?: string[] };
        if (caps.torch) setTorch(false);
        // Keep refocusing on whatever is in front of the lens (Android Chrome; iPhone does this on its own).
        if (caps.focusMode?.includes('continuous')) tr.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {});
      } catch { setLive(false); }
    })();
    return () => { stop = true; stream.current?.getTracks().forEach(x => x.stop()); stream.current = null; };
  }, [cam]);

  // A QR code that only links to a page (e.g. a pharmacy's own guide) can be opened from here.
  const [link, setLink] = useState('');
  /** true = medicine shown; 'said' = a message about this code is on screen; false = nothing useful. */
  const found = async (code: string, format = ''): Promise<boolean | 'said'> => {
    if (!code || seen.current.has(code)) return false;
    seen.current.add(code);
    const r = await readCode(code, format);
    if (r.found.length) { if (navigator.vibrate) navigator.vibrate(60); showFound({ at: Date.now(), kind: format === 'qr_code' ? 'qr' : 'barcode', found: r.found }); return true; }
    if (r.note === 'rx2d') setBusy(L('처방전 아래쪽 2D 바코드는 약국용 암호라 읽을 수 없어요. 처방전·약봉투 버튼으로 글자를 찍어 주세요'));
    else if (r.note?.startsWith('unknown:')) setBusy(F('등록되지 않은 바코드예요 ({0})', r.note.slice(8)));
    else if (r.url) { setBusy(L('약 이름이 들어 있지 않은 QR이에요. 연결된 안내 페이지를 열어 볼 수 있어요')); setLink(r.url); }
    else if (code13(code) === null && format !== 'qr_code') return false;
    else setBusy(L('이 QR에서는 약을 찾지 못했어요'));
    return 'said';
  };

  // Barcode mode: keep looking at the video.
  useEffect(() => {
    if (s.mode !== 'barcode' || !live) return;
    let on = true, run = false;
    const id = window.setInterval(async () => {
      if (run || !video.current || video.current.readyState < 2) return;
      run = true;
      try { const d = await barcodeDetector(); for (const b of await d.detect(video.current)) { if (!on) break; if ((await found(b.rawValue, b.format)) === true) { on = false; break; } } } catch { /* keep trying */ }
      run = false;
    }, 300);
    return () => { on = false; clearInterval(id); };
  }, [s.mode, live]);

  /** Read the text; when the first picture gives no medicine, try the backup picture (a still video frame). */
  const readText = async (img: Blob | HTMLCanvasElement, kind: 'rx' | 'photo', backup?: HTMLCanvasElement) => {
    setBusy(L('글자 읽기 준비 중… 처음 한 번은 조금 걸려요'));
    try {
      await loadIndex();
      const prog = (p: number) => setBusy(F('글자를 읽는 중… {0}%', p)), score = (t: string) => findInText(t).length;
      let text = await ocr(img, prog, score);
      if (!findInText(text).length && backup) { setBusy(L('한 번 더 읽어 보는 중…')); text = await ocr(backup, prog, score); }
      setBusy('');
      const found = readDosing(text, findInText(text));
      if (!found.length) camOn();
      showFound({ at: Date.now(), kind, found });
    } catch { setBusy(L('글자를 읽지 못했어요. 다시 찍어 주세요')); camOn(); }
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
    if (s.mode === 'rx') {
      // A real photo (ImageCapture) is sharper and larger than a video frame, and the phone focuses for it.
      setBusy(L('초점을 맞춰 찍는 중…'));
      // The sharpest of a few video frames is the backup (a hand that is still moving blurs one frame).
      const frame = await sharpest(c, grab);
      const photo = await takePhoto(stream.current).then(b => (b ? upright(b, frame) : null));
      setStill(frame.toDataURL('image/jpeg', 0.7)); camOff();
      readText(photo || frame, 'rx', photo ? frame : undefined); return;
    }
    try { const d = await barcodeDetector(); const r = await d.detect(c); let ok: boolean | 'said' = false; for (const b of r) { const x = await found(b.rawValue, b.format); if (x === true) { ok = true; break; } if (x) ok = x; } if (!ok) setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
    catch { setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    camOff(); setStill(URL.createObjectURL(f));
    if (s.mode === 'barcode') {
      try { const d = await barcodeDetector(); const r = await d.detect(await photoCanvas(f, 1600)); seen.current.clear(); let said = false; for (const b of r) { const x = await found(b.rawValue, b.format); if (x === true) return; if (x) said = true; } if (!said) setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
      catch { setBusy(L('바코드를 찾지 못했어요. 조금 더 가까이 비춰 주세요')); }
      camOn();
      return;
    }
    readText(f, 'photo');
  };

  const toggleTorch = async () => {
    const tr = stream.current?.getVideoTracks()[0];
    if (!tr || torch === null) return;
    try { await tr.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); } catch { /* not supported */ }
  };

  const [ring, setRing] = useState<{ x: number; y: number; k: number } | null>(null);
  const focusAt = (e: RPointerEvent<HTMLDivElement>) => {
    const tr = stream.current?.getVideoTracks()[0], box = e.currentTarget.getBoundingClientRect();
    if (!tr || !live) return;
    const x = e.clientX - box.left, y = e.clientY - box.top;
    setRing({ x, y, k: Date.now() });
    const caps = (tr.getCapabilities?.() || {}) as { focusMode?: string[] };
    const mode = caps.focusMode?.includes('single-shot') ? 'single-shot' : caps.focusMode?.includes('continuous') ? 'continuous' : null;
    if (!mode) return;
    tr.applyConstraints({ advanced: [{ pointsOfInterest: [{ x: x / box.width, y: y / box.height }], focusMode: mode } as MediaTrackConstraintSet] })
      .catch(() => tr.applyConstraints({ advanced: [{ focusMode: mode } as MediaTrackConstraintSet] }).catch(() => {}));
  };
  useEffect(() => { if (!ring) return; const id = setTimeout(() => setRing(null), 1200); return () => clearTimeout(id); }, [ring]);
  const [guide, setGuide] = useState(!s.scanTip && s.mode !== 'pill');
  const closeGuide = () => { setGuide(false); if (!s.scanTip) set({ scanTip: true }); };

  const reading = !!busy && /%|준비/.test(busy);
  const fr = FRAMES[s.mode];
  const circle = { width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: 'inherit' } as const;
  return (
    <div className="col" style={{ position: 'absolute', inset: 0, background: 'var(--ms-dark)', zIndex: 20, color: '#f8f4f4' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.015) 0 12px,transparent 12px 24px)' }} />
      <video ref={video} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: live ? 1 : 0 }} />
      {!live && cam && !still && <span style={{ position: 'absolute', top: '46%', left: 24, right: 24, textAlign: 'center', fontSize: 12, fontStyle: 'italic', color: '#9b9797', lineHeight: 1.6 }}>{L('카메라를 쓸 수 없으면 아래 버튼으로 사진을 고르세요')}</span>}
      <input ref={file} type="file" accept="image/*" hidden onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {still && <img src={still} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.55 }} />}
      {/* Tap anywhere on the picture to focus there. */}
      <div onPointerDown={focusAt} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
      {ring && <span key={ring.k} className="focus-ring" style={{ left: ring.x - 32, top: ring.y - 32 }} />}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'calc(var(--ms-top) + 8px) 22px 0' }}>
        <button aria-label="Close" onClick={back} style={circle}><X /></button>
        <span className="g" style={{ letterSpacing: '.32em', fontSize: 14, color: '#e1ad66', fontWeight: 700 }}>SCAN</span>
        <button aria-label={L('잘 찍는 방법')} onClick={() => setGuide(true)} className="serif" style={{ ...circle, fontSize: 19, fontWeight: 600, color: '#facb8d' }}>?</button>
      </div>
      <div style={{ position: 'absolute', ...fr, pointerEvents: 'none', transition: 'all .35s ease', border: '1px solid rgba(225,173,102,.25)' }}>
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
          {link && busy && <div><a href={link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: '#facb8d', textDecoration: 'underline' }}>{L('안내 페이지 열기')}</a></div>}
          {!busy && live && s.mode !== 'pill' && <div style={{ fontSize: 12, color: '#e9d2ad' }}>{L('글자를 한 번 누르면 초점을 맞춰요')}</div>}
          {!busy && <div style={{ fontSize: 11.5, fontStyle: 'italic', color: '#bab6b6' }}>{L('사진은 이 기기 안에서만 처리합니다')}</div>}
        </div>
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.18)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(0,0,0,.35)' }} role="radiogroup">
          {(Object.keys(MODES) as ScanMode[]).map(k => (
            <button key={k} role="radio" aria-checked={s.mode === k} onClick={() => { setBusy(''); setLink(''); seen.current.clear(); set({ mode: k }); }}
              style={{ whiteSpace: 'nowrap', padding: '8px 13px', fontSize: 12.5, background: 'none', border: 0, color: s.mode === k ? '#facb8d' : '#bab6b6', boxShadow: s.mode === k ? 'inset 0 0 0 1px #e1ad66' : 'none' }}>
              {L(MODES[k][0])}
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <button aria-label={L('사진 고르기')} onClick={() => { if (s.mode !== 'barcode') warmOcr(); file.current?.click(); }} className="serif"
            style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,.08)', outline: '1px solid rgba(255,255,255,.18)', background: 'repeating-linear-gradient(135deg,#3a3634 0 5px,#2f2c2a 5px 10px)', color: '#facb8d', fontSize: 11 }}>{L('사진')}</button>
          <button aria-label="Shutter" onClick={shutter} className="shutter"
            style={{ width: 76, height: 76, borderRadius: '50%', border: '1px solid #e1ad66', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', padding: 0 }}>
            <span style={{ width: 62, height: 62, borderRadius: '50%', border: '1.5px solid #e1ad66' }} />
          </button>
          {/* Flash (torch) — only on phones that allow it from the browser. */}
          <button aria-label={L('플래시')} aria-pressed={!!torch} onClick={toggleTorch} disabled={torch === null}
            style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 0, padding: 0, color: torch ? '#facb8d' : 'inherit', visibility: torch === null ? 'hidden' : 'visible' }}>
            <span style={{ ...circle, width: 44, height: 44, borderColor: torch ? '#e1ad66' : 'rgba(255,255,255,.2)' }}><Zap /></span>
            <span style={{ fontSize: 10.5 }}>{torch ? L('플래시 켬') : L('플래시')}</span>
          </button>
        </div>
      </div>
      {guide && <ScanGuide mode={s.mode} onClose={closeGuide} />}
    </div>
  );
}

const GUIDE: Record<'rx' | 'barcode', [string, string][]> = {
  rx: [
    ['밝은 곳에서 평평하게', '종이를 책상에 펴 놓고, 밝은 곳에서 찍어요. 구겨진 약봉투는 손으로 펴 주세요.'],
    ['위에서 나란히', '휴대폰을 종이 바로 위에서 종이와 나란히 들어요. 비스듬히 찍으면 글자가 찌그러져요.'],
    ['약 이름이 네모를 꽉 채우게', '15~25cm 거리에서 약 이름 줄이 가로로 네모 안에 크게 들어오게 맞춰요. 너무 가까우면 초점이 안 맞아요.'],
    ['눌러서 초점 맞추기', '화면의 글자를 한 번 누르면 그곳에 초점을 맞춰요. 글자가 또렷해지면 가운데 버튼을 눌러요.'],
    ['반사와 그림자 피하기', '불빛이 번쩍이거나 손 그림자가 글자를 가리지 않게 해요. 어두우면 오른쪽 아래 플래시(번개)를 켜고, 반짝이는 봉투는 플래시를 꺼요.'],
    ['복용법 줄도 함께', '"1일 3회", "7일분" 같은 줄이 함께 나오면 먹는 시간과 끝나는 날을 채워 드려요. 채운 내용은 결과 화면에서 바꿀 수 있어요.'],
    ['그래도 안 되면', '휴대폰 기본 카메라로 찍은 뒤 왼쪽 아래 "사진" 버튼으로 골라 주세요. 기본 카메라가 초점을 더 잘 맞춰요.'],
  ],
  barcode: [
    ['QR 코드나 바코드를 네모 안에', '약 상자·약병·약봉투의 QR 코드나 바코드가 네모 안에 들어오게 맞춰요. 비추기만 하면 저절로 읽어요.'],
    ['어떤 QR을 읽나요', '약 상자의 바코드·QR(식약처 전자 첨부문서)과 약 이름이 담긴 약봉투 QR을 읽어요. 처방전 아래쪽의 큰 2D 바코드는 약국용 암호라 읽을 수 없어요.'],
    ['10cm쯤 떨어져서', '너무 가까우면 초점이 안 맞아요. 화면을 한 번 누르면 초점을 다시 맞춰요.'],
    ['반사 피하기', '비닐 포장이 번쩍이면 상자를 조금 기울여요. 어두우면 플래시(번개)를 켜요.'],
  ],
};

/** How to take a photo the text reader can read. Shown the first time and from the ? button. */
function ScanGuide({ mode, onClose }: { mode: ScanMode; onClose: () => void }) {
  const { L } = useApp();
  const tips = GUIDE[mode === 'barcode' ? 'barcode' : 'rx'];
  return (
    <div className="scan-guide" role="dialog" aria-modal="true" aria-label={L('잘 찍는 방법')} onClick={onClose}>
      <div className="scan-guide-card" onClick={e => e.stopPropagation()}>
        <span className="g" style={{ letterSpacing: '.28em', fontSize: 12, color: '#e1ad66', fontWeight: 700 }}>HOW TO SCAN</span>
        <span className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{L('이렇게 찍으면 잘 읽어요')}</span>
        <ol className="scan-guide-list">
          {tips.map(([h, b], i) => (
            <li key={h}>
              <span className="g tnum" style={{ color: '#e1ad66', fontSize: 17, width: 20, flex: 'none' }}>{i + 1}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{L(h)}</span>
                <span style={{ fontSize: 13, lineHeight: 1.65, color: '#d6d1cf' }}>{L(b)}</span>
              </span>
            </li>
          ))}
        </ol>
        <button className="btn" onClick={onClose} style={{ height: 48, border: '1px solid #e1ad66', color: '#facb8d', background: 'none', fontFamily: 'var(--ms-serif)', fontSize: 15, fontWeight: 600 }}>{L('알겠어요')}</button>
      </div>
    </div>
  );
}

const CAM_KEY = 'mediscan.cam';
const hasAF = (st: MediaStream) => ((st.getVideoTracks()[0]?.getCapabilities?.() || {}) as { focusMode?: string[] }).focusMode?.includes('continuous');
/**
 * Open the back camera. Some phones hand the browser a wide-angle lens that cannot focus up close;
 * when the first camera has no autofocus, the other back cameras are tried and the first one that
 * can focus is remembered for next time.
 */
async function openCamera(stopped: () => boolean): Promise<MediaStream | null> {
  const size = { width: { ideal: 1920 }, height: { ideal: 1080 } };
  let saved = '';
  try { saved = localStorage.getItem(CAM_KEY) || ''; } catch { /* ignore */ }
  if (saved) {
    try { return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: saved }, ...size }, audio: false }); } catch { /* camera gone: fall through */ }
  }
  const first = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, ...size }, audio: false });
  const caps = (first.getVideoTracks()[0].getCapabilities?.() || {}) as { focusMode?: string[] };
  if (!caps.focusMode || hasAF(first) || stopped()) return first; // iPhone etc. report no focus modes: keep the default
  const firstId = first.getVideoTracks()[0].getSettings().deviceId;
  const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput' && d.deviceId !== firstId && !/front|전면|user/i.test(d.label));
  for (const c of cams) {
    let st: MediaStream | null = null;
    try {
      first.getTracks().forEach(x => x.stop());
      st = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: c.deviceId }, ...size }, audio: false });
      const facing = st.getVideoTracks()[0].getSettings().facingMode;
      if (hasAF(st) && facing !== 'user') { try { localStorage.setItem(CAM_KEY, c.deviceId); } catch { /* ignore */ } return st; }
      st.getTracks().forEach(x => x.stop());
    } catch { st?.getTracks().forEach(x => x.stop()); }
    if (stopped()) return null;
  }
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, ...size }, audio: false });
}

/** Rough sharpness: how much neighbouring pixels differ in the middle of the picture. */
function sharpness(c: HTMLCanvasElement): number {
  const w = 320, h = Math.round(c.height * w / c.width), t = document.createElement('canvas');
  t.width = w; t.height = h; const g = t.getContext('2d')!; g.drawImage(c, 0, 0, w, h);
  const d = g.getImageData(w / 4, h / 4, w / 2, h / 2).data, W = w / 2;
  let sum = 0;
  for (let i = 4; i < d.length - W * 4; i += 4) sum += Math.abs(d[i] - d[i - 4]) + Math.abs(d[i] - d[i + W * 4]);
  return sum;
}
/** Take a few more frames over half a second and keep the sharpest. */
async function sharpest(first: HTMLCanvasElement, grab: () => HTMLCanvasElement | null): Promise<HTMLCanvasElement> {
  let best = first, bs = sharpness(first);
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 150));
    const c = grab(); if (!c) break;
    const v = sharpness(c); if (v > bs) { best = c; bs = v; }
  }
  return best;
}
/**
 * Some phones hand back the full photo turned on its side (as the camera sensor sits) without
 * saying so, and sideways text cannot be read. Turn the photo so that it matches the video frame
 * the person saw: of the possible turns, keep the one that looks most like the frame.
 */
async function upright(photo: Blob, frame: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(photo, { imageOrientation: 'from-image' }).catch(() => null);
  const draw = (deg: number, max: number) => {
    const side = deg % 180 !== 0, w0 = bmp!.width, h0 = bmp!.height, k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.round((side ? h0 : w0) * k); c.height = Math.round((side ? w0 : h0) * k);
    const g = c.getContext('2d')!; g.translate(c.width / 2, c.height / 2); g.rotate(deg * Math.PI / 180); g.drawImage(bmp!, -w0 * k / 2, -h0 * k / 2, w0 * k, h0 * k);
    return c;
  };
  if (!bmp) { const c = document.createElement('canvas'); c.width = frame.width; c.height = frame.height; c.getContext('2d')!.drawImage(frame, 0, 0); return c; }
  const tiny = (c: HTMLCanvasElement) => { const t = document.createElement('canvas'); t.width = 24; t.height = 24; const g = t.getContext('2d')!; g.filter = 'grayscale(1)'; g.drawImage(c, 0, 0, 24, 24); return g.getImageData(0, 0, 24, 24).data; };
  const ref = tiny(frame), frameTall = frame.height > frame.width;
  let best = 0, bd = Infinity;
  for (const deg of [0, 90, 180, 270]) {
    const c = draw(deg, 200);
    if ((c.height > c.width) !== frameTall && Math.abs(c.width - c.height) > 4) continue; // wrong way round
    const t = tiny(c); let d = 0;
    for (let i = 0; i < t.length; i += 4) d += Math.abs(t[i] - ref[i]);
    if (d < bd) { bd = d; best = deg; }
  }
  return draw(best, 3000);
}

/** A full-resolution still (the phone focuses for it). Null where the browser cannot take one. */
async function takePhoto(st: MediaStream | null): Promise<Blob | null> {
  const tr = st?.getVideoTracks()[0];
  const IC = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { takePhoto: () => Promise<Blob> } }).ImageCapture;
  if (!tr || !IC) return null;
  try {
    return await Promise.race([new IC(tr).takePhoto(), new Promise<null>(r => setTimeout(() => r(null), 4000))]);
  } catch { return null; }
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
  home: 'home', results: 'home', detail: 'search', symptom: 'home', schedule: 'home', vitals: 'home', pill: 'home', today: 'home', puzzle: 'home', xword: 'home',
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
