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
      // Commission auto-fill props (edit mode will have isCommissionAutoFilled=false
      // so the badge won't show — existing data is preserved as-is)
      confirmedCommissionAmount={vm.confirmedCommissionAmount}
      isCommissionAutoFilled={vm.isCommissionAutoFilled}
      commissionSource={vm.commissionSource}
      onFieldChange={vm.onFieldChange}
      onTransactionChange={vm.onTransactionChange}
      onSubmit={vm.onSubmit}
      onCancel={vm.onCancel}
    />
  );
}