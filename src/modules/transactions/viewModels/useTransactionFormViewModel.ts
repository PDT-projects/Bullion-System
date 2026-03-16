// Transactions Module - Form ViewModel
// Self-contained: fetches banks from Firestore, saves/updates to Firestore
// Validates thoroughly: sub-category, amount, paid-by, paid-to, bank selection

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Transaction, TransactionItem, COMPANIES, SUB_CATEGORIES } from '../models/types';
import { formatCurrency } from '../models/transactionsService';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

export interface UseTransactionFormViewModelReturn {
  // State
  office: string;
  date: string;
  transactionType: 'Cash Inflow' | 'Cash Outflow' | 'Loan';
  paymentMode: 'Cash' | 'Bank' | 'Cheque';
  selectedBank: string;
  enableMultiple: boolean;
  transactionItems: TransactionItem[];
  // Transaction ID (auto-generated, user can edit before saving)
  transactionId: string;
  isGeneratingId: boolean;
  isEditingId: boolean;
  setTransactionId: (id: string) => void;
  setIsEditingId: (v: boolean) => void;
  // Computed
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  currentBankBalance: number;
  remainingBalanceAfter: number;
  // Meta
  banks: BankInfo[];
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  // Actions
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
  // Duplicate ID error — shown as modal in the view
  duplicateIdError: string;
  setDuplicateIdError: (msg: string) => void;
}

const emptyItem = (type: string): TransactionItem => ({
  id: Date.now().toString(),
  mainCategory: type, subCategory: '', detailCategory: '',
  amount: 0, amountPaid: 0, remainingAmount: 0,
  paymentStatus: 'Full', paidBy: '', paidTo: '', note: '',
});

