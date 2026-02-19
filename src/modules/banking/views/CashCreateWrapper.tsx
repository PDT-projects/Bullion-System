// Banking Module - Cash Create Wrapper
// Connects ViewModel to View for create cash transaction page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CashTransaction } from '../models/types';
import { useCashFormViewModel } from '../viewModels/useCashFormViewModel';
import { CashFormView } from './CashFormView';

export const CashCreateWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { cashTransactions, setCashTransactions } = useOutletContext<{
    cashTransactions: CashTransaction[];
    setCashTransactions: (transactions: CashTransaction[]) => void;
  }>();

  const viewModel = useCashFormViewModel({ cashTransactions, setCashTransactions });

  return (
    <CashFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
      pageTitle={viewModel.pageTitle}
      submitButtonText={viewModel.submitButtonText}
      setFormField={viewModel.setFormField}
      clearFieldError={viewModel.clearFieldError}
      handleSubmit={viewModel.handleSubmit}
      handleCancel={viewModel.handleCancel}
      formatCurrency={viewModel.formatCurrency}
      isValid={viewModel.isValid}
    />
  );
};
