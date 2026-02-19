// Banking Module - Cash List View
// UI component for displaying cash transactions

import React from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { CashTransaction, CashStats, CashFilters } from '../models/types';

interface CashListViewProps {
  // Data
  filteredTransactions: CashTransaction[];
  stats: CashStats;
  
  // Filters
  filters: CashFilters;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'inflow' | 'outflow') => void;
  
  // Actions
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onBack: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export const CashListView: React.FC<CashListViewProps> = ({
  filteredTransactions,
  stats,
  filters,
  setSearchTerm,
  setFilterType,
  onAddTransaction,
  onDeleteTransaction,
  onBack,
  formatCurrency,
  formatDate
}) => {
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
            <h2 className="text-2xl font-bold text-gray-900">Cash Transactions</h2>
            <p className="text-gray-600">Manage cash inflow and outflow</p>
          </div>
        </div>
        <button
          onClick={onAddTransaction}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={18} />
          Add Cash
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Cash in Hand</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(stats.totalCashInHand)}</p>
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

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <DollarSign className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-lg font-medium text-gray-900">No transactions found</p>
          <p className="text-sm text-gray-500 mt-1">Record a cash transaction to get started</p>
          <button
            onClick={onAddTransaction}
            className="mt-4 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
          >
            Add Cash Transaction
          </button>
        </div>
      )}
    </div>
  );
};
