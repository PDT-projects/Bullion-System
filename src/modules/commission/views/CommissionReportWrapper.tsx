// Commission Report Wrapper - Connects ViewModel to View

import { useCommissionReportViewModel } from '../viewModels/useCommissionReportViewModel';
import { CommissionReportView } from './CommissionReportView';
import { CITIES } from '../models/commissionService';

interface CommissionReportWrapperProps {
  employees: any[];
}

export function CommissionReportWrapper({ employees }: CommissionReportWrapperProps) {
  const {
    commissions,
    filteredCommissions,
    isLoading,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    showFilters,
    setShowFilters,
    stats,
    refreshCommissions,
    exportToCSV,
    formatCurrency,
    formatMonth
  } = useCommissionReportViewModel();

  return (
    <CommissionReportView
      commissions={commissions}
      filteredCommissions={filteredCommissions}
      isLoading={isLoading}
      filters={filters}
      updateFilter={updateFilter}
      clearFilters={clearFilters}
      activeFilterCount={activeFilterCount}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      stats={stats}
      refreshCommissions={refreshCommissions}
      exportToCSV={exportToCSV}
      formatCurrency={formatCurrency}
      formatMonth={formatMonth}
      cities={CITIES}
      employees={employees}
    />
  );
}
