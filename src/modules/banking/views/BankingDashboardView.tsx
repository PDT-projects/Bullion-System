// Banking Module - Dashboard View
// UI component for banking dashboard overview
// Updated with Data Connect integration

import React from 'react';
import { 
  ArrowRightLeft,
  Building2,
  Wallet,
  TrendingUp,
  ArrowRight,
  ArrowLeftRight,
  DollarSign,
  Loader2,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { Bank, BankTransfer, CashTransaction, DashboardStats } from '../models/types';

interface BankingDashboardViewProps {
  // Data
  stats: DashboardStats;
  recentTransfers: BankTransfer[];
  recentCashTransactions: CashTransaction[];
  banks: Bank[];
  cashRecords: CashTransaction[];
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Quick Actions
  showTransferModal: boolean;
  setShowTransferModal: (show: boolean) => void;
  
  // Navigation
  onViewBanks: () => void;
  onViewTransfers: () => void;
  onViewCash: () => void;
  onAddBank: () => void;
  onAddTransfer: () => void;
  onAddCash: () => void;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export const BankingDashboardView: React.FC<BankingDashboardViewProps> = ({
  stats,
  recentTransfers,
  recentCashTransactions,
  banks,
  cashRecords,
  isLoading,
  error,
  showTransferModal,
  setShowTransferModal,
  onViewBanks,
  onViewTransfers,
  onViewCash,
  onAddBank,
  onAddTransfer,
  onAddCash,
  refreshData,
  formatCurrency,
  formatDate
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banking Dashboard</h2>
          <p className="text-gray-600">Overview of your banking and cash position</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowRightLeft size={18} />
            Quick Transfer
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-6 rounded-lg text-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 size={24} />
            </div>
            <span className="text-gray-700">Total Bank Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{formatCurrency(stats.totalBankBalance)}</p>
            {isLoading && <Loader2 size={20} className="animate-spin" />}
          </div>
          <p className="text-sm text-gray-500 mt-1">Across {stats.bankCount} bank accounts</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg text-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-gray-700">Cash in Hand</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{formatCurrency(stats.totalCashInHand)}</p>
            {isLoading && <Loader2 size={20} className="animate-spin" />}
          </div>
          <p className="text-sm text-gray-500 mt-1">From {cashRecords.length} transaction(s)</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg text-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <span className="text-gray-700">Total Liquidity</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalLiquidity)}</p>
          <p className="text-sm text-gray-500 mt-1">Combined bank + cash</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Bank Accounts</h3>
            <Building2 size={20} className="text-[#374151]" />
          </div>
          <p className="text-sm text-gray-600 mb-3">Manage your bank accounts and balances</p>
          <div className="flex gap-2">
            <button
              onClick={onViewBanks}
              className="flex-1 py-2 text-sm text-[#374151] bg-[#374151]/10 rounded hover:bg-[#374151]/20"
            >
              View All
            </button>
            <button
              onClick={onAddBank}
              className="flex-1 py-2 text-sm text-white bg-[#374151] rounded hover:bg-[#1f2937]"
            >
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Transfers</h3>
            <ArrowRightLeft size={20} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-3">Transfer funds between accounts</p>
          <div className="flex gap-2">
            <button
              onClick={onViewTransfers}
              className="flex-1 py-2 text-sm text-green-600 bg-green-50 rounded hover:bg-green-100"
            >
              View History
            </button>
            <button
              onClick={onAddTransfer}
              className="flex-1 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
            >
              Transfer
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Cash</h3>
            <DollarSign size={20} className="text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-3">Manage cash inflow and outflow</p>
          <div className="flex gap-2">
            <button
              onClick={onViewCash}
              className="flex-1 py-2 text-sm text-orange-600 bg-orange-50 rounded hover:bg-orange-100"
            >
              View All
            </button>
            <button
              onClick={onAddCash}
              className="flex-1 py-2 text-sm text-white bg-orange-600 rounded hover:bg-orange-700"
            >
              Add Cash
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transfers */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Transfers</h3>
            <button
              onClick={onViewTransfers}
              className="text-sm text-[#374151] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTransfers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No recent transfers</p>
            ) : (
              recentTransfers.map((transfer) => (
                <div key={transfer.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#374151]/10 rounded">
                      <ArrowLeftRight size={16} className="text-[#374151]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transfer.fromBankName} → {transfer.toBankName}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(transfer.date)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#374151]">
                    {formatCurrency(transfer.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Cash Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Cash Activity</h3>
            <button
              onClick={onViewCash}
              className="text-sm text-[#374151] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCashTransactions.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No recent cash transactions</p>
            ) : (
              recentCashTransactions.map((txn) => (
                <div key={txn.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      txn.mainCategory === 'Cash Inflow' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign size={16} className={
                        txn.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'
                      } />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{txn.subCategory}</p>
                      <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    txn.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.mainCategory === 'Cash Inflow' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bank Balances Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Bank Account Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{bank.name}</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
              <p className="text-xs text-gray-500">{bank.accountNumber}</p>
            </div>
          ))}
          {banks.length === 0 && (
            <p className="col-span-full text-sm text-gray-500 text-center py-4">
              No bank accounts. <button onClick={onAddBank} className="text-[#374151] hover:underline">Add one</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};