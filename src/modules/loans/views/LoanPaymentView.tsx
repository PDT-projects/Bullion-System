/**
 * Loan Payment View
 * 
 * Presentational component for processing loan payments.
 */

import React from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Wallet,
  Landmark,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import type { 
  PaymentFormState, 
  Bank, 
  Loan
} from '../models/types';
import { formatCurrency, formatDate, calculateProgress } from '../models/loanService';

interface LoanPaymentViewProps {
  // State
  loan: Loan | null;
  formData: PaymentFormState;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Derived state
  canPay: boolean;
  maxPaymentAmount: number;
  remainingAfterPayment: number;
  newStatus: 'Full' | 'Partial';
  progressBefore: number;
  progressAfter: number;
  
  // Bank options
  availableBanks: Bank[];
  selectedBank?: Bank;
  isBankMode: boolean;
  
  // Field setters
  setAmount: (value: string) => void;
  setPaymentMode: (mode: 'Cash' | 'Bank') => void;
  setBank: (bankId: string) => void;
  
  // Actions
  onSubmit: () => void;
  onCancel: () => void;
}

export const LoanPaymentView: React.FC<LoanPaymentViewProps> = ({
  loan,
  formData,
  isLoading,
  isSubmitting,
  error,
  canPay,
  maxPaymentAmount,
  remainingAfterPayment,
  newStatus,
  progressBefore,
  progressAfter,
  availableBanks,
  selectedBank,
  isBankMode,
  setAmount,
  setPaymentMode,
  setBank,
  onSubmit,
  onCancel
}) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]"></div>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error || 'Loan not found'}</p>
          </div>
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Back to Loans
          </button>
        </div>
      </div>
    );
  }

  if (!canPay) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Loan Fully Paid</h2>
          <p className="text-green-700 mb-6">
            This loan has been fully paid. No further payments are required.
          </p>
          <div className="bg-white rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Entity</p>
                <p className="font-medium text-gray-900">{loan.entityName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(loan.loanAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="font-medium text-green-600">{formatCurrency(loan.paid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-green-600">{loan.status}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            Back to Loans
          </button>
        </div>
      </div>
    );
  }

  const paymentAmount = parseFloat(formData.amount) || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
          <p className="text-gray-500">Record a payment for this loan</p>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Entity</p>
              <p className="font-medium text-gray-900">{loan.entityName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Receiver</p>
              <p className="font-medium text-gray-900">{loan.receiverName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(loan.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(loan.loanAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progressBefore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{progressBefore}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Remaining Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.remaining)}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
        {/* Payment Amount */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Maximum allowed: {formatCurrency(maxPaymentAmount)}
            </p>
          </div>

          {/* Payment Preview */}
          {paymentAmount > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Remaining:</span>
                <span className="font-medium">{formatCurrency(loan.remaining)}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <span>Payment Amount:</span>
                <span className="font-medium">-{formatCurrency(paymentAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">New Remaining:</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(remainingAfterPayment)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Status:</span>
                <span className={`font-medium ${newStatus === 'Full' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {newStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Progress:</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${newStatus === 'Full' ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${progressAfter}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{progressAfter}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Mode */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all flex-1 ${formData.mode === 'Cash' ? 'border-[#4f46e5] bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  value="Cash"
                  checked={formData.mode === 'Cash'}
                  onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank')}
                  className="sr-only"
                />
                <Wallet className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="font-medium">Cash Payment</div>
                  <div className="text-sm text-gray-500">Pay with physical cash</div>
                </div>
              </label>
              <label className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all flex-1 ${formData.mode === 'Bank' ? 'border-[#4f46e5] bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  value="Bank"
                  checked={formData.mode === 'Bank'}
                  onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank')}
                  className="sr-only"
                />
                <Landmark className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-sm text-gray-500">Pay from bank account</div>
                </div>
              </label>
            </div>

            {isBankMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Bank Account *
                </label>
                <select
                  value={formData.bankId}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                >
                  <option value="">Select a bank</option>
                  {availableBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} (Balance: {formatCurrency(bank.balance)})
                    </option>
                  ))}
                </select>
                {selectedBank && loan.type === 'Payable' && selectedBank.balance < paymentAmount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Insufficient balance. Available: {formatCurrency(selectedBank.balance)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !paymentAmount || paymentAmount > maxPaymentAmount || (isBankMode && !formData.bankId)}
            className="flex items-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Record Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
