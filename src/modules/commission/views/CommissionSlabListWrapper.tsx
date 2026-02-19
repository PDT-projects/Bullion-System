// Commission Slab List Wrapper - Connects ViewModel to View

import { useCommissionSlabListViewModel } from '../viewModels/useCommissionSlabListViewModel';
import { useCommissionSlabFormViewModel } from '../viewModels/useCommissionSlabFormViewModel';
import { CommissionSlabListView } from './CommissionSlabListView';
import { CommissionSlabFormView } from './CommissionSlabFormView';

interface CommissionSlabListWrapperProps {
  employees: any[];
}

export function CommissionSlabListWrapper({ employees }: CommissionSlabListWrapperProps) {
  // List ViewModel
  const {
    slabs,
    filteredSlabs,
    isLoading,
    filter,
    setFilter,
    clearFilters,
    refreshSlabs,
    handleDelete,
    totalSlabs,
    getSalespersonName,
    formatCurrency
  } = useCommissionSlabListViewModel();

  // Form ViewModel
  const {
    formData,
    setFormData,
    isModalOpen,
    setIsModalOpen,
    isFullScreen,
    setIsFullScreen,
    isSubmitting,
    errors,
    editingSlab,
    startEdit,
    handleAdd,
    handleSave,
    cities
  } = useCommissionSlabFormViewModel(refreshSlabs, employees);

  // Handle edit with proper typing
  const onEdit = (slab: any) => {
    startEdit(slab);
  };

  return (
    <>
      <CommissionSlabListView
        slabs={slabs}
        filteredSlabs={filteredSlabs}
        isLoading={isLoading}
        filter={filter}
        setFilter={setFilter}
        clearFilters={clearFilters}
        onAdd={handleAdd}
        onEdit={onEdit}
        onDelete={handleDelete}
        totalSlabs={totalSlabs}
        getSalespersonName={(id) => getSalespersonName(id, employees)}
        formatCurrency={formatCurrency}
        employees={employees}
      />
      
      <CommissionSlabFormView
        formData={formData}
        setFormData={setFormData}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isSubmitting={isSubmitting}
        errors={errors}
        editingSlab={editingSlab}
        handleSave={handleSave}
        cities={cities}
        employees={employees}
      />
    </>
  );
}
