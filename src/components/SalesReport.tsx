import { useState, useMemo } from 'react';
import { Invoice, Product } from '../App';
import { Calendar, MapPin, User, Filter, Download, FileSpreadsheet } from 'lucide-react';

type SalesReportProps = {
  invoices: Invoice[];
  products: Product[];
};

export function SalesReport({ invoices, products }: SalesReportProps) {
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

  const statuses = ['Self-collect', 'LCS', 'Daewoo', 'Delivered'];

  // Prepare sales data from invoices
  const salesData = useMemo(() => {
    return invoices.map(invoice => {
      // Calculate totals per invoice
      const invoiceTotal = invoice.totalAmount;
      const deductionCharges = invoice.deductionCharges || 0;
      const netAmount = invoiceTotal - deductionCharges;

      // For product-level details, calculate proportional deduction
      return invoice.products.map(product => {
        // Find the original product to get cost price
        const originalProduct = products.find(p => p.id === product.productId);
        const costPrice = originalProduct?.costPrice || 0;
        const sellPrice = product.price;
        
        // Proportional deduction per product
        const productProportion = product.total / invoiceTotal;
        const productDeduction = deductionCharges * productProportion;
        
        const grossProfit = sellPrice - costPrice;
        const netProfit = grossProfit - (productDeduction / product.quantity);

        return {
          id: `${invoice.id}-${product.id}`,
          date: invoice.date,
          clientName: invoice.customerName,
          city: invoice.customerCity,
          product: product.productName,
          brand: product.brandName,
          costPrice,
          sellPrice,
          grossProfit,
          netProfit,
          status: invoice.deliveryStatus,
          salesperson: invoice.salesperson || 'N/A',
          invoiceNumber: invoice.invoiceNumber,
          invoiceTotal: invoice.totalAmount,
          collectionMethod: invoice.collectionMethod || 'Self Collection',
          deductionCharges: invoice.deductionCharges || 0,
          netAmount: invoice.totalAmount - (invoice.deductionCharges || 0)
        };
      });
    }).flat();
  }, [invoices, products]);

  // Filter sales data
  const filteredData = useMemo(() => {
    return salesData.filter(item => {
      // Date filter
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      
      // City filter
      if (selectedCity && item.city !== selectedCity) return false;
      
      // Salesperson filter
      if (selectedSalesperson && item.salesperson !== selectedSalesperson) return false;
      
      // Status filter
      if (selectedStatus && item.status !== selectedStatus) return false;
      
      return true;
    });
  }, [salesData, dateFrom, dateTo, selectedCity, selectedSalesperson, selectedStatus]);

  // Calculate totals
  const totals = useMemo(() => {
    // Group by invoice to avoid counting invoice-level data multiple times
    const uniqueInvoices = new Map<string, any>();
    
    filteredData.forEach(item => {
      if (!uniqueInvoices.has(item.invoiceNumber)) {
        uniqueInvoices.set(item.invoiceNumber, {
          invoiceTotal: item.invoiceTotal,
          deductionCharges: item.deductionCharges,
          netAmount: item.netAmount
        });
      }
    });
    
    return Array.from(uniqueInvoices.values()).reduce((acc, inv) => ({
      invoiceTotal: acc.invoiceTotal + inv.invoiceTotal,
      deductionCharges: acc.deductionCharges + inv.deductionCharges,
      netAmount: acc.netAmount + inv.netAmount
    }), { invoiceTotal: 0, deductionCharges: 0, netAmount: 0 });
  }, [filteredData]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Invoice #', 'Client Name', 'City', 'Product / Brand', 'Invoice Total', 'Collection Method', 'Deduction', 'Net Amount', 'Status', 'Salesperson'];
    const rows = filteredData.map(item => [
      item.date,
      item.invoiceNumber,
      item.clientName,
      item.city,
      `${item.product} / ${item.brand}`,
      item.invoiceTotal,
      item.collectionMethod,
      item.deductionCharges,
      item.netAmount,
      item.status,
      item.salesperson
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
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
        <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
        <p className="text-sm text-gray-600 mt-1">Auto-generated from invoice data - Read-only report</p>
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
              <FileSpreadsheet size={14} className="inline mr-1" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Invoice Amount</p>
          <p className="text-2xl font-bold text-gray-900">Rs {totals.invoiceTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
          <p className="text-2xl font-bold text-[#ef4444]">Rs {totals.deductionCharges.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Net Amount (After Deductions)</p>
          <p className="text-2xl font-bold text-[#10b981]">Rs {totals.netAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product / Brand</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Collection Method</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deduction</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Salesperson</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No sales data available. Create invoices to see sales reports.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.clientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.product} / {item.brand}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs {item.invoiceTotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.collectionMethod === 'Self Collection' ? 'bg-green-100 text-green-800' :
                        item.collectionMethod === 'TCS' ? 'bg-blue-100 text-blue-800' :
                        item.collectionMethod === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                        item.collectionMethod === 'Daewoo' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.collectionMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.deductionCharges > 0 ? (
                        <span className="text-[#ef4444]">- Rs {item.deductionCharges.toLocaleString()}</span>
                      ) : (
                        <span className="text-[#10b981]">Rs 0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-[#4f46e5]">Rs {item.netAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        item.status === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.salesperson}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Rs {totals.invoiceTotal.toLocaleString()}</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm font-bold text-[#ef4444] text-right">- Rs {totals.deductionCharges.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#4f46e5] text-right">Rs {totals.netAmount.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredData.length} of {salesData.length} sales entries
      </div>
    </div>
  );
}