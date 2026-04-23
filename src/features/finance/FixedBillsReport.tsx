// FixedBillsReport.tsx — self-contained, fetches own data from Firestore
import { useState, useMemo, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { Download, Eye, Calendar, FileText, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type BillRecord = {
  id: string;
  vendorName: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Due' | 'Paid' | 'Overdue';
  category: string;
  repeat: boolean;
};

export function FixedBillsReport() {
  const [data, setData]           = useState<BillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [viewBill, setViewBill]             = useState<BillRecord | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'bills'));
        const records: BillRecord[] = snap.docs.map(d => {
          const b = d.data() as any;
          // Determine status — if stored, use it; otherwise derive from dueDate
          let status: 'Due' | 'Paid' | 'Overdue' = b.status || 'Due';
          if (!b.status && b.dueDate) {
            const due = new Date(b.dueDate);
            status = due < new Date() ? 'Overdue' : 'Due';
          }
          return {
            id:         d.id,
            vendorName: b.vendorName  || b.vendor   || '—',
            billNumber: b.billNumber  || b.billNo   || d.id.slice(0, 8),
            amount:     Number(b.amount) || 0,
            dueDate:    b.dueDate    || new Date().toISOString(),
            paidDate:   b.paidDate   || undefined,
            status,
            category:   b.category   || 'General',
            repeat:     b.repeat     || b.recurring || false,
          };
        });
        setData(records);
      } catch (err) {
        console.error('FixedBillsReport fetch error:', err);
        toast.error('Failed to load bills data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach(b => s.add(b.category));
    return Array.from(s).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return (data || []).filter(b => {
      if (filterCategory && b.category !== filterCategory) return false;
      if (filterStatus   && b.status   !== filterStatus)   return false;
      return true;
    });
  }, [data, filterCategory, filterStatus]);

  const totalDue     = filteredData.filter(b => b.status === 'Due').reduce((s, b) => s + b.amount, 0);
  const totalOverdue = filteredData.filter(b => b.status === 'Overdue').reduce((s, b) => s + b.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Vendor','Bill Number','Category','Amount','Due Date','Status'];
    const rows = filteredData.map(b => [b.vendorName, b.billNumber, b.category, b.amount, b.dueDate, b.status].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `fixed-bills-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success('Fixed bills report exported');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
      <Loader2 size={28} color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>Loading bills…</span>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fixed Bills Report</h2>
        <p className="text-sm text-gray-600 mt-1">Recurring bills, due dates, and payment tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Bills',     value: filteredData.length,              icon: FileText,      color: 'text-[#4f46e5]' },
          { label: 'Overdue Amount',  value: totalOverdue.toLocaleString(),    icon: AlertTriangle, color: 'text-red-600'   },
          { label: 'Due Amount',      value: totalDue.toLocaleString(),        icon: CheckCircle,   color: 'text-yellow-600'},
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2">
                <option value="">All Status</option>
                {['Due','Paid','Overdue'].map(s => <option key={s}>{s}</option>)}
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
              {['Vendor','Bill #','Category','Amount','Due Date','Status','Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No bills found</td></tr>
            ) : filteredData.map(bill => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{bill.vendorName}</td>
                <td className="px-6 py-4 font-mono text-sm">{bill.billNumber}</td>
                <td className="px-6 py-4">{bill.category}</td>
                <td className="px-6 py-4 text-right font-bold">{bill.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    bill.status === 'Due'  ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>{bill.status}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setViewBill(bill)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{viewBill.vendorName}</h3>
              <button onClick={() => setViewBill(null)}><XCircle size={24} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ['Bill Number', viewBill.billNumber],
                ['Category',   viewBill.category],
                ['Due Date',   new Date(viewBill.dueDate).toLocaleDateString()],
                ...(viewBill.paidDate ? [['Paid Date', new Date(viewBill.paidDate).toLocaleDateString()]] : []),
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-sm text-gray-600">{l}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">{viewBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  viewBill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  viewBill.status === 'Due'  ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{viewBill.status}</span>
              </div>
              {viewBill.repeat && (
                <div>
                  <p className="text-sm text-gray-600">Repeat</p>
                  <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Recurring</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}