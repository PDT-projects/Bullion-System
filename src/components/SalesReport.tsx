import { useState, useMemo } from 'react';
import { Invoice, Product } from '../App';
import { Calendar, MapPin, User, Filter, Download, FileSpreadsheet, BarChart3, Eye, X, Truck, Hash, CreditCard } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [showVisualization, setShowVisualization] = useState(false);
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

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    // Sales trend over time
    const salesByDate = filteredData.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = 0;
      acc[item.date] += item.netAmount;
      return acc;
    }, {} as Record<string, number>);
    const salesTrend = Object.entries(salesByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // Sales by city
    const salesByCity = filteredData.reduce((acc, item) => {
      if (!acc[item.city]) acc[item.city] = 0;
      acc[item.city] += item.netAmount;
      return acc;
    }, {} as Record<string, number>);
    const citySales = Object.entries(salesByCity)
      .map(([city, amount]) => ({ city, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Sales by salesperson
    const salesBySalesperson = filteredData.reduce((acc, item) => {
      if (!acc[item.salesperson]) acc[item.salesperson] = 0;
      acc[item.salesperson] += item.netAmount;
      return acc;
    }, {} as Record<string, number>);
    const salespersonSales = Object.entries(salesBySalesperson)
      .map(([salesperson, amount]) => ({ salesperson, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Sales by product
    const salesByProduct = filteredData.reduce((acc, item) => {
      const key = `${item.product} / ${item.brand}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += item.netAmount;
      return acc;
    }, {} as Record<string, number>);
    const productSales = Object.entries(salesByProduct)
      .map(([product, amount]) => ({ product, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 products

    // Delivery status distribution
    const statusCounts = filteredData.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = 0;
      acc[item.status] += 1;
      return acc;
    }, {} as Record<string, number>);
    const statusData = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }));

    // Collection method distribution
    const collectionCounts = filteredData.reduce((acc, item) => {
      if (!acc[item.collectionMethod]) acc[item.collectionMethod] = 0;
      acc[item.collectionMethod] += 1;
      return acc;
    }, {} as Record<string, number>);
    const collectionData = Object.entries(collectionCounts)
      .map(([method, count]) => ({ method, count }));

    return {
      salesTrend,
      citySales,
      salespersonSales,
      productSales,
      statusData,
      collectionData
    };
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
            <p className="text-sm text-gray-600 mt-1">Auto-generated from invoice data - Read-only report</p>
          </div>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            <BarChart3 size={16} />
            {showVisualization ? 'Hide' : 'Show'} Visualization
          </button>
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

      {/* Visualization Section */}
      {showVisualization && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Analytics</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Over Time */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Sales Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visualizationData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by City */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Sales by City</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.citySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales by Salesperson */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Sales by Salesperson</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.salespersonSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="salesperson" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 10 Products */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Top 10 Products by Sales</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.productSales} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={100} />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Status Distribution */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Delivery Status Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualizationData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {visualizationData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Collection Method Distribution */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Collection Method Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualizationData.collectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, count }) => `${method}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {visualizationData.collectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
                filteredData.map((item) => {
                  const invoice = invoices.find(inv => inv.invoiceNumber === item.invoiceNumber);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => invoice && setViewInvoice(invoice)}
                    >
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
                      <td className="px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
                        <span>{item.salesperson}</span>
                        <Eye size={16} className="text-gray-400 ml-2" />
                      </td>
                    </tr>
                  );
                })
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
