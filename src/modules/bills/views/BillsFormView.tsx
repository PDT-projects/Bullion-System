// Bills Module - View Layer
// Changes:
// 1. Date field is now LOCKED (read-only display, auto today) — same pattern as Transactions
// 2. Bill Category dropdown has an "+ Add new category" option (like Transactions sub-category)
// 3. All existing fixes retained (vendor Other mode, bank dropdown, cheque fields, amount paid)

import React, { useState } from 'react';
import { BillTransaction, BILL_CATEGORIES, COMPANIES } from '../models/types';
import { BillsService } from '../models/billsService';
import { Button } from '../../../components/ui/button';
import {
  Plus, Trash2, Upload, X,
  Zap, Wifi, Droplets, Receipt,
  Building2, CreditCard, AlertCircle, CheckCircle, Lock, Check, Loader2,
} from 'lucide-react';

interface BankInfo { id: string; name: string; balance: number; }

interface BillsFormViewProps {
  formData: {
    company: string;
    billCategory: string;
    date: string;
    note: string;
  };
  billTransactions: BillTransaction[];
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  predefinedVendors: string[];
  companies: string[];
  banks: BankInfo[];
  allBillCategories: string[];
  onAddBillCategory: (name: string) => Promise<string | null>;
  setFormField: (field: string, value: any) => void;
  addBillTransaction: () => void;
  removeBillTransaction: (id: string) => void;
  updateBillTransaction: (id: string, field: keyof BillTransaction, value: any) => void;
  handleImageUpload: (id: string, file: File) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
}

const inp    = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm';
const lbl    = 'block text-xs font-medium text-gray-600 mb-1';
const errCls = 'border-red-400 ring-1 ring-red-300';

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'Electricity': return <Zap className="w-5 h-5 text-yellow-600" />;
    case 'Internet':    return <Wifi className="w-5 h-5 text-blue-600" />;
    case 'Utilities':   return <Droplets className="w-5 h-5 text-cyan-600" />;
    default:            return <Receipt className="w-5 h-5 text-gray-600" />;
  }
};

