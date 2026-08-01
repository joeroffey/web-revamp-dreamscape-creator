export function formatGBP(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format((pence || 0) / 100);
}

export function formatDateTime(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-GB');
}
