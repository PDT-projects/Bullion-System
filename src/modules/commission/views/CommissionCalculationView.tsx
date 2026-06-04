// Commission Calculation View - Presentational Component
// FIXED:
//   - Added all missing props to the interface:
//     invoiceBreakdowns, expandedSalesperson, setExpandedSalesperson,
//     liveCommissions, liveCommissionsLoading, refreshLiveCommissions
//   - `cities` prop is `string[]` (dynamic, from invoice data) not `readonly string[]`
//   - All rendering unchanged.

import {
  Calculator, X, Maximize2, Minimize2, Check,
  AlertCircle, Edit2, Save, XCircle, FileText,
  ChevronDown, ChevronRight, Receipt, Search,
  CheckCircle, RefreshCw, MapPin,
} from 'lucide-react';
import type { Commission, InvoiceReference } from '../models/types';
import type { SalespersonInvoiceBreakdown } from '../viewModels/useCommissionCalculationViewModel';

interface CommissionCalculationViewProps {
  selectedCity:            string;
  setSelectedCity:         (city: string) => void;
  selectedMonth:           string;
  setSelectedMonth:        (month: string) => void;
  commissionData:          Commission[];
  calculationErrors:       string[];
  summary: {
    totalSalespeople: number; totalSales: number;
    totalCommission:  number; totalInvoicesUsed: number;
  } | null;
  // Invoice breakdown panel (shown after calculation)
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
  // Live commissions panel
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
  // Dynamic list built from invoice salespersonLocation values
  cities:                  string[];
  employees:               any[];
  totalInvoices?:          number;
  paidInvoices?:           number;
  // Debug prop injected by wrapper when troubleshooting
  debugInvoiceLocations?:  { id: string; salespersonLocation?: string; branch?: string; customerCity?: string; productLocation?: string; warrantyLocation?: string }[];
}

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Confirmed' ? 'bg-green-100 text-green-800' :
    status === 'Adjusted'  ? 'bg-yellow-100 text-yellow-800' :
                             'bg-blue-100 text-blue-800';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
      {status === 'Confirmed' && <CheckCircle size={10} />}
      {status}
    </span>
  );
}

