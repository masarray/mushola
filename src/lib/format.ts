export function safeNumber(value: unknown): number {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

export function formatCurrency(value: unknown): string {
  return `Rp ${safeNumber(value).toLocaleString('id-ID')}`;
}

export function getBalanceTone(value: unknown): string {
  return safeNumber(value) > 0 ? 'Stabil' : 'Awal';
}

export function getProgressColor(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 75) return 'green';
  if (pct >= 40) return 'yellow';
  return 'red';
}
