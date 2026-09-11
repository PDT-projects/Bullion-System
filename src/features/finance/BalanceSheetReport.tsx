// BalanceSheetReport.tsx
// Computes balance sheet figures from live Firestore data.
// Assets = Cash + Banks + Inventory + Accounts Receivable
// Liabilities = Accounts Payable
// Equity = Assets − Liabilities (accounting identity)
//
// Each line item is expandable — click to see the underlying rows.
// A "Generate PDF" button prints the currently filtered view.

import React, { useEffect, useMemo, useState } from 'react';
import { CashFirebaseService } from '../../modules/banking/models/cashFirebaseService';
import { resolveBSBucket, getTransactionTotals } from '../../modules/transactions/models/transactionsService';
import type { Transaction } from '../../modules/transactions/models/types';
import {
  ArrowLeft, Tag, ChevronDown, ChevronUp, ChevronRight,
  Filter, X, Calendar, MapPin, FileDown,
} from 'lucide-react';

type Bank    = { id: string; name: string; balance: number; accountNumber: string; };
type Loan    = {
  id: string; type: 'Payable' | 'Receivable';
  remaining: number; loanAmount: number; paid: number; status: string;
  personName?: string; borrowerName?: string; lenderName?: string; description?: string;
};
type Product = {
  id: string; costPrice: number; stock: number;
  name?: string; productName?: string; product_name?: string;
  title?: string; itemName?: string; item_name?: string;
  productTitle?: string; product_title?: string;
  label?: string; displayName?: string; display_name?: string;
  product?: string;
  sku?: string; code?: string; description?: string;
  ownershipType?: 'Credit' | 'Owned';
  [key: string]: any;
};
type Bill    = { id: string; amount: number; status?: string; vendor?: string; description?: string; dueDate?: string; };
type BalanceSheetReportProps = {
  transactions: Transaction[];
  banks: Bank[];
  loans: Loan[];
  products: Product[];
  onBack: () => void;
  bills?: Bill[];
  /** Needed for the receivable/payable figures: an unpaid invoice is money owed
   *  to us, and its supplier cost is money we owe — neither exists as a
   *  transaction until someone actually pays. */
  invoices?: any[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-AE', {
    style: 'currency', currency: 'AED', minimumFractionDigits: 0
  }).format(amount);

// Products can arrive with the display name under any of several field names.
// Try each in priority order before falling back to the id.
// NOTE: `description` is intentionally NOT in this list — it's not a name.
// ── Receivable / Payable ledger ─────────────────────────────────────────────
// Deliberately mirrors Accountspayablereceivablereport so the two pages cannot
// disagree:
//   SIDE   from the category text ("…Receivable" / "…Payable")
//   EFFECT from the cash direction — receivable rises on outflow, payable on inflow
//   AMOUNT is money that actually moved, matching the cash balance
// Balances net PER COUNTERPARTY, then only positives are summed on each side.
const sideOfCat = (v: unknown): 'receivable' | 'payable' | null => {
  const c = String(v || '').trim().toLowerCase();
  if (c.includes('receivable')) return 'receivable';
  if (c.includes('payable'))    return 'payable';
  return null;
};

const movedOf = (t: any): number => {
  const hasFields =
    t?.totalPaid !== undefined || t?.amountPaid !== undefined || t?.paymentStatus !== undefined;
  if (!hasFields) return Number(t?.amount) || 0;
  return Number(t?.totalPaid ?? t?.amountPaid ?? 0) || 0;
};

const partyOf = (t: any): string =>
  String(t?.subCategoryDetail || '').trim() ||
  String(t?.paidBy || t?.paidTo || t?.remitterName || '').trim() ||
  'Unassigned';

function buildArApRows(txns: any[], invoices: any[]) {
  const recv = new Map<string, number>();
  const pay  = new Map<string, number>();
  const receivableTxns: any[] = [];
  const payableTxns:    any[] = [];

  for (const t of txns || []) {
    const side = sideOfCat(t.subCategory) || sideOfCat(t.detailCategory);
    if (!side) continue;
    const moved = movedOf(t);
    if (moved === 0) continue;

    const isInflow = t.mainCategory === 'Cash Inflow';
    const signed   = (side === 'receivable' ? !isInflow : isInflow) ? moved : -moved;
    const party    = partyOf(t);

    if (side === 'receivable') {
      recv.set(party, (recv.get(party) || 0) + signed);
      receivableTxns.push(t);
    } else {
      pay.set(party, (pay.get(party) || 0) + signed);
      payableTxns.push(t);
    }
  }

  // An issued invoice is a receivable from the day it goes out, and its supplier
  // cost a payable — neither exists as a transaction until money moves.
  for (const inv of invoices || []) {
    const total = Number(inv?.totalAmount) || 0;
    const outstanding = total - (Number(inv?.paidAmount) || 0);
    if (total > 0 && outstanding > 0.01) {
      const name  = String(inv?.customerName || 'Unknown').trim();
      const phone = String(inv?.customerPhone || '').trim();
      const key   = phone ? `${name} (${phone})` : name;
      recv.set(key, (recv.get(key) || 0) + outstanding);
      receivableTxns.push({ ...inv, remainingAmount: outstanding });
    }

    const supplierTotal =
      Number(inv?.supplierCostTotal) ||
      (Array.isArray(inv?.products)
        ? inv.products.reduce(
            (sum: number, p: any) => sum + (Number(p?.supplierCost) || 0) * (Number(p?.quantity) || 0), 0)
        : 0);
    if (supplierTotal > 0) {
      const payments = Array.isArray(inv?.supplierPayments) ? inv.supplierPayments : [];
      const supplierPaid = payments.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0)
        || Number(inv?.supplierPaidAmount) || 0;
      const owed = supplierTotal - supplierPaid;
      if (owed > 0.01) {
        const key = `Futuristic — ${inv.invoiceNumber || inv.id}`;
        pay.set(key, (pay.get(key) || 0) + owed);
        payableTxns.push({ ...inv, remainingAmount: owed });
      }
    }
  }

  const sumPositive = (m: Map<string, number>) =>
    [...m.values()].reduce((s, v) => s + (v > 0 ? v : 0), 0);

  return { receivableTxns, payableTxns,
           totals: { receivable: sumPositive(recv), payable: sumPositive(pay) } };
}

