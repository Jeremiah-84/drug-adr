# MediScan Pro mobile app (`/m/`)

Phone app version of MediScan, built from the Claude Design file `design/MediScan Mobile.dc.html`
(option 1a: dark green & gold). React + Vite, built into `docs/m/` so GitHub Pages serves it at
`https://jeremiah-84.github.io/drug-adr/m/` and it can be installed to the home screen.

It uses the same data and engines as the web app and the Chrome extension (no AI, nothing uploaded):

| Feature | Source |
| --- | --- |
| Search by ingredient / product name | `docs/data/index.json` |
| Side effects (4 tiers), renal/hepatic notes, label quote + MFDS link | `docs/data/d/<id>.json` |
| Prescription / pill-bag photo → drug names | on-device OCR, `docs/vendor/ocr` |
| Box barcode → product | `docs/data/barcode.json`, `docs/vendor/barcode` |
| Pill ID (imprint, shape, color) | `docs/data/pills.json` |
| Symptom check (free text or chips) | same alias matching as the web app (`src/probs.ts`) |

My medicines, dose times, taken log, BP/glucose notebook, symptom log and family members are kept in
`localStorage` on the phone only. Dose reminders fire as phone notifications while the app is open or in
the background (a web app cannot ring once fully closed). "병원·약국 찾기" opens Naver Map and the
official holiday-pharmacy / E-Gen sites. The ad slot loads `docs/ad.html` (non-drug ads with disclosure).

```sh
cd mobile
npm ci
npm run dev        # http://localhost:5173 (data paths need docs/ served one level up; use `npm run build` + a static server on docs/)
npm run build      # typecheck + build into ../docs/m
```

URL options for testing: `?splash=0` skip the quote intro, `?lang=en|zh|ja`, `?screen=detail|vitals|pill|…`, `?quote=0..9`.
