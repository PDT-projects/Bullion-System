// Transactions Module - Transaction List View

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Trash2, Search, Download,
  TrendingUp, TrendingDown, Wallet, X,
  AlertCircle, Loader2, Filter,
  CheckCircle, Clock, ShieldAlert, Ban,
} from 'lucide-react';
import {
  Transaction, TransactionFilters, TransactionStats,
  COMPANIES, MAIN_CATEGORIES,
} from '../models/types';
import { getTransactionTotals, isPending } from '../models/transactionsService';

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
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = React.useState(false);

  const modeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      Cash:   'bg-gray-100 text-gray-700',
      Bank:   'bg-blue-100 text-blue-700',
      Cheque: 'bg-purple-100 text-purple-700',
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  /** Row-level visual state based on approval status */
  const rowMeta = (t: Transaction): {
    rowClass: string;
    statusBadge: React.ReactNode;
    dimAmount: boolean;
  } => {
    if (t.approvalStatus === 'rejected') {
      return {
        rowClass:  'bg-red-50 opacity-75',
        dimAmount: true,
        statusBadge: (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">
            <Ban size={10} /> Rejected
          </span>
        ),
      };
    }
    if (t.approvalStatus === 'pending_approval') {
      return {
        rowClass:  'bg-amber-50',
        dimAmount: true,
        statusBadge: (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-300 whitespace-nowrap">
            <ShieldAlert size={10} /> Awaiting Approval
          </span>
        ),
      };
    }
    // Normal approved / not_required transactions
    const pending = isPending(t);
    return {
      rowClass:  '',
      dimAmount: false,
      statusBadge: pending ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap">
          <Clock size={10} /> Pending
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
          <CheckCircle size={10} /> Cleared
        </span>
      ),
    };
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
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={handleCreateTransaction}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inflow',  value: formatCurrency(stats.totalInflow),  color: 'text-green-600', icon: TrendingUp  },
          { label: 'Total Outflow', value: formatCurrency(stats.totalOutflow), color: 'text-red-600',   icon: TrendingDown },
          {
            label: 'Net Balance',
            value: formatCurrency(stats.netBalance),
            color: stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600',
            icon: Wallet,
          },
          {
            label: 'Pending',
            value: `${stats.pendingCount} (${formatCurrency(stats.totalPending)})`,
            color: 'text-orange-600',
            icon: AlertCircle,
          },
        ].map(s => (
          <div key={s.label} className="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} className={s.color} />
              <p className="text-xs text-black font-medium">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {stats.pendingApprovalCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <ShieldAlert size={18} className="shrink-0 text-amber-500" />
          <span>
            <strong>{stats.pendingApprovalCount} transaction{stats.pendingApprovalCount > 1 ? 's' : ''}</strong> {stats.pendingApprovalCount > 1 ? 'are' : 'is'} awaiting admin approval.
            These are <strong>not included</strong> in the financial totals above until approved.
          </span>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by TXN ID, company, category, note, paid by/to..."
              value={filters.searchTerm}
              onChange={e => setFilters({ searchTerm: e.target.value })}
              className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-indigo-400 focus:outline-none
                         text-sm placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={filters.mainCategory}
                onChange={e => setFilters({ mainCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All Categories</option>
                {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={e => setFilters({ paymentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Full">Cleared</option>
              </select>
            </div>

            {/* Approval status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Approval Status</label>
              <select
                value={filters.approvalStatus}
                onChange={e => setFilters({ approvalStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All</option>
                <option value="pending_approval">Awaiting Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="not_required">No Approval Required</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company / Branch</label>
              <select
                value={filters.company}
                onChange={e => setFilters({ company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All Branches</option>
                {COMPANIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters({ dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  searchTerm: '', mainCategory: '', dateFrom: '', dateTo: '',
                  paymentStatus: '', company: '', approvalStatus: '',
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
              >
                <X size={14} /> Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {(filters.dateFrom || filters.dateTo || filters.mainCategory || filters.paymentStatus || filters.company || filters.approvalStatus) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                From: {formatDate(filters.dateFrom)}
                <button onClick={() => setFilters({ dateFrom: '' })}><X size={11} /></button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                To: {formatDate(filters.dateTo)}
                <button onClick={() => setFilters({ dateTo: '' })}><X size={11} /></button>
              </span>
            )}
            {filters.mainCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                {filters.mainCategory}
                <button onClick={() => setFilters({ mainCategory: '' })}><X size={11} /></button>
              </span>
            )}
            {filters.paymentStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                {filters.paymentStatus}
                <button onClick={() => setFilters({ paymentStatus: '' })}><X size={11} /></button>
              </span>
            )}
            {filters.approvalStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                Approval: {filters.approvalStatus.replace('_', ' ')}
                <button onClick={() => setFilters({ approvalStatus: '' })}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/60">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">All Transactions</h3>
          <p className="text-xs text-gray-400 mt-0.5">{filteredTransactions.length} record{filteredTransactions.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'TXN ID', 'Date', 'Company', 'Category',
                  'Sub Category', 'Amount', 'Paid', 'Remaining', 'Status', 'Mode', 'Actions',
                ].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const { totalPaid, remainingAmount } = getTransactionTotals(t);
                  const { rowClass, statusBadge, dimAmount } = rowMeta(t);
                  const isRejected      = t.approvalStatus === 'rejected';
                  const isPendingApproval = t.approvalStatus === 'pending_approval';

                  return (
                    <tr key={t.id} className={`transition-colors hover:brightness-95 ${rowClass}`}>

                      {/* TXN ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-medium ${isRejected ? 'text-red-400 line-through' : 'text-indigo-500'}`}>
                            {t.transactionId || '—'}
                          </span>
                          {isRejected && (
                            <span style={{fontSize:'9px'}} className="font-bold text-red-600 bg-red-50 border border-red-300 px-1.5 py-px rounded uppercase tracking-widest">
                              Rejected
                            </span>
                          )}
                          {isPendingApproval && (
                            <span style={{fontSize:'9px'}} className="font-bold text-amber-600 bg-amber-50 border border-amber-300 px-1.5 py-px rounded uppercase tracking-widest">
                              Pending
                            </span>
                          )}
                          {(t as any).linkedType === 'invoice' && (
                            <span style={{fontSize:'9px'}} className="font-bold text-sky-600 bg-sky-50 border border-sky-300 px-1.5 py-px rounded uppercase tracking-widest">
                              Invoice
                            </span>
                          )}
                          {(t as any).linkedType === 'inventory' && (
                            <span style={{fontSize:'9px'}} className="font-bold text-violet-600 bg-violet-50 border border-violet-300 px-1.5 py-px rounded uppercase tracking-widest">
                              Inventory
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>

                      {/* Company short name */}
                      <td
                        className="px-4 py-3 text-sm text-gray-600 max-w-[130px] truncate"
                        title={t.company}
                      >
                        {t.company.includes(': ') ? t.company.split(': ')[1] : t.company}
                      </td>

                      {/* Main Category */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center leading-none ${
                            isRejected
                              ? 'bg-red-100 text-red-500 line-through'
                              : getCategoryColor(t.mainCategory)
                          }`}
                        >
                          {t.mainCategory}
                        </span>
                      </td>

                      {/* Sub Category */}
                      <td
                        className="px-4 py-3 text-sm text-gray-700 max-w-[130px] truncate"
                        title={t.subCategory}
                      >
                        {t.subCategory}
                      </td>

                      {/* Amount — dimmed/struck for rejected/pending */}
                      <td className="px-4 py-3 font-semibold text-sm whitespace-nowrap">
                        {isRejected ? (
                          <span className="text-red-400 line-through">
                            {t.mainCategory === 'Cash Inflow' ? '+' : '−'}
                            {formatCurrency(t.amount || 0)}
                          </span>
                        ) : (
                          <span className={`${dimAmount ? 'text-gray-400' : t.mainCategory === 'Cash Inflow' ? 'text-green-700' : 'text-red-700'}`}>
                            {t.mainCategory === 'Cash Inflow' ? '+' : '−'}
                            {formatCurrency(t.amount || 0)}
                          </span>
                        )}
                      </td>

                      {/* Paid — zero for pending/rejected approval */}
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {(isRejected || isPendingApproval)
                          ? <span className="text-gray-300">—</span>
                          : <span className="text-green-700 font-medium">{formatCurrency(totalPaid)}</span>
                        }
                      </td>

                      {/* Remaining — zero for pending/rejected approval */}
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {(isRejected || isPendingApproval)
                          ? <span className="text-gray-300">—</span>
                          : remainingAmount > 0
                            ? <span className="text-orange-600 font-medium">{formatCurrency(remainingAmount)}</span>
                            : <span className="text-gray-400">PKR 0</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {statusBadge}
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(t.mode)}`}>
                          {t.mode}
                        </span>
                      </td>

                      {/* Actions — disable Edit for rejected */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewTransaction(t)}
                            title="View details"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          {!isRejected && (
                            <button
                              onClick={() => handleEditTransaction(t.id)}
                              title="Edit transaction"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/transactions/${t.id}/delete`)}
                            title="Delete transaction"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Transaction Modal */}
      {viewTransaction && (() => {
        const { totalPaid, remainingAmount } = getTransactionTotals(viewTransaction);
        const pending    = isPending(viewTransaction);
        const isRejected = viewTransaction.approvalStatus === 'rejected';
        const isInflow   = viewTransaction.mainCategory === 'Cash Inflow';
        const isLoan     = viewTransaction.mainCategory === 'Loan';
        const branch     = viewTransaction.company.includes(': ') ? viewTransaction.company.split(': ')[1] : viewTransaction.company;

        const amountColor = isRejected
          ? 'text-red-400 line-through'
          : isInflow
            ? 'text-green-600'
            : isLoan
              ? 'text-indigo-600'
              : 'text-red-600';

        const amountSign = isInflow ? '+' : '−';

        const approvalBadge = () => {
          const s = viewTransaction.approvalStatus;
          if (!s || s === 'not_required') return null;
          const map: Record<string, { cls: string; label: string }> = {
            pending_approval: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: '⏳ Pending Approval' },
            approved:         { cls: 'bg-green-100 text-green-700 border-green-200',  label: '✅ Approved' },
            rejected:         { cls: 'bg-red-100 text-red-700 border-red-200',        label: '❌ Rejected' },
          };
          const m = map[s];
          if (!m) return null;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${m.cls}`}>
              {m.label}
            </span>
          );
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden ${isRejected ? 'ring-2 ring-red-300' : ''}`}>

              {/* Header — red tint for rejected */}
              <div className={`border-b px-6 pt-5 pb-6 relative ${isRejected ? 'bg-red-50 border-red-200' : 'bg-gray-100 border-gray-200'}`}>

                <button
                  onClick={() => setViewTransaction(null)}
                  className="absolute top-4 right-4 p-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-mono rounded-full tracking-wide">
                    {viewTransaction.transactionId || '—'}
                  </span>
                  {(viewTransaction as any).linkedType && (
                    <span className={`inline-flex items-center gap-1 text-[10px] ${
                      (viewTransaction as any).linkedType === 'invoice'
                        ? 'text-blue-600'
                        : (viewTransaction as any).linkedType === 'inventory'
                        ? 'text-pink-600'
                        : 'text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (viewTransaction as any).linkedType === 'invoice'
                          ? 'bg-blue-500'
                          : (viewTransaction as any).linkedType === 'inventory'
                          ? 'bg-pink-500'
                          : 'bg-gray-400'
                      }`} />
                      {(viewTransaction as any).linkedType}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                    {viewTransaction.mainCategory}
                  </span>
                  <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                    {viewTransaction.mode}
                  </span>
                  {approvalBadge()}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-0.5">{viewTransaction.subCategory}</p>
                  <p className={`text-4xl font-extrabold tracking-tight ${amountColor}`}>
                    {amountSign}{formatCurrency(viewTransaction.amount || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {branch} &bull; {formatDate(viewTransaction.date)}
                  </p>
                  {isRejected && (
                    <p className="mt-2 text-xs font-semibold text-red-600 uppercase tracking-wide">
                      ⚠ This transaction was rejected — no financial impact recorded
                    </p>
                  )}
                </div>

                {/* Payment progress bar — hidden for rejected/pending approval */}
                {viewTransaction.amount > 0 && !isRejected && viewTransaction.approvalStatus !== 'pending_approval' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Paid: {formatCurrency(totalPaid)}</span>
                      <span>{remainingAmount > 0 ? `Remaining: ${formatCurrency(remainingAmount)}` : 'Fully cleared'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / viewTransaction.amount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                {/* Status row */}
                <div className="flex items-center gap-3">
                  {isRejected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-300">
                      <Ban size={13} /> Rejected — No Liquidity Impact
                    </span>
                  ) : viewTransaction.approvalStatus === 'pending_approval' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                      <ShieldAlert size={13} /> Awaiting Admin Approval
                    </span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                      <Clock size={13} /> Pending Payment
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle size={13} /> Fully Cleared
                    </span>
                  )}
                  {viewTransaction.linkedType && viewTransaction.linkedType !== 'manual' && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold tracking-wide border uppercase ${
                      viewTransaction.linkedType === 'invoice'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-violet-50 text-violet-600 border-violet-200'
                    }`}>
                      {viewTransaction.linkedType === 'invoice' ? '🧾' : '📦'} {viewTransaction.linkedType}
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    ['Date',         formatDate(viewTransaction.date)],
                    ['Time',         viewTransaction.time || '—'],
                    ['Branch',       branch],
                    ['Payment Mode', viewTransaction.mode],
                    ['Paid By',      viewTransaction.paidBy || '—'],
                    ['Paid To',      viewTransaction.paidTo || '—'],
                    ...(viewTransaction.bankName          ? [['Bank',          viewTransaction.bankName]          as [string, string]] : []),
                    ...(viewTransaction.chequeNumber      ? [['Cheque #',      viewTransaction.chequeNumber]      as [string, string]] : []),
                    ...(viewTransaction.chequeBank        ? [['Cheque Bank',   viewTransaction.chequeBank]        as [string, string]] : []),
                    ...(viewTransaction.accountablePerson ? [['Accountable',   viewTransaction.accountablePerson] as [string, string]] : []),
                    ...(viewTransaction.salaryMonth       ? [['Salary Month',  viewTransaction.salaryMonth]       as [string, string]] : []),
                    ...(viewTransaction.linkedRef         ? [['Linked Ref',    viewTransaction.linkedRef]         as [string, string]] : []),
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown — hidden for rejected/pending approval */}
                {!isRejected && viewTransaction.approvalStatus !== 'pending_approval' && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400 mb-1">Total Amount</p>
                      <p className="text-base font-bold text-indigo-700">{formatCurrency(viewTransaction.amount || 0)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-green-500 mb-1">Amount Paid</p>
                      <p className="text-base font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${remainingAmount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${remainingAmount > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
                        Remaining
                      </p>
                      <p className={`text-base font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {remainingAmount > 0 ? formatCurrency(remainingAmount) : 'PKR 0'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Note */}
                {viewTransaction.note && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1">Note</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{viewTransaction.note}</p>
                  </div>
                )}

                {/* Rejection reason */}
                {viewTransaction.approvalStatus === 'rejected' && (
                  <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">
                      {viewTransaction.rejectionReason || 'Rejected by admin'}
                    </p>
                  </div>
                )}

                {/* Partial payments timeline — hidden for rejected/pending approval */}
                {!isRejected && viewTransaction.approvalStatus !== 'pending_approval' &&
                  (viewTransaction.partialPayments || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {viewTransaction.partialPayments!.length}
                      </span>
                      Partial Payments
                    </p>
                    <div className="space-y-2">
                      {viewTransaction.partialPayments!.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800">{formatCurrency(p.amount)}</span>
                              <span className="text-xs text-gray-400">·</span>
                              <span className="text-xs text-gray-500">{p.method}</span>
                              {p.chequeNumber && (
                                <span className="text-xs text-gray-400">· #{p.chequeNumber}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.date)}{p.time ? ` at ${p.time}` : ''}</p>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            p.isCleared
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {p.isCleared ? 'Cleared' : 'Uncleared'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                {!isRejected && (
                  <button
                    onClick={() => { setViewTransaction(null); handleEditTransaction(viewTransaction.id); }}
                    className="flex-1 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit size={15} /> Edit
                  </button>
                )}
                <button
                  onClick={() => setViewTransaction(null)}
                  className="flex-1 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}