// Korean public holidays and traditional days, worked out on the phone with no network.
// Lunar dates (설날, 정월대보름, 부처님오신날, 단오, 추석) come from a table made with the
// korean-lunar-calendar package (KASI data) for 2000–2060: per year, the solar MMDD of
// lunar 1/1, 1/15, 4/8, 5/5 and 8/15. 대체공휴일 follow the rules in force each year
// (설·추석·어린이날 from 2014; 3·1절·광복절·개천절·한글날 from 2021; 부처님오신날·성탄절 from 2023;
// 제헌절 is a public holiday again from 2026). Election days and one-off 임시공휴일 are listed by hand.

const LUNAR = '0205 0219 0511 0606 0912|0124 0207 0501 0625 1001|0212 0226 0519 0615 0921|0201 0215 0508 0604 0911|0122 0205 0526 0622 0928|0209 0223 0515 0611 0918|0129 0212 0505 0531 1006|0218 0304 0524 0619 0925|0207 0221 0512 0608 0914|0126 0209 0502 0528 1003|0214 0228 0521 0616 0922|0203 0217 0510 0606 0912|0123 0206 0528 0624 0930|0210 0224 0517 0613 0919|0131 0214 0506 0602 0908|0219 0305 0525 0620 0927|0208 0222 0514 0609 0915|0128 0211 0503 0530 1004|0216 0302 0522 0618 0924|0205 0219 0512 0607 0913|0125 0208 0430 0625 1001|0212 0226 0519 0614 0921|0201 0215 0508 0603 0910|0122 0205 0527 0622 0929|0210 0224 0515 0610 0917|0129 0212 0505 0531 1006|0217 0303 0524 0619 0925|0207 0221 0513 0609 0915|0127 0210 0502 0528 1003|0213 0227 0520 0616 0922|0203 0217 0509 0605 0912|0123 0206 0528 0624 1001|0211 0225 0516 0612 0919|0131 0214 0506 0601 0908|0219 0305 0525 0620 0927|0208 0222 0515 0610 0916|0128 0211 0503 0530 1004|0215 0301 0522 0618 0924|0204 0218 0511 0607 0913|0124 0207 0430 0527 1002|0212 0226 0518 0614 0921|0201 0215 0507 0603 0910|0122 0205 0526 0622 0928|0210 0224 0516 0611 0917|0130 0213 0505 0531 1005|0217 0303 0524 0619 0925|0206 0220 0513 0609 0915|0126 0209 0502 0529 1004|0214 0228 0520 0615 0922|0202 0216 0509 0604 0911|0123 0206 0528 0623 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930|0930 0930 0930 0930 0930';
const FIRST = 2000;
export const HOLIDAY_YEARS = [FIRST, FIRST + LUNAR.split('|').length - 1] as const;

/** red = a day off (빨간 날); otherwise a traditional day shown in small text only. */
export type Holiday = { name: string; red: boolean };

/** One-off days off (elections, 임시공휴일) announced by the government. */
const EXTRA: Record<string, string> = {
  '2002-06-13': '지방선거', '2002-07-01': '임시공휴일', '2002-12-19': '대통령선거', '2004-04-15': '국회의원선거',
  '2006-05-31': '지방선거', '2007-12-19': '대통령선거', '2008-04-09': '국회의원선거', '2010-06-02': '지방선거',
  '2012-04-11': '국회의원선거', '2012-12-19': '대통령선거', '2014-06-04': '지방선거', '2015-08-14': '임시공휴일',
  '2016-04-13': '국회의원선거', '2016-05-06': '임시공휴일', '2017-05-09': '대통령선거', '2017-10-02': '임시공휴일',
  '2018-06-13': '지방선거', '2020-04-15': '국회의원선거', '2020-08-17': '임시공휴일', '2022-03-09': '대통령선거',
  '2022-06-01': '지방선거', '2023-10-02': '임시공휴일', '2024-04-10': '국회의원선거', '2024-10-01': '임시공휴일',
  '2025-01-27': '임시공휴일', '2025-06-03': '대통령선거', '2026-06-03': '지방선거', '2028-04-12': '국회의원선거',
};

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const plus = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const cache = new Map<number, Record<string, Holiday[]>>();

