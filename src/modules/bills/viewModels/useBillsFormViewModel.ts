// Bills Module - ViewModel Layer
// Changes:
// 1. Date is locked to today (auto-set, not user-editable) — same as Transactions
// 2. Dynamic bill categories: fetches from Firestore + allows adding new ones inline
// 3. All existing fixes retained (bank balance, linked transaction, cheque fields)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillTransaction, BILL_CATEGORIES } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/Billsfirebaseservice';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';
import { fetchCurrencyRates, CURRENCY_RATE_FALLBACK } from '../../invoices/models/invoiceService';

interface BankInfo { id: string; name: string; balance: number; }

interface BranchInfo { id: string; name: string; }

// Dynamic category stored in Firestore (reuse same collection as transactions)
interface DynamicBillCategory {
  id: string;
  name: string;
  createdAt: string;
}

// Default branches (shown if none exist in Firestore)
const DEFAULT_BRANCHES: BranchInfo[] = [
  { id: '__default_sa__',    name: 'Saudi Arabia' },
  { id: '__default_sd__',    name: 'Sudan' },
  { id: '__default_dxb__',   name: 'Dubai' },
  { id: '__default_chad__',  name: 'Chad' },
];

interface UseBillsFormViewModelReturn {
  formData: {
    company: string;
    billCategory: string;
    date: string;          // read-only display
    note: string;
  };
  billTransactions: BillTransaction[];
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  predefinedVendors: string[];
  branches: BranchInfo[];
  banks: BankInfo[];
  // Dynamic category support
  allBillCategories: string[];
  onAddBillCategory: (name: string) => Promise<string | null>;
  // Dynamic branch support
  onAddBranch: (name: string) => Promise<string | null>;
  setFormField: (field: string, value: any) => void;
  addBillTransaction: () => void;
  removeBillTransaction: (id: string) => void;
  updateBillTransaction: (id: string, field: keyof BillTransaction, value: any) => void;
  handleImageUpload: (id: string, file: File) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
  // Currency
  currencyRates: Record<string, number>;
}

const BASE_CATEGORIES = Object.keys(BILL_CATEGORIES);

