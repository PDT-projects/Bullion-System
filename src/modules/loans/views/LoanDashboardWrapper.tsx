/**
 * Loan Dashboard Wrapper
 * 
 * Container component that connects the dashboard view to its ViewModel.
 */

import React from 'react';
import { useLoanDashboardViewModel } from '../viewModels/useLoanDashboardViewModel';
import { LoanDashboardView } from './LoanDashboardView';
import type { Bank, Employee } from '../models/types';

interface LoanDashboardWrapperProps {
  banks: Bank[];
  employees: Employee[];
}

export const LoanDashboardWrapper: React.FC<LoanDashboardWrapperProps> = ({
  banks,
  employees
}) => {
  const viewModel = useLoanDashboardViewModel(banks, employees);

  return (
    <LoanDashboardView
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      statistics={viewModel.statistics}
      totalReceivable={viewModel.totalReceivable}
      totalPayable={viewModel.totalPayable}
      netPosition={viewModel.netPosition}
      overdueCount={viewModel.overdueCount}
      upcomingCount={viewModel.upcomingCount}
      dashboardCards={viewModel.dashboardCards}
      quickActions={viewModel.quickActions}
      onRefresh={viewModel.refreshData}
      onNavigateToAll={viewModel.navigateToAllLoans}
      onNavigateToPayable={viewModel.navigateToPayableLoans}
      onNavigateToReceivable={viewModel.navigateToReceivableLoans}
      onNavigateToOverdue={viewModel.navigateToOverdueLoans}
      onCreatePayable={viewModel.navigateToCreatePayable}
      onCreateReceivable={viewModel.navigateToCreateReceivable}
    />
  );
};
