// Transactions Module - Transaction List View (Phase 4 redesign)
//
// Rewritten to match the reference Image 1 layout:
//   • Compact summary strip: OPENING BAL · INFLOW·MO · OUTFLOW·MO · NET·MO · CASH · BANKS·N
//   • Filter chip row:       FILTER · Category · Sub-category · Account · Branch · Settled only · + Add Transaction
//   • Table columns:         TXN ID · DATE · MANUAL DATE · TYPE · CATEGORY · SUB CATEGORY · ACCOUNT
//                            · AMOUNT · CASH IN (teal) · CASH OUT (red) · BALANCE · BALANCE DUE · STATUS · (actions)
//   • Empty state:           "No transactions yet — click '+ Add Transaction' to record one."
//
// Same Props interface as the previous view — drop-in compatible with existing
// wrapper. All row actions (view / edit / delete) preserved as a compact icon
// group in the trailing ACTIONS cell.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Eye, Edit, Trash2, X, Filter as FilterIcon, Check,
  ChevronDown, Wallet, Landmark, TrendingUp, TrendingDown, Loader2,
  PlusCircle, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Search,
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import {
  Transaction, TransactionFilters, TransactionStats,
} from '../models/types';
import {
  getTransactionTotals,
  getTxAccount, getTxCategoryPath,
  computeCashInHandBalance, computeBankBalance, computeMonthlyFlow,
} from '../models/transactionsService';

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  stats: TransactionStats;
  filters: TransactionFilters;
  isLoading: boolean;
  viewTransaction: Transaction | null;
  setFilters: (f: Partial<TransactionFilters>) => void;
  setViewTransaction: (t: Transaction | null) => void;
  handleDeleteTransaction: (id: string) => void;
  handleCreateTransaction: () => void;
  handleEditTransaction: (id: string) => void;
  handleExportCSV: () => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  formatDateTime: (d: string, t?: string) => string;
  getCategoryColor: (c: string) => string;
}

