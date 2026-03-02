// Banking Module - Dashboard Wrapper
// Connects ViewModel to View for banking dashboard

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank, BankTransfer } from '../../../App';
import { CashTransaction } from '../models/types';
import { useBankingDashboardViewModel } from '../viewModels/useBankingDashboardViewModel';

import { BankingDashboardView } from './BankingDashboardView';

export const BankingDashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { banks, transfers: outletTransfers, cashTransactions: outletCashTransactions } = useOutletContext<{
    banks: Bank[];
    transfers: BankTransfer[];
    cashTransactions: CashTransaction[];
  }>();

  const viewModel = useBankingDashboardViewModel({ 
    banks, 
    transfers: outletTransfers, 
    cashTransactions: outletCashTransactions 
  });

  return (
    <BankingDashboardView
      stats={viewModel.stats}
      recentTransfers={viewModel.recentTransfers}
      recentCashTransactions={viewModel.recentCashTransactions}
      banks={viewModel.firebaseBanks}
      cashRecords={viewModel.cashRecords}
      isLoading={viewModel.isLoading}
      error={viewModel.error}
      showTransferModal={viewModel.showTransferModal}
      setShowTransferModal={viewModel.setShowTransferModal}
      onViewBanks={() => navigate('/banking/banks')}
      onViewTransfers={() => navigate('/banking/transfers')}
      onViewCash={() => navigate('/banking/cash')}
      onAddBank={() => navigate('/banking/banks/new')}
      onAddTransfer={() => navigate('/banking/transfers/new')}
      onAddCash={() => navigate('/banking/cash/new')}
      refreshData={viewModel.refreshData}
      formatCurrency={viewModel.formatCurrency}
      formatDate={viewModel.formatDate}
    />
  );
};
