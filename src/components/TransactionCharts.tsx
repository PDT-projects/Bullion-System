import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../App';
import { mockMonthlyTransactions, mockDailyTransactions, mockIncomeExpenseData } from '../mockData';

type TransactionChartsProps = {
  transactions: Transaction[];
};

const COLORS = ['#10b981', '#ef4444', '#4f46e5', '#f59e0b', '#8b5cf6'];

export function TransactionCharts({ transactions }: TransactionChartsProps) {
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

  // Prepare data for transactions per month
  const monthlyData = filteredTransactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.month === month);

    if (existing) {
      if (transaction.mainCategory === 'Cash Inflow') {
        existing.inflow += transaction.amount;
        existing.inflowCount += 1;
      } else {
        existing.outflow += transaction.amount;
        existing.outflowCount += 1;
      }
    } else {
      acc.push({
        month,
        inflow: transaction.mainCategory === 'Cash Inflow' ? transaction.amount : 0,
        outflow: transaction.mainCategory !== 'Cash Inflow' ? transaction.amount : 0,
        inflowCount: transaction.mainCategory === 'Cash Inflow' ? 1 : 0,
        outflowCount: transaction.mainCategory !== 'Cash Inflow' ? 1 : 0
      });
    }
    return acc;
  }, [] as { month: string; inflow: number; outflow: number; inflowCount: number; outflowCount: number }[]);

  // Use mock data if no real data available
  const finalMonthlyData = monthlyData.length > 0 ? monthlyData : mockMonthlyTransactions;

  // Prepare data for daily transactions (last 30 days)
  const dailyData = filteredTransactions
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
        existing.count += 1;
      } else {
        acc.push({
          day,
          inflow: transaction.mainCategory === 'Cash Inflow' ? transaction.amount : 0,
          outflow: transaction.mainCategory !== 'Cash Inflow' ? transaction.amount : 0,
          count: 1
        });
      }
      return acc;
    }, [] as { day: string; inflow: number; outflow: number; count: number }[])
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  // Prepare data for income vs expense pie chart
  const incomeExpenseData = [
    {
      name: 'Income',
      value: filteredTransactions
        .filter(t => t.mainCategory === 'Cash Inflow')
        .reduce((sum, t) => sum + t.amount, 0)
    },
    {
      name: 'Expense',
      value: filteredTransactions
        .filter(t => t.mainCategory !== 'Cash Inflow')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  ];

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

      {/* Monthly Transactions Bar Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Monthly Transaction Summary</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={finalMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Transactions Line Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Daily Transaction Amounts (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} name="Inflow" />
            <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Outflow" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expense Pie Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Income vs Expense Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={incomeExpenseData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {incomeExpenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          <p className="text-xs text-gray-600 mt-1">In selected period</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(incomeExpenseData[0].value)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Cash inflow</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(incomeExpenseData[1].value)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Cash outflow</p>
        </div>
      </div>
    </div>
  );
}
