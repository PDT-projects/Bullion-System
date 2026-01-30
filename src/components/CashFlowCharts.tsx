import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../App';

type CashFlowChartsProps = {
  transactions: Transaction[];
};

const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export function CashFlowCharts({ transactions }: CashFlowChartsProps) {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Filter transactions by date range if specified
  const filteredTransactions = transactions.filter(t => {
    if (!dateRange.start && !dateRange.end) return true;
    const transactionDate = new Date(t.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    if (startDate && transactionDate < startDate) return false;
    if (endDate && transactionDate > endDate) return false;
    return true;
  });

  // Prepare data for monthly cash flow
  const monthlyCashFlowData = filteredTransactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.month === month);

    if (existing) {
      if (transaction.mainCategory === 'Cash Inflow') {
        existing.inflow += transaction.amount;
      } else {
        existing.outflow += transaction.amount;
      }
      existing.net = existing.inflow - existing.outflow;
    } else {
      const inflow = transaction.mainCategory === 'Cash Inflow' ? transaction.amount : 0;
      const outflow = transaction.mainCategory !== 'Cash Inflow' ? transaction.amount : 0;
      acc.push({
        month,
        inflow,
        outflow,
        net: inflow - outflow
      });
    }
    return acc;
  }, [] as { month: string; inflow: number; outflow: number; net: number }[]);

  // Prepare data for daily cash flow (last 30 days)
  const dailyCashFlowData = filteredTransactions
    .filter(t => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(t.date) >= thirtyDaysAgo;
    })
    .reduce((acc, transaction) => {
      const day = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.day === day);

      if (existing) {
        if (transaction.mainCategory === 'Cash Inflow') {
          existing.inflow += transaction.amount;
        } else {
          existing.outflow += transaction.amount;
        }
        existing.net = existing.inflow - existing.outflow;
      } else {
        const inflow = transaction.mainCategory === 'Cash Inflow' ? transaction.amount : 0;
        const outflow = transaction.mainCategory !== 'Cash Inflow' ? transaction.amount : 0;
        acc.push({
          day,
          inflow,
          outflow,
          net: inflow - outflow
        });
      }
      return acc;
    }, [] as { day: string; inflow: number; outflow: number; net: number }[])
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  // Prepare data for category-wise expenses
  const categoryExpenseData = filteredTransactions
    .filter(t => t.mainCategory !== 'Cash Inflow')
    .reduce((acc, transaction) => {
      const existing = acc.find(item => item.category === transaction.subCategory);

      if (existing) {
        existing.amount += transaction.amount;
      } else {
        acc.push({
          category: transaction.subCategory,
          amount: transaction.amount
        });
      }
      return acc;
    }, [] as { category: string; amount: number }[])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 categories

  // Use mock data if no real data available
  const finalCategoryExpenseData = categoryExpenseData.length > 0 ? categoryExpenseData : mockCategoryExpenseData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Date Range Filter</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
        </div>
      </div>

      {/* Net Cash Flow Trend */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Net Cash Flow Trend</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyCashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Net Cash Flow']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#4f46e5"
              strokeWidth={3}
              name="Net Cash Flow"
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Inflow vs Outflow Area Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Cash Inflow vs Outflow Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={monthlyCashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="inflow"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Inflow"
            />
            <Area
              type="monotone"
              dataKey="outflow"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Outflow"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Cash Flow (Last 30 Days) */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Daily Cash Flow (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailyCashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[2, 2, 0, 0]} />
            <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category-wise Expense Visualization */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Top Expense Categories</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={finalCategoryExpenseData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#9ca3af" />
            <YAxis dataKey="category" type="category" stroke="#9ca3af" width={120} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="amount" fill="#ef4444" name="Expense Amount" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Inflow</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(filteredTransactions
              .filter(t => t.mainCategory === 'Cash Inflow')
              .reduce((sum, t) => sum + t.amount, 0))}
          </p>
          <p className="text-xs text-gray-600 mt-1">In selected period</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Outflow</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(filteredTransactions
              .filter(t => t.mainCategory !== 'Cash Inflow')
              .reduce((sum, t) => sum + t.amount, 0))}
          </p>
          <p className="text-xs text-gray-600 mt-1">In selected period</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Net Cash Flow</span>
          </div>
          <p className={`text-2xl font-bold ${
            monthlyCashFlowData.reduce((sum, item) => sum + item.net, 0) >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {formatCurrency(monthlyCashFlowData.reduce((sum, item) => sum + item.net, 0))}
          </p>
          <p className="text-xs text-gray-600 mt-1">Cumulative</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Daily Flow</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              dailyCashFlowData.length > 0
                ? dailyCashFlowData.reduce((sum, item) => sum + item.net, 0) / dailyCashFlowData.length
                : 0
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
