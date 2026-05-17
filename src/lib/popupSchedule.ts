// Helper to check if a popup is within its active schedule window.
// start/end are strings from <input type="datetime-local"> (e.g. "2026-05-17T10:00") or empty.
export const isWithinSchedule = (start?: string | null, end?: string | null): boolean => {
  const now = Date.now();
  if (start && start.trim() !== '') {
    const s = new Date(start).getTime();
    if (!isNaN(s) && now < s) return false;
  }
  if (end && end.trim() !== '') {
    const e = new Date(end).getTime();
    if (!isNaN(e) && now > e) return false;
  }
  return true;
};

export const toNumber = (v: string | undefined | null, fallback: number): number => {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};
