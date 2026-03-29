// Transactions Module - Transaction List View

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Trash2, Search, Download,
  TrendingUp, TrendingDown, Wallet, X,
  AlertCircle, Loader2, Filter,
} from 'lucide-react';
import { Transaction, TransactionFilters, TransactionStats, COMPANIES, MAIN_CATEGORIES } from '../models/types';

interface Props {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  stats: TransactionStats;
  filters: TransactionFilters;
  isLoading: boolean;
  viewTransaction: Transaction | null;
  setFilters: (f: Partial<TransactionFilters>) => void;
  setViewTransaction: (t: Transaction | null) => void;
  handleDeleteTransaction: (id: string) => void;
  handleCreateTransaction: () => void;
  handleEditTransaction: (id: string) => void;
  handleExportCSV: () => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  formatDateTime: (d: string, t?: string) => string;
  getCategoryColor: (c: string) => string;
}

export function TransactionListView({
  transactions, filteredTransactions, stats, filters, isLoading,
  viewTransaction, setFilters, setViewTransaction,
  handleDeleteTransaction, handleCreateTransaction, handleEditTransaction, handleExportCSV,
  formatCurrency, formatDate, formatDateTime, getCategoryColor,
}: Props) {
  const [showFilters, setShowFilters] = React.useState(false);

  const modeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      Cash: 'bg-gray-100 text-gray-700',
      Bank: 'bg-blue-100 text-blue-700',
      Cheque: 'bg-purple-100 text-purple-700',
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">Record and manage all financial transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={handleCreateTransaction}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inflow',  value: formatCurrency(stats.totalInflow),  color: 'text-green-600', icon: TrendingUp,  bg: 'bg-green-50'  },
          { label: 'Total Outflow', value: formatCurrency(stats.totalOutflow), color: 'text-red-600',   icon: TrendingDown, bg: 'bg-red-50'    },
          { label: 'Net Balance',   value: formatCurrency(stats.netBalance),   color: stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600', icon: Wallet, bg: 'bg-blue-50' },
          { label: 'Pending',       value: `${stats.pendingCount} (${formatCurrency(stats.totalPending)})`, color: 'text-orange-600', icon: AlertCircle, bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-4 rounded-xl border border-white/50 shadow-sm`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} className={s.color} />
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">

          {/* 🔥 FIXED SEARCH BAR */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />

            <input
              type="text"
              placeholder="Search by company, category, note, paid by/to..."
              value={filters.searchTerm}
              onChange={e => setFilters({ searchTerm: e.target.value })}
              className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-indigo-400 focus:outline-none 
                         text-sm placeholder-gray-500 flex items-center"
            />
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            <Filter size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={filters.mainCategory} onChange={e => setFilters({ mainCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300">
                <option value="">All</option>
                {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        
        {/* 🔥 FIXED HEADING SPACING */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 mt-2 mb-1">
            All Transactions ({filteredTransactions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID','Date','Company','Category','Sub Category','Amount','Paid','Remaining','Mode','Actions']
                  .map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">

                  <td className="px-4 py-3 text-xs font-mono text-indigo-600">{t.id}</td>

                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(t.date)}</td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {t.company}
                  </td>

                  {/* 🔥 FIXED CATEGORY BADGE */}
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full 
                      whitespace-nowrap inline-flex items-center justify-center leading-none
                      ${getCategoryColor(t.mainCategory)}`}>
                      {t.mainCategory}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">{t.subCategory}</td>

                  <td className="px-4 py-3 font-semibold text-sm">
                    {formatCurrency(t.amount || 0)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">—</td>
                  <td className="px-4 py-3 text-sm text-gray-700">—</td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(t.mode)}`}>
                      {t.mode}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Eye size={15} />
                      <Edit size={15} />
                      <Trash2 size={15} />
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}