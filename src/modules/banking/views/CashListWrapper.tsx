// Banking Module - Cash List Wrapper
// Connects ViewModel to View for cash list page

import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CashTransaction } from '../models/types';
import { useCashListViewModel } from '../viewModels/useCashListViewModel';
import { CashListView } from './CashListView';

export const CashListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { cashTransactions, setCashTransactions } = useOutletContext<{
    cashTransactions: CashTransaction[];
    setCashTransactions: (transactions: CashTransaction[]) => void;
  }>();
  
  // Opening balance state
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const viewModel = useCashListViewModel({ 
    cashTransactions, 
    setCashTransactions,
    openingBalance,
    setOpeningBalance
  });

  // Handle opening balance with async support
  const handleSetOpeningBalance = async (amount: number) => {
    await viewModel.handleSetOpeningBalance(amount);
  };

  return (
    <CashListView
      filteredTransactions={viewModel.filteredTransactions}
      stats={viewModel.stats}
      cashRecords={viewModel.cashRecords}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      filters={viewModel.filters}
      setSearchTerm={viewModel.setSearchTerm}
      setFilterType={viewModel.setFilterType}
      onAddTransaction={() => navigate('/banking/cash/new')}
      onDeleteTransaction={viewModel.handleDeleteTransaction}
      onBack={() => navigate('/banking')}
      onSetOpeningBalance={handleSetOpeningBalance}
      refreshCashData={viewModel.refreshCashData}
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};
