// Accounts Payable & Receivable — unified report
// Replaces AccountsPayableReport.tsx + AccountsReceivableReport.tsx
//
// WHY MERGED
// ──────────
// AP and AR are the same ledger viewed from two sides. Keeping them apart meant
// two copies of the classifier, two copies of the date filter, two copies of the
// CSV exporter — and no way to see that a counterparty who owes us 50,000 is
// also owed 30,000 by us. The combined view nets that out.
//
// CLASSIFICATION MODEL
// ────────────────────
// A transaction lands in this report when we can determine its SIDE:
//
//   receivable → someone owes us
//   payable    → we owe someone
//
// The side comes from the transaction's classification fields, never from the
// cash direction. The EFFECT (does the balance go up or down?) comes from the
// cash direction:
//
//   ┌─────────────┬──────────────┬──────────────┐
//   │             │ Cash Outflow │ Cash Inflow  │
//   ├─────────────┼──────────────┼──────────────┤
//   │ receivable  │  INCREASE    │  DECREASE    │  we lend → they repay
//   │ payable     │  DECREASE    │  INCREASE    │  we repay → they lend
//   └─────────────┴──────────────┴──────────────┘
//
// This 2×2 is what the old files got wrong. They hardcoded one keyword list per
// direction, so `Cash Outflow + "Account Payable"` (paying down a payable — the
// single most common AP movement) matched nothing and was silently dropped, as
// was `Cash Outflow + "Account Receivable"`. Both are now handled.
//
// BALANCE vs PERIOD
// ─────────────────
// AP/AR are point-in-time balances, not period flows. The old reports applied a
// date range to the balance itself, so picking "This month" on a loan advanced
// in January and repaid in March showed a repayment with no matching advance and
// reported the counterparty as overpaid. Here the date controls are:
//
//   As of      — balances include every movement up to this date
//   Activity   — movements before this date fold into an Opening balance
//
// Closing = Opening + Increases − Decreases, which always ties out.
//
// SIGN CONVENTION
// ───────────────
// Throughout the combined view, positive is in our favour: a positive net means
// the counterparty owes us, negative means we owe them.

import React, { useMemo, useState } from 'react';
import {
  ChevronRight, TrendingUp, TrendingDown, Users, Clock, AlertTriangle,
  Download, Calendar, Layers, Minimize2, Maximize2, Scale, Search, Info,
  Receipt, Wallet, FileText,
} from 'lucide-react';
import { Transaction } from '../../modules/transactions/models/types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

/** Grouped views (one row per counterparty). */
export type ArApTab = 'combined' | 'receivable' | 'payable';
/** All views, including the flat transaction ledger. */
export type ArApView = 'ledger' | ArApTab;

