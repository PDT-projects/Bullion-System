// Banking Module - Transfer List Wrapper
// Connects ViewModel to View for transfer list page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BankTransfer } from '../models/types';
import { useTransferListViewModel } from '../viewModels/useTransferListViewModel';
import { TransferListView } from './TransferListView';

export const TransferListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { transfers, setTransfers } = useOutletContext<{
    transfers: BankTransfer[];
    setTransfers: (transfers: BankTransfer[]) => void;
  }>();

  const viewModel = useTransferListViewModel({ transfers, setTransfers });

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
