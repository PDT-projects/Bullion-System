// Salary Module - Wrapper Component
// SalaryDashboardWrapper - Connects ViewModel to View for dashboard page

import { useSalaryDashboardViewModel } from '../viewModels/useSalaryDashboardViewModel';
import { SalaryDashboardView } from './SalaryDashboardView';

export function SalaryDashboardWrapper() {
  const viewModel = useSalaryDashboardViewModel();

  return <SalaryDashboardView {...viewModel} />;
}
