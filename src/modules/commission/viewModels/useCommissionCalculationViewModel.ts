// Commission Calculation ViewModel — saves results to Firestore

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Commission, CommissionCalculationResult, InvoiceReference, EmployeeReference } from '../models/types';
import {
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  CITIES
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

// ─── Local calculation helper (replaces the one in commissionService to fix city matching) ─────

function calculateCommissionsFromInvoices(
  city: string,
  month: string,
  invoices: InvoiceReference[],
  employees: EmployeeReference[],
  slabs: any[],
  calculatedBy: string = 'Admin'
): CommissionCalculationResult {
  const errors: string[] = [];

  // 1. Filter invoices: correct city (salespersonLocation), correct month, Paid only
  const relevantInvoices = invoices.filter((inv) => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson) return false;
    // city match — inv.customerCity is already mapped to salespersonLocation in the wrapper
    if (inv.customerCity !== city) return false;
    // month match
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
      summary: { totalSalespeople: 0, totalSales: 0, totalCommission: 0 }
    };
  }

  // 2. Aggregate total sales per salesperson
  const salesBySalesperson: Record<string, number> = {};
  relevantInvoices.forEach((inv) => {
    salesBySalesperson[inv.salesperson!] =
      (salesBySalesperson[inv.salesperson!] || 0) + inv.totalAmount;
  });

  // 3. For each salesperson find applicable slab and calculate commission
  const commissions: Commission[] = [];

  Object.entries(salesBySalesperson).forEach(([salespersonId, totalSales]) => {
    const employee = employees.find((e) => e.id === salespersonId);
    if (!employee) {
      errors.push(`Employee record not found for ID: ${salespersonId}`);
      return;
    }

    // Find the slab that covers this salesperson + city + sales range
    const applicableSlab = slabs.find(
      (slab) =>
        slab.salesperson === salespersonId &&
        slab.city === city &&
        totalSales >= slab.fromAmount &&
        totalSales <= slab.toAmount
    );

    if (!applicableSlab) {
      errors.push(
        `No commission slab defined for ${employee.name} in ${city} ` +
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
    },
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
  } | null;
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
  } | null>(null);
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
        // Always fetch fresh slabs from Firestore
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
  }, []);

  const cancelCalculation = useCallback(() => resetState(), [resetState]);

  const handleModalConfirm = useCallback(async () => {
    try {
      // Strip temp IDs — Firestore will generate real ones
      const toSave = commissionData.map(({ id, ...rest }) => ({
        ...rest,
        status: 'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: new Date().toISOString(),
        isLocked: true,
      }));

      await CommissionFirebaseService.saveCommissions(toSave);

      toast.success(`${toSave.length} commission(s) saved successfully`);
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