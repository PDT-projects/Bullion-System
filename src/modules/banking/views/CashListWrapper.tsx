// Banking Module - Cash List Wrapper
// Connects ViewModel to View for cash list page

import React from 'react';
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

  const viewModel = useCashListViewModel({ cashTransactions, setCashTransactions });

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
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};
