// SalariesReport.tsx — self-contained, fetches own data from Firestore
import { useState, useMemo, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { Download, Eye, Users, DollarSign, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type SalaryRecord = {
  id: string;
  employeeName: string;
  salaryMonth: string;
  baseSalary: number;
  commission: number;
  deductions: number;
  netAmount: number;
  paymentStatus: string;
};

export function SalariesReport() {
  const [data, setData]           = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMonth, setFilterMonth]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewRecord, setViewRecord]     = useState<SalaryRecord | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'salaries'));
        const records: SalaryRecord[] = snap.docs.map(d => {
          const r = d.data() as any;
          return {
            id:            d.id,
            employeeName:  r.employeeName  || r.employee?.name || '—',
            salaryMonth:   r.salaryMonth   || r.month          || '—',
            baseSalary:    Number(r.baseSalary)  || 0,
            commission:    Number(r.commission)  || 0,
            deductions:    Number(r.deductions)  || 0,
            netAmount:     Number(r.netAmount || r.amount) || 0,
            paymentStatus: r.paymentStatus || r.status || 'Pending',
          };
        });
        setData(records);
      } catch (err) {
        console.error('SalariesReport fetch error:', err);
        toast.error('Failed to load salaries data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const months = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach(r => s.add(r.salaryMonth));
    return Array.from(s).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return (data || []).filter(r => {
      if (filterMonth  && r.salaryMonth    !== filterMonth)  return false;
      if (filterStatus && r.paymentStatus  !== filterStatus) return false;
      return true;
    });
  }, [data, filterMonth, filterStatus]);

  const totalPayroll  = filteredData.reduce((s, r) => s + r.netAmount, 0);
  const pendingTotal  = filteredData.filter(r => r.paymentStatus === 'Pending').reduce((s, r) => s + r.netAmount, 0);

  const handleExportCSV = () => {
    const headers = ['Employee', 'Month', 'Base Salary', 'Commission', 'Deductions', 'Net Amount', 'Status'];
    const rows = filteredData.map(r => [
      r.employeeName, r.salaryMonth, r.baseSalary, r.commission, r.deductions, r.netAmount, r.paymentStatus
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `salaries-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success('Salaries report exported');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
      <Loader2 size={28} color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>Loading salaries…</span>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-black mb-4">Salaries Report</h2>
          <p className="text-xl text-black">Employee payroll, payments, and status tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Employees Paid', value: filteredData.filter(r => r.paymentStatus === 'Paid').length, Icon: Users },
            { label: 'Total Payroll',  value: totalPayroll.toLocaleString(),  Icon: DollarSign },
            { label: 'Pending Payroll',value: pendingTotal.toLocaleString(),  Icon: TrendingUp },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
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
                <label className="block text-lg font-semibold text-black mb-3">Month</label>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white">
                  <option value="">All Months</option>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-lg font-semibold text-black mb-3">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white">
                  <option value="">All Status</option>
                  {['Paid','Pending','Partial'].map(s => <option key={s}>{s}</option>)}
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
                {['Employee','Month','Base Salary','Commission','Deductions','Net Amount','Status','Actions'].map(h => (
                  <th key={h} className="px-8 py-6 text-left text-lg font-bold text-black uppercase border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center text-2xl text-black opacity-50">No salary records found</td></tr>
              ) : filteredData.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-8 py-6 font-semibold text-lg text-black border-r border-gray-200">{record.employeeName}</td>
                  <td className="px-8 py-6 text-lg text-black border-r border-gray-200">{record.salaryMonth}</td>
                  <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">{record.baseSalary.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">{record.commission.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">-{record.deductions.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-bold text-2xl text-black border-r border-gray-200">{record.netAmount.toLocaleString()}</td>
                  <td className="px-8 py-6 border-r border-gray-200">
                    <span className="inline-flex px-4 py-2 rounded-full text-lg font-semibold bg-gray-100 text-black">{record.paymentStatus}</span>
                  </td>
                  <td className="px-8 py-6">
                    <button onClick={() => setViewRecord(record)} className="p-3 text-black hover:bg-gray-100 rounded-xl flex items-center gap-2 font-medium">
                      <Eye size={20} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewRecord && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-8 border-b border-gray-200">
                <h3 className="text-3xl font-bold text-black">{viewRecord.employeeName}</h3>
                <button onClick={() => setViewRecord(null)} className="p-3 rounded-xl hover:bg-gray-100">
                  <XCircle size={28} className="text-black" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  {[
                    ['Month',        viewRecord.salaryMonth],
                    ['Base Salary',  viewRecord.baseSalary.toLocaleString()],
                    ['Commission',   viewRecord.commission.toLocaleString()],
                    ['Deductions',   `-${viewRecord.deductions.toLocaleString()}`],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-lg font-semibold text-black mb-2">{l}</p>
                      <p className="text-2xl font-bold text-black">{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-lg font-semibold text-black mb-4">Net Amount</p>
                  <p className="text-5xl font-bold text-black">{viewRecord.netAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-black mb-4">Status</p>
                  <span className="inline-flex px-6 py-3 rounded-full text-xl font-bold bg-gray-100 text-black shadow-lg">{viewRecord.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}