// ── Currency prefix (kept from prior file) ──────────────────────────────────
const CURRENCY = 'AED';
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── View ────────────────────────────────────────────────────────────────────
export function TransactionListView({
  transactions, filteredTransactions, filters, isLoading,
  setFilters,
  handleDeleteTransaction, handleCreateTransaction, handleEditTransaction, setViewTransaction,
  formatDate,
}: Props) {

  // ── Bank list (drives Opening Balance, Banks·N, and the Account filter) ──
  const [banks, setBanks] = useState<{ id: string; name: string; balance: number }[]>([]);
  useEffect(() => {
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => setBanks(snap.docs.map(d => {
        const b = d.data() as any;
        return { id: d.id, name: b.name || '—', balance: Number(b.balance) || 0 };
      })))
      .catch(() => setBanks([]));
  }, []);

  // ── Summary metrics (all live-computed from `transactions`) ──────────────
  const summary = useMemo(() => {
    const monthly = computeMonthlyFlow(transactions);
    const cash    = computeCashInHandBalance(transactions);
    const bankSum = banks.reduce(
      (sum, b) => sum + computeBankBalance(transactions, b.id, b.balance),
      0,
    );
    // Opening balance = seed balances of all banks (pre-ledger). Cash starts at 0.
    const opening = banks.reduce((s, b) => s + b.balance, 0);
    return { ...monthly, cash, bankSum, opening, bankCount: banks.length };
  }, [transactions, banks]);

  // ── Local filter chip state (drives which dropdown is open) ──────────────
  const [openChip, setOpenChip] = useState<null | 'filter' | 'category' | 'subcategory' | 'account' | 'branch'>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openChip) return;
    const handler = (e: MouseEvent) => {
      if (chipRef.current && !chipRef.current.contains(e.target as Node)) setOpenChip(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openChip]);

  // Options for the Category / Sub-category / Account / Branch chips —
  // derived from the currently loaded transactions + banks list.
  const categoryOptions = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const c = getTxCategoryPath(t).category; if (c) s.add(c); });
    return [...s].sort();
  }, [transactions]);
  const subCategoryOptions = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const sc = getTxCategoryPath(t).subCategory; if (sc) s.add(sc); });
    return [...s].sort();
  }, [transactions]);
  const accountOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; type: 'cash' | 'bank' }> = [
      { id: 'cash-in-hand', name: 'Cash in Hand', type: 'cash' },
    ];
    banks.forEach(b => list.push({ id: b.id, name: b.name, type: 'bank' }));
    return list;
  }, [banks]);
  const branchOptions = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const b = t.branchName || t.company; if (b) s.add(b); });
    return [...s].sort();
  }, [transactions]);

  // ── Chip filter state (kept local — doesn't touch the VM's filters) ─────
  const [chipCategory,    setChipCategory]    = useState<string>('');
  const [chipSubCategory, setChipSubCategory] = useState<string>('');
  const [chipAccount,     setChipAccount]     = useState<string>('');
  const [chipBranch,      setChipBranch]      = useState<string>('');
  const [settledOnly,     setSettledOnly]     = useState<boolean>(false);

  // Apply chip filters on top of the VM's filteredTransactions.
  const rows = useMemo(() => {
    return filteredTransactions.filter(t => {
      if (chipCategory && getTxCategoryPath(t).category !== chipCategory) return false;
      if (chipSubCategory && getTxCategoryPath(t).subCategory !== chipSubCategory) return false;
      if (chipAccount && getTxAccount(t).id !== chipAccount) return false;
      if (chipBranch) {
        const b = t.branchName || t.company;
        if (b !== chipBranch) return false;
      }
      if (settledOnly && t.paymentStatus !== 'Full') return false;
      return true;
    });
  }, [filteredTransactions, chipCategory, chipSubCategory, chipAccount, chipBranch, settledOnly]);

  // ── Running balance per account for the BALANCE column ──────────────────
  // Sort rows chronologically (oldest first) so the running total makes sense,
  // then compute per-account running totals. Rendered back in the row order the
  // user sees (newest first). Seeds cash at 0 and each bank at its stored balance.
  const balanceByRow = useMemo(() => {
    const seeded: Record<string, number> = { 'cash-in-hand': 0 };
    banks.forEach(b => { seeded[b.id] = b.balance; });

    const chrono = [...rows].sort((a, b) => {
      const ka = (a.date || '') + ' ' + (a.time || '');
      const kb = (b.date || '') + ' ' + (b.time || '');
      return ka.localeCompare(kb);
    });

    const runningByAcc: Record<string, number> = { ...seeded };
    const map = new Map<string, number>();
    for (const t of chrono) {
      const acc = getTxAccount(t);
      const running = runningByAcc[acc.id] ?? 0;
      const { totalPaid } = getTransactionTotals(t);
      const isIn  = t.mainCategory === 'Cash Inflow';
      const isOut = t.mainCategory === 'Cash Outflow';
      const isCommitted = t.approvalStatus === 'approved' || t.approvalStatus === 'not_required' || !t.approvalStatus;
      const delta = isCommitted ? (isIn ? totalPaid : isOut ? -totalPaid : 0) : 0;
      const next = running + delta;
      runningByAcc[acc.id] = next;
      map.set(t.id, next);
    }
    return map;
  }, [rows, banks]);

  const hasAnyChipFilter = !!(chipCategory || chipSubCategory || chipAccount || chipBranch || settledOnly);

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, backgroundColor: '#f8fafc', minHeight: '100%' }}>

      {/* ── Summary strip ─────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
        padding: '14px 18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0,1fr))',
        gap: 14,
      }}>
        <SummaryCell tone="opening" label="Opening Bal"  value={summary.opening}       icon={<PlusCircle size={15} />} />
        <SummaryCell tone="inflow"  label="Inflow · Mo"  value={summary.inflow}        icon={<ArrowUpCircle size={15} />} />
        <SummaryCell tone="outflow" label="Outflow · Mo" value={summary.outflow}       icon={<ArrowDownCircle size={15} />} />
        <SummaryCell tone="net"     label="Net · Mo"     value={summary.net}           icon={<ArrowLeftRight size={15} />} />
        <SummaryCell tone="cash"    label="Cash"         value={summary.cash}          icon={<Wallet size={15} />} />
        <SummaryCell tone="banks"   label={`Banks · ${summary.bankCount}`} value={summary.bankSum} icon={<Landmark size={15} />} />
      </div>

      {/* ── Section header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Transactions</h2>
      </div>

      {/* ── Filter chip row ────────────────────────────────────────────── */}
      <div ref={chipRef} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
        {/* Filter (search) */}
        <FilterChip
          icon={<FilterIcon size={12} />}
          label="Filter"
          active={!!filters.searchTerm}
          activeColor="#0f172a"
          onClick={() => setOpenChip(openChip === 'filter' ? null : 'filter')}
        />
        {openChip === 'filter' && (
          <Panel>
            <div style={{ padding: 12, minWidth: 260 }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  autoFocus
                  value={filters.searchTerm}
                  onChange={e => setFilters({ searchTerm: e.target.value })}
                  placeholder="Search TXN ID, note, remitter, …"
                  style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, outline: 'none' }}
                />
              </div>
            </div>
          </Panel>
        )}

        {/* Category */}
        <Chip
          label="Category" active={!!chipCategory} activeValue={chipCategory}
          onOpen={() => setOpenChip(openChip === 'category' ? null : 'category')}
          onClear={() => setChipCategory('')}
        />
        {openChip === 'category' && (
          <Panel>
            <ListPanel
              title="Category" empty="No categories yet"
              options={categoryOptions} value={chipCategory}
              onPick={v => { setChipCategory(v); setOpenChip(null); }}
            />
          </Panel>
        )}

        {/* Sub-category */}
        <Chip
          label="Sub-category" active={!!chipSubCategory} activeValue={chipSubCategory}
          onOpen={() => setOpenChip(openChip === 'subcategory' ? null : 'subcategory')}
          onClear={() => setChipSubCategory('')}
        />
        {openChip === 'subcategory' && (
          <Panel>
            <ListPanel
              title="Sub-category" empty="No sub-categories yet"
              options={subCategoryOptions} value={chipSubCategory}
              onPick={v => { setChipSubCategory(v); setOpenChip(null); }}
            />
          </Panel>
        )}

        {/* Account */}
        <Chip
          label="Account" active={!!chipAccount}
          activeValue={accountOptions.find(a => a.id === chipAccount)?.name}
          onOpen={() => setOpenChip(openChip === 'account' ? null : 'account')}
          onClear={() => setChipAccount('')}
        />
        {openChip === 'account' && (
          <Panel>
            <div style={{ minWidth: 240, maxHeight: 260, overflowY: 'auto' }}>
              <PanelHeader>All accounts</PanelHeader>
              <PickRow selected={chipAccount === ''} onClick={() => { setChipAccount(''); setOpenChip(null); }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>All accounts</span>
              </PickRow>
              <div style={{ padding: '6px 12px 4px', fontSize: 12, fontWeight: 600, color: '#64748b', backgroundColor: '#f8fafc' }}>Cash</div>
              <PickRow selected={chipAccount === 'cash-in-hand'} onClick={() => { setChipAccount('cash-in-hand'); setOpenChip(null); }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Wallet size={12} color="#65a30d" /> Cash in Hand
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{CURRENCY} {fmt(summary.cash)}</span>
              </PickRow>
              <div style={{ padding: '6px 12px 4px', fontSize: 12, fontWeight: 600, color: '#64748b', backgroundColor: '#f8fafc' }}>Bank</div>
              {banks.map(b => (
                <PickRow key={b.id} selected={chipAccount === b.id} onClick={() => { setChipAccount(b.id); setOpenChip(null); }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <Landmark size={12} color="#2563eb" /> {b.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{CURRENCY} {fmt(computeBankBalance(transactions, b.id, b.balance))}</span>
                </PickRow>
              ))}
            </div>
          </Panel>
        )}

        {/* Branch */}
        <Chip
          label="Branch" active={!!chipBranch} activeValue={chipBranch}
          onOpen={() => setOpenChip(openChip === 'branch' ? null : 'branch')}
          onClear={() => setChipBranch('')}
        />
        {openChip === 'branch' && (
          <Panel>
            <ListPanel
              title="Branch" empty="No branches yet"
              options={branchOptions} value={chipBranch}
              onPick={v => { setChipBranch(v); setOpenChip(null); }}
            />
          </Panel>
        )}

        {/* Settled only toggle */}
        <button
          onClick={() => setSettledOnly(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 13px', borderRadius: 99,
            border: `1px solid ${settledOnly ? '#0f172a' : '#e2e8f0'}`,
            backgroundColor: settledOnly ? '#0f172a' : '#fff',
            color: settledOnly ? '#fff' : '#334155',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Check size={12} /> Settled only
        </button>

        {/* Spacer + Add */}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCreateTransaction}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10, border: 'none',
            backgroundColor: '#0f172a', color: '#fff',
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15,23,42,0.35)',
          }}
        >
          <Plus size={14} /> Add Transaction
        </button>
      </div>

      {/* Active chip badges (Clear all) */}
      {hasAnyChipFilter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: -8 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Active filters:</span>
          {chipCategory && <ActiveBadge label={`Category: ${chipCategory}`} onRemove={() => setChipCategory('')} />}
          {chipSubCategory && <ActiveBadge label={`Sub: ${chipSubCategory}`} onRemove={() => setChipSubCategory('')} />}
          {chipAccount && <ActiveBadge label={`Account: ${accountOptions.find(a => a.id === chipAccount)?.name || ''}`} onRemove={() => setChipAccount('')} />}
          {chipBranch && <ActiveBadge label={`Branch: ${chipBranch}`} onRemove={() => setChipBranch('')} />}
          {settledOnly && <ActiveBadge label="Settled only" onRemove={() => setSettledOnly(false)} />}
          <button
            onClick={() => { setChipCategory(''); setChipSubCategory(''); setChipAccount(''); setChipBranch(''); setSettledOnly(false); }}
            style={{ fontSize: 11, color: '#4f46e5', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {(['Txn ID','Date','Manual Date','Type','Category','Sub Category','Account','Amount'] as const).map(h => (
                  <ThCell key={h}>{h}</ThCell>
                ))}
                <ThCell tone="inflow">Cash In</ThCell>
                <ThCell tone="outflow">Cash Out</ThCell>
                <ThCell>Balance</ThCell>
                <ThCell>Balance Due</ThCell>
                <ThCell>Status</ThCell>
                <ThCell align="right">Actions</ThCell>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={14} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle' }} /> Loading…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={14} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {transactions.length === 0
                    ? <>No transactions yet — click <b>"+ Add Transaction"</b> to record one.</>
                    : 'No transactions match the current filters.'}
                </td></tr>
              ) : (
                rows.map(t => {
                  const cat = getTxCategoryPath(t);
                  const acc = getTxAccount(t);
                  const { totalPaid, remaining } = getTransactionTotals(t);
                  const isIn  = t.mainCategory === 'Cash Inflow';
                  const isOut = t.mainCategory === 'Cash Outflow';
                  const running = balanceByRow.get(t.id) ?? 0;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <TdCell mono color="#4f46e5" weight={700}>{t.transactionId}</TdCell>
                      <TdCell>{formatDate(t.date)}</TdCell>
                      <TdCell>{t.date ? formatDate(t.date) : '—'}</TdCell>
                      <TdCell>
                        {isIn  && <TypeBadge label="Inflow"  tone="inflow" />}
                        {isOut && <TypeBadge label="Outflow" tone="outflow" />}
                        {!isIn && !isOut && <TypeBadge label={t.mainCategory} tone="loan" />}
                      </TdCell>
                      <TdCell>{cat.category || '—'}</TdCell>
                      <TdCell>{cat.subCategory || '—'}</TdCell>
                      <TdCell>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {acc.type === 'cash'
                            ? <Wallet size={11} color="#65a30d" />
                            : <Landmark size={11} color="#2563eb" />}
                          {acc.name}
                        </span>
                      </TdCell>
                      <TdCell num>{fmt(t.amount || 0)}</TdCell>
                      <TdCell num tone="inflow"  bold>{isIn  ? fmt(totalPaid) : '—'}</TdCell>
                      <TdCell num tone="outflow" bold>{isOut ? fmt(totalPaid) : '—'}</TdCell>
                      <TdCell num>{fmt(running)}</TdCell>
                      <TdCell num tone={remaining > 0 ? 'outflow' : undefined}>{remaining > 0 ? fmt(remaining) : '—'}</TdCell>
                      <TdCell>
                        <StatusBadge status={t.paymentStatus} approvalStatus={t.approvalStatus} />
                      </TdCell>
                      <TdCell align="right">
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <IconAction title="View"   onClick={() => setViewTransaction(t)}     color="#4f46e5"><Eye size={12} /></IconAction>
                          <IconAction title="Edit"   onClick={() => handleEditTransaction(t.id)} color="#0f172a"><Edit size={12} /></IconAction>
                          <IconAction title="Delete" onClick={() => handleDeleteTransaction(t.id)} color="#dc2626"><Trash2 size={12} /></IconAction>
                        </div>
                      </TdCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Cells / chips / helpers ─────────────────────────────────────────────────

function SummaryCell({ tone, label, value, icon }: {
  tone: 'opening' | 'inflow' | 'outflow' | 'net' | 'cash' | 'banks';
  label: string; value: number; icon: React.ReactNode;
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    opening: { bg: '#fff7ed', fg: '#c2410c' },
    inflow:  { bg: '#ecfdf5', fg: '#059669' },
    outflow: { bg: '#fef2f2', fg: '#dc2626' },
    net:     { bg: '#f1f5f9', fg: '#0f172a' },
    cash:    { bg: '#f0f9ff', fg: '#0369a1' },
    banks:   { bg: '#eef2ff', fg: '#4338ca' },
  };
  const p = palette[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: p.bg, color: p.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: p.fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>{CURRENCY}</span>{fmt(value)}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, active, activeValue, onOpen, onClear }: {
  label: string; active: boolean; activeValue?: string;
  onOpen: () => void; onClear: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 99,
        border: `1px solid ${active ? '#0f172a' : '#e2e8f0'}`,
        backgroundColor: active ? '#0f172a' : '#fff',
        color: active ? '#fff' : '#334155',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}
    >
      {label}{active && activeValue ? `: ${activeValue}` : ''}
      {active
        ? <X size={12} onClick={e => { e.stopPropagation(); onClear(); }} />
        : <ChevronDown size={12} />}
    </button>
  );
}

function FilterChip({ icon, label, active, activeColor, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; activeColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 13px', borderRadius: 99,
      border: `1px solid ${active ? activeColor : '#e2e8f0'}`,
      backgroundColor: active ? activeColor : '#fff',
      color: active ? '#fff' : '#334155',
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>
      {icon} {label} <ChevronDown size={12} />
    </button>
  );
}

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 20,
      backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      boxShadow: '0 12px 28px rgba(15,23,42,0.14)', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

const PanelHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      {children}
    </div>
  );
}

function ListPanel({ title, empty, options, value, onPick }: {
  title: string; empty: string; options: string[]; value: string; onPick: (v: string) => void;
}) {
  return (
    <div style={{ minWidth: 220, maxHeight: 260, overflowY: 'auto' }}>
      <PanelHeader>{title}</PanelHeader>
      <PickRow selected={value === ''} onClick={() => onPick('')}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>All</span>
      </PickRow>
      {options.length === 0 ? (
        <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8' }}>{empty}</div>
      ) : options.map(o => (
        <PickRow key={o} selected={value === o} onClick={() => onPick(o)}>
          <span style={{ fontSize: 12 }}>{o}</span>
        </PickRow>
      ))}
    </div>
  );
}

const PickRow: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', cursor: 'pointer',
        backgroundColor: selected ? '#fff7ed' : '#fff',
        borderBottom: '1px solid #f8fafc',
      }}
    >
      {children}
      {selected && <Check size={12} color="#c2410c" />}
    </div>
  );
}

