// Bills Module - Wrapper Component
// BillsCreateWrapper

import React from 'react';
import { useBillsFormViewModel } from '../viewModels/useBillsFormViewModel';
import { BillsFormView } from './BillsFormView';

export const BillsCreateWrapper: React.FC = () => {
  const vm = useBillsFormViewModel();
  return (
    <BillsFormView
      formData={vm.formData}
      billTransactions={vm.billTransactions}
      isEditing={vm.isEditing}
      isSubmitting={vm.isSubmitting}
      errors={vm.errors}
      predefinedVendors={vm.predefinedVendors}
      branches={vm.branches}
      banks={vm.banks}
      allBillCategories={vm.allBillCategories}
      onAddBillCategory={vm.onAddBillCategory}
      onAddBranch={vm.onAddBranch}
      setFormField={vm.setFormField}
      addBillTransaction={vm.addBillTransaction}
      removeBillTransaction={vm.removeBillTransaction}
      updateBillTransaction={vm.updateBillTransaction}
      handleImageUpload={vm.handleImageUpload}
      handleSubmit={vm.handleSubmit}
      handleCancel={vm.handleCancel}
      calculateTotal={vm.calculateTotal}
      currencyRates={vm.currencyRates}
    />
  );
};