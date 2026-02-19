/**
 * Loan Form Wrapper
 * 
 * Container component that connects the loan form view to its ViewModel.
 */

import React from 'react';
import { useLoanFormViewModel } from '../viewModels/useLoanFormViewModel';
import { LoanFormView } from './LoanFormView';
import type { Bank, Employee, LoanType } from '../models/types';

interface LoanFormWrapperProps {
  banks: Bank[];
  employees: Employee[];
  setBanks: (banks: Bank[]) => void;
  defaultType?: LoanType;
}

export const LoanFormWrapper: React.FC<LoanFormWrapperProps> = ({
  banks,
  employees,
  setBanks,
  defaultType
}) => {
  const viewModel = useLoanFormViewModel(banks, employees, setBanks, defaultType);

  return (
    <LoanFormView
      formData={viewModel.formData}
      isLoading={viewModel.isLoading}
      isSubmitting={viewModel.isSubmitting}
      errors={viewModel.errors}
      isEditing={viewModel.isEditing}
      remaining={viewModel.remaining}
      status={viewModel.status}
      availableBanks={viewModel.availableBanks}
      availableEmployees={viewModel.availableEmployees}
      setEntityName={viewModel.setEntityName}
      setLoanAmount={viewModel.setLoanAmount}
      setPaidAmount={viewModel.setPaidAmount}
      setDate={viewModel.setDate}
      setType={viewModel.setType}
      setLoanCategory={viewModel.setLoanCategory}
      setPaymentMode={viewModel.setPaymentMode}
      setBank={viewModel.setBank}
      setReceiverType={viewModel.setReceiverType}
      setReceiverName={viewModel.setReceiverName}
      setReceiverPhone={viewModel.setReceiverPhone}
      setEmployee={viewModel.setEmployee}
      onSubmit={viewModel.handleSubmit}
      onCancel={viewModel.handleCancel}
      isBankMode={viewModel.isBankMode}
      isEmployeeReceiver={viewModel.isEmployeeReceiver}
      selectedBank={viewModel.selectedBank}
    />
  );
};
