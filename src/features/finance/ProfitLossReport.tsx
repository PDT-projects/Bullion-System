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

import React, { useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, FileSpreadsheet, FileText,
  Calendar, ChevronDown, ChevronUp, Tag, Filter, X, MapPin, ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { getTransactionTotals } from '../../modules/transactions/models/transactionsService';
import { CurrencyCode, useCurrencyRates, convertFromPKR, fmtCurrency } from './currencyUtils';
import { CurrencyDropdown, CurrencyRows } from './CurrencyPicker';

// ─── SubCategory lookup tables (must match Firestore exactly) ─────────────────

// Loan inflows — excluded from P&L revenue
const INFLOW_LOAN_CATS  = ['Loan received - From Employee', 'Loan received - From Company'];

// COGS: 'Purchase' = manual entry, 'Inventory Purchase' = auto from transactionBridgeService
const OUTFLOW_COGS      = ['Purchase', 'Inventory Purchase'];
const OUTFLOW_SALARY    = ['Employee salary', 'Advance salary'];
const OUTFLOW_COMMISSION= ['Commission paid - Employee', 'Commission paid - Dealer'];
const OUTFLOW_RENT      = ['Office Rent'];
const OUTFLOW_UTILITIES = ['Electricity Bill', 'Gas Bill', 'Water Bill', 'Internet Bill', 'PTCL Bill', 'Cylinder payment'];
const OUTFLOW_LOGISTICS = ['Courier', 'Bykea/delivery', 'Parcel received Payment', 'Petrol expense'];
const OUTFLOW_MARKETING = ['Marketing/SEO/VPN'];
const OUTFLOW_OFFICE    = ['Kitchen Expense', 'Grocery Expense', 'Stationery Expense'];
const OUTFLOW_REPAIRS   = ['Repair payment', 'Medical/hospital bill'];
const OUTFLOW_PAYMENTS  = ['Payment to company', 'Payment to person'];   // balance sheet only
const OUTFLOW_PERSONAL  = ['Personal expense/Non business'];              // excluded from P&L
const OUTFLOW_LOAN      = ['Loan paid to employee'];                      // financing, excluded

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  date: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode?: string;
  company?: string;
  location?: string;
  branch?: string;
  city?: string;
  plMainCategory?: string;
  plSubCategory?: string;
  approvalStatus?: string;
};

// Minimal Invoice shape — only fields used by P&L
type Invoice = {
  id: string;
  date: string;
  totalAmount: number;
  deductionCharges?: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;  // primary location field from Firestore
  branchOffice?: string;
  customerCity?: string;
};

type ProfitLossReportProps = {
  transactions: Transaction[];   // Finance cash-flow transactions
  invoices?: Invoice[];          // Sales invoices (source of Revenue)
  onBack: () => void;
};

// ─── P&L bucket resolver (outflows only — Revenue comes from Invoices) ────────

type PLBucket = { plMain: string; plSub: string } | null;