// Format date for display (e.g. "Apr 06, 2026")
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const BillsFormView: React.FC<BillsFormViewProps> = ({
  formData, billTransactions, isEditing, isSubmitting, errors,
  predefinedVendors, companies, banks,
  allBillCategories, onAddBillCategory,
  setFormField, addBillTransaction, removeBillTransaction,
  updateBillTransaction, handleImageUpload, handleSubmit, handleCancel, calculateTotal,
}) => {
  const fmt = BillsService.formatCurrency;

  // ── Add new category inline state ────────────────────────────────────────────
  const [addingCategory,  setAddingCategory]  = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory,  setSavingCategory]  = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    const added = await onAddBillCategory(newCategoryName.trim());
    if (added) {
      setFormField('billCategory', added);
      setNewCategoryName('');
      setAddingCategory(false);
    }
    setSavingCategory(false);
  };

  // ── Vendor "Other" mode ──────────────────────────────────────────────────────
  const [otherVendorIds, setOtherVendorIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    billTransactions.forEach(txn => {
      if (txn.paidTo && !predefinedVendors.includes(txn.paidTo as any)) {
        initial.add(txn.id);
      }
    });
    return initial;
  });

  const handleVendorSelect = (txnId: string, value: string) => {
    if (value === '__other__') {
      setOtherVendorIds(prev => new Set(prev).add(txnId));
      updateBillTransaction(txnId, 'paidTo', '');
    } else {
      setOtherVendorIds(prev => { const next = new Set(prev); next.delete(txnId); return next; });
      updateBillTransaction(txnId, 'paidTo', value);
    }
  };

  const handleCustomVendorChange = (txnId: string, value: string) => {
    updateBillTransaction(txnId, 'paidTo', value);
  };

  const onImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(id, file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Bill' : 'Add Bill'}</h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update bill payment details' : 'Create a new utility bill payment'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={formData.company} onChange={(e) => setFormField('company', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.company ? errCls : 'border-gray-300'}`}>
                  {companies.map(c => <option key={c} value={c}>{c.split(': ')[1] || c}</option>)}
                </select>
              </div>
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
            </div>

            {/* Date — LOCKED, auto today */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-xs font-normal text-gray-400 ml-1">(auto)</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Lock size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600">{formatDateDisplay(formData.date)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Date is set automatically and cannot be changed</p>
            </div>

            {/* Bill Category — with "+ Add new" option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Category *</label>

              {/* If adding new category inline */}
              {addingCategory ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName(''); } }}
                      placeholder="New category name..."
                      autoFocus
                      className={`${inp} flex-1`}
                    />
                    <button type="button" onClick={handleAddCategory}
                      disabled={savingCategory || !newCategoryName.trim()}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {savingCategory ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    </button>
                    <button type="button" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      <X size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Press Enter to save · Esc to cancel</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CategoryIcon category={formData.billCategory} />
                  </div>
                  <select
                    value={formData.billCategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setAddingCategory(true);
                      } else {
                        setFormField('billCategory', e.target.value);
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.subCategory ? errCls : 'border-gray-300'}`}>
                    {allBillCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option disabled>──────────────</option>
                    <option value="__add_new__">＋ Add new category...</option>
                  </select>
                </div>
              )}
              {errors.subCategory && <p className="text-red-500 text-xs mt-1">{errors.subCategory}</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input type="text" value={formData.note} onChange={(e) => setFormField('note', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Additional notes" />
            </div>
          </div>

          {/* Bill Transactions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill Transactions</h3>
              {!isEditing && (
                <Button onClick={addBillTransaction} variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus size={16} /> Add Transaction
                </Button>
              )}
            </div>

            <div className="space-y-5">
              {billTransactions.map((txn, index) => (
                <div key={txn.id} className="border rounded-xl p-4 bg-gray-50 space-y-4">
                  {/* Transaction header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Transaction {index + 1}</span>
                    {billTransactions.length > 1 && (
                      <button onClick={() => removeBillTransaction(txn.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Amounts row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className={lbl}>Total Amount *</label>
                      <input type="number" min="0" value={txn.amount || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'amount', Number(e.target.value))}
                        className={`${inp} ${errors[`transaction_${index}_amount`] ? errCls : ''}`}
                        placeholder="0" />
                      {errors[`transaction_${index}_amount`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_amount`]}</p>
                      )}
                    </div>
                    <div>
                      <label className={lbl}>Amount Paid <span className="text-gray-400">(blank=full)</span></label>
                      <input type="number" min="0" value={txn.amountPaid || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'amountPaid', Number(e.target.value))}
                        className={inp} placeholder="Leave blank for full" />
                    </div>
                    <div>
                      <label className={lbl}>Status</label>
                      <div className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 h-[38px] ${
                        txn.paymentStatus === 'Full'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}>
                        {txn.paymentStatus === 'Full'
                          ? <><CheckCircle size={13} /> Full Payment</>
                          : <><AlertCircle size={13} /> Partial — Rem: {fmt(txn.remainingAmount)}</>}
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Bill Month *</label>
                      <input type="month" value={txn.billMonth}
                        onChange={(e) => updateBillTransaction(txn.id, 'billMonth', e.target.value)}
                        className={inp} />
                    </div>
                  </div>

                  {txn.paymentStatus === 'Partial' && txn.remainingAmount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      ⚠️ Partial payment — {fmt(txn.remainingAmount)} remaining will appear in <strong>Pending Payments</strong>
                    </div>
                  )}

                  {/* Parties row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Vendor dropdown */}
                    <div>
                      <label className={lbl}>Paid To (Vendor) *</label>
                      {!otherVendorIds.has(txn.id) && (
                        <select
                          value={predefinedVendors.includes(txn.paidTo as any) ? txn.paidTo : ''}
                          onChange={(e) => handleVendorSelect(txn.id, e.target.value)}
                          className={`${inp} ${errors[`transaction_${index}_paidTo`] ? errCls : ''}`}>
                          <option value="">Select vendor</option>
                          {predefinedVendors.map(v => <option key={v} value={v}>{v}</option>)}
                          <option value="__other__">Other (custom)...</option>
                        </select>
                      )}
                      {otherVendorIds.has(txn.id) && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={txn.paidTo}
                              onChange={(e) => handleCustomVendorChange(txn.id, e.target.value)}
                              className={`${inp} flex-1 ${errors[`transaction_${index}_paidTo`] ? errCls : ''}`}
                              placeholder="Type vendor name..."
                              autoFocus
                            />
                            <button type="button"
                              onClick={() => {
                                setOtherVendorIds(prev => { const next = new Set(prev); next.delete(txn.id); return next; });
                                updateBillTransaction(txn.id, 'paidTo', '');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                              title="Back to list">
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400">Type custom vendor name · click ✕ to go back to list</p>
                        </div>
                      )}
                      {errors[`transaction_${index}_paidTo`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_paidTo`]}</p>
                      )}
                    </div>

                    <div>
                      <label className={lbl}>Paid By</label>
                      <input type="text" value={txn.paidBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'paidBy', e.target.value)}
                        className={inp} placeholder="e.g., PDT Islamabad" />
                    </div>
                    <div>
                      <label className={lbl}>Transaction By</label>
                      <input type="text" value={txn.transactionBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'transactionBy', e.target.value)}
                        className={inp} placeholder="e.g., Manager Ahmed" />
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-3">
                    <div>
                      <label className={lbl}>Payment Method *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Cash', 'Bank', 'Cheque'] as const).map(m => (
                          <button key={m} type="button"
                            onClick={() => updateBillTransaction(txn.id, 'mode', m)}
                            className={`py-2 text-sm rounded-lg border font-medium transition-colors ${
                              txn.mode === m
                                ? 'border-[#4f46e5] bg-[#4f46e5]/5 text-[#4f46e5]'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}>{m}</button>
                        ))}
                      </div>
                    </div>

                    {txn.mode === 'Bank' && (
                      <div className="space-y-2">
                        <div>
                          <label className={lbl}>Select Bank Account *</label>
                          {banks.length > 0 ? (
                            <select value={txn.bankId}
                              onChange={(e) => updateBillTransaction(txn.id, 'bankId', e.target.value)}
                              className={`${inp} ${errors[`transaction_${index}_bankId`] ? errCls : ''}`}>
                              <option value="">— Select Bank —</option>
                              {banks.map(b => (
                                <option key={b.id} value={b.id}>{b.name} — {fmt(b.balance)}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" value={txn.bankName}
                              onChange={(e) => updateBillTransaction(txn.id, 'bankName', e.target.value)}
                              className={inp} placeholder="Enter bank name" />
                          )}
                          {errors[`transaction_${index}_bankId`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_bankId`]}</p>
                          )}
                        </div>
                        {txn.bankId && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Current balance:</span>
                              <span className="font-medium text-blue-700">{fmt(banks.find(b => b.id === txn.bankId)?.balance || 0)}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-gray-500">After payment:</span>
                              <span className="font-semibold text-indigo-700">
                                {fmt((banks.find(b => b.id === txn.bankId)?.balance || 0) - (txn.amountPaid > 0 ? txn.amountPaid : txn.amount))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {txn.mode === 'Cheque' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Cheque Details</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={lbl}>Cheque Number *</label>
                            <input type="text" value={txn.chequeNumber}
                              onChange={(e) => updateBillTransaction(txn.id, 'chequeNumber', e.target.value)}
                              className={`${inp} ${errors[`transaction_${index}_chequeNumber`] ? errCls : ''}`}
                              placeholder="e.g. 001234" />
                            {errors[`transaction_${index}_chequeNumber`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_chequeNumber`]}</p>
                            )}
                          </div>
                          <div>
                            <label className={lbl}>Cheque Date</label>
                            <input type="date" value={txn.chequeDate}
                              onChange={(e) => updateBillTransaction(txn.id, 'chequeDate', e.target.value)}
                              className={inp} />
                          </div>
                          <div>
                            <label className={lbl}>Bank on Cheque</label>
                            <input type="text" value={txn.chequeBank}
                              onChange={(e) => updateBillTransaction(txn.id, 'chequeBank', e.target.value)}
                              className={inp} placeholder="e.g. HBL, MCB" />
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-xs text-purple-700">
                          Cheque payments remain <strong>Uncleared</strong> until manually marked cleared in Pending Payments
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Receipt image */}
                  <div className="border-t pt-3">
                    <label className={lbl}>Receipt Image <span className="text-gray-400">(JPG/PNG, optional)</span></label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4f46e5] hover:bg-[#4f46e5]/5 transition-colors">
                        <Upload size={15} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{txn.imageUrl ? 'Change image' : 'Upload image'}</span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => onImageChange(txn.id, e)} className="hidden" />
                      </label>
                      {txn.imageUrl && (
                        <button onClick={() => updateBillTransaction(txn.id, 'imageUrl', '')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {txn.imageUrl && (
                      <img src={txn.imageUrl} alt="Receipt" className="mt-2 h-20 w-20 object-cover rounded border" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#4f46e5]/10 rounded-lg p-4 flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-[#4f46e5]">{fmt(calculateTotal())}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white hover:text-white">
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Bill' : 'Save Bill(s)')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};