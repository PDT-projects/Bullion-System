import { ArrowUpRight, ArrowDownRight, Wallet, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

// Mock data for charts
const cashflowData = [
  { month: 'Jan', inflow: 450000, outflow: 320000 },
  { month: 'Feb', inflow: 520000, outflow: 380000 },
  { month: 'Mar', inflow: 480000, outflow: 350000 },
  { month: 'Apr', inflow: 610000, outflow: 420000 },
  { month: 'May', inflow: 580000, outflow: 390000 },
  { month: 'Jun', inflow: 650000, outflow: 450000 },
];

const recentTransactions = [
  {
    id: 1,
    date: '2026-01-19',
    mainCategory: 'Cash Inflow',
    subCategory: 'Product sale received',
    amount: 85000,
    mode: 'Bank',
    bankName: 'Habib Bank Limited',
    type: 'inflow'
  },
  {
    id: 2,
    date: '2026-01-19',
    mainCategory: 'Cash Outflow',
    subCategory: 'Employee salary',
    amount: 45000,
    mode: 'Bank',
    bankName: 'Allied Bank',
    type: 'outflow'
  },
  {
    id: 3,
    date: '2026-01-18',
    mainCategory: 'Cash Inflow',
    subCategory: 'Payment received - Customer',
    amount: 120000,
    mode: 'Cash',
    bankName: null,
    type: 'inflow'
  },
  {
    id: 4,
    date: '2026-01-18',
    mainCategory: 'Cash Outflow',
    subCategory: 'Office Rent',
    amount: 75000,
    mode: 'Bank',
    bankName: 'MCB Bank',
    type: 'outflow'
  },
  {
    id: 5,
    date: '2026-01-17',
    mainCategory: 'Cash Outflow',
    subCategory: 'Electricity Bill',
    amount: 12500,
    mode: 'Bank',
    bankName: 'Habib Bank Limited',
    type: 'outflow'
  },
  {
    id: 6,
    date: '2026-01-17',
    mainCategory: 'Cash Inflow',
    subCategory: 'Commission received',
    amount: 35000,
    mode: 'Cash',
    bankName: null,
    type: 'inflow'
  },
];

const StatCard = ({ 
  title, 
  amount, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "blue"
}: { 
  title: string; 
  amount: number; 
  icon: any; 
  trend?: 'up' | 'down'; 
  trendValue?: string;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-[#4f46e5]',
    green: 'bg-green-50 text-[#10b981]',
    red: 'bg-red-50 text-[#ef4444]',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">
              PKR {amount.toLocaleString()}
            </h3>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[#ef4444]" />
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your financial status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Cash Inflow"
          amount={650000}
          icon={ArrowUpRight}
          trend="up"
          trendValue="+12.5%"
          color="green"
        />
        <StatCard
          title="Cash Outflow"
          amount={450000}
          icon={ArrowDownRight}
          trend="down"
          trendValue="-8.2%"
          color="red"
        />
        <StatCard
          title="Cash Balance"
          amount={285000}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Total Bank Balance"
          amount={1850000}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Overall Balance"
          amount={2135000}
          icon={TrendingUp}
          trend="up"
          trendValue="+15.3%"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cashflow Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => `PKR ${value.toLocaleString()}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="inflow" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Cash Inflow"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="outflow" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Cash Outflow"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inflow vs Outflow Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Inflow vs Outflow Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => `PKR ${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Main Category</TableHead>
                <TableHead>Sub Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Bank Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.date}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'inflow' ? 'default' : 'destructive'}>
                      {transaction.mainCategory}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.subCategory}</TableCell>
                  <TableCell className={`font-semibold ${transaction.type === 'inflow' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {transaction.type === 'inflow' ? '+' : '-'} PKR {transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.mode}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{transaction.bankName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
