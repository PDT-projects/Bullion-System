// Commission Calculation ViewModel
// CHANGED (salesperson-first multi-select):
//   - Removed `selectedCity` / city-first selection.
//   - Added `selectedSalespersons: string[]`  (array of employee IDs, multi-select).
//   - Calculation now groups ALL paid invoices for the selected month by
//     salesperson (across every city), then looks up the matching slab per
//     salesperson+city bucket — identical slab-lookup logic, different entry point.
//   - `SalespersonInvoiceBreakdown` gains a `noSlabMessage` field so the View
//     can render a "No commission slab" row for each unmatched person.
//   - Everything else (auto-save, salary linking, live commissions,
//     edit/confirm helpers) is unchanged.

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  Commission,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference,
} from '../models/types';
import {
  formatCurrency,
  formatMonth,
  getCurrentMonth,
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService }     from '../../salary/models/salaryFirebaseService';
import { ALL_SALESPERSONS }          from './useCommissionSlabFormViewModel';

// ─── Per-salesperson invoice breakdown ───────────────────────────────────────

export interface SalespersonInvoiceBreakdown {
  salespersonId:       string;
  salespersonName:     string;
  invoices:            InvoiceReference[];
  totalSales:          number;
  invoiceCount:        number;
  slabFrom:            number;
  slabTo:              number;
  nextSlabThreshold:   number | null;
  slabProgressPercent: number;
  isPooled?:           boolean;
  pooledCitySales?:    { city: string; amount: number; invoiceCount: number }[];
  // Set when no slab matched for this person — shown inline in the UI
  noSlabMessage?:      string;
}

// ─── Slab lookup helper ───────────────────────────────────────────────────────
function findApplicableSlab(
  slabs: any[],
  employeeId: string,
  city: string,
  totalSales: number,
  normalizeCity: (s: string | undefined) => string,
): any | undefined {
  const cityNorm = normalizeCity(city);

  // 1. Person-specific slab
  const personal = slabs.find(
    s =>
      s.salesperson === employeeId &&
      normalizeCity(s.city) === cityNorm &&
      totalSales >= s.fromAmount &&
      totalSales <= s.toAmount,
  );
  if (personal) return personal;

  // 2. Shared (__ALL__) slab
  return slabs.find(
    s =>
      s.salesperson === ALL_SALESPERSONS &&
      normalizeCity(s.city) === cityNorm &&
      totalSales >= s.fromAmount &&
      totalSales <= s.toAmount,
  );
}

function findHigherSlabs(
  slabs: any[],
  employeeId: string,
  city: string,
  totalSales: number,
  normalizeCity: (s: string | undefined) => string,
): any[] {
  const cityNorm = normalizeCity(city);
  const candidates = slabs.filter(
    s =>
      (s.salesperson === employeeId || s.salesperson === ALL_SALESPERSONS) &&
      normalizeCity(s.city) === cityNorm &&
      s.fromAmount > totalSales,
  );
  return candidates.sort((a, b) => a.fromAmount - b.fromAmount);
}

// ─── Local calculation helper ─────────────────────────────────────────────────
// Now salesperson-first: for each selected salesperson, aggregate their paid
// invoices for the month (across all cities), then look up a slab per city bucket.

