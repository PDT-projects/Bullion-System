// Salary Module - ViewModel Layer
// Form logic for create/edit salary
// Changes:
// 1. Fetches real banks from Firestore (BankFirebaseService)
// 2. Updates bank balance on save (deduct outflow)
// 3. Calculates advance paid for selected employee+month and shows deduction
// 4. Blocks paying regular salary for a month already fully paid
// 5. Saves bankId, chequeNumber, chequeDate, chequeBank to Firestore
// 6. Creates linked Cash Outflow transaction record

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

interface UseSalaryFormViewModelProps {
  mode: 'create' | 'edit';
  type: 'regular' | 'advance';
  employees: any[];
  banks?: any[]; // kept for backward compat but we fetch internally
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
  advancePaidThisMonth: number;        // ← new: total advance paid for employee+month
  regularAlreadyPaid: boolean;         // ← new: is regular salary already paid for this month?
  regularAlreadyPaidAmount: number;    // ← new: how much regular already paid
  isEffectivelyAdvance: boolean;       // ← new: regular form but future month selected
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

  const [banks,      setBanks]      = useState<BankInfo[]>([]);
  const [allSalaries,setAllSalaries]= useState<Salary[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);

  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode ? 'Update Salary' : 'Save Salary';

  // Current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch banks + all salaries on mount (need salaries to check paid status)
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

  // The salary month comes from transactions[0].salaryMonth
  const salaryMonth = transactionsList[0]?.salaryMonth || '';

  // ── Advance paid for this employee in selected month ─────────────────────
  const advancePaidThisMonth = useMemo(() => {
    if (!formData.employeeId || !salaryMonth) return 0;
    return allSalaries
      .filter(s =>
        s.employeeId === formData.employeeId &&
        s.salaryMonth === salaryMonth &&
        s.subCategory === 'Advance salary' &&
        (!isEditMode || s.id !== id)  // exclude current record when editing
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

  // ── Key logic: is this regular payment effectively an advance? ────────────
  // True when:
  //   - User is on the "regular salary" form, AND
  //   - The selected salary month is AFTER the current calendar month
  //     (e.g. paying in March but selecting April = paying ahead = advance)
  const isEffectivelyAdvance = useMemo(() => {
    if (type !== 'regular' || isEditMode || !salaryMonth) return false;
    return salaryMonth > currentMonth;
  }, [type, isEditMode, salaryMonth, currentMonth]);

  // Derived subCategory — auto-switches to Advance when paying ahead
  const effectiveSubCategory: 'Employee salary' | 'Advance salary' = useMemo(() => {
    if (isEffectivelyAdvance) return 'Advance salary';
    return formData.subCategory;
  }, [isEffectivelyAdvance, formData.subCategory]);

  // Dynamic page title reflects the auto-switch
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

  // Load existing salary in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const salary = await SalaryFirebaseService.fetchSalaryById(id);
        if (!salary) { toast.error('Salary record not found'); navigate('/salary'); return; }
        setFormData({
          employeeId:  salary.employeeId || '',
          subCategory: salary.subCategory,
          date:        salary.date,
          note:        salary.note || '',
          baseSalary:  salary.baseSalary || 0,
          commission:  salary.commission || 0,
          deductions:  salary.deductions || 0,
        });
        setTransactionsList([{
          id:              salary.id,
          amount:          salary.amount,
          paidBy:          salary.paidBy,
          transactionBy:   salary.transactionBy,
          mode:            salary.mode,
          bankId:          salary.bankId || '',
          bankName:        salary.bankName,
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

  // Auto-populate base salary from employee on new regular salary
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      setFormData(prev => ({ ...prev, baseSalary: selectedEmployee.salary || 0 }));
    }
  }, [selectedEmployee, isEditMode, type]);

  // Keep transaction amount in sync with net amount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => i === 0 ? { ...t, amount: calculatedNetAmount } : t)
    );
  }, [calculatedNetAmount]);

  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setTransactionField = useCallback(
    (index: number, field: keyof SalaryTransaction, value: any) => {
      setTransactionsList(prev =>
        prev.map((t, i) => {
          if (i !== index) return t;
          const updated = { ...t, [field]: value };
          // Auto-set bankName when bankId changes
          if (field === 'bankId') {
            const bank = banks.find(b => b.id === value);
            updated.bankName = bank?.name || '';
          }
          // Clear irrelevant fields when mode changes
          if (field === 'mode') {
            if (value === 'Cash')   { updated.bankId = ''; updated.bankName = ''; updated.chequeNumber = ''; }
            if (value === 'Bank')   { updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
            if (value === 'Cheque') { updated.bankId = ''; updated.bankName = ''; }
          }
          return updated;
        })
      );
    },
    [banks]
  );

  const handleSubmit = useCallback(async () => {
    // Block paying regular salary if already fully paid for this month
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
        subCategory:     effectiveSubCategory,  // auto-switches to Advance if future month
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

        // Create linked Cash Outflow transaction
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

        // Update bank balance (salary is an outflow — deduct)
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
      navigate, type, regularAlreadyPaid, selectedEmployee, salaryMonth]);

  const handleCancel = useCallback(
    () => navigate(type === 'advance' ? '/salary/advance' : '/salary/regular'),
    [navigate, type]
  );

  return {
    formData,
    transactions: transactionsList,
    isValid:     validation.isValid,
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
    isEffectivelyAdvance,
    onFieldChange:      setField,
    onTransactionChange: setTransactionField,
    onSubmit:   handleSubmit,
    onCancel:   handleCancel,
  };
}