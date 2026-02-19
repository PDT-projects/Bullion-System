// Banking Module - Cash Form View
// UI component for creating cash transactions

import React from 'react';
import { 
  ArrowLeft, 
  DollarSign,
  Calendar,
  Building2,
  Save,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CashFormData {
  date: string;
  company: string;
  mainCategory: 'Cash Inflow' | 'Cash Outflow';
  subCategory: string;
  amount: number;
  note: string;
}

interface CashFormViewProps {
  // Form State
  formData: CashFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  
  // Meta
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof CashFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
}

const CASH_INFLOW_CATEGORIES = ['Sales', 'Service Income', 'Investment', 'Loan Received', 'Other Income'];
const CASH_OUTFLOW_CATEGORIES = ['Purchases', 'Expenses', 'Salaries', 'Rent', 'Utilities', 'Other Expenses'];

export const CashFormView: React.FC<CashFormViewProps> = ({
  formData,
  errors,
  isLoading,
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

  const availableSubCategories = formData.mainCategory === 'Cash Inflow' 
    ? CASH_INFLOW_CATEGORIES 
    : CASH_OUTFLOW_CATEGORIES;

  const isInflow = formData.mainCategory === 'Cash Inflow';

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
            <p className="text-gray-600 mt-1">Record a cash inflow or outflow transaction</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormField('mainCategory', 'Cash Inflow')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                    formData.mainCategory === 'Cash Inflow'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <TrendingUp size={20} />
                  Cash Inflow
                </button>
                <button
                  type="button"
                  onClick={() => setFormField('mainCategory', 'Cash Outflow')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                    formData.mainCategory === 'Cash Outflow'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-200'
                  }`}
                >
                  <TrendingDown size={20} />
                  Cash Outflow
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.date 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company / Party *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => {
                    setFormField('company', e.target.value);
                    clearFieldError('company');
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.company 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'
                  }`}
                  placeholder="Enter company or party name"
                />
              </div>
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.subCategory}
                onChange={(e) => {
                  setFormField('subCategory', e.target.value);
                  clearFieldError('subCategory');
                }}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.subCategory 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'
                }`}
              >
                <option value="">Select category</option>
                {availableSubCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-600">{errors.subCategory}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  PKR
                </span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => {
                    setFormField('amount', Number(e.target.value));
                    clearFieldError('amount');
                  }}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.amount 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'
                  }`}
                  placeholder="0"
                  min="1"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Transaction Preview */}
            {formData.amount > 0 && (
              <div className={`rounded-lg p-4 border ${
                isInflow 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                  isInflow ? 'text-green-900' : 'text-red-900'
                }`}>
                  {isInflow ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  Transaction Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className={`font-medium ${isInflow ? 'text-green-700' : 'text-red-700'}`}>
                      {formData.mainCategory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">
                      {formData.subCategory || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium text-gray-900">
                      {formData.company || 'Not specified'}
                    </span>
                  </div>
                  <div className={`flex justify-between border-t pt-2 mt-2 ${
                    isInflow ? 'border-green-200' : 'border-red-200'
                  }`}>
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-bold text-lg ${
                      isInflow ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isInflow ? '+' : '-'}{formatCurrency(formData.amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {submitButtonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
