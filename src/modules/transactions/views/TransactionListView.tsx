// Transactions Module - Transaction List View

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Trash2, Search, Download,
  TrendingUp, TrendingDown, Wallet, X, Hash,
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

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by company, category, note, paid by/to..."
              value={filters.searchTerm} onChange={e => setFilters({ searchTerm: e.target.value })}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={filters.mainCategory} onChange={e => setFilters({ mainCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                <option value="">All</option>
                {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <select value={filters.company} onChange={e => setFilters({ company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                <option value="">All</option>
                {COMPANIES.map(c => <option key={c.id} value={c.name}>{c.name.split(': ')[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input type="date" value={filters.dateTo} onChange={e => setFilters({ dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">All Transactions ({filteredTransactions.length})</h3>
          {(filters.searchTerm || filters.mainCategory || filters.dateFrom || filters.company) && (
            <button onClick={() => setFilters({ searchTerm: '', mainCategory: '', dateFrom: '', dateTo: '', company: '', paymentStatus: '' })}
              className="text-xs text-red-500 hover:text-red-700">Clear filters</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Date', 'Company', 'Category', 'Sub Category', 'Amount', 'Paid', 'Remaining', 'Mode', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <Wallet className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-medium">No transactions found</p>
                    <p className="text-sm mt-1">Create your first transaction to get started</p>
                  </td>
                </tr>
              ) : filteredTransactions.map(t => {
                const remaining = (t.amount || 0) - ((t.partialPayments || []).reduce((s, p) => s + p.amount, 0) + (t.amountPaid || 0));
                const paid      = t.amountPaid || (t.partialPayments || []).reduce((s, p) => s + p.amount, 0) || t.amount;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600">{t.transactionId || t.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[140px] truncate">
                      {t.company.split(': ')[1] || t.company}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(t.mainCategory)}`}>
                        {t.mainCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{t.subCategory}</td>
                    <td className={`px-4 py-3 font-semibold text-sm ${t.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.mainCategory === 'Cash Inflow' ? '+' : '−'}{formatCurrency(t.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(paid)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {remaining > 0 ? formatCurrency(remaining) : '✓'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(t.mode)}`}>{t.mode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTransaction(t)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="View"><Eye size={15} /></button>
                        <button onClick={() => handleEditTransaction(t.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Edit"><Edit size={15} /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                <p className="text-xs text-indigo-600 font-mono mt-0.5">{viewTransaction.transactionId}</p>
              </div>
              <button onClick={() => setViewTransaction(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Date', formatDateTime(viewTransaction.date, viewTransaction.time)],
                  ['Company', viewTransaction.company],
                  ['Category', viewTransaction.mainCategory],
                  ['Sub Category', viewTransaction.subCategory],
                  ['Detail', viewTransaction.detailCategory || '—'],
                  ['Mode', viewTransaction.mode],
                  ['Bank', viewTransaction.bankName || '—'],
                  ['Paid By', viewTransaction.paidBy || '—'],
                  ['Paid To', viewTransaction.paidTo || '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-gray-500 text-xs">{l}</p>
                    <p className="font-medium text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t pt-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-bold text-blue-700">{formatCurrency(viewTransaction.amount || 0)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="font-bold text-green-700">{formatCurrency(viewTransaction.amountPaid || viewTransaction.amount || 0)}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-bold text-orange-700">{formatCurrency(viewTransaction.remainingAmount || 0)}</p>
                </div>
              </div>
              {viewTransaction.linkedRef && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs text-indigo-500">Linked Record</p>
                  <p className="font-semibold text-indigo-800">{viewTransaction.linkedType?.toUpperCase()} — {viewTransaction.linkedRef}</p>
                </div>
              )}
              {viewTransaction.note && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Note</p>
                  <p className="text-gray-800">{viewTransaction.note}</p>
                </div>
              )}
              {(viewTransaction.partialPayments || []).length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Partial Payments</p>
                  <div className="space-y-2">
                    {viewTransaction.partialPayments!.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <div>
                          <p className="font-medium">{formatCurrency(p.amount)} via {p.method}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(p.date, p.time)}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${p.isCleared ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.isCleared ? 'Cleared' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}