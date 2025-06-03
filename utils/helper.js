export function monthDateRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month   , 1, 0, 0, 0, 0);
  return { start, end };
}

/**
 * Clip a [from, to) interval so it lies within [start, end).
 * Returns null if no overlap.
 */
export function clipInterval(from, to, start, end) {
  const s = from   < start ? start : from;
  const e = to     > end   ? end   : to;
  return e > s ? { start: s, end: e } : null;
}

/**
 * Compute durations (in ms) in each status for one ticket,
 * considering only intervals that overlap [monthStart, monthEnd).
 */
export function durationsForTicket(statusHistory, monthStart, monthEnd) {
  const now = new Date();
  const durs = {};
  for (let i = 0; i < statusHistory.length; i++) {
    const { status, at } = statusHistory[i];
    const nextAt = (i + 1 < statusHistory.length) ? statusHistory[i+1].at : now;
    const clipped = clipInterval(at, nextAt, monthStart, monthEnd);
    if (!clipped) continue;
    const ms = clipped.end - clipped.start;
    durs[status] = (durs[status] || 0) + ms;
  }
  return durs;
}