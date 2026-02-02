import { useState, useMemo } from 'react';
import { Invoice, Product } from '../App';
import { FileText, Calendar, MapPin, User, Filter, Download, DollarSign, Package } from 'lucide-react';

type InvoiceReportProps = {
  invoices: Invoice[];
  products: Product[];
};

export function InvoiceReport({ invoices, products }: InvoiceReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Get unique values for filters
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customerCity) citySet.add(inv.customerCity);
    });
    return Array.from(citySet).sort();
  }, [invoices]);

  const salespersons = useMemo(() => {
    const salespersonSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.salesperson) salespersonSet.add(inv.salesperson);
    });
    return Array.from(salespersonSet).sort();
  }, [invoices]);

  const statuses = ['Paid', 'Unpaid'];

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Date filter
      if (dateFrom && invoice.date < dateFrom) return false;
      if (dateTo && invoice.date > dateTo) return false;

      // City filter
      if (selectedCity && invoice.customerCity !== selectedCity) return false;

      // Salesperson filter
      if (selectedSalesperson && invoice.salesperson !== selectedSalesperson) return false;

      // Status filter
      if (selectedStatus && invoice.status !== selectedStatus) return false;

      return true;
    });
  }, [invoices, dateFrom, dateTo, selectedCity, selectedSalesperson, selectedStatus]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalDeductionCharges = filteredInvoices.reduce((sum, inv) => sum + (inv.deductionCharges || 0), 0);
    const netAmount = totalAmount - totalDeductionCharges;
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'Paid').length;
    const unpaidInvoices = filteredInvoices.filter(inv => inv.status === 'Unpaid').length;

    return {
      totalAmount,
      totalDeductionCharges,
      netAmount,
      paidInvoices,
      unpaidInvoices,
      totalInvoices: filteredInvoices.length
    };
  }, [filteredInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Invoice #', 'Customer Name', 'City', 'Total Amount', 'Deduction Charges', 'Net Amount', 'Status', 'Salesperson', 'Delivery Status'];
    const rows = filteredInvoices.map(inv => [
      inv.date,
      inv.invoiceNumber,
      inv.customerName,
      inv.customerCity,
      inv.totalAmount.toString(),
      (inv.deductionCharges || 0).toString(),
      (inv.totalAmount - (inv.deductionCharges || 0)).toString(),
      inv.status,
      inv.salesperson || 'N/A',
      inv.deliveryStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCity('');
    setSelectedSalesperson('');
    setSelectedStatus('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Invoice Report</h2>
        <p className="text-sm text-gray-600 mt-1">Comprehensive overview of all invoices and their status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Invoices</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-purple-600" />
            <p className="text-sm text-gray-600">Paid Invoices</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.paidInvoices}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Net Amount</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.netAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin size={14} className="inline mr-1" />
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Salesperson */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />
              Salesperson
            </label>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Salespersons</option>
              {salespersons.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={14} className="inline mr-1" />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deduction</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Salesperson</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No invoices found. Create invoices to see the report.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerCity}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {invoice.deductionCharges > 0 ? (
                        <span className="text-red-600">- {formatCurrency(invoice.deductionCharges)}</span>
                      ) : (
                        <span className="text-gray-600">{formatCurrency(0)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-[#4f46e5]">
                      {formatCurrency(invoice.totalAmount - (invoice.deductionCharges || 0))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        invoice.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                        invoice.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {invoice.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.salesperson || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(totals.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">- {formatCurrency(totals.totalDeductionCharges)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#4f46e5] text-right">{formatCurrency(totals.netAmount)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </div>
    </div>
  );
}
