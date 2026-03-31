// Banking Module - Cash List View
// Clean ledger: Date | Type | Sub-Category | Note | Amount | Balance
// Removed: Company, Category columns (as requested)
// Fixed: search icon overlap, table header spacing, border spacing

import React, { useState } from 'react';
import {
  ArrowLeft, Search, Trash2, DollarSign, TrendingUp, TrendingDown,
  Wallet, X, Save, Loader2, RefreshCw, ArrowUpRight, ArrowDownRight,
  Clock, AlertCircle, Tag, StickyNote,
} from 'lucide-react';
import { CashTransaction, CashStats, CashFilters } from '../models/types';

interface CashListViewProps {
  filteredTransactions: CashTransaction[];
  stats: CashStats;
  cashRecords: CashTransaction[];
  isLoading: boolean;
  error: string | null;
  filters: CashFilters;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'inflow' | 'outflow') => void;
  onAddTransaction: () => void;  // kept for prop compatibility
  onDeleteTransaction: (id: string) => void;
  onBack: () => void;
  onSetOpeningBalance: (amount: number) => Promise<void>;
  refreshCashData: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: '' };
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  } catch {
    return { date: dateStr, time: '' };
  }
}

function PageHeader({ onBack, isLoading, onRefresh, onSetBalance }: {
  onBack: () => void; isLoading: boolean; onRefresh: () => void; onSetBalance: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cash in Hand</h2>
          <p className="text-sm text-gray-500 mt-0.5">Live cash ledger — all movements tracked</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={onSetBalance}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] text-sm font-medium transition-colors">
          <Wallet size={14} /> Set Opening Balance
        </button>
      </div>
    </div>
  );
}

