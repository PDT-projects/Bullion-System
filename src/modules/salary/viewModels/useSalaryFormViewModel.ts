// Salary Module - ViewModel Layer
// Form logic for create/edit salary
// UPDATED:
//  1. Fetches real banks from Firestore (BankFirebaseService)
//  2. Updates bank balance on save (deduct outflow)
//  3. Calculates advance paid for selected employee+month and shows deduction
//  4. Blocks paying regular salary for a month already fully paid
//  5. Saves bankId, chequeNumber, chequeDate, chequeBank to Firestore
//  6. Creates linked Cash Outflow transaction record
//  7. Auto-fills baseSalary with REMAINING amount (fullSalary - advancePaid)
//     when advance has already been partially paid this month
//  8. NEW: Auto-fills commission from a Confirmed commission record for the
//     selected employee + salaryMonth (from the commissions collection)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';
import { CommissionFirebaseService } from '../../commission/models/Commissionfirebaseservice';

interface BankInfo { id: string; name: string; balance: number; }

interface UseSalaryFormViewModelProps {
  mode: 'create' | 'edit';
  type: 'regular' | 'advance';
  employees: any[];
  banks?: any[];
}

interface UseSalaryFormViewModelReturn {
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
  // NEW: commission auto-fill state
  confirmedCommissionAmount: number;        // amount found in commissions collection
  isCommissionAutoFilled: boolean;          // true when commission was auto-populated
  commissionSource: string;                 // human-readable label, e.g. "Karachi · April 2025"
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
    employeeId:   '',
    subCategory:  type === 'regular' ? 'Employee salary' as const : 'Advance salary' as const,
    date:         new Date().toISOString().split('T')[0],
    note:         '',
    baseSalary:   0,
    commission:   0,
    deductions:   0,
  });

  const [transactionsList, setTransactionsList] = useState<SalaryTransaction[]>([
    SalaryService.getDefaultTransaction(),
  ]);

  const [banks,       setBanks]       = useState<BankInfo[]>([]);
  const [allSalaries, setAllSalaries] = useState<Salary[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);

  // ── NEW: commission auto-fill state ──────────────────────────────────────
  const [confirmedCommissionAmount, setConfirmedCommissionAmount] = useState(0);
  const [isCommissionAutoFilled,    setIsCommissionAutoFilled]    = useState(false);
  const [commissionSource,          setCommissionSource]          = useState('');
  // Flag to prevent auto-fill from overwriting a manual user edit
  const [commissionManuallyEdited,  setCommissionManuallyEdited]  = useState(false);

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

  const salaryMonth = transactionsList[0]?.salaryMonth || '';

  // ── Advance paid for this employee in the selected month ─────────────────
  const advancePaidThisMonth = useMemo(() => {
    if (!formData.employeeId || !salaryMonth) return 0;
    return allSalaries
      .filter(s =>
        s.employeeId === formData.employeeId &&
        s.salaryMonth === salaryMonth &&
        s.subCategory === 'Advance salary' &&
        (!isEditMode || s.id !== id)
      )
      .reduce((sum, s) => sum + (s.netAmount || s.amount || 0), 0);
  }, [allSalaries, formData.employeeId, salaryMonth, isEditMode, id]);

  // ── Regular salary already paid for this employee+month ──────────────────
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
    () => regularPaidRecords.reduce((sum, s) => sum + (s.netAmount || s.amount || 0), 0),
    [regularPaidRecords]
  );

  const regularAlreadyPaid = useMemo(() => {
    if (type !== 'regular') return false;
    if (!selectedEmployee) return false;
    return regularAlreadyPaidAmount >= (selectedEmployee.salary || 0);
  }, [type, selectedEmployee, regularAlreadyPaidAmount]);

  // ── Remaining salary = full salary minus advance already given ────────────
  const remainingSalaryToPay = useMemo(() => {
    if (!selectedEmployee || !salaryMonth) return 0;
    const fullSalary = selectedEmployee.salary || 0;
    if (advancePaidThisMonth <= 0) return 0;
    return Math.max(0, fullSalary - advancePaidThisMonth);
  }, [selectedEmployee, advancePaidThisMonth]);

  // ── Future month selected on regular form → auto-treat as advance ─────────
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

  const validation = useMemo(() => {
    return SalaryService.validateSalary(
      { ...formData, amount: calculatedNetAmount },
      transactionsList
    );
  }, [formData, calculatedNetAmount, transactionsList]);

  // ── NEW: Auto-fetch confirmed commission for employee + salaryMonth ────────
  // Runs whenever employeeId or salaryMonth changes (create mode only, regular type only)
  // If the user has already manually edited the commission field, we skip the auto-fill.
  useEffect(() => {
    if (isEditMode) return;                        // don't overwrite existing records
    if (type !== 'regular') return;                // commissions only apply to regular salary
    if (!formData.employeeId || !salaryMonth) return;
    if (commissionManuallyEdited) return;          // user has overridden — respect it

    let cancelled = false;

    const fetchCommission = async () => {
      try {
        const allCommissions = await CommissionFirebaseService.fetchAllCommissions();

        // Find the most recent Confirmed commission for this employee + month
        const match = allCommissions.find(
          (c) =>
            c.salesperson === formData.employeeId &&
            c.month === salaryMonth &&
            c.status === 'Confirmed'
        );

        if (cancelled) return;

        if (match) {
          const amount = match.overriddenCommissionAmount ?? match.calculatedCommissionAmount;
          setConfirmedCommissionAmount(amount);
          setIsCommissionAutoFilled(true);
          setCommissionSource(`${match.city} · ${match.month}`);
          // Only auto-fill if user hasn't manually changed the field
          setFormData((prev) => ({ ...prev, commission: amount }));
        } else {
          // No confirmed commission found — clear any previously auto-filled value
          setConfirmedCommissionAmount(0);
          setIsCommissionAutoFilled(false);
          setCommissionSource('');
          setFormData((prev) => ({ ...prev, commission: 0 }));
        }
      } catch (err) {
        // Non-fatal: if commission fetch fails, just leave the field at 0
        console.warn('⚠️ Could not fetch commission for salary form:', err);
      }
    };

    fetchCommission();
    return () => { cancelled = true; };
  }, [formData.employeeId, salaryMonth, isEditMode, type, commissionManuallyEdited]);

  // Load existing salary in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const salary = await SalaryFirebaseService.fetchSalaryById(id);
        if (!salary) { toast.error('Salary record not found'); navigate('/salary'); return; }
        setFormData({
          employeeId:  salary.employeeId,
          subCategory: salary.subCategory,
          date:        salary.date,
          note:        salary.note || '',
          baseSalary:  salary.baseSalary || 0,
          commission:  salary.commission || 0,
          deductions:  salary.deductions || 0,
        });
        setTransactionsList([{
          id:              Date.now().toString(),
          amount:          salary.netAmount || salary.amount,
          paidBy:          salary.paidBy,
          transactionBy:   salary.transactionBy || '',
          mode:            salary.mode,
          bankId:          salary.bankId || '',
          bankName:        salary.bankName || '',
          chequeNumber:    salary.chequeNumber || '',
          chequeDate:      salary.chequeDate || '',
          chequeBank:      salary.chequeBank || '',
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

  // Auto-populate base salary from employee on new regular salary.
  // If advance was already paid this month, pre-fill with REMAINING amount.
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      const fullSalary = selectedEmployee.salary || 0;
      const suggestedBase = advancePaidThisMonth > 0
        ? Math.max(0, fullSalary - advancePaidThisMonth)
        : fullSalary;
      setFormData(prev => ({ ...prev, baseSalary: suggestedBase }));
    }
  }, [selectedEmployee, isEditMode, type, advancePaidThisMonth]);

  // Keep transaction amount in sync with net amount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => i === 0 ? { ...t, amount: calculatedNetAmount } : t)
    );
  }, [calculatedNetAmount]);

  const setField = useCallback((field: string, value: any) => {
    // If user is manually editing the commission field, stop future auto-fills
    if (field === 'commission') {
      setCommissionManuallyEdited(true);
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
          // When salaryMonth changes, reset the manual-edit flag so commission
          // can be re-fetched for the new month
          if (field === 'salaryMonth') {
            setCommissionManuallyEdited(false);
          }
          return updated;
        })
      );
    },
    [banks]
  );

  const handleSubmit = useCallback(async () => {
    if (type === 'regular' && regularAlreadyPaid && !isEditMode) {
      toast.error(`Regular salary for ${selectedEmployee?.name} is already fully paid for ${salaryMonth}`);
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

    setIsLoading(true);
    try {
      const txn      = transactionsList[0];
      const employee = employees.find(e => e.id === formData.employeeId);
      const bank     = txn.mode === 'Bank' ? banks.find(b => b.id === txn.bankId) : null;

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
        bankId:          txn.mode === 'Bank'   ? txn.bankId        : undefined,
        bankName:        txn.mode === 'Bank'   ? txn.bankName      : '',
        chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber  : undefined,
        chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate    : undefined,
        chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank    : undefined,
        paidBy:          txn.paidBy,
        transactionBy:   txn.transactionBy || '',
        salaryMonth:     txn.salaryMonth,
        note:            formData.note || '',
        imageUrl:        txn.imageUrl || '',
        paymentStatus:   txn.paymentStatus,
        remainingAmount: txn.remainingAmount || 0,
      };

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
        });

        if (txn.mode === 'Bank' && txn.bankId && bank) {
          const newBalance = bank.balance - calculatedNetAmount;
          await BankFirebaseService.updateBankBalance(txn.bankId, newBalance);
        }

        toast.success('Salary payment recorded successfully');
      }

      navigate(type === 'advance' ? '/salary/advance' : '/salary/regular');
    } catch (err) {
      console.error('Error saving salary:', err);
      toast.error('An error occurred while saving the salary');
    } finally {
      setIsLoading(false);
    }
  }, [formData, transactionsList, calculatedNetAmount, isEditMode, id, employees, banks,
      navigate, type, regularAlreadyPaid, selectedEmployee, salaryMonth, effectiveSubCategory]);

  const handleCancel = useCallback(
    () => navigate(type === 'advance' ? '/salary/advance' : '/salary/regular'),
    [navigate, type]
  );

  return {
    formData,
    transactions: transactionsList,
    isValid:      validation.isValid,
    errorMessage: validation.error,
    fieldErrors:  validation.fieldErrors || {},
    isLoading,
    isEditMode,
    pageTitle,
    submitButtonText,
    employees,
    banks,
    selectedEmployee,
    calculatedNetAmount,
    advancePaidThisMonth,
    regularAlreadyPaid,
    regularAlreadyPaidAmount,
    remainingSalaryToPay,
    isEffectivelyAdvance,
    confirmedCommissionAmount,
    isCommissionAutoFilled,
    commissionSource,
    onFieldChange:       setField,
    onTransactionChange: setTransactionField,
    onSubmit:   handleSubmit,
    onCancel:   handleCancel,
  };
}