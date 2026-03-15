// Banking Module - Bank Delete View
// UI component for delete bank confirmation

import React from 'react';
import { 
  AlertTriangle, 
  X, 
  Trash2,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { Bank } from '../models/types';

interface BankDeleteViewProps {
  // Data
  bank: Bank | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  handleDelete: () => void;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export const BankDeleteView: React.FC<BankDeleteViewProps> = ({
  bank,
  isLoading,
  error,
  handleDelete,
  handleCancel,
  formatCurrency
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f46e5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 text-red-600" size={48} />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-600 mb-4">{error || 'Bank account not found'}</p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasBalance = bank.balance > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Delete Bank Account</h2>
            <p className="text-gray-600">Confirm deletion of bank account</p>
          </div>
        </div>

        {/* Delete Confirmation Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Warning Header */}
          <div className="bg-red-50 p-6 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Warning</h3>
                <p className="text-sm text-red-700">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
                <Building2 size={20} className="text-[#4f46e5]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{bank.name}</h4>
                <p className="text-sm text-gray-500">{bank.accountNumber}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Balance:</span>
                <span className={`text-xl font-bold ${hasBalance ? 'text-[#4f46e5]' : 'text-gray-500'}`}>
                  {formatCurrency(bank.balance)}
                </span>
              </div>
            </div>

            {hasBalance && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> This bank account has a balance of {formatCurrency(bank.balance)}. 
                  Deleting it will remove this balance from the system. Consider transferring the balance 
                  to another account first.
                </p>
              </div>
            )}

            <div className="text-sm text-gray-600 mb-6">
              <p>Are you sure you want to delete this bank account?</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                <li>All associated transactions will remain in the system</li>
                <li>Transfer history will be preserved</li>
                <li>This action is permanent and cannot be reversed</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};