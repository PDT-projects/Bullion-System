// Salary Module - Wrapper Component
// SalaryDeleteWrapper - Connects ViewModel to View for delete page

import { useSalaryDeleteViewModel } from '../viewModels/useSalaryDeleteViewModel';
import { SalaryDeleteView } from './SalaryDeleteView';

export function SalaryDeleteWrapper() {
  const viewModel = useSalaryDeleteViewModel();

  return (
    <SalaryDeleteView
      salary={viewModel.salary}
      isLoading={viewModel.isLoading}
      onDelete={viewModel.onDelete}
      onCancel={viewModel.onCancel}
    />
  );
}
