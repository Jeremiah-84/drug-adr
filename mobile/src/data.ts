// Display constants from the Claude Design prototypes (design/MediScan Classical.dc.html; first version design/MediScan Mobile.dc.html).
// Drug facts come from docs/data at run time (see real.ts); nothing here is sample patient data.

export type Level = 1 | 2 | 3 | 4;
export type Badge = { t: string; c: string; bd: string };
export type LevelInfo = Badge & { d: string };
export const LV: Record<Level, LevelInfo> = {
  4: { t: '높음', c: 'var(--color-accent-800)', bd: 'var(--color-accent)', d: '흔하게' },
  3: { t: '가능성 있음', c: 'var(--color-accent-700)', bd: 'var(--color-accent-300)', d: '때때로·빈도 미기재' },
  2: { t: '낮음', c: 'var(--color-neutral-700)', bd: 'var(--color-neutral-400)', d: '드물게' },
  1: { t: '매우 드묾', c: 'var(--color-neutral-600)', bd: 'var(--color-neutral-300)', d: '매우 드물게' }
};
export type Tag = '금기' | '용량' | '주의' | '불필요';
export const TAG: Record<Tag, LevelInfo> = { '금기': LV[4], '용량': LV[3], '주의': LV[2], '불필요': LV[1] };
export type SlotKey = 'm' | 'l' | 'e' | 'n';
export const SLOT_KEYS: SlotKey[] = ['m', 'l', 'e', 'n'];
export const SLOT_LABEL: Record<SlotKey, string> = { m: '아침 식후', l: '점심 식후', e: '저녁 식후', n: '취침 전' };
/** Short names for the tap-to-choose chips. */
export const SLOT_SHORT: Record<SlotKey, string> = { m: '아침', l: '점심', e: '저녁', n: '자기 전' };
export const SLOT_TIME: Record<SlotKey, string> = { m: '08:00', l: '12:30', e: '19:00', n: '22:00' };

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
const stOf = (n: Level, t: string): Badge => ({ c: LV[n].c, bd: LV[n].bd, t });
export const bpSt = (s: number, di: number): Badge => s >= 140 || di >= 90 ? stOf(4, '높음') : s >= 120 || di >= 80 ? stOf(3, '주의') : stOf(2, '정상');
export const gluSt = (v: number, w: string): Badge => { const [a, b] = w === '공복' ? [100, 126] : [140, 200]; return v >= b ? stOf(4, '높음') : v >= a ? stOf(3, '주의') : stOf(2, '정상'); };
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/** Today's date as "MM.DD", the format the notebook entries use. */
export const todayMD = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
