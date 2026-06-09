// Salary Module - View Layer
// SalaryFormView - Form for create/edit salary
// UPDATED: Shows commission auto-fill badge when a Confirmed commission record
//          is found for the selected employee + salary month.
// UPDATED: Shows employee's active Receivable loan (if any) and allows entering
//          a deduction amount that reduces both the salary net amount and the
//          loan's remaining balance on save.

import { useState } from 'react';
import { User, Calculator, Wallet, Building2, CreditCard, AlertCircle, CheckCircle, Info, ArrowLeft, Lock, TrendingUp, Sparkles, Landmark, ChevronRight } from 'lucide-react';
import { SalaryService } from '../models/salaryService';
import type { Loan } from '../../loans/models/types';

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
  advanceAvailableThisMonth: number;
  regularAlreadyPaid: boolean;
  regularAlreadyPaidAmount: number;
  remainingSalaryToPay: number;
  isEffectivelyAdvance: boolean;
  // Commission auto-fill props
  confirmedCommissionAmount?: number;
  isCommissionAutoFilled?: boolean;
  commissionSource?: string;
  // Loan deduction props
  employeeLoan?: Loan | null;
  loanDeduction?: number;
  isLoanLoading?: boolean;
  setLoanDeduction?: (amount: number) => void;
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const inp    = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300';
const inpErr = 'border-red-500';

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
  advancePaidThisMonth, advanceAvailableThisMonth, regularAlreadyPaid, regularAlreadyPaidAmount,
  remainingSalaryToPay, isEffectivelyAdvance,
  confirmedCommissionAmount = 0,
  isCommissionAutoFilled = false,
  commissionSource = '',
  employeeLoan = null,
  loanDeduction = 0,
  isLoanLoading = false,
  setLoanDeduction,
  onFieldChange, onTransactionChange, onSubmit, onCancel,
}: SalaryFormViewProps) {
  const fmt = SalaryService.formatCurrency;
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmitClick = () => {
    setHasSubmitted(true);
    onSubmit();
  };

  const transaction = transactions[0] || {
    id: '', amount: 0, paidBy: '', transactionBy: '',
    mode: 'Cash' as const, bankId: '', bankName: '',
    chequeNumber: '', chequeDate: '', chequeBank: '',
    imageUrl: '', paymentStatus: 'Full' as const,
    remainingAmount: 0, salaryMonth: new Date().toISOString().slice(0, 7),
  };
  const isRegular    = formData.subCategory === 'Employee salary';
  const selectedBank = banks.find(b => b.id === transaction.bankId);

  // Derived loan display values
  const loanAfterDeduction = employeeLoan
    ? Math.max(0, employeeLoan.remaining - loanDeduction)
    : 0;
  const showLoanSection = isRegular && !isEditMode && (isLoanLoading || employeeLoan);

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
                <div className="rounded-lg p-2.5 border text-center" style={{ backgroundColor: 'rgba(30,41,59,0.08)', borderColor: 'rgba(30,41,59,0.15)' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#1e293b' }}>Remaining to Pay</p>
                  <p className="font-bold text-base" style={{ color: '#1e293b' }}>{fmt(remainingSalaryToPay)}</p>
                </div>
              </div>
              <p className="text-blue-600 text-xs mt-2">
                Base salary has been pre-filled with the remaining amount. Adjust if needed.
              </p>
            </div>
          </div>
        )}

        {/* ── Banner: Commission auto-filled ── */}
        {isRegular && isCommissionAutoFilled && confirmedCommissionAmount > 0 && !isEditMode && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-green-800 font-semibold">Commission auto-filled from Commission Module</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                  <Sparkles size={10} />
                  Auto
                </span>
              </div>
              <p className="text-green-700 text-sm mt-0.5">
                A confirmed commission of <strong>{fmt(confirmedCommissionAmount)}</strong> was found
                {commissionSource ? <> for <strong>{commissionSource}</strong></> : ''} and has been
                pre-filled below. You can edit it manually if needed.
              </p>
            </div>
          </div>
        )}

        {/* ── Banner: Advance salary context ── */}
        {!isRegular && selectedEmployee && transaction.salaryMonth && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-orange-800 font-semibold">
                Advance salary — {transaction.salaryMonth}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded-lg p-2.5 border border-orange-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Full Monthly Salary</p>
                  <p className="font-bold text-gray-900">{fmt(selectedEmployee.salary || 0)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-orange-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Advance Paid So Far</p>
                  <p className="font-bold text-orange-600">
                    {advancePaidThisMonth > 0 ? `− ${fmt(advancePaidThisMonth)}` : fmt(0)}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 border text-center ${advanceAvailableThisMonth <= 0 ? 'bg-red-50 border-red-200' : 'bg-orange-100 border-orange-200'}`}>
                  <p className={`text-xs mb-0.5 ${advanceAvailableThisMonth <= 0 ? 'text-red-600' : 'text-orange-700'}`}>
                    Available to Advance
                  </p>
                  <p className={`font-bold text-base ${advanceAvailableThisMonth <= 0 ? 'text-red-700' : 'text-orange-800'}`}>
                    {fmt(advanceAvailableThisMonth)}
                  </p>
                </div>
              </div>
              {advanceAvailableThisMonth <= 0 && (
                <p className="text-red-600 text-xs mt-2 font-medium">
                  ⚠️ Full salary has already been advanced for this month.
                </p>
              )}
              {advancePaidThisMonth > 0 && advanceAvailableThisMonth > 0 && (
                <p className="text-orange-600 text-xs mt-2">
                  Maximum advance remaining this month: {fmt(advanceAvailableThisMonth)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── LOAN DEDUCTION BANNER ─────────────────────────────────────────── */}
        {showLoanSection && (
          <div className="mb-4 rounded-lg border overflow-hidden">
            {isLoanLoading ? (
              <div className="p-4 bg-gray-50 border-gray-200 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: '#1e293b', borderTopColor: 'transparent' }} />
                <p className="text-sm text-gray-500">Checking for active loans...</p>
              </div>
            ) : employeeLoan ? (
              <div className="bg-amber-50 border-amber-200">
                {/* Header row */}
                <div className="flex items-start gap-3 p-4 border-b border-amber-200">
                  <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
                    <Landmark className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-amber-800 font-semibold">
                        Active Loan — {employeeLoan.entityName || selectedEmployee?.name}
                      </p>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-200 text-amber-800">
                        Receivable
                      </span>
                    </div>
                    <p className="text-amber-700 text-sm mt-0.5">
                      This employee has an outstanding company loan. You can deduct a repayment from this month's salary — the loan balance will be updated automatically.
                    </p>
                  </div>
                </div>

                {/* Loan stats */}
                <div className="grid grid-cols-3 gap-3 p-4 border-b border-amber-200">
                  <div className="bg-white rounded-lg p-3 border border-amber-100 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Original Loan</p>
                    <p className="text-sm font-bold text-gray-800">{fmt(employeeLoan.loanAmount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-100 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Already Repaid</p>
                    <p className="text-sm font-bold text-green-600">{fmt(employeeLoan.paid)}</p>
                  </div>
                  <div className="bg-amber-100 rounded-lg p-3 border border-amber-200 text-center">
                    <p className="text-xs text-amber-700 mb-0.5">Remaining Balance</p>
                    <p className="text-sm font-bold text-amber-800">{fmt(employeeLoan.remaining)}</p>
                  </div>
                </div>

                {/* Deduction input */}
                <div className="p-4">
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Loan Repayment Deduction this Month
                    <span className="ml-1 text-xs font-normal text-amber-600">
                      (max {fmt(employeeLoan.remaining)})
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 rounded-lg border border-amber-300 overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                      <span className="flex items-center px-3 bg-amber-50 border-r border-amber-300 text-amber-700 text-sm font-medium whitespace-nowrap select-none">
                        PKR
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={employeeLoan.remaining}
                        value={loanDeduction || ''}
                        onChange={(e) => setLoanDeduction?.(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 bg-white focus:outline-none text-sm"
                        placeholder="Enter deduction amount"
                      />
                    </div>
                    {/* Quick-fill buttons */}
                    <div className="flex gap-1.5">
                      {[25, 50, 100].map((pct) => {
                        const amt = Math.round((employeeLoan.remaining * pct) / 100);
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setLoanDeduction?.(amt)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-amber-300 text-amber-700 bg-white hover:bg-amber-100 transition-colors whitespace-nowrap"
                          >
                            {pct}%
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setLoanDeduction?.(employeeLoan.remaining)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors whitespace-nowrap"
                      >
                        Full
                      </button>
                    </div>
                  </div>

                  {/* Live preview of loan balance after deduction */}
                  {loanDeduction > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm bg-white border border-amber-200 rounded-lg px-3 py-2.5">
                      <span className="text-gray-500">Loan after deduction:</span>
                      <span className="font-bold text-amber-800">{fmt(employeeLoan.remaining)}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                      <span className={`font-bold ${loanAfterDeduction === 0 ? 'text-green-600' : 'text-amber-700'}`}>
                        {fmt(loanAfterDeduction)}
                      </span>
                      {loanAfterDeduction === 0 && (
                        <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle size={9} /> Fully cleared!
                        </span>
                      )}
                    </div>
                  )}

                  {loanDeduction === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Enter 0 or leave blank to skip loan deduction for this month.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
        {/* ──────────────────────────────────────────────────────────────────── */}

        {hasSubmitted && errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
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
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 ${fieldErrors.employeeId ? inpErr : 'border-gray-300'}`}
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

              {/* Employee info card */}
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
                      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{fmt(selectedEmployee.salary || 0)}</p>
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
                    <span className="ml-1 text-xs font-normal" style={{ color: '#1e293b' }}>(remaining after advance)</span>
                  )}
                </label>
                <div className="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-slate-400 border-gray-300">
                  <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm font-medium whitespace-nowrap select-none">
                    PKR
                  </span>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => onFieldChange('baseSalary', parseFloat(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 bg-white focus:outline-none text-sm ${fieldErrors.baseSalary ? 'border border-red-500 rounded-r-lg' : ''}`}
                    placeholder="0"
                  />
                </div>
                {fieldErrors.baseSalary && <p className="mt-1 text-sm text-red-600">{fieldErrors.baseSalary}</p>}
              </div>

              {isRegular && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    Commission
                    {isCommissionAutoFilled && confirmedCommissionAmount > 0 && !isEditMode && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                        <Sparkles size={9} />
                        Auto-filled
                      </span>
                    )}
                  </label>
                  <div className={`flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-slate-400 ${
                    isCommissionAutoFilled && confirmedCommissionAmount > 0 && !isEditMode
                      ? 'border-green-400'
                      : 'border-gray-300'
                  }`}>
                    <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm font-medium whitespace-nowrap select-none">
                      PKR
                    </span>
                    <input
                      type="number"
                      value={formData.commission}
                      onChange={(e) => onFieldChange('commission', parseFloat(e.target.value) || 0)}
                      className={`flex-1 px-3 py-2 focus:outline-none text-sm ${
                        isCommissionAutoFilled && confirmedCommissionAmount > 0 && !isEditMode
                          ? 'bg-green-50/50'
                          : 'bg-white'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {isCommissionAutoFilled && confirmedCommissionAmount > 0 && !isEditMode && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp size={10} />
                      From commission module{commissionSource ? ` · ${commissionSource}` : ''}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deductions
                  {/* Show loan deduction hint if active */}
                  {isRegular && loanDeduction > 0 && !isEditMode ? (
                    <span className="ml-1 text-xs text-amber-600 font-normal">
                      (loan: {fmt(loanDeduction)}{advancePaidThisMonth > 0 ? ` + advance: ${fmt(advancePaidThisMonth)}` : ''})
                    </span>
                  ) : isRegular && advancePaidThisMonth > 0 ? (
                    <span className="ml-1 text-xs text-orange-600 font-normal">(advance: {fmt(advancePaidThisMonth)})</span>
                  ) : null}
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-slate-400">
                  <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm font-medium whitespace-nowrap select-none">
                    PKR
                  </span>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => onFieldChange('deductions', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-white focus:outline-none text-sm"
                    placeholder="0"
                  />
                </div>
                {/* Remind user the loan deduction is already included */}
                {isRegular && loanDeduction > 0 && !isEditMode && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <Landmark size={10} />
                    Includes {fmt(loanDeduction)} loan repayment
                  </p>
                )}
              </div>

              {/* Date — locked to today */}
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
                  placeholder="e.g. Bullion"
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
                      className="py-2.5 text-sm rounded-lg border font-medium transition-colors"
                      style={transaction.mode === m
                        ? { borderColor: '#1e293b', backgroundColor: 'rgba(30,41,59,0.07)', color: '#1e293b' }
                        : { borderColor: '#d1d5db', color: '#4b5563' }
                      }
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
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 ${fieldErrors['transaction_0_bankName'] ? inpErr : 'border-gray-300'}`}
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                        <span className={`font-semibold ${selectedBank.balance - calculatedNetAmount < 0 ? 'text-red-600' : 'text-slate-700'}`}>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Being Paid Now
                    <span className="ml-1 text-xs font-normal text-gray-400">(enter how much is paid today)</span>
                  </label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-slate-400">
                    <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm font-medium whitespace-nowrap select-none">
                      PKR
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={calculatedNetAmount}
                      value={transaction.amount || ''}
                      onChange={(e) => onTransactionChange(0, 'amount', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 bg-white focus:outline-none text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                    <span className="text-gray-500">Net:</span>
                    <span className="font-medium">{fmt(calculatedNetAmount)}</span>
                    <span className="text-gray-400">−</span>
                    <span className="text-gray-500">Paid:</span>
                    <span className="font-medium text-green-700">{fmt(transaction.amount || 0)}</span>
                    <span className="text-gray-400">=</span>
                    <span className="font-bold text-orange-600">
                      Remaining: {fmt(Math.max(0, calculatedNetAmount - (transaction.amount || 0)))}
                    </span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => onFieldChange('note', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* ── Net Amount Summary ───────────────────────────────────── */}
          <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(30,41,59,0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900">Net Amount to Pay:</span>
              <span className="text-2xl font-bold" style={{ color: '#1e293b' }}>{fmt(calculatedNetAmount)}</span>
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
                  {isCommissionAutoFilled && !isEditMode && (
                    <span className="text-xs text-green-500">(from commission module)</span>
                  )}
                </span>
              )}
              {formData.deductions > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <span>−</span> Deductions: {fmt(formData.deductions)}
                  {isRegular && loanDeduction > 0 && !isEditMode && (
                    <span className="text-xs text-amber-600 ml-1">
                      (incl. {fmt(loanDeduction)} loan repayment)
                    </span>
                  )}
                </span>
              )}
            </div>
            {isRegular && advancePaidThisMonth > 0 && !regularAlreadyPaid && (
              <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'rgba(30,41,59,0.15)', color: '#1e293b' }}>
                ℹ️ Advance already paid this month: {fmt(advancePaidThisMonth)} · 
                Paying remaining: {fmt(remainingSalaryToPay)}
              </div>
            )}
            {/* Loan repayment summary line */}
            {isRegular && loanDeduction > 0 && employeeLoan && !isEditMode && (
              <div className="mt-2 pt-2 border-t text-xs text-amber-700 flex items-center gap-1.5" style={{ borderColor: 'rgba(30,41,59,0.15)' }}>
                <Landmark size={11} />
                Loan repayment of {fmt(loanDeduction)} will be deducted — loan balance:
                {' '}{fmt(employeeLoan.remaining)} → {fmt(loanAfterDeduction)}
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
              type="button" onClick={handleSubmitClick}
              disabled={isLoading || (regularAlreadyPaid && !isEditMode)}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#1e293b', borderColor: '#1e293b' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}