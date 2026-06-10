// Banking Module - Transfer Form View
// UI component for creating bank transfers

import React from 'react';
import { 
  ArrowLeft, 
  ArrowRightLeft,
  Building2,
  Calendar,
  DollarSign,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { TransferFormData, Bank } from '../models/types';

interface TransferFormViewProps {
  // Form State
  formData: TransferFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  
  // Meta
  pageTitle: string;
  submitButtonText: string;
  
  // Data
  banks: Bank[];
  availableBanks: Bank[];
  
  // Actions
  setFormField: (field: keyof TransferFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
}

export const TransferFormView: React.FC<TransferFormViewProps> = ({
  formData,
  errors,
  isLoading,
  isSaving,
  pageTitle,
  submitButtonText,
  banks,
  availableBanks,
  setFormField,
  clearFieldError,
  handleSubmit,
  handleCancel,
  formatCurrency,
  isValid
}) => {
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  const fromBank = banks.find(b => b.id === formData.fromBankId);
  const toBank = banks.find(b => b.id === formData.toBankId);
  const hasInsufficientFunds = fromBank && formData.amount > fromBank.balance;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-gray-600 mt-1">Transfer funds between bank accounts</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* From Bank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Bank *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                <select
                  value={formData.fromBankId}
                  onChange={(e) => {
                    setFormField('fromBankId', e.target.value);
                    clearFieldError('fromBankId');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.fromBankId 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#374151]/20 focus:border-[#374151]'
                  } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select source bank</option>
                  {availableBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.fromBankId && (
                <p className="mt-1 text-sm text-red-600">{errors.fromBankId}</p>
              )}
              {availableBanks.length === 0 && (
                <p className="mt-1 text-sm text-orange-600">
                  No banks with available balance. Please add funds first.
                </p>
              )}
            </div>

            {/* To Bank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Bank *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                <select
                  value={formData.toBankId}
                  onChange={(e) => {
                    setFormField('toBankId', e.target.value);
                    clearFieldError('toBankId');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.toBankId 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#374151]/20 focus:border-[#374151]'
                  } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select destination bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id} disabled={bank.id === formData.fromBankId}>
                      {bank.name} {bank.id === formData.fromBankId ? '(same as source)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.toBankId && (
                <p className="mt-1 text-sm text-red-600">{errors.toBankId}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">AED</span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => {
                    setFormField('amount', Number(e.target.value));
                    clearFieldError('amount');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.amount || hasInsufficientFunds
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#374151]/20 focus:border-[#374151]'
                  } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  min="1"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              {hasInsufficientFunds && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Insufficient funds. Available: {formatCurrency(fromBank.balance)}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormField('date', e.target.value);
                    clearFieldError('date');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.date 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#374151]/20 focus:border-[#374151]'
                  } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormField('note', e.target.value)}
                disabled={isSaving}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-[#374151] ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Add any additional notes about this transfer..."
              />
            </div>

            {/* Transfer Preview */}
            {(fromBank && toBank && formData.amount > 0) && (
              <div className="bg-[#374151]/10 border border-[#374151]/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-[#374151]" />
                  Transfer Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium text-red-600">{fromBank.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium text-green-600">{toBank.name}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#374151]/20 pt-2 mt-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-[#374151]">{formatCurrency(formData.amount)}</span>
                  </div>
                  {fromBank && (
                    <>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>From bank balance after:</span>
                        <span>{formatCurrency(fromBank.balance - formData.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>To bank balance after:</span>
                        <span>{formatCurrency(toBank.balance + formData.amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || hasInsufficientFunds || isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {submitButtonText}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};