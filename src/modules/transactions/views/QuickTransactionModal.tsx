// Transactions Module - QuickTransactionModal (Phase 3 redesign)
//
// Rewritten to match the reference Image 2 layout:
//   • Transaction ID auto-generated and displayed at the top (read-only)
//   • Manual Date
//   • Transaction Type toggle:   Inflow  |  Outflow    (big segmented buttons)
//   • Account dropdown grouped   Cash / Bank           (with live balance per option)
//   • Category dropdown filtered by type
//   • Sub-category dropdown (optional) filtered by category, with +Add
//   • Description with 0/120 char counter
//   • Branch dropdown with +Add
//   • Total Amount * / Amount Received (partial payment)
//   • Remitter Name (Inflow only)
//   • Attachment / Receipt (optional — base64 into the existing attachments[] array)
//   • Cancel / Submit
//
// Writes BOTH the new Phase 1 fields (accountId / accountType / subCategoryDetail
// / branchId / remitterName / attachmentUrl) AND the legacy ones (mainCategory /
// subCategory / mode / bankId / company) so nothing downstream breaks.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, TrendingUp, TrendingDown, Wallet, Landmark, ChevronDown,
  Plus, Loader2, Paperclip, Check, Pencil, Trash2, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { InvoiceMiscExpenseService } from '../../invoices/models/InvoiceMiscExpenseService';
import { InvoicePaymentService } from '../../invoices/models/InvoicePaymentService';
import { calculateSupplierCost } from '../../invoices/models/invoiceService';
import { Invoice } from '../../invoices/models/types';
import {
  Transaction, DynamicCategory, SUB_CATEGORIES, CASH_IN_HAND_ID, CASH_IN_HAND_NAME,
  INVOICE_MISC_EXPENSE_CATEGORY, SALES_INVOICE_CATEGORY, SOLD_GOODS_PAYMENT_CATEGORY,
} from '../models/types';

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSaved: () => void;
  /** Bank accounts to show as Bank-type Accounts in the dropdown. */
  banks?: { id: string; name: string; balance?: number; accountNumber?: string }[];
  /** Live Cash-in-Hand balance (computed from transactions in the parent). */
  cashBalance?: number;
  /** Legacy prop kept so existing wrappers keep compiling — mapped to branches. */
  companies?: string[];
}

type TxType = 'Inflow' | 'Outflow';

const MAX_DESC = 120;

