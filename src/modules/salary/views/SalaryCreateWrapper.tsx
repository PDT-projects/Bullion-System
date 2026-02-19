// Salary Module - Wrapper Component
// SalaryCreateWrapper - Connects ViewModel to View for create page

import { useSalaryFormViewModel } from '../viewModels/useSalaryFormViewModel';
import { SalaryFormView } from './SalaryFormView';

interface SalaryCreateWrapperProps {
  type: 'regular' | 'advance';
}

export function SalaryCreateWrapper({ type }: SalaryCreateWrapperProps) {
  const viewModel = useSalaryFormViewModel({ mode: 'create', type });

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
