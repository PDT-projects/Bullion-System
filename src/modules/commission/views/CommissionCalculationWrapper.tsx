// Commission Calculation Wrapper — fetches employees from Firestore

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import { CommissionCalculationView } from './CommissionCalculationView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';

interface CommissionCalculationWrapperProps {
  invoices?: any[];
  onCommissionsSaved?: () => void;
}

export function CommissionCalculationWrapper({
  invoices = [],
  onCommissionsSaved = () => {}
}: CommissionCalculationWrapperProps) {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(setEmployees)
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const vm = useCommissionCalculationViewModel(onCommissionsSaved);

  const handleCalculate = () => vm.calculateCommission(invoices, employees);

  return (
    <CommissionCalculationView
      selectedCity={vm.selectedCity}
      setSelectedCity={vm.setSelectedCity}
      selectedMonth={vm.selectedMonth}
      setSelectedMonth={vm.setSelectedMonth}
      commissionData={vm.commissionData}
      calculationErrors={vm.calculationErrors}
      summary={vm.summary}
      showModal={vm.showModal}
      setShowModal={vm.setShowModal}
      isFullScreen={vm.isFullScreen}
      setIsFullScreen={vm.setIsFullScreen}
      isCalculating={vm.isCalculating}
      isEditing={vm.isEditing}
      editValues={vm.editValues}
      setEditValues={vm.setEditValues}
      calculateCommission={handleCalculate}
      confirmSingleCommission={vm.confirmSingleCommission}
      confirmAllCommissions={vm.confirmAllCommissions}
      startEdit={vm.startEdit}
      saveEdit={vm.saveEdit}
      cancelEdit={vm.cancelEdit}
      handleModalConfirm={vm.handleModalConfirm}
      handleModalCancel={vm.handleModalCancel}
      formatCurrency={vm.formatCurrency}
      formatMonth={vm.formatMonth}
      cities={vm.cities}
      employees={employees}
    />
  );
}