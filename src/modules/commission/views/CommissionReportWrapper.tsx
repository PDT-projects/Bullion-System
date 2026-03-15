// Commission Report Wrapper — fetches employees from Firestore

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionReportViewModel } from '../viewModels/useCommissionReportViewModel';
import { CommissionReportView } from './CommissionReportView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { CITIES } from '../models/commissionService';

export function CommissionReportWrapper() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(setEmployees)
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const vm = useCommissionReportViewModel();

  return (
    <CommissionReportView
      commissions={vm.commissions}
      filteredCommissions={vm.filteredCommissions}
      isLoading={vm.isLoading}
      filters={vm.filters}
      updateFilter={vm.updateFilter}
      clearFilters={vm.clearFilters}
      activeFilterCount={vm.activeFilterCount}
      showFilters={vm.showFilters}
      setShowFilters={vm.setShowFilters}
      stats={vm.stats}
      refreshCommissions={vm.refreshCommissions}
      exportToCSV={vm.exportToCSV}
      formatCurrency={vm.formatCurrency}
      formatMonth={vm.formatMonth}
      cities={CITIES}
      employees={employees}
    />
  );
}