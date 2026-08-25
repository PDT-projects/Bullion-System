// Salary Module - Wrapper Component
// SalaryDashboardWrapper

import { useSalaryDashboardViewModel } from '../viewModels/useSalaryDashboardViewModel';
import { SalaryDashboardView } from './SalaryDashboardView';

export function SalaryDashboardWrapper() {
  const viewModel = useSalaryDashboardViewModel();
  return <SalaryDashboardView {...viewModel} />;
}