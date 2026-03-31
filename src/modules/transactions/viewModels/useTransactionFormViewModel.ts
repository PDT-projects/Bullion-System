// Transactions Module - Form ViewModel
// Changes:
// 1. New transactions saved with approvalStatus: 'pending_approval'
// 2. Secure approvalToken generated (UUID) and stored on the transaction
// 3. In-app notification created in Firestore after save

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Transaction, TransactionItem, COMPANIES, SUB_CATEGORIES } from '../models/types';
import { formatCurrency } from '../models/transactionsService';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

export interface UseTransactionFormViewModelReturn {
  office: string;
  date: string;
  transactionType: 'Cash Inflow' | 'Cash Outflow' | 'Loan';
  paymentMode: 'Cash' | 'Bank' | 'Cheque';
  selectedBank: string;
  chequeNumber: string;
  chequeDate: string;
  chequeBank: string;
  setChequeNumber: (v: string) => void;
  setChequeDate: (v: string) => void;
  setChequeBank: (v: string) => void;
  enableMultiple: boolean;
  transactionItems: TransactionItem[];
  transactionId: string;
  isGeneratingId: boolean;
  isEditingId: boolean;
  setTransactionId: (id: string) => void;
  setIsEditingId: (v: boolean) => void;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  currentBankBalance: number;
  remainingBalanceAfter: number;
  banks: BankInfo[];
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  setOffice: (v: string) => void;
  setDate: (v: string) => void;
  setTransactionType: (v: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => void;
  setPaymentMode: (v: 'Cash' | 'Bank' | 'Cheque') => void;
  setSelectedBank: (v: string) => void;
  setEnableMultiple: (v: boolean) => void;
  updateItem: (id: string, field: keyof TransactionItem, value: any) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  formatCurrency: (n: number) => string;
  formatDateDisplay: (d: string) => string;
  duplicateIdError: string;
  setDuplicateIdError: (msg: string) => void;
}

const emptyItem = (type: string): TransactionItem => ({
  id: Date.now().toString(),
  mainCategory: type, subCategory: '', detailCategory: '',
  amount: 0, amountPaid: 0, remainingAmount: 0,
  paymentStatus: 'Full', paidBy: '', paidTo: '', note: '',
});

/** Generate a simple secure token */
function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useTransactionFormViewModel(): UseTransactionFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [banks,            setBanks]            = useState<BankInfo[]>([]);
  const [editingTx,        setEditingTx]        = useState<Transaction | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSaving,         setIsSaving]         = useState(false);
  const [transactionId,    setTransactionId]    = useState('');
  const [isGeneratingId,   setIsGeneratingId]   = useState(true);
  const [isEditingId,      setIsEditingId]      = useState(false);
  const [duplicateIdError, setDuplicateIdError] = useState('');

  const [office,          setOffice]          = useState(COMPANIES[0].id);
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionTypeState] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  const [paymentMode,     setPaymentMode]     = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [selectedBank,    setSelectedBank]    = useState('');

  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate,   setChequeDate]   = useState('');
  const [chequeBank,   setChequeBank]   = useState('');

  const [enableMultiple,   setEnableMultiple]   = useState(false);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([emptyItem('Cash Inflow')]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const bankList = await BankFirebaseService.fetchAllBanks().catch(() => []);
        setBanks(bankList as any[]);

        if (id) {
          const tx = await TransactionFirebaseService.fetchTransactionById(id);
          if (tx) {
            setEditingTx(tx);
            setTransactionId(tx.transactionId || '');
            setIsGeneratingId(false);
            const officeId = COMPANIES.find(o => tx.company?.includes(o.name.split(':')[1]?.trim()))?.id || COMPANIES[0].id;
            setOffice(officeId);
            setDate(tx.date);
            setTransactionTypeState(tx.mainCategory as any);
            setPaymentMode(tx.mode);
            if (tx.bankId) setSelectedBank(tx.bankId);
            if (tx.chequeNumber) setChequeNumber(tx.chequeNumber);
            if (tx.chequeDate)   setChequeDate(tx.chequeDate);
            if (tx.chequeBank)   setChequeBank(tx.chequeBank || '');
            setTransactionItems([{
              id:              tx.id,
              mainCategory:    tx.mainCategory    || '',
              subCategory:     tx.subCategory     || '',
              detailCategory:  tx.detailCategory  || '',
              amount:          tx.amount          || 0,
              amountPaid:      tx.amountPaid      ?? tx.amount ?? 0,
              remainingAmount: tx.remainingAmount ?? 0,
              paymentStatus:   tx.paymentStatus   ?? 'Full',
              paidBy:          tx.paidBy          || '',
              paidTo:          tx.paidTo          || '',
              note:            tx.note            || '',
            }]);
          }
        } else {
          const now = new Date();
          const dd  = String(now.getDate()).padStart(2, '0');
          const mm  = String(now.getMonth() + 1).padStart(2, '0');
          const yy  = String(now.getFullYear()).slice(-2);
          setTransactionId(`TXN-${dd}${mm}${yy}-###`);
          setIsGeneratingId(false);
        }
      } catch {
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const setTransactionType = useCallback((type: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => {
    setTransactionTypeState(type);
    setTransactionItems(items => items.map(i => ({ ...i, mainCategory: type, subCategory: '' })));
  }, []);

  const updateItem = useCallback((itemId: string, field: keyof TransactionItem, value: any) => {
    setTransactionItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'amount' || field === 'amountPaid') {
        const amount     = field === 'amount'     ? Number(value) : item.amount;
        const amountPaid = field === 'amountPaid' ? Number(value) : item.amountPaid;
        updated.remainingAmount = Math.max(0, amount - amountPaid);
        updated.paymentStatus   = amountPaid >= amount ? 'Full' : 'Partial';
      }
      return updated;
    }));
  }, []);

  const addItem = useCallback(() =>
    setTransactionItems(p => [...p, { ...emptyItem(transactionType), id: Date.now().toString() }]),
    [transactionType]
  );

  const removeItem = useCallback((itemId: string) => {
    setTransactionItems(p => p.length > 1 ? p.filter(i => i.id !== itemId) : p);
  }, []);

  const totals = useMemo(() => {
    const totalAmount = transactionItems.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid   = transactionItems.reduce((s, i) => {
      if (transactionType === 'Cash Inflow') return s + i.amount;
      const paid = i.amountPaid > 0 ? i.amountPaid : i.amount;
      return s + paid;
    }, 0);
    return { totalAmount, totalPaid, totalRemaining: Math.max(0, totalAmount - totalPaid) };
  }, [transactionItems, transactionType]);

  const selectedBankData      = useMemo(() => banks.find(b => b.id === selectedBank), [banks, selectedBank]);
  const currentBankBalance    = selectedBankData?.balance || 0;
  const remainingBalanceAfter = currentBankBalance + (transactionType === 'Cash Inflow' ? totals.totalAmount : -totals.totalPaid);

  const validate = useCallback((): string[] => {
    const errors: string[] = [];
    if (!office) errors.push('Select an office/branch');
    if (!date)   errors.push('Select a date');
    for (const [i, item] of transactionItems.entries()) {
      const n = transactionItems.length > 1 ? ` (item ${i + 1})` : '';
      if (!item.subCategory)                errors.push(`Sub category is required${n}`);
      if (!item.amount || item.amount <= 0)  errors.push(`Amount must be greater than 0${n}`);
      if (transactionType !== 'Cash Inflow') {
        if (item.amountPaid < 0)             errors.push(`Amount paid cannot be negative${n}`);
        if (item.amountPaid > item.amount)   errors.push(`Amount paid cannot exceed total amount${n}`);
      }
    }
    if (paymentMode === 'Bank' && !selectedBank)          errors.push('Select a bank for bank transactions');
    if (paymentMode === 'Cheque' && !chequeNumber.trim()) errors.push('Enter the cheque number');
    return errors;
  }, [office, date, transactionItems, paymentMode, selectedBank, chequeNumber, transactionType]);

  const updateBankBalance = useCallback(async (bankId: string, amount: number, isInflow: boolean) => {
    try {
      const bank = banks.find(b => b.id === bankId);
      if (!bank) return;
      const newBalance = isInflow ? bank.balance + amount : bank.balance - amount;
      await BankFirebaseService.updateBankBalance(bankId, newBalance);
      setBanks(prev => prev.map(b => b.id === bankId ? { ...b, balance: newBalance } : b));
    } catch (err) {
      console.error('Failed to update bank balance:', err);
      toast.error('Transaction saved but bank balance update failed — please refresh Banking');
    }
  }, [banks]);

  const handleSave = useCallback(async () => {
    const errors = validate();
    if (errors.length > 0) { errors.forEach(e => toast.error(e)); return; }

    setIsSaving(true);
    try {
      const selectedBankInfo = banks.find(b => b.id === selectedBank);
      const now  = new Date();
      const time = now.toTimeString().split(' ')[0];

      const chequeFields = paymentMode === 'Cheque'
        ? { chequeNumber: chequeNumber || undefined, chequeDate: chequeDate || undefined, chequeBank: chequeBank || undefined }
        : {};

      if (editingTx) {
        // Editing existing — no approval change needed
        const item = transactionItems[0];
        const effectivePaid   = transactionType === 'Cash Inflow' ? item.amount : (item.amountPaid > 0 ? item.amountPaid : item.amount);
        const effectiveRemain = Math.max(0, item.amount - effectivePaid);

        await TransactionFirebaseService.updateTransaction(editingTx.id, {
          date, time,
          company:         COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
          mainCategory:    transactionType,
          subCategory:     item.subCategory,
          detailCategory:  item.detailCategory || undefined,
          amount:          item.amount,
          mode:            paymentMode,
          bankId:          paymentMode === 'Bank' ? selectedBank : undefined,
          bankName:        paymentMode === 'Bank' ? selectedBankInfo?.name : undefined,
          ...chequeFields,
          amountPaid:      effectivePaid,
          remainingAmount: effectiveRemain,
          paymentStatus:   effectiveRemain <= 0 ? 'Full' : 'Partial',
          paidBy:          item.paidBy,
          paidTo:          item.paidTo,
          note:            item.note,
        });
        toast.success('Transaction updated successfully');
      } else {
        // ── New transaction ───────────────────────────────────────────────
        const isCustomId = transactionId && !transactionId.includes('###');
        const firstTxId  = isCustomId
          ? transactionId
          : await TransactionFirebaseService.generateTransactionId();

        const alreadyExists = await TransactionFirebaseService.transactionIdExists(firstTxId);
        if (alreadyExists) {
          setDuplicateIdError(firstTxId);
          setIsSaving(false);
          return;
        }

        for (const [idx, item] of transactionItems.entries()) {
          const txId = idx === 0 ? firstTxId : await TransactionFirebaseService.generateTransactionId();

          const effectivePaid   = item.amountPaid > 0 ? item.amountPaid : item.amount;
          const effectiveRemain = Math.max(0, item.amount - effectivePaid);
          const effectiveStatus = effectiveRemain <= 0 ? 'Full' : 'Partial';

          // Generate secure token for approval email links
          const approvalToken = generateToken();

          const txData: Omit<Transaction, 'id'> = {
            transactionId:   txId,
            date, time,
            company:         COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
            mainCategory:    transactionType,
            subCategory:     item.subCategory,
            detailCategory:  item.detailCategory || undefined,
            amount:          item.amount,
            mode:            paymentMode,
            bankId:          paymentMode === 'Bank' ? selectedBank : undefined,
            bankName:        paymentMode === 'Bank' ? selectedBankInfo?.name : undefined,
            ...chequeFields,
            amountPaid:      effectivePaid,
            remainingAmount: effectiveRemain,
            paymentStatus:   effectiveStatus,
            paidBy:          item.paidBy  || undefined,
            paidTo:          item.paidTo  || undefined,
            note:            item.note    || '',
            partialPayments: [],
            totalPaid:       effectivePaid,
            isFullyCleared:  effectiveRemain <= 0,
            linkedType:      'manual',
            // ── Approval fields ──────────────────────────────────────────
            approvalStatus: 'pending_approval',
            approvalToken,
          };

          const created = await TransactionFirebaseService.createTransaction(txData);

          // Create in-app notification for pending approval
          await TransactionFirebaseService.createNotification({
            type:           'transaction_pending_approval',
            title:          '⏳ Awaiting Approval',
            message:        `Transaction ${txId} (${transactionType} — ${formatCurrency(item.amount)}) is waiting for admin approval.`,
            transactionId:  created.id,
            transactionRef: txId,
            isRead:         false,
            createdAt:      new Date().toISOString(),
          });

          // Update bank balance only after approval — skip for now on new txns
          // (bank balance updated in approval Cloud Function instead)
        }

        toast.success(
          `Transaction saved — waiting for admin approval`,
          { description: `ID: ${firstTxId}`, duration: 5000 }
        );
      }
      navigate('/transactions');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  }, [validate, editingTx, transactionItems, office, date, transactionType, paymentMode,
      selectedBank, banks, navigate, transactionId, chequeNumber, chequeDate, chequeBank, updateBankBalance]);

  const handleCancel = useCallback(() => navigate('/transactions'), [navigate]);

  const formatDateDisplay = useCallback((d: string) =>
    d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '', []
  );

  return {
    office, date, transactionType, paymentMode, selectedBank,
    chequeNumber, chequeDate, chequeBank,
    setChequeNumber, setChequeDate, setChequeBank,
    enableMultiple, transactionItems,
    transactionId, isGeneratingId, isEditingId,
    setTransactionId, setIsEditingId,
    totalAmount: totals.totalAmount,
    totalPaid:   totals.totalPaid,
    totalRemaining: totals.totalRemaining,
    currentBankBalance, remainingBalanceAfter,
    banks, isLoading, isSaving, isEditing: !!editingTx,
    setOffice, setDate, setTransactionType, setPaymentMode, setSelectedBank,
    setEnableMultiple, updateItem, addItem, removeItem,
    handleSave, handleCancel, formatCurrency, formatDateDisplay,
    duplicateIdError, setDuplicateIdError,
  };
}