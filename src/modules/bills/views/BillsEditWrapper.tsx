// Bills Module - Wrapper Component
// BillsEditWrapper

import React from 'react';
import { useBillsFormViewModel } from '../viewModels/useBillsFormViewModel';
import { BillsFormView } from './BillsFormView';

export const BillsEditWrapper: React.FC = () => {
  const vm = useBillsFormViewModel();
  return (
    <BillsFormView
      formData={vm.formData}
      billTransactions={vm.billTransactions}
      isEditing={vm.isEditing}
      isSubmitting={vm.isSubmitting}
      errors={vm.errors}
      predefinedVendors={vm.predefinedVendors}
      companies={vm.companies}
      banks={vm.banks}
      setFormField={vm.setFormField}
      addBillTransaction={vm.addBillTransaction}
      removeBillTransaction={vm.removeBillTransaction}
      updateBillTransaction={vm.updateBillTransaction}
      handleImageUpload={vm.handleImageUpload}
      handleSubmit={vm.handleSubmit}
      handleCancel={vm.handleCancel}
      calculateTotal={vm.calculateTotal}
    />
  );
};