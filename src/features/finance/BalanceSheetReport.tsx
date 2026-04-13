// BalanceSheetReport.tsx
// Computes balance sheet figures from live Firestore data.
// Assets = Cash + Banks + Inventory + Loans Receivable
// Liabilities = Loans Payable + Pending Bills
// Equity = Assets − Liabilities (accounting identity)
//
// ALSO: renders a "Manual BS Classification" panel driven by the
// bsMainCategory / bsSubCategory fields saved on each transaction.
// Priority: manual classification (saved from form) → shown in dedicated section.

import { useMemo, useState } from 'react';
import { ArrowLeft, Tag, ChevronDown, ChevronUp } from 'lucide-react';

type Transaction = {
  id: string; date: string; mainCategory: string;
  subCategory: string; amount: number;
  company?: string;
  remainingAmount?: number;
  mode?: string;
  // Manual Balance Sheet classification (saved from form to Firestore)
  bsMainCategory?: string;
  bsSubCategory?: string;
  // Approval — pending/rejected have zero financial impact
  approvalStatus?: string;
};
type Bank      = { id: string; name: string; balance: number; accountNumber: string; };
type Loan      = { id: string; type: 'Payable' | 'Receivable'; remaining: number; loanAmount: number; paid: number; status: string; };
type Product   = { id: string; costPrice: number; stock: number; };
type Bill      = { id: string; amount: number; status: string; };

type BalanceSheetReportProps = {
  transactions: Transaction[];
  banks: Bank[];
  loans: Loan[];
  products: Product[];
  onBack: () => void;
  // bills prop is optional — pass if available
  bills?: Bill[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0
  }).format(amount);

