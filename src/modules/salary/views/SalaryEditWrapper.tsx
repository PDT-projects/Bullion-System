// Salary Module - Wrapper Component
// SalaryEditWrapper — fetches employees from Firestore, banks fetched internally by VM

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSalaryFormViewModel } from '../viewModels/useSalaryFormViewModel';
import { SalaryFormView } from './SalaryFormView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';

export function SalaryEditWrapper() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(setEmployees)
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const vm = useSalaryFormViewModel({ mode: 'edit', type: 'regular', employees });

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
      advanceAvailableThisMonth={vm.advanceAvailableThisMonth}
      regularAlreadyPaid={vm.regularAlreadyPaid}
      regularAlreadyPaidAmount={vm.regularAlreadyPaidAmount}
      remainingSalaryToPay={vm.remainingSalaryToPay}
      isEffectivelyAdvance={vm.isEffectivelyAdvance}
      // Commission auto-fill props (edit mode: isCommissionAutoFilled=false,
      // so the badge won't show — existing data is preserved as-is)
      confirmedCommissionAmount={confirmedCommissionAmount}
      isCommissionAutoFilled={vm.isCommissionAutoFilled}
      commissionSource={commissionSource}
      // Loan deduction props (loan section hidden in edit mode via showLoanSection
      // but still passed so the net amount summary line renders correctly)
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