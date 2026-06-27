// Inventory Module - Shared Currency Hook
// useInventoryCurrency
//
// Mirrors the Dashboard's currency pattern:
//   - Fetches live rates from open.er-api.com (USD base)
//   - Stores base amounts in PKR internally
//   - Converts PKR → any target currency on demand
//   - Exposes a CurrencyDropdown-compatible state: primaryCurrency + extraCurrencies
//   - Also provides a per-price "input currency" so users can type a price
//     in USD/AED/etc. and have it auto-converted to PKR for storage

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'SAR' | 'CAD';

export interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  flag: string;
  locale: string;
  decimals: number;
  symbol: string;
}

export type RateMap = Record<CurrencyCode, number>;

// ── Currency metadata ─────────────────────────────────────────────────────────

export const INVENTORY_CURRENCIES: CurrencyMeta[] = [
  { code: 'PKR', label: 'Pakistani Rupee',  flag: '🇵🇰', locale: 'en-PK', decimals: 0, symbol: '₨'  },
  { code: 'USD', label: 'US Dollar',        flag: '🇺🇸', locale: 'en-US', decimals: 2, symbol: '$'  },
  { code: 'AED', label: 'UAE Dirham',       flag: '🇦🇪', locale: 'en-AE', decimals: 2, symbol: 'د.إ' },
  { code: 'SAR', label: 'Saudi Riyal',      flag: '🇸🇦', locale: 'en-US', decimals: 2, symbol: '﷼'  },
  { code: 'CAD', label: 'Canadian Dollar',  flag: '🇨🇦', locale: 'en-CA', decimals: 2, symbol: 'C$' },
];

// Fallback rates (USD as base, approximate)
export const FALLBACK_RATES: RateMap = {
  PKR: 278.50,
  USD: 1.00,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.37,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return INVENTORY_CURRENCIES.find(c => c.code === code) ?? INVENTORY_CURRENCIES[0];
}

/**
 * AED is the canonical stored unit. No conversion is applied — the amount is
 * returned as-is. (Kept for backwards compatibility with existing callers.)
 */
export function convertFromPKR(amount: number, _target: CurrencyCode, _rates: RateMap): number {
  return amount;
}

/**
 * AED is the canonical stored unit. No conversion is applied — the amount is
 * stored exactly as typed. (Kept for backwards compatibility with existing callers.)
 */
export function convertToPKR(amount: number, _source: CurrencyCode, _rates: RateMap): number {
  return amount;
}

/**
 * Format an AED-stored base amount. AED is canonical, so the amount is shown
 * as AED with no conversion regardless of the requested display currency.
 */
export function formatInCurrency(amount: number, _currency: CurrencyCode, _rates: RateMap): string {
  const meta = getCurrencyMeta('AED');
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimals)}`;
  }
}

/**
 * Format a raw number in a given currency (no conversion, already in that currency).
 */
export function formatRaw(amount: number, currency: CurrencyCode): string {
  const meta = getCurrencyMeta(currency);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimals)}`;
  }
}

// ── Hook: useCurrencyRates ────────────────────────────────────────────────────

export interface UseCurrencyRatesReturn {
  rates: RateMap;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useCurrencyRates(): UseCurrencyRatesReturn {
  const [rates, setRates]             = useState<RateMap>(FALLBACK_RATES);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success') {
        setRates({
          PKR: data.rates.PKR,
          USD: 1,
          AED: data.rates.AED,
          SAR: data.rates.SAR,
          CAD: data.rates.CAD,
        });
        setLastUpdated(new Date());
        setError(false);
      } else {
        throw new Error('Bad response');
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const id = setInterval(fetchRates, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(id);
  }, [fetchRates]);

  return { rates, loading, error, lastUpdated, refresh: fetchRates };
}

// ── Hook: useInventoryCurrency ────────────────────────────────────────────────
// Main hook — drop this into any inventory view that needs currency display

export interface UseInventoryCurrencyReturn extends UseCurrencyRatesReturn {
  primaryCurrency: CurrencyCode;
  extraCurrencies: CurrencyCode[];
  setPrimaryCurrency: (c: CurrencyCode) => void;
  setExtraCurrencies: (c: CurrencyCode[]) => void;
  /** Format a PKR-stored amount in the primary display currency */
  formatPrice: (pkrAmount: number) => string;
  /** Format a PKR-stored amount in any specific currency */
  formatInCurrency: (pkrAmount: number, currency: CurrencyCode) => string;
  /** Convert typed input (in inputCurrency) → PKR for storage */
  toPKR: (amount: number, source: CurrencyCode) => number;
  /** Convert PKR → inputCurrency for displaying in price inputs */
  fromPKR: (pkrAmount: number, target: CurrencyCode) => number;
}

export function useInventoryCurrency(): UseInventoryCurrencyReturn {
  const rateState = useCurrencyRates();
  const [primaryCurrency, setPrimary] = useState<CurrencyCode>('AED');
  const [extraCurrencies, setExtras]  = useState<CurrencyCode[]>([]);

  const setPrimaryCurrency = useCallback((c: CurrencyCode) => {
    setPrimary(c);
    setExtras(prev => prev.filter(x => x !== c));
  }, []);

  const formatPrice = useCallback((pkrAmount: number) =>
    formatInCurrency(pkrAmount, primaryCurrency, rateState.rates),
  [primaryCurrency, rateState.rates]);

  const formatInCurrencyBound = useCallback((pkrAmount: number, currency: CurrencyCode) =>
    formatInCurrency(pkrAmount, currency, rateState.rates),
  [rateState.rates]);

  const toPKR = useCallback((amount: number, source: CurrencyCode) =>
    convertToPKR(amount, source, rateState.rates),
  [rateState.rates]);

  const fromPKR = useCallback((pkrAmount: number, target: CurrencyCode) =>
    convertFromPKR(pkrAmount, target, rateState.rates),
  [rateState.rates]);

  return {
    ...rateState,
    primaryCurrency,
    extraCurrencies,
    setPrimaryCurrency,
    setExtraCurrencies: setExtras,
    formatPrice,
    formatInCurrency: formatInCurrencyBound,
    toPKR,
    fromPKR,
  };
}