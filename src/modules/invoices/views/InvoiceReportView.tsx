// Invoice Module - Report View
// Invoice reports with filtering and export

import { Download, FileText, Filter, X, Eye } from 'lucide-react';
import { Invoice, InvoiceStats } from '../models/types';

interface InvoiceReportViewProps {
  // Data
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  
  // Filter state
  dateFrom: string;
  dateTo: string;
  selectedCity: string;
  selectedSalesperson: string;
  selectedStatus: string;
  viewInvoice: Invoice | null;
  
  // Options
  cities: string[];
  salespersons: string[];
  statuses: string[];
  
  // Actions
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onCityChange: (city: string) => void;
  onSalespersonChange: (salesperson: string) => void;
  onStatusChange: (status: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onClearFilters: () => void;
  onExportCSV: () => void;
  
  // Helpers
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function InvoiceReportView({
  invoices,
  filteredInvoices,
  stats,
  dateFrom,
  dateTo,
  selectedCity,
  selectedSalesperson,
  selectedStatus,
  viewInvoice,
  cities,
  salespersons,
  statuses,
  onDateFromChange,
  onDateToChange,
  onCityChange,
  onSalespersonChange,
  onStatusChange,
  onViewInvoice,
  onCloseView,
  onClearFilters,
  onExportCSV,
  formatCurrency,
  formatDate
}: InvoiceReportViewProps) {
  const hasActiveFilters = dateFrom || dateTo || selectedCity || selectedSalesperson || selectedStatus;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Reports</h2>
          <p className="text-gray-600">Generate and export invoice reports</p>
        </div>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Download size={20} />
          Export CSV
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
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={20} className="text-[#4f46e5]" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="ml-auto text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
            <select
              value={selectedSalesperson}
              onChange={(e) => onSalespersonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Salespersons</option>
              {salespersons.map(person => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>Showing {filteredInvoices.length} of {invoices.length} invoices</p>
        {hasActiveFilters && <p>Filters applied</p>}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">City</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Salesperson</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Products</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  <FileText className="mx-auto mb-2 text-gray-400" size={48} />
                  <p>No invoices match the selected filters</p>
                  {hasActiveFilters && (
                    <button
                      onClick={onClearFilters}
                      className="mt-2 text-[#4f46e5] hover:underline"
                    >
                      Clear filters to see all invoices
                    </button>
                  )}
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
                    {invoice.customerCity || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {invoice.salesperson || '-'}
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
                    <button
                      onClick={() => onViewInvoice(invoice)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (
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
                  <p className="font-medium text-gray-900">{viewInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(viewInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerName}</p>
                  <p className="text-sm text-gray-500">{viewInvoice.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    viewInvoice.status === 'Paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewInvoice.status}
                  </span>
                </div>
                {viewInvoice.salesperson && (
                  <div>
                    <p className="text-sm text-gray-600">Salesperson</p>
                    <p className="font-medium text-gray-900">{viewInvoice.salesperson}</p>
                  </div>
                )}
                {viewInvoice.customerCity && (
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerCity}</p>
                  </div>
                )}
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
                    {viewInvoice.products.map((product, idx) => (
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
                  {formatCurrency(viewInvoice.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
