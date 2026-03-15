// Banking Module - Cash Create Wrapper

import React from 'react';
import { useCashFormViewModel } from '../viewModels/useCashFormViewModel';
import { CashFormView } from './CashFormView';

export const CashCreateWrapper: React.FC = () => {
  const viewModel = useCashFormViewModel();
  return (
    <CashFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
      isSaving={viewModel.isSaving}
      pageTitle={viewModel.pageTitle}
      submitButtonText={viewModel.submitButtonText}
      availableLocations={viewModel.availableLocations}
      setFormField={viewModel.setFormField}
      clearFieldError={viewModel.clearFieldError}
      handleSubmit={viewModel.handleSubmit}
      handleCancel={viewModel.handleCancel}
      formatCurrency={viewModel.formatCurrency}
      isValid={viewModel.isValid}
    />
  );
};