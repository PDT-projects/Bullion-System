// // Commission Slab List Wrapper - Connects ViewModel to View

// import { useCommissionSlabListViewModel } from '../viewModels/useCommissionSlabListViewModel';
// import { useCommissionSlabFormViewModel } from '../viewModels/useCommissionSlabFormViewModel';
// import { CommissionSlabListView } from './CommissionSlabListView';
// import { CommissionSlabFormView } from './CommissionSlabFormView';

// interface CommissionSlabListWrapperProps {
//   employees: any[];
// }

// export function CommissionSlabListWrapper({ employees }: CommissionSlabListWrapperProps) {
//   // List ViewModel
//   const {
//     slabs,
//     filteredSlabs,
//     isLoading,
//     filter,
//     setFilter,
//     clearFilters,
//     refreshSlabs,
//     handleDelete,
//     totalSlabs,
//     getSalespersonName,
//     formatCurrency
//   } = useCommissionSlabListViewModel();

//   // Form ViewModel
//   const {
//     formData,
//     setFormData,
//     isModalOpen,
//     setIsModalOpen,
//     isFullScreen,
//     setIsFullScreen,
//     isSubmitting,
//     errors,
//     editingSlab,
//     startEdit,
//     handleAdd,
//     handleSave,
//     cities
//   } = useCommissionSlabFormViewModel(refreshSlabs, employees);

//   // Handle edit with proper typing
//   const onEdit = (slab: any) => {
//     startEdit(slab);
//   };

//   return (
//     <>
//       <CommissionSlabListView
//         slabs={slabs}
//         filteredSlabs={filteredSlabs}
//         isLoading={isLoading}
//         filter={filter}
//         setFilter={setFilter}
//         clearFilters={clearFilters}
//         onAdd={handleAdd}
//         onEdit={onEdit}
//         onDelete={handleDelete}
//         totalSlabs={totalSlabs}
//         getSalespersonName={(id) => getSalespersonName(id, employees)}
//         formatCurrency={formatCurrency}
//         employees={employees}
//       />
      
//       <CommissionSlabFormView
//         formData={formData}
//         setFormData={setFormData}
//         isModalOpen={isModalOpen}
//         setIsModalOpen={setIsModalOpen}
//         isFullScreen={isFullScreen}
//         setIsFullScreen={setIsFullScreen}
//         isSubmitting={isSubmitting}
//         errors={errors}
//         editingSlab={editingSlab}
//         handleSave={handleSave}
//         cities={cities}
//         employees={employees}
//       />
//     </>
//   );
// }
// Commission Slab List Wrapper — fetches employees from Firestore

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
        getSalespersonName={(id) => listVM.getSalespersonName(id, employees)}
        formatCurrency={listVM.formatCurrency}
        employees={employees}
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
        handleSave={() => formVM.handleSave(listVM.slabs)}
        cities={formVM.cities}
        employees={employees}
      />
    </>
  );
}