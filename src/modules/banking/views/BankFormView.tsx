// Banking Module - Bank Form View
// UI component for create/edit bank account
// Updated with loading states for Firebase integration
// Updated: multi-currency support (AED / PKR) + slate-700 color fix for buttons

import React from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Landmark,
  Save,
  Loader2,
  Database,
  Coins
} from 'lucide-react';
import { BankFormData } from '../models/types';

interface BankFormViewProps {
  // Form State
  formData: BankFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  
  // Meta
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof BankFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number, currency?: 'AED' | 'PKR') => string;
  isValid: boolean;
}

const CURRENCIES: Array<'AED' | 'PKR'> = ['AED', 'PKR'];

export const BankFormView: React.FC<BankFormViewProps> = ({
  formData,
  errors,
  isLoading,
  isSaving,
  isEditMode,
  pageTitle,
  submitButtonText,
  setFormField,
  clearFieldError,
  handleSubmit,
  handleCancel,
  formatCurrency,
  isValid
}) => {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const currentCurrency = formData.currency || 'AED';

  // Loading State (for edit mode when fetching data)
  if (isLoading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-slate-700/10 rounded-full inline-block mb-4">
            <Loader2 className="animate-spin text-slate-700" size={48} />
          </div>
          <p className="text-lg font-medium text-gray-900">Loading bank details...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching data from database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update bank account details' : 'Create a new bank account with initial balance'}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bank Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormField('name', e.target.value);
                    clearFieldError('name');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.name 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                  }`}
                  placeholder="e.g., Habib Bank Limited"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Number *
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    setFormField('accountNumber', e.target.value);
                    clearFieldError('accountNumber');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.accountNumber 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                  }`}
                  placeholder="e.g., HBL-1234567890"
                />
              </div>
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This must be unique across all bank accounts
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Currency *
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={currentCurrency}
                  onChange={(e) => {
                    setFormField('currency', e.target.value as 'AED' | 'PKR');
                    clearFieldError('currency');
                  }}
                  disabled={isSaving || isEditMode}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.currency
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                  }`}
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
              </div>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {isEditMode
                  ? 'Currency cannot be changed after the account is created'
                  : 'Choose the currency this account holds and transacts in (e.g. PKR for local accounts, AED for UAE accounts)'}
              </p>
            </div>

            {/* Initial Balance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isEditMode ? 'Current Balance' : 'Initial Balance'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {currentCurrency}
                </span>
                <input
                  type="number"
                  value={formData.balance || ''}
                  onChange={(e) => {
                    setFormField('balance', Number(e.target.value));
                    clearFieldError('balance');
                  }}
                  disabled={isSaving}
                  className={`w-full pl-14 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.balance 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.balance && (
                <p className="mt-1 text-sm text-red-600">{errors.balance}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {isEditMode 
                  ? 'Balance is updated automatically through transactions and transfers' 
                  : `Starting balance for this account in ${currentCurrency} (can be 0)`}
              </p>
            </div>

            {/* Database Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database className="text-blue-500 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-blue-900">Database Storage</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This bank account will be securely stored in Firebase and will be available across all devices.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Preview */}
            <div className="bg-slate-700/10 border border-slate-700/20 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Account Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="font-medium text-gray-900">
                    {formData.name || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">
                    {formData.accountNumber || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium text-gray-900">{currentCurrency}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700/20 pt-2 mt-2">
                  <span className="text-gray-600">{isEditMode ? 'Current' : 'Initial'} Balance:</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(formData.balance, currentCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
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