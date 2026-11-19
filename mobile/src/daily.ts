// Daily page content from the MediScan Classical design: one drug story and one quiz a day.
// Stories/quizzes about a medicine the person has saved come first; otherwise all rotate.
// NOTE: story texts were written in the design tool and still need a source check before wide release;
// quiz explanations cite the MFDS package insert sections they come from.
import { ingName } from './real';
import type { Member } from './state';

/** `ing` = Korean ingredient name, used to put a story about the person's own medicine first. */
export interface Story { ing: string; en: string; title: string; lead: string; body: string; note: string }
export const STORIES: Story[] = [
  { ing: '메트포르민', en: 'DIABEX · METFORMIN', title: '라일락 꽃에서 온 당뇨약',
    lead: '다이아벡스의 성분 메트포르민은 중세 유럽에서 소변이 잦은 증상에 쓰던 약초 갈레가, 흔히 프렌치 라일락이라 불리는 식물에서 출발했습니다.',
    body: '1920년대에 이 식물에 든 구아니딘 성분이 혈당을 낮춘다는 사실이 알려졌고, 독성을 줄인 형태가 1957년 프랑스에서 처음 처방되었습니다. 지금은 세계에서 가장 널리 쓰이는 당뇨약 가운데 하나입니다.',
    note: '내가 먹는 약 · 1일 2회 식후' },
  { ing: '로수바스타틴', en: 'CRESTOR · ROSUVASTATIN', title: '곰팡이 6천 종을 뒤져 찾은 약',
    lead: '스타틴 계열의 시작은 1970년대 일본의 엔도 아키라 박사가 수천 종의 곰팡이를 하나씩 조사해 찾아낸 물질, 콤팩틴이었습니다.',
    body: '곰팡이가 경쟁 미생물을 막으려고 만드는 물질이 사람의 콜레스테롤 합성도 막는다는 발견이었습니다. 크레스토의 로수바스타틴은 그 계보를 이어 일본에서 개발된 약입니다.',
    note: '내가 먹는 약 · 1일 1회 취침 전' },
  { ing: '로살탄', en: 'AMOSARTAN · LOSARTAN', title: '두 개의 열쇠를 한 알에',
    lead: '아모잘탄에는 혈관을 넓히는 암로디핀과 혈압을 올리는 호르몬의 길목을 막는 로살탄, 서로 다른 방식의 두 약이 함께 들어 있습니다.',
    body: '로살탄은 1995년 미국에서 승인된 첫 안지오텐신 수용체 차단제입니다. 두 성분을 한 알로 합친 아모잘탄은 국내 제약사가 만든 복합제로, 하루 한 번 복용으로 두 약을 함께 먹게 해 줍니다.',
    note: '내가 먹는 약 · 1일 1회 아침' },
  { ing: '프레가발린', en: 'LYRICA · PREGABALIN', title: '대학 연구실에서 태어난 약',
    lead: '리리카의 프레가발린은 1980년대 후반 미국 노스웨스턴 대학의 한 화학자 연구실에서 뇌전증 치료를 목표로 처음 합성되었습니다.',
    body: '연구 과정에서 손상된 신경이 보내는 통증 신호를 줄이는 효과가 확인되면서 신경병증 통증 치료제로 자리 잡았습니다. 어지러움과 졸림이 흔한 것도 신경에 작용하는 약이기 때문입니다.',
    note: '내가 먹는 약 · 1일 2회' },
];

export interface Quiz { ing: string; q: string; o: string[]; a: number; why: string; src: string }
export const QUIZZES: Quiz[] = [
  { ing: '메트포르민', q: '다이아벡스(메트포르민)를 먹는 중에 조영제를 쓰는 CT 검사를 받게 되었습니다. 어떻게 해야 할까요?', o: ['평소대로 복용한다', '검사 전후로 잠시 중단한다', '용량을 두 배로 늘린다', '식전 복용으로 바꾼다'], a: 1,
    why: '조영제는 일시적으로 콩팥 기능을 떨어뜨릴 수 있어 메트포르민이 몸에 쌓이면 젖산산증 위험이 커집니다. 검사 전후 언제 다시 먹을지는 담당 의사의 안내를 따르세요.', src: '다이아벡스정 첨부문서 · 사용상 주의사항' },
  { ing: '프레가발린', q: '리리카(프레가발린) 첨부문서에서 1% 이상으로 흔하게 보고된 이상반응은 무엇일까요?', o: ['기침', '어지러움과 졸림', '탈모', '잇몸 출혈'], a: 1,
    why: '어지러움과 졸림은 복용 초기나 용량을 올린 직후에 특히 흔합니다. 운전이나 기계 조작은 피하고, 계속되면 처방의와 용량을 상의하세요.', src: '리리카캡슐 첨부문서 · 이상반응' },
  { ing: '로수바스타틴', q: '크레스토(로수바스타틴)를 먹는 중 이런 증상이 생기면 바로 의사에게 알려야 합니다. 무엇일까요?', o: ['가벼운 졸음', '이유를 알 수 없는 근육통', '입 마름', '손톱이 잘 부러짐'], a: 1,
    why: '설명되지 않는 근육통, 압통, 힘 빠짐은 드물게 생기는 근육 손상의 신호일 수 있습니다. 증상이 있으면 복용을 이어가기 전에 먼저 상담하세요.', src: '크레스토정 첨부문서 · 사용상 주의사항' },
  { ing: '암로디핀', q: '아모잘탄 복용 중 가장 흔하게 나타나는 이상반응은 무엇일까요?', o: ['발목이 붓는다', '피부가 노래진다', '머리카락이 빠진다', '귀가 울린다'], a: 0,
    why: '암로디핀 성분으로 발목이나 다리가 붓는 말초부종이 가장 흔하며, 용량이 높을수록 잘 생깁니다. 붓기가 심하면 처방의와 상의하세요.', src: '아모잘탄정 첨부문서 · 이상반응' },
];


const dayNo = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);

function pickFor<T extends { ing: string }>(list: T[], me: Member, offset: number): { item: T; mine: boolean } {
  const names = me.meds.flatMap(m => m.ids.map(id => ingName(id, 'ko')));
  const mine = list.filter(x => names.some(n => n.includes(x.ing)));
  const pool = mine.length ? mine : list;
  return { item: pool[(dayNo() + offset) % pool.length], mine: mine.length > 0 };
}
export const storyOf = (me: Member, offset = 0) => pickFor(STORIES, me, offset);
export const quizOf = (me: Member, offset = 0) => pickFor(QUIZZES, me, offset);
/** Page number shown on the daily page: day of the year. */
export const pageNo = () => { const d = new Date(); return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000); };
