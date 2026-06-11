import { useState, useMemo, useEffect, useRef } from 'react';
import { Invoice, Product } from '../../App';
import {
  Calendar, MapPin, User, Filter, Download, FileSpreadsheet,
  BarChart3, Eye, X, Truck, CreditCard, FileText, Building2, ChevronDown,
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

const BRANCH_LOCATIONS = ['Abu Dhabi', 'Dubai', 'Saudi Arabia'] as const;
type BranchLocation = typeof BRANCH_LOCATIONS[number];

function normalizeBranch(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  const match = BRANCH_LOCATIONS.find(b => b.toLowerCase() === key);
  return match ?? raw.trim();
}

function getInvoiceBranch(invoice: Invoice): string {
  if (invoice.salespersonLocation) {
    const n = normalizeBranch(invoice.salespersonLocation);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  if (invoice.productLocation) {
    const n = normalizeBranch(invoice.productLocation);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  if (invoice.customerCity) {
    const n = normalizeBranch(invoice.customerCity);
    if (BRANCH_LOCATIONS.includes(n as any)) return n;
  }
  return '';
}

// ── Shared MultiSelect ────────────────────────────────────────────────────────
function MultiSelect({
  label, options, selected, onChange, placeholder = 'All', disabled = false, icon,
}: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void; placeholder?: string; disabled?: boolean; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const display = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">{icon}{label}</label>
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2 transition-colors
          ${disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
            open ? 'border-indigo-500 ring-1 ring-indigo-300 bg-white' :
            selected.length > 0 ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' :
            'bg-white border-gray-300 hover:border-indigo-400 cursor-pointer'}`}>
        <span className={selected.length === 0 ? 'text-gray-400' : ''}>{display}</span>
        <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} text-gray-400`} />
      </button>
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
              {v}<button onClick={() => toggle(v)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 ? <p className="px-3 py-2 text-xs text-gray-400 italic">No options</p> : (
            <>
              {selected.length > 0 && (
                <button onClick={() => { onChange([]); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-b border-gray-100 font-medium">
                  ✕ Clear selection
                </button>
              )}
              {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-indigo-600 w-3.5 h-3.5 rounded flex-shrink-0" />
                  <span className="text-gray-800">{opt}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SalesReport({ invoices, products }: SalesReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>([]);
  const [selectedDeliveryStatuses, setSelectedDeliveryStatuses] = useState<string[]>([]);
  const [selectedPayStatuses, setSelectedPayStatuses] = useState<string[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(list => setEmployees(list.map((e: any) => ({ id: e.id, name: e.name }))))
      .catch(() => {});
  }, []);

  const resolveName = (raw: string | undefined): string => {
    if (!raw) return 'N/A';
    const emp = employees.find(e => e.id === raw);
    return emp ? emp.name : raw;
  };

  const deliveryStatuses = ['Self-collect', 'LCS', 'Daewoo', 'Delivered'];
  const payStatuses = ['Paid', 'Unpaid'];

  const salespersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => { const n = resolveName(inv.salesperson); if (n && n !== 'N/A') s.add(n); });
    return Array.from(s).sort();
  }, [invoices, employees]);

  const salesData = useMemo(() => {
    return invoices.map(invoice => {
      const deductionCharges = invoice.deductionCharges || 0;
      const netAmount = invoice.totalAmount - deductionCharges;
      const branch = getInvoiceBranch(invoice);
      const productSummary = invoice.products
        .map(p => `${p.productName}${p.brandName ? ` (${p.brandName})` : ''} ×${p.quantity}`)
        .join(', ');
      return {
        id: invoice.id, date: invoice.date, invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.customerName, customerCity: invoice.customerCity || '',
        branch, province: invoice.customerProvince || '', phone: invoice.customerPhone,
        phone2: invoice.customerPhone2 || '', cnic: invoice.customerCNIC,
        productSummary, productCount: invoice.products.length,
        invoiceTotal: invoice.totalAmount, collectionMethod: invoice.collectionMethod || 'Self Collection',
        deductionCharges, netAmount, deliveryStatus: invoice.deliveryStatus,
        deliveryReceivedStatus: invoice.deliveryReceivedStatus, payStatus: invoice.status,
        paymentMode: invoice.paymentMode || '', paymentStatus: invoice.paymentStatus || '',
        paidAmount: invoice.paidAmount || 0, remainingAmount: invoice.remainingAmount || 0,
        bankName: invoice.bankName || '', bankAccountNumber: invoice.bankAccountNumber || '',
        salesperson: resolveName(invoice.salesperson), salespersonLocation: invoice.salespersonLocation || '',
        productLocation: invoice.productLocation || '', clientDealBy: invoice.clientDealBy || '',
        referralBy: invoice.referralBy || '', createdBy: invoice.createdBy || '',
      };
    });
  }, [invoices, employees]);

  const branchSummary = useMemo(() => {
    return BRANCH_LOCATIONS.map(branch => {
      const bi = salesData.filter(i => i.branch === branch);
      const netAmount = bi.reduce((s, i) => s + i.netAmount, 0);
      const paidCount = bi.filter(i => i.payStatus === 'Paid').length;
      const unpaidCount = bi.filter(i => i.payStatus === 'Unpaid').length;
      return { branch, count: bi.length, netAmount, paidCount, unpaidCount };
    });
  }, [salesData]);

  const filteredData = useMemo(() => {
    return salesData.filter(item => {
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (selectedBranches.length > 0 && !selectedBranches.includes(item.branch)) return false;
      if (selectedSalespersons.length > 0 && !selectedSalespersons.includes(item.salesperson)) return false;
      if (selectedDeliveryStatuses.length > 0 && !selectedDeliveryStatuses.includes(item.deliveryStatus)) return false;
      if (selectedPayStatuses.length > 0 && !selectedPayStatuses.includes(item.payStatus)) return false;
      return true;
    });
  }, [salesData, dateFrom, dateTo, selectedBranches, selectedSalespersons, selectedDeliveryStatuses, selectedPayStatuses]);

  const totals = useMemo(() => {
    const invoiceTotal = filteredData.reduce((s, i) => s + i.invoiceTotal, 0);
    const deductionCharges = filteredData.reduce((s, i) => s + i.deductionCharges, 0);
    const netAmount = filteredData.reduce((s, i) => s + i.netAmount, 0);
    const paidCount = filteredData.filter(i => i.payStatus === 'Paid').length;
    const unpaidCount = filteredData.filter(i => i.payStatus === 'Unpaid').length;
    const partialCount = filteredData.filter(i => i.paymentStatus === 'Partial').length;
    return { invoiceTotal, deductionCharges, netAmount, paidCount, unpaidCount, partialCount };
  }, [filteredData]);

  const visualizationData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredData.forEach(i => { byDate[i.date] = (byDate[i.date] || 0) + i.netAmount; });
    const salesTrend = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));

    const byBranch: Record<string, number> = {};
    filteredData.forEach(i => { const k = i.branch || 'Unknown'; byBranch[k] = (byBranch[k] || 0) + i.netAmount; });
    const branchSales = Object.entries(byBranch).map(([branch, amount]) => ({ branch, amount })).sort((a, b) => b.amount - a.amount);

    const bySP: Record<string, number> = {};
    filteredData.forEach(i => { bySP[i.salesperson] = (bySP[i.salesperson] || 0) + i.netAmount; });
    const salespersonSales = Object.entries(bySP).map(([salesperson, amount]) => ({ salesperson, amount })).sort((a, b) => b.amount - a.amount);

    const byDelivery: Record<string, number> = {};
    filteredData.forEach(i => { byDelivery[i.deliveryStatus] = (byDelivery[i.deliveryStatus] || 0) + 1; });
    const statusData = Object.entries(byDelivery).map(([status, count]) => ({ status, count }));

    const payData = [{ label: 'Paid', count: totals.paidCount }, { label: 'Unpaid', count: totals.unpaidCount }].filter(d => d.count > 0);
    return { salesTrend, branchSales, salespersonSales, statusData, payData };
  }, [filteredData, totals]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Invoice #', 'Client Name', 'Branch (Office)', 'Customer City', 'Province', 'Phone', 'CNIC', 'Products', 'Invoice Total', 'Collection Method', 'Deduction', 'Net Amount', 'Delivery Status', 'Delivery Received', 'Pay Status', 'Payment Mode', 'Payment Status', 'Paid Amount', 'Remaining Amount', 'Bank', 'Salesperson', 'Salesperson Location', 'Product Location', 'Client Deal By', 'Referral By', 'Created By'];
    const rows = filteredData.map(item => [item.date, item.invoiceNumber, item.clientName, item.branch, item.customerCity, item.province, item.phone, item.cnic, `"${item.productSummary}"`, item.invoiceTotal, item.collectionMethod, item.deductionCharges, item.netAmount, item.deliveryStatus, item.deliveryReceivedStatus, item.payStatus, item.paymentMode, item.paymentStatus, item.paidAmount, item.remainingAmount, item.bankName, item.salesperson, item.salespersonLocation, item.productLocation, item.clientDealBy, item.referralBy, item.createdBy]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearFilters = () => {
    setDateFrom(''); setDateTo('');
    setSelectedBranches([]); setSelectedSalespersons([]);
    setSelectedDeliveryStatuses([]); setSelectedPayStatuses([]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);

  const hasActiveFilters = dateFrom || dateTo || selectedBranches.length > 0 || selectedSalespersons.length > 0 || selectedDeliveryStatuses.length > 0 || selectedPayStatuses.length > 0;

  const BRANCH_COLORS: Record<string, string> = { 'Abu Dhabi': 'border-blue-400 bg-blue-50', Dubai: 'border-emerald-400 bg-emerald-50', 'Saudi Arabia': 'border-purple-400 bg-purple-50' };
  const BRANCH_TEXT: Record<string, string> = { 'Abu Dhabi': 'text-blue-700', Dubai: 'text-emerald-700', 'Saudi Arabia': 'text-purple-700' };
  const BRANCH_BTN: Record<string, string> = { 'Abu Dhabi': 'bg-blue-600 hover:bg-blue-700', Dubai: 'bg-emerald-600 hover:bg-emerald-700', 'Saudi Arabia': 'bg-purple-600 hover:bg-purple-700' };
  const BRANCH_CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales Report</h2>
          <p className="text-sm text-gray-500 mt-1">Auto-generated from invoice data · Read-only</p>
        </div>
        <button onClick={() => setShowVisualization(!showVisualization)}
          className="px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded-xl hover:bg-blue-200 transition-all flex items-center gap-2">
          <BarChart3 size={17} />
          {showVisualization ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {/* ── Branch Quick-Select Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {branchSummary.map(b => {
          const isActive = selectedBranches.includes(b.branch);
          return (
            <button key={b.branch}
              onClick={() => setSelectedBranches(isActive ? selectedBranches.filter(x => x !== b.branch) : [...selectedBranches, b.branch])}
              className={`text-left rounded-xl border-2 p-4 transition-all shadow-sm hover:shadow-md
                ${isActive ? `${BRANCH_COLORS[b.branch]} border-opacity-100 ring-2 ring-offset-1 ring-current` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isActive ? BRANCH_COLORS[b.branch] : 'bg-gray-100'}`}>
                    <Building2 size={15} className={isActive ? BRANCH_TEXT[b.branch] : 'text-gray-500'} />
                  </div>
                  <span className={`font-bold text-base ${isActive ? BRANCH_TEXT[b.branch] : 'text-gray-800'}`}>{b.branch}</span>
                </div>
                {isActive && <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${BRANCH_BTN[b.branch]}`}>Active</span>}
              </div>
              <p className="text-2xl font-bold text-gray-900">{b.count} <span className="text-sm font-normal text-gray-500">invoices</span></p>
              <p className={`text-sm font-semibold mt-0.5 ${isActive ? BRANCH_TEXT[b.branch] : 'text-gray-600'}`}>{formatCurrency(b.netAmount)}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-green-600 font-medium">✓ {b.paidCount} paid</span>
                <span className="text-red-500 font-medium">✗ {b.unpaidCount} unpaid</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg"><Filter size={16} className="text-blue-600" /></div>
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            {selectedBranches.length > 0 && selectedBranches.map(b => (
              <span key={b} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold text-white ${BRANCH_BTN[b] ?? 'bg-gray-500'}`}>
                📍 {b}
              </span>
            ))}
            {hasActiveFilters && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Active</span>}
          </div>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              ✕ Clear all filters
            </button>
          )}
        </div>

        {/* Row 1: Dates */}
        <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={11} className="inline" />Date From</label>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={11} className="inline" />Date To</label>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4f46e5] focus:outline-none" />
          </div>
        </div>

        {/* Row 2: All multi-select dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MultiSelect label="Branch / Office" options={[...BRANCH_LOCATIONS]} selected={selectedBranches} onChange={setSelectedBranches} placeholder="All Branches" icon={<Building2 size={11} />} />
          <MultiSelect label="Salesperson" options={salespersons} selected={selectedSalespersons} onChange={setSelectedSalespersons} placeholder="All" icon={<User size={11} />} />
          <MultiSelect label="Delivery" options={deliveryStatuses} selected={selectedDeliveryStatuses} onChange={setSelectedDeliveryStatuses} placeholder="All" icon={<Truck size={11} />} />
          <MultiSelect label="Pay Status" options={payStatuses} selected={selectedPayStatuses} onChange={setSelectedPayStatuses} placeholder="All" icon={<CreditCard size={11} />} />
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {dateFrom && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">From: {dateFrom}<button onClick={() => setDateFrom('')}><X size={9} /></button></span>}
            {dateTo && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">To: {dateTo}<button onClick={() => setDateTo('')}><X size={9} /></button></span>}
            {selectedBranches.map(b => <span key={b} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">📍 {b}<button onClick={() => setSelectedBranches(selectedBranches.filter(v => v !== b))}><X size={9} /></button></span>)}
            {selectedSalespersons.map(s => <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">{s}<button onClick={() => setSelectedSalespersons(selectedSalespersons.filter(v => v !== s))}><X size={9} /></button></span>)}
            {selectedDeliveryStatuses.map(d => <span key={d} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">{d}<button onClick={() => setSelectedDeliveryStatuses(selectedDeliveryStatuses.filter(v => v !== d))}><X size={9} /></button></span>)}
            {selectedPayStatuses.map(p => <span key={p} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">{p}<button onClick={() => setSelectedPayStatuses(selectedPayStatuses.filter(v => v !== p))}><X size={9} /></button></span>)}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Invoices', value: filteredData.length, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Invoice Total', value: formatCurrency(totals.invoiceTotal), color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Deductions', value: formatCurrency(totals.deductionCharges), color: 'text-red-600', bg: 'bg-white' },
          { label: 'Net Amount', value: formatCurrency(totals.netAmount), color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Paid', value: totals.paidCount, color: 'text-green-600', bg: 'bg-white' },
          { label: 'Unpaid', value: totals.unpaidCount, color: 'text-red-600', bg: 'bg-white' },
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
              Sales Analytics {selectedBranches.length > 0 ? `— ${selectedBranches.join(', ')}` : '(All Branches)'}
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={visualizationData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Net Amount by Branch</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={visualizationData.branchSales}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="branch" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net Amount']} />
                  <Bar dataKey="amount" radius={[4,4,0,0]}>
                    {visualizationData.branchSales.map((_, idx) => <Cell key={idx} fill={BRANCH_CHART_COLORS[idx % 3]} />)}
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
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="salesperson" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, 'Net']} />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Delivery Distribution</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={visualizationData.statusData} cx="50%" cy="50%" label={({ status, count }) => `${status}: ${count}`} outerRadius={80} dataKey="count" labelLine={false}>
                    {visualizationData.statusData.map((_, idx) => <Cell key={idx} fill={['#10b981','#3b82f6','#f59e0b','#ef4444'][idx % 4]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Status</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={visualizationData.payData} cx="50%" cy="50%" label={({ label, count }) => `${label}: ${count}`} outerRadius={80} dataKey="count" labelLine={false}>
                    {visualizationData.payData.map((_, idx) => <Cell key={idx} fill={['#10b981','#ef4444'][idx % 2]} />)}
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
              {selectedBranches.length > 0 && selectedBranches.map(b => (
                <span key={b} className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-semibold text-white ${BRANCH_BTN[b]}`}>{b}</span>
              ))}
            </h3>
          </div>
          <span className="text-xs text-gray-500">{filteredData.length} of {salesData.length} invoices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Invoice #', 'Client', 'Branch', 'Salesperson', 'Products', 'Invoice Total', 'Collection', 'Deduction', 'Net Amount', 'Delivery', 'Received', 'Pay Status', 'Payment'].map(h => (
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
                    <p className="text-xs mt-1">{hasActiveFilters ? 'No invoices match the selected filters' : 'Create invoices to see sales data'}</p>
                  </td>
                </tr>
              ) : filteredData.map(item => {
                const invoice = invoices.find(inv => inv.id === item.id);
                return (
                  <tr key={item.id} className="hover:bg-indigo-50/40 cursor-pointer transition-colors" onClick={() => invoice && setViewInvoice(invoice)}>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs">{item.date}</td>
                    <td className="px-3 py-2.5 font-mono text-[#4f46e5] whitespace-nowrap text-xs font-semibold">{item.invoiceNumber}</td>
                    <td className="px-3 py-2.5"><p className="font-medium text-gray-900">{item.clientName}</p><p className="text-xs text-gray-400">{item.phone}</p></td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.branch ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full
                          ${item.branch === 'Abu Dhabi' ? 'bg-blue-100 text-blue-700' : item.branch === 'Dubai' ? 'bg-emerald-100 text-emerald-700' : item.branch === 'Saudi Arabia' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          <Building2 size={10} />{item.branch}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                      {item.salespersonLocation && <p className="text-xs text-gray-400 mt-0.5">{item.salespersonLocation}</p>}
                    </td>
                    <td className="px-3 py-2.5"><p className="text-gray-800 text-xs">{item.salesperson}</p>{item.clientDealBy && <p className="text-xs text-gray-400">Deal: {item.clientDealBy}</p>}</td>
                    <td className="px-3 py-2.5 max-w-[160px]"><p className="text-gray-700 truncate text-xs" title={item.productSummary}>{item.productSummary}</p><p className="text-xs text-gray-400">{item.productCount} item(s)</p></td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap text-xs">Rs {item.invoiceTotal.toLocaleString()}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${item.collectionMethod === 'Self Collection' ? 'bg-green-100 text-green-800' : item.collectionMethod === 'TCS' ? 'bg-blue-100 text-blue-800' : item.collectionMethod === 'LCS' ? 'bg-yellow-100 text-yellow-800' : item.collectionMethod === 'Daewoo' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{item.collectionMethod}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-xs">{item.deductionCharges > 0 ? <span className="text-red-600 font-medium">- Rs {item.deductionCharges.toLocaleString()}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5] whitespace-nowrap text-xs">Rs {item.netAmount.toLocaleString()}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${item.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' : item.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' : item.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}`}>{item.deliveryStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.deliveryReceivedStatus ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${item.deliveryReceivedStatus === 'Received' ? 'bg-green-100 text-green-800' : item.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{item.deliveryReceivedStatus}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${item.payStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.payStatus}</span>
                      {item.paymentStatus === 'Partial' && <p className="text-xs text-orange-600 mt-0.5">Partial · Rs {item.paidAmount.toLocaleString()}</p>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {item.paymentMode ? (
                        <div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${item.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{item.paymentMode === 'Online' ? '🏦 Bank' : '💵 Cash'}</span>
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
                  <td colSpan={6} className="px-3 py-3 text-sm font-bold text-gray-900">TOTALS — {filteredData.length} invoices{selectedBranches.length > 0 ? ` · ${selectedBranches.join(', ')}` : ''}</td>
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
            {selectedBranches.length > 0 ? ` · ${selectedBranches.join(', ')}` : ' · All Branches'}
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
              {getInvoiceBranch(viewInvoice) && (
                <span className={`text-xs px-3 py-1 rounded-full font-semibold text-white ${BRANCH_BTN[getInvoiceBranch(viewInvoice)] ?? 'bg-gray-500'}`}>
                  📍 {getInvoiceBranch(viewInvoice)} Branch
                </span>
              )}
              <button onClick={() => setViewInvoice(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer & Invoice</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['Invoice #', viewInvoice.invoiceNumber], ['Date', new Date(viewInvoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })], ['Customer', viewInvoice.customerName], ['CNIC', viewInvoice.customerCNIC], ['Phone 1', viewInvoice.customerPhone], viewInvoice.customerPhone2 ? ['Phone 2', viewInvoice.customerPhone2] : null, viewInvoice.customerProvince ? ['Province', viewInvoice.customerProvince] : null, viewInvoice.customerCity ? ['Customer City', viewInvoice.customerCity] : null].filter(Boolean).map(([label, val]) => (
                    <div key={label as string}><p className="text-gray-400 text-xs">{label}</p><p className="font-medium text-gray-900">{val as string}</p></div>
                  ))}
                  {viewInvoice.customerAddress && (<div className="col-span-2"><p className="text-gray-400 text-xs">Address</p><p className="font-medium text-gray-900">{viewInvoice.customerAddress}</p></div>)}
                </div>
              </div>
              {(viewInvoice.salesperson || viewInvoice.salespersonLocation || viewInvoice.clientDealBy || viewInvoice.referralBy || viewInvoice.createdBy || viewInvoice.productLocation) && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 size={11} /> Branch & Sales Info</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.salesperson && <div><p className="text-gray-400 text-xs">Salesperson</p><p className="font-medium text-gray-900">{viewInvoice.salesperson}</p></div>}
                    {viewInvoice.salespersonLocation && <div><p className="text-gray-400 text-xs">Branch / Office</p><span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5 ${viewInvoice.salespersonLocation === 'Abu Dhabi' ? 'bg-blue-100 text-blue-700' : viewInvoice.salespersonLocation === 'Dubai' ? 'bg-emerald-100 text-emerald-700' : viewInvoice.salespersonLocation === 'Saudi Arabia' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}><Building2 size={10} />{viewInvoice.salespersonLocation}</span></div>}
                    {viewInvoice.productLocation && <div><p className="text-gray-400 text-xs">Product / Stock Location</p><p className="font-medium text-gray-900">{viewInvoice.productLocation}</p></div>}
                    {viewInvoice.clientDealBy && <div><p className="text-gray-400 text-xs">Client Deal By</p><p className="font-medium text-gray-900">{viewInvoice.clientDealBy}</p></div>}
                    {viewInvoice.referralBy && <div><p className="text-gray-400 text-xs">Referral By</p><p className="font-medium text-gray-900">{viewInvoice.referralBy}</p></div>}
                    {viewInvoice.createdBy && <div><p className="text-gray-400 text-xs">Created By</p><p className="font-medium text-gray-900">{viewInvoice.createdBy}</p></div>}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>{['Product', 'Qty', 'Serials', 'Total'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
                    <tbody>
                      {viewInvoice.products.map((product, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2.5"><p className="font-medium text-gray-900">{product.productName}</p>{product.brandName && <p className="text-xs text-gray-400">{product.brandName} · {product.modelName}</p>}</td>
                          <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{product.quantity} × {formatCurrency(product.price)}</td>
                          <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{(product.serialNumbers || []).map(s => <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">{s}</span>)}</div></td>
                          <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{formatCurrency(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs mb-1">Delivery Status</p><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${viewInvoice.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' : viewInvoice.deliveryStatus === 'Self-collect' ? 'bg-blue-100 text-blue-800' : viewInvoice.deliveryStatus === 'LCS' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}`}><Truck size={10} />{viewInvoice.deliveryStatus}</span></div>
                <div><p className="text-gray-400 text-xs mb-1">Received Status</p><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${viewInvoice.deliveryReceivedStatus === 'Received' ? 'bg-green-100 text-green-800' : viewInvoice.deliveryReceivedStatus === 'In Process' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{viewInvoice.deliveryReceivedStatus}</span></div>
                {viewInvoice.collectionMethod && <div><p className="text-gray-400 text-xs mb-1">Collection</p><span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{viewInvoice.collectionMethod}</span></div>}
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1"><CreditCard size={11} /> Payment Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-400 text-xs">Status</p><span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${viewInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{viewInvoice.status}</span></div>
                  {viewInvoice.paymentMode && <div><p className="text-gray-400 text-xs">Mode</p><p className="font-medium">{viewInvoice.paymentMode}</p></div>}
                  {viewInvoice.paymentStatus && <div><p className="text-gray-400 text-xs">Full / Partial</p><p className="font-medium">{viewInvoice.paymentStatus}</p></div>}
                  {viewInvoice.paymentStatus === 'Partial' && (<><div><p className="text-gray-400 text-xs">Paid</p><p className="font-medium text-green-700">{formatCurrency(viewInvoice.paidAmount || 0)}</p></div><div><p className="text-gray-400 text-xs">Remaining</p><p className="font-medium text-red-600">{formatCurrency(viewInvoice.remainingAmount || 0)}</p></div></>)}
                  {viewInvoice.paymentMode === 'Online' && viewInvoice.bankName && (<><div><p className="text-gray-400 text-xs">Bank</p><p className="font-medium">{viewInvoice.bankName}</p></div>{viewInvoice.bankAccountNumber && <div><p className="text-gray-400 text-xs">Account #</p><p className="font-mono text-xs">{viewInvoice.bankAccountNumber}</p></div>}</>)}
                  {viewInvoice.paidBy && <div><p className="text-gray-400 text-xs">Paid By</p><p className="font-medium">{viewInvoice.paidBy}</p></div>}
                  {viewInvoice.paidTo && <div><p className="text-gray-400 text-xs">Paid To</p><p className="font-medium">{viewInvoice.paidTo}</p></div>}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Invoice Total</span><span className="font-medium">{formatCurrency(viewInvoice.totalAmount)}</span></div>
                {(viewInvoice.deductionCharges || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Deduction</span><span className="text-red-600 font-medium">− {formatCurrency(viewInvoice.deductionCharges)}</span></div>}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2"><span className="text-base font-bold text-gray-900">Net Total</span><span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewInvoice.totalAmount - (viewInvoice.deductionCharges || 0))}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}