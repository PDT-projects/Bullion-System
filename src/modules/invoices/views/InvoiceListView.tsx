// Invoice Module - List View
// Displays invoice list with filters, stats, and actions

import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import { Invoice, InvoiceStats } from '../models/types';

interface InvoiceListViewProps {
  // Data
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  
  // State
  filters: {
    searchTerm: string;
    statusFilter: 'all' | 'Paid' | 'Unpaid';
  };
  viewingInvoice: Invoice | null;
  
  // Actions
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  
  // Helpers
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function InvoiceListView({
  invoices,
  filteredInvoices,
  stats,
  filters,
  viewingInvoice,
  onSearch,
  onStatusFilter,
  onViewInvoice,
  onCloseView,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoice,
  formatCurrency,
  formatDate
}: InvoiceListViewProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage sales invoices and track payments</p>
        </div>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Unpaid</p>
          <p className="text-2xl font-bold text-red-600">{stats.unpaidCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, or phone..."
            value={filters.searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filters.statusFilter}
            onChange={(e) => onStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Products</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <FileText className="mx-auto mb-2 text-gray-400" size={48} />
                  <p>No invoices found</p>
                  <p className="text-sm">Create your first invoice to get started</p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#4f46e5]">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                    <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {invoice.products.length} item(s)
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEditInvoice(invoice.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteInvoice(invoice.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice Details</h3>
              <button
                onClick={onCloseView}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium text-gray-900">{viewingInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(viewingInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{viewingInvoice.customerName}</p>
                  <p className="text-sm text-gray-500">{viewingInvoice.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    viewingInvoice.status === 'Paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingInvoice.status}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Products</p>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm">Product</th>
                      <th className="px-3 py-2 text-left text-sm">Qty</th>
                      <th className="px-3 py-2 text-left text-sm">Price</th>
                      <th className="px-3 py-2 text-left text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.products.map((product, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{product.productName}</td>
                        <td className="px-3 py-2">{product.quantity}</td>
                        <td className="px-3 py-2">{formatCurrency(product.price)}</td>
                        <td className="px-3 py-2">{formatCurrency(product.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <p className="text-lg font-bold">Total Amount</p>
                <p className="text-2xl font-bold text-[#4f46e5]">
                  {formatCurrency(viewingInvoice.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
