// Commission Calculation Wrapper - Connects ViewModel to View

import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import { CommissionCalculationView } from './CommissionCalculationView';

interface CommissionCalculationWrapperProps {
  employees: any[];
  invoices: any[];
  onCommissionsSaved: () => void;
}

export function CommissionCalculationWrapper({ 
  employees, 
  invoices, 
  onCommissionsSaved 
}: CommissionCalculationWrapperProps) {
  const {
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
    handleModalConfirm,
    handleModalCancel,
    formatCurrency,
    formatMonth,
    cities
  } = useCommissionCalculationViewModel(onCommissionsSaved);

  // Wrapper for calculate that passes invoices and employees
  const handleCalculate = () => {
    return calculateCommission(invoices, employees);
  };

  return (
    <CommissionCalculationView
      selectedCity={selectedCity}
      setSelectedCity={setSelectedCity}
      selectedMonth={selectedMonth}
      setSelectedMonth={setSelectedMonth}
      commissionData={commissionData}
      calculationErrors={calculationErrors}
      summary={summary}
      showModal={showModal}
      setShowModal={setShowModal}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
      isCalculating={isCalculating}
      isEditing={isEditing}
      editValues={editValues}
      setEditValues={setEditValues}
      calculateCommission={handleCalculate}
      confirmSingleCommission={confirmSingleCommission}
      confirmAllCommissions={confirmAllCommissions}
      startEdit={startEdit}
      saveEdit={saveEdit}
      cancelEdit={cancelEdit}
      handleModalConfirm={handleModalConfirm}
      handleModalCancel={handleModalCancel}
      formatCurrency={formatCurrency}
      formatMonth={formatMonth}
      cities={cities}
      employees={employees}
    />
  );
}
