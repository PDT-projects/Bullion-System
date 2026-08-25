// Commission Slab List ViewModel — fetches from Firestore, exposes multi-currency helpers

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { CommissionSlab, CommissionSlabFilter } from '../models/types';
import { filterCommissionSlabs } from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import {
  COMMISSION_CURRENCIES,
  CommissionCurrency,
  CURRENCY_RATE_FALLBACK,
  fetchCommissionCurrencyRates,
  convertCommissionCurrency,
} from './useCommissionSlabFormViewModel';

export const LIST_DISPLAY_CURRENCIES: CommissionCurrency[] = ['AED'];

export function formatCommissionCurrency(amount: number, currency: CommissionCurrency): string {
  const def = COMMISSION_CURRENCIES.find(c => c.code === currency) || { symbol: 'د.إ' };
  const sym = def.symbol ?? 'د.إ';
  // Use UAE locale for AED formatting
  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000)     return `${sym}${(amount / 1_000).toFixed(1)}K`;
  return `${sym}${amount.toLocaleString('en-AE', { maximumFractionDigits: 2 })}`;
}

interface UseCommissionSlabListViewModelReturn {
  slabs: CommissionSlab[];
  filteredSlabs: CommissionSlab[];
  isLoading: boolean;
  filter: CommissionSlabFilter;
  setFilter: (filter: CommissionSlabFilter) => void;
  clearFilters: () => void;
  refreshSlabs: () => void;
  handleDelete: (id: string) => void;
  totalSlabs: number;
  getSalespersonName: (salespersonId: string, employees: any[]) => string;
  formatCurrency: (amount: number) => string;
  currencyRates: Record<CommissionCurrency, number>;
  isFetchingRates: boolean;
  lastRatesFetchAt: Date | null;
  displayCurrencies: CommissionCurrency[];
  setDisplayCurrencies: (currencies: CommissionCurrency[]) => void;
  convertForDisplay: (pkrAmount: number, toCurrency: CommissionCurrency) => number;
  formatInCurrency: (pkrAmount: number, currency: CommissionCurrency) => string;
}

export function useCommissionSlabListViewModel(): UseCommissionSlabListViewModelReturn {
  const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CommissionSlabFilter>({});
  const [currencyRates, setCurrencyRates] = useState<Record<CommissionCurrency, number>>(CURRENCY_RATE_FALLBACK);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [lastRatesFetchAt, setLastRatesFetchAt] = useState<Date | null>(null);
  const [displayCurrencies, setDisplayCurrencies] = useState<CommissionCurrency[]>(LIST_DISPLAY_CURRENCIES);

  useEffect(() => {
    let mounted = true;
    const fetchRates = async () => {
      if (!mounted) return;
      setIsFetchingRates(true);
      try {
        const rates = await fetchCommissionCurrencyRates();
        if (mounted) { setCurrencyRates(rates); setLastRatesFetchAt(new Date()); }
      } catch {
        if (mounted) setCurrencyRates(CURRENCY_RATE_FALLBACK);
      } finally {
        if (mounted) setIsFetchingRates(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const loadSlabs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await CommissionFirebaseService.fetchAllSlabs();
      setSlabs(data);
    } catch (error) {
      console.error('Error loading slabs:', error);
      toast.error('Failed to load commission slabs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSlabs(); }, [loadSlabs]);

  const filteredSlabs = useMemo(() => filterCommissionSlabs(slabs, filter), [slabs, filter]);
  const clearFilters  = useCallback(() => setFilter({}), []);
  const refreshSlabs  = useCallback(() => loadSlabs(), [loadSlabs]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission slab?')) return;
    try {
      await CommissionFirebaseService.deleteSlab(id);
      setSlabs(prev => prev.filter(s => s.id !== id));
      toast.success('Commission slab deleted');
    } catch {
      toast.error('Failed to delete commission slab');
    }
  }, []);

  const getSalespersonName = useCallback(
    (salespersonId: string, employees: any[]) =>
      employees.find(e => e.id === salespersonId)?.name || salespersonId,
    [],
  );

  const convertForDisplay = useCallback(
    (pkrAmount: number, toCurrency: CommissionCurrency) =>
      +convertCommissionCurrency(pkrAmount, 'PKR', toCurrency, currencyRates).toFixed(2),
    [currencyRates],
  );

  const formatInCurrency = useCallback(
    (pkrAmount: number, currency: CommissionCurrency) =>
      formatCommissionCurrency(convertForDisplay(pkrAmount, currency), currency),
    [convertForDisplay],
  );

  const formatCurrency = useCallback(
    (amount: number) => formatCommissionCurrency(amount, 'PKR'),
    [],
  );

  return {
    slabs, filteredSlabs, isLoading,
    filter, setFilter, clearFilters, refreshSlabs, handleDelete,
    totalSlabs: slabs.length, getSalespersonName, formatCurrency,
    currencyRates, isFetchingRates, lastRatesFetchAt,
    displayCurrencies, setDisplayCurrencies,
    convertForDisplay, formatInCurrency,
  };
}