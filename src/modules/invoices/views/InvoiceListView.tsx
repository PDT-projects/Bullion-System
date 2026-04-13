// Invoice Module - List View
// Change: added PDF download button in Actions column (generates PDF on-click via jsPDF)

import React, { useState } from 'react';
import {
  FileText, Plus, Search, Eye, Edit, Trash2, X, Loader2, FileDown,
} from 'lucide-react';
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
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;

}

export function InvoiceListView({
  invoices, filteredInvoices, stats, filters, viewingInvoice, isLoading,
  onSearch, onStatusFilter, onViewInvoice, onCloseView, onEditInvoice, onCreateInvoice,
  formatCurrency, formatDate,
}: Props) {
  // Track which invoice IDs are currently generating a PDF
  const [generatingPdf, setGeneratingPdf] = useState<Set<string>>(new Set());

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (generatingPdf.has(invoice.id)) return;
    setGeneratingPdf(prev => new Set(prev).add(invoice.id));
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGeneratingPdf(prev => {
        const next = new Set(prev);
        next.delete(invoice.id);
        return next;
      });
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage sales invoices and track payments</p>
        </div>
        <button onClick={onCreateInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
          <Plus size={20} /> Create Invoice
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
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search by invoice number, customer name, or phone..."
            value={filters.searchTerm} onChange={e => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]" />
        </div>
        <select value={filters.statusFilter} onChange={e => onStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
          <option value="all">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Invoice #', 'Date', 'Customer', 'Products', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="font-medium">No invoices found</p>
                  <p className="text-sm">Create your first invoice to get started</p>
                </td>
              </tr>
            ) : filteredInvoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#4f46e5]">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{invoice.customerName}</p>
                  <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.products.length} item(s)</td>
                <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                {/* ── Actions (View, Edit, PDF, Delete) ── */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onViewInvoice(invoice)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onEditInvoice(invoice.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Edit">
                      <Edit size={16} />
                    </button>
                    {/* PDF download — generates fresh via jsPDF */}
                    <button
                      onClick={() => handleDownloadPdf(invoice)}
                      disabled={generatingPdf.has(invoice.id)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-40 transition-colors"
                      title="Download PDF"
                    >
                      {generatingPdf.has(invoice.id)
                        ? <Loader2 size={16} className="animate-spin" />
                        : <FileDown size={16} />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* PDF download from modal */}
                <button
                  onClick={() => handleDownloadPdf(viewingInvoice)}
                  disabled={generatingPdf.has(viewingInvoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                  title="Download PDF"
                >
                  {generatingPdf.has(viewingInvoice.id)
                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                    : <><FileDown size={15} /> Download PDF</>
                  }
                </button>
                <button onClick={onCloseView} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600">Invoice Number</p><p className="font-medium">{viewingInvoice.invoiceNumber}</p></div>
                <div><p className="text-sm text-gray-600">Date</p><p className="font-medium">{formatDate(viewingInvoice.date)}</p></div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{viewingInvoice.customerName}</p>
                  <p className="text-sm text-gray-500">{viewingInvoice.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    viewingInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{viewingInvoice.status}</span>
                </div>
                {viewingInvoice.salesperson && <div><p className="text-sm text-gray-600">Salesperson</p><p className="font-medium">{viewingInvoice.salesperson}</p></div>}
                {viewingInvoice.customerCity && <div><p className="text-sm text-gray-600">City</p><p className="font-medium">{viewingInvoice.customerCity}</p></div>}
              </div>
              <div className="border-t pt-4">
                <p className="font-medium mb-3">Products</p>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Serials</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>{viewingInvoice.products.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2">{p.productName}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(p.serialNumbers || []).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(viewingInvoice.totalAmount)}</span>
                </div>
                {viewingInvoice.deductionCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deduction Charges</span>
                    <span className="text-red-600">−{formatCurrency(viewingInvoice.deductionCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-lg font-bold">Net Total</p>
                  <p className="text-2xl font-bold text-[#4f46e5]">
                    {formatCurrency(viewingInvoice.totalAmount - (viewingInvoice.deductionCharges || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}