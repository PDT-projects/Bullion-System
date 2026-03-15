// Salary Module - Wrapper Component
// SalaryDeleteWrapper

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