// Banking Module - Transfer Create Wrapper

import React from 'react';
import { useTransferFormViewModel } from '../viewModels/useTransferFormViewModel';
import { TransferFormView } from './TransferFormView';

export const TransferCreateWrapper: React.FC = () => {
  const viewModel = useTransferFormViewModel();
  return (
    <TransferFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
      isSaving={viewModel.isSaving}
      pageTitle={viewModel.pageTitle}
      submitButtonText={viewModel.submitButtonText}
      banks={viewModel.banks}
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