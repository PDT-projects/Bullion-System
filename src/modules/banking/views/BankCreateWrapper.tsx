// Banking Module - Bank Create Wrapper
// Connects ViewModel to View for create bank page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank } from '../../../App';
import { useBankFormViewModel } from '../viewModels/useBankFormViewModel';
import { BankFormView } from './BankFormView';

export const BankCreateWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const viewModel = useBankFormViewModel({ banks, setBanks, mode: 'create' });

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
