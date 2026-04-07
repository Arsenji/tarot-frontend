/**
 * Next calendar midnight (00:00) in Europe/Moscow, as UTC milliseconds.
 * Moscow uses fixed UTC+3 (no DST).
 */
export function getNextMoscowMidnightMs(now: Date = new Date()): number {
  const tz = 'Europe/Moscow';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [y, m, d] = parts.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayMidnight = Date.parse(`${y}-${pad(m)}-${pad(d)}T00:00:00+03:00`);
  const tomorrowMidnight = todayMidnight + 24 * 60 * 60 * 1000;
  if (now.getTime() >= todayMidnight) {
    return tomorrowMidnight;
  }
  return todayMidnight;
}