/** All holidays of a year, keyed YYYY-MM-DD (a day can hold more than one, e.g. 개천절 + 추석). */
export function holidaysOf(y: number): Record<string, Holiday[]> {
  const hit = cache.get(y);
  if (hit) return hit;
  const out: Record<string, Holiday[]> = {};
  const add = (d: Date, name: string, red = true) => { (out[key(d)] ||= []).push({ name, red }); };
  const isRed = (d: Date) => (out[key(d)] || []).some(h => h.red);
  const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  const fixed: [number, number, string, number][] = [
    // month, day, name, first year with a 대체공휴일 (0 = never)
    [1, 1, '신정', 0], [3, 1, '삼일절', 2021], [5, 5, '어린이날', 2014], [6, 6, '현충일', 0],
    [8, 15, '광복절', 2021], [10, 3, '개천절', 2021], [10, 9, '한글날', 2021], [12, 25, '성탄절', 2023],
  ];
  if (y >= 2026) fixed.push([7, 17, '제헌절', 2026]);
  if (y <= 2007) fixed.push([7, 17, '제헌절', 0]);
  for (const [m, d, n] of fixed) if (!(m === 10 && d === 9 && y >= 1991 && y <= 2012)) add(at(y, m, d), n);

  const row = LUNAR.split('|')[y - FIRST];
  const lunar: Record<string, Date> = {};
  if (row) {
    const [seol, bo, budda, dano, chu] = row.split(' ').map(s => at(y, +s.slice(0, 2), +s.slice(2)));
    Object.assign(lunar, { seol, budda, chu });
    add(plus(seol, -1), '설날 연휴'); add(seol, '설날'); add(plus(seol, 1), '설날 연휴');
    add(bo, '정월대보름', false);
    add(budda, '부처님오신날');
    add(dano, '단오', false);
    add(plus(chu, -1), '추석 연휴'); add(chu, '추석'); add(plus(chu, 1), '추석 연휴');
  }
  for (const [k, n] of Object.entries(EXTRA)) if (k.startsWith(y + '-')) (out[k] ||= []).push({ name: n, red: true });

  // 대체공휴일: the first following day that is not a weekend and not already a day off.
  const subs: Date[] = [];
  const next = (d: Date) => { let x = plus(d, 1); while (weekend(x) || isRed(x) || subs.some(s => key(s) === key(x))) x = plus(x, 1); return x; };
  const clash = (d: Date) => (out[key(d)] || []).filter(h => h.red).length > 1;
  // One day lost gives one substitute, even when three holidays fall on it.
  const done = new Set<string>();
  const give = (lost: Date[], after: Date) => { if (lost.some(d => done.has(key(d)))) return; lost.forEach(d => done.add(key(d))); subs.push(next(after)); };
  // 설·추석: a Sunday or another holiday inside the three days (Saturday does not count).
  if (y >= 2014) for (const c of [lunar.seol, lunar.chu]) if (c) {
    const days = [plus(c, -1), c, plus(c, 1)];
    if (days.some(d => d.getDay() === 0 || clash(d))) give(days, days[2]);
  }
  for (const [m, d, , from] of fixed) {
    if (!from || y < from) continue;
    const day = at(y, m, d);
    if (weekend(day) || clash(day)) give([day], day);
  }
  if (y >= 2023 && lunar.budda && (weekend(lunar.budda) || clash(lunar.budda))) give([lunar.budda], lunar.budda);
  for (const s of subs) add(s, '대체공휴일');

  cache.set(y, out);
  return out;
}

export const holidaysOn = (dayKey: string): Holiday[] => holidaysOf(+dayKey.slice(0, 4))[dayKey] || [];