const Row = ({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) => (
  <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${bold ? 'font-semibold' : ''}`}>
    <span className={bold ? 'text-gray-900' : 'text-gray-700'}>{label}</span>
    <span className={bold ? 'font-bold text-lg text-gray-900' : 'font-medium text-gray-900'}>{formatCurrency(value)}</span>
  </div>
);

const SubTotal = ({ label, value, colorClass = 'bg-blue-50' }: { label: string; value: number; colorClass?: string }) => (
  <div className={`flex justify-between items-center py-3 ${colorClass} rounded-lg px-3 mt-2`}>
    <span className="font-semibold text-gray-900">{label}</span>
    <span className="font-bold text-lg text-gray-900">{formatCurrency(value)}</span>
  </div>
);

export function BalanceSheetReport({ transactions, banks, loans, products, bills = [], onBack }: BalanceSheetReportProps) {
  const [showBSClassified, setShowBSClassified] = useState(true);
  const [expandedSubs,     setExpandedSubs]     = useState<Set<string>>(new Set());
  const toggleSub = (key: string) =>
    setExpandedSubs(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Only approved / not_required transactions affect balance sheet figures
  const liquid = useMemo(
    () => transactions.filter(
      t => t.approvalStatus === 'approved' || t.approvalStatus === 'not_required' || !t.approvalStatus
    ),
    [transactions]
  );

  // ── Manual BS classification grouping ─────────────────────────────────────
  // Groups transactions that have bsMainCategory + bsSubCategory set on them.
  const bsClassified = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; txns: Transaction[] }>>();
    for (const t of liquid) {
      if (!t.bsMainCategory || !t.bsSubCategory) continue;
      if (!map.has(t.bsMainCategory)) map.set(t.bsMainCategory, new Map());
      const inner = map.get(t.bsMainCategory)!;
      if (!inner.has(t.bsSubCategory)) inner.set(t.bsSubCategory, { total: 0, txns: [] });
      const entry = inner.get(t.bsSubCategory)!;
      entry.total += t.amount || 0;
      entry.txns.push(t);
    }
    return map;
  }, [liquid]);

  const bsClassifiedCount = useMemo(() => {
    let count = 0;
    bsClassified.forEach(inner => inner.forEach(v => { count += v.txns.length; }));
    return count;
  }, [bsClassified]);

  const bsSectionTotal = (main: string) => {
    const inner = bsClassified.get(main);
    if (!inner) return 0;
    let total = 0;
    inner.forEach(v => { total += v.total; });
    return total;
  };

  const bs = useMemo(() => {
    // ── ASSETS ──────────────────────────────────────────────────────────────
    // Cash in Hand: total inflow − total outflow from Cash-mode transactions
    const cashIn  = liquid.filter(t => t.mainCategory === 'Cash Inflow'  && t.mode === 'Cash').reduce((s, t) => s + t.amount, 0);
    const cashOut = liquid.filter(t => t.mainCategory === 'Cash Outflow' && t.mode === 'Cash').reduce((s, t) => s + t.amount, 0);
    const cashInHand = Math.max(0, cashIn - cashOut);

    // Bank balance: from banks collection
    const bankBalance = banks.reduce((s, b) => s + (b.balance || 0), 0);

    // Accounts receivable: pending inflow (partial / cheque uncleared)
    const accountsReceivable = liquid
      .filter(t => t.mainCategory === 'Cash Inflow' && (t.remainingAmount ?? 0) > 0)
      .reduce((s, t) => s + (t.remainingAmount ?? 0), 0);

    // Inventory value: sum of (costPrice × stock)
    const inventoryValue = products.reduce((s, p) => s + (p.costPrice || 0) * (p.stock || 0), 0);

    // Loans receivable (what others owe us)
    const loansReceivable = loans
      .filter(l => l.type === 'Receivable' && l.status !== 'Full')
      .reduce((s, l) => s + (l.remaining || 0), 0);

    const totalCurrentAssets = cashInHand + bankBalance + accountsReceivable + inventoryValue + loansReceivable;

    // Fixed assets — keep as 0 unless a fixed asset module is added
    const totalFixedAssets = 0;

    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // ── LIABILITIES ──────────────────────────────────────────────────────────
    // Accounts payable: pending outflow
    const accountsPayable = liquid
      .filter(t => t.mainCategory === 'Cash Outflow' && (t.remainingAmount ?? 0) > 0)
      .reduce((s, t) => s + (t.remainingAmount ?? 0), 0);

    // Loans payable
    const loansPayable = loans
      .filter(l => l.type === 'Payable' && l.status !== 'Full')
      .reduce((s, l) => s + (l.remaining || 0), 0);

    // Pending bills
    const pendingBills = bills
      .filter(b => b.status === 'Pending' || b.status === 'Overdue')
      .reduce((s, b) => s + b.amount, 0);

    const totalCurrentLiabilities = accountsPayable + loansPayable + pendingBills;
    const totalLiabilities        = totalCurrentLiabilities;

    // ── EQUITY ───────────────────────────────────────────────────────────────
    // Fundamental accounting equation: Assets = Liabilities + Equity
    const totalEquity                 = totalAssets - totalLiabilities;
    const totalLiabilitiesAndEquity   = totalLiabilities + totalEquity;

    return {
      assets: {
        cashInHand, bankBalance, accountsReceivable,
        inventoryValue, loansReceivable,
        totalCurrentAssets, totalFixedAssets, totalAssets,
      },
      liabilities: {
        accountsPayable, loansPayable, pendingBills,
        totalCurrentLiabilities, totalLiabilities,
      },
      equity: { totalEquity },
      totalLiabilitiesAndEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1,
    };
  }, [liquid, banks, loans, products, bills]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Computed from live Firestore data · as of today
            {bsClassifiedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
                <Tag size={12} /> {bsClassifiedCount} manually classified
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Reports Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── ASSETS ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ASSETS</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Assets</h3>
          <div className="space-y-1 mb-4">
            <Row label="Cash in Hand"          value={bs.assets.cashInHand} />
            <Row label="Bank Balance"          value={bs.assets.bankBalance} />
            <Row label="Accounts Receivable"   value={bs.assets.accountsReceivable} />
            <Row label="Inventory Stock Value" value={bs.assets.inventoryValue} />
            <Row label="Loans Receivable"      value={bs.assets.loansReceivable} />
          </div>
          <SubTotal label="Total Current Assets" value={bs.assets.totalCurrentAssets} colorClass="bg-blue-50" />

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b border-gray-200 pb-2">Fixed Assets</h3>
          <p className="text-sm text-gray-400 italic mb-3">Fixed asset module not yet active</p>
          <SubTotal label="Total Fixed Assets" value={bs.assets.totalFixedAssets} colorClass="bg-blue-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Assets</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* ── LIABILITIES & EQUITY ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LIABILITIES & EQUITY</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Liabilities</h3>
          <div className="space-y-1 mb-4">
            <Row label="Accounts Payable (Pending)"  value={bs.liabilities.accountsPayable} />
            <Row label="Loans Payable (Outstanding)" value={bs.liabilities.loansPayable} />
            <Row label="Pending Bills"               value={bs.liabilities.pendingBills} />
          </div>
          <SubTotal label="Total Current Liabilities" value={bs.liabilities.totalCurrentLiabilities} colorClass="bg-red-50" />

          <div className="mt-4 mb-6">
            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Liabilities</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(bs.liabilities.totalLiabilities)}</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Equity</h3>
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Owner's Equity (Assets − Liabilities)</span>
              <span className={`font-medium ${bs.equity.totalEquity >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(bs.equity.totalEquity)}
              </span>
            </div>
          </div>
          <SubTotal label="Total Equity" value={bs.equity.totalEquity} colorClass="bg-green-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Liabilities & Equity</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual BS Classification Panel ── */}
      {bsClassifiedCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
          <button
            onClick={() => setShowBSClassified(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">
                Balance Sheet — Manual Classification
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {bsClassifiedCount} transactions
              </span>
            </div>
            {showBSClassified
              ? <ChevronUp size={20} className="text-gray-500" />
              : <ChevronDown size={20} className="text-gray-500" />
            }
          </button>
          {showBSClassified && (
            <div className="p-5 border-t border-indigo-100 space-y-6">
              <p className="text-xs text-gray-400">
                Transactions with a manual Balance Sheet category override set in the transaction form.
                These reflect your deliberate classification and are shown here for reporting.
              </p>

              {Array.from(bsClassified.entries()).map(([mainCat, subMap]) => (
                <div key={mainCat}>
                  <div className={`flex justify-between items-center px-3 py-2 rounded-lg mb-3 font-semibold text-sm ${
                    mainCat === 'Assets' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <span>{mainCat}</span>
                    <span>{formatCurrency(bsSectionTotal(mainCat))}</span>
                  </div>
                  {Array.from(subMap.entries()).map(([subCat, { total, txns }]) => {
                    const key      = `${mainCat}__${subCat}`;
                    const expanded = expandedSubs.has(key);
                    return (
                    <div key={subCat} className="mb-4">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200 mb-2">
                        <span className="text-sm font-medium text-gray-700">{subCat}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
                      </div>
                      <button
                        onClick={() => toggleSub(key)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 mb-2 flex items-center gap-1"
                      >
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {txns.length} transaction{txns.length !== 1 ? 's' : ''}
                      </button>
                      {expanded && (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {['Date', 'Company', 'Sub Category', 'Amount'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {txns.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{(t.date || '').slice(0, 10)}</td>
                                  <td className="px-3 py-2 text-gray-700">{t.company || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">{t.subCategory}</td>
                                  <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(t.amount || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance verification */}
      <div className={`rounded-xl p-6 border text-center ${bs.balanced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Balance Verification</h3>
        <div className="flex items-center justify-center gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</p>
          </div>
          <span className="text-2xl text-gray-400">=</span>
          <div>
            <p className="text-xs text-gray-500 mb-1">Liabilities + Equity</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</p>
          </div>
        </div>
        <p className={`text-sm mt-3 font-medium ${bs.balanced ? 'text-green-600' : 'text-yellow-700'}`}>
          {bs.balanced ? '✓ Balance sheet is balanced' : '⚠ Minor rounding difference detected'}
        </p>
      </div>
    </div>
  );
}