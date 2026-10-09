// ============================================================
// DATE RANGE — 'YYYY-MM-DD' query filters → a Mongo createdAt range.
//
// Days are cut in SERVER-LOCAL time (not UTC) because that is what
// the dashboard displays: "customers who joined on 2026-10-01" means
// the local calendar day, from local midnight to the next local
// midnight. Only `to` is exclusive, so `from = to = '2026-10-01'`
// selects exactly that one day. Passing day+1 to the Date constructor
// (instead of adding 24h) keeps the boundary correct across DST.
// ============================================================

const isDayString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const localMidnight = (value, dayOffset = 0) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day + dayOffset);
};

/**
 * Build a Mongo range object from optional `from` / `to` day strings.
 * Returns `null` when neither bound is present, so callers can skip
 * touching the filter entirely.
 */
export const localDayRange = ({ from, to } = {}) => {
  const hasFrom = Boolean(from) && isDayString(from);
  const hasTo = Boolean(to) && isDayString(to);
  if (!hasFrom && !hasTo) return null;

  const range = {};
  if (hasFrom) range.$gte = localMidnight(from);
  if (hasTo) range.$lt = localMidnight(to, 1);
  return range;
};

export default localDayRange;
