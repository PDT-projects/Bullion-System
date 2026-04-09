// Commission Calculation ViewModel — saves results to Firestore
// UPDATED: After saving commissions, also writes commission amounts to salary records
//          so the salary form can auto-populate the commission field.

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  Commission,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference
} from '../models/types';
import {
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  CITIES
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService } from '../../salary/models/salaryFirebaseService';

// ─── Per-salesperson invoice breakdown (shown in the UI before final save) ───

export interface SalespersonInvoiceBreakdown {
  salespersonId: string;
  salespersonName: string;
  invoices: InvoiceReference[];
  totalSales: number;
  invoiceCount: number;
  // Slab progress info for the progress bar
  slabFrom: number;
  slabTo: number;
  nextSlabThreshold: number | null; // null if no higher slab exists for this sp+city
}

// ─── Local calculation helper ────────────────────────────────────────────────

function calculateCommissionsFromInvoices(
  city: string,
  month: string,
  invoices: InvoiceReference[],
  employees: EmployeeReference[],
  slabs: any[],
  calculatedBy: string = 'Admin'
): CommissionCalculationResult & {
  breakdowns: SalespersonInvoiceBreakdown[];
} {
  const errors: string[] = [];

  // 1. Filter: correct city, correct month, Paid only, has a salesperson
  const relevantInvoices = invoices.filter((inv) => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson) return false;
    if (inv.customerCity !== city) return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return false;
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

  // 2. Group invoices per salesperson
  const invoicesBySalesperson: Record<string, InvoiceReference[]> = {};
  relevantInvoices.forEach((inv) => {
    const key = inv.salesperson!;
    if (!invoicesBySalesperson[key]) invoicesBySalesperson[key] = [];
    invoicesBySalesperson[key].push(inv);
  });

  // 3. Build breakdowns + commissions
  const commissions: Commission[] = [];
  const breakdowns: SalespersonInvoiceBreakdown[] = [];

  Object.entries(invoicesBySalesperson).forEach(([salespersonId, spInvoices]) => {
    const totalSales = spInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const employee = employees.find((e) => e.id === salespersonId);

    if (!employee) {
      errors.push(`Employee record not found for salesperson ID: ${salespersonId}`);
      return;
    }

    // Find applicable commission slab
    const applicableSlab = slabs.find(
      (slab) =>
        slab.salesperson === salespersonId &&
        slab.city === city &&
        totalSales >= slab.fromAmount &&
        totalSales <= slab.toAmount
    );

    // Find the next higher slab (for progress bar)
    const higherSlabs = slabs
      .filter(
        (slab) =>
          slab.salesperson === salespersonId &&
          slab.city === city &&
          slab.fromAmount > totalSales
      )
      .sort((a, b) => a.fromAmount - b.fromAmount);

    const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

    // Store breakdown for display
    breakdowns.push({
      salespersonId,
      salespersonName: employee.name,
      invoices: spInvoices,
      totalSales,
      invoiceCount: spInvoices.length,
      slabFrom: applicableSlab?.fromAmount ?? 0,
      slabTo: applicableSlab?.toAmount ?? 0,
      nextSlabThreshold,
    });

    if (!applicableSlab) {
      errors.push(
        `No commission slab found for ${employee.name} in ${city} ` +
        `covering sales of ${formatCurrency(totalSales)}`
      );
      return;
    }

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

    commissions.push({
      id: `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      salesperson: salespersonId,
      salespersonName: employee.name,
      city,
      month,
      totalSales,
      invoiceCount: spInvoices.length,
      appliedSlabFrom: applicableSlab.fromAmount,
      appliedSlabTo: applicableSlab.toAmount,
      commissionPercentage: applicableSlab.commissionPercentage,
      calculatedCommissionAmount: commissionAmount,
      status: 'Calculated',
      calculatedBy,
      calculatedAt: new Date().toISOString(),
      isLocked: false,
    });
  });

  const totalSales = commissions.reduce((s, c) => s + c.totalSales, 0);
  const totalCommission = commissions.reduce((s, c) => s + c.calculatedCommissionAmount, 0);

  return {
    commissions,
    errors,
    summary: {
      totalSalespeople: commissions.length,
      totalSales,
      totalCommission,
      totalInvoicesUsed: relevantInvoices.length,
    },
    breakdowns,
  };
}

// ─── ViewModel ───────────────────────────────────────────────────────────────

interface UseCommissionCalculationViewModelReturn {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  commissionData: Commission[];
  calculationErrors: string[];
  summary: {
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
    totalInvoicesUsed: number;
  } | null;
  invoiceBreakdowns: SalespersonInvoiceBreakdown[];
  expandedSalesperson: string | null;
  setExpandedSalesperson: (id: string | null) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isCalculating: boolean;
  isEditing: string | null;
  editValues: { percentage: number; amount: number };
  setEditValues: (values: { percentage: number; amount: number }) => void;
  calculateCommission: (invoices: InvoiceReference[], employees: EmployeeReference[]) => Promise<boolean>;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions: () => void;
  startEdit: (commission: Commission) => void;
  saveEdit: (commissionId: string) => void;
  cancelEdit: () => void;
  cancelCalculation: () => void;
  handleModalConfirm: () => Promise<void>;
  handleModalCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatMonth: (monthStr: string) => string;
  cities: readonly string[];
}

export function useCommissionCalculationViewModel(
  onCommissionsSaved: () => void
): UseCommissionCalculationViewModelReturn {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [commissionData, setCommissionData] = useState<Commission[]>([]);
  const [calculationErrors, setCalculationErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<{
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
    totalInvoicesUsed: number;
  } | null>(null);
  const [invoiceBreakdowns, setInvoiceBreakdowns] = useState<SalespersonInvoiceBreakdown[]>([]);
  const [expandedSalesperson, setExpandedSalesperson] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ percentage: 0, amount: 0 });

  const calculateCommission = useCallback(
    async (invoices: InvoiceReference[], employees: EmployeeReference[]): Promise<boolean> => {
      if (!selectedCity || !selectedMonth) {
        setCalculationErrors(['Please select both a city and a month']);
        return false;
      }

      setIsCalculating(true);
      setCalculationErrors([]);

      try {
        const slabs = await CommissionFirebaseService.fetchAllSlabs();

        const result = calculateCommissionsFromInvoices(
          selectedCity,
          selectedMonth,
          invoices,
          employees,
          slabs,
          'Admin'
        );

        setCommissionData(result.commissions);
        setCalculationErrors(result.errors);
        setSummary(result.summary);
        setInvoiceBreakdowns(result.breakdowns);

        if (result.commissions.length === 0) {
          return false;
        }

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

  const confirmSingleCommission = useCallback((commissionId: string) => {
    setCommissionData((prev) =>
      prev.map((c) =>
        c.id === commissionId
          ? {
              ...c,
              status: 'Confirmed' as const,
              confirmedBy: 'Admin',
              confirmedAt: new Date().toISOString(),
              isLocked: true,
            }
          : c
      )
    );
  }, []);

  const confirmAllCommissions = useCallback(() => {
    const now = new Date().toISOString();
    setCommissionData((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: now,
        isLocked: true,
      }))
    );
  }, []);

  const startEdit = useCallback((commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage ?? commission.commissionPercentage,
      amount: commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount,
    });
  }, []);

  const saveEdit = useCallback(
    (commissionId: string) => {
      setCommissionData((prev) =>
        prev.map((c) =>
          c.id === commissionId
            ? {
                ...c,
                overriddenCommissionPercentage: editValues.percentage,
                overriddenCommissionAmount: editValues.amount,
                status: 'Adjusted' as const,
              }
            : c
        )
      );
      setIsEditing(null);
    },
    [editValues]
  );

  const cancelEdit = useCallback(() => {
    setIsEditing(null);
    setEditValues({ percentage: 0, amount: 0 });
  }, []);

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

  // ─── KEY INTEGRATION: After saving commissions to Firestore, also update
  //     any existing salary record for the same employee+month by writing the
  //     commission amount onto it. If no salary record exists yet the amount
  //     is stored on the commission record; useSalaryFormViewModel will pick
  //     it up when the user opens the salary form for that employee+month.
  const handleModalConfirm = useCallback(async () => {
    try {
      const toSave = commissionData.map(({ id, ...rest }) => ({
        ...rest,
        status: 'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: new Date().toISOString(),
        isLocked: true,
      }));

      const savedCommissions = await CommissionFirebaseService.saveCommissions(toSave);

      // ── Link commission amounts to existing salary records ──────────────
      // For each confirmed commission, look for a salary record for the same
      // employee + salaryMonth and update its commission field.  We do this
      // silently — a missing salary record is not an error; the salary form
      // will auto-populate when the user creates/edits salary later.
      try {
        const allSalaries = await SalaryFirebaseService.fetchAllSalaries();

        const updatePromises = savedCommissions.map(async (commission) => {
          const commissionAmount =
            commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount;

          // Find matching regular salary for this employee + month
          const matchingSalary = allSalaries.find(
            (s) =>
              s.employeeId === commission.salesperson &&
              s.salaryMonth === commission.month &&
              s.subCategory === 'Employee salary'
          );

          if (matchingSalary) {
            await SalaryFirebaseService.updateSalary(matchingSalary.id, {
              commission: commissionAmount,
              // Recalculate netAmount
              netAmount: Math.max(
                0,
                (matchingSalary.baseSalary || 0) +
                  commissionAmount -
                  (matchingSalary.deductions || 0)
              ),
            });
          }
          // If no salary record yet, nothing to update — the salary form
          // will auto-fetch the commission amount from the commission record.
        });

        await Promise.allSettled(updatePromises);
      } catch (linkErr) {
        // Non-fatal: salary linking failure should not block commission save
        console.warn('⚠️ Could not link commissions to salary records:', linkErr);
      }
      // ── end salary linking ───────────────────────────────────────────────

      toast.success(
        `${toSave.length} commission(s) saved. Commission amounts will appear automatically on salary forms.`
      );
      setShowModal(false);
      resetState();
      onCommissionsSaved();
    } catch (error) {
      toast.error('Failed to save commissions to Firestore');
      console.error(error);
    }
  }, [commissionData, onCommissionsSaved, resetState]);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    resetState();
  }, [resetState]);

  return {
    selectedCity,
    setSelectedCity,
    selectedMonth,
    setSelectedMonth,
    commissionData,
    calculationErrors,
    summary,
    invoiceBreakdowns,
    expandedSalesperson,
    setExpandedSalesperson,
    showModal,
    setShowModal,
    isFullScreen,
    setIsFullScreen,
    isCalculating,
    isEditing,
    editValues,
    setEditValues,
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