function resolvePLBucket(t: Transaction): PLBucket {
  // Priority 1 — manual override saved from the transaction form
  if (t.plMainCategory && t.plSubCategory) {
    return { plMain: t.plMainCategory, plSub: t.plSubCategory };
  }

  // Cash Inflow transactions are NOT counted as P&L revenue here.
  // Revenue is derived exclusively from Invoices (see invoiceRevenue below).
  // Cash inflows are shown in the "Cash Collections" informational section only.
  if (t.mainCategory === 'Cash Inflow') return null;

  // Loan mainCategory → financing only
  if (t.mainCategory === 'Loan') return null;

  // ── Cash Outflow classification ───────────────────────────────────────────
  if (t.mainCategory === 'Cash Outflow') {
    const sub = t.subCategory || '';

    // Non-P&L outflows (balance sheet / financing)
    if (OUTFLOW_PERSONAL.includes(sub)) return null;
    if (OUTFLOW_LOAN.includes(sub))     return null;
    if (OUTFLOW_PAYMENTS.includes(sub)) return null;   // inter-company settlements

    // COGS
    if (OUTFLOW_COGS.includes(sub))       return { plMain: 'Cost of Goods Sold (COGS)', plSub: 'Purchase & Inventory' };

    // Operating Expenses — each gets its own sub-category for clear reporting
    if (OUTFLOW_SALARY.includes(sub))     return { plMain: 'Operating Expenses', plSub: 'Salaries & Wages' };
    if (OUTFLOW_COMMISSION.includes(sub)) return { plMain: 'Operating Expenses', plSub: 'Commissions' };
    if (OUTFLOW_RENT.includes(sub))       return { plMain: 'Operating Expenses', plSub: 'Rent' };
    if (OUTFLOW_UTILITIES.includes(sub))  return { plMain: 'Operating Expenses', plSub: 'Utilities' };
    if (OUTFLOW_MARKETING.includes(sub))  return { plMain: 'Operating Expenses', plSub: 'Marketing' };
    if (OUTFLOW_LOGISTICS.includes(sub))  return { plMain: 'Operating Expenses', plSub: 'Logistics' };
    if (OUTFLOW_OFFICE.includes(sub))     return { plMain: 'Operating Expenses', plSub: 'Office Expenses' };
    if (OUTFLOW_REPAIRS.includes(sub))    return { plMain: 'Operating Expenses', plSub: 'Repairs & Medical' };

    // Unknown outflow sub-categories → excluded, not silently inflating expenses
    return null;
  }

  return null;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

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

export function ProfitLossReport({ transactions, invoices = [], onBack }: ProfitLossReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('AED');
  const [extraCurrencies, setExtraCurrencies]   = useState<CurrencyCode[]>([]);
  const { rates, loading: ratesLoading, error: ratesError, lastUpdated } = useCurrencyRates();
  const displayCurrencyCodes = [primaryCurrency, ...extraCurrencies];

  const fmtPrimary = (value: number) => fmtCurrency(convertFromPKR(value, primaryCurrency, rates), primaryCurrency);

  const today    = new Date().toISOString().split('T')[0];
  const thisYear = new Date().getFullYear();

  // ── Filter state ──────────────────────────────────────────────────────────
  type FilterMode = 'alltime' | 'yearly' | 'monthly' | 'custom';
  const [filterMode,      setFilterMode]      = useState<FilterMode>('alltime');
  const [selectedYears,   setSelectedYears]   = useState<number[]>([]);
  const [selectedMonths,  setSelectedMonths]  = useState<string[]>([]);
  const [customFrom,      setCustomFrom]      = useState('');
  const [customTo,        setCustomTo]        = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showMonthly, setShowMonthly] = useState(false);
  const [showManual,  setShowManual]  = useState(false);

  const getTransactionLocation = (t: Transaction): string => {
    const loc = t.location || t.branch || t.city || '';
    if (loc.includes('Dubai'))         return 'Dubai';
    if (loc.includes('Saudi Arabia'))  return 'Saudi Arabia';
    if (loc.includes('Chad'))          return 'Chad';
    const c = t.company || '';
    if (c.includes('Dubai'))         return 'Dubai';
    if (c.includes('Saudi Arabia'))  return 'Saudi Arabia';
    if (c.includes('Chad'))          return 'Chad';
    if (c.includes('Abu Dhabi'))     return 'Abu Dhabi';
    if (c.includes('Sharjah'))       return 'Sharjah';
    if (c.includes('Oman'))          return 'Oman';
    if (c.includes('Qatar'))         return 'Qatar';
    if (c.includes('Kuwait'))        return 'Kuwait';
    return '';
  };

  // Invoice location: check branchOffice → salesperson location → customerCity
  const getInvoiceLocation = (inv: Invoice): string => {
    const b = inv.branchOffice || inv.salespersonLocation || inv.salesperson || inv.customerCity || '';
    if (b.includes('Dubai'))         return 'Dubai';
    if (b.includes('Saudi Arabia'))  return 'Saudi Arabia';
    if (b.includes('Chad'))          return 'Chad';
    if (b.includes('Abu Dhabi'))     return 'Abu Dhabi';
    if (b.includes('Sharjah'))       return 'Sharjah';
    if (b.includes('Oman'))          return 'Oman';
    if (b.includes('Qatar'))         return 'Qatar';
    if (b.includes('Kuwait'))        return 'Kuwait';
    return '';
  };
  const LOCATIONS = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const l = getTransactionLocation(t); if (l) s.add(l); });
    invoices.forEach(inv => { const l = getInvoiceLocation(inv); if (l) s.add(l); });
    return ['Dubai','Saudi Arabia','Chad','Abu Dhabi','Sharjah','Oman','Qatar','Kuwait'].filter(l => s.has(l));
  }, [transactions, invoices]);
  // Derive available years and months from transaction data
  const availableYears = useMemo(() => {
    const s = new Set<number>();
    transactions.forEach(t => {
      const y = parseInt((t.date || '').slice(0, 4));
      if (y > 2000 && y <= thisYear + 1) s.add(y);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const ym = (t.date || '').slice(0, 7); if (ym) s.add(ym); });
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Derived dateFrom / dateTo from filter mode
  const { dateFrom, dateTo } = useMemo(() => {
    if (filterMode === 'alltime') return { dateFrom: '2000-01-01', dateTo: today };
    if (filterMode === 'custom')  return { dateFrom: customFrom || '2000-01-01', dateTo: customTo || today };
    if (filterMode === 'yearly' && selectedYears.length > 0) {
      const minY = Math.min(...selectedYears);
      const maxY = Math.max(...selectedYears);
      return { dateFrom: `${minY}-01-01`, dateTo: `${maxY}-12-31` };
    }
    if (filterMode === 'monthly' && selectedMonths.length > 0) {
      const sorted = [...selectedMonths].sort();
      const [lastY, lastM] = sorted[sorted.length - 1].split('-').map(Number);
      const lastDay = new Date(lastY, lastM, 0).getDate();
      return { dateFrom: `${sorted[0]}-01`, dateTo: `${sorted[sorted.length - 1]}-${String(lastDay).padStart(2, '0')}` };
    }
    return { dateFrom: '2000-01-01', dateTo: today };
  }, [filterMode, selectedYears, selectedMonths, customFrom, customTo, today]);

  const hasActiveDateFilter = filterMode !== 'alltime';
  const hasActiveFilter = hasActiveDateFilter || selectedLocations.length > 0;

  const resetFilters = () => {
    setFilterMode('alltime');
    setSelectedYears([]);
    setSelectedMonths([]);
    setCustomFrom('');
    setCustomTo('');
    setSelectedLocations([]);
  };

  const toggleYear     = (y: number) => setSelectedYears(p => p.includes(y) ? p.filter(v => v !== y) : [...p, y]);
  const toggleMonth    = (m: string) => setSelectedMonths(p => p.includes(m) ? p.filter(v => v !== m) : [...p, m]);
  const toggleLocation = (l: string) => setSelectedLocations(p => p.includes(l) ? p.filter(v => v !== l) : [...p, l]);

  const modeBtnStyle = (mode: FilterMode): React.CSSProperties => ({
    padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px',
    border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
    background: filterMode === mode ? '#1e293b' : '#ffffff',
    color: filterMode === mode ? '#ffffff' : '#4b5563',
    borderColor: filterMode === mode ? '#1e293b' : '#d1d5db',
    boxShadow: filterMode === mode ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
  });

  // ── Step 1: filter by date + location + approval status ───────────────────
  const filtered = useMemo(() => {
    const from = dateFrom || '2000-01-01';
    const to   = dateTo   || '2099-12-31';
    return transactions.filter(t => {
      const d = (t.date || '').slice(0, 10);
      if (!d) return false;

      // Date filtering
      if (filterMode === 'monthly' && selectedMonths.length > 0) {
        if (!selectedMonths.some(ym => d.startsWith(ym))) return false;
      } else if (filterMode === 'yearly' && selectedYears.length > 0) {
        if (!selectedYears.includes(parseInt(d.slice(0, 4)))) return false;
      } else {
        if (d < from || d > to) return false;
      }

      // Location filtering
      if (selectedLocations.length > 0) {
        const loc = getTransactionLocation(t);
        if (!selectedLocations.includes(loc)) return false;
      }

      if (t.approvalStatus === 'pending_approval') return false;
      if (t.approvalStatus === 'rejected')         return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo, filterMode, selectedMonths, selectedYears, selectedLocations]);

  // ── Filter invoices by the same date + location criteria ──────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const d = (inv.date || '').slice(0, 10);
      if (!d) return false;

      // Date filtering (same logic as transactions)
      if (filterMode === 'monthly' && selectedMonths.length > 0) {
        if (!selectedMonths.some(ym => d.startsWith(ym))) return false;
      } else if (filterMode === 'yearly' && selectedYears.length > 0) {
        if (!selectedYears.includes(parseInt(d.slice(0, 4)))) return false;
      } else {
        const from = dateFrom || '2000-01-01';
        const to   = dateTo   || '2099-12-31';
        if (d < from || d > to) return false;
      }

      // Location filtering
      if (selectedLocations.length > 0) {
        if (!selectedLocations.includes(getInvoiceLocation(inv))) return false;
      }

      return true;
    });
  }, [invoices, dateFrom, dateTo, filterMode, selectedMonths, selectedYears, selectedLocations]);

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

  // Revenue = sum of invoice totalAmount (the actual sales value, not cash collected)
  // Broken down by Paid vs Unpaid for visibility
  const invoiceRevenuePaid   = filteredInvoices.filter(i => i.status === 'Paid')
    .reduce((s, i) => s + i.totalAmount, 0);
  const invoiceRevenueUnpaid = filteredInvoices.filter(i => i.status === 'Unpaid')
    .reduce((s, i) => s + i.totalAmount, 0);
  const totalDeductionCharges = filteredInvoices
    .reduce((s, i) => s + (i.deductionCharges || 0), 0);
  const totalRevenue = invoiceRevenuePaid + invoiceRevenueUnpaid;

  // COGS and OpEx come from approved outflow transactions
  const totalCOGS     = sectionTotal('Cost of Goods Sold (COGS)');
  const grossProfit   = totalRevenue - totalCOGS;
  const totalExpenses = sectionTotal('Operating Expenses');
  const netProfit     = grossProfit - totalExpenses;
  const isProfit      = netProfit >= 0;

  const currencyMetrics = useMemo(() => displayCurrencyCodes.map(code => ({
    code,
    revenue: convertFromPKR(totalRevenue, code, rates),
    grossProfit: convertFromPKR(grossProfit, code, rates),
    netProfit: convertFromPKR(netProfit, code, rates),
  })), [rates, displayCurrencyCodes, totalRevenue, grossProfit, netProfit]);

  // Cash collections from transactions (informational — not counted in Revenue)
  const cashCollected = filtered
    .filter(t => t.mainCategory === 'Cash Inflow' && !INFLOW_LOAN_CATS.includes(t.subCategory || ''))
    .reduce((s, t) => s + getTransactionTotals(t).totalPaid, 0);

  // ── Financing / excluded items (informational only) ────────────────────────
  const financing = useMemo(() => {
    let loanIn = 0, loanOut = 0, personal = 0, payments = 0;
    for (const t of filtered) {
      const sub = t.subCategory || '';
      if (t.mainCategory === 'Loan')       loanIn   += t.amount || 0;
      if (INFLOW_LOAN_CATS.includes(sub))  loanIn   += t.amount || 0;
      if (OUTFLOW_LOAN.includes(sub))      loanOut  += t.amount || 0;
      if (OUTFLOW_PERSONAL.includes(sub))  personal += t.amount || 0;
      if (OUTFLOW_PAYMENTS.includes(sub))  payments += t.amount || 0;
    }
    return { loanIn, loanOut, personal, payments };
  }, [filtered]);

  // ── Manually classified transactions ──────────────────────────────────────
  const manualTxns = useMemo(
    () => filtered.filter(t => t.plMainCategory && t.plSubCategory),
    [filtered]
  );

  // ── Monthly breakdown ──────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = new Map<string, { revenue: number; cogs: number; expenses: number }>();

    // Revenue from invoices by month
    for (const inv of filteredInvoices) {
      const key = new Date((inv.date || '').slice(0, 10) + 'T00:00:00')
        .toLocaleDateString('en-AE', { year: 'numeric', month: 'short' });
      if (!map.has(key)) map.set(key, { revenue: 0, cogs: 0, expenses: 0 });
      map.get(key)!.revenue += inv.totalAmount;
    }

    // COGS + OpEx from transactions by month
    for (const t of filtered) {
      const b = resolvePLBucket(t);
      if (!b) continue;
      const key = new Date((t.date || '').slice(0, 10) + 'T00:00:00')
        .toLocaleDateString('en-AE', { year: 'numeric', month: 'short' });
      if (!map.has(key)) map.set(key, { revenue: 0, cogs: 0, expenses: 0 });
      const e = map.get(key)!;
      if (b.plMain === 'Cost of Goods Sold (COGS)') e.cogs     += t.amount || 0;
      else if (b.plMain === 'Operating Expenses')   e.expenses += t.amount || 0;
    }

    return Array.from(map.entries())
      .map(([month, v]) => ({ month, ...v, netProfit: v.revenue - v.cogs - v.expenses }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filtered, filteredInvoices]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Profit & Loss Report', `${dateFrom} to ${dateTo}`],
      ['Generated', new Date().toLocaleString('en-AE')],
      [],
      ['REVENUE (from Invoices)'],
    ];
    if (invoiceRevenuePaid > 0)   rows.push(['', `Product Sales (Paid, ${filteredInvoices.filter(i=>i.status==='Paid').length} invoices)`, invoiceRevenuePaid]);
    if (invoiceRevenueUnpaid > 0) rows.push(['', `Product Sales (Unpaid, ${filteredInvoices.filter(i=>i.status==='Unpaid').length} invoices)`, invoiceRevenueUnpaid]);
    if (totalDeductionCharges > 0) rows.push(['', 'Deduction Charges', -totalDeductionCharges]);
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
  const handleExportPDF = () => {
    const pdf  = new jsPDF('p', 'mm', 'a4');
    const PW   = 210;   // page width  (A4)
    const PH   = 297;   // page height (A4)
    const ML   = 14;    // margin left
    const MR   = 14;    // margin right
    const CW   = PW - ML - MR;  // content width
    let   y    = 0;

    // ── colours ──────────────────────────────────────────────────────────────
    const C = {
      indigo:     [30,  41,  59] as [number,number,number],
      green:      [22,  163, 74]  as [number,number,number],
      red:        [220, 38,  38]  as [number,number,number],
      orange:     [234, 88,  12]  as [number,number,number],
      gray9:      [17,  24,  39]  as [number,number,number],
      gray6:      [75,  85,  99]  as [number,number,number],
      gray2:      [229, 231, 235] as [number,number,number],
      grayBg:     [249, 250, 251] as [number,number,number],
      white:      [255, 255, 255] as [number,number,number],
      indigoBg:   [241, 245, 249] as [number,number,number],
      greenBg:    [240, 253, 244] as [number,number,number],
      redBg:      [254, 242, 242] as [number,number,number],
    };

    // ── helpers ───────────────────────────────────────────────────────────────
    const money = (n: number) =>
      new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

    const checkPage = (needed = 10) => {
      if (y + needed > PH - 12) { pdf.addPage(); y = 18; }
    };

    const drawLine = (color = C.gray2) => {
      pdf.setDrawColor(...color);
      pdf.setLineWidth(0.3);
      pdf.line(ML, y, PW - MR, y);
      y += 3;
    };

    const row = (
      label: string,
      value: string,
      labelColor = C.gray6,
      valueColor = C.gray9,
      bold = false,
    ) => {
      checkPage(8);
      pdf.setFontSize(9);
      pdf.setTextColor(...labelColor);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.text(label, ML + 4, y);
      pdf.setTextColor(...valueColor);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.text(value, PW - MR - 4, y, { align: 'right' });
      y += 6;
    };

    const sectionHeader = (title: string, bgColor: [number,number,number]) => {
      checkPage(14);
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(ML, y - 1, CW, 10, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.gray9);
      pdf.text(title, ML + 4, y + 6);
      y += 13;
    };

    const totalRow = (label: string, value: string, bgColor: [number,number,number], valueColor = C.gray9) => {
      checkPage(12);
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(ML, y - 1, CW, 10, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.gray9);
      pdf.text(label, ML + 4, y + 6);
      pdf.setTextColor(...valueColor);
      pdf.text(value, PW - MR - 4, y + 6, { align: 'right' });
      y += 14;
    };

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1 — HEADER
    // ════════════════════════════════════════════════════════════════════════
    y = 18;

    // Title bar
    pdf.setFillColor(...C.indigo);
    pdf.rect(0, 0, PW, 14, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.white);
    pdf.text('Profit & Loss Report', ML, 9.5);

    // Company / period sub-line
    const periodStr = filterMode === 'alltime' ? 'All Time'
      : filterMode === 'yearly'  && selectedYears.length  ? selectedYears.sort().join(', ')
      : filterMode === 'monthly' && selectedMonths.length ? `${selectedMonths.length} month(s)`
      : filterMode === 'custom'  ? `${customFrom || '—'} → ${customTo || '—'}`
      : 'All Time';

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Period: ${periodStr}   |   Generated: ${new Date().toLocaleDateString('en-AE', { dateStyle: 'medium' })}`,
      PW - MR, 9.5, { align: 'right' }
    );

    // Location tag
    if (selectedLocations.length > 0) {
      pdf.setFontSize(7.5);
      pdf.text(`Locations: ${selectedLocations.join(', ')}`, PW - MR, 13, { align: 'right' });
    }

    y = 22;

    // ── Summary KPI row ───────────────────────────────────────────────────
    const kpis = [
      { label: 'Total Revenue', value: money(totalRevenue),  color: C.greenBg,  text: C.green  },
      { label: 'Total COGS',    value: money(totalCOGS),     color: C.grayBg,   text: C.orange },
      { label: 'Gross Profit',  value: money(grossProfit),   color: C.indigoBg, text: C.indigo },
      { label: 'Net ' + (isProfit ? 'Profit' : 'Loss'), value: money(netProfit), color: isProfit ? C.indigoBg : C.redBg, text: isProfit ? C.indigo : C.red },
    ];
    const kW = CW / kpis.length - 2;
    kpis.forEach((k, i) => {
      const x = ML + i * (kW + 2.67);
      pdf.setFillColor(...k.color);
      pdf.roundedRect(x, y, kW, 18, 2, 2, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.gray6);
      pdf.text(k.label, x + kW / 2, y + 5.5, { align: 'center' });
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...k.text);
      pdf.text(k.value, x + kW / 2, y + 13, { align: 'center' });
    });
    y += 23;

    // ════════════════════════════════════════════════════════════════════════
    // REVENUE
    // ════════════════════════════════════════════════════════════════════════
    sectionHeader('Revenue (from Invoices)', C.greenBg);

    const paidCount   = filteredInvoices.filter(i => i.status === 'Paid').length;
    const unpaidCount = filteredInvoices.filter(i => i.status === 'Unpaid').length;
    if (invoiceRevenuePaid   > 0) row(`Product Sales — Paid (${paidCount} invoices)`,   money(invoiceRevenuePaid),   C.gray6, C.green);
    if (invoiceRevenueUnpaid > 0) row(`Product Sales — Unpaid (${unpaidCount} invoices)`, money(invoiceRevenueUnpaid), C.gray6, C.orange);
    if (totalDeductionCharges > 0) row('Deduction Charges',  '-' + money(totalDeductionCharges), C.gray6, C.red);
    drawLine(C.gray2);
    totalRow('Total Revenue', money(totalRevenue), C.greenBg, C.green);

    // ════════════════════════════════════════════════════════════════════════
    // COGS
    // ════════════════════════════════════════════════════════════════════════
    if (totalCOGS > 0 || cogsRows.length > 0) {
      sectionHeader('Cost of Goods Sold (COGS)', C.grayBg);
      cogsRows.forEach(([sub, val]) => row(sub, money(val)));
      if (cogsRows.length === 0) {
        checkPage(8);
        pdf.setFontSize(8.5); pdf.setTextColor(...C.gray6);
        pdf.setFont('helvetica', 'italic');
        pdf.text('No COGS transactions in this period.', ML + 4, y); y += 7;
      }
      drawLine(C.gray2);
      totalRow('Total COGS', money(totalCOGS), C.grayBg, C.orange);
    }

    // ── Gross Profit ──────────────────────────────────────────────────────
    totalRow('Gross Profit', money(grossProfit), C.indigoBg, C.indigo);

    // ════════════════════════════════════════════════════════════════════════
    // OPERATING EXPENSES
    // ════════════════════════════════════════════════════════════════════════
    sectionHeader('Operating Expenses', [254, 243, 199]);
    if (expenseRows.length > 0) {
      expenseRows.forEach(([sub, val]) => row(sub, money(val)));
    } else {
      checkPage(8);
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.gray6);
      pdf.text('No operating expenses in this period.', ML + 4, y); y += 7;
    }
    drawLine(C.gray2);
    totalRow('Total Expenses', money(totalExpenses), [254, 243, 199], C.red);

    // ════════════════════════════════════════════════════════════════════════
    // NET PROFIT / LOSS
    // ════════════════════════════════════════════════════════════════════════
    checkPage(20);
    const netBg: [number,number,number] = isProfit ? [219, 234, 254] : [254, 226, 226];
    const netFg: [number,number,number] = isProfit ? C.indigo : C.red;
    pdf.setFillColor(...netBg);
    pdf.roundedRect(ML, y - 1, CW, 14, 3, 3, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.gray9);
    pdf.text(`Net ${isProfit ? 'Profit' : 'Loss'}`, ML + 5, y + 9);
    pdf.setTextColor(...netFg);
    pdf.setFontSize(13);
    pdf.text(money(netProfit), PW - MR - 5, y + 9, { align: 'right' });
    y += 18;

    // ════════════════════════════════════════════════════════════════════════
    // MONTHLY BREAKDOWN (new page if needed)
    // ════════════════════════════════════════════════════════════════════════
    if (monthlyData.length > 0) {
      checkPage(40);
      sectionHeader('Monthly Breakdown', C.grayBg);

      // Table header
      pdf.setFillColor(...C.indigo);
      pdf.rect(ML, y - 1, CW, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.white);
      const cols = [ML + 4, ML + 40, ML + 80, ML + 120, ML + 158];
      ['Month', 'Revenue', 'COGS', 'Expenses', 'Net Profit'].forEach((h, i) =>
        pdf.text(h, cols[i], y + 5)
      );
      y += 10;

      monthlyData.forEach((m, idx) => {
        checkPage(8);
        if (idx % 2 === 0) {
          pdf.setFillColor(...C.grayBg);
          pdf.rect(ML, y - 1, CW, 7, 'F');
        }
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...C.gray9);
        pdf.text(m.month,          cols[0], y + 4.5);
        pdf.setTextColor(...C.green);
        pdf.text(money(m.revenue), cols[1], y + 4.5);
        pdf.setTextColor(...C.orange);
        pdf.text(money(m.cogs),    cols[2], y + 4.5);
        pdf.setTextColor(...C.red);
        pdf.text(money(m.expenses),cols[3], y + 4.5);
        const netC: [number,number,number] = m.netProfit >= 0 ? C.indigo : C.red;
        pdf.setTextColor(...netC);
        pdf.setFont('helvetica', 'bold');
        pdf.text(money(m.netProfit), cols[4], y + 4.5);
        y += 7;
      });

      // Totals row
      checkPage(10);
      pdf.setFillColor(...C.indigo);
      pdf.rect(ML, y - 1, CW, 8, 'F');
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.white);
      pdf.text('Total', cols[0], y + 5);
      pdf.text(money(totalRevenue),  cols[1], y + 5);
      pdf.text(money(totalCOGS),     cols[2], y + 5);
      pdf.text(money(totalExpenses), cols[3], y + 5);
      pdf.text(money(netProfit),     cols[4], y + 5);
      y += 12;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FOOTER on every page
    // ════════════════════════════════════════════════════════════════════════
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFillColor(...C.grayBg);
      pdf.rect(0, PH - 10, PW, 10, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.gray6);
      pdf.text('Pakistan Detector Technologies — Confidential', ML, PH - 4);
      pdf.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 4, { align: 'right' });
    }

    pdf.save(`profit-loss-${dateFrom}-${dateTo}.pdf`);
  };

  const cogsRows     = sectionRows('Cost of Goods Sold (COGS)');
  const expenseRows  = sectionRows('Operating Expenses');

  const knownMains   = new Set(['Revenue', 'Cost of Goods Sold (COGS)', 'Operating Expenses']);
  const customMains  = Array.from(buckets.keys()).filter(k => !knownMains.has(k));

  const activePeriodLabel = () => {
    if (filterMode === 'alltime') return 'All Time';
    if (filterMode === 'yearly'  && selectedYears.length > 0)  return selectedYears.sort().join(', ');
    if (filterMode === 'monthly' && selectedMonths.length > 0) return `${selectedMonths.length} month(s)`;
    if (filterMode === 'custom'  && (customFrom || customTo))  return `${customFrom || '—'} → ${customTo || '—'}`;
    return 'All Time';
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} · {filtered.length} transactions · {activePeriodLabel()}
            {selectedLocations.length > 0 && (
              <span className="ml-2 text-purple-600 font-medium">· {selectedLocations.join(', ')}</span>
            )}
            {manualTxns.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-slate-800">
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

      {/* ── Filter Panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-800" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {hasActiveFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-slate-800">Active</span>
            )}
          </div>
          {hasActiveFilter && (
            <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <X size={12} /> Reset all
            </button>
          )}
        </div>

        {/* ── Location filter ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={13} className="text-purple-500" />
            <span className="text-xs font-semibold text-gray-700">Location / Branch</span>
            {selectedLocations.length > 0 && (
              <button onClick={() => setSelectedLocations([])} className="text-xs text-red-400 hover:text-red-600 ml-auto">Clear</button>
            )}
          </div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <button onClick={() => setSelectedLocations([])} style={{padding:'6px 16px',fontSize:'12px',fontWeight:600,borderRadius:'8px',border:'1px solid',cursor:'pointer',background:selectedLocations.length===0?'#1e293b':'#ffffff',color:selectedLocations.length===0?'#ffffff':'#374151',borderColor:selectedLocations.length===0?'#1e293b':'#d1d5db'}}>
              All Locations
            </button>
            {LOCATIONS.map(loc => (
              <button key={loc} onClick={() => toggleLocation(loc)} style={{padding:'6px 16px',fontSize:'12px',fontWeight:600,borderRadius:'8px',border:'1px solid',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',background:selectedLocations.includes(loc)?'#1e293b':'#ffffff',color:selectedLocations.includes(loc)?'#ffffff':'#374151',borderColor:selectedLocations.includes(loc)?'#1e293b':'#d1d5db'}}>
                <MapPin size={11} style={{color:'inherit'}} />
                <span>{loc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-100" />

        {/* ── Period filter ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} className="text-slate-600" />
            <span className="text-xs font-semibold text-gray-700">Period</span>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <button style={modeBtnStyle('alltime')} onClick={() => setFilterMode('alltime')}>All Time</button>
            <button style={modeBtnStyle('yearly')}  onClick={() => setFilterMode('yearly')}>By Year</button>
            <button style={modeBtnStyle('monthly')} onClick={() => setFilterMode('monthly')}>By Month</button>
            <button style={modeBtnStyle('custom')}  onClick={() => setFilterMode('custom')}>Custom Range</button>
          </div>

          {/* Yearly picker */}
          {filterMode === 'yearly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Select one or more years</span>
                {selectedYears.length > 0 && <button onClick={() => setSelectedYears([])} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableYears.map(y => (
                  <button key={y} onClick={() => toggleYear(y)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedYears.includes(y) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:border-slate-600'
                    }`}>{y}</button>
                ))}
                {availableYears.length === 0 && <p className="text-xs text-gray-400 italic">No data available</p>}
              </div>
              {selectedYears.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...selectedYears].sort().map(y => (
                    <span key={y} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-slate-800 text-xs rounded-full">
                      {y}<button onClick={() => toggleYear(y)}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Monthly picker */}
          {filterMode === 'monthly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Select one or more months</span>
                {selectedMonths.length > 0 && <button onClick={() => setSelectedMonths([])} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {availableMonths.map(ym => (
                  <button key={ym} onClick={() => toggleMonth(ym)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedMonths.includes(ym) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:border-slate-600'
                    }`}>{monthLabel(ym)}</button>
                ))}
                {availableMonths.length === 0 && <p className="text-xs text-gray-400 italic">No data available</p>}
              </div>
              {selectedMonths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...selectedMonths].sort().map(ym => (
                    <span key={ym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-slate-800 text-xs rounded-full">
                      {monthLabel(ym)}<button onClick={() => toggleMonth(ym)}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom range */}
          {filterMode === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
                <input type="date" value={customFrom} max={customTo || undefined} onChange={e => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                <input type="date" value={customTo} min={customFrom || undefined} onChange={e => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* ── Active filter summary line ── */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={11} className="text-slate-500 flex-shrink-0" />
          <span>
            Period: <strong className="text-gray-700">{activePeriodLabel()}</strong>
            {selectedLocations.length > 0 && (
              <> · Location: <strong className="text-purple-600">{selectedLocations.join(', ')}</strong></>
            )}
            {' '}· <strong className="text-gray-700">{filtered.length}</strong> transactions
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr,1fr]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Currency display</p>
              <p className="text-xs text-gray-500">Pick the primary report currency and optional extra conversions.</p>
            </div>
          </div>
          <CurrencyDropdown
            primary={primaryCurrency}
            extras={extraCurrencies}
            onPrimaryChange={setPrimaryCurrency}
            onExtrasChange={setExtraCurrencies}
            loading={ratesLoading}
            error={ratesError}
            lastUpdated={lastUpdated}
          />
          {ratesError && <p className="text-sm text-red-600">Failed to load live rates. Showing AED values only.</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className={`text-2xl font-bold ${color}`}>{fmtPrimary(value)}</p>
              <CurrencyRows extras={extraCurrencies} pkrAmount={value} rates={rates} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Full P&L Statement ── */}
      <div ref={reportRef} className="space-y-5">

        {/* Revenue — from Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Revenue
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''})
            </span>
          </h2>
          {filteredInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No invoices in this period.</p>
          ) : (
            <div className="space-y-1">
              {invoiceRevenuePaid > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 flex items-center gap-2">
                    Product Sales
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {filteredInvoices.filter(i => i.status === 'Paid').length} paid
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">{fmt(invoiceRevenuePaid)}</span>
                </div>
              )}
              {invoiceRevenueUnpaid > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 flex items-center gap-2">
                    Product Sales (Unpaid / Outstanding)
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      {filteredInvoices.filter(i => i.status === 'Unpaid').length} unpaid
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">{fmt(invoiceRevenueUnpaid)}</span>
                </div>
              )}
              {totalDeductionCharges > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 italic text-sm">Deduction Charges (courier/collection)</span>
                  <span className="font-medium text-red-500">− {fmt(totalDeductionCharges)}</span>
                </div>
              )}
            </div>
          )}
          <SectionTotal label="Total Revenue" value={totalRevenue} colorClass="bg-green-50" />
          {/* Cash actually collected from customers (informational) */}
          {cashCollected > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>Cash collected from customers (actual receipts recorded in Finance)</span>
              <span className="font-semibold text-gray-700">{fmt(cashCollected)}</span>
            </div>
          )}
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

        {/* Custom / Dynamic P&L categories */}
        {customMains.map(main => {
          const rows  = sectionRows(main);
          const total = sectionTotal(main);
          return (
            <div key={main} className="bg-white rounded-xl shadow-sm border border-slate-300 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Tag size={15} className="text-slate-600" />
                {main}
                <span className="text-xs font-normal text-slate-500 ml-1">(custom category)</span>
              </h2>
              {rows.length === 0
                ? <p className="text-sm text-gray-400 py-2">No transactions in this period.</p>
                : <div className="space-y-1">{rows.map(([sub, val]) => <Row key={sub} label={sub} value={val} />)}</div>
              }
              <SectionTotal label={`Total ${main}`} value={total} colorClass="bg-gray-50" />
            </div>
          );
        })}

        {/* Net Profit / Loss */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          isProfit
            ? 'bg-gradient-to-r from-blue-50 to-gray-50 border-blue-200'
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
        {(financing.loanIn > 0 || financing.loanOut > 0 || financing.personal > 0 || financing.payments > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 pb-2 border-b border-gray-200">
              Financing & Non-Operating Items{' '}
              <span className="text-xs font-normal text-gray-400">(excluded from P&L)</span>
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Recorded in Finance but do not affect operational profit/loss.
            </p>
            <div className="space-y-1">
              {financing.loanIn   > 0 && <Row label="Loans Received"                   value={financing.loanIn}   highlight />}
              {financing.loanOut  > 0 && <Row label="Loans Paid Out"                   value={financing.loanOut}  highlight />}
              {financing.payments > 0 && <Row label="Inter-company / Person Payments"  value={financing.payments} highlight />}
              {financing.personal > 0 && <Row label="Personal / Non-Business Expenses" value={financing.personal} highlight />}
            </div>
          </div>
        )}

        {/* Manual classification audit panel */}
        {manualTxns.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
            <button
              onClick={() => setShowManual(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-800" />
                <h2 className="text-base font-bold text-gray-900">
                  Manually P&L-Classified Transactions
                </h2>
                <span className="bg-gray-100 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {manualTxns.length}
                </span>
              </div>
              {showManual
                ? <ChevronUp size={20} className="text-gray-500" />
                : <ChevronDown size={20} className="text-gray-500" />
              }
            </button>
            {showManual && (
              <div className="overflow-x-auto border-t border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date', 'Company', 'Sub Category', 'P&L Category', 'P&L Sub-Category', 'Amount'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
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
                          <span className="bg-gray-100 text-slate-900 text-xs px-2 py-0.5 rounded-full">
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