const productDisplayName = (p: Product): string => {
  const cand =
    p.name || p.productName || p.product_name ||
    p.title || p.itemName || p.item_name ||
    p.productTitle || p.product_title ||
    p.label || p.displayName || p.display_name ||
    p.product ||
    p.sku || p.code;
  return (cand && String(cand).trim()) || p.id;
};

const SubTotal = ({ label, value, colorClass = 'bg-blue-50' }: { label: string; value: number; colorClass?: string }) => (
  <div className={`flex justify-between items-center py-3 ${colorClass} rounded-lg px-3 mt-2`}>
    <span className="font-semibold text-gray-900">{label}</span>
    <span className="font-bold text-lg text-gray-900">{formatCurrency(value)}</span>
  </div>
);

// ── Expandable line-item row ─────────────────────────────────────────────────
// Always expandable — even zero-value rows can be opened so users can verify
// there really are no underlying records. The `hasDetails` prop is accepted for
// backward compatibility but no longer disables the row.
const ExpandableRow = ({
  label, value, expanded, onToggle, note, children,
}: {
  label: string;
  value: number;
  expanded: boolean;
  onToggle: () => void;
  hasDetails?: boolean;
  note?: string;
  children?: React.ReactNode;
}) => (
  <div className="border-b border-gray-100">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex justify-between items-center py-2 text-left hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <span className="flex items-center gap-1.5 text-gray-700">
        {expanded
          ? <ChevronDown size={14} className="text-gray-400" />
          : <ChevronRight size={14} className="text-gray-400" />}
        {label}
        {note && <span className="text-[10px] text-gray-400 italic">· {note}</span>}
      </span>
      <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
    </button>
    {expanded && (
      <div className="ml-5 mb-3 pl-3 border-l-2 border-blue-100 py-2">
        {children}
      </div>
    )}
  </div>
);

const EmptyDetail = ({ text }: { text: string }) => (
  <p className="text-xs text-gray-400 italic py-2">{text}</p>
);

