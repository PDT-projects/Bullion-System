// ProfitLossReport.tsx
// Now accepts real transaction, salary, and bill data from Firestore.
// Computes P&L from actual records — no dummy data.

import { useMemo } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Transaction = {
  id: string;
  date: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
};

type Salary = {
  id: string;
  date: string;
  netAmount: number;
  salaryMonth?: string;
};

type Bill = {
  id: string;
  date: string;
  amount: number;
  status: string;
  category?: string;
};

type ProfitLossReportProps = {
  transactions: Transaction[];
  salaries: Salary[];
  bills: Bill[];
  onBack: () => void;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0
  }).format(amount);

export function ProfitLossReport({ transactions, salaries, bills, onBack }: ProfitLossReportProps) {

  const data = useMemo(() => {
    // ── Revenue: all Cash Inflow transactions ──────────────────────────────
    const inflowTxns = transactions.filter(t => t.mainCategory === 'Cash Inflow');

    // Break revenue into product sales (Invoice-linked) vs service income
    const productSales   = inflowTxns.filter(t => t.subCategory?.toLowerCase().includes('sale') || t.subCategory?.toLowerCase().includes('invoice')).reduce((s, t) => s + t.amount, 0);
    const serviceIncome  = inflowTxns.filter(t => !t.subCategory?.toLowerCase().includes('sale') && !t.subCategory?.toLowerCase().includes('invoice')).reduce((s, t) => s + t.amount, 0);
    const totalRevenue   = inflowTxns.reduce((s, t) => s + t.amount, 0);

    // ── COGS: outflow transactions tagged as purchase/stock ────────────────
    const purchasesTxns = transactions.filter(
      t => t.mainCategory === 'Cash Outflow' &&
           (t.subCategory?.toLowerCase().includes('purchase') || t.subCategory?.toLowerCase().includes('stock') || t.subCategory?.toLowerCase().includes('inventory'))
    );
    const totalCOGS = purchasesTxns.reduce((s, t) => s + t.amount, 0);

    const grossProfit = totalRevenue - totalCOGS;

    // ── Expenses breakdown ──────────────────────────────────────────────────
    // Salaries
    const totalSalaries = salaries.reduce((s, sal) => s + (sal.netAmount || 0), 0);

    // Bills by category
    const paidBills   = bills.filter(b => b.status === 'Paid');
    const rentBills   = paidBills.filter(b => b.category?.toLowerCase().includes('rent')).reduce((s, b) => s + b.amount, 0);
    const utilityBills = paidBills.filter(b => b.category?.toLowerCase().includes('util') || b.category?.toLowerCase().includes('electric') || b.category?.toLowerCase().includes('gas')).reduce((s, b) => s + b.amount, 0);
    const otherBills  = paidBills.filter(b => !b.category?.toLowerCase().includes('rent') && !b.category?.toLowerCase().includes('util') && !b.category?.toLowerCase().includes('electric') && !b.category?.toLowerCase().includes('gas')).reduce((s, b) => s + b.amount, 0);

    // Other outflow transactions (not COGS)
    const otherOutflow = transactions.filter(
      t => t.mainCategory === 'Cash Outflow' &&
           !t.subCategory?.toLowerCase().includes('purchase') &&
           !t.subCategory?.toLowerCase().includes('stock') &&
           !t.subCategory?.toLowerCase().includes('inventory')
    );
    const marketing = otherOutflow.filter(t => t.subCategory?.toLowerCase().includes('market') || t.subCategory?.toLowerCase().includes('adverti')).reduce((s, t) => s + t.amount, 0);
    const misc      = otherOutflow.filter(t => !t.subCategory?.toLowerCase().includes('market') && !t.subCategory?.toLowerCase().includes('adverti')).reduce((s, t) => s + t.amount, 0);

    const totalExpenses = totalSalaries + rentBills + utilityBills + marketing + misc + otherBills;
    const netProfit     = grossProfit - totalExpenses;

    return {
      revenue: { productSales, serviceIncome, totalRevenue },
      cogs:    { totalCOGS, purchases: totalCOGS },
      grossProfit,
      expenses: {
        salaries: totalSalaries,
        rent:        rentBills,
        utilities:   utilityBills,
        marketing,
        misc:        misc + otherBills,
        totalExpenses,
      },
      netProfit,
    };
  }, [transactions, salaries, bills]);

  const handleExportCSV = () => {
    const rows = [
      ['Category', 'Item', 'Amount (PKR)'],
      ['Revenue', 'Product / Invoice Sales', data.revenue.productSales],
      ['Revenue', 'Service Income', data.revenue.serviceIncome],
      ['Revenue', 'Total Revenue', data.revenue.totalRevenue],
      ['COGS', 'Purchases', data.cogs.purchases],
      ['COGS', 'Total COGS', data.cogs.totalCOGS],
      ['Profit', 'Gross Profit', data.grossProfit],
      ['Expenses', 'Salaries', data.expenses.salaries],
      ['Expenses', 'Rent', data.expenses.rent],
      ['Expenses', 'Utilities', data.expenses.utilities],
      ['Expenses', 'Marketing', data.expenses.marketing],
      ['Expenses', 'Misc / Other', data.expenses.misc],
      ['Expenses', 'Total Expenses', data.expenses.totalExpenses],
      ['Profit', 'Net Profit / Loss', data.netProfit],
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `profit-loss-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('profit-loss-report');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const pdf    = new jsPDF('p', 'mm', 'a4');
    const w      = 210;
    const h      = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
    pdf.save(`profit-loss-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isProfit = data.netProfit >= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
          <p className="text-gray-500 mt-1 text-sm">Computed from live Firestore data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm">
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm">
            <FileText size={15} /> Export PDF
          </button>
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </div>

      <div id="profit-loss-report" className="space-y-6">
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Product / Invoice Sales</span>
              <span className="font-medium">{formatCurrency(data.revenue.productSales)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Service Income</span>
              <span className="font-medium">{formatCurrency(data.revenue.serviceIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-bold text-lg">{formatCurrency(data.revenue.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost of Goods Sold (COGS)</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Purchases & Inventory</span>
              <span className="font-medium">{formatCurrency(data.cogs.purchases)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold">Total COGS</span>
              <span className="font-bold text-lg">{formatCurrency(data.cogs.totalCOGS)}</span>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className={`rounded-xl shadow-sm border p-6 ${data.grossProfit >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'}`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gross Profit</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Revenue − COGS</span>
            <span className={`font-bold text-2xl ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.grossProfit)}
            </span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Expenses</h2>
          <div className="space-y-3">
            {[
              { label: 'Salaries & Wages',  value: data.expenses.salaries },
              { label: 'Rent',              value: data.expenses.rent },
              { label: 'Utilities',         value: data.expenses.utilities },
              { label: 'Marketing',         value: data.expenses.marketing },
              { label: 'Misc / Other',      value: data.expenses.misc },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">{label}</span>
                <span className="font-medium">{formatCurrency(value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold">Total Expenses</span>
              <span className="font-bold text-lg">{formatCurrency(data.expenses.totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`rounded-xl shadow-sm border p-6 ${isProfit ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'}`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Net {isProfit ? 'Profit' : 'Loss'}</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gross Profit − Total Expenses</span>
            <span className={`font-bold text-3xl ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(data.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}