// Bills Module - Wrapper Component
// Connects ViewModel to View for Delete page

import React from 'react';
import { useBillsDeleteViewModel } from '../viewModels/useBillsDeleteViewModel';
import { BillsDeleteView } from './BillsDeleteView';

export const BillsDeleteWrapper: React.FC = () => {
  const viewModel = useBillsDeleteViewModel();

  return (
    <BillsDeleteView
      bill={viewModel.bill}
      isDeleting={viewModel.isDeleting}
      categoryColor={viewModel.categoryColor}
      handleConfirmDelete={viewModel.handleConfirmDelete}
      handleCancel={viewModel.handleCancel}
    />
  );
};
