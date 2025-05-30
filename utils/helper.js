export function monthDateRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month   , 1, 0, 0, 0, 0);
  return { start, end };
}