export function useTransactionFormViewModel(): UseTransactionFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [banks,           setBanks]           = useState<BankInfo[]>([]);
  const [editingTx,       setEditingTx]       = useState<Transaction | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSaving,        setIsSaving]        = useState(false);
  const [transactionId,   setTransactionId]   = useState('');
  const [isGeneratingId,  setIsGeneratingId]  = useState(true);
  const [isEditingId,     setIsEditingId]     = useState(false);
  const [duplicateIdError,setDuplicateIdError]= useState('');

  const [office,          setOffice]          = useState(COMPANIES[0].id);
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionTypeState] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  const [paymentMode,     setPaymentMode]     = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [selectedBank,    setSelectedBank]    = useState('');
  const [enableMultiple,  setEnableMultiple]  = useState(false);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([emptyItem('Cash Inflow')]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch banks
        const bankList = await BankFirebaseService.fetchAllBanks().catch(() => []);
        setBanks(bankList as any[]);

        // If editing, load existing transaction
        if (id) {
          const tx = await TransactionFirebaseService.fetchTransactionById(id);
          if (tx) {
            setEditingTx(tx);
            setTransactionId(tx.transactionId || '');  // show existing ID when editing
            setIsGeneratingId(false);
            const officeId = COMPANIES.find(o => tx.company?.includes(o.name.split(':')[1]?.trim()))?.id || COMPANIES[0].id;
            setOffice(officeId);
            setDate(tx.date);
            setTransactionTypeState(tx.mainCategory as any);
            setPaymentMode(tx.mode);
            if (tx.bankId) setSelectedBank(tx.bankId);
            setTransactionItems([{
              id:              tx.id,
              mainCategory:    tx.mainCategory || '',
              subCategory:     tx.subCategory  || '',
              detailCategory:  tx.detailCategory || '',
              amount:          tx.amount || 0,
              amountPaid:      tx.amountPaid ?? tx.amount ?? 0,
              remainingAmount: tx.remainingAmount ?? 0,
              paymentStatus:   tx.paymentStatus ?? 'Full',
              paidBy:          tx.paidBy  || '',
              paidTo:          tx.paidTo  || '',
              note:            tx.note    || '',
            }]);
          }
        } else {
          // New transaction — show a date-based PREVIEW (no counter increment yet).
          // The real unique ID is generated atomically at save time.
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

  const addItem    = useCallback(() => setTransactionItems(p => [...p, { ...emptyItem(transactionType), id: Date.now().toString() }]), [transactionType]);
  const removeItem = useCallback((itemId: string) => {
    setTransactionItems(p => p.length > 1 ? p.filter(i => i.id !== itemId) : p);
  }, []);

  const totals = useMemo(() => {
    const totalAmount    = transactionItems.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid      = transactionItems.reduce((s, i) => s + (i.amountPaid || 0), 0);
    return { totalAmount, totalPaid, totalRemaining: totalAmount - totalPaid };
  }, [transactionItems]);

  const selectedBankData    = useMemo(() => banks.find(b => b.id === selectedBank), [banks, selectedBank]);
  const currentBankBalance  = selectedBankData?.balance || 0;
  const remainingBalanceAfter = currentBankBalance + (transactionType === 'Cash Inflow' ? totals.totalPaid : -totals.totalPaid);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = useCallback((): string[] => {
    const errors: string[] = [];

    if (!office) errors.push('Select an office/branch');
    if (!date)   errors.push('Select a date');

    for (const [i, item] of transactionItems.entries()) {
      const n = transactionItems.length > 1 ? ` (item ${i + 1})` : '';
      if (!item.subCategory)               errors.push(`Sub category is required${n}`);
      if (!item.amount || item.amount <= 0) errors.push(`Amount must be greater than 0${n}`);
      if (item.amountPaid < 0)             errors.push(`Amount paid cannot be negative${n}`);
      if (item.amountPaid > item.amount)   errors.push(`Amount paid (${item.amountPaid}) cannot exceed total amount (${item.amount})${n}`);
      // paidBy / paidTo are optional — don't block save
    }

    if (paymentMode === 'Bank' && !selectedBank) {
      errors.push('Select a bank for bank transactions');
    }

    return errors;
  }, [office, date, transactionItems, paymentMode, selectedBank]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const errors = validate();
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }

    setIsSaving(true);
    try {
      const selectedBankData = banks.find(b => b.id === selectedBank);
      const now  = new Date();
      const time = now.toTimeString().split(' ')[0];

      if (editingTx) {
        // ── EDIT: update fields but NEVER change the transactionId ───────────
        const item = transactionItems[0];
        await TransactionFirebaseService.updateTransaction(editingTx.id, {
          date, time,
          company:      COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
          mainCategory: transactionType,
          subCategory:  item.subCategory,
          detailCategory: item.detailCategory || undefined,
          amount:       item.amount,
          mode:         paymentMode,
          bankId:       paymentMode === 'Bank' ? selectedBank : undefined,
          bankName:     paymentMode === 'Bank' ? selectedBankData?.name : undefined,
          amountPaid:   item.amountPaid,
          remainingAmount: item.remainingAmount,
          paymentStatus: item.paymentStatus,
          paidBy:       item.paidBy,
          paidTo:       item.paidTo,
          note:         item.note,
        });
        toast.success('Transaction updated successfully');
      } else {
        // ── CREATE: one Firestore doc per item ───────────────────────────────
        const isCustomId = transactionId && !transactionId.includes('###');

        // Resolve the actual ID to use for the first item
        const firstTxId = isCustomId
          ? transactionId
          : await TransactionFirebaseService.generateTransactionId();

        // Always check uniqueness — even auto-generated IDs could collide
        // if the counter doc was ever reset or if a fallback timestamp was used
        const alreadyExists = await TransactionFirebaseService.transactionIdExists(firstTxId);
        if (alreadyExists) {
          setDuplicateIdError(firstTxId);
          setIsSaving(false);
          return;
        }

        for (const [idx, item] of transactionItems.entries()) {
          const txId = idx === 0
            ? firstTxId
            : await TransactionFirebaseService.generateTransactionId();

          // If user left amountPaid blank/0, treat as full payment
          const effectiveAmountPaid    = item.amountPaid > 0 ? item.amountPaid : item.amount;
          const effectiveRemaining     = Math.max(0, item.amount - effectiveAmountPaid);
          const effectivePaymentStatus = effectiveRemaining <= 0 ? 'Full' : 'Partial';

          const txData: Omit<Transaction, 'id'> = {
            transactionId:   txId,
            date, time,
            company:         COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
            mainCategory:    transactionType,
            subCategory:     item.subCategory,
            detailCategory:  item.detailCategory || undefined,
            amount:          item.amount,
            mode:            paymentMode,
            bankId:          paymentMode === 'Bank' ? selectedBank        : undefined,
            bankName:        paymentMode === 'Bank' ? selectedBankData?.name : undefined,
            amountPaid:      effectiveAmountPaid,
            remainingAmount: effectiveRemaining,
            paymentStatus:   effectivePaymentStatus,
            paidBy:          item.paidBy  || undefined,
            paidTo:          item.paidTo  || undefined,
            note:            item.note    || '',
            partialPayments: [],
            totalPaid:       effectiveAmountPaid,
            isFullyCleared:  effectiveRemaining <= 0,
            linkedType:      'manual',
          };
          await TransactionFirebaseService.createTransaction(txData);
        }
        toast.success(`${transactionItems.length > 1 ? transactionItems.length + ' transactions' : 'Transaction'} saved — ID: ${transactionId}`);
      }

      navigate('/transactions');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  }, [validate, editingTx, transactionItems, office, date, transactionType, paymentMode, selectedBank, banks, navigate, transactionId]);

  const handleCancel = useCallback(() => navigate('/transactions'), [navigate]);

  const formatDateDisplay = useCallback((d: string) =>
    d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '', []
  );

  return {
    office, date, transactionType, paymentMode, selectedBank,
    enableMultiple, transactionItems,
    transactionId, isGeneratingId, isEditingId,
    setTransactionId, setIsEditingId,
    totalAmount: totals.totalAmount,
    totalPaid: totals.totalPaid,
    totalRemaining: totals.totalRemaining,
    currentBankBalance, remainingBalanceAfter,
    banks, isLoading, isSaving, isEditing: !!editingTx,
    setOffice, setDate, setTransactionType, setPaymentMode, setSelectedBank,
    setEnableMultiple, updateItem, addItem, removeItem,
    handleSave, handleCancel, formatCurrency, formatDateDisplay,
    duplicateIdError, setDuplicateIdError,
  };
}