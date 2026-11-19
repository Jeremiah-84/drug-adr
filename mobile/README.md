# MediScan Pro — mobile app (PWA)

Implementation of design option **1a** from `../project/MediScan Mobile.dc.html`: dark green and champagne gold, Android-first.
It's built with React 18, TypeScript and Vite, and installs as a PWA. It can be wrapped with Capacitor later to make an APK.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs to dist/ (static; works under any sub-path)
npm run preview
```

On a phone the app fills the screen. On a wider screen it appears inside the 400×840 handset frame from the design.

## Screens
Splash (today's philosopher quote, which scatters into gold particles) · Home · Scan (Rx / barcode / pill) → Results → Drug detail
(side effects · kidney/liver · how to take) · Symptom check · Dose schedule (tap a time to change it) · BP & glucose notebook
(with an entry sheet) · Records · Health report · AI chat · My · Family & caregivers · Nearby clinics & pharmacies.
Languages: KO / EN / 中 / 日 (tap the KO button on Home, or use My → Language).

## Launch options (the prototype's "Tweaks")
| Query | Effect |
|---|---|
| `?lang=en` | Starting language: `ko` `en` `zh` `ja` |
| `?splash=0` | Skip the quote splash |
| `?quote=3` | Force quote 0–9 (by default it changes daily) |
| `?screen=vitals` | Open a screen directly |
| `?scan=1.2` | Length of the simulated scan in seconds (0.5–4) |

## Code map
- `src/data.ts`: sample drugs, schedule, people, places, quotes, and the BP/glucose cut-offs (copied 1:1 from the prototype)
- `src/i18n.ts`: UI strings and the Korean → EN/ZH/JA dictionary
- `src/state.tsx`: app state, navigation stack and actions (`useApp()`)
- `src/screens/*`: one file per screen group; `Chrome.tsx` holds the scan overlay and the bottom nav
- `src/Splash.tsx`: canvas particle animation (it skips the effect when reduced motion is on)

## Not real yet
The drug information, AI replies, scan results, map and people are **example data** from the design. The camera, the PDF export
and push reminders are simulated. The real data lives in `Jeremiah-84/drug-adr` (`docs/data/*.json`), which is the next thing to connect.
Translations and the BP/glucose thresholds came from the design session and still need a pharmacist or clinician to review them.
