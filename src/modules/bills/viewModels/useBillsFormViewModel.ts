// Bills Module - ViewModel Layer
// Create/Edit form logic
// Fixes:
// 1. Fetches real banks from Firestore (BankFirebaseService)
// 2. Saves bankId, chequeNumber, chequeDate, chequeBank to Firestore
// 3. Updates bank balance when mode = Bank
// 4. Creates a linked Cash Outflow transaction record
// 5. amountPaid field: blank = full, otherwise partial

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillTransaction, BILL_CATEGORIES, COMPANIES } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/Billsfirebaseservice';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

interface UseBillsFormViewModelReturn {
  formData: {
    company: string;
    billCategory: keyof typeof BILL_CATEGORIES;
    date: string;
    note: string;
  };
  billTransactions: BillTransaction[];
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  predefinedVendors: string[];
  companies: string[];
  banks: BankInfo[];
  setFormField: (field: string, value: any) => void;
  addBillTransaction: () => void;
  removeBillTransaction: (id: string) => void;
  updateBillTransaction: (id: string, field: keyof BillTransaction, value: any) => void;
  handleImageUpload: (id: string, file: File) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
}

export function useBillsFormViewModel(): UseBillsFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    company:      COMPANIES[0] as string,
    billCategory: 'Electricity' as keyof typeof BILL_CATEGORIES,
    date:         new Date().toISOString().split('T')[0],
    note:         '',
  });

  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([
    BillsService.getDefaultTransaction(),
  ]);

  const [banks,        setBanks]        = useState<BankInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors,       setErrors]       = useState<{ [key: string]: string }>({});

  const predefinedVendors = [
    'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
    'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
    'Office Landlord', 'Maintenance Company',
  ];

  // Load banks + existing bill (if editing)
  useEffect(() => {
    const load = async () => {
      setIsSubmitting(true);
      try {
        // Always fetch banks
        const bankList = await BankFirebaseService.fetchAllBanks().catch(() => []);
        setBanks(bankList as BankInfo[]);

        if (isEditing && id) {
          const bill = await BillsFirebaseService.fetchBillById(id);
          if (!bill) { toast.error('Bill not found'); navigate('/bills'); return; }
          setFormData({
            company:      bill.company || COMPANIES[0],
            billCategory: (bill.subCategory as keyof typeof BILL_CATEGORIES) || 'Electricity',
            date:         bill.date || new Date().toISOString().split('T')[0],
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

  const setFormField = useCallback((field: string, value: any) => {
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

      // Auto-calculate remaining when amounts change
      if (field === 'amount' || field === 'amountPaid') {
        const total = field === 'amount'    ? Number(value) : t.amount;
        const paid  = field === 'amountPaid'? Number(value) : t.amountPaid;
        updated.remainingAmount = Math.max(0, total - paid);
        updated.paymentStatus   = paid > 0 && paid < total ? 'Partial' : 'Full';
      }

      // Reset payment fields when switching mode
      if (field === 'mode') {
        if (value === 'Cash')   { updated.bankId = ''; updated.bankName = ''; updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
        if (value === 'Bank')   { updated.chequeNumber = ''; updated.chequeDate = ''; updated.chequeBank = ''; }
        if (value === 'Cheque') { updated.bankId = ''; updated.bankName = ''; }
      }

      // Set bank name automatically when bankId changes
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
        // ── EDIT ─────────────────────────────────────────────────────────────
        const txn = billTransactions[0];
        const effectivePaid    = txn.amountPaid > 0 ? txn.amountPaid : txn.amount;
        const effectiveRemain  = Math.max(0, txn.amount - effectivePaid);

        await BillsFirebaseService.updateBill(id, {
          company:         formData.company,
          date:            formData.date,
          subCategory:     formData.billCategory as any,
          note:            formData.note,
          amount:          txn.amount,
          amountPaid:      effectivePaid,
          remainingAmount: effectiveRemain,
          paymentStatus:   effectiveRemain <= 0 ? 'Full' : 'Partial',
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
        // ── CREATE ────────────────────────────────────────────────────────────
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

          // Create linked Cash Outflow transaction so it shows in Transactions module
          await TransactionFirebaseService.createTransaction({
            transactionId:   billPayload.transactionId,
            date:            formData.date,
            time:            billPayload.time,
            company:         formData.company,
            mainCategory:    'Cash Outflow',
            subCategory:     formData.billCategory,
            detailCategory:  txn.paidTo,
            amount:          txn.amount,
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

          // Update bank balance for Bank mode
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
    companies: COMPANIES as unknown as string[],
    banks,
    setFormField,
    addBillTransaction,
    removeBillTransaction,
    updateBillTransaction,
    handleImageUpload,
    handleSubmit,
    handleCancel,
    calculateTotal,
  };
}