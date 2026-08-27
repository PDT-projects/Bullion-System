// Amounts in this app are stored in AED — no PKR conversion needed.
// These functions now treat all inputs as AED directly.

export const PKR_TO_AED = 1; // kept for any remaining references; no-op multiplier

/** No-op: amount is already AED */
export function pkrToAed(aed: number): number {
  return aed;
}

/** Format an AED amount */
export function formatAED(aed: number): string {
  return new Intl.NumberFormat('en-AE', {
    style:                 'currency',
    currency:              'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aed);
}

/** Format an amount as AED (previously PKR — kept for compatibility) */
export function formatPKR(aed: number): string {
  return new Intl.NumberFormat('en-AE', {
    style:                 'currency',
    currency:              'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(aed);
}

/** AED display (previously dual PKR/AED — now just AED) */
export function formatDual(aed: number): string {
  return formatAED(aed);
}