// Invoice Module - List View

import React, { useState } from 'react';

// ── Currency helpers ──────────────────────────────────────────────────────────
type DisplayCurrency = 'PKR' | 'AED';
const AED_TO_PKR = 76.03;

function convertToDisplay(pkrAmount: number, currency: DisplayCurrency): number {
  return currency === 'AED' ? pkrAmount / AED_TO_PKR : pkrAmount;
}
// ─────────────────────────────────────────────────────────────────────────────
import {
  FileText, Plus, Search, Eye, Edit, X, Loader2, FileDown,
  Filter, XCircle, Truck, CreditCard, Hash, Building2, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoiceStats, InvoiceFilters } from '../models/types';
import { downloadInvoicePdf } from '../models/invoicePdfService';

interface Props {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  isLoading: boolean;
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  onCityFilter: (city: string) => void;
  onSalespersonFilter: (sp: string) => void;
  onDateFromFilter: (date: string) => void;
  onDateToFilter: (date: string) => void;
  onClearFilters: () => void;
  availableCities: string[];
  availableSalespersons: string[];
  salespersonMap?: Record<string, string>;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

function deliveryBadge(status: string) {
  const map: Record<string, string> = {
    'Delivered':    'bg-green-100 text-green-800',
    'Self-collect': 'bg-blue-100 text-blue-800',
    'LCS':          'bg-yellow-100 text-yellow-800',
    'Daewoo':       'bg-purple-100 text-purple-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

function receivedBadge(status: string) {
  const map: Record<string, string> = {
    'Received':   'bg-green-100 text-green-800',
    'In Process': 'bg-yellow-100 text-yellow-800',
    'Pending':    'bg-gray-100 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function InvoiceListView({
  invoices, filteredInvoices, stats, filters, viewingInvoice, isLoading,
  onSearch, onStatusFilter, onCityFilter, onSalespersonFilter,
  onDateFromFilter, onDateToFilter, onClearFilters,
  availableCities, availableSalespersons,
  salespersonMap = {},
  onViewInvoice, onCloseView, onEditInvoice, onCreateInvoice,
  formatCurrency, formatDate,
}: Props) {

  const spName = (idOrName: string | undefined): string => {
    if (!idOrName) return '—';
    if (salespersonMap[idOrName]) return salespersonMap[idOrName];
    const looksLikeId = idOrName.length > 15 && !/\s/.test(idOrName);
    if (looksLikeId) return idOrName.slice(0, 8) + '…';
    return idOrName;
  };

  const [generatingPdf, setGeneratingPdf] = useState<Set<string>>(new Set());
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('AED');

  const formatDisplay = (pkrAmount: number): string => {
    const converted = convertToDisplay(pkrAmount, displayCurrency);
    if (displayCurrency === 'AED') {
      return `د.إ ${new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)} AED`;
    }
    return formatCurrency(pkrAmount);
  };

  // FIX: Added toast.error() so the user sees feedback when PDF generation
  // fails, instead of the error being silently swallowed in the catch block.
  const handleDownloadPdf = async (invoice: Invoice) => {
    if (generatingPdf.has(invoice.id)) return;
    setGeneratingPdf(prev => new Set(prev).add(invoice.id));
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF download failed. Please try again.');
    } finally {
      setGeneratingPdf(prev => { const n = new Set(prev); n.delete(invoice.id); return n; });
    }
  };

  const hasActiveFilters =
    filters.searchTerm || filters.statusFilter !== 'all' ||
    filters.dateFrom || filters.dateTo ||
    filters.cityFilter || filters.salespersonFilter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {filteredInvoices.length} of {invoices.length} invoices shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {(['PKR', 'AED'] as DisplayCurrency[]).map(cur => (
              <button
                key={cur}
                onClick={() => setDisplayCurrency(cur)}
                style={displayCurrency === cur ? { backgroundColor: '#374151', color: '#ffffff' } : {}}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  displayCurrency === cur ? 'shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cur === 'PKR' ? '₨ PKR' : 'د.إ AED'}
              </button>
            ))}
          </div>
          <button
            onClick={onCreateInvoice}
            style={{ backgroundColor: '#1f2937', color: '#ffffff', border: '1px solid #374151' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg active:scale-95 transition-all font-semibold shadow-md whitespace-nowrap flex-shrink-0">
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices', value: stats.totalCount,                  color: 'text-gray-900' },
          { label: 'Paid',           value: stats.paidCount,                   color: 'text-green-600' },
          { label: 'Unpaid',         value: stats.unpaidCount,                 color: 'text-red-600'   },
          { label: 'Total Amount',   value: formatDisplay(stats.totalAmount), color: 'text-gray-900'  },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={15} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button onClick={onClearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <XCircle size={13} /> Clear all
            </button>
          )}
        </div>

        {/* Row 1: Search + Status */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search invoice, customer, phone, city…"
              value={filters.searchTerm}
              onChange={e => onSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400" />
          </div>
          {/* FIX: explicit bg-white + text-gray-900 ensures the select is readable */}
          <select
            value={filters.statusFilter}
            onChange={e => onStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {/* Row 2: City + Salesperson + Date range */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.cityFilter}
            onChange={e => onCityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
            <option value="">📍 All Cities</option>
            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filters.salespersonFilter}
            onChange={e => onSalespersonFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
            <option value="">👤 All Salespersons</option>
            {availableSalespersons.map(sp => <option key={sp} value={sp}>{spName(sp) || sp}</option>)}
          </select>

          {/* Date From — FIX: text-gray-900 so the date value is visible */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap shrink-0">From</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => onDateFromFilter(e.target.value)}
              className="text-sm outline-none bg-transparent text-gray-900 w-36" />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap shrink-0">To</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => onDateToFilter(e.target.value)}
              className="text-sm outline-none bg-transparent text-gray-900 w-36" />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Invoice #', 'Date', 'Customer', 'Branch / City',
                  'Salesperson', 'Products', `Amount (${displayCurrency})`, 'Delivery',
                  'Payment', 'Status', 'Actions',
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-gray-400">
                    <FileText className="mx-auto mb-3 text-gray-300" size={44} />
                    <p className="font-medium text-gray-500">No invoices found</p>
                    <p className="text-xs mt-1">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
                    </p>
                  </td>
                </tr>
              ) : filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>

                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(invoice.date)}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                    <p className="text-xs text-gray-400">{invoice.customerPhone}</p>
                    {invoice.customerPhone2 && (
                      <p className="text-xs text-gray-400">{invoice.customerPhone2}</p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-sm">{invoice.customerCity || '—'}</p>
                    {invoice.salespersonLocation && (
                      <p className="text-xs text-gray-400 mt-0.5">{invoice.salespersonLocation}</p>
                    )}
                    {invoice.productLocation && (
                      <p className="text-xs text-gray-600 mt-0.5">Stock: {invoice.productLocation}</p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {invoice.salesperson ? (
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{spName(invoice.salesperson)}</p>
                        {invoice.clientDealBy && (
                          <p className="text-xs text-gray-400 mt-0.5">Deal: {spName(invoice.clientDealBy)}</p>
                        )}
                        {invoice.referralBy && (
                          <p className="text-xs text-gray-400">Ref: {invoice.referralBy}</p>
                        )}
                      </div>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {invoice.products.length} item(s)
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {formatDisplay(invoice.totalAmount)}
                    {(invoice.deductionCharges || 0) > 0 && (
                      <p className="text-xs text-red-500 font-normal">
                        −{formatDisplay(invoice.deductionCharges)} deduction
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${deliveryBadge(invoice.deliveryStatus)}`}>
                      {invoice.deliveryStatus}
                    </span>
                    {invoice.deliveryReceivedStatus && (
                      <span className={`block mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${receivedBadge(invoice.deliveryReceivedStatus)}`}>
                        {invoice.deliveryReceivedStatus}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {invoice.paymentMode ? (
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          invoice.paymentMode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {invoice.paymentMode === 'Cash' ? '💵 Cash' : '🏦 Bank'}
                        </span>
                        {invoice.paymentMode === 'Online' && invoice.bankName && (
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">{invoice.bankName}</p>
                        )}
                        {invoice.paymentStatus === 'Partial' && (
                          <p className="text-xs text-orange-600 font-medium">
                            Partial · {formatDisplay(invoice.paidAmount || 0)} paid
                          </p>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onViewInvoice(invoice)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => onEditInvoice(invoice.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Edit">
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={generatingPdf.has(invoice.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40"
                        title="Download PDF">
                        {generatingPdf.has(invoice.id)
                          ? <Loader2 size={15} className="animate-spin" />
                          : <FileDown size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(viewingInvoice)}
                  disabled={generatingPdf.has(viewingInvoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40">
                  {generatingPdf.has(viewingInvoice.id)
                    ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                    : <><FileDown size={14} /> Download PDF</>}
                </button>
                <button onClick={onCloseView} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Customer & Invoice Info ── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer & Invoice</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Invoice #</p><p className="font-medium">{viewingInvoice.invoiceNumber}</p></div>
                  <div><p className="text-gray-500">Date</p><p className="font-medium">{formatDate(viewingInvoice.date)}</p></div>
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium">{viewingInvoice.customerName}</p>
                    <p className="text-xs text-gray-400">{viewingInvoice.customerPhone}</p>
                    {viewingInvoice.customerPhone2 && <p className="text-xs text-gray-400">{viewingInvoice.customerPhone2}</p>}
                  </div>
                  <div><p className="text-gray-500">CNIC</p><p className="font-medium font-mono text-xs">{viewingInvoice.customerCNIC}</p></div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{viewingInvoice.customerCity}{viewingInvoice.customerProvince ? `, ${viewingInvoice.customerProvince}` : ''}</p>
                    {viewingInvoice.customerAddress && <p className="text-xs text-gray-400 mt-0.5">{viewingInvoice.customerAddress}</p>}
                  </div>
                  {viewingInvoice.warrantyLocation && (
                    <div><p className="text-gray-500">Warranty Location</p><p className="font-medium">{viewingInvoice.warrantyLocation}</p></div>
                  )}
                </div>
              </div>

              {/* ── Branch / Sales Info ── */}
              {(viewingInvoice.salesperson || viewingInvoice.salespersonLocation || viewingInvoice.clientDealBy || viewingInvoice.referralBy || viewingInvoice.createdBy || viewingInvoice.productLocation) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Building2 size={12} /> Branch & Sales Info
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewingInvoice.salesperson && (
                      <div><p className="text-gray-500">Salesperson</p><p className="font-medium">{spName(viewingInvoice.salesperson)}</p></div>
                    )}
                    {viewingInvoice.salespersonLocation && (
                      <div><p className="text-gray-500">Branch / Location</p><p className="font-medium">{viewingInvoice.salespersonLocation}</p></div>
                    )}
                    {viewingInvoice.clientDealBy && (
                      <div><p className="text-gray-500">Client Deal By</p><p className="font-medium">{spName(viewingInvoice.clientDealBy)}</p></div>
                    )}
                    {viewingInvoice.referralBy && (
                      <div><p className="text-gray-500">Referral By</p><p className="font-medium">{viewingInvoice.referralBy}</p></div>
                    )}
                    {viewingInvoice.createdBy && (
                      <div><p className="text-gray-500">Created By</p><p className="font-medium">{spName(viewingInvoice.createdBy)}</p></div>
                    )}
                    {viewingInvoice.productLocation && (
                      <div><p className="text-gray-500">Product / Stock Location</p><p className="font-medium">{viewingInvoice.productLocation}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Products ── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Products</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Serials</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingInvoice.products.map((p, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-gray-900">{p.productName}</p>
                            {p.brandName && <p className="text-xs text-gray-400">{p.brandName} · {p.modelName}</p>}
                            {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{p.quantity} × {formatDisplay(p.price)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(p.serialNumbers || []).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">{formatDisplay(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Delivery ── */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Delivery Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${deliveryBadge(viewingInvoice.deliveryStatus)}`}>
                    {viewingInvoice.deliveryStatus}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Received Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${receivedBadge(viewingInvoice.deliveryReceivedStatus)}`}>
                    {viewingInvoice.deliveryReceivedStatus}
                  </span>
                </div>
                {viewingInvoice.collectionMethod && (
                  <div>
                    <p className="text-gray-500 mb-1">Collection Method</p>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {viewingInvoice.collectionMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Payment ── */}
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CreditCard size={12} /> Payment Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Pay Status</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                      viewingInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{viewingInvoice.status}</span>
                  </div>
                  {viewingInvoice.paymentMode && (
                    <div><p className="text-gray-500">Mode</p><p className="font-medium">{viewingInvoice.paymentMode}</p></div>
                  )}
                  {viewingInvoice.paymentStatus && (
                    <div><p className="text-gray-500">Full / Partial</p><p className="font-medium">{viewingInvoice.paymentStatus}</p></div>
                  )}
                  {viewingInvoice.paymentStatus === 'Partial' && (
                    <>
                      <div><p className="text-gray-500">Paid Amount</p><p className="font-medium text-green-700">{formatDisplay(viewingInvoice.paidAmount || 0)}</p></div>
                      <div><p className="text-gray-500">Remaining</p><p className="font-medium text-red-600">{formatDisplay(viewingInvoice.remainingAmount || 0)}</p></div>
                    </>
                  )}
                  {viewingInvoice.paymentMode === 'Online' && viewingInvoice.bankName && (
                    <>
                      <div><p className="text-gray-500">Bank</p><p className="font-medium">{viewingInvoice.bankName}</p></div>
                      {viewingInvoice.bankAccountNumber && (
                        <div><p className="text-gray-500">Account #</p><p className="font-mono text-xs">{viewingInvoice.bankAccountNumber}</p></div>
                      )}
                    </>
                  )}
                  {viewingInvoice.paidBy && <div><p className="text-gray-500">Paid By</p><p className="font-medium">{viewingInvoice.paidBy}</p></div>}
                  {viewingInvoice.paidTo && <div><p className="text-gray-500">Paid To</p><p className="font-medium">{viewingInvoice.paidTo}</p></div>}
                </div>
              </div>

              {/* ── Totals ── */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatDisplay(viewingInvoice.totalAmount)}</span>
                </div>
                {(viewingInvoice.deductionCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deduction Charges</span>
                    <span className="text-red-600 font-medium">−{formatDisplay(viewingInvoice.deductionCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="text-base font-bold text-gray-900">Net Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-800">
                      {formatDisplay(viewingInvoice.totalAmount - (viewingInvoice.deductionCharges || 0))}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ≈ {displayCurrency === 'PKR'
                        ? `د.إ ${((viewingInvoice.totalAmount - (viewingInvoice.deductionCharges || 0)) / AED_TO_PKR).toFixed(2)} AED`
                        : `₨ ${Math.round((viewingInvoice.totalAmount - (viewingInvoice.deductionCharges || 0)) * AED_TO_PKR).toLocaleString('en-PK')} PKR`
                      }
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-right">Rate: 1 AED = {AED_TO_PKR} PKR</p>
              </div>

              {viewingInvoice.exchangeWarrantyNote && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Exchange / Warranty Note</p>
                  <p className="text-gray-700">{viewingInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}