// ── Main ────────────────────────────────────────────────────────────────────
export function QuickTransactionModal({
  onClose, onSaved,
  banks = [], cashBalance = 0, companies = [],
}: Props) {

  // ── Auto TXN ID ──────────────────────────────────────────────────────
  const [txId, setTxId] = useState('');
  useEffect(() => {
    TransactionFirebaseService.generateTransactionId()
      .then(setTxId)
      .catch(() => setTxId(`TXN-${Date.now()}`));
  }, []);

  // ── Form state ───────────────────────────────────────────────────────
  const today = () => new Date().toISOString().split('T')[0];
  const [manualDate, setManualDate] = useState(today());
  const [type, setType] = useState<TxType>('Inflow');
  const [accountId, setAccountId] = useState(CASH_IN_HAND_ID);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [branchName, setBranchName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [remitterName, setRemitterName] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown-managed data
  const [subCats, setSubCats] = useState<DynamicCategory[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showAddSubCat, setShowAddSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [savingSubCat, setSavingSubCat] = useState(false);
  const [editSubCatMode, setEditSubCatMode] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [savingBranch, setSavingBranch] = useState(false);

  // ── Invoice picker (Outflow · "Invoice Misc Expense" only) ──────────
  // Lazy-loaded the first time the user picks this special category, then
  // cached for the rest of the session so switching in/out of the option
  // doesn't refetch.
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const isInvoiceMisc     = type === 'Outflow' && category === INVOICE_MISC_EXPENSE_CATEGORY;
  const isSalesInvoice    = type === 'Inflow'  && category === SALES_INVOICE_CATEGORY;
  const isSoldGoodsPayment = type === 'Outflow' && category === SOLD_GOODS_PAYMENT_CATEGORY;
  /** Any invoice-linked category — the modal loads invoices + shows the
   *  picker in all cases, and forks the save flow to the right service. */
  const needsInvoice = isInvoiceMisc || isSalesInvoice || isSoldGoodsPayment;

  useEffect(() => {
    if (invoices.length > 0 || invoicesLoading) return;
    setInvoicesLoading(true);
    InvoiceFirebaseService.fetchAllInvoices()
      .then(list => {
        // Show non-fully-paid first so the common case (adding an expense to
        // an unpaid invoice) is easy to find. Sort within each bucket by
        // invoice number desc so newest is up top.
        const sorted = [...list].sort((a, b) => {
          const aPaid = a.paymentStatus === 'Full';
          const bPaid = b.paymentStatus === 'Full';
          if (aPaid !== bPaid) return aPaid ? 1 : -1;
          return (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '');
        });
        setInvoices(sorted);
      })
      .catch(err => {
        console.error('[QuickTransactionModal] fetchAllInvoices failed:', err);
        // Silent — a network hiccup here shouldn't disrupt someone who's
        // recording a plain non-invoice transaction. Toast only when the
        // picker is actually rendered and empty (below).
      })
      .finally(() => setInvoicesLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset invoice link when moving away from any invoice-linked category
  useEffect(() => { if (!needsInvoice) setInvoiceId(''); }, [needsInvoice]);

  // Currently-selected invoice + derived payment stats. Used to render the
  // history breakdown and enforce the max-amount cap for Sales Invoice.
  const selectedInvoice = useMemo(
    () => invoices.find(i => i.id === invoiceId) || null,
    [invoices, invoiceId],
  );
  const invoiceStats = useMemo(() => {
    if (!selectedInvoice) return { total: 0, paid: 0, remaining: 0, payments: [] as any[] };
    const total = Number((selectedInvoice as any).totalAmount) || 0;
    const payments = ((selectedInvoice as any).payments || []) as Array<any>;
    const paid = Number((selectedInvoice as any).paidAmount)
      || payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, total - paid);
    return { total, paid, remaining, payments };
  }, [selectedInvoice]);

  /** Same shape as invoiceStats but for the SUPPLIER side of the invoice —
   *  what we owe the supplier for the goods on that invoice. Used by the
   *  Sold Goods Payment fork. */
  const supplierStats = useMemo(() => {
    if (!selectedInvoice) return { total: 0, paid: 0, remaining: 0, payments: [] as any[] };
    const total = Number((selectedInvoice as any).supplierCostTotal) || calculateSupplierCost(selectedInvoice);
    const supplierPayments = ((selectedInvoice as any).supplierPayments || []) as Array<any>;
    const paid = Number((selectedInvoice as any).supplierPaidAmount)
      || supplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, total - paid);
    return { total, paid, remaining, payments: supplierPayments };
  }, [selectedInvoice]);

  // Auto-clamp the entered amount if the user typed something above the
  // remaining balance and then picked a different invoice with a smaller cap.
  useEffect(() => {
    if (!isSalesInvoice || !selectedInvoice) return;
    if (totalAmount !== '' && Number(totalAmount) > invoiceStats.remaining) {
      setTotalAmount(invoiceStats.remaining);
    }
  }, [isSalesInvoice, selectedInvoice, invoiceStats.remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // Same auto-clamp for the SUPPLIER side.
  useEffect(() => {
    if (!isSoldGoodsPayment || !selectedInvoice) return;
    if (totalAmount !== '' && Number(totalAmount) > supplierStats.remaining) {
      setTotalAmount(supplierStats.remaining);
    }
  }, [isSoldGoodsPayment, selectedInvoice, supplierStats.remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill the amount when the user picks an invoice for Sold Goods
  // Payment — outstanding supplier balance is the intended payment 99% of
  // the time. User can still edit down for partial payments.
  useEffect(() => {
    if (!isSoldGoodsPayment || !selectedInvoice) return;
    if (totalAmount !== '' && Number(totalAmount) > 0) return;    // don't overwrite user's own entry
    if (supplierStats.remaining > 0) {
      setTotalAmount(supplierStats.remaining);
    }
  }, [isSoldGoodsPayment, invoiceId, supplierStats.remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // UI state
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Load categories + branches on mount
  useEffect(() => {
    TransactionFirebaseService.fetchDynamicCategories()
      .then(setSubCats)
      .catch(() => {});
    TransactionFirebaseService.fetchCompanies()
      .then(list => {
        const mapped = list.map(c => ({ id: c.id, name: c.name }));
        setBranches(mapped);
        // Seed from legacy prop if Firestore is empty
        if (mapped.length === 0 && companies.length > 0) {
          setBranches(companies.map((c, i) => ({ id: `legacy-${i}`, name: c })));
        }
      })
      .catch(() => {
        if (companies.length > 0) {
          setBranches(companies.map((c, i) => ({ id: `legacy-${i}`, name: c })));
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountOpen]);

  // ── Category resolution ──────────────────────────────────────────────
  // The static Categories list comes from types.SUB_CATEGORIES keyed on the
  // legacy mainCategory names ('Cash Inflow' / 'Cash Outflow'). Type-toggle
  // maps to that key for lookup.
  const mainCategoryKey = type === 'Inflow' ? 'Cash Inflow' : 'Cash Outflow';
  const availableCategories = useMemo(() => {
    return SUB_CATEGORIES[mainCategoryKey] || [];
  }, [mainCategoryKey]);

  // Sub-categories filtered by selected category (parentCategory = category)
  const availableSubCategories = useMemo(() => {
    if (!category) return [];
    return subCats.filter(
      sc => sc.type === 'subCategoryDetail' && sc.parentCategory === category,
    );
  }, [subCats, category]);

  // Reset dependent selections when parent changes
  useEffect(() => { setCategory(''); setSubCategory(''); }, [type]);
  useEffect(() => { setSubCategory(''); }, [category]);

  // ── Accounts (Cash-in-Hand + banks) ──────────────────────────────────
  const accounts = useMemo(() => {
    const list: { id: string; name: string; type: 'cash' | 'bank'; balance: number; accountNumber?: string }[] = [
      { id: CASH_IN_HAND_ID, name: CASH_IN_HAND_NAME, type: 'cash', balance: cashBalance },
    ];
    banks.forEach(b => list.push({
      id: b.id, name: b.name, type: 'bank', balance: b.balance ?? 0, accountNumber: b.accountNumber,
    }));
    return list;
  }, [banks, cashBalance]);

  const selectedAccount = accounts.find(a => a.id === accountId) || accounts[0];

  // ── Sub-category management ──────────────────────────────────────────
  const handleAddSubCat = async () => {
    if (savingSubCat) return;                 // guard against double-click / repeat Enter
    const name = newSubCatName.trim();
    if (!name) return;
    if (!category) { toast.error('Pick a Category first'); return; }
    setSavingSubCat(true);
    try {
      const added = await TransactionFirebaseService.addDynamicCategory({
        type: 'subCategoryDetail',
        parentCategory: category,
        name,
        createdAt: new Date().toISOString(),
      });
      setSubCats(prev => [...prev, added]);
      setSubCategory(name);
      setNewSubCatName('');
      setShowAddSubCat(false);
      toast.success(`Sub-category "${name}" added`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add sub-category');
    } finally {
      setSavingSubCat(false);
    }
  };

  const handleDeleteSubCat = async (sc: DynamicCategory) => {
    if (!window.confirm(`Delete sub-category "${sc.name}"?`)) return;
    try {
      await TransactionFirebaseService.deleteDynamicCategory(sc.id);
      setSubCats(prev => prev.filter(x => x.id !== sc.id));
      if (subCategory === sc.name) setSubCategory('');
      toast.success('Removed');
    } catch { toast.error('Failed to delete'); }
  };

  // ── Branch management ────────────────────────────────────────────────
  const handleAddBranch = async () => {
    if (savingBranch) return;                 // guard against double-click / repeat Enter
    const name = newBranchName.trim();
    if (!name) return;
    setSavingBranch(true);
    try {
      const added = await TransactionFirebaseService.addCompany(name);
      setBranches(prev => [...prev, { id: added.id, name: added.name }]);
      setBranchName(added.name);
      setNewBranchName('');
      setShowAddBranch(false);
      toast.success(`Branch "${name}" added`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add branch');
    } finally {
      setSavingBranch(false);
    }
  };

  // ── File → base64 (used for the required receipt attachment) ─────────
  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!txId) { toast.error('Transaction ID not ready'); return; }
    if (!category) { toast.error('Category is required'); return; }
    if (!totalAmount || Number(totalAmount) <= 0) { toast.error('Total amount must be greater than zero'); return; }
    if (selectedAccount.type === 'bank' && !selectedAccount.id) {
      toast.error('Pick a valid bank account'); return;
    }
    // Both invoice-linked categories require the user to pick an invoice
    if (needsInvoice && !invoiceId) {
      toast.error('Pick which invoice this transaction belongs to'); return;
    }
    // For Sales Invoice, guard against overpayment / paid-in-full invoices.
    if (isSalesInvoice && selectedInvoice) {
      if (invoiceStats.remaining === 0) {
        toast.error('This invoice is fully paid — nothing left to record'); return;
      }
      if (Number(totalAmount) > invoiceStats.remaining) {
        toast.error(`Amount cannot exceed remaining balance (AED ${invoiceStats.remaining.toLocaleString()})`);
        return;
      }
    }
    // Same guard for supplier payment — can't pay more than what's owed.
    if (isSoldGoodsPayment && selectedInvoice) {
      if (supplierStats.total === 0) {
        toast.error('This invoice has no supplier cost — nothing to pay'); return;
      }
      if (supplierStats.remaining === 0) {
        toast.error('Supplier already fully paid for this invoice'); return;
      }
      if (Number(totalAmount) > supplierStats.remaining) {
        toast.error(`Amount cannot exceed supplier balance (AED ${supplierStats.remaining.toLocaleString()})`);
        return;
      }
    }

    setSaving(true);
    try {
      // Attachment is optional. Only encode + attach when the user picked a file.
      let dataUrl: string | undefined;
      let attachmentEntry: {
        id: string; name: string; type: string; dataUrl: string; uploadedAt: string;
      } | undefined;
      if (attachment) {
        dataUrl = await fileToDataUrl(attachment);
        attachmentEntry = {
          id: `att-${Date.now()}`,
          name: attachment.name,
          type: attachment.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
      }

      const total = Number(totalAmount);
      const paid  = amountReceived === '' ? total : Math.max(0, Math.min(total, Number(amountReceived)));
      const remaining = Math.max(0, total - paid);
      const isPartial = paid < total;

      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      const branchId = branches.find(b => b.name === branchName)?.id;
      const isCash = selectedAccount.type === 'cash';

      // ── FORK: Invoice Misc Expense ──────────────────────────────────
      // For this special category, InvoiceMiscExpenseService.recordExpense
      // does BOTH sides in one call:
      //   1. appends to the invoice's miscExpenses[] and updates miscExpense total
      //   2. books an Outflow transaction with linkedType: 'invoice',
      //      linkedId: invoiceNumber  (so the invoice-delete reversal picks it up)
      // Calling createTransaction here too would double-book — so we return
      // early after recordExpense succeeds.
      if (isInvoiceMisc) {
        const inv = invoices.find(x => x.id === invoiceId);
        if (!inv) { toast.error('Selected invoice not found'); setSaving(false); return; }
        await InvoiceMiscExpenseService.recordExpense({
          invoice:  inv,
          amount:   total,
          category: description || 'Misc expense',
          mode:     isCash ? 'Cash' : 'Bank',
          date:     manualDate,
          bankId:   isCash ? undefined : selectedAccount.id,
          bankName: isCash ? undefined : selectedAccount.name,
          note:     description || undefined,
          company:  (branchName || 'Main Office') as any,
        });
        toast.success(`Misc expense added to invoice ${inv.invoiceNumber}`);
        onSaved();
        onClose();
        return;
      }

      // ── FORK: Sales Invoice (customer payment received) ─────────────
      // InvoicePaymentService.recordPayment handles both:
      //   1. Appends a payment entry to the invoice + recomputes remaining/status
      //   2. Books an Inflow transaction with linkedType: 'invoice',
      //      linkedId: invoiceNumber  (matches the invoice-delete reversal query)
      // Same double-book warning — return early after success.
      if (isSalesInvoice) {
        const inv = invoices.find(x => x.id === invoiceId);
        if (!inv) { toast.error('Selected invoice not found'); setSaving(false); return; }
        await InvoicePaymentService.recordPayment({
          invoice:  inv,
          amount:   total,
          mode:     isCash ? 'Cash' : 'Bank',
          date:     manualDate,
          bankId:   isCash ? undefined : selectedAccount.id,
          bankName: isCash ? undefined : selectedAccount.name,
          note:     description || undefined,
          company:  (branchName || 'Main Office') as any,
        });
        toast.success(`Payment recorded against invoice ${inv.invoiceNumber}`);
        onSaved();
        onClose();
        return;
      }

      // ── FORK: Sold Goods Payment (paying supplier for invoice goods) ────
      // InvoicePaymentService.recordSupplierPayment handles both:
      //   1. Appends to invoice.supplierPayments + recomputes supplierPaidAmount
      //      + supplierPaymentStatus (Unpaid → Partial → Paid)
      //   2. Books ONE Outflow transaction with linkedType: 'invoice',
      //      linkedId: invoiceNumber, subCategory: 'Sold Goods Payment'
      // Same double-book warning — return early after success.
      if (isSoldGoodsPayment) {
        const inv = invoices.find(x => x.id === invoiceId);
        if (!inv) { toast.error('Selected invoice not found'); setSaving(false); return; }
        await InvoicePaymentService.recordSupplierPayment({
          invoice:  inv,
          amount:   total,
          mode:     isCash ? 'Cash' : 'Bank',
          date:     manualDate,
          bankId:   isCash ? undefined : selectedAccount.id,
          bankName: isCash ? undefined : selectedAccount.name,
          note:     description || undefined,
          company:  (branchName || 'Main Office') as any,
        });
        toast.success(`Supplier payment recorded for invoice ${inv.invoiceNumber}`);
        onSaved();
        onClose();
        return;
      }

      const legacyMain: 'Cash Inflow' | 'Cash Outflow' =
        type === 'Inflow' ? 'Cash Inflow' : 'Cash Outflow';

      const txData: Omit<Transaction, 'id'> = {
        transactionId:   txId,
        date:            manualDate,
        time,
        // Legacy fields (kept for backward compatibility with list/stats/exports):
        company:         branchName || 'Main Office',
        mainCategory:    legacyMain,
        subCategory:     category,
        detailCategory:  subCategory || description || category,
        amount:          total,
        mode:            isCash ? 'Cash' : 'Bank',
        bankId:          isCash ? undefined : selectedAccount.id,
        bankName:        isCash ? undefined : selectedAccount.name,
        amountPaid:      paid,
        remainingAmount: remaining,
        paymentStatus:   isPartial ? 'Partial' : 'Full',
        totalPaid:       paid,
        isFullyCleared:  !isPartial,
        paidBy:          type === 'Inflow' && remitterName ? remitterName : undefined,
        paidTo:          undefined,
        note:            description || category,
        partialPayments: [],
        linkedType:      'manual',
        approvalStatus:  'not_required',
        // Basic P&L / BS classification (kept from legacy behaviour):
        plMainCategory:  type === 'Inflow' ? 'Revenue' : 'Operating Expenses',
        bsMainCategory:  'Assets',
        bsSubCategory:   isCash ? 'Cash & Cash Equivalents' : 'Bank Balances',
        attachments:     attachmentEntry ? [attachmentEntry] : undefined,

        // ── Phase 1 new fields ─────────────────────────────────────────
        subCategoryDetail: subCategory || undefined,
        accountId:         selectedAccount.id,
        accountType:       selectedAccount.type,
        accountName:       selectedAccount.name,
        branchId,
        branchName:        branchName || undefined,
        remitterName:      type === 'Inflow' && remitterName ? remitterName : undefined,
        attachmentUrl:     dataUrl,       // undefined when no file — stripped by deepStripUndefined on write
      } as Omit<Transaction, 'id'>;

      await TransactionFirebaseService.createTransaction(txData);
      toast.success(`Transaction ${txId} recorded`);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('[QuickTransactionModal] save failed:', err);
      toast.error(err?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  // ── Style helpers ────────────────────────────────────────────────────
  const label: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8',
    letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
  };
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, color: '#0f172a', backgroundColor: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = { ...inp, appearance: 'none', paddingRight: 28, cursor: 'pointer' };

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
          backgroundColor: '#fff', borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Record a financial transaction</div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 7, backgroundColor: '#fff', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Transaction ID */}
          <div>
            <label style={label}>Transaction ID</label>
            <input value={txId || 'Generating…'} readOnly style={{ ...inp, fontFamily: 'monospace', color: '#4f46e5', fontWeight: 600 }} />
          </div>

          {/* Manual Date */}
          <div>
            <label style={label}>Manual Date</label>
            <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} style={inp} />
          </div>

          {/* Transaction Type toggle */}
          <div>
            <label style={label}>Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TypeButton active={type === 'Inflow'} onClick={() => setType('Inflow')} icon={<TrendingUp size={15} />} label="Inflow" activeColor="#c2410c" activeBg="#fff7ed" />
              <TypeButton active={type === 'Outflow'} onClick={() => setType('Outflow')} icon={<TrendingDown size={15} />} label="Outflow" activeColor="#c2410c" activeBg="#fff7ed" />
            </div>
          </div>

          {/* Account */}
          <div ref={accountRef} style={{ position: 'relative' }}>
            <label style={label}>Account</label>
            <button
              onClick={() => setAccountOpen(v => !v)}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                backgroundColor: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: 600 }}>
                {selectedAccount.type === 'cash'
                  ? <Wallet size={14} color="#65a30d" />
                  : <Landmark size={14} color="#2563eb" />}
                {selectedAccount.name} — {selectedAccount.balance.toLocaleString()} available
              </span>
              <ChevronDown size={14} color="#94a3b8" style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {accountOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,23,42,0.14)', overflow: 'hidden',
              }}>
                <AccountGroup title="Cash" items={accounts.filter(a => a.type === 'cash')} selectedId={accountId} onPick={id => { setAccountId(id); setAccountOpen(false); }} />
                <AccountGroup title="Bank" items={accounts.filter(a => a.type === 'bank')} selectedId={accountId} onPick={id => { setAccountId(id); setAccountOpen(false); }} />
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Available in this account: {selectedAccount.balance.toLocaleString()}
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={label}>Category <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
              <option value="">— Select category —</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sub-category */}
          <div>
            <label style={label}>Sub Category <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!category} style={{ ...sel, flex: 1, opacity: category ? 1 : 0.6 }}>
                <option value="">
                  {!category
                    ? 'Pick a Category first'
                    : availableSubCategories.length === 0
                      ? 'No sub-categories yet'
                      : '— None —'}
                </option>
                {availableSubCategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
              </select>
              <button
                onClick={() => setEditSubCatMode(v => !v)}
                disabled={availableSubCategories.length === 0}
                title="Edit / remove sub-categories"
                style={btnGhost(availableSubCategories.length === 0)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => { setShowAddSubCat(true); setNewSubCatName(''); }}
                disabled={!category}
                title="Add a new sub-category under this Category"
                style={btnGhost(!category)}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {/* Inline add */}
            {showAddSubCat && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  autoFocus value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubCat()}
                  disabled={savingSubCat}
                  placeholder={`Sub-category under "${category}"`}
                  style={{ ...inp, flex: 1, opacity: savingSubCat ? 0.6 : 1 }}
                />
                <button
                  onClick={handleAddSubCat}
                  disabled={savingSubCat || !newSubCatName.trim()}
                  style={{
                    ...btnPrimary,
                    backgroundColor: savingSubCat ? '#94a3b8' : btnPrimary.backgroundColor,
                    cursor: savingSubCat ? 'not-allowed' : 'pointer',
                    opacity: !newSubCatName.trim() && !savingSubCat ? 0.5 : 1,
                  }}
                >
                  {savingSubCat
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : 'Save'}
                </button>
                <button
                  onClick={() => { setShowAddSubCat(false); setNewSubCatName(''); }}
                  disabled={savingSubCat}
                  style={btnGhost(savingSubCat)}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Inline edit list */}
            {editSubCatMode && availableSubCategories.length > 0 && (
              <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {availableSubCategories.map(sc => (
                  <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: '#0f172a' }}>{sc.name}</span>
                    <button onClick={() => handleDeleteSubCat(sc)} title="Delete" style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Invoice picker ──────────────────────────────────────────
              Shown for three special categories:
                • Outflow → "Invoice Misc Expense" — routes save through
                  InvoiceMiscExpenseService.recordExpense
                • Inflow  → "Sales Invoice"       — routes save through
                  InvoicePaymentService.recordPayment (customer payment)
                • Outflow → "Sold Goods Payment"  — routes save through
                  InvoicePaymentService.recordSupplierPayment (supplier payout)
              Panel is tinted:
                • orange for Invoice Misc Expense
                • emerald for Sales Invoice
                • sky-blue for Sold Goods Payment                          */}
          {needsInvoice && (() => {
            const borderColor =
              isSalesInvoice     ? '#a7f3d0' :
              isSoldGoodsPayment ? '#bae6fd' :
                                   '#fed7aa';
            const bg =
              isSalesInvoice     ? '#ecfdf5' :
              isSoldGoodsPayment ? '#f0f9ff' :
                                   '#fff7ed';
            const accentFg =
              isSalesInvoice     ? '#065f46' :
              isSoldGoodsPayment ? '#075985' :
                                   '#c2410c';
            const helperFg =
              isSalesInvoice     ? '#166534' :
              isSoldGoodsPayment ? '#0c4a6e' :
                                   '#9a3412';
            return (
              <div style={{ padding: 12, border: `1px solid ${borderColor}`, backgroundColor: bg, borderRadius: 10 }}>
                <label style={{ ...label, color: accentFg }}>
                  {isSoldGoodsPayment ? 'Pay supplier for which invoice' : 'Link to Invoice'} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={invoiceId}
                  onChange={e => setInvoiceId(e.target.value)}
                  disabled={invoicesLoading}
                  style={sel}
                >
                  <option value="">
                    {invoicesLoading ? 'Loading invoices…'
                      : (() => {
                          // Filter per category:
                          //   Sales Invoice   → invoices with unpaid balance
                          //   Sold Goods Pmt  → invoices with unpaid SUPPLIER balance
                          //   Misc Expense    → any invoice
                          const pickable = isSalesInvoice
                            ? invoices.filter(i => i.paymentStatus !== 'Full')
                            : isSoldGoodsPayment
                              ? invoices.filter(i => {
                                  const t = Number((i as any).supplierCostTotal) || calculateSupplierCost(i);
                                  const p = Number((i as any).supplierPaidAmount) || 0;
                                  return t > 0 && (t - p) > 0.01;
                                })
                              : invoices;
                          return pickable.length === 0
                            ? (isSalesInvoice     ? 'No invoices with pending balance'
                             : isSoldGoodsPayment ? 'No invoices with unpaid supplier cost'
                                                  : 'No invoices found')
                            : '— Select invoice —';
                        })()}
                  </option>
                  {invoices
                    // Per-category filter (same rules as the placeholder above).
                    .filter(inv => {
                      if (isSalesInvoice)     return inv.paymentStatus !== 'Full';
                      if (isSoldGoodsPayment) {
                        const t = Number((inv as any).supplierCostTotal) || calculateSupplierCost(inv);
                        const p = Number((inv as any).supplierPaidAmount) || 0;
                        return t > 0 && (t - p) > 0.01;
                      }
                      return true;
                    })
                    .map(inv => {
                      // Compose the display label per user spec:
                      //   INV-XXX — CustomerFirstName · AED remaining
                      // For Sales Invoice → customer remaining
                      // For Sold Goods Payment → supplier remaining
                      // For Misc Expense → full total
                      const firstName = (inv.customerName || '').split(/\s+/)[0].trim();
                      const modelName = (inv.products && inv.products[0]?.modelName) || '';
                      const identity  = firstName || modelName || 'Unknown';
                      let shownAmt: number;
                      let partialTag = '';
                      if (isSoldGoodsPayment) {
                        const t = Number((inv as any).supplierCostTotal) || calculateSupplierCost(inv);
                        const p = Number((inv as any).supplierPaidAmount) || 0;
                        shownAmt = Math.max(0, t - p);
                        if (p > 0) partialTag = '  (partial)';
                      } else if (isSalesInvoice) {
                        const total     = Number((inv as any).totalAmount) || 0;
                        const paid      = Number((inv as any).paidAmount) || 0;
                        shownAmt = Math.max(0, total - paid);
                        if (paid > 0) partialTag = '  (partial)';
                      } else {
                        shownAmt = Number((inv as any).totalAmount) || 0;
                      }
                      const label = `${inv.invoiceNumber} — ${identity} · AED ${shownAmt.toLocaleString()}${partialTag}`;
                      return <option key={inv.id} value={inv.id}>{label}</option>;
                    })}
                </select>
                <div style={{ fontSize: 11, color: helperFg, marginTop: 6, lineHeight: 1.4 }}>
                  {isSalesInvoice ? (
                    <>
                      This payment will be recorded against the invoice's <b>payment history</b> AND
                      booked here as an Inflow transaction. Deleting the invoice will reverse both.
                    </>
                  ) : isSoldGoodsPayment ? (
                    <>
                      This supplier payment will be recorded against the invoice's <b>supplier payment history</b> AND
                      booked here as an Outflow transaction. The invoice's "Supplier Paid" status will flip to Partial or Paid.
                    </>
                  ) : (
                    <>
                      This expense will be added to the invoice's <b>Misc Expense</b> total
                      AND recorded here as an Outflow transaction. Deleting the invoice
                      will reverse both.
                    </>
                  )}
                </div>

                {/* ── Sold Goods Payment: supplier cost summary ── */}
                {isSoldGoodsPayment && selectedInvoice && (
                  <div style={{
                    marginTop: 12, padding: 10,
                    backgroundColor: '#fff', borderRadius: 8,
                    border: '1px solid #bae6fd',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: supplierStats.payments.length > 0 ? 8 : 0 }}>
                      <SumCell label="Supplier cost"   value={supplierStats.total}     fg="#0f172a" />
                      <SumCell label="Already paid"    value={supplierStats.paid}      fg="#059669" />
                      <SumCell label="Outstanding"     value={supplierStats.remaining} fg={supplierStats.remaining > 0 ? '#c2410c' : '#94a3b8'} bold />
                    </div>
                    {supplierStats.payments.length > 0 && (
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>
                        {supplierStats.payments.length} previous supplier payment{supplierStats.payments.length === 1 ? '' : 's'} on file
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 11, color: '#0c4a6e', fontStyle: 'italic' }}>
                      Amount below has been pre-filled with the outstanding supplier balance. Adjust if paying only a portion.
                    </div>
                  </div>
                )}

                {/* ── Sales Invoice payment history + remaining balance ── */}
                {isSalesInvoice && selectedInvoice && (
                  <div style={{
                    marginTop: 12, padding: 10,
                    backgroundColor: '#fff', borderRadius: 8,
                    border: '1px solid #d1fae5',
                  }}>
                    {/* Summary row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <SumCell label="Invoice total"  value={invoiceStats.total}     fg="#0f172a" />
                      <SumCell label="Already paid"   value={invoiceStats.paid}      fg="#059669" />
                      <SumCell label="Remaining"      value={invoiceStats.remaining} fg={invoiceStats.remaining > 0 ? '#c2410c' : '#94a3b8'} bold />
                    </div>

                    {/* Payment log */}
                    {invoiceStats.payments.length > 0 && (
                      <div style={{ borderTop: '1px solid #ecfdf5', paddingTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#065f46', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          Past payments · {invoiceStats.payments.length}
                        </div>
                        <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {invoiceStats.payments.map((p: any, i: number) => (
                            <div key={p.id || i} style={{
                              display: 'grid', gridTemplateColumns: '90px 60px 1fr auto', gap: 8, alignItems: 'center',
                              fontSize: 11, padding: '4px 6px', backgroundColor: '#f0fdf4', borderRadius: 6,
                            }}>
                              <span style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{p.date || '—'}</span>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 6px', borderRadius: 99,
                                backgroundColor: p.mode === 'Bank' ? '#dbeafe' : p.mode === 'Cheque' ? '#fef3c7' : '#dcfce7',
                                color:           p.mode === 'Bank' ? '#1d4ed8' : p.mode === 'Cheque' ? '#92400e' : '#166534',
                                fontSize: 9, fontWeight: 700,
                              }}>{p.mode || 'Cash'}</span>
                              <span style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.bankName || p.note || '—'}
                              </span>
                              <span style={{ color: '#059669', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                AED {(Number(p.amount) || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {invoiceStats.remaining === 0 && (
                      <div style={{
                        marginTop: 8, padding: '6px 10px', borderRadius: 6,
                        backgroundColor: '#f0fdf4', color: '#065f46',
                        fontSize: 11, fontWeight: 700, textAlign: 'center',
                      }}>
                        ✓ This invoice is fully paid. Nothing left to record.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Description */}
          <div>
            <label style={label}>(Max 120 Characters)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Brief description of this transaction"
              style={inp}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
              {description.length} / {MAX_DESC}
            </div>
          </div>

          {/* Branch */}
          <div>
            <label style={label}>Branch</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={branchName} onChange={e => setBranchName(e.target.value)} style={{ ...sel, flex: 1 }}>
                <option value="">— No branch —</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <button
                onClick={() => { setShowAddBranch(true); setNewBranchName(''); }}
                style={btnGhost(false)}
                title="Add a new branch"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {showAddBranch && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  autoFocus value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddBranch()}
                  disabled={savingBranch}
                  placeholder="Branch name"
                  style={{ ...inp, flex: 1, opacity: savingBranch ? 0.6 : 1 }}
                />
                <button
                  onClick={handleAddBranch}
                  disabled={savingBranch || !newBranchName.trim()}
                  style={{
                    ...btnPrimary,
                    backgroundColor: savingBranch ? '#94a3b8' : btnPrimary.backgroundColor,
                    cursor: savingBranch ? 'not-allowed' : 'pointer',
                    opacity: !newBranchName.trim() && !savingBranch ? 0.5 : 1,
                  }}
                >
                  {savingBranch
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : 'Save'}
                </button>
                <button
                  onClick={() => { setShowAddBranch(false); setNewBranchName(''); }}
                  disabled={savingBranch}
                  style={btnGhost(savingBranch)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Total Amount <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="number" min={0} step="any"
                // Cap the total when a Sales Invoice OR Sold Goods Payment
                // invoice is picked — you can't pay more than what's owed.
                // For every other transaction the max is unrestricted.
                max={
                  isSalesInvoice     && selectedInvoice ? invoiceStats.remaining  :
                  isSoldGoodsPayment && selectedInvoice ? supplierStats.remaining :
                  undefined
                }
                value={totalAmount}
                onChange={e => {
                  const raw = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                  if (raw !== '' && isSalesInvoice && selectedInvoice) {
                    setTotalAmount(Math.min(Number(raw), invoiceStats.remaining));
                  } else if (raw !== '' && isSoldGoodsPayment && selectedInvoice) {
                    setTotalAmount(Math.min(Number(raw), supplierStats.remaining));
                  } else {
                    setTotalAmount(raw);
                  }
                }}
                placeholder="0"
                disabled={
                  isSalesInvoice     && selectedInvoice ? invoiceStats.remaining  === 0 :
                  isSoldGoodsPayment && selectedInvoice ? supplierStats.remaining === 0 :
                  false
                }
                style={inp}
              />
              {isSalesInvoice && selectedInvoice && invoiceStats.remaining > 0 && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Max <b>AED {invoiceStats.remaining.toLocaleString()}</b> — invoice's remaining balance
                </div>
              )}
              {isSoldGoodsPayment && selectedInvoice && supplierStats.remaining > 0 && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Max <b>AED {supplierStats.remaining.toLocaleString()}</b> — outstanding supplier balance
                </div>
              )}
            </div>
            <div>
              <label style={label}>Amount Received</label>
              <input
                type="number" min={0} step="any"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="Leave blank if fully received"
                style={inp}
              />
            </div>
          </div>

          {/* Remitter — Inflow only */}
          {type === 'Inflow' && (
            <div>
              <label style={label}>Remitter Name <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span></label>
              <input
                value={remitterName}
                onChange={e => setRemitterName(e.target.value)}
                placeholder="Who sent this money"
                style={inp}
              />
            </div>
          )}

          {/* Attachment */}
          <div>
            <label style={label}>Attachment / Receipt <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span></label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', border: `1px dashed ${attachment ? '#65a30d' : '#cbd5e1'}`,
              borderRadius: 8, backgroundColor: attachment ? '#f7fee7' : '#f8fafc',
            }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 6, backgroundColor: '#0f172a', color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                <Paperclip size={12} /> Choose file
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setAttachment(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: 12, color: attachment ? '#166534' : '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachment ? attachment.name : 'No file chosen'}
              </span>
              {attachment && (
                <button onClick={() => setAttachment(null)} title="Remove" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
              Optional — a photo or PDF of the receipt/proof for this transaction.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button onClick={onClose} style={btnGhost(saving)}>
            <X size={13} /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8, border: 'none',
            backgroundColor: saving ? '#94a3b8' : '#0f172a', color: '#fff',
            fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Check size={13} /> Submit</>}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Sub-components ──────────────────────────────────────────────────────────
function TypeButton({ active, onClick, icon, label, activeColor, activeBg }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
  activeColor: string; activeBg: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        border: `1.5px solid ${active ? activeColor : '#e2e8f0'}`,
        backgroundColor: active ? activeBg : '#fff',
        color: active ? activeColor : '#334155',
        fontSize: 13, fontWeight: 700,
        transition: 'all .12s',
      }}
    >
      {icon} {label}
    </button>
  );
}

function AccountGroup({ title, items, selectedId, onPick }: {
  title: string;
  items: { id: string; name: string; type: 'cash' | 'bank'; balance: number }[];
  selectedId: string;
  onPick: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', backgroundColor: '#f8fafc' }}>
        {title}
      </div>
      {items.map(a => (
        <div
          key={a.id}
          onClick={() => onPick(a.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', cursor: 'pointer',
            backgroundColor: a.id === selectedId ? '#fff7ed' : '#fff',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: a.id === selectedId ? 700 : 500 }}>
            {a.type === 'cash'
              ? <Wallet size={13} color="#65a30d" />
              : <Landmark size={13} color="#2563eb" />}
            {a.name}
          </span>
          <span style={{ fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
            {a.balance.toLocaleString()}
          </span>
        </div>
      ))}
    </>
  );
}

// ── Style helpers ───────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: 'none',
  backgroundColor: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 5,
};
const btnGhost = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', color: '#334155', fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
  display: 'inline-flex', alignItems: 'center', gap: 5,
});

// ── Small helper for the Sales Invoice summary row (Total / Paid / Remaining)
function SumCell({ label, value, fg, bold }: { label: string; value: number; fg: string; bold?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#f8fafc', borderRadius: 6 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: bold ? 800 : 700, color: fg, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 3 }}>AED</span>{value.toLocaleString()}
      </div>
    </div>
  );
}