// Transactions Module - Form View (Create / Edit)

import React, { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, Building2, Wallet, TrendingUp, TrendingDown,
  Upload, Calculator, User, Users, CheckCircle, AlertCircle, Repeat, Loader2,
  Hash, Edit2, Check, X, CreditCard, Lock, BarChart2,
} from 'lucide-react';
import { COMPANIES, SUB_CATEGORIES, TransactionItem, DynamicCategory, PL_CATEGORIES, PLMainCategory, BS_CATEGORIES, BSMainCategory } from '../models/types';
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
  plMainCategory, plSubCategory, setPlMainCategory, setPlSubCategory,
  dynamicSubCategories, onAddSubCategory,
  dynamicPLCategories, onAddPLMainCategory, onAddPLSubCategory, onDeletePLCategory,
  dynamicBSCategories, onAddBSMainCategory, onAddBSSubCategory, onDeleteBSCategory,
  bsMainCategory, bsSubCategory, setBsMainCategory, setBsSubCategory,
}: Props) {
  const [saveAttempted,    setSaveAttempted]    = useState(false);
  const [addingSubCatFor,  setAddingSubCatFor]  = useState<string | null>(null);
  const [newSubCatName,    setNewSubCatName]    = useState('');
  const [savingSubCat,     setSavingSubCat]     = useState(false);
  // P&L inline-add state
  const [addingPLMain,     setAddingPLMain]     = useState(false);
  const [newPLMainName,    setNewPLMainName]    = useState('');
  const [savingPLMain,     setSavingPLMain]     = useState(false);
  const [addingPLSub,      setAddingPLSub]      = useState(false);
  const [newPLSubName,     setNewPLSubName]     = useState('');
  const [savingPLSub,      setSavingPLSub]      = useState(false);
  // Balance Sheet inline-add state
  const [addingBSMain,     setAddingBSMain]     = useState(false);
  const [newBSMainName,    setNewBSMainName]    = useState('');
  const [savingBSMain,     setSavingBSMain]     = useState(false);
  const [addingBSSub,      setAddingBSSub]      = useState(false);
  const [newBSSubName,     setNewBSSubName]     = useState('');
  const [savingBSSub,      setSavingBSSub]      = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const selectedBankData = banks.find(b => b.id === selectedBank);
  const isPreviewId = transactionId?.includes('###');
  const isInflow = transactionType === 'Cash Inflow';

  const handleAddSubCat = async (itemId: string) => {
    if (!newSubCatName.trim()) return;
    setSavingSubCat(true);
    const added = await onAddSubCategory(transactionType, newSubCatName.trim());
    if (added) updateItem(itemId, 'subCategory', added);
    setNewSubCatName('');
    setAddingSubCatFor(null);
    setSavingSubCat(false);
  };

  const handleAddPLMain = async () => {
    if (!newPLMainName.trim()) return;
    setSavingPLMain(true);
    const added = await onAddPLMainCategory(newPLMainName.trim());
    if (added) setPlMainCategory(added as any);
    setNewPLMainName('');
    setAddingPLMain(false);
    setSavingPLMain(false);
  };

  const handleAddPLSub = async () => {
    if (!newPLSubName.trim() || !plMainCategory) return;
    setSavingPLSub(true);
    const added = await onAddPLSubCategory(plMainCategory, newPLSubName.trim());
    if (added) setPlSubCategory(added);
    setNewPLSubName('');
    setAddingPLSub(false);
    setSavingPLSub(false);
  };

  const handleAddBSMain = async () => {
    if (!newBSMainName.trim()) return;
    setSavingBSMain(true);
    const added = await onAddBSMainCategory(newBSMainName.trim());
    if (added) setBsMainCategory(added as any);
    setNewBSMainName('');
    setAddingBSMain(false);
    setSavingBSMain(false);
  };

  const handleAddBSSub = async () => {
    if (!newBSSubName.trim() || !bsMainCategory) return;
    setSavingBSSub(true);
    const added = await onAddBSSubCategory(bsMainCategory, newBSSubName.trim());
    if (added) setBsSubCategory(added);
    setNewBSSubName('');
    setAddingBSSub(false);
    setSavingBSSub(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
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

        {/* Transaction ID */}
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

        {/* General Information */}
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
              <label className={lbl}>
                Date <span className="text-xs font-normal text-gray-400 ml-1">(auto)</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[38px]">
                  <Lock size={13} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">{formatDateDisplay(date)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Date is set automatically and cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Transaction Type */}
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

        {/* Payment Method */}
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

        {/* Multiple toggle */}
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

        {/* Transaction Items */}
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
                {addingSubCatFor === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newSubCatName}
                      onChange={e => setNewSubCatName(e.target.value)}
                      placeholder="New sub-category name..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') { handleAddSubCat(item.id); }
                        if (e.key === 'Escape') { setAddingSubCatFor(null); setNewSubCatName(''); }
                      }}
                      className="flex-1 px-3 py-2 border border-indigo-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button type="button" disabled={savingSubCat || !newSubCatName.trim()}
                      onClick={() => handleAddSubCat(item.id)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {savingSubCat ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    </button>
                    <button type="button"
                      onClick={() => { setAddingSubCatFor(null); setNewSubCatName(''); }}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={item.subCategory}
                      onChange={e => updateItem(item.id, 'subCategory', e.target.value)}
                      className={`flex-1 ${inp} ${saveAttempted && !item.subCategory ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                    >
                      <option value="">Select sub category</option>
                      {(SUB_CATEGORIES[transactionType] || []).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {(dynamicSubCategories || [])
                        .filter(d => d.parentCategory === transactionType)
                        .map(d => (
                          <option key={d.id} value={d.name}>+ {d.name}</option>
                        ))
                      }
                    </select>
                    <button
                      type="button"
                      title="Add new sub-category"
                      onClick={() => { setAddingSubCatFor(item.id); setNewSubCatName(''); }}
                      className="p-2 text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )}
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

        {/* Profit & Loss Classification */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#4f46e5]" /> Profit &amp; Loss Classification
            <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Tag this transaction to a P&amp;L category so it flows into Revenue, COGS, or Operating Expenses automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* ── P&L Main Category ── */}
            <div>
              <label className={lbl}>P&amp;L Category</label>
              {addingPLMain ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" autoFocus value={newPLMainName}
                    onChange={e => setNewPLMainName(e.target.value)}
                    placeholder="e.g. Other Income"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddPLMain(); if (e.key === 'Escape') { setAddingPLMain(false); setNewPLMainName(''); } }}
                    className="flex-1 px-3 py-2 border border-indigo-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button type="button" disabled={savingPLMain || !newPLMainName.trim()} onClick={handleAddPLMain}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {savingPLMain ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button type="button" onClick={() => { setAddingPLMain(false); setNewPLMainName(''); }}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select value={plMainCategory} onChange={e => setPlMainCategory(e.target.value as any)}
                    className={`flex-1 ${inp}`}>
                    <option value="">— Not classified —</option>
                    {/* Built-in P&L main categories */}
                    {(Object.keys(PL_CATEGORIES) as PLMainCategory[]).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {/* User-added P&L main categories */}
                    {dynamicPLCategories.filter(d => d.type === 'plMainCategory').map(d => (
                      <option key={d.id} value={d.name}>✦ {d.name}</option>
                    ))}
                  </select>
                  <button type="button" title="Add new P&L category"
                    onClick={() => { setAddingPLMain(true); setNewPLMainName(''); }}
                    className="p-2 text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors shrink-0">
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* ── P&L Sub Category ── */}
            <div>
              <label className={lbl}>P&amp;L Sub Category</label>
              {addingPLSub ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" autoFocus value={newPLSubName}
                    onChange={e => setNewPLSubName(e.target.value)}
                    placeholder={plMainCategory ? `Sub-category under ${plMainCategory}` : 'Select main category first'}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddPLSub(); if (e.key === 'Escape') { setAddingPLSub(false); setNewPLSubName(''); } }}
                    className="flex-1 px-3 py-2 border border-indigo-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button type="button" disabled={savingPLSub || !newPLSubName.trim() || !plMainCategory} onClick={handleAddPLSub}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {savingPLSub ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button type="button" onClick={() => { setAddingPLSub(false); setNewPLSubName(''); }}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select value={plSubCategory} onChange={e => setPlSubCategory(e.target.value)}
                    disabled={!plMainCategory}
                    className={`flex-1 ${inp} ${!plMainCategory ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}>
                    <option value="">— Select sub category —</option>
                    {/* Built-in sub-categories for selected main */}
                    {plMainCategory && (PL_CATEGORIES[plMainCategory as PLMainCategory] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {/* User-added sub-categories for selected main */}
                    {plMainCategory && dynamicPLCategories
                      .filter(d => d.type === 'plSubCategory' && d.parentCategory === plMainCategory)
                      .map(d => (
                        <option key={d.id} value={d.name}>✦ {d.name}</option>
                      ))}
                  </select>
                  <button type="button" title="Add new P&L sub-category"
                    disabled={!plMainCategory}
                    onClick={() => { setAddingPLSub(true); setNewPLSubName(''); }}
                    className="p-2 text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus size={15} />
                  </button>
                </div>
              )}
              {!plMainCategory && !addingPLSub && (
                <p className="text-xs text-gray-400 mt-1">Select a P&amp;L category first</p>
              )}
            </div>
          </div>

          {/* P&L live preview card */}
          {plMainCategory && (
            <div className={`rounded-xl border p-4 text-sm ${
              plMainCategory === 'Revenue'
                ? 'bg-green-50 border-green-200'
                : plMainCategory === 'Cost of Goods Sold (COGS)'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-purple-50 border-purple-200'
            }`}>
              <p className={`font-semibold mb-2 ${
                plMainCategory === 'Revenue' ? 'text-green-800'
                : plMainCategory === 'Cost of Goods Sold (COGS)' ? 'text-orange-800'
                : 'text-purple-800'
              }`}>
                {plMainCategory === 'Revenue' && '📈 Revenue'}
                {plMainCategory === 'Cost of Goods Sold (COGS)' && '📦 Cost of Goods Sold (COGS)'}
                {plMainCategory === 'Operating Expenses' && '🏢 Operating Expenses'}
                {/* User-added main categories */}
                {!['Revenue','Cost of Goods Sold (COGS)','Operating Expenses'].includes(plMainCategory) && `✦ ${plMainCategory}`}
              </p>
              <div className={`text-xs space-y-1 ${
                plMainCategory === 'Revenue' ? 'text-green-700'
                : plMainCategory === 'Cost of Goods Sold (COGS)' ? 'text-orange-700'
                : 'text-purple-700'
              }`}>
                {plMainCategory === 'Revenue' && <><p>• Adds to <strong>Total Revenue</strong></p><p>• Gross Profit = Revenue − COGS</p></>}
                {plMainCategory === 'Cost of Goods Sold (COGS)' && <><p>• Deducted from Revenue → <strong>Gross Profit</strong></p><p>• Gross Profit = Revenue − COGS</p></>}
                {plMainCategory === 'Operating Expenses' && <><p>• Added to <strong>Total Operating Expenses</strong></p><p>• Net Profit = Gross Profit − Total OpEx</p></>}
                {!['Revenue','Cost of Goods Sold (COGS)','Operating Expenses'].includes(plMainCategory) && <p>• Custom P&amp;L category — tracked separately in reports</p>}
                {plSubCategory && <p className="mt-1 font-medium">Sub: {plSubCategory}</p>}
              </div>

              {/* P&L waterfall mini-diagram */}
              <div className="mt-3 pt-3 border-t border-white/60 grid grid-cols-3 gap-2 text-center text-xs font-medium">
                <div className={`rounded-lg py-1.5 px-2 ${plMainCategory === 'Revenue' ? 'bg-green-200/70 ring-2 ring-green-400' : 'bg-white/70'}`}>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Revenue</p>
                  <p className="text-green-700">Sales</p>
                </div>
                <div className={`rounded-lg py-1.5 px-2 ${plMainCategory === 'Cost of Goods Sold (COGS)' ? 'bg-orange-200/70 ring-2 ring-orange-400' : 'bg-white/70'}`}>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Gross Profit</p>
                  <p className="text-blue-700">Rev − COGS</p>
                </div>
                <div className={`rounded-lg py-1.5 px-2 ${plMainCategory === 'Operating Expenses' ? 'bg-purple-200/70 ring-2 ring-purple-400' : 'bg-white/70'}`}>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Net Profit</p>
                  <p className="text-indigo-700">GP − OpEx</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Sheet Classification */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" /> Balance Sheet Classification
            <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Tag this transaction as an <strong>Asset</strong> or a <strong>Liability / Equity</strong> item so it appears correctly on the Balance Sheet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* ── BS Main Category ── */}
            <div>
              <label className={lbl}>Balance Sheet Side</label>
              {addingBSMain ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" autoFocus value={newBSMainName}
                    onChange={e => setNewBSMainName(e.target.value)}
                    placeholder="e.g. Other Assets"
                    onKeyDown={e => {
                      if (e.key === 'Enter')  handleAddBSMain();
                      if (e.key === 'Escape') { setAddingBSMain(false); setNewBSMainName(''); }
                    }}
                    className="flex-1 px-3 py-2 border border-emerald-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button type="button" disabled={savingBSMain || !newBSMainName.trim()} onClick={handleAddBSMain}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {savingBSMain ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button type="button" onClick={() => { setAddingBSMain(false); setNewBSMainName(''); }}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select value={bsMainCategory} onChange={e => setBsMainCategory(e.target.value as BSMainCategory | '')}
                    className={`flex-1 ${inp}`}>
                    <option value="">— Not classified —</option>
                    {(Object.keys(BS_CATEGORIES) as BSMainCategory[]).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {dynamicBSCategories.filter(d => d.type === 'bsMainCategory').map(d => (
                      <option key={d.id} value={d.name}>✦ {d.name}</option>
                    ))}
                  </select>
                  <button type="button" title="Add new Balance Sheet category"
                    onClick={() => { setAddingBSMain(true); setNewBSMainName(''); }}
                    className="p-2 text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors shrink-0">
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* ── BS Sub Category ── */}
            <div>
              <label className={lbl}>Balance Sheet Line Item</label>
              {addingBSSub ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" autoFocus value={newBSSubName}
                    onChange={e => setNewBSSubName(e.target.value)}
                    placeholder={bsMainCategory ? `Line item under ${bsMainCategory}` : 'Select side first'}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  handleAddBSSub();
                      if (e.key === 'Escape') { setAddingBSSub(false); setNewBSSubName(''); }
                    }}
                    className="flex-1 px-3 py-2 border border-emerald-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button type="button" disabled={savingBSSub || !newBSSubName.trim() || !bsMainCategory} onClick={handleAddBSSub}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {savingBSSub ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button type="button" onClick={() => { setAddingBSSub(false); setNewBSSubName(''); }}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select value={bsSubCategory} onChange={e => setBsSubCategory(e.target.value)}
                    disabled={!bsMainCategory}
                    className={`flex-1 ${inp} ${!bsMainCategory ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}>
                    <option value="">— Select line item —</option>
                    {bsMainCategory && (BS_CATEGORIES[bsMainCategory as BSMainCategory] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {bsMainCategory && dynamicBSCategories
                      .filter(d => d.type === 'bsSubCategory' && d.parentCategory === bsMainCategory)
                      .map(d => (
                        <option key={d.id} value={d.name}>✦ {d.name}</option>
                      ))}
                  </select>
                  <button type="button" title="Add new line item"
                    disabled={!bsMainCategory}
                    onClick={() => { setAddingBSSub(true); setNewBSSubName(''); }}
                    className="p-2 text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus size={15} />
                  </button>
                </div>
              )}
              {!bsMainCategory && !addingBSSub && (
                <p className="text-xs text-gray-400 mt-1">Select a Balance Sheet side first</p>
              )}
            </div>
          </div>

          {/* BS live preview */}
          {bsMainCategory && (
            <div className={`rounded-xl border p-4 text-sm ${
              bsMainCategory === 'Assets'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              {/* Header */}
              <p className={`font-semibold mb-2 ${
                bsMainCategory === 'Assets' ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {bsMainCategory === 'Assets' ? '🏦 Assets' : '📋 Liabilities & Equity'}
                {!['Assets','Liabilities & Equity'].includes(bsMainCategory) && `✦ ${bsMainCategory}`}
              </p>

              <div className={`text-xs space-y-1 mb-3 ${
                bsMainCategory === 'Assets' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {bsMainCategory === 'Assets' && (
                  <><p>• Recorded on the <strong>left side</strong> of the Balance Sheet</p>
                  <p>• Represents what the business <strong>owns</strong></p></>
                )}
                {bsMainCategory === 'Liabilities & Equity' && (
                  <><p>• Recorded on the <strong>right side</strong> of the Balance Sheet</p>
                  <p>• Represents what the business <strong>owes or is funded by</strong></p></>
                )}
                {!['Assets','Liabilities & Equity'].includes(bsMainCategory) && (
                  <p>• Custom Balance Sheet category — tracked separately in reports</p>
                )}
                {bsSubCategory && <p className="mt-1 font-medium">Line item: {bsSubCategory}</p>}
              </div>

              {/* Accounting equation visual */}
              <div className="mt-2 pt-3 border-t border-white/60">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 text-center font-medium">Accounting Equation</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                  <div className={`rounded-lg py-2 px-1 ${bsMainCategory === 'Assets' ? 'bg-emerald-200/80 ring-2 ring-emerald-500 text-emerald-900' : 'bg-white/70 text-emerald-700'}`}>
                    <p className="text-[10px] font-normal text-gray-400 mb-0.5">LEFT</p>
                    Assets
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-lg font-bold">=</div>
                  <div className={`rounded-lg py-2 px-1 ${bsMainCategory === 'Liabilities & Equity' ? 'bg-rose-200/80 ring-2 ring-rose-500 text-rose-900' : 'bg-white/70 text-rose-700'}`}>
                    <p className="text-[10px] font-normal text-gray-400 mb-0.5">RIGHT</p>
                    Liabilities + Equity
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Validation errors */}
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

      {/* Duplicate ID Modal */}
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
              <p className="text-sm text-gray-600">A transaction with this ID already exists. Choose an option below.</p>
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