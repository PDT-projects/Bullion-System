// Salary Module - ViewModel Layer
// Form logic for create/edit salary
//
// KEY FIX: calculateAutoCommission now receives BOTH employeeId AND employeeName.
//   - employeeName is used to match invoices (invoices store name, not ID)
//   - employeeId   is used to match commission slabs (slabs store ID)

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
import {
  calculateAutoCommission,
  formatCommissionSummary,
  type CommissionAutoResult,
  type CommissionCityBreakdown,
} from '../../commission/models/Commissionautoservice';

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
  regularAlreadyPaid: boolean;
  regularAlreadyPaidAmount: number;
  remainingSalaryToPay: number;
  isEffectivelyAdvance: boolean;
  commissionResult: CommissionAutoResult | null;
  isCommissionAutoFilled: boolean;
  isCommissionLoading: boolean;
  commissionSummary: string;
  commissionBreakdown: CommissionCityBreakdown[];
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

  const remainingSalaryToPay = useMemo(() => {
    if (!selectedEmployee || !salaryMonth) return 0;
    const fullSalary = selectedEmployee.salary || 0;
    if (advancePaidThisMonth <= 0) return 0;
    return Math.max(0, fullSalary - advancePaidThisMonth);
  }, [selectedEmployee, advancePaidThisMonth]);

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

  // ── AUTO-COMMISSION CALCULATION ───────────────────────────────────────────
  // Runs when employee or month changes (create mode, regular only).
  // Uses BOTH employeeId (for slab matching) and employeeName (for invoice matching).
  useEffect(() => {
    if (isEditMode) return;
    if (type !== 'regular') return;
    if (!formData.employeeId || !salaryMonth) {
      setCommissionResult(null);
      setIsCommissionAutoFilled(false);
      return;
    }
    if (commissionManuallyEdited.current) return;

    // Need the employee name to match invoices
    const employeeName = selectedEmployee?.name;
    if (!employeeName) {
      console.warn('[CommissionAuto] Employee name not found for ID:', formData.employeeId);
      return;
    }

    let cancelled = false;
    setIsCommissionLoading(true);

    const run = async () => {
      try {
        console.log(
          `[CommissionAuto] Fetching invoices + slabs for "${employeeName}" (${formData.employeeId}) / ${salaryMonth}`
        );

        const [invoices, slabs] = await Promise.all([
          InvoiceFirebaseService.fetchAllInvoices(),
          CommissionFirebaseService.fetchAllSlabs(),
        ]);

        if (cancelled) return;

        console.log(`[CommissionAuto] Fetched ${invoices.length} invoices, ${slabs.length} slabs`);

        const result = calculateAutoCommission(
          formData.employeeId,  // used to match slabs
          employeeName,         // used to match invoices
          salaryMonth,
          invoices,
          slabs
        );

        console.log('[CommissionAuto] Result:', result);

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

  // Auto-fill baseSalary from employee record
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      const fullSalary    = selectedEmployee.salary || 0;
      const suggestedBase = advancePaidThisMonth > 0
        ? Math.max(0, fullSalary - advancePaidThisMonth)
        : fullSalary;
      setFormData(prev => ({ ...prev, baseSalary: suggestedBase }));
    }
  }, [selectedEmployee, isEditMode, type, advancePaidThisMonth]);

  // Keep transaction[0].amount in sync with net amount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => i === 0 ? { ...t, amount: calculatedNetAmount } : t)
    );
  }, [calculatedNetAmount]);

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
            // Reset manual flag → re-calculate for new month
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
          await BankFirebaseService.updateBankBalance(
            txn.bankId,
            bank.balance - calculatedNetAmount
          );
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
  }, [
    formData, transactionsList, calculatedNetAmount, isEditMode, id,
    employees, banks, navigate, type, regularAlreadyPaid,
    selectedEmployee, salaryMonth, effectiveSubCategory,
  ]);

  const handleCancel = useCallback(
    () => navigate(type === 'advance' ? '/salary/advance' : '/salary/regular'),
    [navigate, type]
  );

  const commissionSummary = useMemo(() => {
    if (!commissionResult) return '';
    return formatCommissionSummary(commissionResult, (n) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'PKR', minimumFractionDigits: 0,
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
    regularAlreadyPaid,
    regularAlreadyPaidAmount,
    remainingSalaryToPay,
    isEffectivelyAdvance,
    commissionResult,
    isCommissionAutoFilled,
    isCommissionLoading,
    commissionSummary,
    commissionBreakdown:    commissionResult?.breakdown ?? [],
    onFieldChange:          setField,
    onTransactionChange:    setTransactionField,
    onSubmit:               handleSubmit,
    onCancel:               handleCancel,
  };
}