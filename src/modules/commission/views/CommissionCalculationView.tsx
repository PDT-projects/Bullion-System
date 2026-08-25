// Commission Calculation View - Presentational Component
// CHANGED (salesperson-first multi-select):
//   - City dropdown removed; replaced with a multi-select salesperson dropdown
//     (checkbox list with search, "Select All", badge counts).
//   - Props updated: `selectedCity` / `setSelectedCity` replaced with
//     `selectedSalespersons`, `toggleSalesperson`, `clearSalespersons`, `allEmployees`.
//   - Inline "No commission slab" / "No invoices" messages shown per person
//     in the breakdown panel (read from `breakdown.noSlabMessage`).
//   - All other panels (modal, live commissions, invoice breakdown table) unchanged.
//   - COLOR THEME: Charcoal (#2d2d2d) replaces all indigo/blue accents.
// CHANGED (dual-currency AED + PKR):
//   - All monetary amounts now show AED (primary) + PKR (secondary).
//   - formatDual() from currencyUtils is used for every amount display.
//   - A subtle exchange-rate note is shown in the calculation form header.

import { useState, useRef, useEffect } from 'react';
import { formatDual, formatAED, formatPKR, PKR_TO_AED } from '../models/currencyUtils';
import {
  Calculator, X, Maximize2, Minimize2, Check,
  AlertCircle, Edit2, Save, XCircle, FileText,
  ChevronDown, ChevronRight, Receipt, Search,
  CheckCircle, RefreshCw, Users, ChevronUp,
} from 'lucide-react';
import type { Commission, InvoiceReference } from '../models/types';
import type { SalespersonInvoiceBreakdown } from '../viewModels/useCommissionCalculationViewModel';

// ─── Charcoal palette constants ───────────────────────────────────────────────
const C = {
  dark:        '#2d2d2d',
  darker:      '#1a1a1a',
  bg:          '#f0f0f0',   // light charcoal tint for row backgrounds
  bgMid:       '#e8e8e8',   // slightly darker tint for badges
  border:      '#c8c8c8',
  borderDark:  '#2d2d2d',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommissionCalculationViewProps {
  selectedSalespersons:    string[];
  toggleSalesperson:       (id: string) => void;
  clearSalespersons:       () => void;
  allEmployees:            { id: string; name: string }[];

  selectedMonth:           string;
  setSelectedMonth:        (month: string) => void;
  commissionData:          Commission[];
  calculationErrors:       string[];
  summary: {
    totalSalespeople: number; totalSales: number;
    totalCommission:  number; totalInvoicesUsed: number;
  } | null;
  invoiceBreakdowns:       SalespersonInvoiceBreakdown[];
  expandedSalesperson:     string | null;
  setExpandedSalesperson:  (id: string | null) => void;
  showModal:               boolean;
  setShowModal:            (show: boolean) => void;
  isFullScreen:            boolean;
  setIsFullScreen:         (full: boolean) => void;
  isCalculating:           boolean;
  isEditing:               string | null;
  editValues:              { percentage: number; amount: number };
  setEditValues:           (values: { percentage: number; amount: number }) => void;
  liveCommissions:         Commission[];
  liveCommissionsLoading:  boolean;
  refreshLiveCommissions:  () => void;
  calculateCommission:     () => void;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions:   () => void;
  startEdit:               (commission: Commission) => void;
  saveEdit:                (commissionId: string) => void;
  cancelEdit:              () => void;
  handleModalConfirm:      () => void;
  handleModalCancel:       () => void;
  formatCurrency:          (amount: number) => string;
  formatMonth:             (monthStr: string) => string;
  totalInvoices?:          number;
  paidInvoices?:           number;
  cities?:                 string[];
  employees?:              any[];
  debugInvoiceLocations?:  any[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Confirmed' ? 'bg-green-100 text-green-800' :
    status === 'Adjusted'  ? 'bg-yellow-100 text-yellow-800' :
                             'text-gray-700';
  const style = (status !== 'Confirmed' && status !== 'Adjusted')
    ? { backgroundColor: C.bgMid } : undefined;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}
      style={style}
    >
      {status === 'Confirmed' && <CheckCircle size={10} />}
      {status}
    </span>
  );
}

// ─── Multi-select salesperson dropdown ───────────────────────────────────────

interface SalespersonDropdownProps {
  allEmployees:  { id: string; name: string }[];
  selectedIds:   string[];
  onToggle:      (id: string) => void;
  onClear:       () => void;
  onSelectAll:   () => void;
}

