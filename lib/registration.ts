/** Accept common Taiwan mobile number formatting; this does not verify SIM activity. */
export function normalizeTaiwanPhone(value: string): string | null {
  if (typeof value !== 'string' || value.length > 32) return null;
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (/^09\d{8}$/.test(compact)) return `+886${compact.slice(1)}`;
  if (/^\+?8869\d{8}$/.test(compact)) return `+${compact.replace(/^\+/, '')}`;
  return null;
}

/** A free-text size, intentionally not restricted to a predefined catalogue. */
export function normalizeAlmamaterSize(value: string): string | null {
  if (typeof value !== 'string' || /[\r\n\u0000-\u001f\u007f]/.test(value)) return null;
  const size = value.trim();
  return size.length > 0 && size.length <= 30 ? size : null;
}
