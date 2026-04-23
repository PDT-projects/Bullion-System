// ExpensesReport.tsx — self-contained, fetches own data from Firestore
import { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { Download, Eye, Calendar, DollarSign, TrendingDown, Receipt, XCircle, Loader2 } from 'lucide-react';
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

export function ExpensesReport() {
  const [data, setData]           = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMode, setSelectedMode]         = useState('');
  const [viewExpense, setViewExpense]           = useState<Expense | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const q    = query(collection(db, 'transactions'), where('mainCategory', '==', 'Cash Outflow'));
        const snap = await getDocs(q);
        const records: Expense[] = snap.docs.map(d => {
          const r = d.data() as any;
          return {
            id:            d.id,
            date:          r.date          || r.createdAt || new Date().toISOString(),
            transactionId: r.transactionId || d.id.slice(0, 8),
            mainCategory:  r.mainCategory  || 'Cash Outflow',
            subCategory:   r.subCategory   || '—',
            amount:        Number(r.amount) || 0,
            mode:          (r.mode as 'Cash' | 'Bank') || 'Cash',
            bankName:      r.bankName  || '',
            notes:         r.note || r.notes || '',
            performedBy:   r.performedBy || '',
          };
        });
        // Sort newest first
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setData(records);
      } catch (err) {
        console.error('ExpensesReport fetch error:', err);
        toast.error('Failed to load expenses data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach(e => s.add(e.subCategory));
    return Array.from(s).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return (data || []).filter(e => {
      if (selectedCategory && e.subCategory !== selectedCategory) return false;
      if (selectedMode     && e.mode        !== selectedMode)     return false;
      return true;
    });
  }, [data, selectedCategory, selectedMode]);

  const handleExportCSV = () => {
    const headers = ['Date', 'ID', 'Category', 'Amount', 'Mode', 'Bank', 'Notes'];
    const rows = filteredData.map(e => [
      new Date(e.date).toLocaleDateString('en-PK'),
      e.transactionId, e.subCategory, e.amount, e.mode, e.bankName || '', e.notes || ''
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `expenses-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success('Expenses exported');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
      <Loader2 size={28} color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>Loading expenses…</span>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-black mb-4">Expenses Report</h2>
          <p className="text-xl text-black">All expense transactions categorized and tracked</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Expenses',  value: filteredData.reduce((s,e)=>s+e.amount,0).toLocaleString(), Icon: TrendingDown },
            { label: 'Transactions',    value: filteredData.length,                                         Icon: Receipt     },
            { label: 'Cash Expenses',   value: filteredData.filter(e=>e.mode==='Cash').reduce((s,e)=>s+e.amount,0).toLocaleString(), Icon: DollarSign },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                  <Icon size={28} className="text-black" />
                </div>
                <p className="text-lg font-semibold text-black opacity-80">{label}</p>
              </div>
              <p className="text-4xl font-bold text-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8 p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-lg font-semibold text-black mb-3">Category</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white">
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-lg font-semibold text-black mb-3">Mode</label>
                <select value={selectedMode} onChange={e => setSelectedMode(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white">
                  <option value="">All Modes</option>
                  {['Cash','Bank'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleExportCSV}
              className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-800">
              <Download size={24} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Date','ID','Category','Amount','Mode','Actions'].map(h => (
                  <th key={h} className="px-8 py-6 text-left text-lg font-bold text-black uppercase border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-2xl text-black opacity-50">No expenses found</td></tr>
              ) : filteredData.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6 border-r border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                        <Calendar size={20} className="text-black" />
                      </div>
                      <p className="text-lg font-semibold text-black">{new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 border-r border-gray-200 font-mono text-lg font-semibold text-black">{exp.transactionId}</td>
                  <td className="px-8 py-6 border-r border-gray-200 font-semibold text-lg text-black">{exp.subCategory}</td>
                  <td className="px-8 py-6 border-r border-gray-200 text-right font-bold text-2xl text-black">{exp.amount.toLocaleString()}</td>
                  <td className="px-8 py-6 border-r border-gray-200">
                    <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-semibold bg-gray-100 text-black">
                      {exp.mode === 'Cash' ? <DollarSign size={16} /> : <TrendingDown size={16} />}
                      {exp.mode}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button onClick={() => setViewExpense(exp)}
                      className="p-4 text-black hover:bg-gray-100 rounded-xl flex items-center gap-2 font-semibold">
                      <Eye size={22} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewExpense && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center p-8 border-b">
                <h3 className="text-2xl font-bold">{viewExpense.subCategory}</h3>
                <button onClick={() => setViewExpense(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                {[
                  ['Date',     new Date(viewExpense.date).toLocaleDateString()],
                  ['ID',       viewExpense.transactionId],
                  ['Category', viewExpense.subCategory],
                  ['Mode',     viewExpense.mode],
                  ['Bank',     viewExpense.bankName || '—'],
                  ['Notes',    viewExpense.notes    || '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-sm text-gray-500">{l}</p>
                    <p className="font-semibold text-gray-900">{v}</p>
                  </div>
                ))}
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-4xl font-bold text-black">{viewExpense.amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}