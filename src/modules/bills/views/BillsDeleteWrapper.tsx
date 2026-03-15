// Bills Module - Wrapper Component
// BillsDeleteWrapper

import React from 'react';
import { useBillsDeleteViewModel } from '../viewModels/useBillsDeleteViewModel';
import { BillsDeleteView } from './BillsDeleteView';

export const BillsDeleteWrapper: React.FC = () => {
  const vm = useBillsDeleteViewModel();
  return (
    <BillsDeleteView
      bill={vm.bill}
      isDeleting={vm.isDeleting}
      categoryColor={vm.categoryColor}
      handleConfirmDelete={vm.handleConfirmDelete}
      handleCancel={vm.handleCancel}
    />
  );
};