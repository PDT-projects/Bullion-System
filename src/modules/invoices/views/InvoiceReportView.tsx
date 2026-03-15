// Invoice Module - Report View

import React from 'react';
import { Download, FileText, Filter, X, Eye, Loader2 } from 'lucide-react';
import { Invoice, InvoiceStats } from '../models/types';

interface Props {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  isLoading: boolean;
  dateFrom: string;
  dateTo: string;
  selectedCity: string;
  selectedSalesperson: string;
  selectedStatus: string;
  viewInvoice: Invoice | null;
  cities: string[];
  salespersons: string[];
  statuses: string[];
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedSalesperson: (s: string) => void;
  setSelectedStatus: (s: string) => void;
  handleViewInvoice: (invoice: Invoice) => void;
  handleCloseView: () => void;
  handleClearFilters: () => void;
  handleExportCSV: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function InvoiceReportView({
  invoices, filteredInvoices, stats, isLoading,
  dateFrom, dateTo, selectedCity, selectedSalesperson, selectedStatus,
  viewInvoice, cities, salespersons, statuses,
  setDateFrom, setDateTo, setSelectedCity, setSelectedSalesperson, setSelectedStatus,
  handleViewInvoice, handleCloseView, handleClearFilters, handleExportCSV,
  formatCurrency, formatDate,
}: Props) {
  const hasFilters = dateFrom || dateTo || selectedCity || selectedSalesperson || selectedStatus;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Reports</h2>
          <p className="text-gray-600">Generate and export invoice reports</p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
          <Download size={20} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: stats.totalCount,  color: 'text-gray-900' },
          { label: 'Paid',           value: stats.paidCount,   color: 'text-green-600' },
          { label: 'Unpaid',         value: stats.unpaidCount, color: 'text-red-600' },
          { label: 'Total Amount',   value: formatCurrency(stats.totalAmount), color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-[#4f46e5]" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasFilters && (
            <button onClick={handleClearFilters} className="ml-auto text-sm text-red-500 hover:text-red-700">Clear All</button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Salesperson</label>
            <select value={selectedSalesperson} onChange={e => setSelectedSalesperson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
              <option value="">All</option>
              {salespersons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
              <option value="">All</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">Showing {filteredInvoices.length} of {invoices.length} invoices</p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Invoice #', 'Date', 'Customer', 'City', 'Salesperson', 'Products', 'Amount', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-3 text-gray-300" size={40} />
                <p>No invoices match the selected filters</p>
                {hasFilters && <button onClick={handleClearFilters} className="mt-2 text-[#4f46e5] text-sm hover:underline">Clear filters</button>}
              </td></tr>
            ) : filteredInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#4f46e5]">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.date)}</td>
                <td className="px-4 py-3"><p className="font-medium text-gray-900">{inv.customerName}</p><p className="text-xs text-gray-500">{inv.customerPhone}</p></td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.customerCity || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.salesperson || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.products.length} item(s)</td>
                <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleViewInvoice(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice Details</h3>
              <button onClick={handleCloseView} className="p-2 hover:bg-gray-100 rounded-lg"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Invoice #</p><p className="font-semibold">{viewInvoice.invoiceNumber}</p></div>
                <div><p className="text-gray-500">Date</p><p className="font-semibold">{formatDate(viewInvoice.date)}</p></div>
                <div><p className="text-gray-500">Customer</p><p className="font-semibold">{viewInvoice.customerName}</p><p className="text-gray-500 text-xs">{viewInvoice.customerPhone}</p></div>
                <div><p className="text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${viewInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{viewInvoice.status}</span>
                </div>
                {viewInvoice.salesperson && <div><p className="text-gray-500">Salesperson</p><p className="font-semibold">{viewInvoice.salesperson}</p></div>}
                {viewInvoice.customerCity && <div><p className="text-gray-500">City</p><p className="font-semibold">{viewInvoice.customerCity}</p></div>}
              </div>
              <div className="border-t pt-4">
                <p className="font-semibold mb-3">Products</p>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>{viewInvoice.products.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2">{p.productName}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.price)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <p className="text-lg font-bold">Total Amount</p>
                <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewInvoice.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}