const DetailTable = ({
  headers, rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) => (
  <div className="overflow-x-auto rounded-md border border-gray-100">
    <table className="w-full text-xs">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((h, i) => (
            <th
              key={h}
              className={`px-2.5 py-1.5 font-semibold text-gray-500 uppercase tracking-wider ${
                i === headers.length - 1 ? 'text-right' : 'text-left'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {r.map((cell, j) => (
              <td
                key={j}
                className={`px-2.5 py-1.5 text-gray-700 ${
                  j === r.length - 1 ? 'text-right font-semibold text-gray-900 tabular-nums' : ''
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function BalanceSheetReport({ transactions, banks, loans, products, bills, invoices = [], onBack }: BalanceSheetReportProps) {
  // Bills were a prop nobody ever passed, so Pending Bills always read AED 0.
  const billsList = bills ?? [];
  // Cash in Hand must match the app's single source of truth (Dashboard /
  // Cash-in-Hand page): opening balance + the 'cash_transactions' ledger,
  // merged with any 'transactions' docs paid via Cash mode. Previously this
  // report only looked at the filtered `transactions` collection, silently
  // dropping the opening balance and every cash_transactions-only entry —
  // which is why Cash in Hand could show a wrong (even negative) figure that
  // didn't match the real balance shown elsewhere in the app.
  const [cashLedgerTxns, setCashLedgerTxns] = useState<any[]>([]);
  const [cashOpeningBalance, setCashOpeningBalance] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([
      CashFirebaseService.fetchAllCashTransactions(),
      CashFirebaseService.fetchAllCashRecords(),
    ]).then(([txns, records]) => {
      if (!alive) return;
      setCashLedgerTxns(txns);
      setCashOpeningBalance(records[0]?.balance || 0);
    }).catch(err => console.error('[BalanceSheet] cash ledger fetch failed:', err));
    return () => { alive = false; };
  }, []);

  const [showBSClassified, setShowBSClassified] = useState(true);
  const [expandedSubs,     setExpandedSubs]     = useState<Set<string>>(new Set());
  const [expandedRows,     setExpandedRows]     = useState<Set<string>>(new Set());

  const thisYear = new Date().getFullYear();
  const getTransactionLocation = (t: any): string => {
    const c = t.company || '';
    if (c.includes('Dubai'))         return 'Dubai';
    if (c.includes('Saudi Arabia'))  return 'Saudi Arabia';
    if (c.includes('Chad'))          return 'Chad';
    if (c.includes('Abu Dhabi'))     return 'Abu Dhabi';
    if (c.includes('Sharjah'))       return 'Sharjah';
    if (c.includes('Oman'))          return 'Oman';
    if (c.includes('Qatar'))         return 'Qatar';
    if (c.includes('Kuwait'))        return 'Kuwait';
    return '';
  };
  const LOCATIONS = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const l = getTransactionLocation(t); if (l) s.add(l); });
    return ['Dubai','Saudi Arabia','Chad','Abu Dhabi','Sharjah','Oman','Qatar','Kuwait'].filter(l => s.has(l));
  }, [transactions]);

  // ── Filter state ────────────────────────────────────────────────────────────
  type FilterMode = 'alltime' | 'yearly' | 'monthly' | 'custom';
  const [filterMode] = useState<FilterMode>('custom');   // only mode left
  const [selectedYears,     setSelectedYears]     = useState<number[]>([]);
  const [selectedMonths,    setSelectedMonths]    = useState<string[]>([]);
  const [customFrom,        setCustomFrom]        = useState('');
  const [customTo,          setCustomTo]          = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    transactions.forEach(t => {
      const y = parseInt((t.date || '').slice(0, 4));
      if (y > 2000 && y <= thisYear + 1) s.add(y);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const ym = (t.date || '').slice(0, 7); if (ym) s.add(ym); });
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const toggleYear     = (y: number) => setSelectedYears(p => p.includes(y) ? p.filter(v => v !== y) : [...p, y]);
  const toggleMonth    = (m: string) => setSelectedMonths(p => p.includes(m) ? p.filter(v => v !== m) : [...p, m]);
  const toggleLocation = (l: string) => setSelectedLocations(p => p.includes(l) ? p.filter(v => v !== l) : [...p, l]);
  const hasActiveFilter = filterMode !== 'alltime' || selectedLocations.length > 0;
  const isDateFiltered  = filterMode !== 'alltime';

  const resetFilters = () => {
    setSelectedYears([]); setSelectedMonths([]);
    setCustomFrom(''); setCustomTo(''); setSelectedLocations([]);
  };

  const modeBtnStyle = (mode: FilterMode): React.CSSProperties => ({
    padding: '6px 14px', fontSize: '12px', fontWeight: 600,
    borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
    background: filterMode === mode ? '#1e293b' : '#ffffff',
    color: filterMode === mode ? '#ffffff' : '#4b5563',
    borderColor: filterMode === mode ? '#1e293b' : '#d1d5db',
    boxShadow: filterMode === mode ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
  });

  const activePeriodLabel = () => {
    if (filterMode === 'alltime') return 'All Time';
    if (filterMode === 'yearly'  && selectedYears.length > 0)  return selectedYears.sort().join(', ');
    if (filterMode === 'monthly' && selectedMonths.length > 0) return selectedMonths.sort().map(monthLabel).join(', ');
    if (filterMode === 'custom'  && (customFrom || customTo))  return `${customFrom || '—'} → ${customTo || '—'}`;
    return 'All Time';
  };

  const toggleSub = (key: string) =>
    setExpandedSubs(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleRow = (key: string) =>
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Filtered transactions (approval + date + location) ─────────────────────
  const liquid = useMemo(() => {
    return transactions.filter(t => {
      const approved = t.approvalStatus === 'approved' || t.approvalStatus === 'not_required' || !t.approvalStatus;
      if (!approved) return false;

      const d = (t.date || '').slice(0, 10);

      // Date filter
      if (d) {
        if (filterMode === 'monthly' && selectedMonths.length > 0) {
          if (!selectedMonths.some(ym => d.startsWith(ym))) return false;
        } else if (filterMode === 'yearly' && selectedYears.length > 0) {
          if (!selectedYears.includes(parseInt(d.slice(0, 4)))) return false;
        } else if (filterMode === 'custom') {
          const from = customFrom || '2000-01-01';
          const to   = customTo   || '2099-12-31';
          if (d < from || d > to) return false;
        }
      }

      // Location filter
      if (selectedLocations.length > 0) {
        if (!selectedLocations.includes(getTransactionLocation(t))) return false;
      }

      return true;
    });
  }, [transactions, filterMode, selectedMonths, selectedYears, customFrom, customTo, selectedLocations]);

  // ── FULL BS Classification (manual + auto) ─────────────────────────────────
  const classifiedBS = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; txns: Transaction[]; manual: boolean[] }>>();
    for (const t of liquid) {
      const bucket = resolveBSBucket(t);
      if (!bucket) continue;

      if (!map.has(bucket.bsMain)) map.set(bucket.bsMain, new Map());
      const inner = map.get(bucket.bsMain)!;
      if (!inner.has(bucket.bsSub)) inner.set(bucket.bsSub, { total: 0, txns: [], manual: [] });
      const entry = inner.get(bucket.bsSub)!;
      entry.total += t.amount || 0;
      entry.txns.push(t);
      entry.manual.push(!!(t.bsMainCategory && t.bsSubCategory));
    }
    return map;
  }, [liquid]);

  // ── Manual-only for legacy panel (backwards compatible)
  const bsClassified = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; txns: Transaction[] }>>();
    for (const t of liquid) {
      if (!t.bsMainCategory || !t.bsSubCategory) continue;
      if (!map.has(t.bsMainCategory)) map.set(t.bsMainCategory, new Map());
      const inner = map.get(t.bsMainCategory)!;
      if (!inner.has(t.bsSubCategory)) inner.set(t.bsSubCategory, { total: 0, txns: [] });
      const entry = inner.get(t.bsSubCategory)!;
      entry.total += t.amount || 0;
      entry.txns.push(t);
    }
    return map;
  }, [liquid]);

  const bsClassifiedCount = useMemo(() => {
    let count = 0;
    bsClassified.forEach(inner => inner.forEach(v => { count += v.txns.length; }));
    return count;
  }, [bsClassified]);

  const bsSectionTotal = (main: string) => {
    const inner = bsClassified.get(main);
    if (!inner) return 0;
    let total = 0;
    inner.forEach(v => { total += v.total; });
    return total;
  };

  // ── Underlying detail lists (used both for expansion & PDF) ─────────────────
  const details = useMemo(() => {
    // Cash in Hand — a point-in-time balance (like Bank Balance), not a
    // period total, so it is built from the FULL (unfiltered) transaction
    // set — the date/location filters on this page apply to flows, not to
    // a snapshot balance.
    //
    // Source = 'cash_transactions' ledger + any 'transactions' doc paid via
    // Cash mode, merged and deduped exactly like useDashboardData /
    // useCashListViewModel do (the same sale can land in both collections
    // under different ids — "Invoice / Sale" + "Product sale received").
    const cashModeTxns = transactions.filter((t: any) => t.mode === 'Cash');
    const cashKeyOf = (t: any) => {
      const ref = (t.note || '').trim().toLowerCase();
      return ref ? `${ref}__${t.amount}` : `id__${t.id}`;
    };
    const seenCashKeys = new Set<string>();
    const mergedCashTxns: any[] = [];
    for (const t of [...cashLedgerTxns, ...cashModeTxns]) {
      const key = cashKeyOf(t);
      if (!seenCashKeys.has(key)) { seenCashKeys.add(key); mergedCashTxns.push(t); }
    }
    const cashInflowTxns  = mergedCashTxns.filter(t => t.mainCategory === 'Cash Inflow');
    const cashOutflowTxns = mergedCashTxns.filter(t => t.mainCategory === 'Cash Outflow');
    // Plain `amount`, matching BankingService.calculateCashStats — the same
    // figure the Dashboard and Cash-in-Hand page compute, not the invoice
    // totalPaid figure (cash_transactions docs don't carry payment-plan
    // fields, so totalPaid would wrongly read as 0 for them).
    const cashIn  = cashInflowTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const cashOut = cashOutflowTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    // Accounts Receivable / Payable — from filtered transactions with remaining amount
    const arAp = buildArApRows(liquid, invoices);
    const receivableTxns = arAp.receivableTxns;
    const payableTxns    = arAp.payableTxns;

    // Loans — current snapshot (unaffected by date range because loans have no txn date field)
    const loansReceivableList = loans.filter(l => l.type === 'Receivable' && l.status !== 'Full');
    const loansPayableList    = loans.filter(l => l.type === 'Payable'    && l.status !== 'Full');

    // Bills — current snapshot
    // Bill has no `status` field — it carries paymentStatus and remainingAmount.
    const pendingBillsList = billsList.filter(b => {
      const remaining = Number((b as any).remainingAmount);
      if (!isNaN(remaining)) return remaining > 0.01;
      return (Number((b as any).amount) || 0) - (Number((b as any).amountPaid) || 0) > 0.01;
    });

    // Inventory — current snapshot
    const inventoryList = products
      .map(p => ({
        ...p,
        displayName: productDisplayName(p),
        value: (p.costPrice || 0) * (p.stock || 0),
      }))
      .filter(p => p.value !== 0);

    return {
      cashInflowTxns, cashOutflowTxns, cashIn, cashOut,
      receivableTxns, payableTxns, arApTotals: arAp.totals,
      loansReceivableList, loansPayableList,
      pendingBillsList, inventoryList,
    };
  }, [liquid, transactions, cashLedgerTxns, loans, billsList, products, invoices]);

  const bs = useMemo(() => {
    // ── ASSETS ──────────────────────────────────────────────────────────────
    // Math.max(0, …) reported AED 0 whenever outflows exceeded inflows, hiding
    // the real position and breaking Assets = Liabilities + Equity.
    // Opening balance included — see the cash ledger fetch above. Without it
    // this figure could read a plausible-looking but wrong (even negative)
    // number that didn't match the Dashboard / Cash-in-Hand page.
    const cashInHand = cashOpeningBalance + details.cashIn - details.cashOut;

    // Bank balance: from banks collection — current snapshot.
    // Any account still stored in PKR is converted to AED, matching the
    // conversion useDashboardData applies for the stat cards — without this,
    // an unmigrated PKR balance would be added to the AED total as-is and
    // wildly overstate (or understate) the real position.
    const PKR_RATE = 279.5, AED_RATE = 3.67;
    const bankBalance = banks.reduce((s, b: any) => {
      const bal = b.balance || 0;
      const inAed = (b.currency === 'PKR' || b.accountCurrency === 'PKR')
        ? (bal / PKR_RATE * AED_RATE) : bal;
      return s + inAed;
    }, 0);

    // Accounts receivable — from filtered transactions
    const accountsReceivable = details.arApTotals.receivable;

    // Inventory value — split by ownership type.
    // 'Owned' (Against Payment) inventory was already paid for at entry, so it's
    // just an asset. 'Credit' inventory is also an asset (we hold the stock),
    // but its cost is still owed to the supplier — hence it also creates a
    // matching liability below (see inventoryCredit under LIABILITIES).
    const inventoryOwned  = details.inventoryList
      .filter(p => p.ownershipType !== 'Credit')
      .reduce((s, p) => s + p.value, 0);
    const inventoryCredit = details.inventoryList
      .filter(p => p.ownershipType === 'Credit')
      .reduce((s, p) => s + p.value, 0);
    const inventoryValue  = inventoryOwned + inventoryCredit;

    // Loans receivable
    const loansReceivable = details.loansReceivableList.reduce((s, l) => s + (l.remaining || 0), 0);

    // Manually classified assets not represented by the standard totals above
    const knownAssetBuckets = new Set(['Cash & Cash Equivalents', 'Inventory', 'Accounts Receivable', 'Loans Receivable']);
    const classifiedAssets = Array.from(classifiedBS.get('Assets')?.entries() || [])
      .filter(([sub]) => !knownAssetBuckets.has(sub))
      .reduce((sum, [, entry]) => sum + entry.total, 0);

    const totalCurrentAssets = cashInHand + bankBalance + accountsReceivable + inventoryValue + classifiedAssets;
    const totalFixedAssets   = 0;
    const totalAssets        = totalCurrentAssets + totalFixedAssets;

    // ── LIABILITIES ──────────────────────────────────────────────────────────
    const accountsPayable = details.arApTotals.payable;

    const loansPayable = details.loansPayableList
      .reduce((s, l) => s + (l.remaining || 0), 0);

    const pendingBills = details.pendingBillsList.reduce((s, b) => {
      const remaining = Number((b as any).remainingAmount);
      if (!isNaN(remaining)) return s + remaining;
      return s + ((Number((b as any).amount) || 0) - (Number((b as any).amountPaid) || 0));
    }, 0);

    const knownLiabilityBuckets = new Set(['Accounts Payable', 'Short-term Loans']);
    const classifiedLiabilities = Array.from(classifiedBS.get('Liabilities & Equity')?.entries() || [])
      .filter(([sub]) => !knownLiabilityBuckets.has(sub))
      .reduce((sum, [, entry]) => sum + entry.total, 0);

    const totalCurrentLiabilities = accountsPayable + inventoryCredit + classifiedLiabilities;
    const totalLiabilities        = totalCurrentLiabilities;

    // ── EQUITY ───────────────────────────────────────────────────────────────
    const totalEquity                 = totalAssets - totalLiabilities;
    const totalLiabilitiesAndEquity   = totalLiabilities + totalEquity;

    return {
      assets: {
        cashInHand, bankBalance, accountsReceivable,
        inventoryValue, inventoryOwned, inventoryCredit, loansReceivable,
        totalCurrentAssets, totalFixedAssets, totalAssets,
      },
      liabilities: {
        accountsPayable, inventoryCredit, loansPayable, pendingBills,
        totalCurrentLiabilities, totalLiabilities,
      },
      equity: { totalEquity },
      totalLiabilitiesAndEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1,
    };
  }, [details, banks, classifiedBS, cashOpeningBalance]);

  // ── PDF generation ─────────────────────────────────────────────────────────
  const generatePDF = () => {
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) {
      alert('Please allow pop-ups for this site to generate the PDF.');
      return;
    }

    const fmt = (n: number) => formatCurrency(n);
    const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

    // Cap detail rows per section so the PDF fits on one page.
    // Anything beyond this gets summarized as "+N more".
    const MAX_ROWS_PER_SECTION = 6;
    const detailTable = (headers: string[], rows: (string | number)[][]) => {
      if (rows.length === 0) return '<p class="empty">No records for this period.</p>';
      const shown = rows.slice(0, MAX_ROWS_PER_SECTION);
      const overflow = rows.length - shown.length;
      return `
        <table class="detail">
          <thead><tr>${headers.map((h, i) =>
            `<th class="${i === headers.length - 1 ? 'amt' : ''}">${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${shown.map(r =>
            `<tr>${r.map((c, i) =>
              `<td class="${i === r.length - 1 ? 'amt' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}
          ${overflow > 0 ? `<tr><td colspan="${headers.length}" style="text-align:center;color:#94a3b8;font-style:italic;padding:2px 4px;font-size:7.5px">+ ${overflow} more record${overflow === 1 ? '' : 's'} (see full report in-app)</td></tr>` : ''}
          </tbody>
        </table>`;
    };

    const cashRows: (string | number)[][] = [
      ['—', 'Opening Balance', '—', fmt(cashOpeningBalance)],
      ...details.cashInflowTxns.map(t => [(t.date || '').slice(0, 10), 'Inflow', t.company || '—', fmt(Number(t.amount) || 0)]),
      ...details.cashOutflowTxns.map(t => [(t.date || '').slice(0, 10), 'Outflow', t.company || '—', `- ${fmt(Number(t.amount) || 0)}`]),
    ];
    const bankRows      = banks.map((b: any) => {
      const isPKR = b.currency === 'PKR' || b.accountCurrency === 'PKR';
      const bal = b.balance || 0;
      const inAed = isPKR ? (bal / 279.5 * 3.67) : bal;
      return [b.name || '—', b.accountNumber ? '****' + b.accountNumber.slice(-4) : '—', fmt(inAed)];
    });
    const arRows        = details.receivableTxns.map(t => [(t.date || '').slice(0, 10), t.company || '—', fmt(t.amount || 0), fmt(t.remainingAmount || 0)]);
    const invRows       = details.inventoryList.map(p => [p.displayName, p.ownershipType === 'Credit' ? 'On Credit' : 'Payment Received', fmt(p.costPrice || 0), (p.stock || 0), fmt(p.value)]);
    const invCreditRows = details.inventoryList.filter(p => p.ownershipType === 'Credit').map(p => [p.displayName, fmt(p.costPrice || 0), (p.stock || 0), fmt(p.value)]);
    const loanRxRows    = details.loansReceivableList.map(l => [l.personName || l.borrowerName || l.description || l.id, fmt(l.loanAmount || 0), fmt(l.paid || 0), fmt(l.remaining || 0)]);
    const apRows        = details.payableTxns.map(t => [(t.date || '').slice(0, 10), t.company || '—', fmt(t.amount || 0), fmt(t.remainingAmount || 0)]);
    const loanPayRows   = details.loansPayableList.map(l => [l.personName || l.lenderName || l.description || l.id, fmt(l.loanAmount || 0), fmt(l.paid || 0), fmt(l.remaining || 0)]);
    const billRows      = details.pendingBillsList.map(b => [b.vendor || b.description || b.id, b.dueDate || '—', b.status, fmt(b.amount)]);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Balance Sheet — ${esc(activePeriodLabel())}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; padding: 6mm 8mm; background: #fff; font-size: 10px; line-height: 1.35; }
  h1 { font-size: 16px; margin: 0 0 2px 0; color: #0f172a; letter-spacing: -0.01em; }
  h2 { font-size: 12px; margin: 8px 0 5px 0; padding: 5px 10px; background: #0f172a; color: #fff; border-radius: 4px; letter-spacing: 0.02em; }
  h3 { font-size: 9.5px; margin: 6px 0 3px 0; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
  .meta { color: #64748b; font-size: 9.5px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 12px; }
  .meta strong { color: #0f172a; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
  .row .lbl { color: #475569; }
  .row .val { font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums; }
  .subtotal { display: flex; justify-content: space-between; padding: 5px 8px; margin-top: 4px; background: #eff6ff; border-radius: 4px; font-weight: 700; font-size: 10.5px; }
  .total { display: flex; justify-content: space-between; padding: 6px 10px; margin-top: 5px; background: linear-gradient(to right, #dbeafe, #f1f5f9); border-radius: 5px; font-weight: 700; font-size: 11.5px; color: #0f172a; border: 1px solid #93c5fd; }
  .total.liab { background: linear-gradient(to right, #dcfce7, #f0fdf4); border-color: #86efac; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  table.detail { width: 100%; border-collapse: collapse; margin: 2px 0 5px 0; font-size: 8.5px; }
  table.detail th { background: #f8fafc; padding: 2px 5px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.03em; font-size: 7.5px; }
  table.detail td { padding: 2px 5px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  table.detail th.amt, table.detail td.amt { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #0f172a; }
  .empty { font-size: 8.5px; color: #94a3b8; font-style: italic; margin: 2px 0; }
  .item { margin-bottom: 4px; page-break-inside: avoid; }
  .item-hdr { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; font-weight: 600; color: #0f172a; margin-bottom: 1px; }
  .verify { margin-top: 8px; padding: 6px 10px; text-align: center; border-radius: 5px; background: ${bs.balanced ? '#f0fdf4' : '#fefce8'}; border: 1px solid ${bs.balanced ? '#86efac' : '#fde68a'}; page-break-inside: avoid; }
  .verify h3 { color: #0f172a; margin: 0 0 3px 0; font-size: 10px; }
  .verify-grid { display: flex; justify-content: center; align-items: center; gap: 16px; font-size: 10px; }
  .verify-grid .eq { font-size: 14px; color: #94a3b8; }
  .verify-grid .num { font-size: 12px; font-weight: 700; color: #0f172a; }
  .footer { margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #94a3b8; }
  .snapshot-note { display: inline-block; font-size: 7.5px; color: #92400e; background: #fef3c7; padding: 0 4px; border-radius: 3px; margin-left: 4px; font-style: italic; font-weight: 500; }
  .cols > div { page-break-inside: avoid; }
  h2 { page-break-after: avoid; }
</style></head><body>
  <h1>Balance Sheet</h1>
  <div class="meta">
    <div>Period: <strong>${esc(activePeriodLabel())}</strong>${selectedLocations.length > 0 ? ` &nbsp;·&nbsp; Location: <strong>${esc(selectedLocations.join(', '))}</strong>` : ''}</div>
    <div>Generated ${esc(new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }))} &nbsp;·&nbsp; ${liquid.length} transactions in scope</div>
  </div>

  <div class="cols">
    <div>
      <h2>Assets</h2>

      <div class="item">
        <div class="item-hdr"><span>Cash in Hand</span><span>${fmt(bs.assets.cashInHand)}</span></div>
        ${detailTable(['Date', 'Type', 'Company', 'Amount'], cashRows)}
      </div>

      <div class="item">
        <div class="item-hdr"><span>Bank Balance<span class="snapshot-note">current snapshot</span></span><span>${fmt(bs.assets.bankBalance)}</span></div>
        ${detailTable(['Bank', 'Account', 'Balance'], bankRows)}
      </div>

      <div class="item">
        <div class="item-hdr"><span>Accounts Receivable</span><span>${fmt(bs.assets.accountsReceivable)}</span></div>
        ${detailTable(['Date', 'Company', 'Total', 'Outstanding'], arRows)}
      </div>

      <div class="item">
        <div class="item-hdr"><span>Inventory Stock Value<span class="snapshot-note">current snapshot</span></span><span>${fmt(bs.assets.inventoryValue)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:8.5px;color:#475569;margin-bottom:2px">
          <span>Payment Received: <strong>${fmt(bs.assets.inventoryOwned)}</strong></span>
          <span>On Credit: <strong>${fmt(bs.assets.inventoryCredit)}</strong></span>
        </div>
        ${detailTable(['Product', 'Ownership', 'Cost Price', 'Stock', 'Value'], invRows)}
      </div>


      <div class="subtotal"><span>Total Current Assets</span><span>${fmt(bs.assets.totalCurrentAssets)}</span></div>
      <div class="total"><span>TOTAL ASSETS</span><span>${fmt(bs.assets.totalAssets)}</span></div>
    </div>

    <div>
      <h2>Liabilities &amp; Equity</h2>

      <div class="item">
        <div class="item-hdr"><span>Accounts Payable</span><span>${fmt(bs.liabilities.accountsPayable)}</span></div>
        ${detailTable(['Date', 'Company', 'Total', 'Outstanding'], apRows)}
      </div>

      <div class="item">
        <div class="item-hdr"><span>Inventory On Credit<span class="snapshot-note">current snapshot</span></span><span>${fmt(bs.liabilities.inventoryCredit)}</span></div>
        ${detailTable(['Product', 'Cost Price', 'Stock', 'Value'], invCreditRows)}
      </div>

      <div class="subtotal"><span>Total Current Liabilities</span><span>${fmt(bs.liabilities.totalCurrentLiabilities)}</span></div>
      <div class="total liab"><span>TOTAL LIABILITIES</span><span>${fmt(bs.liabilities.totalLiabilities)}</span></div>

      <h3 style="margin-top:16px">Equity</h3>
      <div class="row"><span class="lbl">Owner's Equity (Assets − Liabilities)</span><span class="val">${fmt(bs.equity.totalEquity)}</span></div>
      <div class="subtotal" style="background:#dcfce7"><span>Total Equity</span><span>${fmt(bs.equity.totalEquity)}</span></div>

      <div class="total liab"><span>TOTAL LIABILITIES + EQUITY</span><span>${fmt(bs.totalLiabilitiesAndEquity)}</span></div>
    </div>
  </div>

  <div class="verify">
    <h3>Balance Verification</h3>
    <div class="verify-grid">
      <div><div style="color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:0.05em">Total Assets</div><div class="num">${fmt(bs.assets.totalAssets)}</div></div>
      <span class="eq">=</span>
      <div><div style="color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:0.05em">Liabilities + Equity</div><div class="num">${fmt(bs.totalLiabilitiesAndEquity)}</div></div>
    </div>
    <div style="margin-top:4px;font-size:9.5px;font-weight:600;color:${bs.balanced ? '#15803d' : '#a16207'}">
      ${bs.balanced ? '✓ Balance sheet is balanced' : '⚠ Minor rounding difference detected'}
    </div>
  </div>

  <div class="footer">This report was generated from live data as of ${esc(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }))}. Items marked "current snapshot" reflect present state and are not affected by the date filter.</div>
</body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();

    // Trigger print once the doc is ready
    const trigger = () => setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 350);
    if (win.document.readyState === 'complete') trigger();
    else win.addEventListener('load', trigger);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={generatePDF}
            title="Download this balance sheet as a PDF"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px 8px 8px',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: '0.015em',
              cursor: 'pointer',
              boxShadow: '0 4px 12px -2px rgba(220, 38, 38, 0.35), 0 1px 2px rgba(0,0,0,0.06)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(220, 38, 38, 0.45), 0 2px 4px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(220, 38, 38, 0.35), 0 1px 2px rgba(0,0,0,0.06)';
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28, height: 28,
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.20)',
            }}>
              <FileDown size={15} strokeWidth={2.5} />
            </span>
            <span>Generate PDF</span>
          </button>
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to Reports Hub
          </button>
        </div>
      </div>

      {/* One date range, nothing else. The old panel carried location chips,
          four period modes, year and month pickers and a summary line — five
          rows of controls above a report people open to read two numbers. */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 10,
        border: `1px solid ${customFrom || customTo ? '#4f46e5' : '#e2e8f0'}`,
        backgroundColor: '#fff', whiteSpace: 'nowrap',
      }}>
        <Calendar size={14} color={customFrom || customTo ? '#4f46e5' : '#94a3b8'} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Due Date from
        </span>
        <input type="date" value={customFrom} max={customTo || undefined}
          onChange={e => setCustomFrom(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 8px', fontSize: 12, color: '#0f172a', outline: 'none' }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>to</span>
        <input type="date" value={customTo} min={customFrom || undefined}
          onChange={e => setCustomTo(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 8px', fontSize: 12, color: '#0f172a', outline: 'none' }} />
        {(customFrom || customTo) && (
          <button onClick={() => { setCustomFrom(''); setCustomTo(''); }} title="Clear"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'inline-flex' }}>
            <X size={13} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── ASSETS ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ASSETS</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Assets</h3>
          <div className="space-y-0 mb-4">

            {/* Cash in Hand */}
            <ExpandableRow
              label="Cash in Hand"
              value={bs.assets.cashInHand}
              expanded={expandedRows.has('cashInHand')}
              onToggle={() => toggleRow('cashInHand')}
              hasDetails={details.cashInflowTxns.length + details.cashOutflowTxns.length > 0}
              note="current snapshot"
            >
              <div className="text-xs text-gray-600 mb-2 flex justify-between flex-wrap gap-1">
                <span>Opening Balance: <strong className="text-gray-900">{formatCurrency(cashOpeningBalance)}</strong></span>
                <span>Cash Inflows: <strong className="text-green-700">{formatCurrency(details.cashIn)}</strong></span>
                <span>Cash Outflows: <strong className="text-red-700">{formatCurrency(details.cashOut)}</strong></span>
              </div>
              {(details.cashInflowTxns.length + details.cashOutflowTxns.length) > 0 ? (
                <DetailTable
                  headers={['Date', 'Type', 'Company', 'Amount']}
                  rows={[
                    ...details.cashInflowTxns.map(t => [
                      (t.date || '').slice(0, 10),
                      'Inflow',
                      t.company || '—',
                      formatCurrency(Number(t.amount) || 0),
                    ]),
                    ...details.cashOutflowTxns.map(t => [
                      (t.date || '').slice(0, 10),
                      'Outflow',
                      t.company || '—',
                      `- ${formatCurrency(Number(t.amount) || 0)}`,
                    ]),
                  ]}
                />
              ) : <EmptyDetail text="No cash transactions on record." />}
            </ExpandableRow>

            {/* Bank Balance */}
            <ExpandableRow
              label="Bank Balance"
              value={bs.assets.bankBalance}
              expanded={expandedRows.has('bankBalance')}
              onToggle={() => toggleRow('bankBalance')}
              hasDetails={banks.length > 0}
              note="current snapshot"
            >
              {banks.length > 0 ? (
                <DetailTable
                  headers={['Bank', 'Account', 'Balance (AED)']}
                  rows={banks.map((b: any) => {
                    const isPKR = b.currency === 'PKR' || b.accountCurrency === 'PKR';
                    const bal = b.balance || 0;
                    const inAed = isPKR ? (bal / 279.5 * 3.67) : bal;
                    return [
                      b.name || '—',
                      b.accountNumber ? '****' + b.accountNumber.slice(-4) : '—',
                      isPKR ? `${formatCurrency(inAed)} (PKR ${bal.toLocaleString()})` : formatCurrency(bal),
                    ];
                  })}
                />
              ) : <EmptyDetail text="No bank accounts on file." />}
            </ExpandableRow>

            {/* Accounts Receivable */}
            <ExpandableRow
              label="Accounts Receivable"
              value={bs.assets.accountsReceivable}
              expanded={expandedRows.has('accountsReceivable')}
              onToggle={() => toggleRow('accountsReceivable')}
              hasDetails={details.receivableTxns.length > 0}
            >
              {details.receivableTxns.length > 0 ? (
                <DetailTable
                  headers={['Date', 'Company', 'Total', 'Outstanding']}
                  rows={details.receivableTxns.map(t => [
                    (t.date || '').slice(0, 10),
                    t.company || '—',
                    formatCurrency(t.amount || 0),
                    formatCurrency(t.remainingAmount || 0),
                  ])}
                />
              ) : <EmptyDetail text="No outstanding receivables in this period." />}
            </ExpandableRow>

            {/* Inventory */}
            <ExpandableRow
              label="Inventory Stock Value"
              value={bs.assets.inventoryValue}
              expanded={expandedRows.has('inventoryValue')}
              onToggle={() => toggleRow('inventoryValue')}
              hasDetails={details.inventoryList.length > 0}
              note="current snapshot"
            >
              <div className="space-y-0">
                {/* Payment Received — its own dropdown with history */}
                <ExpandableRow
                  label="Payment Received"
                  value={bs.assets.inventoryOwned}
                  expanded={expandedRows.has('inventoryOwned')}
                  onToggle={() => toggleRow('inventoryOwned')}
                  hasDetails={details.inventoryList.some(p => p.ownershipType !== 'Credit')}
                >
                  {details.inventoryList.some(p => p.ownershipType !== 'Credit') ? (
                    <DetailTable
                      headers={['Product', 'Cost Price', 'Stock', 'Value']}
                      rows={details.inventoryList
                        .filter(p => p.ownershipType !== 'Credit')
                        .map(p => [
                          p.displayName,
                          formatCurrency(p.costPrice || 0),
                          (p.stock || 0),
                          formatCurrency(p.value),
                        ])}
                    />
                  ) : <EmptyDetail text="No inventory paid for against payment." />}
                </ExpandableRow>

                {/* On Credit — its own dropdown with history */}
                <ExpandableRow
                  label="On Credit"
                  value={bs.assets.inventoryCredit}
                  expanded={expandedRows.has('inventoryCreditAsset')}
                  onToggle={() => toggleRow('inventoryCreditAsset')}
                  hasDetails={details.inventoryList.some(p => p.ownershipType === 'Credit')}
                >
                  {details.inventoryList.some(p => p.ownershipType === 'Credit') ? (
                    <DetailTable
                      headers={['Product', 'Cost Price', 'Stock', 'Value']}
                      rows={details.inventoryList
                        .filter(p => p.ownershipType === 'Credit')
                        .map(p => [
                          p.displayName,
                          formatCurrency(p.costPrice || 0),
                          (p.stock || 0),
                          formatCurrency(p.value),
                        ])}
                    />
                  ) : <EmptyDetail text="No inventory taken on credit." />}
                </ExpandableRow>
              </div>
            </ExpandableRow>

          </div>
          <SubTotal label="Total Current Assets" value={bs.assets.totalCurrentAssets} colorClass="bg-blue-50" />

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b border-gray-200 pb-2">Fixed Assets</h3>
          <p className="text-sm text-gray-400 italic mb-3">Fixed asset module not yet active</p>
          <SubTotal label="Total Fixed Assets" value={bs.assets.totalFixedAssets} colorClass="bg-blue-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Assets</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* ── LIABILITIES & EQUITY ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LIABILITIES & EQUITY</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Liabilities</h3>
          <div className="space-y-0 mb-4">

            {/* Accounts Payable */}
            <ExpandableRow
              label="Accounts Payable (Pending)"
              value={bs.liabilities.accountsPayable}
              expanded={expandedRows.has('accountsPayable')}
              onToggle={() => toggleRow('accountsPayable')}
              hasDetails={details.payableTxns.length > 0}
            >
              {details.payableTxns.length > 0 ? (
                <DetailTable
                  headers={['Date', 'Company', 'Total', 'Outstanding']}
                  rows={details.payableTxns.map(t => [
                    (t.date || '').slice(0, 10),
                    t.company || '—',
                    formatCurrency(t.amount || 0),
                    formatCurrency(t.remainingAmount || 0),
                  ])}
                />
              ) : <EmptyDetail text="No outstanding payables in this period." />}
            </ExpandableRow>

            {/* Inventory On Credit */}
            <ExpandableRow
              label="Inventory On Credit"
              value={bs.liabilities.inventoryCredit}
              expanded={expandedRows.has('inventoryCreditLiability')}
              onToggle={() => toggleRow('inventoryCreditLiability')}
              hasDetails={details.inventoryList.some(p => p.ownershipType === 'Credit')}
              note="current snapshot"
            >
              {details.inventoryList.some(p => p.ownershipType === 'Credit') ? (
                <DetailTable
                  headers={['Product', 'Cost Price', 'Stock', 'Value']}
                  rows={details.inventoryList
                    .filter(p => p.ownershipType === 'Credit')
                    .map(p => [
                      p.displayName,
                      formatCurrency(p.costPrice || 0),
                      (p.stock || 0),
                      formatCurrency(p.value),
                    ])}
                />
              ) : <EmptyDetail text="No inventory taken on credit." />}
            </ExpandableRow>

          </div>
          <SubTotal label="Total Current Liabilities" value={bs.liabilities.totalCurrentLiabilities} colorClass="bg-red-50" />

          <div className="mt-4 mb-6">
            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Liabilities</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(bs.liabilities.totalLiabilities)}</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Equity</h3>
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Owner's Equity (Assets − Liabilities)</span>
              <span className={`font-medium ${bs.equity.totalEquity >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(bs.equity.totalEquity)}
              </span>
            </div>
          </div>
          <SubTotal label="Total Equity" value={bs.equity.totalEquity} colorClass="bg-green-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Liabilities & Equity</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual BS Classification Panel ── */}
      {bsClassifiedCount > 0 && (
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
          <button
            onClick={() => setShowBSClassified(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-200" />
              <h2 className="text-base font-bold text-gray-100">
                Balance Sheet — Manual Classification
              </h2>
              <span className="bg-gray-800 text-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                {bsClassifiedCount} transactions
              </span>
            </div>
            {showBSClassified
              ? <ChevronUp size={20} className="text-gray-400" />
              : <ChevronDown size={20} className="text-gray-400" />
            }
          </button>
          {showBSClassified && (
            <div className="p-5 border-t border-gray-800 space-y-6">
              <p className="text-xs text-gray-400">
                Transactions with a manual Balance Sheet category override set in the transaction form.
                These reflect your deliberate classification and are shown here for reporting.
              </p>

              {Array.from(bsClassified.entries()).map(([mainCat, subMap]) => (
                <div key={mainCat}>
                  <div className={`flex justify-between items-center px-3 py-2 rounded-lg mb-3 font-semibold text-sm ${
                    mainCat === 'Assets' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <span>{mainCat}</span>
                    <span>{formatCurrency(bsSectionTotal(mainCat))}</span>
                  </div>
                  {Array.from(subMap.entries()).map(([subCat, { total, txns }]) => {
                    const key      = `${mainCat}__${subCat}`;
                    const expanded = expandedSubs.has(key);
                    return (
                    <div key={subCat} className="mb-4">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200 mb-2">
                        <span className="text-sm font-medium text-gray-700">{subCat}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
                      </div>
                      <button
                        onClick={() => toggleSub(key)}
                        className="text-xs text-slate-600 hover:text-slate-800 mb-2 flex items-center gap-1"
                      >
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {txns.length} transaction{txns.length !== 1 ? 's' : ''}
                      </button>
                      {expanded && (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {['Date', 'Company', 'Sub Category', 'Amount'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {txns.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{(t.date || '').slice(0, 10)}</td>
                                  <td className="px-3 py-2 text-gray-700">{t.company || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">{t.subCategory}</td>
                                  <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(t.amount || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance verification */}
      <div className={`rounded-xl p-6 border text-center ${bs.balanced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Balance Verification</h3>
        <div className="flex items-center justify-center gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</p>
          </div>
          <span className="text-2xl text-gray-400">=</span>
          <div>
            <p className="text-xs text-gray-500 mb-1">Liabilities + Equity</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</p>
          </div>
        </div>
        <p className={`text-sm mt-3 font-medium ${bs.balanced ? 'text-green-600' : 'text-yellow-700'}`}>
          {bs.balanced ? '✓ Balance sheet is balanced' : '⚠ Minor rounding difference detected'}
        </p>
      </div>
     </div>
  );
}