// Sample data ported 1:1 from the Claude Design prototype (project/MediScan Mobile.dc.html).
// Drug facts, people and places are illustrative examples, not real records.

export type Level = 1 | 2 | 3 | 4;
export type Badge = { t: string; c: string; bg: string };
export type LevelInfo = Badge & { d: string };
export const LV: Record<Level, LevelInfo> = {
  4: { t: '높음', c: '#eb9a89', bg: 'rgba(235,154,137,.14)', d: '1% 이상' },
  3: { t: '가능성 있음', c: '#e2c071', bg: 'rgba(226,192,113,.14)', d: '때때로·빈도 미기재' },
  2: { t: '낮음', c: '#9ccbb6', bg: 'rgba(156,203,182,.13)', d: '드물게' },
  1: { t: '매우 드묾', c: '#a9b5ad', bg: 'rgba(169,181,173,.12)', d: '매우 드물게' }
};
export type Tag = '금기' | '용량' | '주의' | '불필요';
export const TAG: Record<Tag, LevelInfo> = { '금기': LV[4], '용량': LV[3], '주의': LV[2], '불필요': LV[1] };
export type DrugId = 'amo' | 'lyr' | 'met' | 'cre';
export type Drug = {
  name: string; short: string; en: string; ing: string; cls: string; dose: string; count: string; color: string;
  adr: [string, Level, string][]; renal: [Tag, string]; hepatic: [Tag, string]; how: [string, string][]; quote: string;
};
export const DRUGS: Record<DrugId, Drug> = {
  amo: { name: '아모잘탄정 5/50mg', short: '아모잘탄', en: 'AMOSARTAN', ing: '암로디핀·로살탄', cls: '고혈압', dose: '1일 1회 아침', count: '1정', color: '#efe9da',
    adr: [['말초부종(발목 부음)', 4, '1% 이상'], ['어지러움', 3, '빈도 미기재'], ['두통', 3, '빈도 미기재'], ['고칼륨혈증', 2, '0.1~1%'], ['혈관부종', 1, '0.01% 미만']],
    renal: ['주의', '중증 신장애 환자는 신중투여. 칼륨과 크레아티닌 수치를 정기적으로 확인합니다.'], hepatic: ['용량', '간장애 환자는 혈중농도가 높아질 수 있어 저용량부터 시작합니다.'],
    how: [['복용', '1일 1회 1정, 매일 같은 시간'], ['식사', '식사와 관계없이 복용 가능'], ['잊었을 때', '생각난 즉시 복용, 다음 복용이 가까우면 건너뛰기'], ['보관', '실온, 습기를 피해 보관']],
    quote: '말초부종은 암로디핀 투여 시 용량 의존적으로 나타나는 가장 흔한 이상반응이다.' },
  lyr: { name: '리리카캡슐 75mg', short: '리리카', en: 'LYRICA', ing: '프레가발린', cls: '신경병증 통증', dose: '1일 2회', count: '1캡슐', color: '#e3b37a',
    adr: [['어지러움', 4, '1% 이상'], ['졸림', 4, '1% 이상'], ['말초부종', 3, '1% 이상'], ['체중 증가', 3, '1% 이상'], ['시야 흐림', 2, '0.1~1%']],
    renal: ['용량', '크레아티닌 청소율 60mL/min 미만이면 감량. 30 미만은 1일 1~2회로 줄입니다.'], hepatic: ['불필요', '간에서 거의 대사되지 않아 용량 조절이 필요하지 않습니다.'],
    how: [['복용', '1일 2회, 아침·저녁'], ['식사', '식사와 관계없이 복용 가능'], ['주의', '운전·기계 조작 주의, 갑자기 끊지 않기'], ['보관', '실온 보관']],
    quote: '어지러움 및 졸음이 흔하게 나타나며, 자동차 운전 등 위험을 수반하는 기계 조작에 주의하도록 한다.' },
  met: { name: '다이아벡스정 500mg', short: '다이아벡스', en: 'DIABEX', ing: '메트포르민', cls: '당뇨', dose: '1일 2회 식후', count: '1정', color: '#f6f3ec',
    adr: [['설사·구역', 4, '1% 이상'], ['복부 불편감', 4, '1% 이상'], ['금속성 맛', 3, '1% 이상'], ['비타민 B12 감소', 2, '장기 복용'], ['젖산산증', 1, '매우 드묾']],
    renal: ['금기', 'eGFR 30 미만은 투여 금기. 30~45는 새로 시작하지 않고 용량을 줄입니다.'], hepatic: ['주의', '간기능 장애는 젖산산증 위험을 높일 수 있어 신중히 투여합니다.'],
    how: [['복용', '1일 2회, 아침·저녁 식후'], ['식사', '식사 직후 복용하면 위장 증상이 줄어요'], ['주의', '조영제 검사 전후 일시 중단'], ['보관', '실온 보관']],
    quote: '설사, 구역, 구토, 복통 등 위장관계 증상이 투여 초기에 흔히 나타나며 대부분 자연 소실된다.' },
  cre: { name: '크레스토정 10mg', short: '크레스토', en: 'CRESTOR', ing: '로수바스타틴', cls: '고지혈증', dose: '1일 1회 취침 전', count: '1정', color: '#e9b6b0',
    adr: [['근육통', 3, '1% 이상'], ['두통', 3, '1% 이상'], ['간수치(ALT) 상승', 2, '0.1~1%'], ['횡문근융해증', 1, '매우 드묾']],
    renal: ['용량', '중증 신장애(CrCl 30 미만)는 1일 5mg부터 시작하며 40mg은 금기입니다.'], hepatic: ['금기', '활동성 간질환 또는 원인 불명의 지속적 간수치 상승 시 투여 금기.'],
    how: [['복용', '1일 1회, 매일 같은 시간'], ['식사', '식사와 관계없이 복용 가능'], ['주의', '설명되지 않는 근육통 시 바로 상담'], ['보관', '실온 보관']],
    quote: '원인을 알 수 없는 근육통, 근육 압통 또는 근무력이 나타나면 즉시 의사에게 알리도록 한다.' }
};
export const ORDER: DrugId[] = ['amo', 'lyr', 'met', 'cre'];
export type SlotKey = 'm' | 'e' | 'n';
export type Slot = { k: SlotKey; time: string; label: string; drugs: DrugId[] };
export const SLOTS: Slot[] = [
  { k: 'm', time: '08:00', label: '아침 식후', drugs: ['amo', 'lyr', 'met'] },
  { k: 'e', time: '19:00', label: '저녁 식후', drugs: ['lyr', 'met'] },
  { k: 'n', time: '22:00', label: '취침 전', drugs: ['cre'] }
];
export const SYMPTOMS: Record<string, [DrugId, Level][]> = {
  '어지러움': [['lyr', 4], ['amo', 3]], '졸림': [['lyr', 4]], '다리 부음': [['amo', 4], ['lyr', 3]],
  '설사·구역': [['met', 4]], '근육통': [['cre', 3]], '간수치 상승': [['cre', 2]], 'eGFR 감소': [['met', 2], ['amo', 2]], '체중 증가': [['lyr', 3]]
};
export type Member = { name: string; initial: string; rel: string; meta: string; meds: string; rate: string };
export const MEMBERS: Member[] = [
  { name: '김지현', initial: '김', rel: '나', meta: '1978년생 · 복용 중 4개', meds: '복용 중 4개', rate: '92%' },
  { name: '이순자', initial: '이', rel: '어머니', meta: '1951년생 · 복용 중 6개', meds: '복용 중 6개 · 오늘 저녁 누락', rate: '78%' },
  { name: '박준우', initial: '준', rel: '아들', meta: '2012년생 · 복용 중 1개', meds: '복용 중 1개', rate: '100%' }
];
export const REPLIES: Record<string, string> = {
  '리리카 먹고 졸려요': '리리카(프레가발린)는 첨부문서에서 졸림과 어지러움이 1% 이상 흔하게 보고된 약이에요.\n\n복용 초기나 용량을 올린 직후에 특히 흔하니 운전과 기계 조작은 피하세요. 계속되면 처방의와 용량 조정을 상의해 보세요.',
  '술 마셔도 되나요?': '지금 드시는 약 중 두 가지가 술과 겹쳐요.\n\n· 다이아벡스(메트포르민): 과음 시 젖산산증 위험이 커집니다.\n· 리리카: 졸림과 어지러움이 심해질 수 있어요.\n\n가능하면 피하시는 걸 권해요.',
  '다이아벡스 언제 먹어요?': '식사 직후 드세요. 식사와 함께 먹으면 설사·구역 같은 위장 증상이 줄어요. 지금 일정은 아침 08:00, 저녁 19:00입니다.'
};
export type Place = { n: string; d: string; h: string; st: string; open: boolean; night?: boolean; kind: 'ph' | 'hos' };
export const PHARM: Place[] = [
  { n: '온누리 정문약국', d: '180m', h: '22:00까지', st: '영업 중', open: true, night: true, kind: 'ph' },
  { n: '서울내과의원', d: '240m', h: '18:30까지', st: '진료 중', open: true, kind: 'hos' },
  { n: '맑은눈 안과의원', d: '350m', h: '19:00까지', st: '진료 중', open: true, kind: 'hos' },
  { n: '푸른숲약국', d: '410m', h: '20:00까지', st: '영업 중', open: true, kind: 'ph' },
  { n: '한강 24시약국', d: '1.2km', h: '24시간', st: '야간', open: true, night: true, kind: 'ph' },
  { n: '서울중앙병원 응급실', d: '2.4km', h: '24시간', st: '야간', open: true, night: true, kind: 'hos' }
];

