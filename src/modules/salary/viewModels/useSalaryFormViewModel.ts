// Salary Module - ViewModel Layer
// Form logic for create/edit salary
//
// KEY FIX: calculateAutoCommission now receives BOTH employeeId AND employeeName.
//   - employeeName is used to match invoices (invoices store name, not ID)
//   - employeeId   is used to match commission slabs (slabs store ID)
//
// LOAN DEDUCTION FEATURE:
//   - On employee select, fetches any active Receivable loans linked to that employee
//   - Exposes `employeeLoan`, `loanDeduction`, `setLoanDeduction`
//   - On submit, calls LoanFirebaseService.makePayment() to reduce loan balance
//
// DUAL CURRENCY FEATURE (FIXED):
//   - Each employee has a `salaryCurrency` field ('PKR' | 'AED')
//   - salaryCurrency is now derived from the SELECTED EMPLOYEE, not hardcoded to 'AED'
//   - The salary form shows amounts in the employee's native currency
//   - On save, both `salaryAED` and `salaryPKR` are stored correctly:
//       • PKR employee: entered value = salaryPKR, salaryAED = value / AED_TO_PKR
//       • AED employee: entered value = salaryAED, salaryPKR = value * AED_TO_PKR
//   - Exchange rate constant: 1 AED = AED_TO_PKR PKR (same as EmployeeService)

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { CommissionFirebaseService } from '../../commission/models/Commissionfirebaseservice';
import { LoanFirebaseService } from '../../loans/models/Loanfirebaseservice';
import type { Loan } from '../../loans/models/types';
import {
  calculateAutoCommission,
  formatCommissionSummary,
  type CommissionAutoResult,
  type CommissionCityBreakdown,
} from '../../commission/models/Commissionautoservice';

// Keep in sync with EmployeeService.AED_TO_PKR
const AED_TO_PKR = 76;

export type SalaryCurrency = 'PKR' | 'AED';

// ── Currency helpers ───────────────────────────────────────────────────────
// Convert any employee native salary amount to AED for internal comparisons
// (advance tracking, remaining calculations). The form itself now always
// displays in the employee's OWN currency — these helpers are only used for
// cross-currency comparisons in the advance/remaining logic.
function toAED(amount: number, employeeCurrency?: string): number {
  if (employeeCurrency === 'PKR') return parseFloat((amount / AED_TO_PKR).toFixed(2));
  return amount;
}

// Convert any employee native salary amount to PKR
function toPKR(amount: number, employeeCurrency?: string): number {
  if (employeeCurrency === 'AED') return Math.round(amount * AED_TO_PKR);
  return Math.round(amount);
}

interface BankInfo { id: string; name: string; balance: number; }

interface UseSalaryFormViewModelProps {
  mode: 'create' | 'edit';
  type: 'regular' | 'advance';
  employees: any[];
}

