import { useState, useMemo } from 'react';
import { Invoice, Product } from '../../App';
import {
  Calendar, MapPin, User, Filter, Download, FileSpreadsheet,
  BarChart3, Eye, X, Truck, CreditCard, FileText, TrendingUp,
  CheckCircle, XCircle, Hash,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type SalesReportProps = {
  invoices: Invoice[];
  products: Product[];
};

export function SalesReport({ invoices, products }: SalesReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState('');
  const [selectedPayStatus, setSelectedPayStatus] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // ── Filter option lists ──────────────────────────────────────────────────
  const cities = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => { if (inv.customerCity) s.add(inv.customerCity); });
    return Array.from(s).sort();
  }, [invoices]);

  const salespersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => { if (inv.salesperson) s.add(inv.salesperson); });
    return Array.from(s).sort();
  }, [invoices]);

  const deliveryStatuses = ['Self-collect', 'LCS', 'Daewoo', 'Delivered'];

  // ── ONE row per invoice (fixes the duplicate-product-row bug) ──────────
  const salesData = useMemo(() => {
    return invoices.map(invoice => {
      const deductionCharges = invoice.deductionCharges || 0;
      const netAmount = invoice.totalAmount - deductionCharges;

      // Summarise products into a readable string
      const productSummary = invoice.products
        .map(p => `${p.productName}${p.brandName ? ` (${p.brandName})` : ''} ×${p.quantity}`)
        .join(', ');

      return {
        id: invoice.id,
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.customerName,
        city: invoice.customerCity,
        province: invoice.customerProvince,
        phone: invoice.customerPhone,
        phone2: invoice.customerPhone2 || '',
        cnic: invoice.customerCNIC,
        productSummary,
        productCount: invoice.products.length,
        invoiceTotal: invoice.totalAmount,
        collectionMethod: invoice.collectionMethod || 'Self Collection',
        deductionCharges,
        netAmount,
        deliveryStatus: invoice.deliveryStatus,
        deliveryReceivedStatus: invoice.deliveryReceivedStatus,
        payStatus: invoice.status,                      // 'Paid' | 'Unpaid'
        paymentMode: invoice.paymentMode || '',
        paymentStatus: invoice.paymentStatus || '',     // 'Full' | 'Partial'
        paidAmount: invoice.paidAmount || 0,
        remainingAmount: invoice.remainingAmount || 0,
        bankName: invoice.bankName || '',
        bankAccountNumber: invoice.bankAccountNumber || '',
        salesperson: invoice.salesperson || 'N/A',
        salespersonLocation: invoice.salespersonLocation || '',
        clientDealBy: invoice.clientDealBy || '',
        referralBy: invoice.referralBy || '',
        createdBy: invoice.createdBy || '',
      };
    });
  }, [invoices]);

  // ── Apply filters ─────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return salesData.filter(item => {
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (selectedCity && item.city !== selectedCity) return false;
      if (selectedSalesperson && item.salesperson !== selectedSalesperson) return false;
      if (selectedDeliveryStatus && item.deliveryStatus !== selectedDeliveryStatus) return false;
      if (selectedPayStatus && item.payStatus !== selectedPayStatus) return false;
      return true;
    });
  }, [salesData, dateFrom, dateTo, selectedCity, selectedSalesperson, selectedDeliveryStatus, selectedPayStatus]);

  // ── Summary totals (now correct — 1 row per invoice) ─────────────────
  const totals = useMemo(() => {
    const invoiceTotal = filteredData.reduce((s, i) => s + i.invoiceTotal, 0);
    const deductionCharges = filteredData.reduce((s, i) => s + i.deductionCharges, 0);
    const netAmount = filteredData.reduce((s, i) => s + i.netAmount, 0);
    const paidCount = filteredData.filter(i => i.payStatus === 'Paid').length;
    const unpaidCount = filteredData.filter(i => i.payStatus === 'Unpaid').length;
    const partialCount = filteredData.filter(i => i.paymentStatus === 'Partial').length;
    const cashCount = filteredData.filter(i => i.paymentMode === 'Cash').length;
    const onlineCount = filteredData.filter(i => i.paymentMode === 'Online').length;
    return { invoiceTotal, deductionCharges, netAmount, paidCount, unpaidCount, partialCount, cashCount, onlineCount };
  }, [filteredData]);

  // ── Visualization data ────────────────────────────────────────────────
  const visualizationData = useMemo(() => {
    // Sales trend — one entry per date, sum netAmount
    const byDate: Record<string, number> = {};
    filteredData.forEach(i => { byDate[i.date] = (byDate[i.date] || 0) + i.netAmount; });
    const salesTrend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // By city
    const byCity: Record<string, number> = {};
    filteredData.forEach(i => { byCity[i.city] = (byCity[i.city] || 0) + i.netAmount; });
    const citySales = Object.entries(byCity)
      .map(([city, amount]) => ({ city, amount }))
      .sort((a, b) => b.amount - a.amount);

    // By salesperson
    const bySP: Record<string, number> = {};
    filteredData.forEach(i => { bySP[i.salesperson] = (bySP[i.salesperson] || 0) + i.netAmount; });
    const salespersonSales = Object.entries(bySP)
      .map(([salesperson, amount]) => ({ salesperson, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Delivery status count
    const byDelivery: Record<string, number> = {};
    filteredData.forEach(i => { byDelivery[i.deliveryStatus] = (byDelivery[i.deliveryStatus] || 0) + 1; });
    const statusData = Object.entries(byDelivery).map(([status, count]) => ({ status, count }));

    // Collection method count
    const byColl: Record<string, number> = {};
    filteredData.forEach(i => { byColl[i.collectionMethod] = (byColl[i.collectionMethod] || 0) + 1; });
    const collectionData = Object.entries(byColl).map(([method, count]) => ({ method, count }));

    // Payment status
    const payData = [
      { label: 'Paid', count: totals.paidCount },
      { label: 'Unpaid', count: totals.unpaidCount },
    ].filter(d => d.count > 0);

    return { salesTrend, citySales, salespersonSales, statusData, collectionData, payData };
  }, [filteredData, totals]);

  // ── CSV Export ────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      'Date', 'Invoice #', 'Client Name', 'City', 'Province',
      'Phone', 'CNIC', 'Products', 'Invoice Total', 'Collection Method',
      'Deduction', 'Net Amount', 'Delivery Status', 'Delivery Received',
      'Pay Status', 'Payment Mode', 'Payment Status', 'Paid Amount',
      'Remaining Amount', 'Bank', 'Salesperson', 'Salesperson Location',
      'Client Deal By', 'Referral By', 'Created By',
    ];
    const rows = filteredData.map(item => [
      item.date, item.invoiceNumber, item.clientName, item.city, item.province,
      item.phone, item.cnic, `"${item.productSummary}"`, item.invoiceTotal,
      item.collectionMethod, item.deductionCharges, item.netAmount,
      item.deliveryStatus, item.deliveryReceivedStatus, item.payStatus,
      item.paymentMode, item.paymentStatus, item.paidAmount, item.remainingAmount,
      item.bankName, item.salesperson, item.salespersonLocation,
      item.clientDealBy, item.referralBy, item.createdBy,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearFilters = () => {
    setDateFrom(''); setDateTo(''); setSelectedCity('');
    setSelectedSalesperson(''); setSelectedDeliveryStatus(''); setSelectedPayStatus('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales Report</h2>
          <p className="text-base text-gray-600 mt-1">Auto-generated from invoice data · Read-only</p>
        </div>
        <button
          onClick={() => setShowVisualization(!showVisualization)}
          className="px-6 py-3 text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded-xl hover:bg-blue-200 transition-all flex items-center gap-2"
        >
          <BarChart3 size={18} />
          {showVisualization ? 'Hide' : 'Show'} Visualization
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg"><Filter size={20} className="text-blue-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><Calendar size={12} className="inline mr-1" />Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><Calendar size={12} className="inline mr-1" />Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><MapPin size={12} className="inline mr-1" />City</label>
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><User size={12} className="inline mr-1" />Salesperson</label>
            <select value={selectedSalesperson} onChange={e => setSelectedSalesperson(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><Truck size={12} className="inline mr-1" />Delivery</label>
            <select value={selectedDeliveryStatus} onChange={e => setSelectedDeliveryStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1"><CreditCard size={12} className="inline mr-1" />Pay Status</label>
            <select value={selectedPayStatus} onChange={e => setSelectedPayStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Clear Filters
          </button>
          <button onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total Invoices', value: filteredData.length, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Invoice Total', value: formatCurrency(totals.invoiceTotal), color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Deductions', value: formatCurrency(totals.deductionCharges), color: 'text-red-600', bg: 'bg-white' },
          { label: 'Net Amount', value: formatCurrency(totals.netAmount), color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Paid', value: totals.paidCount, color: 'text-green-600', bg: 'bg-white' },
          { label: 'Unpaid', value: totals.unpaidCount, color: 'text-red-600', bg: 'bg-white' },
          { label: 'Partial', value: totals.partialCount, color: 'text-orange-600', bg: 'bg-white' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-lg border border-gray-200 p-3`}>
            <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Visualization */}
      {showVisualization && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg"><BarChart3 size={20} className="text-purple-600" /></div>
            <h3 className="text-xl font-bold text-gray-900">Sales Analytics</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={visualizationData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales by City</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={visualizationData.citySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales by Salesperson</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={visualizationData.salespersonSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="salesperson" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Bar dataKey="amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Delivery Status Distribution</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={visualizationData.statusData} cx="50%" cy="50%"
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80} dataKey="count" labelLine={false}>
                    {visualizationData.statusData.map((_, idx) => (
                      <Cell key={idx} fill={['#10b981','#3b82f6','#f59e0b','#ef4444'][idx % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Status</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={visualizationData.payData} cx="50%" cy="50%"
                    label={({ label, count }) => `${label}: ${count}`}
                    outerRadius={80} dataKey="count" labelLine={false}>
                    {visualizationData.payData.map((_, idx) => (
                      <Cell key={idx} fill={['#10b981','#ef4444'][idx % 2]} />
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><FileSpreadsheet size={18} className="text-indigo-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">Sales Data Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Date', 'Invoice #', 'Client', 'City', 'Products',
                  'Invoice Total', 'Collection', 'Deduction', 'Net Amount',
                  'Delivery', 'Received', 'Pay Status', 'Payment', 'Salesperson',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-gray-500">
                    <FileText className="mx-auto mb-2 text-gray-300" size={36} />
                    No sales data. Create invoices to see reports.
                  </td>
                </tr>
              ) : filteredData.map(item => {
                const invoice = invoices.find(inv => inv.id === item.id);
                return (
                  <tr key={item.id}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    onClick={() => invoice && setViewInvoice(invoice)}>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{item.date}</td>
                    <td className="px-3 py-2.5 font-mono text-[#4f46e5] whitespace-nowrap">{item.invoiceNumber}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">{item.clientName}</p>
                      <p className="text-xs text-gray-400">{item.phone}</p>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{item.city}</td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-gray-800 truncate" title={item.productSummary}>{item.productSummary}</p>
                      <p className="text-xs text-gray-400">{item.productCount} item(s)</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                      Rs {item.invoiceTotal.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.collectionMethod === 'Self Collection' ? 'bg-green-100 text-green-800' :
                        item.collectionMethod === 'TCS' ? 'bg-blue-100 text-blue-800' :
                        item.collectionMethod === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                        item.collectionMethod === 'Daewoo' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{item.collectionMethod}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {item.deductionCharges > 0
                        ? <span className="text-red-600 font-medium">- Rs {item.deductionCharges.toLocaleString()}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5] whitespace-nowrap">
                      Rs {item.netAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        item.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                        item.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>{item.deliveryStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.deliveryReceivedStatus ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.deliveryReceivedStatus === 'Received' ? 'bg-green-100 text-green-800' :
                          item.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{item.deliveryReceivedStatus}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.payStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{item.payStatus}</span>
                      {item.paymentStatus === 'Partial' && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          Partial · Rs {item.paidAmount.toLocaleString()} paid
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.paymentMode ? (
                        <div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>{item.paymentMode === 'Online' ? '🏦 Bank' : '💵 Cash'}</span>
                          {item.bankName && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">{item.bankName}</p>}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-gray-800">{item.salesperson}</p>
                      {item.salespersonLocation && <p className="text-xs text-gray-400">{item.salespersonLocation}</p>}
                      <Eye size={13} className="text-gray-300 inline ml-1" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-sm font-bold text-gray-900">
                    TOTALS ({filteredData.length} invoices)
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right">
                    Rs {totals.invoiceTotal.toLocaleString()}
                  </td>
                  <td></td>
                  <td className="px-3 py-3 text-sm font-bold text-red-600 text-right">
                    - Rs {totals.deductionCharges.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-[#4f46e5] text-right">
                    Rs {totals.netAmount.toLocaleString()}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Showing {filteredData.length} of {salesData.length} invoices
          </span>
        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Live Data</span>
      </div>

      {/* Invoice Detail Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{viewInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setViewInvoice(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Invoice #', viewInvoice.invoiceNumber],
                  ['Date', new Date(viewInvoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
                  ['Customer', viewInvoice.customerName],
                  ['CNIC', viewInvoice.customerCNIC],
                  ['Phone 1', viewInvoice.customerPhone],
                  viewInvoice.customerPhone2 ? ['Phone 2', viewInvoice.customerPhone2] : null,
                  viewInvoice.customerProvince ? ['Province', viewInvoice.customerProvince] : null,
                  viewInvoice.customerCity ? ['City', viewInvoice.customerCity] : null,
                  viewInvoice.warrantyLocation ? ['Warranty Location', viewInvoice.warrantyLocation] : null,
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label as string}>
                    <p className="text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900">{val as string}</p>
                  </div>
                ))}
                {viewInvoice.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Delivery Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    viewInvoice.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                    viewInvoice.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                    viewInvoice.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    <Truck size={11} />{viewInvoice.deliveryStatus}
                  </span>
                </div>
                {viewInvoice.deliveryReceivedStatus && (
                  <div>
                    <p className="text-gray-500">Received Status</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      viewInvoice.deliveryReceivedStatus === 'Received' ? 'bg-green-100 text-green-800' :
                      viewInvoice.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>{viewInvoice.deliveryReceivedStatus}</span>
                  </div>
                )}
              </div>

              {/* Products */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Products</h4>
                <div className="space-y-3">
                  {viewInvoice.products.map((product, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900 text-base">{product.productName}</span>
                        <span className="font-semibold">{formatCurrency(product.total)}</span>
                      </div>
                      <div className="text-gray-600 space-y-0.5">
                        {product.brandName && <p><span className="font-medium text-gray-700">Brand:</span> {product.brandName}</p>}
                        {product.modelName && <p><span className="font-medium text-gray-700">Model:</span> {product.modelName}</p>}
                        {product.category && <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>}
                        {product.description && <p><span className="font-medium text-gray-700">Description:</span> {product.description}</p>}
                        <p><span className="font-medium text-gray-700">Qty:</span> {product.quantity} × {formatCurrency(product.price)}</p>
                        {product.serialNumbers?.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-gray-700 mb-1">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.serialNumbers.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-mono">{s}</span>
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
                <div className="border-t pt-4 text-sm">
                  <p className="text-gray-500 mb-1">Exchange &amp; Warranty Note</p>
                  <p className="font-medium text-gray-900">{viewInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

              {/* Sales Details */}
              {(viewInvoice.salesperson || viewInvoice.salespersonLocation || viewInvoice.clientDealBy || viewInvoice.referralBy || viewInvoice.createdBy) && (
                <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={15} className="text-[#4f46e5]" />
                    <h4 className="font-semibold text-gray-900 text-sm">Sales Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.salesperson && (
                      <div><p className="text-gray-500">Salesperson</p><p className="font-medium text-gray-900">{viewInvoice.salesperson}</p></div>
                    )}
                    {viewInvoice.salespersonLocation && (
                      <div><p className="text-gray-500">Salesperson Location</p><p className="font-medium text-gray-900">{viewInvoice.salespersonLocation}</p></div>
                    )}
                    {/* Fixed: was referTo/referFrom — correct fields are clientDealBy and referralBy */}
                    {viewInvoice.clientDealBy && (
                      <div><p className="text-gray-500">Client Deal By</p><p className="font-medium text-gray-900">{viewInvoice.clientDealBy}</p></div>
                    )}
                    {viewInvoice.referralBy && (
                      <div><p className="text-gray-500">Referral By</p><p className="font-medium text-gray-900">{viewInvoice.referralBy}</p></div>
                    )}
                    {viewInvoice.createdBy && (
                      <div><p className="text-gray-500">Created By</p><p className="font-medium text-gray-900">{viewInvoice.createdBy}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {(viewInvoice.paymentMode || viewInvoice.paymentStatus || viewInvoice.bankName) && (
                <div className="border-t pt-4 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={15} className="text-[#10b981]" />
                    <h4 className="font-semibold text-gray-900 text-sm">Payment Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.status && (
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          viewInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{viewInvoice.status}</span>
                      </div>
                    )}
                    {viewInvoice.paymentMode && (
                      <div><p className="text-gray-500">Payment Mode</p><p className="font-medium text-gray-900">{viewInvoice.paymentMode}</p></div>
                    )}
                    {viewInvoice.paymentStatus && (
                      <div><p className="text-gray-500">Full / Partial</p><p className="font-medium text-gray-900">{viewInvoice.paymentStatus}</p></div>
                    )}
                    {viewInvoice.paymentStatus === 'Partial' && (
                      <>
                        <div><p className="text-gray-500">Paid Amount</p><p className="font-medium text-green-600">{formatCurrency(viewInvoice.paidAmount || 0)}</p></div>
                        <div><p className="text-gray-500">Remaining</p><p className="font-medium text-red-600">{formatCurrency(viewInvoice.remainingAmount || 0)}</p></div>
                      </>
                    )}
                    {viewInvoice.paymentMode === 'Online' && viewInvoice.bankName && (
                      <>
                        <div><p className="text-gray-500">Bank</p><p className="font-medium text-gray-900">{viewInvoice.bankName}</p></div>
                        {viewInvoice.bankAccountNumber && (
                          <div><p className="text-gray-500">Account #</p><p className="font-mono text-gray-900 text-xs">{viewInvoice.bankAccountNumber}</p></div>
                        )}
                      </>
                    )}
                    {viewInvoice.paidBy && (
                      <div><p className="text-gray-500">Paid By</p><p className="font-medium text-gray-900">{viewInvoice.paidBy}</p></div>
                    )}
                    {viewInvoice.paidTo && (
                      <div><p className="text-gray-500">Paid To</p><p className="font-medium text-gray-900">{viewInvoice.paidTo}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* Collection & Deduction */}
              {(viewInvoice.collectionMethod || viewInvoice.deductionCharges > 0) && (
                <div className="border-t pt-4 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={15} className="text-orange-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Collection &amp; Deduction</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.collectionMethod && (
                      <div><p className="text-gray-500">Collection Method</p><p className="font-medium text-gray-900">{viewInvoice.collectionMethod}</p></div>
                    )}
                    <div>
                      <p className="text-gray-500">Deduction Charges</p>
                      <p className={`font-medium ${viewInvoice.deductionCharges > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {viewInvoice.deductionCharges > 0 ? formatCurrency(viewInvoice.deductionCharges) : 'No Deduction'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4 bg-[#4f46e5]/5 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Total</span>
                  <span className="font-medium">{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
                {(viewInvoice.deductionCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deduction</span>
                    <span className="text-red-600 font-medium">− {formatCurrency(viewInvoice.deductionCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-base font-bold text-gray-900">Net Total</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">
                    {formatCurrency(viewInvoice.totalAmount - (viewInvoice.deductionCharges || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}