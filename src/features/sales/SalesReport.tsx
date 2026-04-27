import { useState, useMemo, useEffect } from 'react';
import { Invoice, Product } from '../../App';
import {
  Calendar, MapPin, User, Filter, Download, FileSpreadsheet,
  BarChart3, Eye, X, Truck, CreditCard, FileText, Building2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EmployeeFirebaseService } from '../../modules/employee/models/employeeFirebaseService';

type SalesReportProps = {
  invoices: Invoice[];
  products: Product[];
};

// ── Branch/office locations — the three canonical offices ─────────────────
const BRANCH_LOCATIONS = ['Islamabad', 'Karachi', 'Lahore'] as const;
type BranchLocation = typeof BRANCH_LOCATIONS[number] | '';

function normalizeBranch(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  const match = BRANCH_LOCATIONS.find(b => b.toLowerCase() === key);
  return match ?? raw.trim();
}

/**
 * Determines which office branch an invoice belongs to.
 * Priority: salespersonLocation → productLocation → customerCity (normalized)
 * This covers all the ways a branch is recorded in the data.
 */
function getInvoiceBranch(invoice: Invoice): string {
  // 1. Salesperson's office location (most reliable branch indicator)
  if (invoice.salespersonLocation) {
    const n = normalizeBranch(invoice.salespersonLocation);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  // 2. Product/stock location
  if (invoice.productLocation) {
    const n = normalizeBranch(invoice.productLocation);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  // 3. Customer city as fallback
  if (invoice.customerCity) {
    const n = normalizeBranch(invoice.customerCity);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  return '';
}

export function SalesReport({ invoices, products }: SalesReportProps) {
  const [dateFrom, setDateFrom]                   = useState('');
  const [dateTo, setDateTo]                       = useState('');
  const [selectedBranch, setSelectedBranch]       = useState<BranchLocation>('');
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState('');
  const [selectedPayStatus, setSelectedPayStatus] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [viewInvoice, setViewInvoice]             = useState<Invoice | null>(null);

  // ── Fetch employees once to resolve salesperson UIDs → names ─────────
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(list => setEmployees(list.map((e: any) => ({ id: e.id, name: e.name }))))
      .catch(() => {});
  }, []);

  // Resolves a salesperson UID to a readable name using the employees list
  const resolveName = (raw: string | undefined): string => {
    if (!raw) return 'N/A';
    const emp = employees.find(e => e.id === raw);
    return emp ? emp.name : raw;
  };

  const deliveryStatuses = ['Self-collect', 'LCS', 'Daewoo', 'Delivered'];

  const salespersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => {
      const name = resolveName(inv.salesperson);
      if (name && name !== 'N/A') s.add(name);
    });
    return Array.from(s).sort();
  }, [invoices, employees]);

  // ── ONE row per invoice — branch derived from priority logic ─────────
  const salesData = useMemo(() => {
    return invoices.map(invoice => {
      const deductionCharges = invoice.deductionCharges || 0;
      const netAmount = invoice.totalAmount - deductionCharges;
      const branch = getInvoiceBranch(invoice);   // ← the authoritative branch field

      const productSummary = invoice.products
        .map(p => `${p.productName}${p.brandName ? ` (${p.brandName})` : ''} ×${p.quantity}`)
        .join(', ');

      return {
        id:                    invoice.id,
        date:                  invoice.date,
        invoiceNumber:         invoice.invoiceNumber,
        clientName:            invoice.customerName,
        customerCity:          invoice.customerCity || '',       // raw customer city (display only)
        branch,                                                   // resolved office branch
        province:              invoice.customerProvince || '',
        phone:                 invoice.customerPhone,
        phone2:                invoice.customerPhone2 || '',
        cnic:                  invoice.customerCNIC,
        productSummary,
        productCount:          invoice.products.length,
        invoiceTotal:          invoice.totalAmount,
        collectionMethod:      invoice.collectionMethod || 'Self Collection',
        deductionCharges,
        netAmount,
        deliveryStatus:        invoice.deliveryStatus,
        deliveryReceivedStatus: invoice.deliveryReceivedStatus,
        payStatus:             invoice.status,
        paymentMode:           invoice.paymentMode || '',
        paymentStatus:         invoice.paymentStatus || '',
        paidAmount:            invoice.paidAmount || 0,
        remainingAmount:       invoice.remainingAmount || 0,
        bankName:              invoice.bankName || '',
        bankAccountNumber:     invoice.bankAccountNumber || '',
        salesperson:           resolveName(invoice.salesperson),
        salespersonLocation:   invoice.salespersonLocation || '',
        productLocation:       invoice.productLocation || '',
        clientDealBy:          invoice.clientDealBy || '',
        referralBy:            invoice.referralBy || '',
        createdBy:             invoice.createdBy || '',
      };
    });
  }, [invoices, employees]);

  // ── Branch summary — how many invoices per branch (for the branch cards) ─
  const branchSummary = useMemo(() => {
    return BRANCH_LOCATIONS.map(branch => {
      const branchInvoices = salesData.filter(i => i.branch === branch);
      const netAmount = branchInvoices.reduce((s, i) => s + i.netAmount, 0);
      const paidCount = branchInvoices.filter(i => i.payStatus === 'Paid').length;
      const unpaidCount = branchInvoices.filter(i => i.payStatus === 'Unpaid').length;
      return { branch, count: branchInvoices.length, netAmount, paidCount, unpaidCount };
    });
  }, [salesData]);

  // ── Apply filters — branch filter uses the resolved `branch` field ───
  const filteredData = useMemo(() => {
    return salesData.filter(item => {
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo   && item.date > dateTo)   return false;
      // Branch filter: match against the resolved branch (not raw customerCity)
      if (selectedBranch && item.branch !== selectedBranch) return false;
      if (selectedSalesperson && item.salesperson !== selectedSalesperson) return false;
      if (selectedDeliveryStatus && item.deliveryStatus !== selectedDeliveryStatus) return false;
      if (selectedPayStatus && item.payStatus !== selectedPayStatus) return false;
      return true;
    });
  }, [salesData, dateFrom, dateTo, selectedBranch, selectedSalesperson, selectedDeliveryStatus, selectedPayStatus]);

  // ── Summary totals ─────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const invoiceTotal    = filteredData.reduce((s, i) => s + i.invoiceTotal, 0);
    const deductionCharges = filteredData.reduce((s, i) => s + i.deductionCharges, 0);
    const netAmount       = filteredData.reduce((s, i) => s + i.netAmount, 0);
    const paidCount       = filteredData.filter(i => i.payStatus === 'Paid').length;
    const unpaidCount     = filteredData.filter(i => i.payStatus === 'Unpaid').length;
    const partialCount    = filteredData.filter(i => i.paymentStatus === 'Partial').length;
    return { invoiceTotal, deductionCharges, netAmount, paidCount, unpaidCount, partialCount };
  }, [filteredData]);

  // ── Visualization data ─────────────────────────────────────────────────
  const visualizationData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredData.forEach(i => { byDate[i.date] = (byDate[i.date] || 0) + i.netAmount; });
    const salesTrend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // Branch sales — uses resolved branch field
    const byBranch: Record<string, number> = {};
    filteredData.forEach(i => {
      const key = i.branch || 'Unknown';
      byBranch[key] = (byBranch[key] || 0) + i.netAmount;
    });
    const branchSales = Object.entries(byBranch)
      .map(([branch, amount]) => ({ branch, amount }))
      .sort((a, b) => b.amount - a.amount);

    const bySP: Record<string, number> = {};
    filteredData.forEach(i => { bySP[i.salesperson] = (bySP[i.salesperson] || 0) + i.netAmount; });
    const salespersonSales = Object.entries(bySP)
      .map(([salesperson, amount]) => ({ salesperson, amount }))
      .sort((a, b) => b.amount - a.amount);

    const byDelivery: Record<string, number> = {};
    filteredData.forEach(i => { byDelivery[i.deliveryStatus] = (byDelivery[i.deliveryStatus] || 0) + 1; });
    const statusData = Object.entries(byDelivery).map(([status, count]) => ({ status, count }));

    const payData = [
      { label: 'Paid',   count: totals.paidCount },
      { label: 'Unpaid', count: totals.unpaidCount },
    ].filter(d => d.count > 0);

    return { salesTrend, branchSales, salespersonSales, statusData, payData };
  }, [filteredData, totals]);

  // ── CSV Export ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      'Date', 'Invoice #', 'Client Name', 'Branch (Office)', 'Customer City',
      'Province', 'Phone', 'CNIC', 'Products', 'Invoice Total',
      'Collection Method', 'Deduction', 'Net Amount', 'Delivery Status',
      'Delivery Received', 'Pay Status', 'Payment Mode', 'Payment Status',
      'Paid Amount', 'Remaining Amount', 'Bank', 'Salesperson',
      'Salesperson Location', 'Product Location', 'Client Deal By', 'Referral By', 'Created By',
    ];
    const rows = filteredData.map(item => [
      item.date, item.invoiceNumber, item.clientName, item.branch, item.customerCity,
      item.province, item.phone, item.cnic, `"${item.productSummary}"`, item.invoiceTotal,
      item.collectionMethod, item.deductionCharges, item.netAmount,
      item.deliveryStatus, item.deliveryReceivedStatus, item.payStatus,
      item.paymentMode, item.paymentStatus, item.paidAmount, item.remainingAmount,
      item.bankName, item.salesperson, item.salespersonLocation, item.productLocation,
      item.clientDealBy, item.referralBy, item.createdBy,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearFilters = () => {
    setDateFrom(''); setDateTo(''); setSelectedBranch('');
    setSelectedSalesperson(''); setSelectedDeliveryStatus(''); setSelectedPayStatus('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

  const hasActiveFilters = dateFrom || dateTo || selectedBranch || selectedSalesperson || selectedDeliveryStatus || selectedPayStatus;

  const BRANCH_COLORS: Record<string, string> = {
    Islamabad: 'border-blue-400 bg-blue-50',
    Karachi:   'border-emerald-400 bg-emerald-50',
    Lahore:    'border-purple-400 bg-purple-50',
  };
  const BRANCH_TEXT: Record<string, string> = {
    Islamabad: 'text-blue-700',
    Karachi:   'text-emerald-700',
    Lahore:    'text-purple-700',
  };
  const BRANCH_BTN: Record<string, string> = {
    Islamabad: 'bg-blue-600 hover:bg-blue-700',
    Karachi:   'bg-emerald-600 hover:bg-emerald-700',
    Lahore:    'bg-purple-600 hover:bg-purple-700',
  };
  const BRANCH_CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales Report</h2>
          <p className="text-sm text-gray-500 mt-1">Auto-generated from invoice data · Read-only</p>
        </div>
        <button
          onClick={() => setShowVisualization(!showVisualization)}
          className="px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded-xl hover:bg-blue-200 transition-all flex items-center gap-2">
          <BarChart3 size={17} />
          {showVisualization ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {/* ── Branch Quick-Select Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {branchSummary.map(b => (
          <button
            key={b.branch}
            onClick={() => setSelectedBranch(selectedBranch === b.branch ? '' : b.branch as BranchLocation)}
            className={`text-left rounded-xl border-2 p-4 transition-all shadow-sm hover:shadow-md
              ${selectedBranch === b.branch
                ? `${BRANCH_COLORS[b.branch]} border-opacity-100 ring-2 ring-offset-1 ring-current`
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${selectedBranch === b.branch ? BRANCH_COLORS[b.branch] : 'bg-gray-100'}`}>
                  <Building2 size={15} className={selectedBranch === b.branch ? BRANCH_TEXT[b.branch] : 'text-gray-500'} />
                </div>
                <span className={`font-bold text-base ${selectedBranch === b.branch ? BRANCH_TEXT[b.branch] : 'text-gray-800'}`}>
                  {b.branch}
                </span>
              </div>
              {selectedBranch === b.branch && (
                <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${BRANCH_BTN[b.branch]}`}>
                  Active
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{b.count} <span className="text-sm font-normal text-gray-500">invoices</span></p>
            <p className={`text-sm font-semibold mt-0.5 ${selectedBranch === b.branch ? BRANCH_TEXT[b.branch] : 'text-gray-600'}`}>
              {formatCurrency(b.netAmount)}
            </p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-green-600 font-medium">✓ {b.paidCount} paid</span>
              <span className="text-red-500 font-medium">✗ {b.unpaidCount} unpaid</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg"><Filter size={16} className="text-blue-600" /></div>
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            {selectedBranch && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold text-white ${BRANCH_BTN[selectedBranch]}`}>
                📍 {selectedBranch} Branch
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={handleClearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              ✕ Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <Calendar size={11} className="inline mr-1" />Date From
            </label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <Calendar size={11} className="inline mr-1" />Date To
            </label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>

          {/* Branch / Office Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <Building2 size={11} className="inline mr-1" />Branch / Office
            </label>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value as BranchLocation)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none font-medium
                ${selectedBranch ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300'}`}>
              <option value="">All Branches</option>
              {BRANCH_LOCATIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Salesperson */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <User size={11} className="inline mr-1" />Salesperson
            </label>
            <select value={selectedSalesperson} onChange={e => setSelectedSalesperson(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
              <option value="">All</option>
              {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>
          </div>

          {/* Delivery */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <Truck size={11} className="inline mr-1" />Delivery
            </label>
            <select value={selectedDeliveryStatus} onChange={e => setSelectedDeliveryStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
              <option value="">All</option>
              {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Pay Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <CreditCard size={11} className="inline mr-1" />Pay Status
            </label>
            <select value={selectedPayStatus} onChange={e => setSelectedPayStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
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
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Invoices',       value: filteredData.length,                  color: 'text-gray-900',   bg: 'bg-white'      },
          { label: 'Invoice Total',  value: formatCurrency(totals.invoiceTotal),  color: 'text-gray-900',   bg: 'bg-white'      },
          { label: 'Deductions',     value: formatCurrency(totals.deductionCharges), color: 'text-red-600', bg: 'bg-white'      },
          { label: 'Net Amount',     value: formatCurrency(totals.netAmount),     color: 'text-green-700',  bg: 'bg-green-50'   },
          { label: 'Paid',           value: totals.paidCount,                     color: 'text-green-600',  bg: 'bg-white'      },
          { label: 'Unpaid',         value: totals.unpaidCount,                   color: 'text-red-600',    bg: 'bg-white'      },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-lg border border-gray-200 p-3 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Visualization ── */}
      {showVisualization && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 rounded-lg"><BarChart3 size={18} className="text-purple-600" /></div>
            <h3 className="text-lg font-bold text-gray-900">
              Sales Analytics {selectedBranch ? `— ${selectedBranch} Branch` : '(All Branches)'}
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={260}>
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
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Net Amount by Branch</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={visualizationData.branchSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Bar dataKey="amount" radius={[4,4,0,0]}>
                    {visualizationData.branchSales.map((_, idx) => (
                      <Cell key={idx} fill={BRANCH_CHART_COLORS[idx % 3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales by Salesperson</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={visualizationData.salespersonSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="salesperson" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net']} />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Delivery Distribution</h4>
              <ResponsiveContainer width="100%" height={240}>
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
              <ResponsiveContainer width="100%" height={240}>
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

      {/* ── Sales Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg"><FileSpreadsheet size={16} className="text-indigo-600" /></div>
            <h3 className="text-base font-bold text-gray-900">
              Sales Data
              {selectedBranch && (
                <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-semibold text-white ${BRANCH_BTN[selectedBranch]}`}>
                  {selectedBranch} Branch
                </span>
              )}
            </h3>
          </div>
          <span className="text-xs text-gray-500">{filteredData.length} of {salesData.length} invoices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Date', 'Invoice #', 'Client', 'Branch', 'Salesperson',
                  'Products', 'Invoice Total', 'Collection', 'Deduction',
                  'Net Amount', 'Delivery', 'Received', 'Pay Status', 'Payment',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-gray-400">
                    <FileText className="mx-auto mb-2 text-gray-300" size={36} />
                    <p className="font-medium text-gray-500">No records found</p>
                    <p className="text-xs mt-1">
                      {hasActiveFilters ? 'No invoices match the selected filters' : 'Create invoices to see sales data'}
                    </p>
                  </td>
                </tr>
              ) : filteredData.map(item => {
                const invoice = invoices.find(inv => inv.id === item.id);
                return (
                  <tr key={item.id}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    onClick={() => invoice && setViewInvoice(invoice)}>

                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs">{item.date}</td>
                    <td className="px-3 py-2.5 font-mono text-[#4f46e5] whitespace-nowrap text-xs font-semibold">{item.invoiceNumber}</td>

                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">{item.clientName}</p>
                      <p className="text-xs text-gray-400">{item.phone}</p>
                    </td>

                    {/* Branch column — shows the resolved office branch */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.branch ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full
                          ${item.branch === 'Islamabad' ? 'bg-blue-100 text-blue-700' :
                            item.branch === 'Karachi'   ? 'bg-emerald-100 text-emerald-700' :
                            item.branch === 'Lahore'    ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'}`}>
                          <Building2 size={10} />{item.branch}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                      {item.salespersonLocation && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.salespersonLocation}</p>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      <p className="text-gray-800 text-xs">{item.salesperson}</p>
                      {item.clientDealBy && <p className="text-xs text-gray-400">Deal: {item.clientDealBy}</p>}
                    </td>

                    <td className="px-3 py-2.5 max-w-[160px]">
                      <p className="text-gray-700 truncate text-xs" title={item.productSummary}>{item.productSummary}</p>
                      <p className="text-xs text-gray-400">{item.productCount} item(s)</p>
                    </td>

                    <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap text-xs">
                      Rs {item.invoiceTotal.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.collectionMethod === 'Self Collection' ? 'bg-green-100 text-green-800' :
                        item.collectionMethod === 'TCS'            ? 'bg-blue-100 text-blue-800' :
                        item.collectionMethod === 'LCS'            ? 'bg-yellow-100 text-yellow-800' :
                        item.collectionMethod === 'Daewoo'         ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{item.collectionMethod}</span>
                    </td>

                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-xs">
                      {item.deductionCharges > 0
                        ? <span className="text-red-600 font-medium">- Rs {item.deductionCharges.toLocaleString()}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5] whitespace-nowrap text-xs">
                      Rs {item.netAmount.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.deliveryStatus === 'Delivered'    ? 'bg-green-100 text-green-800' :
                        item.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                        item.deliveryStatus === 'LCS'          ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>{item.deliveryStatus}</span>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.deliveryReceivedStatus ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.deliveryReceivedStatus === 'Received'   ? 'bg-green-100 text-green-800' :
                          item.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{item.deliveryReceivedStatus}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.payStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{item.payStatus}</span>
                      {item.paymentStatus === 'Partial' && (
                        <p className="text-xs text-orange-600 mt-0.5">Partial · Rs {item.paidAmount.toLocaleString()}</p>
                      )}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.paymentMode ? (
                        <div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>{item.paymentMode === 'Online' ? '🏦 Bank' : '💵 Cash'}</span>
                          {item.bankName && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[100px]">{item.bankName}</p>}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                  </tr>
                );
              })}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-sm font-bold text-gray-900">
                    TOTALS — {filteredData.length} invoices{selectedBranch ? ` · ${selectedBranch} Branch` : ''}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900 text-right">Rs {totals.invoiceTotal.toLocaleString()}</td>
                  <td></td>
                  <td className="px-3 py-3 text-xs font-bold text-red-600 text-right">- Rs {totals.deductionCharges.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs font-bold text-[#4f46e5] text-right">Rs {totals.netAmount.toLocaleString()}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {filteredData.length} of {salesData.length} invoices
            {selectedBranch ? ` · ${selectedBranch} Branch` : ' · All Branches'}
          </span>
        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">Live Data</span>
      </div>

      {/* ── Invoice Detail Modal ── */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{viewInvoice.invoiceNumber}</p>
              </div>
              {/* Show which branch this invoice belongs to */}
              {getInvoiceBranch(viewInvoice) && (
                <span className={`text-xs px-3 py-1 rounded-full font-semibold text-white ${BRANCH_BTN[getInvoiceBranch(viewInvoice)] ?? 'bg-gray-500'}`}>
                  📍 {getInvoiceBranch(viewInvoice)} Branch
                </span>
              )}
              <button onClick={() => setViewInvoice(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Customer & Invoice */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer & Invoice</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Invoice #', viewInvoice.invoiceNumber],
                    ['Date', new Date(viewInvoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
                    ['Customer', viewInvoice.customerName],
                    ['CNIC', viewInvoice.customerCNIC],
                    ['Phone 1', viewInvoice.customerPhone],
                    viewInvoice.customerPhone2 ? ['Phone 2', viewInvoice.customerPhone2] : null,
                    viewInvoice.customerProvince ? ['Province', viewInvoice.customerProvince] : null,
                    viewInvoice.customerCity ? ['Customer City', viewInvoice.customerCity] : null,
                    viewInvoice.warrantyLocation ? ['Warranty Location', viewInvoice.warrantyLocation] : null,
                  ].filter(Boolean).map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-gray-400 text-xs">{label}</p>
                      <p className="font-medium text-gray-900">{val as string}</p>
                    </div>
                  ))}
                  {viewInvoice.customerAddress && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">Address</p>
                      <p className="font-medium text-gray-900">{viewInvoice.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch & Sales Info */}
              {(viewInvoice.salesperson || viewInvoice.salespersonLocation || viewInvoice.clientDealBy || viewInvoice.referralBy || viewInvoice.createdBy || viewInvoice.productLocation) && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Building2 size={11} /> Branch & Sales Info
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.salesperson && (
                      <div><p className="text-gray-400 text-xs">Salesperson</p><p className="font-medium text-gray-900">{viewInvoice.salesperson}</p></div>
                    )}
                    {viewInvoice.salespersonLocation && (
                      <div><p className="text-gray-400 text-xs">Branch / Office</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5
                          ${viewInvoice.salespersonLocation === 'Islamabad' ? 'bg-blue-100 text-blue-700' :
                            viewInvoice.salespersonLocation === 'Karachi'   ? 'bg-emerald-100 text-emerald-700' :
                            viewInvoice.salespersonLocation === 'Lahore'    ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'}`}>
                          <Building2 size={10} />{viewInvoice.salespersonLocation}
                        </span>
                      </div>
                    )}
                    {viewInvoice.productLocation && (
                      <div><p className="text-gray-400 text-xs">Product / Stock Location</p><p className="font-medium text-gray-900">{viewInvoice.productLocation}</p></div>
                    )}
                    {viewInvoice.clientDealBy && (
                      <div><p className="text-gray-400 text-xs">Client Deal By</p><p className="font-medium text-gray-900">{viewInvoice.clientDealBy}</p></div>
                    )}
                    {viewInvoice.referralBy && (
                      <div><p className="text-gray-400 text-xs">Referral By</p><p className="font-medium text-gray-900">{viewInvoice.referralBy}</p></div>
                    )}
                    {viewInvoice.createdBy && (
                      <div><p className="text-gray-400 text-xs">Created By</p><p className="font-medium text-gray-900">{viewInvoice.createdBy}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Product', 'Qty', 'Serials', 'Total'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewInvoice.products.map((product, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-gray-900">{product.productName}</p>
                            {product.brandName && <p className="text-xs text-gray-400">{product.brandName} · {product.modelName}</p>}
                            {product.category && <p className="text-xs text-gray-400">{product.category}</p>}
                            {product.description && <p className="text-xs text-gray-400 italic">{product.description}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                            {product.quantity} × {formatCurrency(product.price)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(product.serialNumbers || []).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{formatCurrency(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewInvoice.exchangeWarrantyNote && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Exchange & Warranty Note</p>
                  <p className="text-gray-700">{viewInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

              {/* Delivery */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Delivery Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    viewInvoice.deliveryStatus === 'Delivered'    ? 'bg-green-100 text-green-800' :
                    viewInvoice.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' :
                    viewInvoice.deliveryStatus === 'LCS'          ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'}`}>
                    <Truck size={10} />{viewInvoice.deliveryStatus}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Received Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    viewInvoice.deliveryReceivedStatus === 'Received'   ? 'bg-green-100 text-green-800' :
                    viewInvoice.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'}`}>{viewInvoice.deliveryReceivedStatus}</span>
                </div>
                {viewInvoice.collectionMethod && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Collection</p>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {viewInvoice.collectionMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CreditCard size={11} /> Payment Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Status</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                      viewInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{viewInvoice.status}</span>
                  </div>
                  {viewInvoice.paymentMode && (
                    <div><p className="text-gray-400 text-xs">Mode</p><p className="font-medium">{viewInvoice.paymentMode}</p></div>
                  )}
                  {viewInvoice.paymentStatus && (
                    <div><p className="text-gray-400 text-xs">Full / Partial</p><p className="font-medium">{viewInvoice.paymentStatus}</p></div>
                  )}
                  {viewInvoice.paymentStatus === 'Partial' && (
                    <>
                      <div><p className="text-gray-400 text-xs">Paid</p><p className="font-medium text-green-700">{formatCurrency(viewInvoice.paidAmount || 0)}</p></div>
                      <div><p className="text-gray-400 text-xs">Remaining</p><p className="font-medium text-red-600">{formatCurrency(viewInvoice.remainingAmount || 0)}</p></div>
                    </>
                  )}
                  {viewInvoice.paymentMode === 'Online' && viewInvoice.bankName && (
                    <>
                      <div><p className="text-gray-400 text-xs">Bank</p><p className="font-medium">{viewInvoice.bankName}</p></div>
                      {viewInvoice.bankAccountNumber && (
                        <div><p className="text-gray-400 text-xs">Account #</p><p className="font-mono text-xs">{viewInvoice.bankAccountNumber}</p></div>
                      )}
                    </>
                  )}
                  {viewInvoice.paidBy && <div><p className="text-gray-400 text-xs">Paid By</p><p className="font-medium">{viewInvoice.paidBy}</p></div>}
                  {viewInvoice.paidTo && <div><p className="text-gray-400 text-xs">Paid To</p><p className="font-medium">{viewInvoice.paidTo}</p></div>}
                </div>
              </div>

              {/* Totals */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Total</span>
                  <span className="font-medium">{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
                {(viewInvoice.deductionCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deduction</span>
                    <span className="text-red-600 font-medium">− {formatCurrency(viewInvoice.deductionCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
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