// Transactions Module - Form View (Create / Edit)
// Fixes:
// 1. Amount Paid hidden for Cash Inflow (illogical to ask)
// 2. Cheque fields (number, date, bank name) shown when mode = Cheque
// 3. Bank balance preview shown for both Inflow and Outflow

import React, { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, Building2, Wallet, TrendingUp, TrendingDown,
  Upload, Calculator, User, Users, CheckCircle, AlertCircle, Repeat, Loader2,
  Hash, Edit2, Check, X, CreditCard,
} from 'lucide-react';
import { COMPANIES, SUB_CATEGORIES, TransactionItem } from '../models/types';
import { UseTransactionFormViewModelReturn } from '../viewModels/useTransactionFormViewModel';

interface Props extends UseTransactionFormViewModelReturn {}

const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm';
const lbl = 'block text-sm font-medium text-gray-700 mb-1';

export function TransactionFormView({
  office, date, transactionType, paymentMode, selectedBank,
  chequeNumber, chequeDate, chequeBank,
  setChequeNumber, setChequeDate, setChequeBank,
  enableMultiple, transactionItems,
  transactionId, isGeneratingId, isEditingId, setTransactionId, setIsEditingId,
  duplicateIdError, setDuplicateIdError,
  totalAmount, totalPaid, totalRemaining, currentBankBalance, remainingBalanceAfter,
  banks, isLoading, isSaving, isEditing,
  setOffice, setDate, setTransactionType, setPaymentMode, setSelectedBank,
  setEnableMultiple, updateItem, addItem, removeItem,
  handleSave, handleCancel, formatCurrency, formatDateDisplay,
}: Props) {
  const [saveAttempted, setSaveAttempted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const selectedBankData = banks.find(b => b.id === selectedBank);
  const isPreviewId = transactionId?.includes('###');
  // FIX: Hide Amount Paid for Cash Inflow — it's always the full amount
  const isInflow = transactionType === 'Cash Inflow';

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={handleCancel} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <p className="text-gray-500 text-sm mt-0.5">Record a financial transaction</p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Transaction ID ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#4f46e5]" /> Transaction ID
          </h3>
          {isGeneratingId ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-sm text-gray-500">Preparing ID...</span>
            </div>
          ) : isEditingId ? (
            <div className="flex items-center gap-2">
              <input type="text" value={transactionId}
                onChange={e => setTransactionId(e.target.value.toUpperCase())}
                autoFocus placeholder="e.g. TXN-160326-005"
                className="flex-1 px-4 py-2.5 border border-indigo-400 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              <button type="button" onClick={() => setIsEditingId(false)}
                className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check size={16} /></button>
              <button type="button" onClick={() => setIsEditingId(false)}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-lg border ${
                isPreviewId ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-200'
              }`}>
                <span className={`font-mono text-sm font-bold tracking-widest ${isPreviewId ? 'text-gray-400' : 'text-indigo-800'}`}>
                  {transactionId || '—'}
                </span>
                <span className={`text-xs ml-2 ${isPreviewId ? 'text-gray-400' : 'text-indigo-400'}`}>
                  {isPreviewId ? 'assigned on save' : 'auto-generated'}
                </span>
              </div>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditingId(true)}
                  className="p-2.5 bg-white border border-gray-300 text-gray-500 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {isEditing
              ? 'Transaction ID is locked after creation.'
              : isPreviewId
                ? '🔒 A unique sequential ID is assigned automatically on save. Click ✏️ to set a custom ID.'
                : '✅ Custom ID set. Duplicates are blocked on save.'}
          </p>
        </div>

        {/* ── General Information ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#4f46e5]" /> General Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Office/Branch *</label>
              <select value={office} onChange={e => setOffice(e.target.value)} className={inp}>
                {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
              {date && <p className="text-xs text-gray-400 mt-1">{formatDateDisplay(date)}</p>}
            </div>
          </div>
        </div>

        {/* ── Transaction Type ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#4f46e5]" /> Transaction Type
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(['Cash Inflow', 'Cash Outflow', 'Loan'] as const).map(type => (
              <button key={type} type="button" onClick={() => setTransactionType(type)}
                className={`p-4 border-2 rounded-xl text-center transition-colors ${
                  transactionType === type ? 'border-[#4f46e5] bg-[#4f46e5]/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex justify-center mb-2">
                  {type === 'Cash Inflow'  && <TrendingUp  className="w-6 h-6 text-green-500" />}
                  {type === 'Cash Outflow' && <TrendingDown className="w-6 h-6 text-red-500" />}
                  {type === 'Loan'         && <Wallet       className="w-6 h-6 text-blue-500" />}
                </div>
                <span className="font-medium text-sm">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Payment Method ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#4f46e5]" /> Payment Method
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(['Cash', 'Bank', 'Cheque'] as const).map(mode => (
              <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                className={`p-3 border-2 rounded-xl text-center font-medium text-sm transition-colors ${
                  paymentMode === mode
                    ? 'border-[#4f46e5] bg-[#4f46e5]/5 text-[#4f46e5]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}>
                {mode}
              </button>
            ))}
          </div>

          {/* Bank selection */}
          {paymentMode === 'Bank' && (
            <div className="space-y-3">
              <div>
                <label className={lbl}>Select Bank Account *</label>
                <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)}
                  className={`${inp} ${saveAttempted && !selectedBank ? 'border-red-400 ring-1 ring-red-300' : ''}`}>
                  <option value="">Select a bank</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name} — {formatCurrency(b.balance)}</option>
                  ))}
                </select>
              </div>
              {selectedBankData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Current Balance</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(currentBankBalance)}</p>
                </div>
              )}
            </div>
          )}

          {/* FIX: Cheque credentials */}
          {paymentMode === 'Cheque' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Cheque Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Cheque Number *</label>
                  <input type="text" value={chequeNumber}
                    onChange={e => setChequeNumber(e.target.value)}
                    placeholder="e.g. 001234"
                    className={`${inp} ${saveAttempted && !chequeNumber.trim() ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                </div>
                <div>
                  <label className={lbl}>Cheque Date <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="date" value={chequeDate}
                    onChange={e => setChequeDate(e.target.value)}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Bank on Cheque <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={chequeBank}
                    onChange={e => setChequeBank(e.target.value)}
                    placeholder="e.g. HBL, MCB..."
                    className={inp} />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-700">
                ℹ️ Cheque payments are saved as <strong>Uncleared</strong> and appear in Pending Payments until manually cleared.
              </div>
            </div>
          )}

          {/* Balance after transaction preview */}
          {paymentMode === 'Bank' && selectedBank && (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Balance After Transaction</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Balance:</span>
                <span className="font-medium">{formatCurrency(currentBankBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isInflow ? '+ Inflow:' : '− Deducting:'}</span>
                <span className={`font-medium ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(isInflow ? totalAmount : totalPaid)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                <span>Balance After:</span>
                <span className={remainingBalanceAfter < 0 ? 'text-red-600' : 'text-[#4f46e5]'}>
                  {formatCurrency(remainingBalanceAfter)}
                </span>
              </div>
              {remainingBalanceAfter < 0 && (
                <p className="text-xs text-red-600 mt-1">⚠️ This transaction will overdraw the account</p>
              )}
            </div>
          )}
        </div>

        {/* ── Multiple toggle ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-[#4f46e5]" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Enable multiple transactions</p>
              <p className="text-xs text-gray-400">Batch process multiple items at once</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enableMultiple} onChange={e => setEnableMultiple(e.target.checked)} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#4f46e5]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-4 after:transition-all peer-checked:bg-[#4f46e5]"></div>
          </label>
        </div>

        {/* ── Transaction Items ───────────────────────────────────────────── */}
        {transactionItems.map((item, index) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Transaction #{index + 1}</h3>
              {enableMultiple && transactionItems.length > 1 && (
                <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={lbl}>Main Category</label>
                <input type="text" value={transactionType} readOnly className={`${inp} bg-gray-50 text-gray-500`} />
              </div>
              <div>
                <label className={lbl}>Sub Category *</label>
                <select value={item.subCategory} onChange={e => updateItem(item.id, 'subCategory', e.target.value)}
                  className={`${inp} ${saveAttempted && !item.subCategory ? 'border-red-400 ring-1 ring-red-300' : ''}`}>
                  <option value="">Select sub category</option>
                  {(SUB_CATEGORIES[transactionType] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Detail Category <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={item.detailCategory} onChange={e => updateItem(item.id, 'detailCategory', e.target.value)}
                  placeholder="Additional detail..." className={inp} />
              </div>
            </div>

            {/* Amounts */}
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-800 text-sm mb-3">Amount Details</h4>

              {/* Cash Inflow: Total Amount + Amount Received (blank = fully received) */}
              {isInflow ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Total Amount *</label>
                    <input type="number" min="0" value={item.amount || ''}
                      onChange={e => updateItem(item.id, 'amount', Number(e.target.value))}
                      placeholder="0"
                      className={`${inp} ${saveAttempted && (!item.amount || item.amount <= 0) ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                  </div>
                  <div>
                    <label className={lbl}>Amount Received <span className="text-gray-400 font-normal">(blank = full)</span></label>
                    <input type="number" min="0" value={item.amountPaid || ''}
                      onChange={e => updateItem(item.id, 'amountPaid', Number(e.target.value))}
                      placeholder="Leave blank if fully received"
                      className={inp} />
                    <p className="text-xs text-gray-400 mt-1">e.g. installment, partial receipt</p>
                  </div>
                  <div>
                    <label className={lbl}>Status</label>
                    <div className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${
                      item.paymentStatus === 'Full'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                      {item.paymentStatus === 'Full' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                      {item.paymentStatus === 'Full' ? 'Fully Received' : 'Partial Receipt'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Total Amount *</label>
                    <input type="number" min="0" value={item.amount || ''}
                      onChange={e => updateItem(item.id, 'amount', Number(e.target.value))}
                      placeholder="0"
                      className={`${inp} ${saveAttempted && (!item.amount || item.amount <= 0) ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                  </div>
                  <div>
                    <label className={lbl}>Amount Paid <span className="text-gray-400 font-normal">(blank = full)</span></label>
                    <input type="number" min="0" value={item.amountPaid || ''}
                      onChange={e => updateItem(item.id, 'amountPaid', Number(e.target.value))}
                      placeholder="0 = full payment" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Payment Status</label>
                    <div className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${
                      item.paymentStatus === 'Full'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                      {item.paymentStatus === 'Full' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                      {item.paymentStatus}
                    </div>
                  </div>
                </div>
              )}

              {item.paymentStatus === 'Partial' && item.remainingAmount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  {isInflow
                    ? `📥 Partial receipt — ${formatCurrency(item.remainingAmount)} still to be received. Will appear in Pending Receivable.`
                    : `⚠️ Partial — Remaining: ${formatCurrency(item.remainingAmount)} will appear in Pending Payments.`}
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                <Users size={14} /> Parties Involved
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Paid By <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#4f46e5] focus-within:border-[#4f46e5] bg-white overflow-hidden">
                    <span className="flex items-center justify-center pl-3 pr-2 text-gray-400 shrink-0">
                      <User size={14} />
                    </span>
                    <input type="text" value={item.paidBy} onChange={e => updateItem(item.id, 'paidBy', e.target.value)}
                      placeholder="Who paid"
                      className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none placeholder-gray-400" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Paid To <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#4f46e5] focus-within:border-[#4f46e5] bg-white overflow-hidden">
                    <span className="flex items-center justify-center pl-3 pr-2 text-gray-400 shrink-0">
                      <User size={14} />
                    </span>
                    <input type="text" value={item.paidTo} onChange={e => updateItem(item.id, 'paidTo', e.target.value)}
                      placeholder="Who received"
                      className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none placeholder-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="border-t pt-4 mb-4">
              <label className={lbl}>Note / Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={item.note} onChange={e => updateItem(item.id, 'note', e.target.value)}
                rows={2} placeholder="Add details..." className={`${inp} resize-none`} />
            </div>

            {/* Receipt */}
            <div className="border-t pt-4">
              <label className={lbl}>Receipt / Image <span className="text-gray-400 font-normal">(optional)</span></label>
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4f46e5] hover:bg-[#4f46e5]/5 transition-colors w-fit">
                <Upload size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Upload Image</span>
                <input type="file" accept="image/*" onChange={e => updateItem(item.id, 'receipt', e.target.files?.[0] || null)} className="hidden" />
              </label>
              {item.receipt && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> {(item.receipt as File).name}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add Another */}
        {enableMultiple && (
          <button type="button" onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#4f46e5] hover:text-[#4f46e5] hover:bg-[#4f46e5]/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <Plus size={16} /> Add Another Transaction
          </button>
        )}

        {/* Grand Total */}
        <div className="bg-[#4f46e5] text-white rounded-xl p-5">
          <h3 className="font-semibold mb-4">Summary</h3>
          {isInflow ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-white/70 text-xs mb-1">Total Inflow Amount</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="border-l border-white/20">
                <p className="text-white/70 text-xs mb-1">Items</p>
                <p className="text-2xl font-bold">{transactionItems.length}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/70 text-xs mb-1">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="border-x border-white/20">
                <p className="text-white/70 text-xs mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs mb-1">Total Remaining</p>
                <p className="text-2xl font-bold text-yellow-300">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Inline validation errors */}
        {saveAttempted && !isSaving && (
          (() => {
            const errs: string[] = [];
            if (!office) errs.push('Select an office/branch');
            if (!date)   errs.push('Select a date');
            transactionItems.forEach((item, i) => {
              const n = transactionItems.length > 1 ? ` (item ${i + 1})` : '';
              if (!item.subCategory)               errs.push(`Sub category is required${n}`);
              if (!item.amount || item.amount <= 0) errs.push(`Amount must be greater than 0${n}`);
              if (!isInflow && item.amountPaid > item.amount) errs.push(`Amount paid cannot exceed total${n}`);
            });
            if (paymentMode === 'Bank' && !selectedBank)          errs.push('Select a bank for bank transactions');
            if (paymentMode === 'Cheque' && !chequeNumber.trim()) errs.push('Enter the cheque number');
            if (errs.length === 0) return null;
            return (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
                <p className="font-semibold mb-2 flex items-center gap-2"><AlertCircle size={16} /> Please fix the following:</p>
                {errs.map((e, i) => <p key={i}>• {e}</p>)}
              </div>
            );
          })()
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-10 pt-2">
          <button type="button" onClick={handleCancel}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Cancel
          </button>
          <button type="button"
            onClick={() => { setSaveAttempted(true); handleSave(); }}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 transition-colors font-semibold">
            {isSaving
              ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
              : <><Plus size={16} /> {isEditing ? 'Save Changes' : `Save ${transactionItems.length > 1 ? transactionItems.length + ' Transactions' : 'Transaction'}`}</>
            }
          </button>
        </div>

      </div>

      {/* ── Duplicate Transaction ID Modal ─────────────────────────────────── */}
      {duplicateIdError && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full"><AlertCircle className="w-6 h-6 text-white" /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Duplicate Transaction ID</h3>
                <p className="text-red-100 text-sm">This ID is already in use</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-1">Conflicting ID</p>
                <p className="font-mono text-xl font-bold text-red-700 tracking-widest">{duplicateIdError}</p>
              </div>
              <p className="text-sm text-gray-600">
                A transaction with this ID already exists. Choose an option below.
              </p>
              <div className="text-sm text-gray-500 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <p>Click <strong>"Use New ID"</strong> — system auto-assigns a fresh unique ID</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <p>Click <strong>"Edit ID"</strong> — manually enter a different custom ID</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button type="button"
                onClick={() => { setDuplicateIdError(''); setIsEditingId(true); setTransactionId(''); }}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                ✏️ Edit ID
              </button>
              <button type="button"
                onClick={() => {
                  setDuplicateIdError('');
                  const now = new Date();
                  const dd  = String(now.getDate()).padStart(2, '0');
                  const mm  = String(now.getMonth() + 1).padStart(2, '0');
                  const yy  = String(now.getFullYear()).slice(-2);
                  setTransactionId(`TXN-${dd}${mm}${yy}-###`);
                  setIsEditingId(false);
                }}
                className="flex-1 py-2.5 bg-[#4f46e5] text-white rounded-xl font-semibold hover:bg-[#4338ca] transition-colors">
                🔄 Use New ID
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}