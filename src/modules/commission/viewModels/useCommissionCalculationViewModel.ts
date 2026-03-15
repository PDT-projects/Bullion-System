// Commission Calculation ViewModel — saves results to Firestore

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Commission, CommissionCalculationResult } from '../models/types';
import {
  calculateCommissions,
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  CITIES
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

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
  calculateCommission: (invoices: any[], employees: any[]) => Promise<boolean>;
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

  const calculateCommission = useCallback(async (invoices: any[], employees: any[]): Promise<boolean> => {
    if (!selectedCity || !selectedMonth) {
      setCalculationErrors(['Please select both city and month']);
      return false;
    }

    setIsCalculating(true);
    setCalculationErrors([]);

    try {
      // Fetch slabs from Firestore for calculation
      const slabs = await CommissionFirebaseService.fetchAllSlabs();

      const result: CommissionCalculationResult = calculateCommissions(
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
        setCalculationErrors(prev => [
          ...prev,
          'No sales data found for the selected city and month'
        ]);
        return false;
      }

      setShowModal(true);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Calculation failed';
      setCalculationErrors([msg]);
      return false;
    } finally {
      setIsCalculating(false);
    }
  }, [selectedCity, selectedMonth]);

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

  const startEdit = useCallback((commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage || commission.commissionPercentage,
      amount: commission.overriddenCommissionAmount || commission.calculatedCommissionAmount
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

  const cancelCalculation = useCallback(() => {
    setCommissionData([]);
    setSelectedCity('');
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
  }, []);

  const handleModalConfirm = useCallback(async () => {
    try {
      const confirmed = commissionData.map(c => ({
        ...c,
        status: 'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: new Date().toISOString(),
        isLocked: true
      }));

      // Save to Firestore (strip the temp id, let Firestore generate real ones)
      const toSave = confirmed.map(({ id, ...rest }) => rest);
      await CommissionFirebaseService.saveCommissions(toSave);

      toast.success(`${confirmed.length} commission(s) saved successfully`);
      setShowModal(false);
      setCommissionData([]);
      setSelectedCity('');
      setSelectedMonth(getCurrentMonth());
      setCalculationErrors([]);
      setSummary(null);
      onCommissionsSaved();
    } catch (error) {
      toast.error('Failed to save commissions');
      console.error(error);
    }
  }, [commissionData, onCommissionsSaved]);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    setCommissionData([]);
    setSelectedCity('');
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
  }, []);

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
    cities: CITIES
  };
}