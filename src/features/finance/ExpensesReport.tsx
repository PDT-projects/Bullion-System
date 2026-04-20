import { useState, useMemo } from 'react';
import { Download, Eye, Calendar, DollarSign, TrendingDown, Receipt, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Expense = {
  id: string;
  date: string;
  transactionId: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode: 'Cash' | 'Bank';
  bankName?: string;
  notes?: string;
  performedBy?: string;
};

interface ExpensesReportProps {
  data: Expense[];
}

export function ExpensesReport({ data }: ExpensesReportProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    data.forEach(exp => catSet.add(exp.subCategory));
    return Array.from(catSet).sort();
  }, [data]);

  const modes = ['Cash', 'Bank'];

  const filteredData = useMemo(() => {
    return data.filter(exp => {
      if (selectedCategory && exp.subCategory !== selectedCategory) return false;
      if (selectedMode && exp.mode !== selectedMode) return false;
      return true;
    });
  }, [data, selectedCategory, selectedMode]);

  const getModeIcon = (mode: string) => {
    return mode === 'Cash' ? <DollarSign size={16} className="text-black" /> : <TrendingDown size={16} className="text-black" />;
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'ID', 'Category', 'Amount', 'Mode', 'Bank', 'Notes'];
    const rows = filteredData.map(exp => [
      new Date(exp.date).toLocaleDateString('en-PK'),
      exp.transactionId,
      exp.subCategory,
      exp.amount.toString(),
      exp.mode,
      exp.bankName || '',
      exp.notes || ''
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Expenses exported');
  };

  return (
    <div className="w-full bg-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-black mb-4">Expenses Report</h2>
          <p className="text-xl text-black">All expense transactions categorized and tracked</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <TrendingDown size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Total Expenses</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{filteredData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <Receipt size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Transactions</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{filteredData.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <DollarSign size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Cash Expenses</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{filteredData.filter(e => e.mode === 'Cash').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-white p-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-lg font-semibold text-black mb-3">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-lg font-semibold text-black mb-3">Mode</label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <option value="">All Modes</option>
                    {modes.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-gray-800 transition-all whitespace-nowrap"
              >
                <Download size={24} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Date</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">ID</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Category</th>
                <th className="px-8 py-6 text-right text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Amount</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Mode</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="text-2xl text-black opacity-50">No expenses found</div>
                  </td>
                </tr>
              ) : (
                filteredData.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6 border-r border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                          <Calendar size={20} className="text-black" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-black">{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 border-r border-gray-200 font-mono text-lg font-semibold text-black">
                      {exp.transactionId}
                    </td>
                    <td className="px-8 py-6 border-r border-gray-200 font-semibold text-lg text-black">
                      {exp.subCategory}
                    </td>
                    <td className="px-8 py-6 border-r border-gray-200 text-right font-bold text-2xl text-black">
                      {exp.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 border-r border-gray-200">
                      <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-semibold bg-gray-100 text-black shadow-sm">
                        {getModeIcon(exp.mode)}
                        {exp.mode}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setViewExpense(exp)} 
                        className="p-4 text-black hover:bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-semibold"
                      >
                        <Eye size={22} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}