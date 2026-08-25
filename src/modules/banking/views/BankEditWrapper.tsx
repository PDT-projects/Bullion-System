// Banking Module - Bank Edit Wrapper

import React from 'react';
import { useBankFormViewModel } from '../viewModels/useBankFormViewModel';
import { BankFormView } from './BankFormView';

export const BankEditWrapper: React.FC = () => {
  const viewModel = useBankFormViewModel({ mode: 'edit' });
  return (
    <BankFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
      isSaving={viewModel.isSaving}
      isEditMode={viewModel.isEditMode}
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