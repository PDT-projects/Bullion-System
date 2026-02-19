// Salary Module - Wrapper Component
// SalaryEditWrapper - Connects ViewModel to View for edit page

import { useSalaryFormViewModel } from '../viewModels/useSalaryFormViewModel';
import { SalaryFormView } from './SalaryFormView';

export function SalaryEditWrapper() {
  // Determine type from the existing salary record in the ViewModel
  const viewModel = useSalaryFormViewModel({ mode: 'edit', type: 'regular' });

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