function calculateCommissionsFromInvoices(
  selectedSalespersonIds: string[],   // ← replaces `city`
  month:       string,
  invoices:    InvoiceReference[],
  employees:   EmployeeReference[],
  slabs:       any[],
  calculatedBy = 'Admin'
): CommissionCalculationResult & { breakdowns: SalespersonInvoiceBreakdown[] } {
  const errors: string[] = [];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function isInMonth(inv: InvoiceReference): boolean {
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  }

  function normalizeCity(raw: string | undefined): string {
    return (raw ?? '').trim().toLowerCase();
  }

  function normalizeStr(s: string | undefined): string {
    return (s ?? '').trim().toLowerCase();
  }

  // ── Build lookup maps ─────────────────────────────────────────────────
  const employeeByName = new Map<string, EmployeeReference>();
  employees.forEach(e => { if (e.name) employeeByName.set(normalizeStr(e.name), e); });

  const employeeById = new Map<string, EmployeeReference>();
  employees.forEach(e => { if (e.id) employeeById.set(e.id, e); });

  // ── Resolve selected IDs → employee records ───────────────────────────
  const selectedEmployees = selectedSalespersonIds
    .map(id => employeeById.get(id))
    .filter((e): e is EmployeeReference => !!e);

  // ── Filter paid invoices for this month (all cities) ─────────────────
  const paidMonthInvoices = invoices.filter(inv => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson)      return false;
    if (!isInMonth(inv))       return false;
    return true;
  });

  const commissions: Commission[] = [];
  const breakdowns:  SalespersonInvoiceBreakdown[] = [];

  // ── Process each selected salesperson ────────────────────────────────
  selectedEmployees.forEach(employee => {
    const salespersonId = employee.id;
    const salespersonNameNorm = normalizeStr(employee.name);

    // Collect invoices for this salesperson (match by ID or name)
    const spInvoices = paidMonthInvoices.filter(inv => {
      const raw  = inv.salesperson!.trim();
      const byId = employeeById.get(raw);
      const byNm = employeeByName.get(normalizeStr(raw));
      const resolvedId = byId ? byId.id : byNm ? byNm.id : raw;
      return resolvedId === salespersonId || normalizeStr(raw) === salespersonNameNorm;
    });

    if (spInvoices.length === 0) {
      // No invoices at all for this person this month
      breakdowns.push({
        salespersonId,
        salespersonName:   employee.name,
        invoices:          [],
        totalSales:        0,
        invoiceCount:      0,
        slabFrom:          0,
        slabTo:            0,
        nextSlabThreshold: null,
        slabProgressPercent: 0,
        noSlabMessage: `No paid invoices found for ${employee.name} in ${formatMonth(month)}`,
      });
      errors.push(`No paid invoices for ${employee.name} in ${formatMonth(month)}`);
      return;
    }

    // Group by city (salespersonLocation → branch → customerCity)
    const byCityMap: Record<string, InvoiceReference[]> = {};
    spInvoices.forEach(inv => {
      const city = (
        (inv.salespersonLocation || '').trim() ||
        (inv.branch || '').trim() ||
        (inv.customerCity || '').trim() ||
        'Unknown'
      );
      if (!byCityMap[city]) byCityMap[city] = [];
      byCityMap[city].push(inv);
    });

    const totalSales = spInvoices.reduce((s, inv) => s + inv.totalAmount, 0);

    // Try to find a matching slab across any of the cities
    let bestSlab: any | undefined;
    let bestCity = '';

    for (const [city, cityInvs] of Object.entries(byCityMap)) {
      const cityTotal = cityInvs.reduce((s, inv) => s + inv.totalAmount, 0);
      const slab = findApplicableSlab(slabs, salespersonId, city, cityTotal, normalizeCity);
      if (slab) {
        // Prefer the city whose slab gives the highest commission
        if (
          !bestSlab ||
          (cityTotal * slab.commissionPercentage) / 100 >
          (Object.entries(byCityMap).find(([c]) => c === bestCity)?.[1].reduce((s, i) => s + i.totalAmount, 0) ?? 0) *
            (bestSlab?.commissionPercentage ?? 0) / 100
        ) {
          bestSlab = slab;
          bestCity = city;
        }
      }
    }

    // Use aggregate totalSales for the slab lookup (across all cities)
    const applicableSlab =
      bestSlab ??
      findApplicableSlab(slabs, salespersonId, Object.keys(byCityMap)[0] ?? '', totalSales, normalizeCity);

    const higherSlabs = findHigherSlabs(
      slabs, salespersonId,
      bestCity || Object.keys(byCityMap)[0] || '',
      totalSales, normalizeCity,
    );

    const nextSlabThreshold   = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;
    let   slabProgressPercent = 0;

    if (applicableSlab) {
      slabProgressPercent = Math.min(
        100,
        Math.round(
          ((totalSales - applicableSlab.fromAmount) /
            (applicableSlab.toAmount - applicableSlab.fromAmount)) * 100,
        ),
      );
    } else if (nextSlabThreshold) {
      slabProgressPercent = Math.min(100, Math.round((totalSales / nextSlabThreshold) * 100));
    }

    if (!applicableSlab) {
      breakdowns.push({
        salespersonId,
        salespersonName:   employee.name,
        invoices:          spInvoices,
        totalSales,
        invoiceCount:      spInvoices.length,
        slabFrom:          0,
        slabTo:            0,
        nextSlabThreshold,
        slabProgressPercent,
        noSlabMessage: `No commission slab for ${employee.name} covering sales of ${formatCurrency(totalSales)}`,
      });
      errors.push(
        `No commission slab for ${employee.name} covering sales of ${formatCurrency(totalSales)}`
      );

      // Clean up any stale Firestore records (across all cities) for this person
      Object.keys(byCityMap).forEach(city => {
        CommissionFirebaseService.deleteExistingCommissions(
          salespersonId, month, city
        ).catch(() => {});
      });
      return;
    }

    breakdowns.push({
      salespersonId,
      salespersonName:   employee.name,
      invoices:          spInvoices,
      totalSales,
      invoiceCount:      spInvoices.length,
      slabFrom:          applicableSlab.fromAmount,
      slabTo:            applicableSlab.toAmount,
      nextSlabThreshold,
      slabProgressPercent,
    });

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;
    const city = bestCity || Object.keys(byCityMap)[0] || '';

    commissions.push({
      id:                         `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      salesperson:                salespersonId,
      salespersonName:            employee.name,
      city,
      month,
      totalSales,
      invoiceCount:               spInvoices.length,
      appliedSlabFrom:            applicableSlab.fromAmount,
      appliedSlabTo:              applicableSlab.toAmount,
      commissionPercentage:       applicableSlab.commissionPercentage,
      calculatedCommissionAmount: commissionAmount,
      status:                     'Calculated',
      calculatedBy,
      calculatedAt:               new Date().toISOString(),
      isLocked:                   false,
    });
  });

  return {
    commissions,
    errors,
    summary: {
      totalSalespeople:  commissions.length,
      totalSales:        commissions.reduce((s, c) => s + c.totalSales, 0),
      totalCommission:   commissions.reduce((s, c) => s + c.calculatedCommissionAmount, 0),
      totalInvoicesUsed: commissions.reduce((s, c) => s + c.invoiceCount, 0),
    },
    breakdowns,
  };
}

// ─── Return type ──────────────────────────────────────────────────────────────

interface UseCommissionCalculationViewModelReturn {
  // Multi-select salesperson (replaces city)
  selectedSalespersons:    string[];           // array of employee IDs
  setSelectedSalespersons: (ids: string[]) => void;
  toggleSalesperson:       (id: string) => void;
  clearSalespersons:       () => void;
  selectedMonth:           string;
  setSelectedMonth:        (month: string) => void;
  commissionData:          Commission[];
  calculationErrors:       string[];
  summary: {
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null;
  invoiceBreakdowns:       SalespersonInvoiceBreakdown[];
  expandedSalesperson:     string | null;
  setExpandedSalesperson:  (id: string | null) => void;
  showModal:               boolean;
  setShowModal:            (show: boolean) => void;
  isFullScreen:            boolean;
  setIsFullScreen:         (full: boolean) => void;
  isCalculating:           boolean;
  isEditing:               string | null;
  editValues:              { percentage: number; amount: number };
  setEditValues:           (values: { percentage: number; amount: number }) => void;
  liveCommissions:         Commission[];
  liveCommissionsLoading:  boolean;
  refreshLiveCommissions:  () => void;
  calculateCommission:     (invoices: InvoiceReference[], employees: EmployeeReference[]) => Promise<boolean>;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions:   () => void;
  startEdit:               (commission: Commission) => void;
  saveEdit:                (commissionId: string) => void;
  cancelEdit:              () => void;
  cancelCalculation:       () => void;
  handleModalConfirm:      () => Promise<void>;
  handleModalCancel:       () => void;
  formatCurrency:          (amount: number) => string;
  formatMonth:             (monthStr: string) => string;
  // Kept for compatibility with other parts of the system that pass cities
  cities:                  string[];
  setInvoiceCities:        (cities: string[]) => void;
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useCommissionCalculationViewModel(
  onCommissionsSaved: () => void
): UseCommissionCalculationViewModelReturn {

  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>([]);
  const [selectedMonth,        setSelectedMonth]        = useState(getCurrentMonth());
  const [commissionData,       setCommissionData]       = useState<Commission[]>([]);
  const [calculationErrors,    setCalculationErrors]    = useState<string[]>([]);
  const [summary,              setSummary]              = useState<{
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null>(null);
  const [invoiceBreakdowns,    setInvoiceBreakdowns]    = useState<SalespersonInvoiceBreakdown[]>([]);
  const [expandedSalesperson,  setExpandedSalesperson]  = useState<string | null>(null);
  const [showModal,            setShowModal]            = useState(false);
  const [isFullScreen,         setIsFullScreen]         = useState(false);
  const [isCalculating,        setIsCalculating]        = useState(false);
  const [isEditing,            setIsEditing]            = useState<string | null>(null);
  const [editValues,           setEditValues]           = useState({ percentage: 0, amount: 0 });
  const [liveCommissions,        setLiveCommissions]        = useState<Commission[]>([]);
  const [liveCommissionsLoading, setLiveCommissionsLoading] = useState(false);
  const [invoiceCities,          setInvoiceCities]          = useState<string[]>([]);

  // ── Multi-select helpers ──────────────────────────────────────────────
  const toggleSalesperson = useCallback((id: string) => {
    setSelectedSalespersons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const clearSalespersons = useCallback(() => setSelectedSalespersons([]), []);

  // ── Fetch ALL commissions for live panel ──────────────────────────────
  const refreshLiveCommissions = useCallback(async () => {
    setLiveCommissionsLoading(true);
    try {
      const all    = await CommissionFirebaseService.fetchAllCommissions();
      const sorted = [...all].sort(
        (a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
      );
      setLiveCommissions(sorted);
    } catch (err) {
      console.warn('[CommissionCalc] Could not load live commissions:', err);
    } finally {
      setLiveCommissionsLoading(false);
    }
  }, []);

  useEffect(() => { refreshLiveCommissions(); }, [refreshLiveCommissions]);

  // ── Calculate + AUTO SAVE ─────────────────────────────────────────────
  const calculateCommission = useCallback(
    async (invoices: InvoiceReference[], employees: EmployeeReference[]): Promise<boolean> => {
      if (selectedSalespersons.length === 0 || !selectedMonth) {
        setCalculationErrors(['Please select at least one salesperson and a month']);
        return false;
      }
      setIsCalculating(true);
      setCalculationErrors([]);

      try {
        const slabs  = await CommissionFirebaseService.fetchAllSlabs();
        const result = calculateCommissionsFromInvoices(
          selectedSalespersons, selectedMonth, invoices, employees, slabs, 'Admin'
        );

        setCommissionData(result.commissions);
        setCalculationErrors(result.errors);
        setSummary(result.summary);
        setInvoiceBreakdowns(result.breakdowns);

        if (result.commissions.length === 0) {
          toast.error(
            'No commissions to save — check that salesperson names match employee records ' +
            'and slabs are configured.'
          );
          return false;
        }

        // ✅ AUTO-SAVE
        try {
          const toSave = result.commissions.map(({ id, ...rest }) => ({
            ...rest,
            status:      'Confirmed' as const,
            confirmedBy: 'Admin',
            confirmedAt: new Date().toISOString(),
            isLocked:    true,
          }));

          const savedCommissions = await CommissionFirebaseService.saveCommissions(toSave);

          // ✅ Link commission amounts to salary records
          let linkedCount = 0;
          try {
            const allSalaries = await SalaryFirebaseService.fetchAllSalaries();
            const updatePromises = savedCommissions.map(async (commission) => {
              const commissionAmount =
                commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount;
              const matchingSalary = allSalaries.find(
                s =>
                  s.employeeId  === commission.salesperson &&
                  s.salaryMonth === commission.month       &&
                  s.subCategory === 'Employee salary'
              );
              if (matchingSalary) {
                await SalaryFirebaseService.updateSalary(matchingSalary.id, {
                  commission: commissionAmount,
                  netAmount:  Math.max(
                    0,
                    (matchingSalary.baseSalary || 0) + commissionAmount - (matchingSalary.deductions || 0)
                  ),
                });
                linkedCount++;
              }
            });
            await Promise.allSettled(updatePromises);
          } catch (linkErr) {
            console.warn('[CommissionCalc] Salary linking failed (non-fatal):', linkErr);
          }

          toast.success(
            `${toSave.length} commission(s) saved.` +
            (linkedCount > 0 ? ` Linked to ${linkedCount} salary record(s).` : ' Ready for salary forms.')
          );

          await refreshLiveCommissions();
          onCommissionsSaved();
          return true;

        } catch (saveErr) {
          const msg = saveErr instanceof Error ? saveErr.message : 'Failed to save commissions';
          toast.error(msg);
          return false;
        }

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Calculation failed';
        setCalculationErrors([msg]);
        toast.error(msg);
        return false;
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedSalespersons, selectedMonth, onCommissionsSaved, refreshLiveCommissions]
  );

  // ── Confirm helpers ───────────────────────────────────────────────────
  const confirmSingleCommission = useCallback((commissionId: string) => {
    setCommissionData(prev =>
      prev.map(c =>
        c.id === commissionId
          ? { ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: new Date().toISOString(), isLocked: true }
          : c
      )
    );
  }, []);

  const confirmAllCommissions = useCallback(() => {
    const now = new Date().toISOString();
    setCommissionData(prev =>
      prev.map(c => ({ ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: now, isLocked: true }))
    );
  }, []);

  // ── Edit helpers ──────────────────────────────────────────────────────
  const startEdit = useCallback((commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage ?? commission.commissionPercentage,
      amount:     commission.overriddenCommissionAmount     ?? commission.calculatedCommissionAmount,
    });
  }, []);

  const saveEdit = useCallback((commissionId: string) => {
    setCommissionData(prev =>
      prev.map(c =>
        c.id === commissionId
          ? { ...c, overriddenCommissionPercentage: editValues.percentage, overriddenCommissionAmount: editValues.amount, status: 'Adjusted' as const }
          : c
      )
    );
    setIsEditing(null);
  }, [editValues]);

  const cancelEdit = useCallback(() => {
    setIsEditing(null);
    setEditValues({ percentage: 0, amount: 0 });
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    setCommissionData([]);
    setSelectedSalespersons([]);
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
    setInvoiceBreakdowns([]);
    setExpandedSalesperson(null);
  }, []);

  const cancelCalculation = useCallback(() => resetState(), [resetState]);

  const handleModalConfirm = useCallback(async () => {
    toast.info('Commissions already saved automatically');
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    resetState();
  }, [resetState]);

  return {
    selectedSalespersons,  setSelectedSalespersons,
    toggleSalesperson,     clearSalespersons,
    selectedMonth,         setSelectedMonth,
    commissionData,
    calculationErrors,
    summary,
    invoiceBreakdowns,
    expandedSalesperson,   setExpandedSalesperson,
    showModal,             setShowModal,
    isFullScreen,          setIsFullScreen,
    isCalculating,
    isEditing,
    editValues,            setEditValues,
    liveCommissions,
    liveCommissionsLoading,
    refreshLiveCommissions,
    calculateCommission,
    confirmSingleCommission,
    confirmAllCommissions,
    startEdit,
    saveEdit,
    cancelEdit,
    cancelCalculation,
    handleModalConfirm,
    handleModalCancel,
    formatCurrency,
    formatMonth,
    cities:          invoiceCities,
    setInvoiceCities,
  };
}