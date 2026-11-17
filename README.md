# 메디스캔 프로 (MediScan Pro)

환자가 먹는 약 중에서 새로 생긴 문제(신기능 저하, 간수치 상승, 증상 등)를 일으킬 수 있는 약을
식품의약품안전처 의약품 허가정보(첨부문서) 기준으로 찾아주는 도구입니다. AI 없이, 첨부문서 문장을 규칙으로 추출합니다.

- 웹 버전: https://jeremiah-84.github.io/drug-adr/
- Chrome 확장 프로그램: 처방창 옆 패널에서 사용, 화면의 약 이름을 읽어 자동 추가

## 폴더
| 폴더 | 내용 |
|---|---|
| `pipeline/` | 식약처 API에서 데이터를 받아 이상반응·신/간기능 정보를 추출하는 스크립트 |
| `app/` | 화면 (웹과 확장 프로그램이 같이 씀) |
| `extension/` | Chrome 확장 프로그램 설정·아이콘 |
| `docs/` | GitHub Pages로 공개되는 웹 버전, 광고 페이지, 개인정보처리방침, 데이터(`docs/data`) |
| `.github/workflows/` | 매월 데이터 자동 갱신 |

## 데이터 갱신
매월 2일 새벽 자동으로 `pipeline/run.py`가 실행되어 `docs/data`를 갱신합니다.
저장소 Settings → Secrets and variables → Actions에 `MFDS_KEY`(공공데이터포털 인증키)가 있어야 합니다.
확장 프로그램은 켤 때 웹의 `data/version.json`을 확인해 더 새 데이터가 있으면 받아 씁니다.

## 확장 프로그램 만들기
```
python3 build_extension.py https://jeremiah-84.github.io/drug-adr/
```
`dist/drug-adr-extension.zip`이 만들어집니다. Chrome 웹스토어에 올리거나, chrome://extensions에서 압축 해제 폴더로 로드합니다.

## 주의
이상반응은 첨부문서에서 자동 추출되어 누락이나 오분류가 있을 수 있습니다. 진료 판단의 참고로만 사용하세요.
자료 출처: 식품의약품안전처 의약품 제품 허가정보 (공공데이터포털)
