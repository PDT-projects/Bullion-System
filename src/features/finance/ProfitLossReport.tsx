// ProfitLossReport.tsx
// Reads 100% from real Firestore transactions passed as props.
// NO mock data. NO hardcoded figures.
//
// Classification priority per transaction:
//   1. plMainCategory + plSubCategory (manual override saved from form) → use directly
//   2. Auto-classify by subCategory string matching
//   3. null → excluded from P&L (loans / personal / financing)
//
// Only approved / not_required transactions affect P&L figures.
// pending_approval and rejected are excluded entirely.

import { useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, FileSpreadsheet, FileText,
  Calendar, ChevronDown, ChevronUp, Tag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── SubCategory lookup tables (must match Firestore exactly) ─────────────────

const INFLOW_PRODUCT_SALE = ['Product sale received'];
const INFLOW_SERVICE      = [
  'Payment received - Customers',
  'Payment received - Company',
  'TCS/DHL/LCS payment received',
  'Commission received',
];
const INFLOW_OTHER        = ['Other'];
const INFLOW_LOAN_CATS    = ['Loan received - From Employee', 'Loan received - From Company'];

const OUTFLOW_COGS        = ['Purchase'];
const OUTFLOW_SALARY      = ['Employee salary', 'Advance salary'];
const OUTFLOW_COMMISSION  = ['Commission paid - Employee', 'Commission paid - Dealer'];
const OUTFLOW_RENT        = ['Office Rent'];
const OUTFLOW_UTILITIES   = ['Electricity Bill', 'Gas Bill', 'Water Bill', 'Internet Bill', 'PTCL Bill', 'Cylinder payment'];
const OUTFLOW_LOGISTICS   = ['Courier', 'Bykea/delivery', 'Parcel received Payment', 'Petrol expense'];
const OUTFLOW_MARKETING   = ['Marketing/SEO/VPN'];
const OUTFLOW_OFFICE      = ['Kitchen Expense', 'Grocery Expense', 'Stationery Expense'];
const OUTFLOW_REPAIRS     = ['Repair payment', 'Medical/hospital bill'];
const OUTFLOW_PAYMENTS    = ['Payment to company', 'Payment to person'];
const OUTFLOW_PERSONAL    = ['Personal expense/Non business'];
const OUTFLOW_LOAN        = ['Loan paid to employee'];

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  date: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode?: string;
  company?: string;
  // Manual P&L classification — saved from transaction form to Firestore
  plMainCategory?: string;
  plSubCategory?: string;
  // Approval — pending/rejected have zero financial impact
  approvalStatus?: string;
};

type ProfitLossReportProps = {
  transactions: Transaction[];   // live Firestore data from parent
  onBack: () => void;
};

// ─── P&L bucket resolver ──────────────────────────────────────────────────────

type PLBucket = { plMain: string; plSub: string } | null;

function resolvePLBucket(t: Transaction): PLBucket {
  // Priority 1 — manual override from form (saved to Firestore)
  if (t.plMainCategory && t.plSubCategory) {
    return { plMain: t.plMainCategory, plSub: t.plSubCategory };
  }

  // Priority 2 — auto-classify by subCategory
  const sub = t.subCategory || '';

  if (t.mainCategory === 'Cash Inflow') {
    if (INFLOW_LOAN_CATS.includes(sub))    return null;
    if (INFLOW_PRODUCT_SALE.includes(sub)) return { plMain: 'Revenue', plSub: 'Product Sales' };
    if (INFLOW_SERVICE.includes(sub))      return { plMain: 'Revenue', plSub: 'Service / Invoice Sales' };
    if (INFLOW_OTHER.includes(sub))        return { plMain: 'Revenue', plSub: 'Other Income' };
    return                                        { plMain: 'Revenue', plSub: 'Other Income' };
  }

  if (t.mainCategory === 'Cash Outflow') {
    if (OUTFLOW_PERSONAL.includes(sub))    return null;
    if (OUTFLOW_LOAN.includes(sub))        return null;
    if (OUTFLOW_COGS.includes(sub))        return { plMain: 'Cost of Goods Sold (COGS)', plSub: 'Purchase & Inventory' };
    if (OUTFLOW_SALARY.includes(sub))      return { plMain: 'Operating Expenses', plSub: 'Salaries & Wages' };
    if (OUTFLOW_COMMISSION.includes(sub))  return { plMain: 'Operating Expenses', plSub: 'Salaries & Wages' };
    if (OUTFLOW_RENT.includes(sub))        return { plMain: 'Operating Expenses', plSub: 'Rent' };
    if (OUTFLOW_UTILITIES.includes(sub))   return { plMain: 'Operating Expenses', plSub: 'Utilities' };
    if (OUTFLOW_MARKETING.includes(sub))   return { plMain: 'Operating Expenses', plSub: 'Marketing' };
    if (OUTFLOW_LOGISTICS.includes(sub))   return { plMain: 'Operating Expenses', plSub: 'Miscellaneous' };
    if (OUTFLOW_OFFICE.includes(sub))      return { plMain: 'Operating Expenses', plSub: 'Miscellaneous' };
    if (OUTFLOW_REPAIRS.includes(sub))     return { plMain: 'Operating Expenses', plSub: 'Miscellaneous' };
    if (OUTFLOW_PAYMENTS.includes(sub))    return { plMain: 'Operating Expenses', plSub: 'Miscellaneous' };
    return                                        { plMain: 'Operating Expenses', plSub: 'Miscellaneous' };
  }

  // Loan mainCategory → financing, excluded from P&L
  return null;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);