export type Quote = { t: string; a: string; en: string };
export const QUOTES: Quote[] = [
  { t: '성찰하지 않는 삶은 살 가치가 없다.', a: '소크라테스', en: 'Socrates' },
  { t: '오늘 하루를 생의 마지막 날처럼 살되, 서두르지도 게으르지도 말라.', a: '마르쿠스 아우렐리우스', en: 'Marcus Aurelius' },
  { t: '우리를 괴롭히는 것은 일 자체가 아니라 그 일에 대한 우리의 생각이다.', a: '에픽테토스', en: 'Epictetus' },
  { t: '삶은 짧은 것이 아니라, 우리가 그것을 짧게 만드는 것이다.', a: '세네카', en: 'Seneca' },
  { t: '천 리 길도 한 걸음에서 시작된다.', a: '노자', en: 'Laozi' },
  { t: '아는 것을 안다 하고 모르는 것을 모른다 하는 것, 그것이 앎이다.', a: '공자', en: 'Confucius' },
  { t: '같은 강물에 두 번 발을 담글 수는 없다.', a: '헤라클레이토스', en: 'Heraclitus' },
  { t: '삶은 뒤돌아볼 때 이해되지만, 앞을 향해 살아야 한다.', a: '키르케고르', en: 'Kierkegaard' },
  { t: '살아야 할 이유를 아는 사람은 어떤 상황도 견딜 수 있다.', a: '니체', en: 'Nietzsche' },
  { t: '행복은 스스로 만족하는 사람의 것이다.', a: '아리스토텔레스', en: 'Aristotle' }
];

