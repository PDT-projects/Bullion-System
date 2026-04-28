// Salary Module - Wrapper Component
// SalaryCreateWrapper — fetches employees from Firestore, banks fetched internally by VM

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSalaryFormViewModel } from '../viewModels/useSalaryFormViewModel';
import { SalaryFormView } from './SalaryFormView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';

interface SalaryCreateWrapperProps {
  type: 'regular' | 'advance';
}

export function SalaryCreateWrapper({ type }: SalaryCreateWrapperProps) {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(setEmployees)
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const vm = useSalaryFormViewModel({ mode: 'create', type, employees });

  // Derive commission props that SalaryFormView expects from commissionResult
  const confirmedCommissionAmount = vm.commissionResult?.commissionAmount ?? 0;
  const commissionSource = vm.commissionResult?.salaryMonth ?? '';

  return (
    <SalaryFormView
      formData={vm.formData}
      transactions={vm.transactions}
      isValid={vm.isValid}
      errorMessage={vm.errorMessage}
      fieldErrors={vm.fieldErrors}
      isLoading={vm.isLoading}
      isEditMode={vm.isEditMode}
      pageTitle={vm.pageTitle}
      submitButtonText={vm.submitButtonText}
      employees={vm.employees}
      banks={vm.banks}
      selectedEmployee={vm.selectedEmployee}
      calculatedNetAmount={vm.calculatedNetAmount}
      advancePaidThisMonth={vm.advancePaidThisMonth}
      regularAlreadyPaid={vm.regularAlreadyPaid}
      regularAlreadyPaidAmount={vm.regularAlreadyPaidAmount}
      remainingSalaryToPay={vm.remainingSalaryToPay}
      isEffectivelyAdvance={vm.isEffectivelyAdvance}
      // Commission auto-fill props
      confirmedCommissionAmount={confirmedCommissionAmount}
      isCommissionAutoFilled={vm.isCommissionAutoFilled}
      commissionSource={commissionSource}
      // Loan deduction props
      employeeLoan={vm.employeeLoan}
      loanDeduction={vm.loanDeduction}
      isLoanLoading={vm.isLoanLoading}
      setLoanDeduction={vm.setLoanDeduction}
      onFieldChange={vm.onFieldChange}
      onTransactionChange={vm.onTransactionChange}
      onSubmit={vm.onSubmit}
      onCancel={vm.onCancel}
    />
  );
}