interface Props {
  transactions: Transaction[];
  /**
   * Invoice records. Used to fill the Invoice Details column with the customer
   * name and outstanding balance. Optional — without it the report falls back
   * to whatever the transaction itself carries in `detailCategory` /
   * `remainingAmount`, which the bridge service already populates.
   */
  invoices?: any[];
  onBack?: () => void;
  /** Which view opens first. */
  defaultTab?: ArApView;
  /** Display currency label. */
  currency?: string;
  /**
   * Wires the "Record Payment" column to your existing payment flow. Left
   * unset, the column renders the row's status as read-only text instead of an
   * action, so the report is never a dead button.
   */
  onRecordPayment?: (row: LedgerRow) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type Side = 'receivable' | 'payable';
type Effect = 'increase' | 'decrease';
type Bucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';
type Basis = 'settled' | 'gross';

interface Movement {
  id: string;
  txnRef: string;
  date: string;
  side: Side;
  effect: Effect;
  amount: number;
  grossAmount: number;
  counterparty: string;
  counterpartyKey: string;
  category: string;
  mode?: string;
  note?: string;
  dueDate?: string;
  isPartial: boolean;
  company?: string;
}

interface AgingLots {
  buckets: Record<Bucket, number>;
  oldestAgeDays: number;
}

interface SideBalance {
  opening: number;
  increases: number;
  decreases: number;
  closing: number;
  movements: Movement[];
  aging: AgingLots;
}

interface PartyRow {
  key: string;
  name: string;
  receivable: SideBalance;
  payable: SideBalance;
  /** Positive = they owe us. Negative = we owe them. */
  net: number;
  movementCount: number;
}

const EMPTY_BUCKETS = (): Record<Bucket, number> =>
  ({ current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 });

const emptySide = (): SideBalance => ({
  opening: 0, increases: 0, decreases: 0, closing: 0,
  movements: [], aging: { buckets: EMPTY_BUCKETS(), oldestAgeDays: 0 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Classification vocabulary
//
// Sorted longest-first at module load so the most specific phrase always wins.
// "loan repayment received" must beat "loan repayment", or money coming back to
// us gets booked as us paying someone down.
// ─────────────────────────────────────────────────────────────────────────────

interface SideToken { token: string; side: Side }

// Declared before sorting: calling .sort() on the literal defeats contextual
// typing, so `side` would widen to `string` and fail the SideToken annotation.
const SIDE_TOKEN_LIST: SideToken[] = [
  // ── Receivable: someone owes us ────────────────────────────────────────────
  { token: 'loan repayment received', side: 'receivable' },
  { token: 'loan paid to employee',   side: 'receivable' },
  { token: 'accounts receivable',     side: 'receivable' },
  { token: 'account receivable',      side: 'receivable' },
  { token: 'loans receivable',        side: 'receivable' },
  { token: 'loan receivable',         side: 'receivable' },
  { token: 'loan disbursed',          side: 'receivable' },
  { token: 'loan recovered',          side: 'receivable' },
  { token: 'loan recovery',           side: 'receivable' },
  { token: 'loan collected',          side: 'receivable' },
  { token: 'advance given',           side: 'receivable' },
  { token: 'loan issued',             side: 'receivable' },
  { token: 'loan given',              side: 'receivable' },
  { token: 'receivable',              side: 'receivable' },

  // ── Payable: we owe someone ────────────────────────────────────────────────
  { token: 'loan received - from employee', side: 'payable' },
  { token: 'loan received - from company',  side: 'payable' },
  { token: 'accounts payable',        side: 'payable' },
  { token: 'account payable',         side: 'payable' },
  { token: 'loan repayment',          side: 'payable' },
  { token: 'loans payable',           side: 'payable' },
  { token: 'loan borrowed',           side: 'payable' },
  { token: 'loan received',           side: 'payable' },
  { token: 'loan returned',           side: 'payable' },
  { token: 'loan payable',            side: 'payable' },
  { token: 'loan payback',            side: 'payable' },
  { token: 'loan repaid',             side: 'payable' },
  { token: 'loan taken',              side: 'payable' },
  { token: 'payable',                 side: 'payable' },
];

const SIDE_TOKENS: SideToken[] =
  [...SIDE_TOKEN_LIST].sort((a, b) => b.token.length - a.token.length);

// Sub-categories that are loan-shaped but carry no side of their own
// ('Official Loan', 'Personal loan', 'Other loan - Full', …). These fall through
// to the structured-field resolver below.
const AMBIGUOUS_LOAN = /\bloan\b/;

const CASH_IN_TOKENS  = ['received', 'recovered', 'recovery', 'collected', 'borrowed', 'taken', 'inflow', 'credit'];
const CASH_OUT_TOKENS = ['given', 'issued', 'disbursed', 'repaid', 'returned', 'payback', 'paid', 'outflow', 'debit'];

// Approval states that must never reach a financial statement.
const EXCLUDED_APPROVAL = new Set(['pending_approval', 'rejected']);

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const numOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmt = (n: number) =>
  num(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

const today = () => new Date().toISOString().slice(0, 10);

const daysBetween = (iso: string, ref: string): number => {
  if (!iso) return 0;
  const a = new Date(iso), b = new Date(ref);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86_400_000));
};

const norm = (v: any) => String(v ?? '').trim().toLowerCase();

const cleanName = (v: any): string => String(v ?? '').trim().replace(/\s+/g, ' ');

const bucketOf = (ageDays: number): Bucket =>
  ageDays <= 0  ? 'current' :
  ageDays <= 30 ? '1-30'    :
  ageDays <= 60 ? '31-60'   :
  ageDays <= 90 ? '61-90'   : '90+';

const csvCell = (v: any): string => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ─────────────────────────────────────────────────────────────────────────────
// Classification engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Only structured classification fields are scanned. The old reports walked
 * EVERY string on the transaction — including `note`, `paidBy`, `paidTo` and
 * `company` — so a note reading "cleared before the loan given last month"
 * booked a receivable, and a supplier literally named "Payable Traders" became
 * a lender. Notes are for humans; categories are for the ledger.
 */
const classificationText = (t: any): string => [
  t.subCategory, t.subCategoryDetail, t.detailCategory,
  t.mainCategory, t.plSubCategory, t.bsSubCategory,
].filter(Boolean).map(norm).join(' | ');

/** Longest-match wins — see the SIDE_TOKENS comment. */
const sideFromText = (text: string): Side | null => {
  for (const t of SIDE_TOKENS) if (text.includes(t.token)) return t.side;
  return null;
};

/**
 * Cash direction. `mainCategory` is authoritative when it says Inflow/Outflow,
 * but the schema has a THIRD main category — 'Loan' — and the old reports
 * returned null for it, silently discarding every transaction filed under the
 * one category most likely to belong in this report.
 */
export const detectDirection = (t: any): 'inflow' | 'outflow' | null => {
  const main = norm(t.mainCategory);
  if (main.includes('outflow')) return 'outflow';
  if (main.includes('inflow'))  return 'inflow';

  // mainCategory === 'Loan' (or anything else): read the verb off the category path.
  const text = classificationText(t);
  const inHit  = CASH_IN_TOKENS.find(k => text.includes(k));
  const outHit = CASH_OUT_TOKENS.find(k => text.includes(k));
  if (inHit && !outHit)  return 'inflow';
  if (outHit && !inHit)  return 'outflow';

  // Last resort: who was on the other end of the money.
  const paidTo = cleanName(t.paidTo), paidBy = cleanName(t.paidBy);
  if (paidTo && !paidBy) return 'outflow';
  if (paidBy && !paidTo) return 'inflow';
  return null;
};

/** Side resolution, most-trustworthy signal first. */
const detectSide = (t: any, direction: 'inflow' | 'outflow' | null): Side | null => {
  // 1. Explicit structured field written by the loans module.
  const lt = norm(t.loanType);
  if (lt === 'receivable') return 'receivable';
  if (lt === 'payable')    return 'payable';

  // 2. Category vocabulary.
  const text = classificationText(t);
  const fromText = sideFromText(text);
  if (fromText) return fromText;

  // 3. Loan-shaped but unsided ('Official Loan', 'Personal loan', 'Other loan…').
  const isLoanish = norm(t.linkedType) === 'loan' || AMBIGUOUS_LOAN.test(text);
  if (!isLoanish) return null;

  if (cleanName(t.borrowerName)) return 'receivable';
  if (cleanName(t.lenderName))   return 'payable';

  // Money out on a loan = we lent it. Money in = we borrowed it.
  if (direction === 'outflow') return 'receivable';
  if (direction === 'inflow')  return 'payable';
  return null;
};

/**
 * How much money actually moved.
 *
 * `amount` is the face value of the obligation. When a transaction is only
 * partially settled, the cash that changed hands is `amountPaid` / `totalPaid` /
 * the sum of `partialPayments`. The old reports always used `amount`, which
 * overstated both sides of the ledger on every partial payment in the system.
 *
 * The report exposes this as the "Basis" toggle: `gross` values the obligation,
 * `settled` values the cash. Settled is the default because that is what
 * reconciles against bank and cash balances.
 */
export const settledAmount = (t: any): number => {
  const gross = num(t.amount);
  const partialSum = Array.isArray(t.partialPayments)
    ? t.partialPayments.reduce((s: number, p: any) => s + num(p?.amount), 0)
    : 0;

  const totalPaid  = numOrNull(t.totalPaid);
  const amountPaid = numOrNull(t.amountPaid);
  const best = Math.max(partialSum, totalPaid ?? 0, amountPaid ?? 0);

  if (norm(t.paymentStatus) === 'partial') {
    // A partial with no recorded payment figure is bad data; fall back to gross
    // rather than dropping the obligation off the report entirely.
    return best > 0 ? best : gross;
  }
  // Fully settled or untracked: prefer a recorded figure, else face value.
  if (totalPaid !== null || amountPaid !== null || partialSum > 0) {
    return best > 0 ? best : gross;
  }
  return gross;
};

/** Counterparty name, chosen by which end of the transaction they sat on. */
const detectCounterparty = (t: any, side: Side, effect: Effect): string => {
  const named = side === 'receivable' ? cleanName(t.borrowerName) : cleanName(t.lenderName);
  if (named) return named;

  // Receivable increase / payable decrease = money left us → the recipient.
  // Receivable decrease / payable increase = money reached us → the sender.
  const moneyLeftUs = effect === (side === 'receivable' ? 'increase' : 'decrease');

  const candidate = moneyLeftUs
    ? cleanName(t.paidTo) || cleanName(t.accountablePerson) || cleanName(t.employeeName)
    : cleanName(t.paidBy) || cleanName(t.remitterName) || cleanName(t.employeeName);

  // Deliberately NOT falling back to `company` or `note`. `company` is the
  // branch that booked the entry, not the counterparty — using it collapsed
  // every unnamed entry into a fake "Bullion Electronics - Dubai" debtor. `note`
  // is free text, so it shattered one real counterparty into a dozen rows.
  return candidate || 'Unallocated';
};

const isExcluded = (t: any): boolean => {
  if (EXCLUDED_APPROVAL.has(norm(t.approvalStatus))) return true;
  // Deletes are soft — the list view calls them "archived". Archived rows stay
  // in the collection, so a report that does not filter them double-counts.
  if (t.isDeleted === true || t.deleted === true || t.archived === true) return true;
  if (t.deletedAt) return true;
  if (norm(t.status) === 'deleted' || norm(t.status) === 'archived') return true;
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// Aging — FIFO lot consumption
//
// Decreases are applied against increases oldest-first. Whatever remains open is
// aged individually, so a party with a 90-day-old 10,000 and a fresh 50,000 shows
// 10,000 in the 90+ bucket and 50,000 in Current — not 60,000 in one bucket,
// which is what bucketing the whole net by the oldest date produced before.
// ─────────────────────────────────────────────────────────────────────────────

function computeAging(movements: Movement[], opening: number, asOf: string): AgingLots {
  const buckets = EMPTY_BUCKETS();
  let oldestAgeDays = 0;

  const increases = movements
    .filter(m => m.effect === 'increase')
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const decreaseTotal = movements
    .filter(m => m.effect === 'decrease')
    .reduce((s, m) => s + m.amount, 0);

  // An opening balance is an aggregate with no lot detail. Treat it as the
  // oldest lot so it is consumed first and aged against the window start.
  const lots: { date: string; dueDate?: string; amount: number }[] = [];
  if (opening > 0) lots.push({ date: '', amount: opening });
  for (const m of increases) lots.push({ date: m.date, dueDate: m.dueDate, amount: m.amount });

  let toConsume = decreaseTotal;
  for (const lot of lots) {
    if (toConsume >= lot.amount) { toConsume -= lot.amount; continue; }
    const open = lot.amount - toConsume;
    toConsume = 0;

    // A due date means age is days PAST DUE — an invoice due next month is not
    // overdue no matter how long ago it was raised.
    const anchor = lot.dueDate || lot.date;
    const age = anchor ? daysBetween(anchor, asOf) : 0;
    const effectiveAge = lot.dueDate && new Date(lot.dueDate) > new Date(asOf) ? 0 : age;

    buckets[bucketOf(effectiveAge)] += open;
    if (effectiveAge > oldestAgeDays) oldestAgeDays = effectiveAge;
  }

  return { buckets, oldestAgeDays };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger builder
// ─────────────────────────────────────────────────────────────────────────────

interface Ledger {
  parties: PartyRow[];
  totals: {
    receivable: number;
    payable: number;
    net: number;
    partyCount: number;
    receivableParties: number;
    payableParties: number;
    overdue: number;
    critical: number;
  };
  aging: { receivable: Record<Bucket, number>; payable: Record<Bucket, number> };
  diagnostics: { skippedPendingApproval: number; unclassifiedLoanLike: number; unallocated: number };
}

export function buildLedger(
  transactions: Transaction[],
  opts: { from: string; asOf: string; basis: Basis },
): Ledger {
  const { from, asOf, basis } = opts;

  const inWindow: Movement[] = [];
  const priorBySideAndParty = new Map<string, number>();  // `${key}|${side}` → signed prior balance
  const partyNames = new Map<string, string>();

  let skippedPendingApproval = 0;
  let unclassifiedLoanLike = 0;

  for (const raw of transactions || []) {
    const t = raw as any;

    if (EXCLUDED_APPROVAL.has(norm(t.approvalStatus))) { skippedPendingApproval++; continue; }
    if (isExcluded(t)) continue;

    const direction = detectDirection(t);
    const side = detectSide(t, direction);

    if (!side) continue;
    if (!direction) {
      // Recognisably a loan/AR/AP entry, but we cannot tell which way the money
      // went. Surfaced in the diagnostics chip instead of vanishing silently.
      unclassifiedLoanLike++;
      continue;
    }

    const date = String(t.date || '').slice(0, 10);
    if (!date || date > asOf) continue;

    const effect: Effect =
      side === 'receivable'
        ? (direction === 'outflow' ? 'increase' : 'decrease')
        : (direction === 'inflow'  ? 'increase' : 'decrease');

    const gross = num(t.amount);
    const amount = basis === 'gross' ? gross : settledAmount(t);
    if (amount === 0) continue;

    const name = detectCounterparty(t, side, effect);
    const key = name.toLowerCase();
    if (!partyNames.has(key)) partyNames.set(key, name);

    if (date < from) {
      // Folds into the opening balance rather than being discarded.
      const pk = `${key}|${side}`;
      const signed = effect === 'increase' ? amount : -amount;
      priorBySideAndParty.set(pk, (priorBySideAndParty.get(pk) || 0) + signed);
      continue;
    }

    inWindow.push({
      id: String(t.id || `${t.transactionId}-${date}-${amount}`),
      txnRef: String(t.transactionId || ''),
      date,
      side,
      effect,
      amount,
      grossAmount: gross,
      counterparty: name,
      counterpartyKey: key,
      category: String(t.subCategoryDetail || t.subCategory || t.detailCategory || ''),
      mode: t.mode,
      note: t.note,
      dueDate: t.dueDate || t.expectedReturnDate || undefined,
      isPartial: norm(t.paymentStatus) === 'partial',
      company: t.branchName || t.company,
    });
  }

  inWindow.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // Every party that has either window activity or an opening balance.
  const keys = new Set<string>([
    ...inWindow.map(m => m.counterpartyKey),
    ...Array.from(priorBySideAndParty.keys()).map(k => k.split('|')[0]),
  ]);

  const parties: PartyRow[] = Array.from(keys).map(key => {
    const name = partyNames.get(key) || key;
    const mine = inWindow.filter(m => m.counterpartyKey === key);

    const build = (side: Side): SideBalance => {
      const movements = mine.filter(m => m.side === side);
      const opening = priorBySideAndParty.get(`${key}|${side}`) || 0;
      const increases = movements.filter(m => m.effect === 'increase').reduce((s, m) => s + m.amount, 0);
      const decreases = movements.filter(m => m.effect === 'decrease').reduce((s, m) => s + m.amount, 0);
      const closing = opening + increases - decreases;
      return {
        opening, increases, decreases, closing, movements,
        aging: closing > 0
          ? computeAging(movements, opening, asOf)
          : { buckets: EMPTY_BUCKETS(), oldestAgeDays: 0 },
      };
    };

    const receivable = build('receivable');
    const payable = build('payable');

    return {
      key, name, receivable, payable,
      net: receivable.closing - payable.closing,
      movementCount: mine.length,
    };
  }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name));

  const aging = { receivable: EMPTY_BUCKETS(), payable: EMPTY_BUCKETS() };
  for (const p of parties) {
    (Object.keys(aging.receivable) as Bucket[]).forEach(b => {
      aging.receivable[b] += p.receivable.aging.buckets[b];
      aging.payable[b]    += p.payable.aging.buckets[b];
    });
  }

  // Only positive closings roll into the headline totals. A negative receivable
  // is an overpayment, not a negative asset, and netting it against real
  // receivables would understate what is actually collectable.
  const receivable = parties.reduce((s, p) => s + Math.max(0, p.receivable.closing), 0);
  const payable    = parties.reduce((s, p) => s + Math.max(0, p.payable.closing), 0);

  const overdueOf = (b: Record<Bucket, number>) => b['1-30'] + b['31-60'] + b['61-90'] + b['90+'];

  return {
    parties,
    totals: {
      receivable, payable, net: receivable - payable,
      partyCount: parties.length,
      receivableParties: parties.filter(p => p.receivable.closing > 0).length,
      payableParties:    parties.filter(p => p.payable.closing > 0).length,
      overdue:  overdueOf(aging.receivable) + overdueOf(aging.payable),
      critical: aging.receivable['90+'] + aging.payable['90+'],
    },
    aging,
    diagnostics: {
      skippedPendingApproval,
      unclassifiedLoanLike,
      unallocated: parties.filter(p => p.key === 'unallocated').length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Flat ledger rows — the spreadsheet column layout
//
// One row per transaction, in the order the reference sheet specifies:
//
//   Date · Flow · Category · Sub-Category · Invoice Details · Amount ·
//   Amount Received · Amount Paid · Remaining Receivable · Remaining Payable ·
//   Total Receivable · Total Payable · Due Date · Record Payment ·
//   Payment Status · Remarks       (+ Transaction Type and Reference No.)
//
// Receivable and Payable are interleaved in one table rather than split across
// two sheets — Category tells you which side a row is on, and the paired
// columns keep the two readable side by side.
// ─────────────────────────────────────────────────────────────────────────────

export type RowStatus = 'All Cleared' | 'Partial' | 'Pending';

export interface LedgerRow {
  id: string;
  /** The original transaction, so `onRecordPayment` can act on it. */
  source: Transaction;

  date: string;                 // A  Transaction Date
  flow: 'Inflow' | 'Outflow';   // B  Flow
  category: 'A/C Receivable' | 'A/C Payable';  // C  Category
  subCategory: string;          // D  Sub-Category
  invoiceNumber?: string;       // E  Invoice Details …
  invoiceParty?: string;        // E  … name
  invoiceRemaining?: number;    // E  … remaining (only when Pending/Partial)
  amount: number;               // F  Amount
  amountReceived: number;       // G  Amount Received
  amountPaid: number;           // H  Amount Paid
  remainingReceivable: number | null;  // I
  remainingPayable: number | null;     // J
  totalReceivable: number;      // K  running cumulative
  totalPayable: number;         // L  running cumulative
  dueDate?: string;             // M  Due Date
  status: RowStatus;            // O  Payment Status
  remarks: string;              // P  Remarks

  transactionType: string;      // Transaction Type  (Invoice / Loan / Manual …)
  referenceNo: string;          // Reference No.     (INV-1001 / TXN-…)

  side: Side;
  /** increase = obligation raised, decrease = obligation settled. */
  effect: Effect;
  /** True when the transaction carries its own settlement figures. */
  hasExplicitSettlement: boolean;
  counterparty: string;
  daysOverdue: number;
}

/** Index invoices by every plausible key so lookup survives schema drift. */
function indexInvoices(invoices?: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const inv of invoices || []) {
    if (!inv || typeof inv !== 'object') continue;
    for (const k of [inv.invoiceNumber, inv.invoiceNo, inv.number, inv.id, inv.transactionId]) {
      const key = norm(k);
      if (key) map.set(key, inv);
    }
  }
  return map;
}

export function buildRows(
  transactions: Transaction[],
  opts: { from: string; asOf: string; basis: Basis; invoices?: any[] },
): LedgerRow[] {
  const { from, asOf, basis } = opts;
  const invoiceMap = indexInvoices(opts.invoices);
  const rows: LedgerRow[] = [];

  for (const raw of transactions || []) {
    const t = raw as any;
    if (isExcluded(t)) continue;

    const direction = detectDirection(t);
    const side = detectSide(t, direction);
    if (!side || !direction) continue;

    const date = String(t.date || '').slice(0, 10);
    if (!date || date > asOf || date < from) continue;

    const gross = num(t.amount);
    const settled = settledAmount(t);
    const value = basis === 'gross' ? gross : settled;
    if (value === 0 && gross === 0) continue;

    const effect: Effect =
      side === 'receivable'
        ? (direction === 'outflow' ? 'increase' : 'decrease')
        : (direction === 'inflow'  ? 'increase' : 'decrease');

    // Remaining on the obligation — NOT the same thing as the cash that moved.
    //
    // Two kinds of row exist and they need different treatment:
    //
    //  • Self-settling rows (invoices). The transaction carries its own
    //    settlement: amount 700, amountPaid 700, remainingAmount 0. Everything
    //    needed is on the record, so read it off directly.
    //
    //  • Pure raises (a loan given, with no payment fields set at all). The
    //    obligation is 100% outstanding until a *separate* recovery transaction
    //    reduces it. Reading `gross - settled` here would give 0 and wrongly
    //    report the loan as cleared — these are resolved by FIFO in the pass
    //    below, against the counterparty's later repayments.
    const explicitRemaining = numOrNull(t.remainingAmount);
    const hasExplicitSettlement =
      explicitRemaining !== null ||
      numOrNull(t.amountPaid) !== null ||
      numOrNull(t.totalPaid) !== null ||
      (Array.isArray(t.partialPayments) && t.partialPayments.length > 0);

    const remaining = effect === 'decrease' ? 0
      : hasExplicitSettlement ? Math.max(0, explicitRemaining ?? (gross - settled))
      : gross;   // provisional — the FIFO pass below nets this down

    // Invoice details. Prefer the invoice record; fall back to what the bridge
    // service wrote into detailCategory ("Invoice: INV-1001 — Acme Ltd").
    const linkRef = String(t.linkedRef || t.linkedId || '');
    const inv = invoiceMap.get(norm(linkRef));
    const isInvoice = norm(t.linkedType) === 'invoice' || /^inv[-y]?-/i.test(linkRef);

    let invoiceNumber: string | undefined;
    let invoiceParty: string | undefined;
    if (isInvoice || inv) {
      invoiceNumber = String(inv?.invoiceNumber || inv?.invoiceNo || linkRef || '') || undefined;
      invoiceParty =
        cleanName(inv?.customerName || inv?.customer || inv?.partyName || inv?.supplierName) ||
        (String(t.detailCategory || '').split('—')[1] || '').trim() ||
        undefined;
    }

    const dueDate = t.dueDate || t.expectedReturnDate || undefined;

    rows.push({
      id: String(t.id || `${t.transactionId}-${date}-${gross}`),
      source: raw,
      date,
      flow: direction === 'inflow' ? 'Inflow' : 'Outflow',
      category: side === 'receivable' ? 'A/C Receivable' : 'A/C Payable',
      subCategory: String(t.subCategoryDetail || t.subCategory || t.detailCategory || '—'),
      invoiceNumber,
      invoiceParty,
      invoiceRemaining: undefined,   // set in the finalisation pass
      amount: gross,
      amountReceived: direction === 'inflow'  ? value : 0,
      amountPaid:     direction === 'outflow' ? value : 0,
      remainingReceivable: side === 'receivable' ? remaining : null,
      remainingPayable:    side === 'payable'    ? remaining : null,
      totalReceivable: 0,
      totalPayable: 0,
      dueDate,
      status: 'Pending',
      remarks: String(t.note || ''),
      transactionType: t.linkedType
        ? String(t.linkedType).charAt(0).toUpperCase() + String(t.linkedType).slice(1)
        : 'Manual',
      referenceNo: String(t.linkedRef || t.linkedId || t.transactionId || ''),
      side,
      effect,
      hasExplicitSettlement,
      counterparty: detectCounterparty(t, side, effect),
      daysOverdue: 0,
    });
  }

  // Running totals only mean anything in date order, so the ledger sorts oldest
  // first. K and L accumulate the receivable / payable raised to date.
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // ── FIFO netting ───────────────────────────────────────────────────────────
  // Pure raises (no settlement figures on the record) start fully outstanding.
  // Consume them oldest-first with the counterparty's repayments on that side,
  // so a loan given in January and half repaid in March reports half remaining
  // rather than either zero or the full amount.
  const groups = new Map<string, LedgerRow[]>();
  for (const r of rows) {
    const k = `${r.counterparty.toLowerCase()}|${r.side}`;
    (groups.get(k) || groups.set(k, []).get(k)!).push(r);
  }

  for (const group of groups.values()) {
    // Repayments only offset raises that were not already self-settled.
    let pool = group
      .filter(r => r.effect === 'decrease')
      .reduce((s, r) => s + (r.side === 'receivable' ? r.amountReceived : r.amountPaid), 0);

    for (const r of group) {
      if (r.effect !== 'increase' || r.hasExplicitSettlement) continue;
      const outstanding = Math.max(0, r.amount - pool);
      pool = Math.max(0, pool - r.amount);
      if (r.side === 'receivable') r.remainingReceivable = outstanding;
      else                         r.remainingPayable = outstanding;
    }
  }

  // ── Derived presentation fields ────────────────────────────────────────────
  let runR = 0, runP = 0;
  for (const r of rows) {
    if (r.effect === 'increase') {
      if (r.side === 'receivable') runR += r.amount; else runP += r.amount;
    }
    r.totalReceivable = runR;
    r.totalPayable = runP;

    const remaining = (r.side === 'receivable' ? r.remainingReceivable : r.remainingPayable) ?? 0;

    // Status describes the obligation, not the cash. A row with nothing settled
    // is Pending even if money moved, because on a raise the money moving IS
    // the obligation being created.
    r.status =
      r.effect === 'decrease' || remaining <= 0.005 ? 'All Cleared'
      : remaining >= r.amount - 0.005              ? 'Pending'
      : 'Partial';

    // The sheet shows the outstanding balance on the invoice only while the
    // payment is Pending or Partial; a cleared row shows the reference alone.
    r.invoiceRemaining = r.status === 'All Cleared' ? undefined : remaining;

    r.daysOverdue = r.dueDate && remaining > 0 && new Date(r.dueDate) < new Date(asOf)
      ? daysBetween(r.dueDate, asOf)
      : 0;
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Preset = 'all' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom';

const ALL_TIME_START = '2000-01-01';

export function AccountsPayableReceivableReport({
  transactions,
  invoices,
  defaultTab = 'ledger',
  currency = 'AED',
  onRecordPayment,
}: Props) {
  const [view, setView]       = useState<ArApView>(defaultTab);
  // The grouped views narrow on this; `ledger` borrows the combined layout for
  // its summary tiles and aging matrix.
  const tab: ArApTab = view === 'ledger' ? 'combined' : view;
  const setTab = (v: ArApTab) => setView(v);
  const [preset, setPreset]   = useState<Preset>('all');
  const [from, setFrom]       = useState<string>(ALL_TIME_START);
  const [asOf, setAsOf]       = useState<string>(today);
  const [basis, setBasis]     = useState<Basis>('settled');
  const [search, setSearch]   = useState('');
  const [hideSettled, setHideSettled] = useState(true);
  const [sideFilter, setSideFilter]     = useState<'all' | Side>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RowStatus>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === 'custom') return;
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    switch (p) {
      case 'thisMonth':   setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1)));     setAsOf(iso(now)); break;
      case 'lastMonth':   setFrom(iso(new Date(now.getFullYear(), now.getMonth() - 1, 1))); setAsOf(iso(new Date(now.getFullYear(), now.getMonth(), 0))); break;
      case 'last3Months': setFrom(iso(new Date(now.getFullYear(), now.getMonth() - 2, 1))); setAsOf(iso(now)); break;
      case 'thisYear':    setFrom(iso(new Date(now.getFullYear(), 0, 1)));                  setAsOf(iso(now)); break;
      case 'all':         setFrom(ALL_TIME_START);                                          setAsOf(iso(now)); break;
    }
  };

  const ledgerRows = useMemo(
    () => buildRows(transactions, { from, asOf, basis, invoices }),
    [transactions, from, asOf, basis, invoices],
  );

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledgerRows.filter(r => {
      if (sideFilter !== 'all' && r.side !== sideFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.counterparty, r.subCategory, r.referenceNo, r.invoiceNumber, r.invoiceParty, r.remarks]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [ledgerRows, sideFilter, statusFilter, search]);

  const ledger = useMemo(
    () => buildLedger(transactions, { from, asOf, basis }),
    [transactions, from, asOf, basis],
  );

  const visibleParties = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledger.parties.filter(p => {
      if (q && !p.name.toLowerCase().includes(q)) return false;

      const rel =
        tab === 'receivable' ? p.receivable.closing !== 0 || p.receivable.movements.length > 0 :
        tab === 'payable'    ? p.payable.closing !== 0    || p.payable.movements.length > 0 :
        true;
      if (!rel) return false;

      if (hideSettled) {
        const balance =
          tab === 'receivable' ? p.receivable.closing :
          tab === 'payable'    ? p.payable.closing    : p.net;
        if (Math.abs(balance) < 0.005) return false;
      }
      return true;
    });
  }, [ledger.parties, search, tab, hideSettled]);

  const toggle = (key: string) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });
  const expandAll   = () => setExpanded(new Set(visibleParties.map(p => p.key)));
  const collapseAll = () => setExpanded(new Set());