function SalespersonDropdown({
  allEmployees, selectedIds, onToggle, onClear, onSelectAll,
}: SalespersonDropdownProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const containerRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered   = allEmployees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = allEmployees.length > 0 && selectedIds.length === allEmployees.length;

  let buttonLabel: React.ReactNode;
  if (selectedIds.length === 0) {
    buttonLabel = <span className="text-gray-400">Select salesperson(s)…</span>;
  } else if (selectedIds.length === 1) {
    const emp = allEmployees.find(e => e.id === selectedIds[0]);
    buttonLabel = <span className="font-medium" style={{ color: C.dark }}>{emp?.name ?? selectedIds[0]}</span>;
  } else {
    buttonLabel = (
      <span className="font-medium" style={{ color: C.dark }}>
        {selectedIds.length} salesperson{selectedIds.length > 1 ? 's' : ''} selected
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm min-h-[40px] focus:outline-none"
        style={{ boxShadow: open ? `0 0 0 2px ${C.dark}` : undefined }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Users size={15} className="text-gray-400 flex-shrink-0" />
          {buttonLabel}
          {selectedIds.length > 0 && (
            <span
              className="inline-flex items-center justify-center px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full min-w-[18px]"
              style={{ backgroundColor: C.dark }}
            >
              {selectedIds.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search salesperson…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
                style={{ boxShadow: undefined }}
                onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${C.dark}`)}
                onBlur={e  => (e.currentTarget.style.boxShadow = '')}
              />
            </div>
          </div>

          {/* Select all / Clear row */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
            <button
              type="button"
              onClick={allSelected ? onClear : onSelectAll}
              className="text-xs font-semibold hover:underline"
              style={{ color: C.dark }}
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {/* Employee list */}
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No salespersons found</li>
            )}
            {filtered.map(emp => {
              const checked = selectedIds.includes(emp.id);
              return (
                <li key={emp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <button
                    type="button"
                    onClick={() => onToggle(emp.id)}
                    data-checked={checked ? 'true' : 'false'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left"
                    style={{
                      backgroundColor: checked ? '#e0e0e0' : 'transparent',
                      borderLeft: checked ? `3px solid #2d2d2d` : '3px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (e.currentTarget.dataset.checked !== 'true') {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={e => {
                      if (e.currentTarget.dataset.checked !== 'true') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* Custom checkbox — uses inline style so it always renders */}
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: checked ? C.dark : '#ffffff',
                        border: checked ? `2px solid ${C.dark}` : '2px solid #d1d5db',
                      }}
                    >
                      {checked && <Check size={10} color="#ffffff" strokeWidth={3} />}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: checked ? C.dark : '#374151', fontWeight: checked ? 600 : 400 }}
                    >
                      {emp.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Done button */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-1.5 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: C.dark }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.darker)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.dark)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function CommissionCalculationView({
  selectedSalespersons, toggleSalesperson, clearSalespersons, allEmployees,
  selectedMonth, setSelectedMonth,
  commissionData, calculationErrors, summary,
  invoiceBreakdowns, expandedSalesperson, setExpandedSalesperson,
  showModal, setShowModal, isFullScreen, setIsFullScreen,
  isCalculating, isEditing, editValues, setEditValues,
  liveCommissions, liveCommissionsLoading, refreshLiveCommissions,
  calculateCommission, confirmSingleCommission, confirmAllCommissions,
  startEdit, saveEdit, cancelEdit,
  handleModalConfirm, handleModalCancel,
  formatCurrency, formatMonth,
  totalInvoices = 0, paidInvoices = 0,
}: CommissionCalculationViewProps) {

  const getEmployeeName = (id: string) =>
    allEmployees.find(e => e.id === id)?.name || id;

  const toggleBreakdown = (id: string) =>
    setExpandedSalesperson(expandedSalesperson === id ? null : id);

  const selectAll = () =>
    allEmployees.filter(e => !selectedSalespersons.includes(e.id)).forEach(e => toggleSalesperson(e.id));

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Calculation</h1>
        <p className="text-gray-600 mt-1">
          Select one or more salespersons and a month, then click <strong>Calculate Commission</strong>{' '}
          to compute commissions from their paid invoices against the active slabs.
        </p>
      </div>

      {/* ── Invoice count cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: C.bg }}>
              <FileText size={18} style={{ color: C.dark }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Check size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Paid Invoices</p>
              <p className="text-2xl font-bold text-green-600">{paidInvoices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Calculation Form ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calculator size={18} style={{ color: C.dark }} />
                Calculate Commission
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Select salesperson(s) and a month to calculate commissions from paid invoices against configured slabs.
              </p>
            </div>
            {/* Exchange rate notice */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: C.bg, color: C.dark, border: `1px solid ${C.border}` }}
            >
              <span>💱</span>
              <span>1 PKR = {formatAED(1)} &nbsp;·&nbsp; All amounts shown as AED / PKR</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Salesperson multi-select ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salesperson <span className="text-red-500">*</span>
              </label>
              <SalespersonDropdown
                allEmployees={allEmployees}
                selectedIds={selectedSalespersons}
                onToggle={toggleSalesperson}
                onClear={clearSalespersons}
                onSelectAll={selectAll}
              />
              {allEmployees.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No employees found. Make sure employee records are loaded.
                </p>
              )}
              {selectedSalespersons.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {selectedSalespersons.length} of {allEmployees.length} salesperson{selectedSalespersons.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* ── Month ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${C.dark}`)}
                onBlur={e  => (e.currentTarget.style.boxShadow = '')}
              />
            </div>
          </div>

          {/* ── Selected salesperson chips ── */}
          {selectedSalespersons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSalespersons.map(id => {
                const emp = allEmployees.find(e => e.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-white text-xs font-semibold rounded-full"
                    style={{ backgroundColor: C.dark }}
                  >
                    {emp?.name ?? id}
                    <button
                      type="button"
                      onClick={() => toggleSalesperson(id)}
                      className="hover:text-red-300 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Errors ── */}
          {calculationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {calculationErrors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={calculateCommission}
              disabled={isCalculating || selectedSalespersons.length === 0 || !selectedMonth}
              className="flex items-center gap-2 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: C.dark }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = C.darker; }}
              onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = C.dark; }}
            >
              {isCalculating
                ? <><RefreshCw size={18} className="animate-spin" /> Calculating…</>
                : <><Search size={18} /> Calculate Commission</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Invoice Breakdown Panel ── */}
      {invoiceBreakdowns.length > 0 && !showModal && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: C.bg }}>
                <Receipt size={16} style={{ color: C.dark }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Commission Breakdown by Salesperson</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full"
                style={{ backgroundColor: C.bg, color: C.dark, border: `1px solid ${C.border}` }}
              >
                <Receipt size={10} />
                {invoiceBreakdowns.reduce((s, b) => s + b.invoiceCount, 0)} invoices
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full"
                style={{ backgroundColor: C.bgMid, color: C.dark, border: `1px solid ${C.border}` }}
              >
                {invoiceBreakdowns.length} salesperson{invoiceBreakdowns.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {invoiceBreakdowns.map((breakdown) => {
              const hasNoSlab = !!breakdown.noSlabMessage;

              return (
                <div key={breakdown.salespersonId}>
                  {(() => {
                    const commission = commissionData.find(c => c.salesperson === breakdown.salespersonId);
                    const commAmt = commission
                      ? commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount
                      : 0;
                    const pct = commission
                      ? commission.overriddenCommissionPercentage ?? commission.commissionPercentage
                      : 0;
                    const isExpanded = expandedSalesperson === breakdown.salespersonId;

                    return (
                      <button
                        type="button"
                        onClick={() => breakdown.invoiceCount > 0 && toggleBreakdown(breakdown.salespersonId)}
                        className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors ${
                          breakdown.invoiceCount > 0 ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        style={{ backgroundColor: isExpanded ? C.bg : undefined }}
                        onMouseEnter={e => { if (breakdown.invoiceCount > 0 && !isExpanded) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = ''; }}
                      >
                        {/* Expand chevron */}
                        <div className="flex-shrink-0">
                          {breakdown.invoiceCount > 0
                            ? (isExpanded
                                ? <ChevronDown size={16} style={{ color: C.dark }} />
                                : <ChevronRight size={16} className="text-gray-400" />)
                            : <span className="w-4" />
                          }
                        </div>

                        {/* Name + invoice count */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">
                              {breakdown.salespersonName}
                            </span>
                            {breakdown.invoiceCount > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full"
                                style={{ backgroundColor: C.bgMid, color: C.dark }}
                              >
                                <Receipt size={10} /> {breakdown.invoiceCount} invoice{breakdown.invoiceCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          {!hasNoSlab && breakdown.invoiceCount > 0 && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${breakdown.slabProgressPercent}%`, backgroundColor: C.dark }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400">{breakdown.slabProgressPercent}% of slab</span>
                            </div>
                          )}
                        </div>

                        {/* Total sales */}
                        {breakdown.invoiceCount > 0 && (
                          <div className="text-right flex-shrink-0 hidden sm:block">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Sales</p>
                            <p className="text-sm font-bold text-gray-900">{formatDual(breakdown.totalSales)}</p>
                          </div>
                        )}

                        {/* Commission amount or no-slab badge */}
                        <div className="flex-shrink-0 min-w-[130px] text-right">
                          {hasNoSlab ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-right">
                              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide leading-none">No Commission</p>
                                <p className="text-[11px] text-red-400 mt-0.5 leading-tight">
                                  {breakdown.invoiceCount === 0
                                    ? 'No paid invoices'
                                    : `No slab for ${formatAED(breakdown.totalSales)}`}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-right min-w-[140px]">
                              <p className="text-[10px] text-green-600 uppercase tracking-wide font-semibold">Commission</p>
                              <p className="text-base font-black text-green-700">{formatAED(commAmt)}</p>
                              <p className="text-[10px] text-green-500 font-medium">({formatPKR(commAmt)})</p>
                              <p className="text-[10px] text-green-500 mt-0.5">{pct}% applied</p>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })()}

                  {/* ── Expanded invoice table ── */}
                  {expandedSalesperson === breakdown.salespersonId && breakdown.invoiceCount > 0 && (
                    <div className="px-6 pb-4">
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {breakdown.invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-mono text-xs text-gray-700">{inv.id}</td>
                                <td className="px-4 py-2 text-gray-700">
                                  {new Date(inv.date).toLocaleDateString('en-PK', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                  })}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                  {inv.salespersonLocation || inv.branch || inv.customerCity || '—'}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">
                                  {formatDual(inv.totalAmount)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-700">
                                Total ({breakdown.invoiceCount} invoice{breakdown.invoiceCount !== 1 ? 's' : ''})
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                                {formatDual(breakdown.totalSales)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {breakdown.nextSlabThreshold && (
                        <div
                          className="mt-2 text-xs rounded px-3 py-1.5"
                          style={{ color: C.dark, backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                        >
                          Next slab starts at {formatAED(breakdown.nextSlabThreshold)} —{' '}
                          needs {formatAED(breakdown.nextSlabThreshold - breakdown.totalSales)} more in sales
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Results Modal ── */}
      {showModal && (
        <div className={isFullScreen
          ? 'fixed inset-0 z-50 bg-white overflow-auto'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
        }>
          <div className={isFullScreen
            ? 'w-full min-h-full flex flex-col'
            : 'bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden'
          }>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Commission Results — {formatMonth(selectedMonth)}
                </h2>
                {summary && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {summary.totalInvoicesUsed} paid invoice{summary.totalInvoicesUsed !== 1 ? 's' : ''} ·{' '}
                    {summary.totalSalespeople} salesperson{summary.totalSalespeople !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Summary cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Invoices Used</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: C.dark }}>{summary.totalInvoicesUsed}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Salespeople</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalSalespeople}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatDual(summary.totalSales)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Commission</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatDual(summary.totalCommission)}</p>
                  </div>
                </div>
              )}

              {/* Commission Table */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Calculated Commissions</h3>
                  <button
                    onClick={confirmAllCommissions}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Check size={16} /> Confirm All
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoices</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Applied Slab</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commission %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissionData.map((commission) => (
                        <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {getEmployeeName(commission.salesperson)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full"
                              style={{ backgroundColor: C.bgMid, color: C.dark }}
                            >
                              <Receipt size={11} />{commission.invoiceCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatDual(commission.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-center">
                            {formatAED(commission.appliedSlabFrom)} – {formatAED(commission.appliedSlabTo)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEditing === commission.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editValues.percentage}
                                  onChange={(e) => setEditValues({ ...editValues, percentage: parseFloat(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                  step="0.01" min="0" max="100"
                                />
                                <span className="text-gray-500 text-sm">%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-900">
                                {commission.overriddenCommissionPercentage ?? commission.commissionPercentage}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing === commission.id ? (
                              <input
                                type="number"
                                value={editValues.amount}
                                onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
                                {formatDual(commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={commission.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing === commission.id ? (
                                <>
                                  <button onClick={() => saveEdit(commission.id)} className="p-1.5 hover:bg-green-50 rounded transition-colors text-green-600" title="Save">
                                    <Save size={16} />
                                  </button>
                                  <button onClick={cancelEdit} className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-600" title="Cancel">
                                    <XCircle size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(commission)} disabled={commission.isLocked} className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-30" style={{ color: C.dark }} title="Edit">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => confirmSingleCommission(commission.id)} disabled={commission.isLocked} className="p-1.5 hover:bg-green-50 rounded transition-colors text-green-600 disabled:opacity-30" title="Confirm">
                                    <Check size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <p className="text-sm text-gray-500">
                {commissionData.filter(c => c.status === 'Confirmed').length} of {commissionData.length} confirmed
              </p>
              <div className="flex gap-3">
                <button onClick={handleModalCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ backgroundColor: C.dark }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.darker)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.dark)}
                >
                  Save All to Firestore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}