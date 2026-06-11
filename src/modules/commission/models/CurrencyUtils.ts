/** 1 PKR = PKR_TO_AED AED  (update this constant whenever the rate changes) */
export const PKR_TO_AED = 0.013;

/** Convert a PKR amount to AED */
export function pkrToAed(pkr: number): number {
  return pkr * PKR_TO_AED;
}

/** Format an amount (stored in PKR) as "AED X,XXX.XX" */
export function formatAED(pkr: number): string {
  const aed = pkrToAed(pkr);
  return new Intl.NumberFormat('en-AE', {
    style:                 'currency',
    currency:              'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aed);
}

/** Format an amount as "PKR X,XX,XXX" */
export function formatPKR(pkr: number): string {
  return new Intl.NumberFormat('en-PK', {
    style:                 'currency',
    currency:              'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pkr);
}

/** AED first, PKR second: "AED 1,234.56  /  PKR 1,50,000" */
export function formatDual(pkr: number): string {
  return `${formatAED(pkr)}  /  ${formatPKR(pkr)}`;
}