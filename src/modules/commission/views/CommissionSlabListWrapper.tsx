// Commission Slab List Wrapper — wires ViewModels, passes employees to handleSave

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionSlabListViewModel } from '../viewModels/useCommissionSlabListViewModel';
import { useCommissionSlabFormViewModel } from '../viewModels/useCommissionSlabFormViewModel';
import { CommissionSlabListView } from './CommissionSlabListView';
import { CommissionSlabFormView } from './CommissionSlabFormView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';

export function CommissionSlabListWrapper() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(setEmployees)
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const listVM = useCommissionSlabListViewModel();
  const formVM = useCommissionSlabFormViewModel(listVM.refreshSlabs);

  return (
    <>
      <CommissionSlabListView
        slabs={listVM.slabs}
        filteredSlabs={listVM.filteredSlabs}
        isLoading={listVM.isLoading}
        filter={listVM.filter}
        setFilter={listVM.setFilter}
        clearFilters={listVM.clearFilters}
        onAdd={formVM.handleAdd}
        onEdit={formVM.startEdit}
        onDelete={listVM.handleDelete}
        totalSlabs={listVM.totalSlabs}
        getSalespersonName={id => listVM.getSalespersonName(id, employees)}
        formatCurrency={listVM.formatCurrency}
        employees={employees}
        currencyRates={listVM.currencyRates}
        isFetchingRates={listVM.isFetchingRates}
        lastRatesFetchAt={listVM.lastRatesFetchAt}
        displayCurrencies={listVM.displayCurrencies}
        setDisplayCurrencies={listVM.setDisplayCurrencies}
        formatInCurrency={listVM.formatInCurrency}
      />

      <CommissionSlabFormView
        formData={formVM.formData}
        setFormData={formVM.setFormData}
        isModalOpen={formVM.isModalOpen}
        setIsModalOpen={formVM.setIsModalOpen}
        isFullScreen={formVM.isFullScreen}
        setIsFullScreen={formVM.setIsFullScreen}
        isSubmitting={formVM.isSubmitting}
        errors={formVM.errors}
        editingSlab={formVM.editingSlab}
        // Pass employees so the ALL fan-out and location list work
        handleSave={() => formVM.handleSave(listVM.slabs, employees)}
        allLocations={formVM.allLocations}
        employees={employees}
        currencyRates={formVM.currencyRates}
        isFetchingRates={formVM.isFetchingRates}
        lastRatesFetchAt={formVM.lastRatesFetchAt}
      />
    </>
  );
}