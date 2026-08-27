// Banking Module - Transfer List Wrapper

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransferListViewModel } from '../viewModels/useTransferListViewModel';
import { TransferListView } from './TransferListView';

export const TransferListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const viewModel = useTransferListViewModel();

  return (
    <TransferListView
      transfers={viewModel.transfers}
      filteredTransfers={viewModel.filteredTransfers}
      stats={viewModel.stats}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      filters={viewModel.filters}
      setSearchTerm={viewModel.setSearchTerm}
      setDateRange={viewModel.setDateRange}
      onAddTransfer={() => navigate('/banking/transfers/new')}
      onDeleteTransfer={viewModel.handleDeleteTransfer}
      onBack={() => navigate('/banking')}
      refreshTransfers={viewModel.refreshTransfers}
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};