export function useBillsFormViewModel(): UseBillsFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const isEditing = !!id;

  // Date is always today — locked, not user-editable
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    company:      DEFAULT_BRANCHES[0].name,
    billCategory: 'Electricity' as string,
    date:         todayStr,
    note:         '',
  });

  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([
    BillsService.getDefaultTransaction(),
  ]);

  const [banks,              setBanks]              = useState<BankInfo[]>([]);
  const [branches,           setBranches]           = useState<BranchInfo[]>(DEFAULT_BRANCHES);
  const [dynamicCategories,  setDynamicCategories]  = useState<DynamicBillCategory[]>([]);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [errors,             setErrors]             = useState<{ [key: string]: string }>({});
  const [currencyRates,      setCurrencyRates]      = useState<Record<string, number>>(CURRENCY_RATE_FALLBACK as any);

  const predefinedVendors = [
    'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
    'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
    'Office Landlord', 'Maintenance Company',
  ];

  // Combined category list: base + dynamic (deduplicated)
  const allBillCategories = [
    ...BASE_CATEGORIES,
    ...dynamicCategories
      .map(d => d.name)
      .filter(name => !BASE_CATEGORIES.includes(name)),
  ];

  useEffect(() => {
    const load = async () => {
      setIsSubmitting(true);
      try {
        const [bankList, dynCats, branchList] = await Promise.all([
          BankFirebaseService.fetchAllBanks().catch(() => []),
          TransactionFirebaseService.fetchDynamicCategories().catch(() => []),
          BillsFirebaseService.fetchAllBranches().catch(() => []),
        ]);
        setBanks(bankList as BankInfo[]);

        // Fetch live currency rates (non-blocking — falls back to static rates on error)
        fetchCurrencyRates().then(rates => {
          if (rates) setCurrencyRates(rates as any);
        }).catch(() => {/* silently use fallback */});

        // Filter only bill-category type entries
        const billDynCats = (dynCats as any[])
          .filter(d => d.type === 'billCategory')
          .map(d => ({ id: d.id, name: d.name, createdAt: d.createdAt }));
        setDynamicCategories(billDynCats);

        // Merge default branches with any Firestore-saved ones, deduplicated by name
        const savedBranches = branchList as BranchInfo[];
        const combined = [...DEFAULT_BRANCHES, ...savedBranches].filter(
          (b, i, arr) => arr.findIndex(x => x.name.toLowerCase() === b.name.toLowerCase()) === i
        );
        setBranches(combined);

        if (isEditing && id) {
          const bill = await BillsFirebaseService.fetchBillById(id);
          if (!bill) { toast.error('Bill not found'); navigate('/bills'); return; }
          setFormData({
            company:      bill.company || DEFAULT_BRANCHES[0].name,
            billCategory: bill.subCategory || 'Electricity',
            date:         bill.date || todayStr,
            note:         bill.note || '',
          });
          setBillTransactions([{
            id:              bill.id,
            amount:          bill.amount || 0,
            amountPaid:      bill.amountPaid ?? bill.amount ?? 0,
            remainingAmount: bill.remainingAmount || 0,
            paidBy:          bill.paidBy || '',
            paidTo:          bill.paidTo || '',
            transactionBy:   bill.transactionBy || '',
            mode:            bill.mode || 'Cash',
            bankId:          bill.bankId || '',
            bankName:        bill.bankName || '',
            chequeNumber:    bill.chequeNumber || '',
            chequeDate:      bill.chequeDate || '',
            chequeBank:      bill.chequeBank || '',
            imageUrl:        bill.imageUrl || '',
            paymentStatus:   bill.paymentStatus || 'Full',
            billMonth:       bill.billMonth || new Date().toISOString().slice(0, 7),
          }]);
        }
      } catch {
        toast.error('Failed to load form data');
      } finally {
        setIsSubmitting(false);
      }
    };
    load();
  }, [isEditing, id, navigate]);

  // Add a new dynamic bill category to Firestore
  const onAddBillCategory = useCallback(async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (allBillCategories.includes(trimmed)) {
      toast.error('Category already exists');
      return null;
    }
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:           'billCategory',
        parentCategory: 'Bills',
        name:           trimmed,
      });
      setDynamicCategories(prev => [...prev, { id: created.id, name: trimmed, createdAt: created.createdAt }]);
      toast.success(`Category "${trimmed}" added`);
      return trimmed;
    } catch {
      toast.error('Failed to add category');
      return null;
    }
  }, [allBillCategories]);

  // Add a new branch to Firestore
  const onAddBranch = useCallback(async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (branches.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Branch already exists');
      return null;
    }
    try {
      const created = await BillsFirebaseService.createBranch(trimmed);
      setBranches(prev => [...prev, { id: created.id, name: created.name }]);
      toast.success(`Branch "${trimmed}" added`);
      return trimmed;
    } catch {
      toast.error('Failed to add branch');
      return null;
    }
  }, [branches]);

  const setFormField = useCallback((field: string, value: any) => {
    // Prevent changing the date field — it is locked
    if (field === 'date') return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, [errors]);

  const addBillTransaction = useCallback(() => {
    setBillTransactions(prev => [...prev, BillsService.getDefaultTransaction()]);
  }, []);

  const removeBillTransaction = useCallback((txnId: string) => {
    setBillTransactions(prev => prev.length > 1 ? prev.filter(t => t.id !== txnId) : prev);
  }, []);

  const updateBillTransaction = useCallback((txnId: string, field: keyof BillTransaction, value: any) => {
    setBillTransactions(prev => prev.map(t => {
      if (t.id !== txnId) return t;
      const updated = { ...t, [field]: value };

      if (field === 'amount' || field === 'amountPaid') {
        const total = field === 'amount'     ? Number(value) : t.amount;
        const paid  = field === 'amountPaid' ? Number(value) : t.amountPaid;
        updated.remainingAmount = Math.max(0, total - paid);
        updated.paymentStatus   = paid > 0 && paid < total ? 'Partial' : 'Full';
      }

      if (field === 'mode') {
        if (value === 'Cash')   { updated.bankId = ''; updated.bankName = ''; updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
        if (value === 'Bank')   { updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
        if (value === 'Cheque') { updated.bankId = ''; updated.bankName = ''; }
      }

      if (field === 'bankId') {
        const bank = banks.find(b => b.id === value);
        updated.bankName = bank?.name || '';
      }

      return updated;
    }));
  }, [banks]);

  const handleImageUpload = useCallback((txnId: string, file: File) => {
    if (!file.type.match(/image\/(jpg|jpeg|png)/)) { toast.error('Upload JPG or PNG only'); return; }
    const reader = new FileReader();
    reader.onloadend = () => updateBillTransaction(txnId, 'imageUrl', reader.result as string);
    reader.readAsDataURL(file);
  }, [updateBillTransaction]);

  const calculateTotal = useCallback(
    () => billTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    [billTransactions]
  );

  const handleSubmit = useCallback(async () => {
    const validation = BillsService.validateBill(
      { company: formData.company, date: formData.date, subCategory: formData.billCategory as any },
      billTransactions
    );
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        const txn = billTransactions[0];
        const effectivePaid   = txn.amountPaid > 0 ? txn.amountPaid : txn.amount;
        const effectiveRemain = Math.max(0, txn.amount - effectivePaid);

        await BillsFirebaseService.updateBill(id, {
          company:         formData.company,
          date:            formData.date,
          subCategory:     formData.billCategory as any,
          note:            formData.note,
          amount:          txn.amount,
          amountPaid:      effectivePaid,
          remainingAmount: effectiveRemain,
          paymentStatus:   effectiveRemain <= 0 ? 'Full' : 'Partial',
          currency:        'AED',
          mode:            txn.mode,
          bankId:          txn.mode === 'Bank'   ? txn.bankId       : undefined,
          bankName:        txn.mode === 'Bank'   ? txn.bankName     : undefined,
          chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber : undefined,
          chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate   : undefined,
          chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank   : undefined,
          paidBy:          txn.paidBy,
          paidTo:          txn.paidTo,
          transactionBy:   txn.transactionBy,
          billMonth:       txn.billMonth,
          imageUrl:        txn.imageUrl,
        });
        toast.success('Bill updated successfully');
      } else {
        for (const txn of billTransactions) {
          const effectivePaid   = txn.amountPaid > 0 ? txn.amountPaid : txn.amount;
          const effectiveRemain = Math.max(0, txn.amount - effectivePaid);
          const effectiveStatus: 'Full' | 'Partial' = effectiveRemain <= 0 ? 'Full' : 'Partial';

          const billPayload: Omit<Bill, 'id'> = {
            transactionId:   `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            date:            formData.date,
            time:            new Date().toTimeString().split(' ')[0],
            company:         formData.company,
            mainCategory:    'Bills',
            subCategory:     formData.billCategory as any,
            amount:          txn.amount,
            amountPaid:      effectivePaid,
            remainingAmount: effectiveRemain,
            paymentStatus:   effectiveStatus,
            currency:        'AED',
            mode:            txn.mode,
            bankId:          txn.mode === 'Bank'   ? txn.bankId       : undefined,
            bankName:        txn.mode === 'Bank'   ? txn.bankName     : '',
            chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber : undefined,
            chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate   : undefined,
            chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank   : undefined,
            paidBy:          txn.paidBy,
            paidTo:          txn.paidTo,
            transactionBy:   txn.transactionBy || '',
            billMonth:       txn.billMonth,
            note:            formData.note || '',
            imageUrl:        txn.imageUrl || '',
          };

          await BillsFirebaseService.createBill(billPayload);

          // Also create linked Cash Outflow transaction
          await TransactionFirebaseService.createTransaction({
            transactionId:   billPayload.transactionId,
            date:            formData.date,
            time:            billPayload.time,
            company:         formData.company,
            mainCategory:    'Cash Outflow',
            subCategory:     formData.billCategory,
            detailCategory:  txn.paidTo,
            amount:          txn.amount,
            currency:        'AED',
            mode:            txn.mode,
            bankId:          txn.mode === 'Bank'   ? txn.bankId       : undefined,
            bankName:        txn.mode === 'Bank'   ? txn.bankName     : undefined,
            chequeNumber:    txn.mode === 'Cheque' ? txn.chequeNumber : undefined,
            chequeDate:      txn.mode === 'Cheque' ? txn.chequeDate   : undefined,
            chequeBank:      txn.mode === 'Cheque' ? txn.chequeBank   : undefined,
            amountPaid:      effectivePaid,
            remainingAmount: effectiveRemain,
            paymentStatus:   effectiveStatus,
            paidBy:          txn.paidBy,
            paidTo:          txn.paidTo,
            note:            formData.note || '',
            partialPayments: [],
            totalPaid:       effectivePaid,
            isFullyCleared:  effectiveRemain <= 0,
            linkedType:      'bill',
            linkedRef:       `${formData.billCategory} — ${txn.billMonth}`,
          });

          if (txn.mode === 'Bank' && txn.bankId) {
            const bank = banks.find(b => b.id === txn.bankId);
            if (bank) {
              const newBalance = bank.balance - effectivePaid;
              await BankFirebaseService.updateBankBalance(txn.bankId, newBalance);
              setBanks(prev => prev.map(b => b.id === txn.bankId ? { ...b, balance: newBalance } : b));
            }
          }
        }
        toast.success(`${billTransactions.length} bill(s) saved successfully`);
      }
      navigate('/bills');
    } catch (err) {
      console.error('Error saving bill:', err);
      toast.error('Failed to save bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, billTransactions, isEditing, id, navigate, banks]);

  const handleCancel = useCallback(() => navigate('/bills'), [navigate]);

  return {
    formData,
    billTransactions,
    isEditing,
    isSubmitting,
    errors,
    predefinedVendors,
    branches,
    banks,
    allBillCategories,
    onAddBillCategory,
    onAddBranch,
    setFormField,
    addBillTransaction,
    removeBillTransaction,
    updateBillTransaction,
    handleImageUpload,
    handleSubmit,
    handleCancel,
    calculateTotal,
    currencyRates,
  };
}