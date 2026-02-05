import { useState, useMemo } from 'react';
import { Invoice, Product } from '../App';
import { FileText, Calendar, MapPin, User, Filter, Download, DollarSign, Package, Eye, X, Truck, CreditCard } from 'lucide-react';

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
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

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
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setViewInvoice(invoice)}
                  >
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
                    <td className="px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
                      <span>{invoice.salesperson || 'N/A'}</span>
                      <Eye size={16} className="text-gray-400 ml-2" />
                    </td>
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

      {/* View Invoice Details Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice Details</h3>
              <button onClick={() => setViewInvoice(null)} className="text-gray-500 hover:text-gray-700">
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
                  <p className="font-medium text-gray-900">{new Date(viewInvoice.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNIC</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerCNIC}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone 1</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerPhone}</p>
                </div>
                {viewInvoice.customerPhone2 && (
                  <div>
                    <p className="text-sm text-gray-600">Phone 2</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerPhone2}</p>
                  </div>
                )}
                {viewInvoice.customerProvince && (
                  <div>
                    <p className="text-sm text-gray-600">Province</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerProvince}</p>
                  </div>
                )}
                {viewInvoice.customerCity && (
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerCity}</p>
                  </div>
                )}
                {viewInvoice.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerAddress}</p>
                  </div>
                )}
                {viewInvoice.warrantyLocation && (
                  <div>
                    <p className="text-sm text-gray-600">Warranty Location</p>
                    <p className="font-medium text-gray-900">{viewInvoice.warrantyLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Delivery Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    viewInvoice.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                    viewInvoice.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                    viewInvoice.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    <Truck size={12} />
                    {viewInvoice.deliveryStatus}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Products</h4>
                <div className="space-y-3">
                  {viewInvoice.products.map((product, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-lg">{product.productName}</span>
                        <span className="font-semibold text-lg">{formatCurrency(product.total)}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {product.brandName && (
                          <p><span className="font-medium text-gray-700">Brand:</span> {product.brandName}</p>
                        )}
                        {product.modelName && (
                          <p><span className="font-medium text-gray-700">Model:</span> {product.modelName}</p>
                        )}
                        {product.category && (
                          <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>
                        )}
                        {product.description && (
                          <p><span className="font-medium text-gray-700">Description:</span> {product.description}</p>
                        )}
                        <p><span className="font-medium text-gray-700">Quantity:</span> {product.quantity} × {formatCurrency(product.price)}</p>
                        {product.serialNumbers && product.serialNumbers.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-gray-700 mb-1">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.serialNumbers.map((serial, idx) => (
                                <span key={idx} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewInvoice.exchangeWarrantyNote && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Exchange & Warranty Note</p>
                  <p className="font-medium text-gray-900">{viewInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

              {/* Sales Details (Internal) */}
              {(viewInvoice.salesperson || viewInvoice.salespersonLocation || viewInvoice.referFrom || viewInvoice.referTo || viewInvoice.createdBy) && (
                <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-[#4f46e5]" />
                    <h4 className="font-semibold text-gray-900">Sales Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.salesperson && (
                      <div>
                        <p className="text-gray-600">Salesperson:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.salesperson}</p>
                      </div>
                    )}
                    {viewInvoice.salespersonLocation && (
                      <div>
                        <p className="text-gray-600">Salesperson Location:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.salespersonLocation}</p>
                      </div>
                    )}
                    {viewInvoice.referTo && (
                      <div>
                        <p className="text-gray-600">Referral To:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.referTo}</p>
                      </div>
                    )}
                    {viewInvoice.referFrom && (
                      <div>
                        <p className="text-gray-600">Referral From:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.referFrom}</p>
                      </div>
                    )}
                    {viewInvoice.createdBy && (
                      <div>
                        <p className="text-gray-600">Created By:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.createdBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details (Internal) */}
              {(viewInvoice.paymentMode || viewInvoice.paymentStatus || viewInvoice.bankName) && (
                <div className="border-t pt-4 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={16} className="text-[#10b981]" />
                    <h4 className="font-semibold text-gray-900">Payment Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.paymentMode && (
                      <div>
                        <p className="text-gray-600">Payment Mode:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.paymentMode}</p>
                      </div>
                    )}
                    {viewInvoice.paymentStatus && (
                      <div>
                        <p className="text-gray-600">Payment Status:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.paymentStatus}</p>
                      </div>
                    )}
                    {viewInvoice.paymentStatus === 'Partial' && (
                      <>
                        <div>
                          <p className="text-gray-600">Total Amount:</p>
                          <p className="font-medium text-gray-900">{formatCurrency(viewInvoice.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Paid Amount:</p>
                          <p className="font-medium text-green-600">{formatCurrency(viewInvoice.paidAmount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Remaining Amount:</p>
                          <p className="font-medium text-red-600">{formatCurrency(viewInvoice.remainingAmount || 0)}</p>
                        </div>
                      </>
                    )}
                    {viewInvoice.paymentMode === 'Online' && viewInvoice.bankName && (
                      <>
                        <div>
                          <p className="text-gray-600">Bank:</p>
                          <p className="font-medium text-gray-900">{viewInvoice.bankName}</p>
                        </div>
                        {viewInvoice.bankAccountNumber && (
                          <div>
                            <p className="text-gray-600">Account Number:</p>
                            <p className="font-medium text-gray-900">{viewInvoice.bankAccountNumber}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Collection Method & Deduction (Internal) */}
              {(viewInvoice.collectionMethod || viewInvoice.deductionCharges) && (
                <div className="border-t pt-4 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={16} className="text-orange-600" />
                    <h4 className="font-semibold text-gray-900">Collection & Deduction (For Reports Only)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.collectionMethod && (
                      <div>
                        <p className="text-gray-600">Collection Method:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.collectionMethod}</p>
                      </div>
                    )}
                    {viewInvoice.deductionCharges !== undefined && (
                      <div>
                        <p className="text-gray-600">Deduction Charges:</p>
                        <p className={`font-medium ${viewInvoice.deductionCharges > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {viewInvoice.deductionCharges > 0 ? formatCurrency(viewInvoice.deductionCharges) : 'No Deduction'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 bg-[#4f46e5]/10 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
