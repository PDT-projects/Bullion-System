// Bills Module - View Layer
// Create/Edit form UI component

import React from 'react';
import { BillTransaction, BILL_CATEGORIES, COMPANIES } from '../models/types';
import { BillsService } from '../models/billsService';
import { Button } from '../../../components/ui/button';
import {
  Plus,
  Trash2,
  Upload,
  X,
  Zap,
  Wifi,
  Droplets,
  Receipt,
  Building2
} from 'lucide-react';

interface BillsFormViewProps {
  formData: {
    company: string;
    billCategory: keyof typeof BILL_CATEGORIES;
    date: string;
    note: string;
  };
  billTransactions: BillTransaction[];
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  predefinedVendors: string[];
  companies: string[];
  banks: any[];
  setFormField: (field: string, value: any) => void;
  addBillTransaction: () => void;
  removeBillTransaction: (id: string) => void;
  updateBillTransaction: (id: string, field: keyof BillTransaction, value: any) => void;
  handleImageUpload: (id: string, file: File) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
}

const CategoryIcon: React.FC<{ category: keyof typeof BILL_CATEGORIES }> = ({ category }) => {
  switch (category) {
    case 'Electricity': return <Zap className="w-5 h-5 text-yellow-600" />;
    case 'Internet':    return <Wifi className="w-5 h-5 text-blue-600" />;
    case 'Utilities':   return <Droplets className="w-5 h-5 text-cyan-600" />;
    default:            return <Receipt className="w-5 h-5 text-gray-600" />;
  }
};

export const BillsFormView: React.FC<BillsFormViewProps> = ({
  formData,
  billTransactions,
  isEditing,
  isSubmitting,
  errors,
  predefinedVendors,
  companies,
  banks,
  setFormField,
  addBillTransaction,
  removeBillTransaction,
  updateBillTransaction,
  handleImageUpload,
  handleSubmit,
  handleCancel,
  calculateTotal
}) => {
  const formatCurrency = BillsService.formatCurrency;

  const onImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(id, file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Bill' : 'Add Bill'}</h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update bill payment details' : 'Create a new utility bill payment'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={formData.company}
                  onChange={(e) => setFormField('company', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  {companies.map(company => (
                    <option key={company} value={company}>{company.split(': ')[1] || company}</option>
                  ))}
                </select>
              </div>
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormField('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Category *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <CategoryIcon category={formData.billCategory} />
                </div>
                <select
                  value={formData.billCategory}
                  onChange={(e) => setFormField('billCategory', e.target.value as keyof typeof BILL_CATEGORIES)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  {Object.keys(BILL_CATEGORIES).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              {errors.subCategory && <p className="text-red-500 text-xs mt-1">{errors.subCategory}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormField('note', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Transactions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill Transactions</h3>
              {!isEditing && (
                <Button onClick={addBillTransaction} variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Transaction
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {billTransactions.map((txn, index) => (
                <div key={txn.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Transaction {index + 1}</span>
                    {billTransactions.length > 1 && (
                      <button
                        onClick={() => removeBillTransaction(txn.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                      <input
                        type="number"
                        value={txn.amount || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'amount', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="0"
                      />
                      {errors[`transaction_${index}_amount`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_amount`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                      <select
                        value={txn.paymentStatus}
                        onChange={(e) => updateBillTransaction(txn.id, 'paymentStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="Full">Full Payment</option>
                        <option value="Partial">Partial Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bill Month</label>
                      <input
                        type="month"
                        value={txn.billMonth}
                        onChange={(e) => updateBillTransaction(txn.id, 'billMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      />
                    </div>
                  </div>

                  {txn.paymentStatus === 'Partial' && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Remaining Amount</label>
                      <input
                        type="number"
                        value={txn.remainingAmount || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'remainingAmount', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="Enter remaining amount"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Paid To (Vendor) *</label>
                      <select
                        value={txn.paidTo}
                        onChange={(e) => updateBillTransaction(txn.id, 'paidTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="">Select vendor</option>
                        {predefinedVendors.map(vendor => (
                          <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                      </select>
                      {errors[`transaction_${index}_paidTo`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_paidTo`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Paid By *</label>
                      <input
                        type="text"
                        value={txn.paidBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'paidBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="e.g., Pakistan Detectors - Islamabad"
                      />
                      {errors[`transaction_${index}_paidBy`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_paidBy`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transaction By</label>
                      <input
                        type="text"
                        value={txn.transactionBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'transactionBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="e.g., Manager Ahmed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                      <select
                        value={txn.mode}
                        onChange={(e) => updateBillTransaction(txn.id, 'mode', e.target.value as 'Cash' | 'Bank' | 'Cheque')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    {(txn.mode === 'Bank' || txn.mode === 'Cheque') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name *</label>
                        {banks.length > 0 ? (
                          <select
                            value={txn.bankName}
                            onChange={(e) => updateBillTransaction(txn.id, 'bankName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                          >
                            <option value="">Select bank</option>
                            {banks.map((bank: any) => (
                              <option key={bank.id} value={bank.name}>
                                {bank.name} (Balance: {formatCurrency(bank.balance)})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={txn.bankName}
                            onChange={(e) => updateBillTransaction(txn.id, 'bankName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            placeholder="Enter bank name"
                          />
                        )}
                        {errors[`transaction_${index}_bankName`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`transaction_${index}_bankName`]}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Receipt Image (JPG/PNG)</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload size={16} className="mr-2" />
                          <span className="text-sm">{txn.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => onImageChange(txn.id, e)}
                            className="hidden"
                          />
                        </label>
                        {txn.imageUrl && (
                          <button
                            onClick={() => updateBillTransaction(txn.id, 'imageUrl', '')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {txn.imageUrl && (
                        <img src={txn.imageUrl} alt="Receipt" className="mt-2 h-20 w-20 object-cover rounded border" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#4f46e5]/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#4f46e5] hover:bg-[#4338ca]"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Bill' : 'Save Bill(s)')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};