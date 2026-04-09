// Commission Calculation ViewModel
// UPDATED:
//   1. After saving commissions to Firestore, also writes commission amounts to
//      existing salary records for the same employee+month (salary linking).
//   2. Exposes `liveCommissions` — the real-time Calculated records already
//      written by the auto-commission service when invoices were saved.
//      This lets the UI show progress before the admin confirms.
//   3. handleModalConfirm upgrades all Calculated → Confirmed and then
//      patches any existing salary records.

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  // Progress towards the next slab (0-100)
  slabProgressPercent: number;
}

// ─── Local calculation helper ────────────────────────────────────────────────

function calculateCommissionsFromInvoices(
  city:          string,
  month:         string,
  invoices:      InvoiceReference[],
  employees:     EmployeeReference[],
  slabs:         any[],
  calculatedBy   = 'Admin'
): CommissionCalculationResult & { breakdowns: SalespersonInvoiceBreakdown[] } {
  const errors: string[] = [];

  const relevantInvoices = invoices.filter((inv) => {
    if (inv.status !== 'Paid')   return false;
    if (!inv.salesperson)        return false;
    if (inv.customerCity !== city) return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime()))      return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  });

  if (relevantInvoices.length === 0) {
    errors.push(`No paid invoices found for "${city}" in ${month}`);
    return {
      commissions: [],
      errors,
      summary: { totalSalespeople: 0, totalSales: 0, totalCommission: 0, totalInvoicesUsed: 0 },
      breakdowns: [],
    };
  }

  // Group per salesperson
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
        slab.city        === city           &&
        totalSales       >= slab.fromAmount &&
        totalSales       <= slab.toAmount
    );

    // Next-higher slab for the progress bar
    const higherSlabs = slabs
      .filter(
        (slab) =>
          slab.salesperson === salespersonId &&
          slab.city        === city           &&
          slab.fromAmount  >  totalSales
      )
      .sort((a, b) => a.fromAmount - b.fromAmount);

    const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

    // Progress percentage towards next slab (or 100% if in a slab)
    let slabProgressPercent = 0;
    if (applicableSlab) {
      slabProgressPercent = 100;
    } else if (nextSlabThreshold) {
      // Progress from 0 to the first slab's start
      const firstSlab = slabs
        .filter((s) => s.salesperson === salespersonId && s.city === city)
        .sort((a, b) => a.fromAmount - b.fromAmount)[0];
      const rangeStart = firstSlab ? 0 : 0;
      const rangeEnd   = nextSlabThreshold;
      slabProgressPercent = Math.min(100, Math.round((totalSales / rangeEnd) * 100));
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
      errors.push(
        `No commission slab for ${employee.name} in ${city} covering sales of ${formatCurrency(totalSales)}`
      );
      return;
    }

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

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

  const totalSales      = commissions.reduce((s, c) => s + c.totalSales, 0);
  const totalCommission = commissions.reduce((s, c) => s + c.calculatedCommissionAmount, 0);

  return {
    commissions,
    errors,
    summary: {
      totalSalespeople:  commissions.length,
      totalSales,
      totalCommission,
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
    totalSalespeople: number;
    totalSales:       number;
    totalCommission:  number;
    totalInvoicesUsed: number;
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
  // Live auto-calculated commissions (written by invoice saves before admin confirms)
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

  const [selectedCity,          setSelectedCity]          = useState('');
  const [selectedMonth,         setSelectedMonth]         = useState(getCurrentMonth());
  const [commissionData,        setCommissionData]        = useState<Commission[]>([]);
  const [calculationErrors,     setCalculationErrors]     = useState<string[]>([]);
  const [summary,               setSummary]               = useState<{
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null>(null);
  const [invoiceBreakdowns,     setInvoiceBreakdowns]     = useState<SalespersonInvoiceBreakdown[]>([]);
  const [expandedSalesperson,   setExpandedSalesperson]   = useState<string | null>(null);
  const [showModal,             setShowModal]             = useState(false);
  const [isFullScreen,          setIsFullScreen]          = useState(false);
  const [isCalculating,         setIsCalculating]         = useState(false);
  const [isEditing,             setIsEditing]             = useState<string | null>(null);
  const [editValues,            setEditValues]            = useState({ percentage: 0, amount: 0 });

  // Live Calculated records written automatically when invoices are saved
  const [liveCommissions,       setLiveCommissions]       = useState<Commission[]>([]);
  const [liveCommissionsLoading,setLiveCommissionsLoading]= useState(false);

  // ── Fetch live (auto-calculated) commissions for selected city+month ──
  const refreshLiveCommissions = useCallback(async () => {
    if (!selectedCity || !selectedMonth) return;
    setLiveCommissionsLoading(true);
    try {
      const all = await CommissionFirebaseService.fetchAllCommissions();
      const filtered = all.filter(
        (c) => c.city === selectedCity && c.month === selectedMonth
      );
      setLiveCommissions(filtered);
    } catch (err) {
      console.warn('[CommissionCalc] Could not load live commissions:', err);
    } finally {
      setLiveCommissionsLoading(false);
    }
  }, [selectedCity, selectedMonth]);

  useEffect(() => {
    refreshLiveCommissions();
  }, [refreshLiveCommissions]);

  // ── Manual calculate (admin-initiated) ───────────────────────────────
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

        if (result.commissions.length === 0) return false;
        setShowModal(true);
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Calculation failed';
        setCalculationErrors([msg]);
        toast.error(msg);
        return false;
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedCity, selectedMonth]
  );

  // ── Confirm helpers ───────────────────────────────────────────────────
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

  // ── Save to Firestore + link to salary records ────────────────────────
  const handleModalConfirm = useCallback(async () => {
    try {
      const toSave = commissionData.map(({ id, ...rest }) => ({
        ...rest,
        status:      'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: new Date().toISOString(),
        isLocked:    true,
      }));

      const savedCommissions = await CommissionFirebaseService.saveCommissions(toSave);

      // ── Link commission amounts to existing salary records ─────────────
      // For each confirmed commission, find the matching Employee salary for
      // the same employee + salaryMonth and update its commission + netAmount.
      // Non-fatal: if no salary record exists yet the salary form will
      // auto-populate when the user opens it.
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
            console.log(
              `[CommissionCalc] Linked commission PKR ${commissionAmount} to salary record ${matchingSalary.id}`
            );
          }
        });

        await Promise.allSettled(updatePromises);
      } catch (linkErr) {
        console.warn('[CommissionCalc] Salary linking failed (non-fatal):', linkErr);
      }

      const linkedCount = updatedSalaries.length;
      toast.success(
        `${toSave.length} commission(s) confirmed & saved. ${linkedCount > 0 ? `Linked to ${linkedCount} salary record(s).` : 'Ready for salary forms.'}`
      );
      setShowModal(false);
      resetState();
      refreshLiveCommissions();
      onCommissionsSaved();
    } catch (error) {
      toast.error('Failed to save commissions');
      console.error(error);
    }
  }, [commissionData, onCommissionsSaved, resetState, refreshLiveCommissions]);

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