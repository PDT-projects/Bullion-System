// Commission Slab Form ViewModel — multi-currency, international locations, "All Salespersons"

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { CommissionSlab, CreateCommissionSlabDTO } from '../models/types';
import { validateCommissionSlab } from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

// ─────────────────────────────────────────────────────────────────────────────
// Currency definitions
// ─────────────────────────────────────────────────────────────────────────────
export const COMMISSION_CURRENCIES = [
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
] as const;

export type CommissionCurrency = (typeof COMMISSION_CURRENCIES)[number]['code'];

export const CURRENCY_RATE_FALLBACK: Record<CommissionCurrency, number> = {
  PKR: 1,
  USD: 278.5,
  SAR: 74.2,
  AED: 75.8,
  CAD: 204.6,
};

export async function fetchCommissionCurrencyRates(): Promise<Record<CommissionCurrency, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/PKR');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('API returned failure');
    const rates = { ...CURRENCY_RATE_FALLBACK };
    for (const cur of COMMISSION_CURRENCIES) {
      if (cur.code === 'PKR') continue;
      rates[cur.code] = data.rates[cur.code]
        ? +( 1 / data.rates[cur.code]).toFixed(4)
        : CURRENCY_RATE_FALLBACK[cur.code];
    }
    return rates;
  } catch (err) {
    console.warn('[CommissionSlabForm] Rate fetch failed, using fallback:', err);
    return CURRENCY_RATE_FALLBACK;
  }
}

export function convertCommissionCurrency(
  amount: number,
  from: CommissionCurrency,
  to: CommissionCurrency,
  rates: Record<CommissionCurrency, number>,
): number {
  if (from === to) return amount;
  const pkr = from === 'PKR' ? amount : amount * rates[from];
  return to === 'PKR' ? pkr : pkr / rates[to];
}

// ─────────────────────────────────────────────────────────────────────────────
// Locations  — international, persisted to localStorage
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_LOCATIONS: readonly string[] = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Doha',
  'Kuwait City',
  'Muscat',
  'Bahrain',
  'Chad',
  'Sudan',
  'Cairo',
  'Nairobi',
  'Lagos',
  'London',
  'Toronto',
  'New York',
  'Other',
];

const CUSTOM_LOCATIONS_KEY = 'commission_slab_custom_locations';

