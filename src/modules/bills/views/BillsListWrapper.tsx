// Bills Module - Wrapper Component
// BillsListWrapper

import React from 'react';
import { useBillsListViewModel } from '../viewModels/useBillsListViewModel';
import { BillsListView } from './BillsListView';

export const BillsListWrapper: React.FC = () => {
  const vm = useBillsListViewModel();
  return (
    <BillsListView
      bills={vm.bills}
      allBills={vm.allBills}
      filters={vm.filters}
      showFilters={vm.showFilters}
      activeFilterCount={vm.activeFilterCount}
      viewingBill={vm.viewingBill}
      viewingSlip={vm.viewingSlip}
      isLoading={vm.isLoading}
      stats={vm.stats}
      setFilter={vm.setFilter}
      clearFilters={vm.clearFilters}
      toggleFilters={vm.toggleFilters}
      setViewingBill={vm.setViewingBill}
      setViewingSlip={vm.setViewingSlip}
      handleDelete={vm.handleDelete}
      handleAdd={vm.handleAdd}
      handlePrint={vm.handlePrint}
      getCategoryColor={vm.getCategoryColor}
      getCategoryIconName={vm.getCategoryIconName}
    />
  );
};