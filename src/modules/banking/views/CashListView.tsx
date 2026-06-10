// Banking Module - Transfer List View
// UI component for displaying bank transfers

import React from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRightLeft,
  Calendar,
  Building2,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { BankTransfer, TransferStats, TransferFilters } from '../models/types';

interface TransferListViewProps {
  // Data
  transfers: BankTransfer[];
  filteredTransfers: BankTransfer[];
  stats: TransferStats;
  
  // Loading State
  isLoading?: boolean;
  error?: string | null;
  
  // Filters
  filters: TransferFilters;
  setSearchTerm: (term: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  
  // Actions
  onAddTransfer: () => void;
  onDeleteTransfer: (id: string) => void;
  onBack: () => void;
  refreshTransfers?: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export const TransferListView: React.FC<TransferListViewProps> = ({
  transfers,
  filteredTransfers,
  stats,
  isLoading,
  error,
  filters,
  setSearchTerm,
  setDateRange,
  onAddTransfer,
  onDeleteTransfer,
  onBack,
  refreshTransfers,
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
            <h2 className="text-2xl font-bold text-gray-900">Bank Transfers</h2>
            <p className="text-gray-600">View and manage inter-bank transfers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {refreshTransfers && (
            <button
              onClick={refreshTransfers}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh transfers"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            onClick={onAddTransfer}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={18} className="text-gray-700" />
            <p className="text-sm text-gray-600">Total Transfers</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTransfers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-gray-700" />
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-gray-700">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">This Month</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.thisMonth)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by bank name or amount..."
              value={filters.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Date Range:</span>
          </div>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setDateRange(e.target.value || null, filters.endDate)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setDateRange(filters.startDate, e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-sm"
          />
          {(filters.startDate || filters.endDate) && (
            <button
              onClick={() => setDateRange(null, null)}
              className="text-sm text-gray-700 hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-700" size={32} />
          <span className="ml-2 text-gray-600">Loading transfers...</span>
        </div>
      )}

      {/* Transfers Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">From Bank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">To Bank</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(transfer.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-red-500" />
                        <span className="text-sm text-gray-900">{transfer.fromBankName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-green-500" />
                        <span className="text-sm text-gray-900">{transfer.toBankName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(transfer.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDeleteTransfer(transfer.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete transfer record"
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
      )}

      {/* Empty State */}
      {!isLoading && filteredTransfers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ArrowRightLeft className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-lg font-medium text-gray-900">No transfers found</p>
          <p className="text-sm text-gray-500 mt-1">Record a new bank transfer to get started</p>
          <button
            onClick={onAddTransfer}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          >
            New Transfer
          </button>
        </div>
      )}
    </div>
  );
};