export const CashListView: React.FC<CashListViewProps> = ({
  filteredTransactions, stats, cashRecords, isLoading, error,
  filters, setSearchTerm, setFilterType,
  onDeleteTransaction, onBack, onSetOpeningBalance, refreshCashData, formatCurrency,
}) => {
  const [showModal,            setShowModal]            = useState(false);
  const [openingBalanceInput,  setOpeningBalanceInput]  = useState('');
  const [isSavingBalance,      setIsSavingBalance]      = useState(false);

  const handleSaveBalance = async () => {
    const amount = parseFloat(openingBalanceInput) || 0;
    if (amount < 0) return;
    setIsSavingBalance(true);
    try {
      await onSetOpeningBalance(amount);
      setShowModal(false);
      setOpeningBalanceInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBalance(false);
    }
  };

  const openingBalance = stats.openingBalance ?? 0;

  // Build running balance per row (oldest→newest order for calculation, display newest first)
  const reversed = [...filteredTransactions].reverse();
  let running = openingBalance;
  const withBalance = reversed.map(txn => {
    const isInflow = txn.mainCategory === 'Cash Inflow';
    running = isInflow ? running + txn.amount : running - txn.amount;
    return { ...txn, runningBalance: running };
  });
  // Flip back to newest-first for display
  const ledgerRows = withBalance.reverse();

  // ── Loading ──
  if (isLoading && filteredTransactions.length === 0 && cashRecords.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader onBack={onBack} isLoading onRefresh={refreshCashData} onSetBalance={() => setShowModal(true)} />
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
          <Loader2 className="animate-spin text-[#4f46e5] mb-3" size={36} />
          <p className="text-sm text-gray-500">Loading cash ledger...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error && filteredTransactions.length === 0 && cashRecords.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader onBack={onBack} isLoading={isLoading} onRefresh={refreshCashData} onSetBalance={() => setShowModal(true)} />
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-red-200">
          <AlertCircle className="text-red-300 mb-3" size={36} />
          <p className="text-sm font-semibold text-red-700 mb-1">Failed to load cash data</p>
          <p className="text-xs text-red-400 mb-4">{error}</p>
          <button onClick={refreshCashData}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] text-sm font-medium">
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      <PageHeader onBack={onBack} isLoading={isLoading} onRefresh={refreshCashData} onSetBalance={() => setShowModal(true)} />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cash in Hand',    value: formatCurrency(stats.totalCashInHand), color: 'text-[#4f46e5]', bg: 'bg-indigo-50', Icon: Wallet,      ic: 'text-[#4f46e5]' },
          { label: 'Opening Balance', value: formatCurrency(stats.openingBalance),  color: 'text-blue-600',  bg: 'bg-blue-50',   Icon: DollarSign,   ic: 'text-blue-500'  },
          { label: 'Total Inflow',    value: formatCurrency(stats.totalInflow),     color: 'text-green-600', bg: 'bg-green-50',  Icon: TrendingUp,   ic: 'text-green-500' },
          { label: 'Total Outflow',   value: formatCurrency(stats.totalOutflow),    color: 'text-red-600',   bg: 'bg-red-50',    Icon: TrendingDown,  ic: 'text-red-500'   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 ${s.bg} rounded-lg`}><s.Icon size={14} className={s.ic} /></div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          {/* Search — icon OUTSIDE the input as a flex sibling, no absolute positioning */}
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#4f46e5] focus-within:border-[#4f46e5] bg-white overflow-hidden">
            <span className="pl-3 pr-2 text-gray-400 shrink-0 flex items-center">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by category or note..."
              value={filters.searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none placeholder-gray-400"
            />
          </div>
          {/* Filter pills */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
            {(['all', 'inflow', 'outflow'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filters.filterType === f ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f === 'all' ? 'All' : f === 'inflow' ? '↑ Inflow' : '↓ Outflow'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">
            Cash Ledger
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'})
            </span>
          </h3>
        </div>

        {openingBalance > 0 || filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '600px' }}>

              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="pl-5 pr-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sub-Category</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Note</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pr-5">Balance</th>
                  <th className="w-10" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {/* Opening Balance Row */}
                {openingBalance > 0 && (
                  <tr className="bg-indigo-50/40">
                    <td className="pl-5 pr-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                        <Clock size={11} /> Opening Balance
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                        Opening
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-300">—</td>
                    <td className="px-4 py-4 text-xs text-gray-400 italic">Initial cash on hand</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-indigo-700">{formatCurrency(openingBalance)}</span>
                    </td>
                    <td className="px-4 py-4 pr-5 text-right">
                      <span className="text-sm font-bold text-indigo-700">{formatCurrency(openingBalance)}</span>
                    </td>
                    <td />
                  </tr>
                )}

                {/* Empty message when no transactions */}
                {ledgerRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <DollarSign size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-400">No cash transactions yet</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Transactions made with Cash payment mode will appear here automatically
                      </p>
                    </td>
                  </tr>
                )}

                {/* Transaction rows */}
                {ledgerRows.map(txn => {
                  const isInflow = txn.mainCategory === 'Cash Inflow';
  const { date } = formatDateTime(txn.date);
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/70 transition-colors">

                      {/* Date & Time */}
                      <td className="pl-5 pr-4 py-4">
                        <p className="text-sm font-medium text-gray-800">{date}</p>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          isInflow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isInflow ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {isInflow ? 'Inflow' : 'Outflow'}
                        </span>
                      </td>

                      {/* Sub-Category */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tag size={11} className="text-gray-300 shrink-0" />
                          <span className="text-sm text-gray-700 truncate max-w-[160px]">
                            {txn.subCategory || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-4">
                        {txn.note ? (
                          <div className="flex items-start gap-1.5 max-w-[180px]">
                            <StickyNote size={11} className="text-gray-300 shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-500 line-clamp-2">{txn.note}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-200">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-semibold ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
                          {isInflow ? '+' : '−'}{formatCurrency(txn.amount)}
                        </span>
                      </td>

                      {/* Running Balance */}
                      <td className="px-4 py-4 pr-5 text-right">
                        <span className={`text-sm font-bold ${(txn as any).runningBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                          {formatCurrency((txn as any).runningBalance)}
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="pr-3 py-4 text-center">
                        <button onClick={() => onDeleteTransaction(txn.id)}
                          className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer: closing balance */}
              {(openingBalance > 0 || filteredTransactions.length > 0) && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={5} className="pl-5 pr-4 py-3 text-sm font-semibold text-gray-700">
                      Current Cash in Hand
                    </td>
                    <td className="px-4 py-3 pr-5 text-right">
                      <span className={`text-base font-bold ${stats.totalCashInHand >= 0 ? 'text-[#4f46e5]' : 'text-red-600'}`}>
                        {formatCurrency(stats.totalCashInHand)}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* No opening balance set yet */
          <div className="py-20 text-center">
            <div className="inline-flex p-4 bg-indigo-50 rounded-full mb-4">
              <Wallet size={30} className="text-indigo-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">No cash ledger yet</p>
            <p className="text-xs text-gray-400 mb-5">Set your opening balance to begin tracking.</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] text-sm font-medium">
              <Wallet size={14} /> Set Opening Balance
            </button>
          </div>
        )}
      </div>

      {/* ── Opening Balance Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Set Opening Balance</h3>
                <p className="text-xs text-gray-400 mt-0.5">Initial cash on hand before transactions</p>
              </div>
              <button onClick={() => setShowModal(false)} disabled={isSavingBalance}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (PKR)</label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#4f46e5] focus-within:border-[#4f46e5] overflow-hidden">
                <span className="pl-3 pr-2 text-gray-400 text-sm font-medium shrink-0">PKR</span>
                <input
                  type="number"
                  value={openingBalanceInput}
                  onChange={e => setOpeningBalanceInput(e.target.value)}
                  disabled={isSavingBalance}
                  className="flex-1 py-3 pr-3 text-sm bg-transparent outline-none disabled:opacity-50"
                  placeholder="0"
                  min="0"
                  step="1"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">This appears as the first row in the cash ledger.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={isSavingBalance}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSaveBalance}
                disabled={!openingBalanceInput || parseFloat(openingBalanceInput) < 0 || isSavingBalance}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] text-sm font-medium disabled:opacity-50">
                {isSavingBalance
                  ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                  : <><Save size={13} /> Save</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};