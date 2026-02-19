// Banking Module - Bank Edit Wrapper
// Connects ViewModel to View for edit bank page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank } from '../../../App';
import { useBankFormViewModel } from '../viewModels/useBankFormViewModel';
import { BankFormView } from './BankFormView';

export const BankEditWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const viewModel = useBankFormViewModel({ banks, setBanks, mode: 'edit' });

  return (
    <BankFormView
      formData={viewModel.formData}
      errors={viewModel.errors}
      isLoading={viewModel.isLoading}
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