export function CommissionCalculationView({
  selectedCity, setSelectedCity,
  selectedMonth, setSelectedMonth,
  commissionData, calculationErrors, summary,
  invoiceBreakdowns, expandedSalesperson, setExpandedSalesperson,
  showModal, setShowModal, isFullScreen, setIsFullScreen,
  isCalculating, isEditing, editValues, setEditValues,
  liveCommissions, liveCommissionsLoading, refreshLiveCommissions,
  calculateCommission, confirmSingleCommission, confirmAllCommissions,
  startEdit, saveEdit, cancelEdit,
  handleModalConfirm, handleModalCancel,
  formatCurrency, formatMonth, cities, employees, debugInvoiceLocations,
  totalInvoices = 0, paidInvoices = 0,
}: CommissionCalculationViewProps) {

  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || id;

  const toggleBreakdown = (id: string) =>
    setExpandedSalesperson(expandedSalesperson === id ? null : id);

  return (
    <div className="p-6 space-y-6">

      {/* Debug panel: show resolved invoice locations (temporary) */}
      {debugInvoiceLocations && debugInvoiceLocations.length > 0 && (
        <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <summary className="text-sm font-medium text-yellow-800">Debug: Invoice location samples ({debugInvoiceLocations.length})</summary>
          <div className="mt-2 text-xs text-gray-700 max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pr-2">ID</th>
                  <th className="pr-2">salespersonLocation</th>
                  <th className="pr-2">branch</th>
                  <th className="pr-2">customerCity</th>
                  <th className="pr-2">productLocation</th>
                  <th className="pr-2">warrantyLocation</th>
                </tr>
              </thead>
              <tbody>
                {debugInvoiceLocations.map(i => (
                  <tr key={i.id} className="odd:bg-yellow-25">
                    <td className="pr-2 font-mono text-[11px]">{i.id.slice(0,8)}</td>
                    <td className="pr-2">{i.salespersonLocation || '-'}</td>
                    <td className="pr-2">{i.branch || '-'}</td>
                    <td className="pr-2">{i.customerCity || '-'}</td>
                    <td className="pr-2">{i.productLocation || '-'}</td>
                    <td className="pr-2">{i.warrantyLocation || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Calculation</h1>
        <p className="text-gray-600 mt-1">
          Select a city and month, then click <strong>Calculate Commission</strong> to compute commissions
          from paid invoices according to the active slabs.
        </p>
      </div>

      {/* ── Summary cards (invoice counts) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><FileText size={18} className="text-blue-600" /></div>
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
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Calculator size={18} className="text-[#4f46e5]" />
            Calculate Commission
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Select a city and month to calculate commissions from paid invoices against the configured slabs.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City / Territory <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">
                  {cities.length === 0 ? 'No cities found in invoices' : 'Select City'}
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {cities.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No salesperson locations found. Make sure invoices have a <code>salespersonLocation</code> or <code>branch</code> set.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
          </div>

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
              disabled={isCalculating || !selectedCity || !selectedMonth}
              className="flex items-center gap-2 bg-[#4f46e5] text-white px-6 py-2.5 rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating
                ? <><RefreshCw size={18} className="animate-spin" /> Calculating...</>
                : <><Search size={18} /> Calculate Commission</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Invoice Breakdown Panel (shown after calculation, before modal) ── */}
      {invoiceBreakdowns.length > 0 && !showModal && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#4f46e5]/10 rounded-lg">
                <Receipt size={16} className="text-[#4f46e5]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Invoice Breakdown by Salesperson</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                <Receipt size={10} />
                {invoiceBreakdowns.reduce((s, b) => s + b.invoiceCount, 0)} invoices
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                {invoiceBreakdowns.length} salesperson{invoiceBreakdowns.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {invoiceBreakdowns.map((breakdown) => (
              <div key={breakdown.salespersonId} className={breakdown.isPooled ? 'bg-indigo-50/30' : ''}>

                {/* ── Pooled commission banner (Uzair Naseem only) ── */}
                {breakdown.isPooled && breakdown.pooledCitySales && (
                  <div className="mx-5 mt-4 mb-2 bg-white border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600">
                      <span className="text-white text-sm font-bold">⭐ Pooled Commission</span>
                      <span className="text-indigo-200 text-xs font-medium">
                        — Islamabad + Karachi + Lahore combined for slab matching
                      </span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-indigo-100 bg-white">
                      {breakdown.pooledCitySales.map(p => (
                        <div key={p.city} className="px-4 py-3">
                          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{p.city}</p>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.invoiceCount} invoice{p.invoiceCount !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border-t border-indigo-200">
                      <span className="text-xs font-semibold text-indigo-700">Combined Total (slab lookup basis)</span>
                      <span className="text-sm font-black text-indigo-700">{formatCurrency(breakdown.totalSales)}</span>
                    </div>
                  </div>
                )}

                {/* ── Salesperson toggle row ── */}
                {(() => {
                  const comm = commissionData.find(c => c.salesperson === breakdown.salespersonId);
                  const commAmount = comm ? (comm.overriddenCommissionAmount ?? comm.calculatedCommissionAmount) : null;
                  const commRate   = comm ? (comm.overriddenCommissionPercentage ?? comm.commissionPercentage) : null;
                  const slabLabel  = comm ? `${formatCurrency(comm.appliedSlabFrom)} – ${formatCurrency(comm.appliedSlabTo)}` : null;
                  const isExpanded = expandedSalesperson === breakdown.salespersonId;

                  return (
                    <button
                      className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50/70 transition-colors text-left"
                      onClick={() => toggleBreakdown(breakdown.salespersonId)}
                    >
                      {/* Left: chevron + name + meta */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {isExpanded
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900">{breakdown.salespersonName}</p>
                            {breakdown.isPooled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                ⭐ POOLED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {breakdown.invoiceCount} invoice{breakdown.invoiceCount !== 1 ? 's' : ''}
                            {breakdown.isPooled ? ' · Islamabad + Karachi + Lahore combined' : ''}
                          </p>
                          {slabLabel && commRate !== null && (
                            <p className="text-xs text-indigo-600 mt-0.5 font-medium">
                              Slab: {slabLabel} @ {commRate}%
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: stats chips */}
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                            {breakdown.isPooled ? 'Combined Sales' : 'Total Sales'}
                          </p>
                          <p className="text-sm font-bold text-gray-800">{formatCurrency(breakdown.totalSales)}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${breakdown.isPooled ? 'bg-indigo-500' : 'bg-[#4f46e5]'}`}
                                style={{ width: `${breakdown.slabProgressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">{breakdown.slabProgressPercent}%</span>
                          </div>
                        </div>

                        <div className="w-px h-10 bg-gray-200" />

                        {commAmount !== null ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-right min-w-[120px]">
                            <p className="text-[10px] text-green-600 uppercase tracking-wide font-semibold">Commission</p>
                            <p className="text-base font-black text-green-700 mt-0.5">{formatCurrency(commAmount)}</p>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-right min-w-[120px]">
                            <p className="text-[10px] text-red-500 uppercase tracking-wide font-semibold">Commission</p>
                            <div className="flex items-center gap-1 mt-0.5 justify-end">
                              <AlertCircle size={11} className="text-red-400" />
                              <p className="text-xs text-red-500 font-medium">No slab matched</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })()}

                {expandedSalesperson === breakdown.salespersonId && (
                  <div className="px-6 pb-4">
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            {breakdown.isPooled && (
                              <th className="px-4 py-2 text-left text-xs font-medium text-indigo-500 uppercase">City</th>
                            )}
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
                              {breakdown.isPooled && (
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    inv.salespersonLocation === 'Karachi'   ? 'bg-orange-100 text-orange-700' :
                                    inv.salespersonLocation === 'Lahore'    ? 'bg-purple-100 text-purple-700' :
                                    inv.salespersonLocation === 'Islamabad' ? 'bg-blue-100 text-blue-700'    :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <MapPin size={9} />
                                    {inv.salespersonLocation || 'Unknown'}
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-2 text-right font-medium text-gray-900">
                                {formatCurrency(inv.totalAmount)}
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
                            <td colSpan={breakdown.isPooled ? 3 : 2} className="px-4 py-2 text-xs font-semibold text-gray-700">
                              Total ({breakdown.invoiceCount} invoices)
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                              {formatCurrency(breakdown.totalSales)}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {breakdown.nextSlabThreshold && (
                      <div className="mt-2 text-xs text-[#4f46e5] bg-indigo-50 border border-indigo-100 rounded px-3 py-1.5">
                        Next slab starts at {formatCurrency(breakdown.nextSlabThreshold)} —
                        needs {formatCurrency(breakdown.nextSlabThreshold - breakdown.totalSales)} more in sales
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
                  Commission Results — {selectedCity} · {formatMonth(selectedMonth)}
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
                    <p className="text-2xl font-bold text-blue-600 mt-1">{summary.totalInvoicesUsed}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Salespeople</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalSalespeople}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalSales)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Commission</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalCommission)}</p>
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
                            <div>
                              {getEmployeeName(commission.salesperson)}
                              {commission.city?.includes('Pooled') && (
                                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                  ⭐ Pooled
                                </span>
                              )}
                              {(commission as any).notes && (
                                <p className="text-xs text-gray-400 mt-0.5 font-normal">{(commission as any).notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              <Receipt size={11} />{commission.invoiceCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(commission.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-center">
                            {formatCurrency(commission.appliedSlabFrom)} – {formatCurrency(commission.appliedSlabTo)}
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
                                {formatCurrency(commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount)}
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
                                  <button onClick={() => startEdit(commission)} disabled={commission.isLocked} className="p-1.5 hover:bg-blue-50 rounded transition-colors text-blue-600 disabled:opacity-30" title="Edit">
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
                <button onClick={handleModalConfirm} className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
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