export interface UseSalaryFormViewModelReturn {
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
  commissionResult: CommissionAutoResult | null;
  isCommissionAutoFilled: boolean;
  isCommissionLoading: boolean;
  commissionSummary: string;
  commissionBreakdown: CommissionCityBreakdown[];
  // ── Dual currency ────────────────────────────────────────────────────────
  salaryCurrency: SalaryCurrency;   // currency the employee is paid in (from employee record)
  convertedAmount: number;          // net amount in the OTHER currency (for display only)
  // ── Loan deduction ──────────────────────────────────────────────────────
  employeeLoan: Loan | null;
  loanDeduction: number;
  isLoanLoading: boolean;
  setLoanDeduction: (amount: number) => void;
  // ────────────────────────────────────────────────────────────────────────
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function useSalaryFormViewModel({
  mode,
  type,
  employees,
}: UseSalaryFormViewModelProps): UseSalaryFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    employeeId:  '',
    subCategory: type === 'regular' ? 'Employee salary' as const : 'Advance salary' as const,
    date:        new Date().toISOString().split('T')[0],
    note:        '',
    baseSalary:  0,
    commission:  0,
    deductions:  0,
  });

  const [transactionsList, setTransactionsList] = useState<SalaryTransaction[]>([
    SalaryService.getDefaultTransaction(),
  ]);

  const [banks,       setBanks]       = useState<BankInfo[]>([]);
  const [allSalaries, setAllSalaries] = useState<Salary[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);

  const [commissionResult,       setCommissionResult]       = useState<CommissionAutoResult | null>(null);
  const [isCommissionAutoFilled, setIsCommissionAutoFilled] = useState(false);
  const [isCommissionLoading,    setIsCommissionLoading]    = useState(false);
  const commissionManuallyEdited = useRef(false);

  // ── Loan state ────────────────────────────────────────────────────────────
  const [employeeLoan,      setEmployeeLoan]      = useState<Loan | null>(null);
  const [loanDeduction,     setLoanDeductionState] = useState(0);
  const [isLoanLoading,     setIsLoanLoading]      = useState(false);
  // ──────────────────────────────────────────────────────────────────────────

  const isEditMode       = mode === 'edit';
  const submitButtonText = isEditMode ? 'Update Salary' : 'Save Salary';
  const currentMonth     = new Date().toISOString().slice(0, 7);

  // Fetch banks + all salaries on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [bankList, salaryList] = await Promise.all([
          BankFirebaseService.fetchAllBanks().catch(() => []),
          SalaryFirebaseService.fetchAllSalaries().catch(() => []),
        ]);
        setBanks(bankList as BankInfo[]);
        setAllSalaries(salaryList);
      } catch {
        toast.error('Failed to load form data');
      }
    };
    load();
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === formData.employeeId) || null,
    [employees, formData.employeeId]
  );

  // ── FIX: Derive salaryCurrency from the selected employee's record ─────────
  // Previously this was hardcoded to 'AED', which caused PKR employees'
  // salaries to be displayed with wrong labels (e.g. 50,000 PKR shown as AED).
  // Now it correctly reflects the employee's own currency setting.
  // Falls back to 'AED' only when no employee is selected (form default).
  const salaryCurrency: SalaryCurrency = useMemo((): SalaryCurrency => {
    if (!selectedEmployee) return 'AED';
    return (selectedEmployee as any).salaryCurrency === 'PKR' ? 'PKR' : 'AED';
  }, [selectedEmployee]);

  // Convert the net amount to the OTHER currency for secondary display
  const convertedAmount = useMemo(() => {
    const net = Math.max(0, formData.baseSalary + formData.commission - formData.deductions);
    if (salaryCurrency === 'PKR') {
      // Primary is PKR → show AED equivalent
      return parseFloat((net / AED_TO_PKR).toFixed(2));
    }
    // Primary is AED → show PKR equivalent
    return Math.round(net * AED_TO_PKR);
  }, [formData.baseSalary, formData.commission, formData.deductions, salaryCurrency]);
  // ──────────────────────────────────────────────────────────────────────────

  const salaryMonth = transactionsList[0]?.salaryMonth || '';

  // ── Advance / remaining salary calculations ────────────────────────────────
  // All advance/remaining comparisons are done in the EMPLOYEE'S OWN CURRENCY
  // so there's no cross-currency confusion in the arithmetic.
  const advancePaidThisMonth = useMemo(() => {
    if (!formData.employeeId || !salaryMonth) return 0;
    return allSalaries
      .filter(s =>
        s.employeeId === formData.employeeId &&
        s.salaryMonth === salaryMonth &&
        s.subCategory === 'Advance salary' &&
        (!isEditMode || s.id !== id)
      )
      .reduce((sum, s) => {
        // Use the currency-correct stored value if available, otherwise netAmount
        const net = (() => {
          if (salaryCurrency === 'PKR' && (s as any).salaryPKR) return (s as any).salaryPKR;
          if (salaryCurrency === 'AED' && (s as any).salaryAED) return (s as any).salaryAED;
          return s.netAmount || s.amount || 0;
        })();
        const remaining = s.remainingAmount || 0;
        return sum + Math.max(0, net - remaining);
      }, 0);
  }, [allSalaries, formData.employeeId, salaryMonth, isEditMode, id, salaryCurrency]);

  const regularPaidRecords = useMemo(() => {
    if (!formData.employeeId || !salaryMonth) return [];
    return allSalaries.filter(s =>
      s.employeeId === formData.employeeId &&
      s.salaryMonth === salaryMonth &&
      s.subCategory === 'Employee salary' &&
      (!isEditMode || s.id !== id)
    );
  }, [allSalaries, formData.employeeId, salaryMonth, isEditMode, id]);

  const regularAlreadyPaidAmount = useMemo(
    () => regularPaidRecords.reduce((sum, s) => {
      const net = (() => {
        if (salaryCurrency === 'PKR' && (s as any).salaryPKR) return (s as any).salaryPKR;
        if (salaryCurrency === 'AED' && (s as any).salaryAED) return (s as any).salaryAED;
        return s.netAmount || s.amount || 0;
      })();
      return sum + net;
    }, 0),
    [regularPaidRecords, salaryCurrency]
  );

  // Full salary in the employee's own currency (no conversion needed)
  const employeeFullSalaryNative = useMemo(
    () => selectedEmployee?.salary || 0,
    [selectedEmployee]
  );

  const advanceAvailableThisMonth = useMemo(() => {
    if (!selectedEmployee || !salaryMonth) return 0;
    const totalUsed = advancePaidThisMonth + regularAlreadyPaidAmount;
    return Math.max(0, employeeFullSalaryNative - totalUsed);
  }, [selectedEmployee, salaryMonth, advancePaidThisMonth, regularAlreadyPaidAmount, employeeFullSalaryNative]);

  const regularAlreadyPaid = useMemo(() => {
    if (type !== 'regular') return false;
    if (!selectedEmployee) return false;
    return regularAlreadyPaidAmount >= employeeFullSalaryNative;
  }, [type, selectedEmployee, regularAlreadyPaidAmount, employeeFullSalaryNative]);

  const remainingSalaryToPay = useMemo(() => {
    if (!selectedEmployee || !salaryMonth) return 0;
    const totalAlreadyPaid = advancePaidThisMonth + regularAlreadyPaidAmount;
    if (totalAlreadyPaid <= 0) return 0;
    return Math.max(0, employeeFullSalaryNative - totalAlreadyPaid);
  }, [selectedEmployee, advancePaidThisMonth, regularAlreadyPaidAmount, employeeFullSalaryNative]);

  const isEffectivelyAdvance = useMemo(() => {
    if (type !== 'regular' || isEditMode || !salaryMonth) return false;
    return salaryMonth > currentMonth;
  }, [type, isEditMode, salaryMonth, currentMonth]);

  const effectiveSubCategory: 'Employee salary' | 'Advance salary' = useMemo(() => {
    if (isEffectivelyAdvance) return 'Advance salary';
    return formData.subCategory;
  }, [isEffectivelyAdvance, formData.subCategory]);

  const pageTitle = isEditMode
    ? 'Edit Salary'
    : isEffectivelyAdvance
    ? 'Pay Advance Salary (Future Month)'
    : type === 'regular'
    ? 'Pay Regular Salary'
    : 'Pay Advance Salary';

  const calculatedNetAmount = useMemo(
    () => Math.max(0, formData.baseSalary + formData.commission - formData.deductions),
    [formData.baseSalary, formData.commission, formData.deductions]
  );

  const validation = useMemo(
    () => SalaryService.validateSalary(
      { ...formData, amount: calculatedNetAmount },
      transactionsList
    ),
    [formData, calculatedNetAmount, transactionsList]
  );

  // ── Fetch employee's active Receivable loan when employee changes ─────────
  useEffect(() => {
    if (type !== 'regular' || isEditMode || !formData.employeeId) {
      setEmployeeLoan(null);
      setLoanDeductionState(0);
      return;
    }

    let cancelled = false;
    setIsLoanLoading(true);

    const fetchLoan = async () => {
      try {
        const allLoans = await LoanFirebaseService.fetchAllLoans();
        if (cancelled) return;

        const activeLoan = allLoans.find(
          (l) =>
            l.type === 'Receivable' &&
            l.status === 'Partial' &&
            l.remaining > 0 &&
            l.employeeId === formData.employeeId
        ) || null;

        setEmployeeLoan(activeLoan);
        setLoanDeductionState(0);
        setFormData(prev => ({ ...prev, deductions: 0 }));
      } catch (err) {
        console.error('[LoanFetch] Error fetching employee loans:', err);
        setEmployeeLoan(null);
      } finally {
        if (!cancelled) setIsLoanLoading(false);
      }
    };

    fetchLoan();
    return () => { cancelled = true; };
  }, [formData.employeeId, type, isEditMode]);
  // ──────────────────────────────────────────────────────────────────────────

  const setLoanDeduction = useCallback((amount: number) => {
    const clamped = Math.max(0, Math.min(amount, employeeLoan?.remaining ?? amount));
    setLoanDeductionState(clamped);
    setFormData(prev => ({ ...prev, deductions: clamped }));
  }, [employeeLoan]);

  // ── AUTO-COMMISSION CALCULATION ───────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    if (type !== 'regular') return;
    if (!formData.employeeId || !salaryMonth) {
      setCommissionResult(null);
      setIsCommissionAutoFilled(false);
      return;
    }
    if (commissionManuallyEdited.current) return;

    const employeeName = selectedEmployee?.name;
    if (!employeeName) return;

    let cancelled = false;
    setIsCommissionLoading(true);

    const run = async () => {
      try {
        const [invoices, slabs] = await Promise.all([
          InvoiceFirebaseService.fetchAllInvoices(),
          CommissionFirebaseService.fetchAllSlabs(),
        ]);

        if (cancelled) return;

        const result = calculateAutoCommission(
          formData.employeeId,
          employeeName,
          salaryMonth,
          invoices,
          slabs
        );

        setCommissionResult(result);

        if (result.commissionAmount > 0 && result.hasMatch) {
          setIsCommissionAutoFilled(true);
          setFormData(prev => ({ ...prev, commission: Math.round(result.commissionAmount) }));
        } else {
          setIsCommissionAutoFilled(false);
          setFormData(prev => ({ ...prev, commission: 0 }));
        }
      } catch (err) {
        console.error('[CommissionAuto] Error:', err);
        setCommissionResult(null);
        setIsCommissionAutoFilled(false);
      } finally {
        if (!cancelled) setIsCommissionLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.employeeId, salaryMonth, isEditMode, type, selectedEmployee?.name]);

  // Load existing salary in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const salary = await SalaryFirebaseService.fetchSalaryById(id);
        if (!salary) {
          toast.error('Salary record not found');
          navigate('/salary');
          return;
        }
        setFormData({
          employeeId:  salary.employeeId,
          subCategory: salary.subCategory,
          date:        salary.date,
          note:        salary.note || '',
          baseSalary:  salary.baseSalary  || 0,
          commission:  salary.commission  || 0,
          deductions:  salary.deductions  || 0,
        });
        setTransactionsList([{
          id:              Date.now().toString(),
          amount:          salary.netAmount || salary.amount,
          paidBy:          salary.paidBy,
          transactionBy:   salary.transactionBy || '',
          mode:            salary.mode,
          bankId:          salary.bankId          || '',
          bankName:        salary.bankName        || '',
          chequeNumber:    salary.chequeNumber    || '',
          chequeDate:      salary.chequeDate      || '',
          chequeBank:      salary.chequeBank      || '',
          imageUrl:        salary.imageUrl,
          paymentStatus:   salary.paymentStatus,
          remainingAmount: salary.remainingAmount,
          salaryMonth:     salary.salaryMonth,
        }]);
      } catch {
        toast.error('Failed to load salary record');
        navigate('/salary');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isEditMode, id, navigate]);

  // ── Auto-fill baseSalary from employee record ──────────────────────────────
  // The employee's `salary` field is always in their OWN currency.
  // We no longer convert to AED here — we use the native value directly,
  // which is what the form now displays (in the employee's currency).
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      const fullSalaryNative = selectedEmployee.salary || 0;
      const suggestedBase = advancePaidThisMonth > 0
        ? Math.max(0, fullSalaryNative - advancePaidThisMonth)
        : fullSalaryNative;
      setFormData(prev => ({ ...prev, baseSalary: suggestedBase }));
    }
  }, [selectedEmployee, isEditMode, type, advancePaidThisMonth]);

  // Keep transaction[0].amount in sync with net amount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => i === 0 ? { ...t, amount: calculatedNetAmount } : t)
    );
  }, [calculatedNetAmount]);

  // Auto-calc remainingAmount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => {
        if (i !== 0) return t;
        if (t.paymentStatus === 'Partial') {
          return { ...t, remainingAmount: Math.max(0, calculatedNetAmount - (t.amount || 0)) };
        }
        return { ...t, remainingAmount: 0 };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedNetAmount, transactionsList[0]?.paymentStatus, transactionsList[0]?.amount]);

  const setField = useCallback((field: string, value: any) => {
    if (field === 'commission') {
      commissionManuallyEdited.current = true;
      setIsCommissionAutoFilled(false);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setTransactionField = useCallback(
    (index: number, field: keyof SalaryTransaction, value: any) => {
      setTransactionsList(prev =>
        prev.map((t, i) => {
          if (i !== index) return t;
          const updated = { ...t, [field]: value };
          if (field === 'bankId') {
            const bank = banks.find(b => b.id === value);
            updated.bankName = bank?.name || '';
          }
          if (field === 'mode') {
            if (value === 'Cash')   { updated.bankId = ''; updated.bankName = ''; updated.chequeNumber = ''; }
            if (value === 'Bank')   { updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
            if (value === 'Cheque') { updated.bankId = ''; updated.bankName = ''; }
          }
          if (field === 'salaryMonth') {
            commissionManuallyEdited.current = false;
            setIsCommissionAutoFilled(false);
            setCommissionResult(null);
          }
          return updated;
        })
      );
    },
    [banks]
  );

  const handleSubmit = useCallback(async () => {
    if (type === 'regular' && regularAlreadyPaid && !isEditMode) {
      toast.error(
        `Regular salary for ${selectedEmployee?.name} is already fully paid for ${salaryMonth}`
      );
      return;
    }

    const v = SalaryService.validateSalary(
      { ...formData, amount: calculatedNetAmount },
      transactionsList
    );
    if (!v.isValid) {
      toast.error(v.error || 'Please fill in all required fields');
      return;
    }

    if (loanDeduction > 0 && employeeLoan && loanDeduction > employeeLoan.remaining) {
      toast.error(
        `Loan deduction (${loanDeduction.toLocaleString()}) cannot exceed remaining loan balance (${employeeLoan.remaining.toLocaleString()})`
      );
      return;
    }

    setIsLoading(true);
    try {
      const txn      = transactionsList[0];
      const employee = employees.find(e => e.id === formData.employeeId);
      const bank     = txn.mode === 'Bank' ? banks.find(b => b.id === txn.bankId) : null;

      // ── FIX: Dual-currency amounts ─────────────────────────────────────────
      // Store both currencies correctly based on the employee's own currency.
      // The net amount (calculatedNetAmount) is always in the employee's native
      // currency — so we convert to the other currency, NOT treat both as AED.
      const net = calculatedNetAmount;
      const employeeCurrency: SalaryCurrency =
        (employee as any)?.salaryCurrency === 'PKR' ? 'PKR' : 'AED';

      const salaryAED = employeeCurrency === 'AED'
        ? net
        : parseFloat((net / AED_TO_PKR).toFixed(2));

      const salaryPKR = employeeCurrency === 'PKR'
        ? Math.round(net)
        : Math.round(net * AED_TO_PKR);
      // ───────────────────────────────────────────────────────────────────────

      const salaryPayload: Omit<Salary, 'id'> = {
        transactionId:   `SAL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        date:            formData.date,
        time:            new Date().toTimeString().split(' ')[0],
        employeeId:      formData.employeeId,
        employeeName:    employee?.name || '',
        mainCategory:    'Salary',
        subCategory:     effectiveSubCategory,
        amount:          txn.amount,
        baseSalary:      formData.baseSalary,
        commission:      formData.commission,
        deductions:      formData.deductions,
        netAmount:       calculatedNetAmount,
        mode:            txn.mode,
        bankId:          txn.mode === 'Bank'   ? txn.bankId       : undefined,
        bankName:        txn.mode === 'Bank'   ? txn.bankName     : '',
        chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber : undefined,
        chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate   : undefined,
        chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank   : undefined,
        paidBy:          txn.paidBy,
        transactionBy:   txn.transactionBy || '',
        salaryMonth:     txn.salaryMonth,
        note:            formData.note || '',
        imageUrl:        txn.imageUrl || '',
        paymentStatus:   txn.paymentStatus,
        remainingAmount: txn.remainingAmount || 0,
        // ── Currency fields (correctly computed) ─────────────────────────
        salaryCurrency:  employeeCurrency,
        salaryAED,
        salaryPKR,
        // ─────────────────────────────────────────────────────────────────
      } as any;

      if (isEditMode && id) {
        await SalaryFirebaseService.updateSalary(id, salaryPayload);
        toast.success('Salary updated successfully');
      } else {
        await SalaryFirebaseService.createSalary(salaryPayload);

        await TransactionFirebaseService.createTransaction({
          transactionId:   salaryPayload.transactionId,
          date:            formData.date,
          time:            salaryPayload.time,
          company:         'Pakistan Detectors Technologies',
          mainCategory:    'Cash Outflow',
          subCategory:     effectiveSubCategory === 'Employee salary' ? 'Employee salary' : 'Advance salary',
          detailCategory:  employee?.name,
          amount:          calculatedNetAmount,
          mode:            txn.mode,
          bankId:          txn.mode === 'Bank'   ? txn.bankId       : undefined,
          bankName:        txn.mode === 'Bank'   ? txn.bankName     : undefined,
          chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber : undefined,
          chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate   : undefined,
          chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank   : undefined,
          amountPaid:      calculatedNetAmount,
          remainingAmount: txn.remainingAmount || 0,
          paymentStatus:   txn.paymentStatus,
          paidBy:          txn.paidBy,
          paidTo:          employee?.name,
          note:            formData.note || '',
          partialPayments: [],
          totalPaid:       calculatedNetAmount,
          isFullyCleared:  txn.paymentStatus === 'Full',
          linkedType:      'salary',
          linkedRef:       `${formData.subCategory} — ${txn.salaryMonth}`,
          salaryMonth:     txn.salaryMonth,
          baseSalary:      formData.baseSalary,
          commission:      formData.commission,
          deductions:      formData.deductions,
          netAmount:       calculatedNetAmount,
          employeeId:      formData.employeeId,
          employeeName:    employee?.name,
          salaryCurrency:  employeeCurrency,
          salaryAED,
          salaryPKR,
        });

        if (txn.mode === 'Bank' && txn.bankId && bank) {
          await BankFirebaseService.updateBankBalance(
            txn.bankId,
            bank.balance - calculatedNetAmount
          );
        }

        // ── Record loan repayment if a deduction was applied ─────────────
        if (loanDeduction > 0 && employeeLoan) {
          try {
            await LoanFirebaseService.makePayment(
              {
                loanId: employeeLoan.id,
                amount: loanDeduction,
                mode:   'Cash',
                date:   formData.date,
              },
              employeeLoan
            );
          } catch (loanErr) {
            console.error('❌ Failed to update loan balance after salary save:', loanErr);
            toast.warning(
              'Salary saved successfully, but the loan balance could not be updated automatically. Please update the loan manually.'
            );
          }
        }
        // ────────────────────────────────────────────────────────────────

        toast.success('Salary payment recorded successfully');
      }

      navigate(type === 'advance' ? '/salary/advance' : '/salary/regular');
    } catch (err) {
      console.error('Error saving salary:', err);
      toast.error('An error occurred while saving the salary');
    } finally {
      setIsLoading(false);
    }
  }, [
    formData, transactionsList, calculatedNetAmount, isEditMode, id,
    employees, banks, navigate, type, regularAlreadyPaid,
    selectedEmployee, salaryMonth, effectiveSubCategory,
    loanDeduction, employeeLoan, salaryCurrency,
  ]);

  const handleCancel = useCallback(
    () => navigate(type === 'advance' ? '/salary/advance' : '/salary/regular'),
    [navigate, type]
  );

  const commissionSummary = useMemo(() => {
    if (!commissionResult) return '';
    return formatCommissionSummary(commissionResult, (n) =>
      new Intl.NumberFormat('en-AE', {
        style: 'currency', currency: 'AED', minimumFractionDigits: 0,
      }).format(n)
    );
  }, [commissionResult]);

  return {
    formData,
    transactions:           transactionsList,
    isValid:                validation.isValid,
    errorMessage:           validation.error,
    fieldErrors:            validation.fieldErrors || {},
    isLoading,
    isEditMode,
    pageTitle,
    submitButtonText,
    employees,
    banks,
    selectedEmployee,
    calculatedNetAmount,
    advancePaidThisMonth,
    advanceAvailableThisMonth,
    regularAlreadyPaid,
    regularAlreadyPaidAmount,
    remainingSalaryToPay,
    isEffectivelyAdvance,
    commissionResult,
    isCommissionAutoFilled,
    isCommissionLoading,
    commissionSummary,
    commissionBreakdown:    commissionResult?.breakdown ?? [],
    salaryCurrency,
    convertedAmount,
    employeeLoan,
    loanDeduction,
    isLoanLoading,
    setLoanDeduction,
    onFieldChange:          setField,
    onTransactionChange:    setTransactionField,
    onSubmit:               handleSubmit,
    onCancel:               handleCancel,
  };
}