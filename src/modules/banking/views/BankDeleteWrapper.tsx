// Banking Module - Bank Delete Wrapper
// Connects ViewModel to View for delete bank page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank } from '../../../App';
import { useBankDeleteViewModel } from '../viewModels/useBankDeleteViewModel';
import { BankDeleteView } from './BankDeleteView';

export const BankDeleteWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const viewModel = useBankDeleteViewModel({ banks, setBanks });

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
