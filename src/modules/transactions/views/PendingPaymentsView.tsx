// Transactions Module - Pending Payments View

import React from 'react';
import {
  Eye, Trash2, X, Check, AlertCircle, Clock, DollarSign,
  Plus, Filter, Loader2,
} from 'lucide-react';
import { Transaction } from '../models/types';
import { UsePendingPaymentsViewModelReturn } from '../viewModels/usePendingPaymentsViewModel';

interface Props extends UsePendingPaymentsViewModelReturn {}

export function PendingPaymentsView({
  filteredTransactions, viewTransaction, paymentModal, selectedTransactionId,
  filterStatus, paymentData, banks, isLoading, summaryStats,
  setViewTransaction, setPaymentModal, setSelectedTransactionId, setFilterStatus, setPaymentData,
  addPartialPayment, markPaymentAsCleared, deleteTransaction,
  getTransactionTotals, formatCurrency, formatDateTime, getCategoryColor, getPaymentStatusColor,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pending Payments</h2>
        <p className="text-gray-500 text-sm mt-1">Transactions with unpaid or uncleared amounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pending',      value: formatCurrency(summaryStats.totalPending), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Uncleared Payments', value: summaryStats.unclearedCount,               icon: Clock,       color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Total Transactions', value: summaryStats.totalTransactions,            icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-white/50 p-4 flex items-center justify-between`}>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
            <s.icon className={s.color} size={32} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <h3 className="font-medium text-gray-900 text-sm">Filters</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['All', 'PartiallyPaid', 'Uncleared'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s as any)}
              className={`py-2 text-sm rounded-lg border font-medium transition-colors ${filterStatus === s ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'All' ? 'All Pending' : s === 'PartiallyPaid' ? 'Partially Paid' : 'Uncleared'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No pending payments</p>
            <p className="text-sm text-gray-400 mt-1">All transactions are fully cleared</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Transaction ID', 'Date & Time', 'Category', 'Amount', 'Paid', 'Remaining', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map(t => {
                  const { totalPaid, remainingAmount } = getTransactionTotals(t);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-indigo-600">{t.transactionId || t.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(t.date, t.time)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(t.mainCategory)}`}>
                          {t.mainCategory}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{t.subCategory}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatCurrency(totalPaid)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-red-600">{formatCurrency(remainingAmount)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(t)}`}>
                          {(t.partialPayments || []).some(p => !p.isCleared) ? 'Uncleared' : remainingAmount > 0 ? 'Partially Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedTransactionId(t.id); setPaymentModal(true); setPaymentData({ amount: 0, bankId: '', method: 'Cash' }); }}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors">
                            💳 Pay
                          </button>
                          <button onClick={() => setViewTransaction(t)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded" title="View"><Eye size={15} /></button>
                          <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded" title="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Payment Details</h3>
              <button onClick={() => setViewTransaction(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Transaction ID', viewTransaction.transactionId],
                  ['Date & Time',   formatDateTime(viewTransaction.date, viewTransaction.time)],
                  ['Category',      viewTransaction.mainCategory],
                  ['Sub Category',  viewTransaction.subCategory],
                  ['Paid By',       viewTransaction.paidBy || '—'],
                  ['Paid To',       viewTransaction.paidTo || '—'],
                  ['Mode',          viewTransaction.mode],
                  ['Bank',          viewTransaction.bankName || '—'],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-medium text-gray-900">{v}</p></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total Amount',  formatCurrency(viewTransaction.amount), 'bg-blue-50 text-blue-700'],
                  ['Amount Paid',   formatCurrency(getTransactionTotals(viewTransaction).totalPaid),   'bg-green-50 text-green-700'],
                  ['Remaining',     formatCurrency(getTransactionTotals(viewTransaction).remainingAmount), 'bg-red-50 text-red-700'],
                ].map(([l, v, cls]) => (
                  <div key={l} className={`p-3 rounded-lg ${cls} text-center`}>
                    <p className="text-xs opacity-70">{l}</p>
                    <p className="font-bold text-lg">{v}</p>
                  </div>
                ))}
              </div>
              {(viewTransaction.partialPayments || []).length > 0 && (
                <div>
                  <p className="font-semibold text-gray-800 mb-2 text-sm">Partial Payment History</p>
                  <div className="space-y-2">
                    {viewTransaction.partialPayments!.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(p.amount)} via {p.method}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(p.date, p.time)}</p>
                          {p.chequeNumber && <p className="text-xs text-gray-400">Cheque: {p.chequeNumber}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${p.isCleared ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.isCleared ? 'Cleared' : 'Pending'}
                          </span>
                          {!p.isCleared && p.method !== 'Bank' && (
                            <button onClick={() => markPaymentAsCleared(viewTransaction.id, p.id)}
                              className="text-xs bg-[#4f46e5] text-white px-2 py-1 rounded hover:bg-[#4338ca] flex items-center gap-1">
                              <Check size={11} /> Clear
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewTransaction.note && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Note</p>
                  <p className="text-sm text-gray-800">{viewTransaction.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && selectedTransactionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add Payment</h3>
              <button onClick={() => { setPaymentModal(false); setSelectedTransactionId(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const tx = filteredTransactions.find(t => t.id === selectedTransactionId);
                return tx ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500">Remaining Amount</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(getTransactionTotals(tx).remainingAmount)}</p>
                  </div>
                ) : null;
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay *</label>
                <input type="number" min="0" step="100" value={paymentData.amount || ''}
                  onChange={e => setPaymentData({ amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select value={paymentData.method} onChange={e => setPaymentData({ method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>
              {paymentData.method === 'Cheque' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number *</label>
                  <input type="text" value={paymentData.chequeNumber || ''}
                    onChange={e => setPaymentData({ chequeNumber: e.target.value })}
                    placeholder="Enter cheque number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
                </div>
              )}
              {paymentData.method === 'Bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                  <select value={paymentData.bankId} onChange={e => setPaymentData({ bankId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
                    <option value="">-- Select Bank --</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name} — {formatCurrency(b.balance)}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setPaymentModal(false); setSelectedTransactionId(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={addPartialPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                <Plus size={15} /> Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}