function loadCustomLocations(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomLocations(locs: string[]): void {
  try {
    localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(locs));
  } catch {
    // localStorage unavailable — ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sentinel values
// ─────────────────────────────────────────────────────────────────────────────
/** Special salesperson value meaning "apply to all salespersons". */
export const ALL_SALESPERSONS = '__ALL__';

/** Special location value triggering the "add new location" inline input. */
export const ADD_NEW_LOCATION = '__ADD_NEW__';

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────
interface FormData {
  salesperson: string;       // employee ID  |  ALL_SALESPERSONS
  location: string;          // location name | ADD_NEW_LOCATION
  newLocationInput: string;  // value while user types a new location
  fromAmount: number;        // always PKR internally
  toAmount: number;          // always PKR internally
  commissionPercentage: number;
  inputCurrency: CommissionCurrency;
}

const initialFormData: FormData = {
  salesperson: '',
  location: '',
  newLocationInput: '',
  fromAmount: 0,
  toAmount: 0,
  commissionPercentage: 0,
  inputCurrency: 'PKR',
};

// ─────────────────────────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────────────────────────
export interface UseCommissionSlabFormViewModelReturn {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isSubmitting: boolean;
  errors: string[];
  editingSlab: CommissionSlab | null;
  setEditingSlab: (slab: CommissionSlab | null) => void;
  startEdit: (slab: CommissionSlab) => void;
  handleAdd: () => void;
  /** employees param needed so ALL_SALESPERSONS can fan out into multiple slabs */
  handleSave: (existingSlabs: CommissionSlab[], employees: any[]) => Promise<void>;
  // Locations
  allLocations: string[];
  addCustomLocation: (name: string) => void;
  // Currency
  currencyRates: Record<CommissionCurrency, number>;
  isFetchingRates: boolean;
  lastRatesFetchAt: Date | null;
  convertAmount: (amount: number, from: CommissionCurrency, to: CommissionCurrency) => number;
  getDisplayAmounts: (pkrAmount: number) => Array<{ code: CommissionCurrency; symbol: string; amount: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useCommissionSlabFormViewModel(
  onSuccess: () => void,
): UseCommissionSlabFormViewModelReturn {
  const [formData, setFormDataState] = useState<FormData>(initialFormData);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors]             = useState<string[]>([]);
  const [editingSlab, setEditingSlab]   = useState<CommissionSlab | null>(null);

  // Custom locations — persisted in localStorage
  const [customLocations, setCustomLocations] = useState<string[]>(loadCustomLocations);

  const allLocations: string[] = [
    ...DEFAULT_LOCATIONS,
    ...customLocations.filter(l => !DEFAULT_LOCATIONS.includes(l as any)),
  ];

  const addCustomLocation = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomLocations(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      saveCustomLocations(next);
      return next;
    });
  }, []);

  // Currency rates
  const [currencyRates, setCurrencyRates]       = useState<Record<CommissionCurrency, number>>(CURRENCY_RATE_FALLBACK);
  const [isFetchingRates, setIsFetchingRates]   = useState(false);
  const [lastRatesFetchAt, setLastRatesFetchAt] = useState<Date | null>(null);
  const rateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    rateIntervalRef.current = setInterval(fetchRates, 30 * 60 * 1000);
    return () => {
      mounted = false;
      if (rateIntervalRef.current) clearInterval(rateIntervalRef.current);
    };
  }, []);

  const convertAmount = useCallback(
    (amount: number, from: CommissionCurrency, to: CommissionCurrency) =>
      convertCommissionCurrency(amount, from, to, currencyRates),
    [currencyRates],
  );

  const getDisplayAmounts = useCallback(
    (pkrAmount: number) =>
      COMMISSION_CURRENCIES.map(c => ({
        code: c.code,
        symbol: c.symbol,
        amount: c.code === 'PKR'
          ? pkrAmount
          : +convertCommissionCurrency(pkrAmount, 'PKR', c.code, currencyRates).toFixed(2),
      })),
    [currencyRates],
  );

  // Form helpers
  const setFormData = useCallback((data: Partial<FormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setErrors([]);
    setEditingSlab(null);
  }, []);

  const startEdit = useCallback((slab: CommissionSlab) => {
    setEditingSlab(slab);
    setFormDataState({
      salesperson: slab.salesperson,
      location: (slab as any).location ?? (slab as any).city ?? '',
      newLocationInput: '',
      fromAmount: slab.fromAmount,
      toAmount: slab.toAmount,
      commissionPercentage: slab.commissionPercentage,
      inputCurrency: 'PKR',
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    resetForm();
    setIsFullScreen(false);
    setIsModalOpen(true);
  }, [resetForm]);

  // ── handleSave ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (existingSlabs: CommissionSlab[], employees: any[]) => {
    setIsSubmitting(true);
    setErrors([]);

    // Resolve the final location name
    let resolvedLocation = formData.location;
    if (formData.location === ADD_NEW_LOCATION) {
      const trimmed = formData.newLocationInput.trim();
      if (!trimmed) {
        setErrors(['Please enter a name for the new location.']);
        setIsSubmitting(false);
        return;
      }
      resolvedLocation = trimmed;
      // Persist the new location for future sessions
      addCustomLocation(trimmed);
    }

    // Convert amounts to PKR for storage
    const pkrFrom = formData.inputCurrency === 'PKR'
      ? formData.fromAmount
      : +convertCommissionCurrency(formData.fromAmount, formData.inputCurrency, 'PKR', currencyRates).toFixed(2);

    const pkrTo = formData.inputCurrency === 'PKR'
      ? formData.toAmount
      : +convertCommissionCurrency(formData.toAmount, formData.inputCurrency, 'PKR', currencyRates).toFixed(2);

    // Determine which salesperson IDs to create/update for
    const isAll = formData.salesperson === ALL_SALESPERSONS;
    const targetIds: string[] = isAll
      ? employees.map(e => e.id)
      : [formData.salesperson];

    if (targetIds.length === 0) {
      setErrors(['No salespersons found.']);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingSlab && !isAll) {
        // Single-slab edit
        const payload = {
          salesperson: formData.salesperson,
          city: resolvedLocation,        // keep "city" field for backward compat
          location: resolvedLocation,
          fromAmount: pkrFrom,
          toAmount: pkrTo,
          commissionPercentage: formData.commissionPercentage,
        };
        const validation = validateCommissionSlab(
          payload as unknown as CreateCommissionSlabDTO,
          existingSlabs,
          editingSlab.id,
        );
        if (!validation.isValid) { setErrors(validation.errors); return; }
        await CommissionFirebaseService.updateSlab(editingSlab.id, payload);
        toast.success('Commission slab updated');
      } else {
        // Create one slab per resolved salesperson ID (fan-out for ALL)
        let created = 0;
        let skipped = 0;
        for (const spId of targetIds) {
          const payload = {
            salesperson: spId,
            city: resolvedLocation,
            location: resolvedLocation,
            fromAmount: pkrFrom,
            toAmount: pkrTo,
            commissionPercentage: formData.commissionPercentage,
          };
          const validation = validateCommissionSlab(
            payload as unknown as CreateCommissionSlabDTO,
            existingSlabs,
          );
          if (!validation.isValid) {
            // For ALL mode: skip duplicates silently, only block if single
            if (!isAll) { setErrors(validation.errors); return; }
            skipped++;
            continue;
          }
          await CommissionFirebaseService.createSlab(payload);
          created++;
        }
        if (isAll) {
          if (created === 0) {
            setErrors(['All slabs already exist for these salespersons in this range.']);
            return;
          }
          toast.success(
            skipped > 0
              ? `Created ${created} slab(s). ${skipped} skipped (already exist).`
              : `Created ${created} slab(s) for all salespersons.`
          );
        } else {
          toast.success('Commission slab created');
        }
      }

      setIsModalOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      setErrors([msg]);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingSlab, formData, currencyRates, addCustomLocation, onSuccess, resetForm]);

  return {
    formData, setFormData, resetForm,
    isModalOpen, setIsModalOpen,
    isFullScreen, setIsFullScreen,
    isSubmitting, errors,
    editingSlab, setEditingSlab,
    startEdit, handleAdd, handleSave,
    allLocations,
    addCustomLocation,
    currencyRates, isFetchingRates, lastRatesFetchAt,
    convertAmount, getDisplayAmounts,
  };
}