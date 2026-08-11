/**
 * Money utilities — all amounts are stored as paise (integer).
 * Display uses Indian number formatting (₹ lakhs/crores).
 */

/** Format paise → "₹1,23,456" */
export function formatMoney(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Format paise → "₹1.23 L" (lakhs) or "₹1.23 Cr" for large values */
export function formatMoneyCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) {
    return `₹${(rupees / 10_000_000).toFixed(2)} Cr`;
  }
  if (rupees >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(2)} L`;
  }
  return formatMoney(paise);
}

/** Rupees string → paise integer */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Paise → plain rupee number */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}
