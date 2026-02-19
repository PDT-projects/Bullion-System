// Bills Module - Wrapper Component
// Connects ViewModel to View for List page

import React from 'react';
import { useBillsListViewModel } from '../viewModels/useBillsListViewModel';
import { BillsListView } from './BillsListView';

export const BillsListWrapper: React.FC = () => {
  const viewModel = useBillsListViewModel();

  return (
    <BillsListView
      bills={viewModel.bills}
      allBills={viewModel.allBills}
      filters={viewModel.filters}
      showFilters={viewModel.showFilters}
      activeFilterCount={viewModel.activeFilterCount}
      viewingBill={viewModel.viewingBill}
      viewingSlip={viewModel.viewingSlip}
      stats={viewModel.stats}
      setFilter={viewModel.setFilter}
      clearFilters={viewModel.clearFilters}
      toggleFilters={viewModel.toggleFilters}
      setViewingBill={viewModel.setViewingBill}
      setViewingSlip={viewModel.setViewingSlip}
      handleDelete={viewModel.handleDelete}
      handleAdd={viewModel.handleAdd}
      handlePrint={viewModel.handlePrint}
      getCategoryColor={viewModel.getCategoryColor}
      getCategoryIconName={viewModel.getCategoryIconName}
    />
  );
};
