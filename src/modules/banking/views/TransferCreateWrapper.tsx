// Banking Module - Transfer Create Wrapper
// Connects ViewModel to View for create transfer page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank, BankTransfer } from '../../../App';
import { useTransferFormViewModel } from '../viewModels/useTransferFormViewModel';
import { TransferFormView } from './TransferFormView';

export const TransferCreateWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, setBanks, transfers, setTransfers } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
    transfers: BankTransfer[];
    setTransfers: (transfers: BankTransfer[]) => void;
  }>();

  const viewModel = useTransferFormViewModel({ banks, setBanks, transfers, setTransfers });

  return (
    <TransferFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
      pageTitle={viewModel.pageTitle}
      submitButtonText={viewModel.submitButtonText}
      banks={banks}
      availableBanks={viewModel.availableBanks}
      setFormField={viewModel.setFormField}
      clearFieldError={viewModel.clearFieldError}
      handleSubmit={viewModel.handleSubmit}
      handleCancel={viewModel.handleCancel}
      formatCurrency={viewModel.formatCurrency}
      isValid={viewModel.isValid}
    />
  );
};
