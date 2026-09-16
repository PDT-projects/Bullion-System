// Global Currency — how money is DISPLAYED across the whole app.
//
// IMPORTANT — what this is and isn't:
//   - Every amount is stored in Firestore in AED and NEVER changes there —
//     no product, invoice, transaction, or shipment document is ever
//     touched by this feature. Storage and every calculation stay AED.
//   - What DOES change: on screen (and in PDF/Excel exports), only the
//     currency SYMBOL/NAME printed next to a number changes — e.g.
//     selecting Canadian Dollar shows "CA$ 5,000" for a product that's
//     "AED 5,000" in the database. The number itself is never converted —
//     there is no exchange rate involved anywhere in this feature.
//   - It is global: one setting, one Firestore doc, read by every module.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';

export interface GlobalCurrencySetting {
  code: string;    // e.g. 'AED', 'CAD' — which currency's symbol/name to show
  symbol: string;   // what's actually printed, e.g. 'AED', 'CA$', 'Rs'
  name: string;     // display name, e.g. 'Canadian Dollar'
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_GLOBAL_CURRENCY: GlobalCurrencySetting = {
  code: 'AED',
  symbol: 'AED',
  name: 'UAE Dirham',
};

const DOC_PATH = { collection: 'appConfig', id: 'globalCurrency' };

// ── In-memory cache ──────────────────────────────────────────────────────
// formatCurrency() below is called synchronously, all over the app, often
// outside of any React component (plain service files). It can't `await`
// Firestore on every call, so we keep the current value in memory and
// refresh it (a) once on app boot and (b) whenever it's changed.
let current: GlobalCurrencySetting = { ...DEFAULT_GLOBAL_CURRENCY };
let loaded = false;

type Listener = (c: GlobalCurrencySetting) => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l(current));
}

/** Call once, early (e.g. in App.tsx / your root provider), and await it
 *  before rendering — this is what loads the real saved value out of
 *  Firestore instead of the AED default. Safe to call again later too. */
export async function loadGlobalCurrency(): Promise<GlobalCurrencySetting> {
  try {
    const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<GlobalCurrencySetting>;
      current = {
        code: data.code || DEFAULT_GLOBAL_CURRENCY.code,
        symbol: data.symbol || DEFAULT_GLOBAL_CURRENCY.symbol,
        name: data.name || DEFAULT_GLOBAL_CURRENCY.name,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
    }
  } catch (err) {
    console.warn('[globalCurrency] failed to load, using default:', err);
  } finally {
    loaded = true;
    notify();
  }
  return current;
}

/** Admin action: change which currency's symbol/name is shown everywhere.
 *  Only writes this small settings doc — never touches any
 *  product/invoice/shipment amount anywhere, and never converts anything. */
export async function setGlobalCurrency(next: { code: string; symbol: string; name: string }, updatedBy?: string): Promise<void> {
  const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
  const value: GlobalCurrencySetting = {
    code: next.code.trim(),
    symbol: next.symbol.trim(),
    name: next.name.trim(),
    updatedAt: new Date().toISOString(),
    ...(updatedBy ? { updatedBy } : {}),
  };
  await setDoc(ref, value, { merge: true });
  current = value;
  notify();
}

/** Read the current setting synchronously (from cache). */
export function getGlobalCurrency(): GlobalCurrencySetting {
  return current;
}

export function isGlobalCurrencyLoaded(): boolean {
  return loaded;
}

/** Subscribe to changes — used by the useGlobalCurrency() hook below so
 *  components re-render the instant Admin clicks Apply, no reload needed. */
export function subscribeToGlobalCurrency(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── The one formatCurrency() every module should use ────────────────────
// Takes an amount that is ALWAYS AED (that's what's stored/calculated
// everywhere) and formats it with the currently-selected display symbol.
// The NUMBER is never converted or changed — this only changes what
// currency symbol is printed next to it.
export function formatGlobalCurrency(amountAed: number, opts?: { minimumFractionDigits?: number }): string {
  const n = Number(amountAed) || 0;
  const frac = opts?.minimumFractionDigits ?? (current.code === 'AED' || current.code === 'PKR' ? 0 : 2);
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: frac,
      maximumFractionDigits: frac,
    }).format(n);
    return `${current.symbol} ${formatted}`;
  } catch {
    return `${current.symbol} ${n.toFixed(frac)}`;
  }
}

/** For places that just need the symbol/name (e.g. table headers,
 *  "Amount (AED)" style labels, PDF footers). */
export function getGlobalCurrencySymbol(): string {
  return current.symbol;
}
export function getGlobalCurrencyName(): string {
  return current.name;
}