function Row({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  if (value === 0 && !highlight) return null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-gray-700">{label}</span>
      <span className="font-medium text-gray-900">{fmt(value)}</span>
    </div>
  );
}

function SectionTotal({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className={`flex justify-between items-center py-3 px-3 rounded-lg mt-2 ${colorClass}`}>
      <span className="font-semibold text-gray-900">{label}</span>
      <span className="font-bold text-base text-gray-900">{fmt(value)}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfitLossReport({ transactions, onBack }: ProfitLossReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const today      = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const yearStart  = `${new Date().getFullYear()}-01-01`;

  // Default: All Time — shows every Firestore record immediately
  const [dateFrom,    setDateFrom]    = useState('2000-01-01');
  const [dateTo,      setDateTo]      = useState(today);
  const [showMonthly, setShowMonthly] = useState(false);
  const [showManual,  setShowManual]  = useState(false);

  // ── Step 1: filter by date + approval status ───────────────────────────────
  const filtered = useMemo(() => {
    const from = dateFrom || '2000-01-01';
    const to   = dateTo   || '2099-12-31';
    return transactions.filter(t => {
      // Normalise to YYYY-MM-DD regardless of Firestore format
      const d = (t.date || '').slice(0, 10);
      if (!d || d < from || d > to)                  return false;
      if (t.approvalStatus === 'pending_approval')   return false;
      if (t.approvalStatus === 'rejected')           return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  // ── Step 2: build bucket map plMain → plSub → total ───────────────────────
  const buckets = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const t of filtered) {
      const b = resolvePLBucket(t);
      if (!b) continue;
      if (!map.has(b.plMain)) map.set(b.plMain, new Map());
      const inner = map.get(b.plMain)!;
      inner.set(b.plSub, (inner.get(b.plSub) || 0) + (t.amount || 0));
    }
    return map;
  }, [filtered]);

  // ── Step 3: read helpers ───────────────────────────────────────────────────
  const sectionTotal = (main: string) => {
    const subs = buckets.get(main);
    if (!subs) return 0;
    let n = 0;
    subs.forEach(v => { n += v; });
    return n;
  };

  const sectionRows = (main: string): [string, number][] => {
    const subs = buckets.get(main);
    if (!subs) return [];
    return Array.from(subs.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  };

  // ── Step 4: P&L figures ────────────────────────────────────────────────────
  const totalRevenue  = sectionTotal('Revenue');
  const totalCOGS     = sectionTotal('Cost of Goods Sold (COGS)');
  const grossProfit   = totalRevenue - totalCOGS;
  const totalExpenses = sectionTotal('Operating Expenses');
  const netProfit     = grossProfit - totalExpenses;
  const isProfit      = netProfit >= 0;

  // ── Financing / excluded items (informational only) ────────────────────────
  const financing = useMemo(() => {
    let loanIn = 0, loanOut = 0, personal = 0, otherLoan = 0;
    for (const t of filtered) {
      if (resolvePLBucket(t)) continue;
      const sub = t.subCategory || '';
      if (INFLOW_LOAN_CATS.includes(sub))  loanIn    += t.amount || 0;
      if (OUTFLOW_LOAN.includes(sub))      loanOut   += t.amount || 0;
      if (OUTFLOW_PERSONAL.includes(sub))  personal  += t.amount || 0;
      if (t.mainCategory === 'Loan')       otherLoan += t.amount || 0;
    }
    return { loanIn, loanOut, personal, otherLoan };
  }, [filtered]);

  // ── Manually classified transactions ──────────────────────────────────────
  const manualTxns = useMemo(
    () => filtered.filter(t => t.plMainCategory && t.plSubCategory),
    [filtered]
  );

  // ── Monthly breakdown ──────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = new Map<string, { revenue: number; cogs: number; expenses: number }>();
    for (const t of filtered) {
      const key = new Date((t.date || '').slice(0, 10) + 'T00:00:00')
        .toLocaleDateString('en-PK', { year: 'numeric', month: 'short' });
      if (!map.has(key)) map.set(key, { revenue: 0, cogs: 0, expenses: 0 });
      const e = map.get(key)!;
      const b = resolvePLBucket(t);
      if (!b) continue;
      if (b.plMain === 'Revenue')                        e.revenue  += t.amount || 0;
      else if (b.plMain === 'Cost of Goods Sold (COGS)') e.cogs     += t.amount || 0;
      else if (b.plMain === 'Operating Expenses')        e.expenses += t.amount || 0;
    }
    return Array.from(map.entries())
      .map(([month, v]) => ({ month, ...v, netProfit: v.revenue - v.cogs - v.expenses }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filtered]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Profit & Loss Report', `${dateFrom} to ${dateTo}`],
      ['Generated', new Date().toLocaleString('en-PK')],
      [],
      ['REVENUE'],
    ];
    sectionRows('Revenue').forEach(([s, v]) => rows.push(['', s, v]));
    rows.push(['', 'Total Revenue', totalRevenue], []);
    rows.push(['COST OF GOODS SOLD (COGS)']);
    sectionRows('Cost of Goods Sold (COGS)').forEach(([s, v]) => rows.push(['', s, v]));
    rows.push(['', 'Total COGS', totalCOGS], []);
    rows.push(['GROSS PROFIT', '', grossProfit], []);
    rows.push(['OPERATING EXPENSES']);
    sectionRows('Operating Expenses').forEach(([s, v]) => rows.push(['', s, v]));
    rows.push(['', 'Total Expenses', totalExpenses], []);
    rows.push(['NET PROFIT / LOSS', '', netProfit], []);
    if (monthlyData.length > 0) {
      rows.push(['MONTHLY BREAKDOWN']);
      rows.push(['Month', 'Revenue', 'COGS', 'Expenses', 'Net Profit']);
      monthlyData.forEach(m => rows.push([m.month, m.revenue, m.cogs, m.expenses, m.netProfit]));
    }
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
      href: url, download: `profit-loss-${dateFrom}-${dateTo}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const el = reportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const pdf    = new jsPDF('p', 'mm', 'a4');
    const w = 210;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
    pdf.save(`profit-loss-${dateFrom}-${dateTo}.pdf`);
  };

  // ── Quick-filter button helpers ────────────────────────────────────────────
  const quickBtnClass = (from: string, to: string) =>
    `px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
      dateFrom === from && dateTo === to
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    }`;

  const revenueRows  = sectionRows('Revenue');
  const cogsRows     = sectionRows('Cost of Goods Sold (COGS)');
  const expenseRows  = sectionRows('Operating Expenses');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filtered.length} approved transactions · {dateFrom} → {dateTo}
            {manualTxns.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
                <Tag size={12} /> {manualTxns.length} manually classified
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm">
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm">
            <FileText size={15} /> Export PDF
          </button>
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </div>

      {/* ── Date range picker ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Date Range</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button className={quickBtnClass(monthStart, today)}
            onClick={() => { setDateFrom(monthStart); setDateTo(today); }}>
            This Month
          </button>
          <button className={quickBtnClass(yearStart, today)}
            onClick={() => { setDateFrom(yearStart); setDateTo(today); }}>
            This Year
          </button>
          <button className={quickBtnClass('2000-01-01', today)}
            onClick={() => { setDateFrom('2000-01-01'); setDateTo(today); }}>
            All Time
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue',  value: totalRevenue,  color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Total Expenses', value: totalExpenses, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
          {
            label: isProfit ? 'Net Profit' : 'Net Loss',
            value: netProfit,
            color:  isProfit ? 'text-blue-600'  : 'text-red-600',
            bg:     isProfit ? 'bg-blue-50'     : 'bg-red-50',
            border: isProfit ? 'border-blue-200': 'border-red-200',
          },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-5 text-center`}>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* ── Full P&L Statement ── */}
      <div ref={reportRef} className="space-y-5">

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Revenue{' '}
            <span className="text-sm font-normal text-gray-400">
              ({filtered.filter(t => resolvePLBucket(t)?.plMain === 'Revenue').length} transactions)
            </span>
          </h2>
          {revenueRows.length === 0
            ? <p className="text-sm text-gray-400 py-2">No revenue in this period.</p>
            : <div className="space-y-1">
                {revenueRows.map(([sub, val]) => <Row key={sub} label={sub} value={val} />)}
              </div>
          }
          <SectionTotal label="Total Revenue" value={totalRevenue} colorClass="bg-green-50" />
        </div>

        {/* COGS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Cost of Goods Sold (COGS)
          </h2>
          {cogsRows.length === 0
            ? <p className="text-sm text-gray-400 py-2">No COGS in this period.</p>
            : <div className="space-y-1">
                {cogsRows.map(([sub, val]) => <Row key={sub} label={sub} value={val} />)}
              </div>
          }
          <SectionTotal label="Total COGS" value={totalCOGS} colorClass="bg-orange-50" />
        </div>

        {/* Gross Profit */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          grossProfit >= 0
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gross Profit</h2>
              <p className="text-sm text-gray-500">Revenue − COGS</p>
            </div>
            <span className={`font-bold text-2xl ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(grossProfit)}
            </span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Operating Expenses{' '}
            <span className="text-sm font-normal text-gray-400">
              ({filtered.filter(t => resolvePLBucket(t)?.plMain === 'Operating Expenses').length} transactions)
            </span>
          </h2>
          {expenseRows.length === 0
            ? <p className="text-sm text-gray-400 py-2">No expenses in this period.</p>
            : <div className="space-y-1">
                {expenseRows.map(([sub, val]) => <Row key={sub} label={sub} value={val} />)}
              </div>
          }
          <SectionTotal label="Total Operating Expenses" value={totalExpenses} colorClass="bg-red-50" />
        </div>

        {/* Net Profit / Loss */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          isProfit
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Net {isProfit ? 'Profit' : 'Loss'}</h2>
              <p className="text-sm text-gray-500">Gross Profit − Operating Expenses</p>
            </div>
            <span className={`font-bold text-3xl ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
              {fmt(netProfit)}
            </span>
          </div>
        </div>

        {/* Financing & Non-Business (informational) */}
        {(financing.loanIn > 0 || financing.loanOut > 0 || financing.personal > 0 || financing.otherLoan > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 pb-2 border-b border-gray-200">
              Financing & Non-Business{' '}
              <span className="text-xs font-normal text-gray-400">(excluded from P&L)</span>
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Recorded but do not affect operational profit.
            </p>
            <div className="space-y-1">
              {financing.loanIn    > 0 && <Row label="Loans Received (inflow)"          value={financing.loanIn}    highlight />}
              {financing.otherLoan > 0 && <Row label="Other Loan Transactions"           value={financing.otherLoan} highlight />}
              {financing.loanOut   > 0 && <Row label="Loans Paid Out"                   value={financing.loanOut}   highlight />}
              {financing.personal  > 0 && <Row label="Personal / Non-Business Expenses" value={financing.personal}  highlight />}
            </div>
          </div>
        )}

        {/* Manual classification audit panel */}
        {manualTxns.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
            <button
              onClick={() => setShowManual(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">
                  Manually P&L-Classified Transactions
                </h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {manualTxns.length}
                </span>
              </div>
              {showManual
                ? <ChevronUp size={20} className="text-gray-500" />
                : <ChevronDown size={20} className="text-gray-500" />
              }
            </button>
            {showManual && (
              <div className="overflow-x-auto border-t border-indigo-100">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-50">
                    <tr>
                      {['Date', 'Company', 'Sub Category', 'P&L Category', 'P&L Sub-Category', 'Amount'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {manualTxns.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{(t.date || '').slice(0, 10)}</td>
                        <td className="px-4 py-3 text-gray-700">{t.company || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{t.subCategory}</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                            {t.plMainCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{t.plSubCategory}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{fmt(t.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Monthly Breakdown ── */}
      {monthlyData.length >= 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowMonthly(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-bold text-gray-900">Monthly Breakdown</h2>
            {showMonthly
              ? <ChevronUp size={20} className="text-gray-500" />
              : <ChevronDown size={20} className="text-gray-500" />
            }
          </button>
          {showMonthly && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-t border-b border-gray-200">
                  <tr>
                    {['Month', 'Revenue', 'COGS', 'Expenses', 'Net Profit'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyData.map(m => (
                    <tr key={m.month} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{m.month}</td>
                      <td className="px-5 py-3 text-green-700">{fmt(m.revenue)}</td>
                      <td className="px-5 py-3 text-orange-700">{fmt(m.cogs)}</td>
                      <td className="px-5 py-3 text-red-700">{fmt(m.expenses)}</td>
                      <td className={`px-5 py-3 font-semibold ${m.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {fmt(m.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-5 py-3 font-bold text-green-700">{fmt(totalRevenue)}</td>
                    <td className="px-5 py-3 font-bold text-orange-700">{fmt(totalCOGS)}</td>
                    <td className="px-5 py-3 font-bold text-red-700">{fmt(totalExpenses)}</td>
                    <td className={`px-5 py-3 font-bold ${isProfit ? 'text-blue-700' : 'text-red-700'}`}>
                      {fmt(netProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}