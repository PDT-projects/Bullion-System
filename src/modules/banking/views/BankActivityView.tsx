// Banking Module - Bank Activity Report View
// BankActivityView - Shows all financial transactions across banks, cash, and inventory

import React, { useState } from 'react';
import {
  ArrowLeft, RefreshCw, Search, Filter, X, Banknote, Building2,
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Package, TrendingUp,
  TrendingDown, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useBankActivityViewModel, ActivityEntry, ActivityType } from '../viewModels/useBankActivityViewModel';
import { useNavigate } from 'react-router-dom';

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ActivityType }) {
  const cfg: Record<ActivityType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    bank_debit:    { label: 'Bank Debit',    color: '#dc2626', bg: '#fef2f2', Icon: ArrowUpCircle },
    bank_credit:   { label: 'Bank Credit',   color: '#16a34a', bg: '#f0fdf4', Icon: ArrowDownCircle },
    bank_transfer: { label: 'Transfer',      color: '#7c3aed', bg: '#f5f3ff', Icon: ArrowLeftRight },
    cash_in:       { label: 'Cash In',       color: '#16a34a', bg: '#f0fdf4', Icon: TrendingUp },
    cash_out:      { label: 'Cash Out',      color: '#d97706', bg: '#fffbeb', Icon: TrendingDown },
    inventory:     { label: 'Inventory',     color: '#0891b2', bg: '#ecfeff', Icon: Package },
  };
  const { label, color, bg, Icon } = cfg[type] || cfg.bank_debit;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      color, backgroundColor: bg,
    }}>
      <Icon size={10} /> {label}
    </span>
  );
}

// ── Mode badge ────────────────────────────────────────────────────────────────
function ModeBadge({ mode, bankName }: { mode: 'Bank' | 'Cash'; bankName?: string }) {
  return mode === 'Bank' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#2563eb' }} title={bankName}>
      <Building2 size={11} /> {bankName || 'Bank'}
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#16a34a' }}>
      <Banknote size={11} /> Cash
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, Icon }: {
  label: string; value: string; sub?: string; color: string; Icon: React.ElementType;
}) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>}
    </div>
  );
}

export function BankActivityView() {
  const navigate = useNavigate();
  const {
    filteredEntries, banks, uniqueCategories,
    stats, isLoading, error, filters,
    setFilter, clearFilters, refreshData, formatCurrency, formatDate,
  } = useBankActivityViewModel();

  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const activeFilterCount = [
    filters.searchTerm, filters.bankId, filters.mode !== 'all' ? filters.mode : '',
    filters.category, filters.dateFrom, filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Bank Activity Report</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              All transactions — banks, cash, inventory payments, transfers
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setShowFilters(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                backgroundColor: showFilters ? '#4f46e5' : '#fff',
                color: showFilters ? '#fff' : '#374151',
              }}>
              <Filter size={14} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button onClick={() => refreshData()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="Bank Debits"   value={formatCurrency(stats.totalBankDebits)}  color="#dc2626" Icon={ArrowUpCircle} sub={`Net: ${formatCurrency(stats.netBankFlow)}`} />
          <StatCard label="Bank Credits"  value={formatCurrency(stats.totalBankCredits)} color="#16a34a" Icon={ArrowDownCircle} />
          <StatCard label="Cash Out"      value={formatCurrency(stats.totalCashOut)}      color="#d97706" Icon={TrendingDown} sub={`Cash In: ${formatCurrency(stats.totalCashIn)}`} />
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        {showFilters && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="text" value={filters.searchTerm}
                  onChange={e => setFilter('searchTerm', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Search description, bank, ref…" />
              </div>

              {/* Bank */}
              <select value={filters.bankId} onChange={e => setFilter('bankId', e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none' }}>
                <option value="">All Banks</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              {/* Mode */}
              <select value={filters.mode} onChange={e => setFilter('mode', e.target.value as any)}
                style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none' }}>
                <option value="all">All Modes</option>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* Category */}
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none' }}>
                <option value="">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Date from */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Date From</label>
                <input type="date" value={filters.dateFrom}
                  onChange={e => setFilter('dateFrom', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Date to */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Date To</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={filters.dateTo}
                    onChange={e => setFilter('dateTo', e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 12px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Sorted newest first</span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 13 }}>
              Loading activity data…
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9ca3af', gap: 8 }}>
              <Activity size={36} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: 13 }}>No activity found</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Date', 'Type', 'Description', 'Reference', 'Mode / Bank', 'Amount', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => {
                  const isExpanded = expandedId === entry.id;
                  const isDebit    = ['bank_debit', 'cash_out', 'bank_transfer'].includes(entry.type);
                  const isEven     = idx % 2 === 0;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr style={{ backgroundColor: isEven ? '#fff' : '#fafafa', cursor: 'pointer' }}
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
                          {formatDate(entry.date)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <TypeBadge type={entry.type} />
                          {entry.isInstalment && (
                            <span style={{ marginLeft: 4, fontSize: 9, color: '#7c3aed', fontWeight: 700, backgroundColor: '#f5f3ff', padding: '1px 5px', borderRadius: 10 }}>
                              INST #{entry.instalmentIndex}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.description}>
                            {entry.description || '—'}
                          </div>
                          {entry.category && (
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{entry.category}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 11, color: '#6366f1', fontFamily: 'monospace', fontWeight: 600 }}>
                          {entry.reference || '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <ModeBadge mode={entry.mode} bankName={entry.bankName} />
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: isDebit ? '#dc2626' : '#16a34a', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isDebit ? '−' : '+'}{formatCurrency(entry.amount)}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f5f3ff' }}>
                          <td colSpan={7} style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px', fontSize: 11 }}>
                              {[
                                ['Date',        formatDate(entry.date)],
                                ['Type',        entry.type.replace('_', ' ').toUpperCase()],
                                ['Mode',        entry.mode],
                                ['Bank',        entry.bankName || '—'],
                                ['Reference',   entry.reference || '—'],
                                ['Category',    entry.category || '—'],
                                ['Amount',      formatCurrency(entry.amount)],
                                ['Note',        entry.note || '—'],
                              ].map(([k, v]) => (
                                <div key={k}>
                                  <span style={{ color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>{k}</span>
                                  <div style={{ color: '#1e1b4b', fontWeight: 600, marginTop: 2 }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}