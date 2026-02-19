/**
 * Loan List Wrapper
 * 
 * Container component that connects the loan list view to its ViewModel.
 */

import React from 'react';
import { useLoanListViewModel } from '../viewModels/useLoanListViewModel';
import { LoanListView } from './LoanListView';
import type { Bank, Employee, LoanType } from '../models/types';

interface LoanListWrapperProps {
  banks: Bank[];
  employees: Employee[];
  setBanks: (banks: Bank[]) => void;
  initialType?: LoanType;
}

export const LoanListWrapper: React.FC<LoanListWrapperProps> = ({
  banks,
  employees,
  setBanks,
  initialType
}) => {
  const viewModel = useLoanListViewModel(banks, setBanks, initialType);

  return (
    <LoanListView
      loans={viewModel.loans}
      filteredLoans={viewModel.filteredLoans}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      filters={viewModel.filters}
      setSearchTerm={viewModel.setSearchTerm}
      setTypeFilter={viewModel.setTypeFilter}
      setStatusFilter={viewModel.setStatusFilter}
      setCategoryFilter={viewModel.setCategoryFilter}
      clearFilters={viewModel.clearFilters}
      sortField={viewModel.sortField}
      sortOrder={viewModel.sortOrder}
      setSortField={viewModel.setSortField}
      toggleSortOrder={viewModel.toggleSortOrder}
      currentPage={viewModel.currentPage}
      pageSize={viewModel.pageSize}
      totalPages={viewModel.totalPages}
      setPage={viewModel.setPage}
      setPageSize={viewModel.setPageSize}
      selectedLoans={viewModel.selectedLoans}
      toggleSelection={viewModel.toggleSelection}
      selectAll={viewModel.selectAll}
      clearSelection={viewModel.clearSelection}
      onRefresh={viewModel.refreshData}
      onCreate={viewModel.navigateToCreate}
      onEdit={viewModel.navigateToEdit}
      onView={viewModel.navigateToView}
      onDelete={viewModel.handleDelete}
      onPayment={viewModel.navigateToPayment}
      onExport={viewModel.handleExport}
      onBulkDelete={viewModel.handleBulkDelete}
      totalCount={viewModel.totalCount}
      totalAmount={viewModel.totalAmount}
    />
  );
};
