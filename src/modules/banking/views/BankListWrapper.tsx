// Banking Module - Bank List Wrapper
// Connects ViewModel to View for bank list page

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank } from '../../../App';

import { useBankListViewModel } from '../viewModels/useBankListViewModel';
import { BankListView } from './BankListView';

export const BankListWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const viewModel = useBankListViewModel({ banks, setBanks });

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
