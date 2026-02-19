// Commission Calculation ViewModel

import { useState, useCallback } from 'react';
import type { Commission, CommissionCalculationResult } from '../models/types';
import {
  calculateCommissions,
  saveCalculatedCommissions,
  confirmCommission,
  updateCommission,
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  CITIES
} from '../models/commissionService';

interface UseCommissionCalculationViewModelReturn {
  // Selection state
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  
  // Calculation results
  commissionData: Commission[];
  calculationErrors: string[];
  summary: {
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
  } | null;
  
  // UI state
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isCalculating: boolean;
  isEditing: string | null;
  editValues: {
    percentage: number;
    amount: number;
  };
  setEditValues: (values: { percentage: number; amount: number }) => void;

  
  // Actions
  calculateCommission: (invoices: any[], employees: any[]) => boolean;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions: () => void;
  startEdit: (commission: Commission) => void;
  saveEdit: (commissionId: string) => void;
  cancelEdit: () => void;
  cancelCalculation: () => void;
  handleModalConfirm: () => void;
  handleModalCancel: () => void;
  
  // Utils
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

  // Calculate commission
  const calculateCommission = useCallback((invoices: any[], employees: any[]): boolean => {
    if (!selectedCity || !selectedMonth) {
      setCalculationErrors(['Please select both city and month']);
      return false;
    }

    setIsCalculating(true);
    setCalculationErrors([]);

    try {
      const result: CommissionCalculationResult = calculateCommissions(
        selectedCity,
        selectedMonth,
        invoices,
        employees,
        'Admin' // TODO: Get from auth context
      );

      setCommissionData(result.commissions);
      setCalculationErrors(result.errors);
      setSummary(result.summary);

      if (result.commissions.length === 0) {
        setCalculationErrors(prev => [
          ...prev,
          'No sales data found for the selected city and month'
        ]);
        setIsCalculating(false);
        return false;
      }

      setShowModal(true);
      setIsCalculating(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      setCalculationErrors([errorMessage]);
      setIsCalculating(false);
      return false;
    }
  }, [selectedCity, selectedMonth]);

  // Confirm single commission
  const confirmSingleCommission = useCallback((commissionId: string) => {
    try {
      const updated = confirmCommission(commissionId, 'Admin');
      
      setCommissionData(prev => 
        prev.map(c => c.id === commissionId ? updated : c)
      );
    } catch (error) {
      console.error('Error confirming commission:', error);
    }
  }, []);

  // Confirm all commissions
  const confirmAllCommissions = useCallback(() => {
    try {
      const confirmed = commissionData.map(commission => 
        confirmCommission(commission.id, 'Admin')
      );
      
      setCommissionData(confirmed);
    } catch (error) {
      console.error('Error confirming all commissions:', error);
    }
  }, [commissionData]);

  // Start editing
  const startEdit = useCallback((commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage || commission.commissionPercentage,
      amount: commission.overriddenCommissionAmount || commission.calculatedCommissionAmount
    });
  }, []);

  // Save edit
  const saveEdit = useCallback((commissionId: string) => {
    try {
      const updated = updateCommission({
        id: commissionId,
        overriddenCommissionPercentage: editValues.percentage,
        overriddenCommissionAmount: editValues.amount
      });
      
      setCommissionData(prev => 
        prev.map(c => c.id === commissionId ? updated : c)
      );
      setIsEditing(null);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  }, [editValues]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setIsEditing(null);
    setEditValues({ percentage: 0, amount: 0 });
  }, []);

  // Cancel calculation
  const cancelCalculation = useCallback(() => {
    setCommissionData([]);
    setSelectedCity('');
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
  }, []);

  // Handle modal confirm
  const handleModalConfirm = useCallback(() => {
    try {
      // Confirm all commissions
      const confirmed = commissionData.map(commission => ({
        ...commission,
        status: 'Confirmed' as const,
        confirmedBy: 'Admin',
        confirmedAt: new Date().toISOString(),
        isLocked: true
      }));

      // Save to storage
      saveCalculatedCommissions(confirmed);
      
      setShowModal(false);
      setCommissionData([]);
      setSelectedCity('');
      setSelectedMonth(getCurrentMonth());
      setCalculationErrors([]);
      setSummary(null);
      
      onCommissionsSaved();
    } catch (error) {
      console.error('Error saving commissions:', error);
    }
  }, [commissionData, onCommissionsSaved]);

  // Handle modal cancel
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
