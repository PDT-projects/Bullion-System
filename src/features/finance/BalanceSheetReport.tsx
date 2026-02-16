import { ArrowLeft } from 'lucide-react';

type BalanceSheetReportProps = {
  onBack: () => void;
};

export function BalanceSheetReport({ onBack }: BalanceSheetReportProps) {
  // Dummy data as specified
  const data = {
    assets: {
      currentAssets: {
        cashInHand: 200000,
        bankBalance: 800000,
        accountsReceivable: 300000,
        inventoryStock: 700000,
        totalCurrentAssets: 2000000
      },
      fixedAssets: {
        officeEquipment: 250000,
        computers: 300000,
        furniture: 150000,
        totalFixedAssets: 700000
      },
      totalAssets: 2700000
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 400000,
        shortTermLoans: 300000,
        accruedExpenses: 100000,
        totalCurrentLiabilities: 800000
      },
      longTermLiabilities: {
        bankLoan: 600000,
        totalLongTermLiabilities: 600000
      },
      totalLiabilities: 1400000
    },
    equity: {
      ownerCapital: 1000000,
      retainedEarnings: 300000,
      totalEquity: 1300000
    },
    totalLiabilitiesAndEquity: 2700000
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600 mt-1">Financial position statement as of the reporting date</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Reports Hub
        </button>
      </div>

      {/* Balance Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ASSETS */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ASSETS</h2>

            {/* Current Assets */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Current Assets</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Cash in Hand</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.currentAssets.cashInHand)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Bank Balance</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.currentAssets.bankBalance)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Accounts Receivable</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.currentAssets.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Inventory Stock</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.currentAssets.inventoryStock)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-gray-900">Total Current Assets</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(data.assets.currentAssets.totalCurrentAssets)}</span>
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Fixed Assets</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Office Equipment</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.fixedAssets.officeEquipment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Computers</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.fixedAssets.computers)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Furniture</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.assets.fixedAssets.furniture)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-gray-900">Total Fixed Assets</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(data.assets.fixedAssets.totalFixedAssets)}</span>
                </div>
              </div>
            </div>

            {/* Total Assets */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4">
                <span className="text-xl font-bold text-gray-900">Total Assets</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(data.assets.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LIABILITIES & EQUITY</h2>

            {/* Current Liabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Current Liabilities</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Accounts Payable</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.accountsPayable)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Short-term Loans</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.shortTermLoans)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Accrued Expenses</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.accruedExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-gray-900">Total Current Liabilities</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Long-term Liabilities</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Bank Loan</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.liabilities.longTermLiabilities.bankLoan)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-gray-900">Total Long-term Liabilities</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(data.liabilities.longTermLiabilities.totalLongTermLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="mb-6 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3">
                <span className="font-semibold text-gray-900">Total Liabilities</span>
                <span className="font-bold text-lg text-red-600">{formatCurrency(data.liabilities.totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Equity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Owner Capital</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.equity.ownerCapital)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Retained Earnings</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.equity.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-gray-900">Total Equity</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(data.equity.totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities & Equity */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
                <span className="text-xl font-bold text-gray-900">Total Liabilities & Equity</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Verification */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Balance Verification</h3>
          <p className="text-gray-600">
            Total Assets ({formatCurrency(data.assets.totalAssets)}) = Total Liabilities & Equity ({formatCurrency(data.totalLiabilitiesAndEquity)})
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(data.assets.totalAssets)}</span>
            <span className="text-xl text-gray-500">=</span>
            <span className="text-2xl font-bold text-green-600">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
