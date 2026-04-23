// BankBalanceReport.tsx — self-contained, fetches own data from Firestore
import { useState, useMemo, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { Download, Eye, Building2, DollarSign, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Bank = {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
  transactions: any[];
};

export function BankBalanceReport() {
  const [data, setData]           = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy]       = useState<'balance' | 'name'>('balance');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewBank, setViewBank]   = useState<Bank | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [banksSnap, txSnap] = await Promise.all([
          getDocs(collection(db, 'banks')),
          getDocs(collection(db, 'bank_transactions')),
        ]);

        // Group transactions by bankId
        const txByBank: Record<string, any[]> = {};
        txSnap.docs.forEach(d => {
          const t = d.data() as any;
          if (t.bankId) {
            if (!txByBank[t.bankId]) txByBank[t.bankId] = [];
            txByBank[t.bankId].push({ ...t, id: d.id });
          }
        });

        const banks: Bank[] = banksSnap.docs.map(d => {
          const b = d.data() as any;
          const txns = (txByBank[d.id] || []).sort((a: any, x: any) =>
            new Date(x.date).getTime() - new Date(a.date).getTime()
          );
          return {
            id:            d.id,
            name:          b.name          || '—',
            balance:       Number(b.balance) || 0,
            accountNumber: b.accountNumber  || b.account || '—',
            transactions:  txns,
          };
        });
        setData(banks);
      } catch (err) {
        console.error('BankBalanceReport fetch error:', err);
        toast.error('Failed to load bank data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredData = useMemo(() => {
    return [...(data || [])]
      .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => sortBy === 'balance' ? b.balance - a.balance : a.name.localeCompare(b.name));
  }, [data, searchTerm, sortBy]);

  const totalBalance = filteredData.reduce((s, b) => s + b.balance, 0);

  const handleExportCSV = () => {
    const headers = ['Bank Name', 'Account Number', 'Balance'];
    const rows = filteredData.map(b => [b.name, b.accountNumber, b.balance].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `bank-balance-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success('Bank balance report exported');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
      <Loader2 size={28} color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>Loading bank data…</span>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bank Balance Report</h2>
        <p className="text-sm text-gray-600 mt-1">All bank accounts and their current balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Banks',      value: filteredData.length,                                                                    icon: Building2,  color: 'text-[#4f46e5]' },
          { label: 'Total Balance',    value: totalBalance.toLocaleString(),                                                          icon: DollarSign, color: 'text-green-600' },
          { label: 'Positive Balance', value: filteredData.filter(b=>b.balance>0).reduce((s,b)=>s+b.balance,0).toLocaleString(),      icon: TrendingUp, color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className={color} />
              <p className="text-sm text-gray-600">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input type="text" placeholder="Search banks…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'balance' | 'name')}
                className="border border-gray-300 rounded-lg px-3 py-2">
                <option value="balance">Balance</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Bank Name','Account','Balance','Last Transaction','Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No banks found</td></tr>
            ) : filteredData.map(bank => (
              <tr key={bank.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} /> {bank.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{bank.accountNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${bank.balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bank.balance.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {bank.transactions[0] ? new Date(bank.transactions[0].date).toLocaleDateString() : 'No transactions'}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setViewBank(bank)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{viewBank.name}</h3>
              <button onClick={() => setViewBank(null)}><XCircle size={24} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-mono text-lg">{viewBank.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${viewBank.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {viewBank.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent Transactions</p>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {viewBank.transactions.length === 0
                    ? <p className="text-sm text-gray-400">No transactions</p>
                    : viewBank.transactions.slice(0, 5).map((tx: any, idx: number) => (
                      <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                        {new Date(tx.date).toLocaleDateString()} — {tx.description || tx.note || '—'} ({(tx.amount || 0).toLocaleString()})
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}