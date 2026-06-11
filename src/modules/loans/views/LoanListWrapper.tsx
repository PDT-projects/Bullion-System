/**
 * Loan List Wrapper
 * Connects list ViewModel to View.
 * Currency: AED (UAE Dirham)
 *
 * Change: accepts an optional `defaultType` prop.
 * Pass defaultType="Payable"    → Payable Loans screen
 * Pass defaultType="Receivable" → Receivable Loans screen
 * No prop                       → All Loans screen
 */

import React from 'react';
import { useLoanListViewModel } from '../viewModels/useLoanListViewModel';
import { LoanListView } from './LoanListView';
import type { LoanType } from '../models/types';

interface LoanListWrapperProps {
  defaultType?: LoanType;
}

export const LoanListWrapper: React.FC<LoanListWrapperProps> = ({ defaultType }) => {
  const vm = useLoanListViewModel(defaultType);

  return (
    <LoanListView
      loans={vm.loans}
      filteredLoans={vm.filteredLoans}
      isLoading={vm.isLoading}
      error={vm.error}
      filters={vm.filters}
      isTypeLocked={vm.isTypeLocked}
      defaultType={defaultType}
      setSearchTerm={vm.setSearchTerm}
      setTypeFilter={vm.setTypeFilter}
      setStatusFilter={vm.setStatusFilter}
      setCategoryFilter={vm.setCategoryFilter}
      clearFilters={vm.clearFilters}
      sortField={vm.sortField}
      sortOrder={vm.sortOrder}
      setSortField={vm.setSortField}
      toggleSortOrder={vm.toggleSortOrder}
      currentPage={vm.currentPage}
      pageSize={vm.pageSize}
      totalPages={vm.totalPages}
      setPage={vm.setPage}
      setPageSize={vm.setPageSize}
      selectedLoans={vm.selectedLoans}
      toggleSelection={vm.toggleSelection}
      selectAll={vm.selectAll}
      clearSelection={vm.clearSelection}
      onRefresh={vm.refreshData}
      onCreate={vm.navigateToCreate}
      onEdit={vm.navigateToEdit}
      onView={vm.navigateToView}
      onDelete={vm.handleDelete}
      onPayment={vm.navigateToPayment}
      onExport={vm.handleExport}
      onBulkDelete={vm.handleBulkDelete}
      totalCount={vm.totalCount}
      totalAmount={vm.totalAmount}
    />
  );
};