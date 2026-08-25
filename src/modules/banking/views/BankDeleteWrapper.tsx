// Banking Module - Bank Delete Wrapper

import React from 'react';
import { useBankDeleteViewModel } from '../viewModels/useBankDeleteViewModel';
import { BankDeleteView } from './BankDeleteView';

export const BankDeleteWrapper: React.FC = () => {
  const viewModel = useBankDeleteViewModel();
  return (
    <BankDeleteView
      bank={viewModel.bank}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      handleDelete={viewModel.handleDelete}
      handleCancel={viewModel.handleCancel}
      formatCurrency={viewModel.formatCurrency}
    />
  );
};