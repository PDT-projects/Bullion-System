// Commission Calculation View - Presentational Component
// UPDATED:
//   - Live Commissions panel shows all auto-calculated records from invoice saves
//   - Each live record shows salesperson, city, month, invoices, sales, commission, status
//   - History section groups records by month for a full timeline view
//   - Confirm button on live records to quickly confirm individual records

import {
  Calculator, X, Maximize2, Minimize2, Check,
  AlertCircle, Edit2, Save, XCircle, FileText,
  Info, ChevronDown, ChevronRight, Receipt,
  TrendingUp, Clock, CheckCircle, RefreshCw,
  Zap, History, BarChart2,
} from 'lucide-react';
import { useState } from 'react';
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
  // Live auto-calculated commissions from invoice saves
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
  cities:                  readonly string[];
  employees:               any[];
  totalInvoices?:          number;
  paidInvoices?:           number;
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
      {status === 'Calculated' && <Clock size={10} />}
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
  formatCurrency, formatMonth, cities, employees,
  totalInvoices = 0, paidInvoices = 0,
}: CommissionCalculationViewProps) {

  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || id;

  const toggleBreakdown = (id: string) =>
    setExpandedSalesperson(expandedSalesperson === id ? null : id);

  // Group live commissions by month for history view
  const byMonth: Record<string, Commission[]> = {};
  liveCommissions.forEach((c) => {
    if (!byMonth[c.month]) byMonth[c.month] = [];
    byMonth[c.month].push(c);
  });
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  const pendingCount    = liveCommissions.filter(c => c.status === 'Calculated').length;
  const confirmedCount  = liveCommissions.filter(c => c.status === 'Confirmed').length;
  const totalCommission = liveCommissions.reduce(
    (s, c) => s + (c.overriddenCommissionAmount ?? c.calculatedCommissionAmount), 0
  );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Calculation</h1>
        <p className="text-gray-600 mt-1">
          Commissions are auto-calculated from paid invoices. Review, adjust and confirm below.
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><Clock size={18} className="text-orange-500" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending Confirmation</p>
              <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Commission</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live / History tabs + Manual Calculate ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'live'
                  ? 'border-[#4f46e5] text-[#4f46e5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap size={15} />
              Live Auto-Calculated
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-[#4f46e5] text-[#4f46e5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <History size={15} />
              History by Month
            </button>
          </div>
          <button
            onClick={refreshLiveCommissions}
            disabled={liveCommissionsLoading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors mb-2"
          >
            <RefreshCw size={14} className={liveCommissionsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── LIVE TAB ── */}
        {activeTab === 'live' && (
          <div className="p-6">
            {liveCommissionsLoading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <RefreshCw size={20} className="animate-spin" />
                Loading commissions...
              </div>
            ) : liveCommissions.length === 0 ? (
              <div className="text-center py-12">
                <Zap size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No commissions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Commissions appear here automatically when paid invoices are saved.
                </p>
              </div>
            ) : (
              <>
                {/* Pending section */}
                {pendingCount > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                        <Clock size={15} />
                        Pending Confirmation ({pendingCount})
                      </h3>
                      <button
                        onClick={confirmAllCommissions}
                        className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={13} /> Confirm All Pending
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-orange-200">
                      <table className="w-full text-sm">
                        <thead className="bg-orange-50 border-b border-orange-200">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-800 uppercase">Salesperson</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-800 uppercase">City</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-800 uppercase">Month</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-orange-800 uppercase">Invoices</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-orange-800 uppercase">Total Sales</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-orange-800 uppercase">Rate</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-orange-800 uppercase">Commission</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-orange-800 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-100 bg-white">
                          {liveCommissions
                            .filter(c => c.status === 'Calculated')
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-orange-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{c.salespersonName}</td>
                                <td className="px-4 py-3 text-gray-700">{c.city}</td>
                                <td className="px-4 py-3 text-gray-700">{formatMonth(c.month)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    <Receipt size={10} />{c.invoiceCount}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatCurrency(c.totalSales)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-700">
                                  {c.overriddenCommissionPercentage ?? c.commissionPercentage}%
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-orange-700">
                                  {formatCurrency(c.overriddenCommissionAmount ?? c.calculatedCommissionAmount)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => confirmSingleCommission(c.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <Check size={11} /> Confirm
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Confirmed / Adjusted section */}
                {confirmedCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-3">
                      <CheckCircle size={15} />
                      Confirmed ({confirmedCount})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-green-200">
                      <table className="w-full text-sm">
                        <thead className="bg-green-50 border-b border-green-200">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-green-800 uppercase">Salesperson</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-green-800 uppercase">City</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-green-800 uppercase">Month</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-green-800 uppercase">Invoices</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-green-800 uppercase">Sales</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-green-800 uppercase">Commission</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-green-800 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-100 bg-white">
                          {liveCommissions
                            .filter(c => c.status !== 'Calculated')
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{c.salespersonName}</td>
                                <td className="px-4 py-3 text-gray-700">{c.city}</td>
                                <td className="px-4 py-3 text-gray-700">{formatMonth(c.month)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    <Receipt size={10} />{c.invoiceCount}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatCurrency(c.totalSales)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-green-700">
                                  {formatCurrency(c.overriddenCommissionAmount ?? c.calculatedCommissionAmount)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <StatusBadge status={c.status} />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="p-6">
            {liveCommissionsLoading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <RefreshCw size={20} className="animate-spin" /> Loading history...
              </div>
            ) : sortedMonths.length === 0 ? (
              <div className="text-center py-12">
                <History size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No commission history yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedMonths.map((month) => {
                  const records    = byMonth[month];
                  const monthTotal = records.reduce(
                    (s, c) => s + (c.overriddenCommissionAmount ?? c.calculatedCommissionAmount), 0
                  );
                  const pending    = records.filter(c => c.status === 'Calculated').length;
                  return (
                    <div key={month} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Month header */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <BarChart2 size={16} className="text-[#4f46e5]" />
                          <span className="font-semibold text-gray-800">{formatMonth(month)}</span>
                          {pending > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                              {pending} pending
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#4f46e5]">
                          {formatCurrency(monthTotal)} total
                        </span>
                      </div>

                      {/* Records table */}
                      <table className="w-full text-sm">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Invoices</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Slab</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {records.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{c.salespersonName}</td>
                              <td className="px-4 py-3 text-gray-700">{c.city}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  <Receipt size={10} />{c.invoiceCount}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(c.totalSales)}</td>
                              <td className="px-4 py-3 text-center text-xs text-gray-500">
                                {formatCurrency(c.appliedSlabFrom)} – {formatCurrency(c.appliedSlabTo)}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {c.overriddenCommissionPercentage ?? c.commissionPercentage}%
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {formatCurrency(c.overriddenCommissionAmount ?? c.calculatedCommissionAmount)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={c.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-gray-600">
                              {records.length} record{records.length !== 1 ? 's' : ''}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-[#4f46e5]">
                              {formatCurrency(monthTotal)}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Manual Calculation Form ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Calculator size={18} className="text-[#4f46e5]" />
            Manual Calculation
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Recalculate commission for a specific city and month — useful for corrections or overrides.
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
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {selectedCity === 'Islamabad' && (
                <p className="mt-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  ⭐ <strong>Uzair Naseem</strong> will have his commission calculated on pooled sales: Islamabad + Karachi + Lahore combined.
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
              <Calculator size={18} />
              {isCalculating ? 'Calculating...' : 'Calculate Commission'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Invoice Breakdown Panel (shown after manual calculation) ── */}
      {invoiceBreakdowns.length > 0 && !showModal && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-[#4f46e5]" />
              <h3 className="text-lg font-medium text-gray-900">Invoice Breakdown by Salesperson</h3>
            </div>
            <span className="text-sm text-gray-500">
              {invoiceBreakdowns.reduce((s, b) => s + b.invoiceCount, 0)} paid invoices ·{' '}
              {invoiceBreakdowns.length} salespeople
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {invoiceBreakdowns.map((breakdown) => (
              <div key={breakdown.salespersonId} className={breakdown.isPooled ? 'bg-indigo-50/30' : ''}>

                {/* ── Pooled commission banner (Uzair Naseem only) ── */}
                {breakdown.isPooled && breakdown.pooledCitySales && (
                  <div className="mx-5 mt-4 mb-2 bg-white border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm">
                    {/* Banner header row */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600">
                      <span className="text-white text-sm font-bold">⭐ Pooled Commission</span>
                      <span className="text-indigo-200 text-xs font-medium">
                        — Islamabad + Karachi + Lahore combined for slab matching
                      </span>
                    </div>
                    {/* City breakdown cards */}
                    <div className="grid grid-cols-3 divide-x divide-indigo-100 bg-white">
                      {breakdown.pooledCitySales.map(p => (
                        <div key={p.city} className="px-4 py-3">
                          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{p.city}</p>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.invoiceCount} invoice{p.invoiceCount !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                    {/* Combined total footer */}
                    <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border-t border-indigo-200">
                      <span className="text-xs font-semibold text-indigo-700">Combined Total (slab lookup basis)</span>
                      <span className="text-sm font-black text-indigo-700">{formatCurrency(breakdown.totalSales)}</span>
                    </div>
                  </div>
                )}

                {/* ── Salesperson toggle row ── */}
                <button
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors text-left"
                  onClick={() => toggleBreakdown(breakdown.salespersonId)}
                >
                  <div className="flex items-center gap-3">
                    {expandedSalesperson === breakdown.salespersonId
                      ? <ChevronDown size={16} className="text-gray-400" />
                      : <ChevronRight size={16} className="text-gray-400" />
                    }
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{breakdown.salespersonName}</p>
                      <p className="text-xs text-gray-500">
                        {breakdown.invoiceCount} invoice{breakdown.invoiceCount !== 1 ? 's' : ''}
                        {breakdown.isPooled && (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-indigo-600 font-semibold">
                            · pooled: all 3 cities
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${breakdown.isPooled ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-[#4f46e5] to-purple-500'}`}
                          style={{ width: `${breakdown.slabProgressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{breakdown.slabProgressPercent}%</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(breakdown.totalSales)}</p>
                    <p className="text-xs text-gray-500">{breakdown.isPooled ? 'combined sales' : 'total sales'}</p>
                  </div>
                </button>

                {expandedSalesperson === breakdown.salespersonId && (
                  <div className="px-6 pb-4">
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
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
                            <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-gray-700">
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