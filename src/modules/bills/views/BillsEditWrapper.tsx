// Bills Module - Wrapper Component
// Connects ViewModel to View for Edit page

import React from 'react';
import { useBillsFormViewModel } from '../viewModels/useBillsFormViewModel';
import { BillsFormView } from './BillsFormView';

export const BillsEditWrapper: React.FC = () => {
  const viewModel = useBillsFormViewModel();

  return (
    <BillsFormView
      formData={viewModel.formData}
      billTransactions={viewModel.billTransactions}
      isEditing={viewModel.isEditing}
      isSubmitting={viewModel.isSubmitting}
      errors={viewModel.errors}
      predefinedVendors={viewModel.predefinedVendors}
      companies={viewModel.companies}
      banks={viewModel.banks}
      setFormField={viewModel.setFormField}
      addBillTransaction={viewModel.addBillTransaction}
      removeBillTransaction={viewModel.removeBillTransaction}
      updateBillTransaction={viewModel.updateBillTransaction}
      handleImageUpload={viewModel.handleImageUpload}
      handleSubmit={viewModel.handleSubmit}
      handleCancel={viewModel.handleCancel}
      calculateTotal={viewModel.calculateTotal}
    />
  );
};
