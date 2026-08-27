// Banking Module - Cash List Wrapper

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashListViewModel } from '../viewModels/useCashListViewModel';
import { CashListView } from './CashListView';

export const CashListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const viewModel = useCashListViewModel();

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
      onSetOpeningBalance={viewModel.handleSetOpeningBalance}
      refreshCashData={viewModel.refreshCashData}
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};