export type BpEntry = { d: string; time: string; s: number; di: number; p: number };
export type GluEntry = { d: string; time: string; v: number; when: string };
export const BP0: BpEntry[] = ([['11.12', '07:40', 138, 88, 74], ['11.13', '07:35', 134, 86, 72], ['11.14', '07:50', 141, 91, 78], ['11.15', '08:05', 132, 84, 70], ['11.16', '07:30', 129, 83, 71], ['11.17', '07:45', 126, 81, 69], ['11.18', '07:40', 128, 82, 72]
] as [string, string, number, number, number][])
  .map(([d, time, s, di, p]) => ({ d, time, s, di, p })).reverse();
export const GLU0: GluEntry[] = ([['11.12', '07:20', 131, '공복'], ['11.13', '13:10', 178, '식후 2시간'], ['11.14', '07:25', 122, '공복'], ['11.15', '07:30', 118, '공복'], ['11.16', '19:40', 156, '식후 2시간'], ['11.17', '07:15', 109, '공복'], ['11.18', '07:20', 112, '공복']
] as [string, string, number, string][])
  .map(([d, time, v, when]) => ({ d, time, v, when })).reverse();
const stOf = (n: Level, t: string): Badge => ({ c: LV[n].c, bg: LV[n].bg, t });
export const bpSt = (s: number, di: number): Badge => s >= 140 || di >= 90 ? stOf(4, '높음') : s >= 120 || di >= 80 ? stOf(3, '주의') : stOf(2, '정상');
export const gluSt = (v: number, w: string): Badge => { const [a, b] = w === '공복' ? [100, 126] : [140, 200]; return v >= b ? stOf(4, '높음') : v >= a ? stOf(3, '주의') : stOf(2, '정상'); };
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/** Today's date as "MM.DD", the format the notebook entries use. */
export const todayMD = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
