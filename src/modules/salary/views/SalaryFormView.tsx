// Salary Module - View Layer
// SalaryFormView - Form for create/edit salary

import { User, Calculator, Wallet, Building2, CreditCard, AlertCircle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { SalaryService } from '../models/salaryService';

// Inline so this file compiles even if types.ts hasn't been updated yet
interface SalaryTransaction {
  id: string;
  amount: number;
  paidBy: string;
  transactionBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankId: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: string;
  chequeBank: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
  salaryMonth: string;
}

interface BankInfo { id: string; name: string; balance: number; }

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
  banks: BankInfo[];
  selectedEmployee: any | null;
  calculatedNetAmount: number;
  advancePaidThisMonth: number;
  regularAlreadyPaid: boolean;
  regularAlreadyPaidAmount: number;
  isEffectivelyAdvance: boolean;
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const inp    = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]';
const inpErr = 'border-red-500';

export function SalaryFormView({
  formData, transactions, isValid, errorMessage, fieldErrors,
  isLoading, isEditMode, pageTitle, submitButtonText,
  employees, banks, selectedEmployee, calculatedNetAmount,
  advancePaidThisMonth, regularAlreadyPaid, regularAlreadyPaidAmount,
  isEffectivelyAdvance,
  onFieldChange, onTransactionChange, onSubmit, onCancel,
}: SalaryFormViewProps) {
  const fmt         = SalaryService.formatCurrency;
  const transaction = transactions[0] || {
    id: '', amount: 0, paidBy: '', transactionBy: '',
    mode: 'Cash' as const, bankId: '', bankName: '',
    chequeNumber: '', chequeDate: '', chequeBank: '',
    imageUrl: '', paymentStatus: 'Full' as const,
    remainingAmount: 0, salaryMonth: new Date().toISOString().slice(0, 7),
  };
  const isRegular    = formData.subCategory === 'Employee salary';
  const selectedBank = banks.find(b => b.id === transaction.bankId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update salary payment details' : 'Record a new salary payment'}
            </p>
          </div>
        </div>

        {/* Regular salary already paid — red block */}
        {regularAlreadyPaid && !isEditMode && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Regular salary already fully paid for this month</p>
              <p className="text-red-700 text-sm mt-0.5">
                {selectedEmployee?.name} already received {fmt(regularAlreadyPaidAmount)} as regular salary
                for <strong>{transaction.salaryMonth}</strong>.
                Use <em>Advance Salary</em> if you need to pay more.
              </p>
            </div>
          </div>
        )}

        {/* Future month selected on regular form — auto-treated as advance */}
        {isEffectivelyAdvance && !isEditMode && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-semibold">
                This will be recorded as an Advance Salary
              </p>
              <p className="text-yellow-700 text-sm mt-0.5">
                You selected <strong>{transaction.salaryMonth}</strong> which is a future month —
                paying salary before the month is due counts as an advance.
                This record will be saved as <strong>Advance salary</strong> and will appear
                in the Advance Salaries list.
              </p>
            </div>
          </div>
        )}

        {/* Advance paid info on regular form */}
        {isRegular && advancePaidThisMonth > 0 && !regularAlreadyPaid && !isEffectivelyAdvance && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-semibold">Advance salary already given this month</p>
              <p className="text-blue-700 text-sm mt-0.5">
                {selectedEmployee?.name} received <strong>{fmt(advancePaidThisMonth)}</strong> as advance
                for <strong>{transaction.salaryMonth}</strong>. Add it to Deductions below to recover.
              </p>
            </div>
          </div>
        )}

        {/* Advance salary context panel */}
        {!isRegular && selectedEmployee && transaction.salaryMonth && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 font-semibold">Advance salary — {transaction.salaryMonth}</p>
              <p className="text-orange-700 text-sm mt-0.5">
                Monthly salary: <strong>{fmt(selectedEmployee.salary || 0)}</strong>
                {advancePaidThisMonth > 0 && (
                  <> · Advance already given: <strong>{fmt(advancePaidThisMonth)}</strong></>
                )}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

          {/* ── Employee + Month ─────────────────────────────────────────── */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" /> Employee Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.employeeId}
                    onChange={(e) => onFieldChange('employeeId', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${fieldErrors.employeeId ? inpErr : 'border-gray-300'}`}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.position} ({fmt(emp.salary || 0)}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.employeeId && <p className="mt-1 text-sm text-red-600">{fieldErrors.employeeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={transaction.salaryMonth}
                  onChange={(e) => onTransactionChange(0, 'salaryMonth', e.target.value)}
                  className={inp}
                />
              </div>

              {selectedEmployee && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-gray-500">Name:</span><span className="ml-1 font-medium">{selectedEmployee.name}</span></div>
                  <div><span className="text-gray-500">Position:</span><span className="ml-1 font-medium">{selectedEmployee.position}</span></div>
                  <div><span className="text-gray-500">Monthly:</span><span className="ml-1 font-medium text-[#4f46e5]">{fmt(selectedEmployee.salary || 0)}</span></div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-1 font-medium ${selectedEmployee.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  {isRegular && transaction.salaryMonth && (
                    <div className="md:col-span-4 pt-2 border-t">
                      {isEffectivelyAdvance ? (
                        <span className="flex items-center gap-1.5 text-sm text-yellow-700">
                          <AlertCircle size={14} />
                          Future month — will be saved as <strong>Advance salary</strong>
                        </span>
                      ) : regularAlreadyPaid ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-700">
                          <CheckCircle size={14} /> Regular salary fully paid for {transaction.salaryMonth}
                        </span>
                      ) : regularAlreadyPaidAmount > 0 ? (
                        <span className="flex items-center gap-1.5 text-sm text-yellow-700">
                          <AlertCircle size={14} />
                          Partial paid: {fmt(regularAlreadyPaidAmount)} / {fmt(selectedEmployee.salary || 0)} for {transaction.salaryMonth}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Info size={14} /> No regular salary paid yet for {transaction.salaryMonth}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Salary Calculation ──────────────────────────────────────── */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-600" /> Salary Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRegular ? 'Base Salary' : 'Advance Amount'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PKR</span>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => onFieldChange('baseSalary', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${fieldErrors.baseSalary ? inpErr : 'border-gray-300'}`}
                    placeholder="0"
                  />
                </div>
                {fieldErrors.baseSalary && <p className="mt-1 text-sm text-red-600">{fieldErrors.baseSalary}</p>}
              </div>

              {isRegular && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PKR</span>
                    <input
                      type="number"
                      value={formData.commission}
                      onChange={(e) => onFieldChange('commission', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deductions
                  {isRegular && advancePaidThisMonth > 0 && (
                    <span className="ml-1 text-xs text-orange-600">(advance: {fmt(advancePaidThisMonth)})</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PKR</span>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => onFieldChange('deductions', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                  />
                </div>
                {isRegular && advancePaidThisMonth > 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    Tip: enter {fmt(advancePaidThisMonth)} to recover advance paid this month
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFieldChange('date', e.target.value)}
                  className={`${inp} ${fieldErrors.date ? inpErr : ''}`}
                />
                {fieldErrors.date && <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>}
              </div>
            </div>
          </div>

          {/* ── Payment Details ──────────────────────────────────────────── */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-600" /> Payment Details
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
                  className={`${inp} ${fieldErrors['transaction_0_paidBy'] ? inpErr : ''}`}
                  placeholder="e.g. PDT Islamabad"
                />
                {fieldErrors['transaction_0_paidBy'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['transaction_0_paidBy']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction By</label>
                <input
                  type="text"
                  value={transaction.transactionBy}
                  onChange={(e) => onTransactionChange(0, 'transactionBy', e.target.value)}
                  className={inp}
                  placeholder="e.g. Manager Ahmed"
                />
              </div>

              {/* Payment method toggle buttons */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Bank', 'Cheque'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onTransactionChange(0, 'mode', m)}
                      className={`py-2.5 text-sm rounded-lg border font-medium transition-colors ${
                        transaction.mode === m
                          ? 'border-[#4f46e5] bg-[#4f46e5]/5 text-[#4f46e5]'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {/* Bank account selector */}
              {transaction.mode === 'Bank' && (
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Bank Account <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      {banks.length > 0 ? (
                        <select
                          value={transaction.bankId}
                          onChange={(e) => onTransactionChange(0, 'bankId', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] ${fieldErrors['transaction_0_bankName'] ? inpErr : 'border-gray-300'}`}
                        >
                          <option value="">Select bank...</option>
                          {banks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name} — Balance: {fmt(bank.balance)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={transaction.bankName}
                          onChange={(e) => onTransactionChange(0, 'bankName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Bank name"
                        />
                      )}
                    </div>
                    {fieldErrors['transaction_0_bankName'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['transaction_0_bankName']}</p>}
                  </div>
                  {selectedBank && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current balance:</span>
                        <span className="font-medium text-blue-700">{fmt(selectedBank.balance)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">After payment:</span>
                        <span className={`font-semibold ${selectedBank.balance - calculatedNetAmount < 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                          {fmt(selectedBank.balance - calculatedNetAmount)}
                        </span>
                      </div>
                      {selectedBank.balance - calculatedNetAmount < 0 && (
                        <p className="text-xs text-red-600 mt-1">⚠️ Insufficient balance in this account</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cheque credentials */}
              {transaction.mode === 'Cheque' && (
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Cheque Details</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cheque Number *</label>
                      <input
                        type="text"
                        value={transaction.chequeNumber}
                        onChange={(e) => onTransactionChange(0, 'chequeNumber', e.target.value)}
                        className={inp}
                        placeholder="e.g. 001234"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cheque Date</label>
                      <input
                        type="date"
                        value={transaction.chequeDate}
                        onChange={(e) => onTransactionChange(0, 'chequeDate', e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bank on Cheque</label>
                      <input
                        type="text"
                        value={transaction.chequeBank}
                        onChange={(e) => onTransactionChange(0, 'chequeBank', e.target.value)}
                        className={inp}
                        placeholder="e.g. HBL, MCB"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded p-2">
                    Cheque will appear as Uncleared in Pending Payments until manually cleared
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={transaction.paymentStatus}
                  onChange={(e) => onTransactionChange(0, 'paymentStatus', e.target.value)}
                  className={inp}
                >
                  <option value="Full">Full Payment</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>

              {transaction.paymentStatus === 'Partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PKR</span>
                    <input
                      type="number"
                      value={transaction.remainingAmount}
                      onChange={(e) => onTransactionChange(0, 'remainingAmount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => onFieldChange('note', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Net Amount Summary */}
          <div className="bg-[#4f46e5]/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Net Amount to Pay:</span>
              <span className="text-2xl font-bold text-[#4f46e5]">{fmt(calculatedNetAmount)}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-3">
              {formData.baseSalary > 0 && <span>Base: {fmt(formData.baseSalary)}</span>}
              {formData.commission > 0 && <span className="text-green-700">+ Commission: {fmt(formData.commission)}</span>}
              {formData.deductions > 0 && <span className="text-red-600">− Deductions: {fmt(formData.deductions)}</span>}
            </div>
            {isRegular && advancePaidThisMonth > 0 && (
              <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded p-2">
                ℹ️ Advance paid this month: {fmt(advancePaidThisMonth)} — add to Deductions above if recovering
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || (regularAlreadyPaid && !isEditMode)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#4f46e5] border border-[#4f46e5] rounded-lg hover:bg-[#4338ca] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}