function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99, backgroundColor: '#eef2ff', color: '#3730a3',
      fontSize: 11, fontWeight: 700,
    }}>
      {label}
      <X size={10} style={{ cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );
}

const ThCell: React.FC<{
  children: React.ReactNode; tone?: 'inflow' | 'outflow'; align?: 'left' | 'right';
}> = ({ children, tone, align }) => {
  const toneBg = tone === 'inflow' ? '#ecfdf5' : tone === 'outflow' ? '#fef2f2' : 'transparent';
  const toneFg = tone === 'inflow' ? '#065f46' : tone === 'outflow' ? '#991b1b' : '#64748b';
  return (
    <th style={{
      padding: '12px 12px',
      textAlign: align || 'left',
      fontSize: 12, fontWeight: 600,
      color: toneFg, backgroundColor: toneBg, whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
};

const TdCell: React.FC<{
  children: React.ReactNode; num?: boolean; tone?: 'inflow' | 'outflow';
  bold?: boolean; mono?: boolean; weight?: number; color?: string; align?: 'left' | 'right';
}> = ({ children, num, tone, bold, mono, weight, color, align }) => {
  const toneBg = tone === 'inflow' ? '#f0fdf4' : tone === 'outflow' ? '#fef2f2' : 'transparent';
  const toneFg = tone === 'inflow' ? '#059669' : tone === 'outflow' ? '#dc2626' : color || '#334155';
  return (
    <td style={{
      padding: '12px 12px',
      fontSize: 13,
      fontWeight: weight ?? (bold ? 700 : 500),
      textAlign: align || (num ? 'right' : 'left'),
      color: toneFg,
      backgroundColor: toneBg,
      fontFamily: mono ? 'monospace' : undefined,
      fontVariantNumeric: num ? 'tabular-nums' : undefined,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </td>
  );
};

function TypeBadge({ label, tone }: { label: string; tone: 'inflow' | 'outflow' | 'loan' }) {
  const palette = {
    inflow:  { bg: '#ecfdf5', fg: '#059669', icon: <TrendingUp size={10} /> },
    outflow: { bg: '#fef2f2', fg: '#dc2626', icon: <TrendingDown size={10} /> },
    loan:    { bg: '#eef2ff', fg: '#4338ca', icon: null },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      backgroundColor: palette.bg, color: palette.fg,
      fontSize: 10, fontWeight: 700,
    }}>
      {palette.icon} {label}
    </span>
  );
}

function StatusBadge({ status, approvalStatus }: { status?: string; approvalStatus?: string }) {
  if (approvalStatus === 'pending_approval') {
    return <span style={pill('#fef3c7', '#92400e')}>Pending Approval</span>;
  }
  if (approvalStatus === 'rejected') {
    return <span style={pill('#fee2e2', '#991b1b')}>Rejected</span>;
  }
  if (status === 'Partial') return <span style={pill('#fef3c7', '#92400e')}>Partial</span>;
  if (status === 'Full')    return <span style={pill('#ecfdf5', '#065f46')}>Settled</span>;
  return <span style={pill('#f1f5f9', '#64748b')}>{status || '—'}</span>;
}
const pill = (bg: string, fg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99,
  backgroundColor: bg, color: fg, fontSize: 10, fontWeight: 700,
});

const IconAction: React.FC<{
  title: string; onClick: () => void; color: string; children: React.ReactNode;
}> = ({ title, onClick, color, children }) => {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: 26, height: 24, borderRadius: 6, border: '1px solid #e2e8f0',
        backgroundColor: '#fff', cursor: 'pointer', color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
};