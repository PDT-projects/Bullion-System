// Salary Module - View Layer
// SalaryFormView - Form for create/edit salary

import {
  User,
  Calculator,
  Wallet,
  Building2
} from 'lucide-react';
import { SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { Button } from '../../../components/ui/button';

interface SalaryFormViewProps {
  formData: {
    employeeId: string;
    subCategory: 'Employee salary' | 'Advance salary';
    date: string;
    note: string;
    baseSalary: number;
    commission: number;
    deductions: number;
  };
  transactions: SalaryTransaction[];
  isValid: boolean;
  errorMessage: string | null;
  fieldErrors: { [key: string]: string };
  isLoading: boolean;
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  employees: any[];
  banks: any[];
  selectedEmployee: any | null;
  calculatedNetAmount: number;
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function SalaryFormView({
  formData,
  transactions,
  isValid,
  errorMessage,
  fieldErrors,
  isLoading,
  isEditMode,
  pageTitle,
  submitButtonText,
  employees,
  banks,
  selectedEmployee,
  calculatedNetAmount,
  onFieldChange,
  onTransactionChange,
  onSubmit,
  onCancel
}: SalaryFormViewProps) {
  const formatCurrency = SalaryService.formatCurrency;
  const transaction = transactions[0] || SalaryService.getDefaultTransaction();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update salary payment details' : 'Record a new salary payment'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Employee Selection */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Employee Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.employeeId}
                    onChange={(e) => onFieldChange('employeeId', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${
                      fieldErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position} (PKR {emp.salary?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.employeeId}</p>
                )}
              </div>

              {selectedEmployee && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedEmployee.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Position:</span>
                      <span className="ml-2 font-medium">{selectedEmployee.position}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Salary:</span>
                      <span className="ml-2 font-medium text-[#4f46e5]">
                        {formatCurrency(selectedEmployee.salary || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 font-medium ${
                        selectedEmployee.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salary Calculation */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-600" />
              Salary Calculation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Salary <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => onFieldChange('baseSalary', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${
                      fieldErrors.baseSalary ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                </div>
                {fieldErrors.baseSalary && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.baseSalary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                  <input
                    type="number"
                    value={formData.commission}
                    onChange={(e) => onFieldChange('commission', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => onFieldChange('deductions', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={transaction.salaryMonth}
                  onChange={(e) => onTransactionChange(0, 'salaryMonth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-600" />
              Payment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transaction.paidBy}
                  onChange={(e) => onTransactionChange(0, 'paidBy', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${
                    fieldErrors['transaction_0_paidBy'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter name"
                />
                {fieldErrors['transaction_0_paidBy'] && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors['transaction_0_paidBy']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction By</label>
                <input
                  type="text"
                  value={transaction.transactionBy}
                  onChange={(e) => onTransactionChange(0, 'transactionBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={transaction.mode}
                  onChange={(e) => onTransactionChange(0, 'mode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {(transaction.mode === 'Bank' || transaction.mode === 'Cheque') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      value={transaction.bankName}
                      onChange={(e) => onTransactionChange(0, 'bankName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${
                        fieldErrors['transaction_0_bankName'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select bank...</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.name}>
                          {bank.name} (Balance: {formatCurrency(bank.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors['transaction_0_bankName'] && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors['transaction_0_bankName']}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={transaction.paymentStatus}
                  onChange={(e) => onTransactionChange(0, 'paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="Full">Full Payment</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>

              {transaction.paymentStatus === 'Partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                    <input
                      type="number"
                      value={transaction.remainingAmount}
                      onChange={(e) =>
                        onTransactionChange(0, 'remainingAmount', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFieldChange('date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${
                    fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.date && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => onFieldChange('note', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </div>
          </div>

          {/* Net Amount Display */}
          <div className="bg-[#4f46e5]/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Net Amount to Pay:</span>
              <span className="text-2xl font-bold text-[#4f46e5]">
                {formatCurrency(calculatedNetAmount)}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {formData.baseSalary > 0 && (
                <span>Base: {formatCurrency(formData.baseSalary)}</span>
              )}
              {formData.commission > 0 && (
                <span className="ml-3">+ Commission: {formatCurrency(formData.commission)}</span>
              )}
              {formData.deductions > 0 && (
                <span className="ml-3">- Deductions: {formatCurrency(formData.deductions)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading || !isValid}
              className="bg-[#4f46e5] hover:bg-[#4338ca]"
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}