// Banking Module - Bank List Wrapper

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBankListViewModel } from '../viewModels/useBankListViewModel';
import { BankListView } from './BankListView';

export const BankListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const viewModel = useBankListViewModel();

  return (
    <BankListView
      banks={viewModel.banks}
      filteredBanks={viewModel.filteredBanks}
      stats={viewModel.stats}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      filters={viewModel.filters}
      setSearchTerm={viewModel.setSearchTerm}
      viewingBank={viewModel.viewingBank}
      isTransferModalOpen={viewModel.isTransferModalOpen}
      setViewingBank={viewModel.setViewingBank}
      openTransferModal={viewModel.openTransferModal}
      closeTransferModal={viewModel.closeTransferModal}
      onAddBank={() => navigate('/banking/banks/new')}
      onEditBank={(id) => navigate(`/banking/banks/${id}/edit`)}
      onDeleteBank={(id) => navigate(`/banking/banks/${id}/delete`)}
      onBack={() => navigate('/banking')}
      handleDeleteBank={viewModel.handleDeleteBank}
      handleTransfer={viewModel.handleTransfer}
      refreshBanks={viewModel.refreshBanks}
      formatCurrency={viewModel.formatCurrency}
    />
  );
};