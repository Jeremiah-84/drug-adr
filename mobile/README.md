# MediScan Pro mobile app (`/m/`)

Phone app version of MediScan Pro. Since 2026-11 it uses the **MediScan Classical** design (warm paper
`#f3f2f2`, ink `#201f1d`, gold accent `#b68235`, Cormorant Garamond / Lora / Noto Serif, outlined
buttons and hairline dividers; tokens in `src/styles/classical.css`). The earlier dark green & gold
design file is kept in `design/MediScan Mobile.dc.html` for reference. React + Vite, built into `docs/m/` so GitHub Pages serves it at
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

## Classical screens and rules

- **Onboarding** (3 steps: intro, role 환자·보호자 / 의료 관계자, camera + notification permission). Shown once; "온보딩 다시 보기" in 마이.
- **Today's page** (`today`): a short drug story and a 3-choice quiz, both preferring the user's own medicines (`src/daily.ts`), and a monthly stamp calendar built from the real taken log. Story texts are written from the MFDS labels and should be source-checked before wide release.
- **Daily sudoku** (`puzzle`, 6×6 or 9×9, `src/sudoku.ts`), saved under `localStorage` key `mediscan.sudoku`.
- **Daily crossword** (`xword`, 십자말 퀴즈, `src/xword.ts`, `src/screens/Crossword.tsx`): 60 Korean puzzles in `src/xwords.json`, one per day, saved under `mediscan.xword`. The player types the whole answer in one box (works with the Korean keyboard). Puzzles are built by `node scripts/make_xwords.mjs` from the word bank `scripts/xword_bank.mjs`; medicine clues there follow the MFDS labels, so check the label before editing one, then re-run the script and `npm run build`.
- **Dose button window**: "복용 완료" only works from 2 hours before to 2 hours after the dose time (`WINDOW_MIN` in `src/state.tsx`); outside it the slot shows 예정 / 누락.
- **4 languages** (ko, en, zh, ja): classical strings live in `src/i18n_classical.ts` (zh/ja need a native review).
- Medical-pro role shows the MFDS 품목기준코드 on the detail page.
- New saved fields in `mediscan.v1`: `onboarded`, `role`, `quiz`.
