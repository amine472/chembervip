export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseDateISO: string, days: number): string {
  const date = parseLocalDate(baseDateISO);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateISO: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/**
 * Calculates number of stay days from entryDate to endDate (or today if still active).
 * Minimum 1 day on the arrival day so newly checked-in residents show 1 jour.
 */
export function calculateStayDays(entryDateISO: string, exitDateISO?: string | null): number {
  if (!entryDateISO) return 0;
  const start = parseLocalDate(entryDateISO);
  const end = exitDateISO ? parseLocalDate(exitDateISO) : parseLocalDate(getTodayISO());
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Calculates days overlapping a custom [periodStart, periodEnd] range.
 */
export function calculateStayDaysInPeriod(
  entryDateISO: string,
  exitDateISO: string | null,
  periodStartISO: string,
  periodEndISO: string
): number {
  const start = parseLocalDate(entryDateISO).getTime();
  const end = parseLocalDate(exitDateISO || getTodayISO()).getTime();
  const pStart = parseLocalDate(periodStartISO).getTime();
  const pEnd = parseLocalDate(periodEndISO).getTime();

  const overlapStart = Math.max(start, pStart);
  const overlapEnd = Math.min(end, pEnd);
  if (overlapEnd < overlapStart) return 0;
  return Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
}

export function daysRemainingUntil(targetDateISO: string): number {
  if (!targetDateISO) return 999;
  const today = parseLocalDate(getTodayISO()).getTime();
  const target = parseLocalDate(targetDateISO).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function formatDateFR(dateISO: string | null | undefined): string {
  if (!dateISO) return '—';
  if (dateISO.includes('T')) {
    const dt = new Date(dateISO);
    if (isNaN(dt.getTime())) return dateISO;
    return dt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const dt = parseLocalDate(dateISO);
  return dt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeFR(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const dt = new Date(isoString);
  if (isNaN(dt.getTime())) return isoString;
  return dt.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatFullDateFR(date: Date): string {
  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatClockFR(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function normalizeName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
