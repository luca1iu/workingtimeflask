import Holidays from 'date-holidays';

function extractRegionCode(regionStr: string): string {
  if (!regionStr) return '';
  return regionStr.split('-')[0].trim();
}

export function getHolidaysInMonth(country: string, state: string, year: number, month: number) {
  const hd = new Holidays(country, extractRegionCode(state));
  const all = hd.getHolidays(year);
  return all.filter(h => new Date(h.date).getMonth() + 1 === month);
}

export function getWorkingDaysInMonth(country: string, state: string, year: number, month: number) {
  const hd = new Holidays(country, extractRegionCode(state));
  console.log(country, state, year, month);
  const publicHolidays = hd.getHolidays(year)
    .filter(h => h.type === 'public' && new Date(h.date).getMonth() + 1 === month)
    .map(h => h.date.slice(0, 10)); // 'YYYY-MM-DD'
  const days: Date[] = [];
  let d = new Date(year, month - 1, 1);
  do {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dateStr = d.toISOString().slice(0, 10);
    const isHoliday = publicHolidays.includes(dateStr);
    if (!isWeekend && !isHoliday) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  } while (d.getMonth() + 1 === month);
  return days;
}
