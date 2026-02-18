import { useNavigate } from 'react-router-dom';
import { 
  Landmark, 
  ArrowRightLeft, 
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Banknote
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Bank, Transaction } from '../../App';

export function BankingPage() {
  const navigate = useNavigate();
  const { banks, transactions } = useOutletContext<{
    banks: Bank[];
    transactions: Transaction[];
  }>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate cash in hand
  const cashTransactions = transactions.filter(t => t.mode === 'Cash');
  const cashInflow = cashTransactions
    .filter(t => t.mainCategory === 'Cash Inflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashOutflow = cashTransactions
    .filter(t => t.mainCategory === 'Cash Outflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCashInHand = cashInflow - cashOutflow;

  // Calculate total bank balance
  const totalBankBalance = banks.reduce((sum, bank) => sum + bank.balance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Banking
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage bank accounts, transfers, and cash in hand
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bank Balance</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalBankBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">{banks.length} bank account(s)</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cash in Hand</p>
                <p className={`text-3xl font-bold ${totalCashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalCashInHand)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Physical cash balance</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Liquidity</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {formatCurrency(totalBankBalance + totalCashInHand)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Banks + Cash</p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                <Banknote size={28} className="text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Banking Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bank Balances Card */}
            <button
              onClick={() => navigate('/banking/banks')}
              className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 text-left"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-600 rounded-lg group-hover:bg-white transition-colors">
                  <Building2 className="w-6 h-6 text-white group-hover:text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-white ml-3">Bank Balances</h4>
              </div>
              <p className="text-gray-600 group-hover:text-blue-100 mb-4">
                View and manage all bank accounts, balances, and transactions
              </p>
              <div className="flex items-center text-blue-600 group-hover:text-white font-medium">
                <span>View Banks</span>
                <TrendingUp className="w-4 h-4 ml-2" />
              </div>
            </button>

            {/* Bank Transfers Card */}
            <button
              onClick={() => navigate('/banking/transfers')}
              className="group p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:bg-green-600 hover:border-green-500 transition-all duration-300 text-left"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-600 rounded-lg group-hover:bg-white transition-colors">
                  <ArrowRightLeft className="w-6 h-6 text-white group-hover:text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-white ml-3">Bank Transfers</h4>
              </div>
              <p className="text-gray-600 group-hover:text-green-100 mb-4">
                Transfer funds between bank accounts with full tracking
              </p>
              <div className="flex items-center text-green-600 group-hover:text-white font-medium">
                <span>View Transfers</span>
                <ArrowRightLeft className="w-4 h-4 ml-2" />
              </div>
            </button>

            {/* Cash in Hand Card */}
            <button
              onClick={() => navigate('/banking/cash-in-hand')}
              className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl hover:bg-orange-600 hover:border-orange-500 transition-all duration-300 text-left"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-600 rounded-lg group-hover:bg-white transition-colors">
                  <Wallet className="w-6 h-6 text-white group-hover:text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 group-hover:text-white ml-3">Cash in Hand</h4>
              </div>
              <p className="text-gray-600 group-hover:text-orange-100 mb-4">
                Track physical cash transactions and current cash balance
              </p>
              <div className="flex items-center text-orange-600 group-hover:text-white font-medium">
                <span>View Cash</span>
                <TrendingDown className="w-4 h-4 ml-2" />
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/banking/banks/new')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add New Bank Account</span>
          </button>
          <button
            onClick={() => navigate('/banking/transfers/new')}
            className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="font-semibold">Make Bank Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
