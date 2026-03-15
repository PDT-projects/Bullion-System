// Banking Module - Bank List View
// UI component for displaying and managing bank accounts
// Updated with loading states and empty states for Firebase integration

import React from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Building2,
  ArrowRightLeft,
  Eye,
  Landmark,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';
import { Bank, BankStats, BankFilters } from '../models/types';

interface BankListViewProps {
  // Data
  banks: Bank[];
  filteredBanks: Bank[];
  stats: BankStats;
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: BankFilters;
  setSearchTerm: (term: string) => void;
  
  // View State
  viewingBank: Bank | null;
  isTransferModalOpen: boolean;
  setViewingBank: (bank: Bank | null) => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  
  // Actions
  onAddBank: () => void;
  onEditBank: (id: string) => void;
  onDeleteBank: (id: string) => void;
  onBack: () => void;
  handleDeleteBank: (id: string) => void;
  handleTransfer: (fromBankId: string, toBankId: string, amount: number) => void;
  refreshBanks: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export const BankListView: React.FC<BankListViewProps> = ({
  filteredBanks,
  stats,
  isLoading,
  error,
  filters,
  setSearchTerm,
  viewingBank,
  isTransferModalOpen,
  setViewingBank,
  openTransferModal,
  closeTransferModal,
  onAddBank,
  onEditBank,
  onDeleteBank,
  onBack,
  handleDeleteBank,
  handleTransfer,
  refreshBanks,
  formatCurrency
}) => {
  // Transfer form state (local to view)
  const [transferData, setTransferData] = React.useState({
    fromBankId: '',
    toBankId: '',
    amount: 0
  });

  const onTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTransfer(transferData.fromBankId, transferData.toBankId, transferData.amount);
    setTransferData({ fromBankId: '', toBankId: '', amount: 0 });
  };

  // Loading State
  if (isLoading && filteredBanks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="rotate-180" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
              <p className="text-gray-600">Manage all bank accounts and balances</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <Loader2 className="animate-spin text-[#4f46e5] mb-4" size={48} />
          <p className="text-lg font-medium text-gray-900">Loading banks...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching data from database</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && filteredBanks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="rotate-180" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
              <p className="text-gray-600">Manage all bank accounts and balances</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-red-200">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <Database className="text-red-500" size={48} />
          </div>
          <p className="text-lg font-medium text-red-900">Failed to load banks</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={refreshBanks}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="rotate-180" size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
            <p className="text-gray-600">Manage all bank accounts and balances</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshBanks}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openTransferModal}
            disabled={filteredBanks.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft size={18} />
            Transfer
          </button>
          <button
            onClick={onAddBank}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={18} />
            Add Bank
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Total Banks</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBanks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Total Balance</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(stats.totalBalance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Highest Balance</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.highestBalance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-orange-600" />
            <p className="text-sm text-gray-600">Lowest Balance</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.lowestBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bank name or account number..."
            value={filters.searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
      </div>

      {/* Banks Grid */}
      {filteredBanks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => (
            <div key={bank.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
                    <Building2 size={20} className="text-[#4f46e5]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                    <p className="text-xs text-gray-500">{bank.accountNumber}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEditBank(bank.id)}
                    className="p-1.5 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setViewingBank(bank)}
                  className="flex-1 py-2 text-sm text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
                >
                  <Eye size={14} className="inline mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
            <Building2 className="text-gray-300" size={48} />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">No bank accounts yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Get started by adding your first bank account. All bank data will be securely stored in the database.
          </p>
          <button
            onClick={onAddBank}
            className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] mx-auto"
          >
            <Plus size={20} />
            Add Your First Bank
          </button>
        </div>
      )}

      {/* View Bank Modal */}
      {viewingBank && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bank Account Details</h3>
              <button
                onClick={() => setViewingBank(null)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#4f46e5]/10 rounded-lg">
                  <Building2 size={24} className="text-[#4f46e5]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{viewingBank.name}</h4>
                  <p className="text-sm text-gray-500">{viewingBank.accountNumber}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-[#4f46e5]">{formatCurrency(viewingBank.balance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setViewingBank(null);
                    onEditBank(viewingBank.id);
                  }}
                  className="py-2 text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  Edit Account
                </button>
                <button
                  onClick={() => {
                    setViewingBank(null);
                    openTransferModal();
                  }}
                  className="py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Between Banks</h3>
              <button
                onClick={closeTransferModal}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={onTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Bank *</label>
                <select
                  value={transferData.fromBankId}
                  onChange={(e) => setTransferData({ ...transferData, fromBankId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  required
                >
                  <option value="">Select bank</option>
                  {filteredBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Bank *</label>
                <select
                  value={transferData.toBankId}
                  onChange={(e) => setTransferData({ ...transferData, toBankId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  required
                >
                  <option value="">Select bank</option>
                  {filteredBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={transferData.amount || ''}
                  onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};