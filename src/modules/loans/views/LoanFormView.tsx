/**
 * Loan Form View
 * Presentational component for creating and editing loans.
 */

import React from 'react';
import { ArrowLeft, Save, X, AlertCircle, Building2, User, Phone, Calendar, DollarSign, Wallet, Landmark } from 'lucide-react';
import type { LoanFormState, LoanValidationErrors, Bank, Employee, LoanType, LoanCategory, PaymentMode, ReceiverType } from '../models/types';
import { formatCurrency } from '../models/loanService';

interface LoanFormViewProps {
  formData: LoanFormState;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: LoanValidationErrors;
  isEditing: boolean;
  remaining: number;
  status: 'Full' | 'Partial';
  availableBanks: Bank[];
  availableEmployees: Employee[];
  setEntityName: (v: string) => void;
  setLoanAmount: (v: string) => void;
  setPaidAmount: (v: string) => void;
  setDate: (v: string) => void;
  setType: (v: LoanType) => void;
  setLoanCategory: (v: LoanCategory) => void;
  setPaymentMode: (v: PaymentMode) => void;
  setBank: (bankId: string) => void;
  setReceiverType: (v: ReceiverType) => void;
  setReceiverName: (v: string) => void;
  setReceiverPhone: (v: string) => void;
  setEmployee: (employeeId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isBankMode: boolean;
  isEmployeeReceiver: boolean;
  selectedBank?: Bank;
}

export const LoanFormView: React.FC<LoanFormViewProps> = ({
  formData, isLoading, isSubmitting, errors, isEditing, remaining, status,
  availableBanks, availableEmployees,
  setEntityName, setLoanAmount, setPaidAmount, setDate, setType, setLoanCategory,
  setPaymentMode, setBank, setReceiverType, setReceiverName, setReceiverPhone, setEmployee,
  onSubmit, onCancel, isBankMode, isEmployeeReceiver, selectedBank,
}) => {
  if (isLoading) {
    return <div className="p-6 flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]" /></div>;
  }

  const fieldError = (msg?: string) => msg ? (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{msg}</p>
  ) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Loan' : 'Create New Loan'}</h1>
          <p className="text-gray-500">{isEditing ? 'Update loan details' : 'Record a new payable or receivable loan'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Loan Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['Payable', 'Receivable'] as LoanType[]).map(t => (
              <label key={t} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === t ? (t === 'Payable' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50') : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="loanType" value={t} checked={formData.type === t} onChange={() => setType(t)} className="sr-only" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{t} Loan</div>
                  <div className="text-sm text-gray-500">{t === 'Payable' ? 'Money we need to pay to others' : 'Money others owe to us'}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.type === t ? (t === 'Payable' ? 'border-red-500' : 'border-green-500') : 'border-gray-300'}`}>
                  {formData.type === t && <div className={`w-3 h-3 rounded-full ${t === 'Payable' ? 'bg-red-500' : 'bg-green-500'}`} />}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={formData.entityName} onChange={e => setEntityName(e.target.value)} placeholder="Enter entity name"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.entityName ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {fieldError(errors.entityName)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Category *</label>
              <select value={formData.loanType} onChange={e => setLoanCategory(e.target.value as LoanCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
                <option value="Official">Official</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={formData.date} onChange={e => setDate(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.date ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {fieldError(errors.date)}
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Amount Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={formData.loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="0.00"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.loanAmount ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {fieldError(errors.loanAmount)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Already Paid</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={formData.paid} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.paid ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {fieldError(errors.paid)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900">{formatCurrency(remaining)}</div>
              <p className="mt-1 text-sm text-gray-500">Status: <span className={`font-medium ${status === 'Full' ? 'text-green-600' : 'text-yellow-600'}`}>{status}</span></p>
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Receiver Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Type *</label>
              <div className="flex gap-4">
                {(['Person', 'Employee'] as ReceiverType[]).map(rt => (
                  <label key={rt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={rt} checked={formData.receiverType === rt} onChange={() => setReceiverType(rt)} className="text-[#4f46e5] focus:ring-[#4f46e5]" />
                    <span>{rt === 'Person' ? 'External Person' : 'Employee'}</span>
                  </label>
                ))}
              </div>
            </div>

            {isEmployeeReceiver ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                <select value={formData.employeeId} onChange={e => setEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
                  <option value="">Select an employee</option>
                  {availableEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={formData.receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Enter receiver name"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.receiverName ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                  {fieldError(errors.receiverName)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="tel" value={formData.receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="Enter phone number"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Mode */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Mode</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              {(['Cash', 'Bank'] as PaymentMode[]).map(m => (
                <label key={m} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${formData.mode === m ? 'border-[#4f46e5] bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={m} checked={formData.mode === m} onChange={() => setPaymentMode(m)} className="sr-only" />
                  {m === 'Cash' ? <Wallet className="h-5 w-5 text-gray-600" /> : <Landmark className="h-5 w-5 text-gray-600" />}
                  <span className="font-medium">{m === 'Cash' ? 'Cash' : 'Bank Transfer'}</span>
                </label>
              ))}
            </div>
            {isBankMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                <select value={formData.bankId} onChange={e => setBank(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${errors.bankId ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select a bank</option>
                  {availableBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name} (Balance: {formatCurrency(bank.balance)})</option>
                  ))}
                </select>
                {fieldError(errors.bankId)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> {isEditing ? 'Update Loan' : 'Create Loan'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};