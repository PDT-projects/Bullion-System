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

  return (
    <CashListView
      filteredTransactions={viewModel.filteredTransactions}
      stats={viewModel.stats}
      filters={viewModel.filters}
      setSearchTerm={viewModel.setSearchTerm}
      setFilterType={viewModel.setFilterType}
      onAddTransaction={() => navigate('/banking/cash/new')}
      onDeleteTransaction={viewModel.handleDeleteTransaction}
      onBack={() => navigate('/banking')}
      onSetOpeningBalance={viewModel.handleSetOpeningBalance}
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};