  const handleExport = () => {
    const rows: string[] = [];
    rows.push(['Accounts Payable & Receivable'].map(csvCell).join(','));
    rows.push(['Activity from', from, 'As of', asOf, 'Basis', basis, 'Currency', currency].map(csvCell).join(','));
    rows.push('');

    // Ledger view exports the sheet layout, column for column.
    if (view === 'ledger') {
      rows.push([
        'Transaction Date', 'Flow', 'Category', 'Sub-Category', 'Invoice Details',
        'Amount', 'Amount Received', 'Amount Paid', 'Remaining Receivable', 'Remaining Payable',
        'Total Receivable', 'Total Payable', 'Due Date', 'Payment Status', 'Remarks',
        'Transaction Type', 'Reference No.',
      ].map(csvCell).join(','));

      for (const r of visibleRows) {
        const invoiceDetails = [
          r.invoiceNumber, r.invoiceParty,
          r.invoiceRemaining !== undefined && r.invoiceRemaining > 0 ? `remaining ${r.invoiceRemaining.toFixed(2)}` : '',
        ].filter(Boolean).join(' · ');

        rows.push([
          r.date, r.flow, r.category, r.subCategory, invoiceDetails,
          r.amount.toFixed(2), r.amountReceived.toFixed(2), r.amountPaid.toFixed(2),
          r.remainingReceivable === null ? '' : r.remainingReceivable.toFixed(2),
          r.remainingPayable === null ? '' : r.remainingPayable.toFixed(2),
          r.totalReceivable.toFixed(2), r.totalPayable.toFixed(2),
          r.dueDate || '', r.status, r.remarks,
          r.transactionType, r.referenceNo,
        ].map(csvCell).join(','));
      }

      const blobL = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const aL = document.createElement('a');
      aL.href = URL.createObjectURL(blobL);
      aL.download = `receivables-payables-ledger-${asOf}.csv`;
      document.body.appendChild(aL); aL.click(); document.body.removeChild(aL);
      URL.revokeObjectURL(aL.href);
      return;
    }

    rows.push(['Counterparty', 'Receivable Opening', 'Receivable Increase', 'Receivable Decrease',
               'Receivable Closing', 'Payable Opening', 'Payable Increase', 'Payable Decrease',
               'Payable Closing', 'Net Position', 'Oldest Open (days)'].map(csvCell).join(','));
    for (const p of visibleParties) {
      rows.push([
        p.name,
        p.receivable.opening.toFixed(2), p.receivable.increases.toFixed(2),
        p.receivable.decreases.toFixed(2), p.receivable.closing.toFixed(2),
        p.payable.opening.toFixed(2), p.payable.increases.toFixed(2),
        p.payable.decreases.toFixed(2), p.payable.closing.toFixed(2),
        p.net.toFixed(2),
        String(Math.max(p.receivable.aging.oldestAgeDays, p.payable.aging.oldestAgeDays)),
      ].map(csvCell).join(','));
    }

    rows.push('');
    rows.push(['Movements'].map(csvCell).join(','));
    rows.push(['Counterparty', 'Txn Ref', 'Date', 'Side', 'Effect', 'Category',
               'Amount', 'Gross Amount', 'Partial', 'Mode', 'Branch', 'Due Date', 'Note'].map(csvCell).join(','));
    for (const p of visibleParties) {
      for (const m of [...p.receivable.movements, ...p.payable.movements]) {
        rows.push([
          p.name, m.txnRef, m.date, m.side, m.effect, m.category,
          m.amount.toFixed(2), m.grossAmount.toFixed(2), m.isPartial ? 'yes' : 'no',
          m.mode || '', m.company || '', m.dueDate || '', m.note || '',
        ].map(csvCell).join(','));
      }
    }

    rows.push('');
    rows.push(['Aging', 'Current', '1-30', '31-60', '61-90', '90+', 'Total'].map(csvCell).join(','));
    (['receivable', 'payable'] as const).forEach(s => {
      const b = ledger.aging[s];
      const total = b.current + b['1-30'] + b['31-60'] + b['61-90'] + b['90+'];
      rows.push([s, b.current, b['1-30'], b['31-60'], b['61-90'], b['90+'], total]
        .map(v => (typeof v === 'number' ? v.toFixed(2) : v)).map(csvCell).join(','));
    });

    rows.push('');
    rows.push(['Total Receivable', ledger.totals.receivable.toFixed(2)].map(csvCell).join(','));
    rows.push(['Total Payable', ledger.totals.payable.toFixed(2)].map(csvCell).join(','));
    rows.push(['Net Position', ledger.totals.net.toFixed(2)].map(csvCell).join(','));

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `accounts-payable-receivable-${asOf}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const cur = (n: number, opts?: { sign?: boolean }) => (
    <>
      {opts?.sign && n !== 0 && (n > 0 ? '+' : '−')}
      <span style={{ opacity: 0.55, fontSize: '0.8em', marginRight: 3 }}>{currency}</span>
      {fmt(Math.abs(n))}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, padding: 5, backgroundColor: '#f1f5f9', borderRadius: 11, width: 'fit-content' }}>
        {([
          ['ledger',     'Ledger',      <Receipt size={13} key="r" />],
          ['combined',   'Combined',    <Scale size={13} key="s" />],
          ['receivable', 'Receivables', <TrendingUp size={13} key="u" />],
          ['payable',    'Payables',    <TrendingDown size={13} key="d" />],
        ] as [ArApView, string, React.ReactNode][]).map(([id, label, icon]) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 15px', borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: active ? '#fff' : 'transparent',
                color: active ? '#0f172a' : '#64748b',
                fontSize: 12.5, fontWeight: 700,
                boxShadow: active ? '0 1px 3px rgba(15,23,42,0.10)' : 'none',
                transition: 'all .12s ease',
              }}>{icon} {label}</button>
          );
        })}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '14px 16px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <label style={LABEL}>Activity period</label>
          {([['all', 'All time'], ['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['last3Months', 'Last 3 months'], ['thisYear', 'This year']] as [Preset, string][]).map(([id, label]) => {
            const active = preset === id;
            return (
              <button key={id} onClick={() => applyPreset(id)}
                style={{
                  padding: '5px 11px', borderRadius: 99,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: active ? '#0f172a' : '#fff',
                  color: active ? '#fff' : '#334155',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{label}</button>
            );
          })}
          {preset === 'custom' && <span style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700 }}>Custom</span>}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 3, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
            {([['settled', 'Amount settled'], ['gross', 'Gross amount']] as [Basis, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setBasis(id)} title={
                id === 'settled'
                  ? 'Value each entry by the cash that actually moved (partial payments respected)'
                  : 'Value each entry by the full face value of the obligation'
              }
                style={{
                  padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: basis === id ? '#fff' : 'transparent',
                  color: basis === id ? '#0f172a' : '#64748b',
                  fontSize: 11, fontWeight: 700,
                  boxShadow: basis === id ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <Calendar size={15} color="#64748b" />
          <label style={LABEL}>From</label>
          <input type="date" value={from} max={asOf} style={INPUT}
            onChange={e => { setFrom(e.target.value); setPreset('custom'); }} />
          <label style={{ ...LABEL, color: '#0f172a' }}>As of</label>
          <input type="date" value={asOf} min={from} style={{ ...INPUT, fontWeight: 700 }}
            onChange={e => { setAsOf(e.target.value); setPreset('custom'); }} />

          <div style={{ position: 'relative' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find counterparty"
              style={{ ...INPUT, paddingLeft: 28, width: 190 }} />
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideSettled} onChange={e => setHideSettled(e.target.checked)} style={{ cursor: 'pointer' }} />
            Hide settled
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={expandAll}   style={MINI_BTN}><Maximize2 size={12} /> Expand all</button>
            <button onClick={collapseAll} style={MINI_BTN}><Minimize2 size={12} /> Collapse all</button>
            <button onClick={handleExport} style={{ ...MINI_BTN, backgroundColor: '#0f172a', color: '#fff', border: 'none' }}><Download size={12} /> Export CSV</button>
          </div>
        </div>
      </div>

      {/* ── Diagnostics ────────────────────────────────────────────────────── */}
      {(ledger.diagnostics.unclassifiedLoanLike > 0 ||
        ledger.diagnostics.skippedPendingApproval > 0 ||
        ledger.diagnostics.unallocated > 0) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', borderRadius: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
          <Info size={14} color="#b45309" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: '#78350f', lineHeight: 1.6 }}>
            {ledger.diagnostics.skippedPendingApproval > 0 && (
              <div><strong>{ledger.diagnostics.skippedPendingApproval}</strong> transaction(s) excluded — pending approval or rejected.</div>
            )}
            {ledger.diagnostics.unclassifiedLoanLike > 0 && (
              <div><strong>{ledger.diagnostics.unclassifiedLoanLike}</strong> loan-related transaction(s) excluded — the cash direction could not be determined. Set the main category to Cash Inflow or Cash Outflow on these entries.</div>
            )}
            {ledger.diagnostics.unallocated > 0 && (
              <div>Some entries have no counterparty and are grouped under <strong>Unallocated</strong>. Fill in Paid By / Paid To to split them out.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Summary tiles ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        <Tile icon={<TrendingUp size={18} />} label="Total Receivable" sub={`${ledger.totals.receivableParties} debtor(s)`}
              value={ledger.totals.receivable} currency={currency} fg="#059669" bg="#ecfdf5" />
        <Tile icon={<TrendingDown size={18} />} label="Total Payable" sub={`${ledger.totals.payableParties} creditor(s)`}
              value={ledger.totals.payable} currency={currency} fg="#dc2626" bg="#fef2f2" />
        <Tile icon={<Scale size={18} />}
              label={ledger.totals.net >= 0 ? 'Net Position (in our favour)' : 'Net Position (we owe)'}
              sub={`${ledger.totals.partyCount} counterpart${ledger.totals.partyCount === 1 ? 'y' : 'ies'}`}
              value={Math.abs(ledger.totals.net)} currency={currency}
              fg={ledger.totals.net >= 0 ? '#059669' : '#b91c1c'}
              bg={ledger.totals.net >= 0 ? '#ecfdf5' : '#fef2f2'} highlight />
        <Tile icon={<Clock size={18} />} label="Overdue" sub="past due, both sides"
              value={ledger.totals.overdue} currency={currency} fg="#c2410c" bg="#fff7ed" />
        <Tile icon={<AlertTriangle size={18} />} label="Critical" sub="over 90 days"
              value={ledger.totals.critical} currency={currency} fg="#b91c1c" bg="#fef2f2" />
      </div>

      {/* ── Aging matrix ───────────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CARD_HEAD}>
          <Clock size={15} color="#334155" />
          <span>Aging</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
            open items as of {fmtDate(asOf)} · FIFO · due dates respected where set
          </span>
        </div>
        <AgingMatrix aging={ledger.aging} currency={currency} tab={tab} />
      </div>

      {/* ── Flat transaction ledger ────────────────────────────────────────── */}
      {view === 'ledger' && (
        <div style={CARD}>
          <div style={{ ...CARD_HEAD, flexWrap: 'wrap' }}>
            <Receipt size={15} color="#334155" />
            <span>Transaction ledger</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
              {visibleRows.length} row{visibleRows.length === 1 ? '' : 's'} · oldest first so running totals accumulate
            </span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              {([['all', 'All'], ['receivable', 'Receivable'], ['payable', 'Payable']] as ['all' | Side, string][]).map(([id, label]) => (
                <button key={id} onClick={() => setSideFilter(id)}
                  style={{
                    padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                    border: sideFilter === id ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: sideFilter === id ? '#0f172a' : '#fff',
                    color: sideFilter === id ? '#fff' : '#475569',
                    fontSize: 10.5, fontWeight: 700,
                  }}>{label}</button>
              ))}
              <span style={{ width: 1, height: 16, backgroundColor: '#e2e8f0' }} />
              {([['all', 'Any status'], ['Pending', 'Pending'], ['Partial', 'Partial'], ['All Cleared', 'Cleared']] as ['all' | RowStatus, string][]).map(([id, label]) => (
                <button key={id} onClick={() => setStatusFilter(id)}
                  style={{
                    padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                    border: statusFilter === id ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: statusFilter === id ? '#334155' : '#fff',
                    color: statusFilter === id ? '#fff' : '#475569',
                    fontSize: 10.5, fontWeight: 700,
                  }}>{label}</button>
              ))}
            </div>
          </div>

          <LedgerTable
            rows={visibleRows}
            currency={currency}
            onRecordPayment={onRecordPayment}
          />
        </div>
      )}

      {/* ── Counterparty ledger ────────────────────────────────────────────── */}
      {view !== 'ledger' && (
      <div style={CARD}>
        <div style={CARD_HEAD}>
          <Layers size={15} color="#334155" />
          <span>
            {tab === 'combined' ? 'Position by counterparty'
              : tab === 'receivable' ? 'Receivables by debtor'
              : 'Payables by creditor'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
            {visibleParties.length} row{visibleParties.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ ...GRID(tab), ...HEADER_ROW }}>
          <span>Counterparty</span>
          {tab === 'combined' ? (
            <>
              <span style={RIGHT}>Receivable</span>
              <span style={RIGHT}>Payable</span>
              <span style={RIGHT}>Net position</span>
            </>
          ) : (
            <>
              <span style={RIGHT}>Opening</span>
              <span style={RIGHT}>Increase</span>
              <span style={RIGHT}>Decrease</span>
              <span style={RIGHT}>Closing</span>
            </>
          )}
        </div>

        {visibleParties.length === 0 ? (
          <EmptyState tab={tab} hideSettled={hideSettled} />
        ) : visibleParties.map(p => (
          <PartyBlock
            key={p.key}
            party={p}
            tab={tab}
            currency={currency}
            isOpen={expanded.has(p.key)}
            onToggle={() => toggle(p.key)}
          />
        ))}

        {visibleParties.length > 0 && (
          <div style={{ ...GRID(tab), padding: '14px 22px', backgroundColor: '#0f172a', color: '#fff', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>
              {tab === 'combined' ? 'Net position' : tab === 'receivable' ? 'Total receivable' : 'Total payable'}
            </span>
            {tab === 'combined' ? (
              <>
                <span style={{ ...TOTAL_CELL, color: '#6ee7b7' }}>{cur(ledger.totals.receivable)}</span>
                <span style={{ ...TOTAL_CELL, color: '#fca5a5' }}>{cur(ledger.totals.payable)}</span>
                <span style={{ ...TOTAL_CELL, color: ledger.totals.net >= 0 ? '#6ee7b7' : '#fca5a5', fontSize: 15 }}>
                  {cur(ledger.totals.net, { sign: true })}
                </span>
              </>
            ) : (
              <>
                <span style={{ ...TOTAL_CELL, color: '#cbd5e1' }}>
                  {cur(visibleParties.reduce((s, p) => s + p[tab].opening, 0))}
                </span>
                <span style={{ ...TOTAL_CELL, color: '#cbd5e1' }}>
                  {cur(visibleParties.reduce((s, p) => s + p[tab].increases, 0))}
                </span>
                <span style={{ ...TOTAL_CELL, color: '#cbd5e1' }}>
                  {cur(visibleParties.reduce((s, p) => s + p[tab].decreases, 0))}
                </span>
                <span style={{ ...TOTAL_CELL, color: tab === 'receivable' ? '#6ee7b7' : '#fca5a5', fontSize: 15 }}>
                  {cur(visibleParties.reduce((s, p) => s + Math.max(0, p[tab].closing), 0))}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      )}

      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '4px 8px 14px', lineHeight: 1.7 }}>
        {view === 'ledger'
          ? <>Total Receivable and Total Payable are running cumulative totals, which is why the ledger is ordered oldest first.
              Remaining amounts appear on the invoice only while a payment is Pending or Partial.</>
          : <>Closing = Opening + Increases − Decreases, computed from every entry up to {fmtDate(asOf)}.
              Receivables rise on cash out and fall on cash in; payables do the reverse.
              Positive net means the counterparty owes us.</>}
        {' '}Values shown on the <strong>{basis === 'settled' ? 'amount settled' : 'gross amount'}</strong> basis.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const LEDGER_COLS =
  '96px 74px 116px 150px 190px ' +      // Date · Flow · Category · Sub-Category · Invoice
  '104px 104px 96px 112px 104px ' +     // Amount · Received · Paid · Rem. Recv · Rem. Pay
  '110px 104px 96px 118px 100px 160px'; // Tot Recv · Tot Pay · Due · Record · Status · Remarks

const LedgerTable: React.FC<{
  rows: LedgerRow[];
  currency: string;
  onRecordPayment?: (row: LedgerRow) => void;
}> = ({ rows, currency, onRecordPayment }) => {

  const money = (n: number | null, tone?: string) =>
    n === null || n === undefined ? <span style={{ color: '#cbd5e1' }}>—</span>
    : n === 0 ? <span style={{ color: '#cbd5e1' }}>—</span>
    : <span style={{ color: tone || '#334155' }}>
        <span style={{ opacity: 0.5, fontSize: '0.78em', marginRight: 2 }}>{currency}</span>{fmt(n)}
      </span>;

  const statusTone: Record<RowStatus, { bg: string; fg: string }> = {
    'All Cleared': { bg: '#ecfdf5', fg: '#059669' },
    'Partial':     { bg: '#fef3c7', fg: '#92400e' },
    'Pending':     { bg: '#fef2f2', fg: '#dc2626' },
  };

  if (rows.length === 0) {
    return (
      <div style={{ padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, color: '#64748b', fontWeight: 600 }}>No matching entries.</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8, maxWidth: 520, margin: '8px auto 0', lineHeight: 1.7 }}>
          Rows appear here when a transaction is categorised as a receivable or a payable —
          Loan Given, Loan Received, Account Receivable, Account Payable, or anything under the Loan category.
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 1780 }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: LEDGER_COLS, ...HEADER_ROW, padding: '9px 16px' }}>
          <span>Date</span>
          <span>Flow</span>
          <span>Category</span>
          <span>Sub-Category</span>
          <span>Invoice Details</span>
          <span style={RIGHT}>Amount</span>
          <span style={RIGHT}>Amount Received</span>
          <span style={RIGHT}>Amount Paid</span>
          <span style={RIGHT}>Remaining Receivable</span>
          <span style={RIGHT}>Remaining Payable</span>
          <span style={RIGHT}>Total Receivable</span>
          <span style={RIGHT}>Total Payable</span>
          <span>Due Date</span>
          <span>Record Payment</span>
          <span>Payment Status</span>
          <span>Remarks</span>
        </div>

        {/* Rows */}
        {rows.map((r, i) => {
          const isR = r.category === 'A/C Receivable';
          const tone = statusTone[r.status];
          return (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: LEDGER_COLS, alignItems: 'center',
              padding: '9px 16px', fontSize: 11.5, color: '#334155',
              backgroundColor: i % 2 ? '#fcfcfd' : '#fff',
              borderBottom: '1px solid #f1f5f9',
              borderLeft: `3px solid ${isR ? '#059669' : '#dc2626'}`,
            }}>
              <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fmtDate(r.date)}</span>

              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.03em',
                color: r.flow === 'Inflow' ? '#059669' : '#dc2626',
              }}>{r.flow}</span>

              <span style={{ fontSize: 10.5, fontWeight: 700, color: isR ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                {r.category}
              </span>

              <span style={ELLIPSIS} title={r.subCategory}>{r.subCategory}</span>

              {/* Invoice Details — number, party, and the remaining balance while unpaid */}
              <span style={{ ...ELLIPSIS, fontSize: 11 }}
                    title={[r.invoiceNumber, r.invoiceParty].filter(Boolean).join(' · ')}>
                {r.invoiceNumber || r.invoiceParty ? (
                  <>
                    {r.invoiceNumber && (
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#4f46e5' }}>
                        {r.invoiceNumber}
                      </span>
                    )}
                    {r.invoiceParty && <span style={{ color: '#475569' }}> · {r.invoiceParty}</span>}
                    {r.invoiceRemaining !== undefined && r.invoiceRemaining > 0 && (
                      <span style={{ color: '#b45309', fontWeight: 700 }}> · bal {fmt(r.invoiceRemaining)}</span>
                    )}
                  </>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>}
              </span>

              <span style={NUM}>{money(r.amount, '#0f172a')}</span>
              <span style={NUM}>{money(r.amountReceived, '#059669')}</span>
              <span style={NUM}>{money(r.amountPaid, '#dc2626')}</span>
              <span style={NUM}>{money(r.remainingReceivable, '#c2410c')}</span>
              <span style={NUM}>{money(r.remainingPayable, '#c2410c')}</span>
              <span style={{ ...NUM, fontWeight: 700 }}>{money(r.totalReceivable, '#059669')}</span>
              <span style={{ ...NUM, fontWeight: 700 }}>{money(r.totalPayable, '#dc2626')}</span>

              <span style={{ whiteSpace: 'nowrap', color: r.daysOverdue > 0 ? '#dc2626' : '#64748b', fontWeight: r.daysOverdue > 0 ? 700 : 500 }}>
                {r.dueDate ? fmtDate(r.dueDate) : <span style={{ color: '#cbd5e1' }}>—</span>}
                {r.daysOverdue > 0 && <span style={{ fontSize: 9.5, display: 'block' }}>{r.daysOverdue}d overdue</span>}
              </span>

              {/* Record Payment — an action only when the caller wired one up */}
              <span>
                {r.status === 'All Cleared' ? (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>—</span>
                ) : onRecordPayment ? (
                  <button onClick={() => onRecordPayment(r)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
                      border: 'none', backgroundColor: '#4f46e5', color: '#fff',
                      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                    <Wallet size={11} /> Record
                  </button>
                ) : (
                  <span style={{ fontSize: 9.5, color: '#94a3b8', fontStyle: 'italic' }}>not wired</span>
                )}
              </span>

              <span>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: 9.5, fontWeight: 800,
                  backgroundColor: tone.bg, color: tone.fg, whiteSpace: 'nowrap',
                }}>{r.status}</span>
              </span>

              <span style={{ ...ELLIPSIS, fontSize: 11, color: '#64748b' }} title={r.remarks}>
                {r.remarks || <span style={{ color: '#cbd5e1' }}>—</span>}
                <span style={{ display: 'block', fontSize: 9.5, color: '#cbd5e1' }}>
                  {r.transactionType}{r.referenceNo ? ` · ${r.referenceNo}` : ''}
                </span>
              </span>
            </div>
          );
        })}

        {/* Footer totals */}
        <div style={{
          display: 'grid', gridTemplateColumns: LEDGER_COLS, alignItems: 'center',
          padding: '12px 16px', backgroundColor: '#0f172a', color: '#fff', fontSize: 12,
        }}>
          <span style={{ fontWeight: 800, gridColumn: 'span 5' }}>
            <FileText size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
            {rows.length} row{rows.length === 1 ? '' : 's'}
          </span>
          <span style={{ ...NUM, fontWeight: 800 }}>{fmt(rows.reduce((s, r) => s + r.amount, 0))}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#6ee7b7' }}>{fmt(rows.reduce((s, r) => s + r.amountReceived, 0))}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#fca5a5' }}>{fmt(rows.reduce((s, r) => s + r.amountPaid, 0))}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#fdba74' }}>{fmt(rows.reduce((s, r) => s + (r.remainingReceivable || 0), 0))}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#fdba74' }}>{fmt(rows.reduce((s, r) => s + (r.remainingPayable || 0), 0))}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#6ee7b7' }}>{fmt(rows.length ? rows[rows.length - 1].totalReceivable : 0)}</span>
          <span style={{ ...NUM, fontWeight: 800, color: '#fca5a5' }}>{fmt(rows.length ? rows[rows.length - 1].totalPayable : 0)}</span>
          <span style={{ gridColumn: 'span 4' }} />
        </div>
      </div>
    </div>
  );
};

const ELLIPSIS: React.CSSProperties = {
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
};

const NUM: React.CSSProperties = {
  textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};

const PartyBlock: React.FC<{
  party: PartyRow; tab: ArApTab; currency: string; isOpen: boolean; onToggle: () => void;
}> = ({ party: p, tab, currency, isOpen, onToggle }) => {
  const movements = tab === 'combined'
    ? [...p.receivable.movements, ...p.payable.movements].sort((a, b) => (a.date < b.date ? 1 : -1))
    : p[tab].movements;

  const age = tab === 'combined'
    ? Math.max(p.receivable.aging.oldestAgeDays, p.payable.aging.oldestAgeDays)
    : p[tab].aging.oldestAgeDays;

  const focus = tab === 'combined' ? p.net : p[tab].closing;
  const settled = Math.abs(focus) < 0.005;

  const focusColor =
    settled ? '#64748b'
    : tab === 'payable' ? (focus > 0 ? '#dc2626' : '#059669')
    : focus > 0 ? (age > 60 ? '#dc2626' : age > 0 ? '#c2410c' : '#059669') : '#0284c7';

  const cur = (n: number, sign?: boolean) => (
    <>
      {sign && n !== 0 && (n > 0 ? '+' : '−')}
      <span style={{ opacity: 0.55, fontSize: '0.8em', marginRight: 3 }}>{currency}</span>
      {fmt(Math.abs(n))}
    </>
  );

  return (
    <>
      <div onClick={onToggle} style={{
        ...GRID(tab), alignItems: 'center', padding: '11px 22px',
        backgroundColor: isOpen ? '#f8fafc' : '#fff',
        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <ChevronRight size={14} style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease', color: focusColor }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </span>
          <span style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            · {movements.length} {movements.length === 1 ? 'entry' : 'entries'}
            {age > 0 && !settled && <> · oldest open {age}d</>}
          </span>
          {settled && <span style={PILL_SETTLED}>Settled</span>}
        </div>

        {tab === 'combined' ? (
          <>
            <span style={{ ...CELL, color: p.receivable.closing > 0 ? '#059669' : '#cbd5e1' }}>{cur(p.receivable.closing)}</span>
            <span style={{ ...CELL, color: p.payable.closing > 0 ? '#dc2626' : '#cbd5e1' }}>{cur(p.payable.closing)}</span>
            <span style={{ ...CELL, color: focusColor, fontWeight: 800 }}>{cur(p.net, true)}</span>
          </>
        ) : (
          <>
            <span style={{ ...CELL, color: '#94a3b8' }}>{cur(p[tab].opening)}</span>
            <span style={{ ...CELL, color: '#334155' }}>{cur(p[tab].increases)}</span>
            <span style={{ ...CELL, color: '#334155' }}>{cur(p[tab].decreases)}</span>
            <span style={{ ...CELL, color: focusColor, fontWeight: 800 }}>{cur(p[tab].closing)}</span>
          </>
        )}
      </div>

      {isOpen && (
        <>
          {(tab === 'combined' ? p.receivable.opening + p.payable.opening : p[tab].opening) !== 0 && (
            <div style={{ ...MOVEMENT_ROW, backgroundColor: '#fafbfc' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontStyle: 'italic' }}>
                Opening balance brought forward
              </span>
              <span style={{ ...CELL, fontSize: 12, color: '#64748b' }}>
                {cur(tab === 'combined' ? p.receivable.opening - p.payable.opening : p[tab].opening, true)}
              </span>
            </div>
          )}

          {movements.length === 0 ? (
            <div style={{ ...MOVEMENT_ROW, color: '#94a3b8', fontSize: 11.5, fontStyle: 'italic' }}>
              No movements in the selected period.
            </div>
          ) : movements.map(m => {
            const up = m.effect === 'increase';
            const tone = m.side === 'receivable'
              ? (up ? { bg: '#ecfdf5', fg: '#059669' } : { bg: '#eff6ff', fg: '#0284c7' })
              : (up ? { bg: '#fef2f2', fg: '#dc2626' } : { bg: '#ecfdf5', fg: '#059669' });

            const label = m.side === 'receivable'
              ? (up ? 'Receivable raised' : 'Received from them')
              : (up ? 'Payable raised' : 'Paid to them');

            return (
              <div key={m.id} style={MOVEMENT_ROW}>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: 9.5, fontWeight: 800,
                    backgroundColor: tone.bg, color: tone.fg, whiteSpace: 'nowrap',
                    textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0,
                  }}>{label}</span>
                  <span style={{ fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fmtDate(m.date)}
                    {m.txnRef && <span style={{ color: '#94a3b8', fontFamily: 'ui-monospace, monospace', fontSize: 10.5 }}> · {m.txnRef}</span>}
                    {m.category && <> · {m.category}</>}
                    {m.mode && <span style={{ color: '#94a3b8' }}> · {m.mode}</span>}
                    {m.isPartial && <span style={PILL_PARTIAL}>Partial</span>}
                    {m.dueDate && <span style={{ color: '#b45309' }}> · due {fmtDate(m.dueDate)}</span>}
                    {m.note && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}> · {m.note}</span>}
                  </span>
                </div>
                <span style={{ ...CELL, fontSize: 12, fontWeight: 600, color: tone.fg }}>
                  {up ? '+' : '−'}
                  <span style={{ opacity: 0.55, fontSize: '0.8em', marginRight: 3 }}>{currency}</span>
                  {fmt(m.amount)}
                </span>
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

const AgingMatrix: React.FC<{
  aging: { receivable: Record<Bucket, number>; payable: Record<Bucket, number> };
  currency: string; tab: ArApTab;
}> = ({ aging, currency, tab }) => {
  const cols: [Bucket, string][] = [
    ['current', 'Current'], ['1-30', '1–30 days'], ['31-60', '31–60 days'],
    ['61-90', '61–90 days'], ['90+', '90+ days'],
  ];
  const rows: [Side, string, string][] = [
    ['receivable', 'Receivable', '#059669'],
    ['payable',    'Payable',    '#dc2626'],
  ];
  const visible = tab === 'combined' ? rows : rows.filter(r => r[0] === tab);
  const totalOf = (b: Record<Bucket, number>) => cols.reduce((s, [k]) => s + b[k], 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `130px repeat(${cols.length}, minmax(96px,1fr)) 120px`, minWidth: 720 }}>
        <div style={AGING_HEAD} />
        {cols.map(([k, label]) => <div key={k} style={{ ...AGING_HEAD, textAlign: 'right' }}>{label}</div>)}
        <div style={{ ...AGING_HEAD, textAlign: 'right', color: '#334155' }}>Total</div>

        {visible.map(([side, label, color]) => (
          <React.Fragment key={side}>
            <div style={{ ...AGING_CELL, fontWeight: 800, color: '#0f172a', textAlign: 'left' }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 99, backgroundColor: color, marginRight: 7 }} />
              {label}
            </div>
            {cols.map(([k]) => (
              <div key={k} style={{ ...AGING_CELL, color: aging[side][k] > 0 ? (k === '90+' ? '#b91c1c' : '#475569') : '#cbd5e1' }}>
                {fmt(aging[side][k])}
              </div>
            ))}
            <div style={{ ...AGING_CELL, fontWeight: 800, color }}>
              <span style={{ opacity: 0.55, fontSize: '0.8em', marginRight: 3 }}>{currency}</span>
              {fmt(totalOf(aging[side]))}
            </div>
          </React.Fragment>
        ))}

        {tab === 'combined' && (
          <>
            <div style={{ ...AGING_CELL, fontWeight: 800, color: '#0f172a', textAlign: 'left', borderTop: '1px solid #e2e8f0' }}>Net</div>
            {cols.map(([k]) => {
              const v = aging.receivable[k] - aging.payable[k];
              return (
                <div key={k} style={{ ...AGING_CELL, borderTop: '1px solid #e2e8f0', fontWeight: 700, color: v === 0 ? '#cbd5e1' : v > 0 ? '#059669' : '#dc2626' }}>
                  {v !== 0 && (v > 0 ? '+' : '−')}{fmt(Math.abs(v))}
                </div>
              );
            })}
            <div style={{ ...AGING_CELL, borderTop: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
              <span style={{ opacity: 0.55, fontSize: '0.8em', marginRight: 3 }}>{currency}</span>
              {fmt(totalOf(aging.receivable) - totalOf(aging.payable))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ tab: ArApTab; hideSettled: boolean }> = ({ tab, hideSettled }) => (
  <div style={{ padding: '44px 24px', textAlign: 'center' }}>
    <div style={{ fontSize: 13.5, color: '#64748b', fontWeight: 600 }}>
      {hideSettled ? 'Nothing outstanding in this period.' : 'No matching entries in this period.'}
    </div>
    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8, lineHeight: 1.7, maxWidth: 560, margin: '8px auto 0' }}>
      {hideSettled
        ? 'Every counterparty is settled. Untick “Hide settled” to see closed positions.'
        : tab === 'payable'
          ? 'Payables come from Cash Inflow entries categorised Loan Received or Account Payable, and fall on Cash Outflow entries categorised Loan Repaid or Account Payable.'
          : 'Receivables come from Cash Outflow entries categorised Loan Given, Loan Receivable or Account Receivable, and fall on Cash Inflow entries categorised Loan Recovered or Account Receivable.'}
    </div>
  </div>
);

const Tile: React.FC<{
  icon: React.ReactNode; label: string; sub?: string; value: number;
  currency: string; fg: string; bg: string; highlight?: boolean;
}> = ({ icon, label, sub, value, currency, fg, bg, highlight }) => (
  <div style={{
    backgroundColor: highlight ? fg : '#fff', borderRadius: 12, padding: '15px 17px',
    border: highlight ? 'none' : '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', gap: 13, minWidth: 0,
    boxShadow: highlight ? '0 6px 16px -6px rgba(15,23,42,0.20)' : '0 1px 2px rgba(0,0,0,0.03)',
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
      backgroundColor: highlight ? 'rgba(255,255,255,0.18)' : bg,
      color: highlight ? '#fff' : fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: highlight ? 'rgba(255,255,255,0.88)' : '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: highlight ? '#fff' : fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginTop: 2 }}>
        <span style={{ fontSize: 11, opacity: 0.7, marginRight: 3 }}>{currency}</span>{fmt(value)}
      </div>
      {sub && <div style={{ fontSize: 10, color: highlight ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────────────────────

const GRID = (tab: ArApTab): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: tab === 'combined'
    ? 'minmax(220px,1fr) 150px 150px 170px'
    : 'minmax(220px,1fr) 130px 130px 130px 160px',
  gap: 10,
});

const RIGHT: React.CSSProperties = { textAlign: 'right' };

const CELL: React.CSSProperties = {
  textAlign: 'right', fontSize: 13, fontWeight: 700,
  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};

const TOTAL_CELL: React.CSSProperties = {
  textAlign: 'right', fontSize: 14, fontWeight: 900,
  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};

const HEADER_ROW: React.CSSProperties = {
  padding: '9px 22px', backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0',
  fontSize: 9.5, fontWeight: 800, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '.08em',
};

const MOVEMENT_ROW: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 170px', gap: 10, alignItems: 'center',
  padding: '7px 22px 7px 52px', backgroundColor: '#fff',
  borderBottom: '1px solid #f8fafc',
};

const CARD: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden',
};

const CARD_HEAD: React.CSSProperties = {
  padding: '13px 22px', borderBottom: '1px solid #e2e8f0',
  background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 14, fontWeight: 800, color: '#0f172a',
};

const AGING_HEAD: React.CSSProperties = {
  padding: '9px 14px', backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0',
  fontSize: 9.5, fontWeight: 800, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '.06em',
};

const AGING_CELL: React.CSSProperties = {
  padding: '11px 14px', fontSize: 12.5, textAlign: 'right',
  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};

const LABEL: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 800, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '.06em',
};

const INPUT: React.CSSProperties = {
  padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 7,
  fontSize: 12.5, outline: 'none', backgroundColor: '#fff', color: '#0f172a',
};

const MINI_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 12px', borderRadius: 7, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', fontSize: 11.5, fontWeight: 700, color: '#334155',
  cursor: 'pointer', whiteSpace: 'nowrap',
};

const PILL_SETTLED: React.CSSProperties = {
  padding: '1px 7px', borderRadius: 99, fontSize: 9, fontWeight: 800,
  backgroundColor: '#f1f5f9', color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0,
};

const PILL_PARTIAL: React.CSSProperties = {
  padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 800,
  backgroundColor: '#fef3c7', color: '#92400e', marginLeft: 6,
  textTransform: 'uppercase', letterSpacing: '.04em',
};

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible exports
//
// Keeps existing imports in ReportsPage working. Delete these once the hub is
// updated to a single menu entry.
// ─────────────────────────────────────────────────────────────────────────────

export const AccountsReceivableReport: React.FC<Props> = props =>
  <AccountsPayableReceivableReport {...props} defaultTab="receivable" />;

export const AccountsPayableReport: React.FC<Props> = props =>
  <AccountsPayableReceivableReport {...props} defaultTab="payable" />;

export default AccountsPayableReceivableReport;