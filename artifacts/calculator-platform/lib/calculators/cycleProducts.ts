export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return 'Invalid date';
  d.setUTCDate(d.getUTCDate() + (Number.isFinite(days) ? days : 0));
  return d.toISOString().slice(0, 10);
}
export function estimateCycleDate(iso: string, cycleLength: number, kind: 'due-date' | 'ovulation' | 'period'): string {
  const c = Math.max(1, Number.isFinite(cycleLength) ? cycleLength : 1);
  return kind === 'due-date' ? addDays(iso, 280 + (c - 28)) : kind === 'ovulation' ? addDays(iso, Math.max(0, c - 14)) : addDays(iso, c);
}
