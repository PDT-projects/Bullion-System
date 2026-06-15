// viewModels/usePayableToFuturistic.ts
import { useState, useEffect, useCallback } from 'react';
import type { CurrencyAmounts } from '../models/payableToFuturistic';
import {
  fetchPayablesSummaryByInvoice,
  type InvoicePayableSummary,
  type DerivedPayable,
} from '../models/payableToFuturisticService';

export type { InvoicePayableSummary, DerivedPayable };

export interface UsePayableToFuturisticReturn {
  summaries: InvoicePayableSummary[];
  totals: CurrencyAmounts;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePayableToFuturistic(): UsePayableToFuturisticReturn {
  const [summaries, setSummaries] = useState<InvoicePayableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPayablesSummaryByInvoice();
      setSummaries(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payables from Futuristic products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Grand totals across all invoices
  const totals: CurrencyAmounts = summaries.reduce(
    (acc, s) => ({
      aed: acc.aed + s.totalAmounts.aed,
      pkr: acc.pkr + s.totalAmounts.pkr,
      sar: acc.sar + s.totalAmounts.sar,
      usd: acc.usd + s.totalAmounts.usd,
    }),
    { aed: 0, pkr: 0, sar: 0, usd: 0 }
  );

  return { summaries, totals, loading, error, refresh: load };
}