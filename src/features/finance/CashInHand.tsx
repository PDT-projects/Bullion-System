import { Transaction } from '../../App';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

type CashInHandProps = {
  transactions: Transaction[];
};

export function CashInHand({ transactions }: CashInHandProps) {
  // Calculate cash in hand from cash transactions only
  const cashTransactions = transactions.filter(t => t.mode === 'Cash');
  
  const cashInflow = cashTransactions
    .filter(t => t.mainCategory === 'Cash Inflow')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const cashOutflow = cashTransactions
    .filter(t => t.mainCategory === 'Cash Outflow')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCashInHand = cashInflow - cashOutflow;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Recent cash transactions
  const recentCashTransactions = cashTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Cash in Hand</h2>
        <p className="text-sm text-gray-600 mt-1">Track physical cash transactions and balances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Cash In Hand</p>
              <p className={`text-2xl font-bold ${totalCashInHand >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {formatCurrency(totalCashInHand)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#4f46e5]/10 rounded-full flex items-center justify-center">
              <Wallet size={24} className="text-[#4f46e5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cash Inflow</p>
              <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(cashInflow)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {cashTransactions.filter(t => t.mainCategory === 'Cash Inflow').length} transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp size={24} className="text-[#10b981]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cash Outflow</p>
              <p className="text-2xl font-bold text-[#ef4444]">{formatCurrency(cashOutflow)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {cashTransactions.filter(t => t.mainCategory === 'Cash Outflow').length} transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown size={24} className="text-[#ef4444]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Recent Cash Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCashTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.mainCategory === 'Cash Inflow' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.mainCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.subCategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.mainCategory === 'Cash Inflow' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                      {transaction.mainCategory === 'Cash Inflow' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {transaction.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
