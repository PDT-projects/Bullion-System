// Commission Calculation ViewModel
// UPDATED: Auto-saves commissions without manual confirmation modal
// - calculateCommission() now auto-saves results to Firestore
// - No modal shown — automatic silent save
// - User sees toast notification of success
// - refreshLiveCommissions() fetches saved data immediately

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
  CITIES,
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService }     from '../../salary/models/salaryFirebaseService';

// ─── Per-salesperson invoice breakdown ──────────────────────────────────────

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
}

// ─── Local calculation helper ────────────────────────────────────────────────

function calculateCommissionsFromInvoices(
  city:        string,
  month:       string,
  invoices:    InvoiceReference[],
  employees:   EmployeeReference[],
  slabs:       any[],
  calculatedBy = 'Admin'
): CommissionCalculationResult & { breakdowns: SalespersonInvoiceBreakdown[] } {
  const errors: string[] = [];

  const relevantInvoices = invoices.filter((inv) => {
    if (inv.status !== 'Paid')      return false;
    if (!inv.salesperson)           return false;
    if (inv.customerCity !== city)  return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime()))         return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  });

  if (relevantInvoices.length === 0) {
    errors.push(`No paid invoices found for "${city}" in ${month}`);
    return {
      commissions: [], errors,
      summary: { totalSalespeople: 0, totalSales: 0, totalCommission: 0, totalInvoicesUsed: 0 },
      breakdowns: [],
    };
  }

  const grouped: Record<string, InvoiceReference[]> = {};
  relevantInvoices.forEach((inv) => {
    const key = inv.salesperson!;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(inv);
  });

  const commissions: Commission[] = [];
  const breakdowns: SalespersonInvoiceBreakdown[] = [];

  Object.entries(grouped).forEach(([salespersonId, spInvoices]) => {
    const totalSales = spInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const employee   = employees.find((e) => e.id === salespersonId);

    if (!employee) {
      errors.push(`Employee not found for salesperson ID: ${salespersonId}`);
      return;
    }

    const applicableSlab = slabs.find(
      (slab) =>
        slab.salesperson === salespersonId &&
        slab.city        === city &&
        totalSales       >= slab.fromAmount &&
        totalSales       <= slab.toAmount
    );

    const higherSlabs = slabs
      .filter((s) => s.salesperson === salespersonId && s.city === city && s.fromAmount > totalSales)
      .sort((a, b) => a.fromAmount - b.fromAmount);

    const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

    let slabProgressPercent = 0;
    if (applicableSlab) {
      slabProgressPercent = Math.min(
        100,
        Math.round(((totalSales - applicableSlab.fromAmount) / (applicableSlab.toAmount - applicableSlab.fromAmount)) * 100)
      );
    } else if (nextSlabThreshold) {
      slabProgressPercent = Math.min(100, Math.round((totalSales / nextSlabThreshold) * 100));
    }

    breakdowns.push({
      salespersonId,
      salespersonName:   employee.name,
      invoices:          spInvoices,
      totalSales,
      invoiceCount:      spInvoices.length,
      slabFrom:          applicableSlab?.fromAmount ?? 0,
      slabTo:            applicableSlab?.toAmount   ?? 0,
      nextSlabThreshold,
      slabProgressPercent,
    });

    if (!applicableSlab) {
      errors.push(`No commission slab for ${employee.name} in ${city} covering sales of ${formatCurrency(totalSales)}`);
      return;
    }

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

    commissions.push({
      id:                         `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      salesperson:                salespersonId,
      salespersonName:            employee.name,
      city, month, totalSales,
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
    commissions, errors,
    summary: {
      totalSalespeople:  commissions.length,
      totalSales:        commissions.reduce((s, c) => s + c.totalSales, 0),
      totalCommission:   commissions.reduce((s, c) => s + c.calculatedCommissionAmount, 0),
      totalInvoicesUsed: relevantInvoices.length,
    },
    breakdowns,
  };
}

// ─── Return type ─────────────────────────────────────────────────────────────

interface UseCommissionCalculationViewModelReturn {
  selectedCity:            string;
  setSelectedCity:         (city: string) => void;
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
  cities:                  readonly string[];
}

// ─── ViewModel ───────────────────────────────────────────────────────────────

export function useCommissionCalculationViewModel(
  onCommissionsSaved: () => void
): UseCommissionCalculationViewModelReturn {

  const [selectedCity,        setSelectedCity]        = useState('');
  const [selectedMonth,       setSelectedMonth]       = useState(getCurrentMonth());
  const [commissionData,      setCommissionData]      = useState<Commission[]>([]);
  const [calculationErrors,   setCalculationErrors]   = useState<string[]>([]);
  const [summary,             setSummary]             = useState<{
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null>(null);
  const [invoiceBreakdowns,   setInvoiceBreakdowns]   = useState<SalespersonInvoiceBreakdown[]>([]);
  const [expandedSalesperson, setExpandedSalesperson] = useState<string | null>(null);
  const [showModal,           setShowModal]           = useState(false);
  const [isFullScreen,        setIsFullScreen]        = useState(false);
  const [isCalculating,       setIsCalculating]       = useState(false);
  const [isEditing,           setIsEditing]           = useState<string | null>(null);
  const [editValues,          setEditValues]          = useState({ percentage: 0, amount: 0 });
  const [liveCommissions,         setLiveCommissions]         = useState<Commission[]>([]);
  const [liveCommissionsLoading,  setLiveCommissionsLoading]  = useState(false);

  // ── Fetch ALL commissions for live panel / dashboard ─────────────────
  // No city+month filter — fetches everything so dashboard always shows data
  const refreshLiveCommissions = useCallback(async () => {
    setLiveCommissionsLoading(true);
    try {
      const all = await CommissionFirebaseService.fetchAllCommissions();
      // Sort newest first
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

  useEffect(() => {
    refreshLiveCommissions();
  }, [refreshLiveCommissions]);

  // ── Manual calculate + AUTO SAVE (no modal) ──────────────────────────
  const calculateCommission = useCallback(
    async (invoices: InvoiceReference[], employees: EmployeeReference[]): Promise<boolean> => {
      if (!selectedCity || !selectedMonth) {
        setCalculationErrors(['Please select both a city and a month']);
        return false;
      }
      setIsCalculating(true);
      setCalculationErrors([]);

      try {
        const slabs  = await CommissionFirebaseService.fetchAllSlabs();
        const result = calculateCommissionsFromInvoices(
          selectedCity, selectedMonth, invoices, employees, slabs, 'Admin'
        );
        
        setCommissionData(result.commissions);
        setCalculationErrors(result.errors);
        setSummary(result.summary);
        setInvoiceBreakdowns(result.breakdowns);

        if (result.commissions.length === 0) {
          toast.error('No commissions to save');
          return false;
        }

        // ✅ AUTO-SAVE: Immediately save all commissions to Firestore
        try {
          const toSave = result.commissions.map(({ id, ...rest }) => ({
            ...rest,
            status:      'Confirmed' as const,
            confirmedBy: 'Admin',
            confirmedAt: new Date().toISOString(),
            isLocked:    true,
          }));

          const savedCommissions = await CommissionFirebaseService.saveCommissions(toSave);

          // ✅ Link commission amounts to existing salary records (non-fatal)
          let linkedCount = 0;
          try {
            const allSalaries = await SalaryFirebaseService.fetchAllSalaries();

            const updatePromises = savedCommissions.map(async (commission) => {
              const commissionAmount =
                commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount;

              const matchingSalary = allSalaries.find(
                (s) =>
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
                console.log(`[CommissionCalc] Linked PKR ${commissionAmount} to salary ${matchingSalary.id}`);
              }
            });

            await Promise.allSettled(updatePromises);
          } catch (linkErr) {
            console.warn('[CommissionCalc] Salary linking failed (non-fatal):', linkErr);
          }

          // ✅ Show success toast + refresh data
          toast.success(
            `${toSave.length} commission(s) saved.` +
            (linkedCount > 0 ? ` Linked to ${linkedCount} salary record(s).` : ' Ready for salary forms.')
          );

          // Reset state and refresh live commissions
          resetState();
          await refreshLiveCommissions();
          onCommissionsSaved();
          return true;

        } catch (saveErr) {
          const msg = saveErr instanceof Error ? saveErr.message : 'Failed to save commissions';
          toast.error(msg);
          console.error('[CommissionCalc] Save error:', saveErr);
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
    [selectedCity, selectedMonth, onCommissionsSaved, refreshLiveCommissions]
  );

  // ── Confirm helpers (for live commissions modal editing) ──────────────
  const confirmSingleCommission = useCallback((commissionId: string) => {
    setCommissionData((prev) =>
      prev.map((c) =>
        c.id === commissionId
          ? { ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: new Date().toISOString(), isLocked: true }
          : c
      )
    );
  }, []);

  const confirmAllCommissions = useCallback(() => {
    const now = new Date().toISOString();
    setCommissionData((prev) =>
      prev.map((c) => ({ ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: now, isLocked: true }))
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
    setCommissionData((prev) =>
      prev.map((c) =>
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
    setSelectedCity('');
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
    setInvoiceBreakdowns([]);
    setExpandedSalesperson(null);
  }, []);

  const cancelCalculation = useCallback(() => resetState(), [resetState]);

  // ── Unused: Modal confirm (kept for backward compatibility) ──────────
  const handleModalConfirm = useCallback(async () => {
    // This is now handled in calculateCommission() itself
    toast.info('Commissions already saved automatically');
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    resetState();
  }, [resetState]);

  return {
    selectedCity,          setSelectedCity,
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
    cities: CITIES,
  };
}