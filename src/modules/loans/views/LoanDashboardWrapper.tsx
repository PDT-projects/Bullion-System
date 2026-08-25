/**
 * Loan Dashboard Wrapper
 * Connects dashboard ViewModel to View.
 * Currency: AED (UAE Dirham)
 */

import React from 'react';
import { useLoanDashboardViewModel } from '../viewModels/useLoanDashboardViewModel';
import { LoanDashboardView } from './LoanDashboardView';

export const LoanDashboardWrapper: React.FC = () => {
  const vm = useLoanDashboardViewModel();

  return (
    <LoanDashboardView
      isLoading={vm.isLoading}
      error={vm.error}
      statistics={vm.statistics}
      totalReceivable={vm.totalReceivable}
      totalPayable={vm.totalPayable}
      netPosition={vm.netPosition}
      overdueCount={vm.overdueCount}
      upcomingCount={vm.upcomingCount}
      dashboardCards={vm.dashboardCards}
      quickActions={vm.quickActions}
      onRefresh={vm.refreshData}
      onNavigateToAll={vm.navigateToAllLoans}
      onNavigateToPayable={vm.navigateToPayableLoans}
      onNavigateToReceivable={vm.navigateToReceivableLoans}
      onNavigateToOverdue={vm.navigateToOverdueLoans}
      onCreatePayable={vm.navigateToCreatePayable}
      onCreateReceivable={vm.navigateToCreateReceivable}
    />
  );
};