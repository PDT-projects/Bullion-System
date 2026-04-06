// Salary Module - View Layer
// SalaryFormView - Form for create/edit salary
// Fixes:
// 1. Employee info panel: no more text overlap — uses clean grid layout
// 2. Shows clear "Remaining to pay" amount when advance already given this month
// 3. Base salary auto-filled with remaining amount (full - advance paid)

import { User, Calculator, Wallet, Building2, CreditCard, AlertCircle, CheckCircle, Info, ArrowLeft, Lock } from 'lucide-react';
import { SalaryService } from '../models/salaryService';

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
  remainingSalaryToPay: number;
  isEffectivelyAdvance: boolean;
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const inp    = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]';
const inpErr = 'border-red-500';

// Format date for locked display
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

export function SalaryFormView({
  formData, transactions, isValid, errorMessage, fieldErrors,
  isLoading, isEditMode, pageTitle, submitButtonText,
  employees, banks, selectedEmployee, calculatedNetAmount,
  advancePaidThisMonth, regularAlreadyPaid, regularAlreadyPaidAmount,
  remainingSalaryToPay, isEffectivelyAdvance,
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
          <button onClick={onCancel} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update salary payment details' : 'Record a new salary payment'}
            </p>
          </div>
        </div>

        {/* ── Banner: Regular salary already fully paid ── */}
        {regularAlreadyPaid && !isEditMode && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
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

        {/* ── Banner: Future month → auto-advance ── */}
        {isEffectivelyAdvance && !isEditMode && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-semibold">This will be recorded as an Advance Salary</p>
              <p className="text-yellow-700 text-sm mt-0.5">
                <strong>{transaction.salaryMonth}</strong> is a future month — paying ahead counts as advance.
                This will be saved as <strong>Advance salary</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Banner: Advance already paid — show remaining ── */}
        {isRegular && advancePaidThisMonth > 0 && !regularAlreadyPaid && !isEffectivelyAdvance && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-800 font-semibold">Advance salary already given this month</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded-lg p-2.5 border border-blue-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Full Salary</p>
                  <p className="font-bold text-gray-900">{fmt(selectedEmployee?.salary || 0)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-blue-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Advance Paid</p>
                  <p className="font-bold text-orange-600">− {fmt(advancePaidThisMonth)}</p>
                </div>
                <div className="bg-[#4f46e5]/10 rounded-lg p-2.5 border border-[#4f46e5]/20 text-center">
                  <p className="text-xs text-[#4f46e5] mb-0.5">Remaining to Pay</p>
                  <p className="font-bold text-[#4f46e5] text-base">{fmt(remainingSalaryToPay)}</p>
                </div>
              </div>
              <p className="text-blue-600 text-xs mt-2">
                Base salary has been pre-filled with the remaining amount. Adjust if needed.
              </p>
            </div>
          </div>
        )}

        {/* ── Banner: Advance salary context ── */}
        {!isRegular && selectedEmployee && transaction.salaryMonth && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 font-semibold">Advance salary — {transaction.salaryMonth}</p>
              <p className="text-orange-700 text-sm mt-0.5">
                Monthly salary: <strong>{fmt(selectedEmployee.salary || 0)}</strong>
                {advancePaidThisMonth > 0 && (
                  <> · Advance already given this month: <strong>{fmt(advancePaidThisMonth)}</strong></>
                )}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

          {/* ── Employee + Month ─────────────────────────────────────── */}
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

              {/* ── FIX: Employee info card — proper grid, no text overlap ── */}
              {selectedEmployee && (
                <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Employee Info</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Name</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedEmployee.name}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Position</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedEmployee.position}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Monthly Salary</p>
                      <p className="text-sm font-semibold text-[#4f46e5]">{fmt(selectedEmployee.salary || 0)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedEmployee.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>

                  {/* Salary status for the selected month */}
                  {isRegular && transaction.salaryMonth && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {isEffectivelyAdvance ? (
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
                          <AlertCircle size={15} />
                          <span>Future month selected — will save as <strong>Advance salary</strong></span>
                        </div>
                      ) : regularAlreadyPaid ? (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                          <CheckCircle size={15} />
                          <span>Regular salary fully paid for <strong>{transaction.salaryMonth}</strong></span>
                        </div>
                      ) : advancePaidThisMonth > 0 ? (
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                          <Info size={15} />
                          <span>
                            Advance paid: <strong>{fmt(advancePaidThisMonth)}</strong> ·
                            Remaining: <strong>{fmt(remainingSalaryToPay)}</strong> for <strong>{transaction.salaryMonth}</strong>
                          </span>
                        </div>
                      ) : regularAlreadyPaidAmount > 0 ? (
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
                          <AlertCircle size={15} />
                          <span>
                            Partially paid: <strong>{fmt(regularAlreadyPaidAmount)}</strong> of{' '}
                            <strong>{fmt(selectedEmployee.salary || 0)}</strong> for <strong>{transaction.salaryMonth}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          <Info size={15} />
                          <span>No regular salary paid yet for <strong>{transaction.salaryMonth}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Salary Calculation ──────────────────────────────────── */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-600" /> Salary Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRegular ? 'Base Salary' : 'Advance Amount'} <span className="text-red-500">*</span>
                  {isRegular && advancePaidThisMonth > 0 && !regularAlreadyPaid && (
                    <span className="ml-1 text-xs font-normal text-[#4f46e5]">(remaining after advance)</span>
                  )}
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
                    <span className="ml-1 text-xs text-orange-600 font-normal">(advance: {fmt(advancePaidThisMonth)})</span>
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
              </div>

              {/* Date — locked to today, same pattern as Bills/Transactions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-xs font-normal text-gray-400 ml-1">(auto)</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Lock size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">{formatDateDisplay(formData.date)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Date is set automatically</p>
              </div>
            </div>
          </div>

          {/* ── Payment Details ──────────────────────────────────────── */}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Bank', 'Cheque'] as const).map(m => (
                    <button
                      key={m} type="button"
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

              {transaction.mode === 'Cheque' && (
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Cheque Details</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cheque Number *</label>
                      <input type="text" value={transaction.chequeNumber}
                        onChange={(e) => onTransactionChange(0, 'chequeNumber', e.target.value)}
                        className={inp} placeholder="e.g. 001234" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cheque Date</label>
                      <input type="date" value={transaction.chequeDate}
                        onChange={(e) => onTransactionChange(0, 'chequeDate', e.target.value)}
                        className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bank on Cheque</label>
                      <input type="text" value={transaction.chequeBank}
                        onChange={(e) => onTransactionChange(0, 'chequeBank', e.target.value)}
                        className={inp} placeholder="e.g. HBL, MCB" />
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

          {/* ── Net Amount Summary ───────────────────────────────────── */}
          <div className="bg-[#4f46e5]/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900">Net Amount to Pay:</span>
              <span className="text-2xl font-bold text-[#4f46e5]">{fmt(calculatedNetAmount)}</span>
            </div>
            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
              {formData.baseSalary > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">Base:</span> {fmt(formData.baseSalary)}
                </span>
              )}
              {formData.commission > 0 && (
                <span className="flex items-center gap-1 text-green-700">
                  <span>+</span> Commission: {fmt(formData.commission)}
                </span>
              )}
              {formData.deductions > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <span>−</span> Deductions: {fmt(formData.deductions)}
                </span>
              )}
            </div>
            {/* Show advance context at bottom of summary */}
            {isRegular && advancePaidThisMonth > 0 && !regularAlreadyPaid && (
              <div className="mt-3 pt-3 border-t border-[#4f46e5]/20 text-xs text-[#4f46e5]">
                ℹ️ Advance already paid this month: {fmt(advancePaidThisMonth)} · 
                Paying remaining: {fmt(remainingSalaryToPay)}
              </div>
            )}
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button" onClick={onCancel} disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button" onClick={onSubmit}
              disabled={isLoading || (regularAlreadyPaid && !isEditMode)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#4f46e5] border border-[#4f46e5] rounded-lg hover:bg-[#4338ca] disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}