// Salary Module - Wrapper Component
// SalaryEditWrapper — fetches employees from Firestore

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

  const viewModel = useSalaryFormViewModel({ mode: 'edit', type: 'regular', employees, banks: [] });

  return (
    <SalaryFormView
      formData={viewModel.formData}
      transactions={viewModel.transactions}
      isValid={viewModel.isValid}
      errorMessage={viewModel.errorMessage}
      fieldErrors={viewModel.fieldErrors}
      isLoading={viewModel.isLoading}
      isEditMode={viewModel.isEditMode}
      pageTitle={viewModel.pageTitle}
      submitButtonText={viewModel.submitButtonText}
      employees={viewModel.employees}
      banks={viewModel.banks}
      selectedEmployee={viewModel.selectedEmployee}
      calculatedNetAmount={viewModel.calculatedNetAmount}
      onFieldChange={viewModel.onFieldChange}
      onTransactionChange={viewModel.onTransactionChange}
      onSubmit={viewModel.onSubmit}
      onCancel={viewModel.onCancel}
    />
  );
}