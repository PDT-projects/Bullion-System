// Transactions Module - Form ViewModel
// Approval rules:
//   Cash Inflow  → approvalStatus: 'not_required'  (notification email only, no approval)
//   Cash Outflow → approvalStatus: 'pending_approval' (approval email with Approve/Reject)
//   Loan (given) → approvalStatus: 'pending_approval' (approval email with Approve/Reject)
//   Loan (received) → approvalStatus: 'not_required' (notification email only)

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Transaction, TransactionItem, COMPANIES, SUB_CATEGORIES, DynamicCategory, PLMainCategory, BSMainCategory, Company } from '../models/types';
import { formatCurrency } from '../models/transactionsService';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

// ── Currency support ─────────────────────────────────────────────────────────
export type SupportedCurrency = 'PKR' | 'AED' | 'CAD' | 'SAR';

export interface CurrencyOption {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'PKR', name: 'Pakistani Rupee',   symbol: '₨',  flag: '🇵🇰' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$', flag: '🇨🇦' },
  { code: 'SAR', name: 'Saudi Riyal',        symbol: '﷼',  flag: '🇸🇦' },
];

export function formatCurrencyWithCode(amount: number, currency: SupportedCurrency): string {
  const opt = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const sym = opt?.symbol ?? currency;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${sym} ${formatted}`;
}
// ─────────────────────────────────────────────────────────────────────────────

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
  // Profit & Loss
  plMainCategory: PLMainCategory | '';
  plSubCategory: string;
  setPlMainCategory: (v: PLMainCategory | '') => void;
  setPlSubCategory: (v: string) => void;
  // Balance Sheet
  bsMainCategory: BSMainCategory | '';
  bsSubCategory: string;
  setBsMainCategory: (v: BSMainCategory | '') => void;
  setBsSubCategory: (v: string) => void;
  // Dynamic categories (transaction)
  dynamicSubCategories: DynamicCategory[];
  onAddSubCategory: (parentCategory: string, name: string) => Promise<string | null>;
  onDeleteSubCategory: (id: string) => Promise<void>;
  // Dynamic categories (P&L)
  dynamicPLCategories: DynamicCategory[];
  onAddPLMainCategory: (name: string) => Promise<string | null>;
  onAddPLSubCategory: (parentCategory: string, name: string) => Promise<string | null>;
  onDeletePLCategory: (id: string) => Promise<void>;
  // Dynamic categories (Balance Sheet)
  dynamicBSCategories: DynamicCategory[];
  onAddBSMainCategory: (name: string) => Promise<string | null>;
  onAddBSSubCategory: (parentCategory: string, name: string) => Promise<string | null>;
  onDeleteBSCategory: (id: string) => Promise<void>;
  // Companies / Branches
  companies: Company[];
  onAddCompany: (name: string) => Promise<string | null>;
  // Currency
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  currencyOptions: CurrencyOption[];
}

const emptyItem = (type: string): TransactionItem => ({
  id: Date.now().toString(),
  mainCategory: type, subCategory: '', detailCategory: '',
  amount: 0, amountPaid: 0, remainingAmount: 0,
  paymentStatus: 'Full', paidBy: '', paidTo: '', note: '',
});

/** Generate a secure random token for approval email links */
function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Determine whether a transaction needs admin approval.
 *
 * Rules:
 *  - Cash Outflow            → always needs approval
 *  - Loan (given/payable)    → needs approval  (loan given out = money leaving)
 *  - Cash Inflow             → NO approval needed (money coming in)
 *  - Loan (received)         → NO approval needed (money coming in)
 */
const LOAN_GIVEN_SUB_CATEGORIES = new Set([
  'Loan given',
  'Official Loan',
  'Personal loan',
  'Other loan - Full',
  'Other loan - Partial',
  'Loan paid to employee',
]);

function requiresApproval(
  mainCategory: 'Cash Inflow' | 'Cash Outflow' | 'Loan',
  subCategory: string
): boolean {
  if (mainCategory === 'Cash Outflow') return true;
  if (mainCategory === 'Loan' && LOAN_GIVEN_SUB_CATEGORIES.has(subCategory)) return true;
  return false; // Cash Inflow and Loan received → no approval
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

  const [office,          setOffice]               = useState(COMPANIES[0].id);
  const [date,            setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionTypeState] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  const [paymentMode,     setPaymentMode]          = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [selectedBank,    setSelectedBank]         = useState('');

  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate,   setChequeDate]   = useState('');
  const [chequeBank,   setChequeBank]   = useState('');

  // Currency state — default to PKR
  const [currency, setCurrency] = useState<SupportedCurrency>('PKR');

  const [enableMultiple,       setEnableMultiple]       = useState(false);
  const [transactionItems,     setTransactionItems]     = useState<TransactionItem[]>([emptyItem('Cash Inflow')]);
  const [dynamicSubCategories, setDynamicSubCategories] = useState<DynamicCategory[]>([]);
  const [dynamicPLCategories,  setDynamicPLCategories]  = useState<DynamicCategory[]>([]);
  const [dynamicBSCategories,  setDynamicBSCategories]  = useState<DynamicCategory[]>([]);
  const [plMainCategory,       setPlMainCategoryState]  = useState<PLMainCategory | ''>('');
  const [plSubCategory,        setPlSubCategory]        = useState('');
  const [bsMainCategory,       setBsMainCategoryState]  = useState<BSMainCategory | ''>('');
  const [bsSubCategory,        setBsSubCategory]        = useState('');
  // Companies / Branches — merged from static seed + Firestore
  const [companies, setCompanies] = useState<Company[]>(
    COMPANIES.map(c => ({ ...c, createdAt: 'static' }))
  );

  // ── Load banks + existing transaction (edit mode) ──────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const bankList = await BankFirebaseService.fetchAllBanks().catch(() => []);
        setBanks(bankList as any[]);

        // Load user-added dynamic categories
        const dynCats = await TransactionFirebaseService.fetchDynamicCategories().catch(() => []);
        setDynamicSubCategories(dynCats.filter(d => d.type === 'subCategory' || d.type === 'mainCategory'));
        setDynamicPLCategories(dynCats.filter(d => d.type === 'plMainCategory' || d.type === 'plSubCategory'));
        setDynamicBSCategories(dynCats.filter(d => d.type === 'bsMainCategory' || d.type === 'bsSubCategory'));

        // Load companies from Firestore and merge with static seed
        const firestoreCompanies = await TransactionFirebaseService.fetchCompanies().catch(() => []);
        setCompanies(prev => {
          const merged = [...prev];
          firestoreCompanies.forEach(fc => {
            if (!merged.find(m => m.id === fc.id)) {
              merged.push(fc);
            }
          });
          return merged;
        });

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
            if (tx.bankId)       setSelectedBank(tx.bankId);
            if (tx.chequeNumber) setChequeNumber(tx.chequeNumber);
            if (tx.chequeDate)   setChequeDate(tx.chequeDate);
            if (tx.chequeBank)   setChequeBank(tx.chequeBank || '');
            if (tx.plMainCategory) setPlMainCategoryState(tx.plMainCategory);
            if (tx.plSubCategory)  setPlSubCategory(tx.plSubCategory);
            if (tx.bsMainCategory) setBsMainCategoryState(tx.bsMainCategory);
            if (tx.bsSubCategory)  setBsSubCategory(tx.bsSubCategory);
            // Restore saved currency if present
            if ((tx as any).currency && SUPPORTED_CURRENCIES.find(c => c.code === (tx as any).currency)) {
              setCurrency((tx as any).currency as SupportedCurrency);
            }
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

  const setPlMainCategory = useCallback((v: PLMainCategory | '') => {
    setPlMainCategoryState(v);
    setPlSubCategory('');
  }, []);

  const setBsMainCategory = useCallback((v: BSMainCategory | '') => {
    setBsMainCategoryState(v);
    setBsSubCategory('');
  }, []);

// NEW: Classification suggestion mappings
interface ClassificationSuggestion {
  plMain?: PLMainCategory;
  plSub?: string;
  bsMain?: BSMainCategory;
  bsSub?: string;
}

const getSuggestedClassification = (
  mainCategory: 'Cash Inflow' | 'Cash Outflow' | 'Loan',
  subCategory: string
): ClassificationSuggestion | null => {
  const sub = subCategory.toLowerCase();
  
  // P&L Revenue (Cash Inflow - sales)
  if (mainCategory === 'Cash Inflow') {
    if (sub.includes('sale') || sub.includes('payment received')) {
      return { plMain: 'Revenue', plSub: 'Service / Invoice Sales' };
    }
    if (sub.includes('commission')) {
      return { plMain: 'Revenue', plSub: 'Service Income' };
    }
  }
  
  // P&L COGS (Purchases)
  if (sub === 'purchase') {
    return { plMain: 'Cost of Goods Sold (COGS)', plSub: 'Purchase & Inventory' };
  }
  
  // P&L OpEx (Salaries, Utilities, Rent)
  if (mainCategory === 'Cash Outflow') {
    if (sub.includes('salary') || sub.includes('commission paid')) {
      return { plMain: 'Operating Expenses', plSub: 'Salaries & Wages' };
    }
    if (sub.includes('rent') || sub.includes('electricity') || sub.includes('gas') || sub.includes('internet')) {
      return { plMain: 'Operating Expenses', plSub: 'Utilities' };
    }
    if (sub.includes('office rent')) {
      return { plMain: 'Operating Expenses', plSub: 'Rent' };
    }
  }
  
  // BS Assets (Inventory, Receivables)
  if (sub === 'purchase') {
    return { bsMain: 'Assets', bsSub: 'Inventory' };
  }
  if (mainCategory === 'Cash Inflow' && !sub.includes('loan')) {
    return { bsMain: 'Assets', bsSub: 'Cash & Cash Equivalents' };
  }
  
  // BS Liabilities (Payables, Loans)
  if (mainCategory === 'Cash Outflow' && (sub.includes('payment to') || sub.includes('loan paid'))) {
    return { bsMain: 'Liabilities & Equity', bsSub: 'Accounts Payable' };
  }
  
  return null;
};

  const updateItem = useCallback((itemId: string, field: keyof TransactionItem, value: any) => {
    setTransactionItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      
      // NEW: Auto-suggest classification on subCategory change
      if (field === 'subCategory' && value && !plMainCategory && !bsMainCategory) {
        const suggestion = getSuggestedClassification(transactionType, value as string);
        if (suggestion) {
          if (suggestion.plMain) {
            setPlMainCategoryState(suggestion.plMain);
            if (suggestion.plSub) setPlSubCategory(suggestion.plSub);
          } else if (suggestion.bsMain) {
            setBsMainCategoryState(suggestion.bsMain);
            if (suggestion.bsSub) setBsSubCategory(suggestion.bsSub);
          }
          toast.message('💡 Suggested classification applied (edit if needed)');
        }
      }
      
      if (field === 'amount' || field === 'amountPaid') {
        const amount     = field === 'amount'     ? Number(value) : item.amount;
        const amountPaid = field === 'amountPaid' ? Number(value) : item.amountPaid;
        // Blank / zero amountPaid means fully paid — only mark Partial when a
        // specific partial amount has been explicitly entered (> 0 and < total).
        const isExplicitPartial = amountPaid > 0 && amountPaid < amount;
        updated.remainingAmount = isExplicitPartial ? amount - amountPaid : 0;
        updated.paymentStatus   = isExplicitPartial ? 'Partial' : 'Full';
      }
      return updated;
    }));
  }, [transactionType, plMainCategory, bsMainCategory]);

  const addItem = useCallback(() =>
    setTransactionItems(p => [...p, { ...emptyItem(transactionType), id: Date.now().toString() }]),
  [transactionType]);

  const removeItem = useCallback((itemId: string) =>
    setTransactionItems(p => p.filter(i => i.id !== itemId)),
  []);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    totalAmount:    transactionItems.reduce((s, i) => s + (i.amount || 0), 0),
    totalPaid:      transactionItems.reduce((s, i) => s + (i.amountPaid || 0), 0),
    totalRemaining: transactionItems.reduce((s, i) => s + (i.remainingAmount || 0), 0),
  }), [transactionItems]);

  const currentBankBalance = useMemo(() =>
    banks.find(b => b.id === selectedBank)?.balance ?? 0,
  [banks, selectedBank]);

  const remainingBalanceAfter = useMemo(() => {
    if (paymentMode !== 'Bank' || !selectedBank) return currentBankBalance;
    return transactionType === 'Cash Inflow'
      ? currentBankBalance + totals.totalAmount
      : currentBankBalance - totals.totalAmount;
  }, [currentBankBalance, totals.totalAmount, transactionType, paymentMode, selectedBank]);

  // ── Currency-aware formatter ────────────────────────────────────────────────
  const formatCurrencyLocal = useCallback(
    (n: number) => formatCurrencyWithCode(n, currency),
    [currency]
  );

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
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
    if (paymentMode === 'Bank'   && !selectedBank)          errors.push('Select a bank for bank transactions');
    if (paymentMode === 'Cheque' && !chequeNumber.trim())   errors.push('Enter the cheque number');
    // ── Classification: at least one of P&L or BS must be set ─────────────
    const hasClassification = (plMainCategory && plSubCategory) || (bsMainCategory && bsSubCategory);
    if (!hasClassification) {
      errors.push('Classification required: select at least a P&L category or a Balance Sheet category (with sub-category)');
    }
    return errors;
  }, [office, date, transactionItems, paymentMode, selectedBank, chequeNumber, transactionType, plMainCategory, plSubCategory, bsMainCategory, bsSubCategory]);

  const updateBankBalance = useCallback(async (bankId: string, amount: number, isInflow: boolean) => {
    if (!bankId) return;
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return;
    const newBalance = isInflow ? bank.balance + amount : bank.balance - amount;
    await BankFirebaseService.updateBankBalance(bankId, newBalance);
    setBanks(prev => prev.map(b => b.id === bankId ? { ...b, balance: newBalance } : b));
  }, [banks]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const errors = validate();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setIsSaving(true);
    try {
      const isInflow = transactionType === 'Cash Inflow';
      let firstTxId  = '';
      let needsApprovalFirst = false;

      if (editingTx) {
        // ── Edit mode ─────────────────────────────────────────────────────
        const item = transactionItems[0];
        const updatedData: Partial<Transaction> = {
          mainCategory:    transactionType,
          subCategory:     item.subCategory,
          detailCategory:  item.detailCategory,
          amount:          item.amount,
          amountPaid:      item.amountPaid,
          remainingAmount: item.remainingAmount,
          paymentStatus:   item.paymentStatus,
          paidBy:          item.paidBy,
          paidTo:          item.paidTo,
          note:            item.note,
          mode:            paymentMode,
          bankId:          paymentMode === 'Bank' ? selectedBank : undefined,
          chequeNumber:    paymentMode === 'Cheque' ? chequeNumber : undefined,
          chequeDate:      paymentMode === 'Cheque' ? chequeDate   : undefined,
          chequeBank:      paymentMode === 'Cheque' ? chequeBank   : undefined,
          plMainCategory,  plSubCategory,
          bsMainCategory,  bsSubCategory,
          currency,
        };
        await TransactionFirebaseService.updateTransaction(editingTx.id, updatedData);
        firstTxId = editingTx.transactionId || editingTx.id;

        if (paymentMode === 'Bank') {
          await updateBankBalance(selectedBank, item.amount, isInflow);
        }
      } else {
        // ── Create mode ───────────────────────────────────────────────────
        for (const [idx, item] of transactionItems.entries()) {
          const needs = requiresApproval(transactionType, item.subCategory);
          if (idx === 0) needsApprovalFirst = needs;

          // Resolve sequential ID
          let resolvedId = transactionId;
          if (resolvedId.includes('###')) {
            resolvedId = await TransactionFirebaseService.getNextTransactionId(resolvedId);
          }
          if (idx > 0) {
            resolvedId = await TransactionFirebaseService.getNextTransactionId(
              `TXN-${String(new Date().getDate()).padStart(2,'0')}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getFullYear()).slice(-2)}-###`
            );
          }

          // Check for duplicate
          const exists = await TransactionFirebaseService.transactionIdExists(resolvedId);
          if (exists) {
            setDuplicateIdError(resolvedId);
            setIsSaving(false);
            return;
          }

          const token          = generateToken();
          const approvalStatus = needs ? 'pending_approval' : 'not_required';
          const officeObj      = companies.find(c => c.id === office);
          const companyName    = officeObj ? officeObj.name : office;

          const txData: Omit<Transaction, 'id'> = {
            transactionId:   resolvedId,
            date,
            time:            new Date().toTimeString().slice(0, 5),
            mainCategory:    transactionType,
            subCategory:     item.subCategory,
            detailCategory:  item.detailCategory,
            amount:          item.amount,
            amountPaid:      item.amountPaid || item.amount,
            remainingAmount: item.remainingAmount,
            paymentStatus:   item.paymentStatus,
            paidBy:          item.paidBy,
            paidTo:          item.paidTo,
            note:            item.note,
            mode:            paymentMode,
            bankId:          paymentMode === 'Bank'    ? selectedBank  : undefined,
            chequeNumber:    paymentMode === 'Cheque'  ? chequeNumber  : undefined,
            chequeDate:      paymentMode === 'Cheque'  ? chequeDate    : undefined,
            chequeBank:      paymentMode === 'Cheque'  ? chequeBank    : undefined,
            company:         companyName,
            approvalStatus,
            approvalToken:   token,
            plMainCategory:  plMainCategory || undefined,
            plSubCategory:   plSubCategory  || undefined,
            bsMainCategory:  bsMainCategory || undefined,
            bsSubCategory:   bsSubCategory  || undefined,
            currency,
          } as any;

          await TransactionFirebaseService.addTransaction(txData);
          if (idx === 0) firstTxId = resolvedId;

          if (paymentMode === 'Bank' && selectedBank) {
            await updateBankBalance(selectedBank, item.amount, isInflow);
          }
        }
      }

      if (editingTx) {
        toast.success('Transaction updated successfully', {
          description: `ID: ${firstTxId}`,
          duration:    4000,
        });
      } else {
        if (needsApprovalFirst) {
          toast.success('Transaction saved — waiting for admin approval', {
            description: `ID: ${firstTxId}`,
            duration:    5000,
          });
        } else {
          toast.success('Transaction saved successfully', {
            description: `ID: ${firstTxId}`,
            duration:    4000,
          });
        }
      }

      navigate('/transactions');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  }, [
    validate, editingTx, transactionItems, office, date,
    transactionType, paymentMode, selectedBank, banks,
    navigate, transactionId, chequeNumber, chequeDate, chequeBank,
    updateBankBalance, plMainCategory, plSubCategory, bsMainCategory, bsSubCategory,
    currency, companies,
  ]);

  const handleCancel = useCallback(() => navigate('/transactions'), [navigate]);

  /** Save a new user-defined sub-category to Firestore and return its name */
  const onAddSubCategory = useCallback(async (
    parentCategory: string,
    name: string,
  ): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:           'subCategory',
        parentCategory,
        name,
        createdAt:      new Date().toISOString(),
      });
      setDynamicSubCategories(prev => [...prev, created]);
      toast.success(`Sub-category "${name}" saved`);
      return name;
    } catch {
      toast.error('Failed to save category');
      return null;
    }
  }, []);

  const onDeleteSubCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await TransactionFirebaseService.deleteDynamicCategory(id);
      setDynamicSubCategories(prev => prev.filter(d => d.id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  }, []);

  const onAddPLMainCategory = useCallback(async (name: string): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:      'plMainCategory',
        name:      name.trim(),
        createdAt: new Date().toISOString(),
      });
      setDynamicPLCategories(prev => [...prev, created]);
      toast.success(`P&L category "${name}" saved`);
      return name.trim();
    } catch {
      toast.error('Failed to save P&L category');
      return null;
    }
  }, []);

  const onAddPLSubCategory = useCallback(async (
    parentCategory: string,
    name: string,
  ): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:           'plSubCategory',
        parentCategory,
        name:           name.trim(),
        createdAt:      new Date().toISOString(),
      });
      setDynamicPLCategories(prev => [...prev, created]);
      toast.success(`P&L sub-category "${name}" saved`);
      return name.trim();
    } catch {
      toast.error('Failed to save P&L sub-category');
      return null;
    }
  }, []);

  const onDeletePLCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await TransactionFirebaseService.deleteDynamicCategory(id);
      setDynamicPLCategories(prev => prev.filter(d => d.id !== id));
      toast.success('P&L category deleted');
    } catch {
      toast.error('Failed to delete P&L category');
    }
  }, []);

  const onAddBSMainCategory = useCallback(async (name: string): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:      'bsMainCategory',
        name:      name.trim(),
        createdAt: new Date().toISOString(),
      });
      setDynamicBSCategories(prev => [...prev, created]);
      toast.success(`Balance Sheet category "${name}" saved`);
      return name.trim();
    } catch {
      toast.error('Failed to save Balance Sheet category');
      return null;
    }
  }, []);

  const onAddBSSubCategory = useCallback(async (
    parentCategory: string,
    name: string,
  ): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addDynamicCategory({
        type:           'bsSubCategory',
        parentCategory,
        name:           name.trim(),
        createdAt:      new Date().toISOString(),
      });
      setDynamicBSCategories(prev => [...prev, created]);
      toast.success(`Balance Sheet sub-category "${name}" saved`);
      return name.trim();
    } catch {
      toast.error('Failed to save Balance Sheet sub-category');
      return null;
    }
  }, []);

  const onDeleteBSCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await TransactionFirebaseService.deleteDynamicCategory(id);
      setDynamicBSCategories(prev => prev.filter(d => d.id !== id));
      toast.success('Balance Sheet category deleted');
    } catch {
      toast.error('Failed to delete Balance Sheet category');
    }
  }, []);

  /** Add a new company/branch to Firestore */
  const onAddCompany = useCallback(async (name: string): Promise<string | null> => {
    try {
      const created = await TransactionFirebaseService.addCompany(name);
      setCompanies(prev => [...prev, created]);
      toast.success(`Company "${name}" saved`);
      return created.id;
    } catch {
      toast.error('Failed to save company');
      return null;
    }
  }, []);

  const formatDateDisplay = useCallback((d: string) =>
    d ? new Date(d).toLocaleDateString('en-PK', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }) : '',
  []);

  return {
    office, date, transactionType, paymentMode, selectedBank,
    chequeNumber, chequeDate, chequeBank,
    setChequeNumber, setChequeDate, setChequeBank,
    enableMultiple, transactionItems,
    transactionId, isGeneratingId, isEditingId,
    setTransactionId, setIsEditingId,
    totalAmount:    totals.totalAmount,
    totalPaid:      totals.totalPaid,
    totalRemaining: totals.totalRemaining,
    currentBankBalance, remainingBalanceAfter,
    banks, isLoading, isSaving, isEditing: !!editingTx,
    setOffice, setDate, setTransactionType, setPaymentMode, setSelectedBank,
    setEnableMultiple, updateItem, addItem, removeItem,
    handleSave, handleCancel,
    formatCurrency: formatCurrencyLocal,
    formatDateDisplay,
    duplicateIdError, setDuplicateIdError,
    plMainCategory, plSubCategory, setPlMainCategory, setPlSubCategory,
    bsMainCategory, bsSubCategory, setBsMainCategory, setBsSubCategory,
    dynamicSubCategories, onAddSubCategory, onDeleteSubCategory,
    dynamicPLCategories, onAddPLMainCategory, onAddPLSubCategory, onDeletePLCategory,
    dynamicBSCategories, onAddBSMainCategory, onAddBSSubCategory, onDeleteBSCategory,
    companies, onAddCompany,
    currency, setCurrency, currencyOptions: SUPPORTED_CURRENCIES,
  };
}