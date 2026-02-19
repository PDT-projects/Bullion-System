/**
 * Loan Payment Wrapper
 * 
 * Container component that connects the loan payment view to its ViewModel.
 */

import React from 'react';
import { useLoanPaymentViewModel } from '../viewModels/useLoanPaymentViewModel';
import { LoanPaymentView } from './LoanPaymentView';
import type { Bank } from '../models/types';

interface LoanPaymentWrapperProps {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
}

export const LoanPaymentWrapper: React.FC<LoanPaymentWrapperProps> = ({
  banks,
  setBanks
}) => {
  const viewModel = useLoanPaymentViewModel(banks, setBanks);

  return (
    <LoanPaymentView
      loan={viewModel.loan}
      formData={viewModel.formData}
      isLoading={viewModel.isLoading}
      isSubmitting={viewModel.isSubmitting}
      error={viewModel.error}
      canPay={viewModel.canPay}
      maxPaymentAmount={viewModel.maxPaymentAmount}
      remainingAfterPayment={viewModel.remainingAfterPayment}
      newStatus={viewModel.newStatus}
      progressBefore={viewModel.progressBefore}
      progressAfter={viewModel.progressAfter}
      availableBanks={viewModel.availableBanks}
      selectedBank={viewModel.selectedBank}
      isBankMode={viewModel.isBankMode}
      setAmount={viewModel.setAmount}
      setPaymentMode={viewModel.setPaymentMode}
      setBank={viewModel.setBank}
      onSubmit={viewModel.handleSubmit}
      onCancel={viewModel.handleCancel}
    />
  );
};
