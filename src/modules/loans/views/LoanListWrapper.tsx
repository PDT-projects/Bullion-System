/**
 * Loan List Wrapper
 * Connects list ViewModel to View.
 */

import React from 'react';
import { useLoanListViewModel } from '../viewModels/useLoanListViewModel';
import { LoanListView } from './LoanListView';

export const LoanListWrapper: React.FC = () => {
  const vm = useLoanListViewModel();

  return (
    <LoanListView
      loans={vm.loans}
      filteredLoans={vm.filteredLoans}
      isLoading={vm.isLoading}
      error={vm.error}
      filters={vm.filters}
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