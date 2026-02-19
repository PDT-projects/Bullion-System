// Salary Module - View Layer
// SalaryDeleteView - Delete confirmation page

import { 
  ArrowLeft, 
  Trash2, 
  X, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Salary } from '../models/types';
import { SalaryService } from '../models/salaryService';

interface SalaryDeleteViewProps {
  // Data
  salary: Salary | null;
  isLoading: boolean;
  
  // Actions
  onDelete: () => void;
  onCancel: () => void;
}

export function SalaryDeleteView({
  salary,
  isLoading,
  onDelete,
  onCancel
}: SalaryDeleteViewProps) {
  const formatCurrency = SalaryService.formatCurrency;
  const formatDate = SalaryService.formatDate;

  if (!salary) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
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
            onClick={onCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Delete Salary Record</h2>
            <p className="text-gray-600 mt-1">Confirm deletion of salary payment</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Warning: This action cannot be undone</h3>
              <p className="text-red-700">
                You are about to delete a salary payment record. This will permanently remove the record from the system 
                and reverse any associated bank transactions. Please review the details below before confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Salary Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Record Details</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-medium text-gray-900">{salary.employeeName || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Salary Month</p>
                <p className="font-medium text-gray-900">{salary.salaryMonth || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p className="font-medium text-lg text-blue-600">{formatCurrency(salary.netAmount || salary.amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {salary.mode}{salary.bankName ? ` (${salary.bankName})` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Base Salary</p>
                <p className="font-medium">{formatCurrency(salary.baseSalary || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="font-medium text-green-600">+{formatCurrency(salary.commission || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deductions</p>
                <p className="font-medium text-red-600">-{formatCurrency(salary.deductions || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-medium font-mono text-sm">{salary.transactionId || salary.id}</p>
              </div>
            </div>

            {salary.note && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Note</p>
                <p className="font-medium text-gray-900">{salary.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex gap-4">
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  Confirm Delete
                </>
              )}
            </button>
            
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
