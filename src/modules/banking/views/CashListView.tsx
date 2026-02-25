// Banking Module - Cash List View
// UI component for displaying cash transactions
// Updated with loading states and empty states for Firebase integration

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  Save,
  Loader2,
  Database,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { CashTransaction, CashStats, CashFilters } from '../models/types';

interface CashListViewProps {
  // Data
  filteredTransactions: CashTransaction[];
  stats: CashStats;
  cashRecords: { id: string; location: string; balance: number; lastUpdated: string }[];
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: CashFilters;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'inflow' | 'outflow') => void;
  
  // Actions
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onBack: () => void;
  onSetOpeningBalance: (amount: number) => Promise<void>;
  refreshCashData: () => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export const CashListView: React.FC<CashListViewProps> = ({
  filteredTransactions,
  stats,
  cashRecords,
  isLoading,
  error,
  filters,
  setSearchTerm,
  setFilterType,
  onAddTransaction,
  onDeleteTransaction,
  onBack,
  onSetOpeningBalance,
  refreshCashData,
  formatCurrency,
  formatDate
}) => {
  const [showOpeningBalanceDialog, setShowOpeningBalanceDialog] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [isSavingOpeningBalance, setIsSavingOpeningBalance] = useState(false);

  // Handle opening balance save
  const handleSaveOpeningBalance = async () => {
    const amount = parseFloat(openingBalanceInput) || 0;
    if (amount < 0) return;
    
    setIsSavingOpeningBalance(true);
    try {
      await onSetOpeningBalance(amount);
      setShowOpeningBalanceDialog(false);
      setOpeningBalanceInput('');
    } catch (err) {
      console.error('Error saving opening balance:', err);
    } finally {
      setIsSavingOpeningBalance(false);
    }
  };

  // Loading State
  if (isLoading && filteredTransactions.length === 0 && cashRecords.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cash in Hand</h2>
              <p className="text-gray-600">Manage cash transactions and balances</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <Loader2 className="animate-spin text-[#4f46e5] mb-4" size={48} />
          <p className="text-lg font-medium text-gray-900">Loading cash data...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching data from database</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && filteredTransactions.length === 0 && cashRecords.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cash in Hand</h2>
              <p className="text-gray-600">Manage cash transactions and balances</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-red-200">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <Database className="text-red-500" size={48} />
          </div>
          <p className="text-lg font-medium text-red-900">Failed to load cash data</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={refreshCashData}
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
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cash in Hand</h2>
            <p className="text-gray-600">Manage cash transactions and balances by location</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshCashData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowOpeningBalanceDialog(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50"
          >
            <Wallet size={18} />
            Set Opening Balance
          </button>
        </div>
      </div>

      {/* Cash Records by Location */}
      {cashRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashRecords.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} className="text-[#4f46e5]" />
                <p className="text-sm text-gray-600">{record.location}</p>
              </div>
              <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(record.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatDate(record.lastUpdated)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Cash in Hand</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(stats.totalCashInHand)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Opening Balance</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.openingBalance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Inflow</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalInflow)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Total Outflow</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOutflow)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-gray-600" />
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by category or company..."
              value={filters.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <select
            value={filters.filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'inflow' | 'outflow')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          >
            <option value="all">All Types</option>
            <option value="inflow">Cash Inflow</option>
            <option value="outflow">Cash Outflow</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        txn.mainCategory === 'Cash Inflow' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {txn.mainCategory === 'Cash Inflow' ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {txn.mainCategory === 'Cash Inflow' ? 'Inflow' : 'Outflow'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{txn.subCategory}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{txn.company}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        txn.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.mainCategory === 'Cash Inflow' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDeleteTransaction(txn.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
            <DollarSign className="text-gray-300" size={48} />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">No cash transactions yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Get started by setting an opening balance. All cash data will be securely stored in the database.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowOpeningBalanceDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
            >
              <Wallet size={20} />
              Set Opening Balance
            </button>
          </div>
        </div>
      )}

      {/* Opening Balance Dialog */}
      {showOpeningBalanceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Set Opening Balance</h3>
              <button
                onClick={() => setShowOpeningBalanceDialog(false)}
                disabled={isSavingOpeningBalance}
                className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Database className="text-blue-500 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-blue-900">Database Storage</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This opening balance will be stored in Firebase and will be available across all devices.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Enter the initial cash balance when starting the software. This will be the starting point for all cash transactions.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Balance Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  PKR
                </span>
                <input
                  type="number"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  disabled={isSavingOpeningBalance}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOpeningBalanceDialog(false)}
                disabled={isSavingOpeningBalance}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOpeningBalance}
                disabled={!openingBalanceInput || parseFloat(openingBalanceInput) < 0 || isSavingOpeningBalance}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingOpeningBalance ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
