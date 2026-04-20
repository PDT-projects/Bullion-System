import { useState, useMemo } from 'react';
import { Filter, Download, Eye, Calendar, Users, DollarSign, TrendingUp, XCircle } from 'lucide-react';
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

interface SalariesReportProps {
  data: SalaryRecord[];
}

export function SalariesReport({ data }: SalariesReportProps) {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewRecord, setViewRecord] = useState<SalaryRecord | null>(null);

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    data.forEach(record => monthSet.add(record.salaryMonth));
    return Array.from(monthSet).sort();
  }, [data]);

  const statuses = ['Paid', 'Pending', 'Partial'];

  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (filterMonth && record.salaryMonth !== filterMonth) return false;
      if (filterStatus && record.paymentStatus !== filterStatus) return false;
      return true;
    });
  }, [data, filterMonth, filterStatus]);

  const totalPayroll = filteredData.reduce((sum, record) => sum + record.netAmount, 0);
  const paidTotal = filteredData.filter(r => r.paymentStatus === 'Paid').reduce((sum, r) => sum + r.netAmount, 0);
  const pendingTotal = filteredData.filter(r => r.paymentStatus === 'Pending').reduce((sum, r) => sum + r.netAmount, 0);

  const handleExportCSV = () => {
    const headers = ['Employee', 'Month', 'Base Salary', 'Commission', 'Deductions', 'Net Amount', 'Status'];
    const rows = filteredData.map(record => [
      record.employeeName,
      record.salaryMonth,
      record.baseSalary.toString(),
      record.commission.toString(),
      record.deductions.toString(),
      record.netAmount.toString(),
      record.paymentStatus
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salaries-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Salaries report exported');
  };

  return (
    <div className="w-full bg-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-black mb-4">Salaries Report</h2>
          <p className="text-xl text-black">Employee payroll, payments, and status tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <Users size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Employees Paid</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{filteredData.filter(r => r.paymentStatus === 'Paid').length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <DollarSign size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Total Payroll</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{totalPayroll.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center">
                <TrendingUp size={28} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black opacity-80">Pending Payroll</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-black">{pendingTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-white p-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-lg font-semibold text-black mb-3">Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <option value="">All Months</option>
                    {months.map(month => <option key={month}>{month}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-lg font-semibold text-black mb-3">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <option value="">All Status</option>
                    {statuses.map(status => <option key={status}>{status}</option>)}
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
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Employee</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Month</th>
                <th className="px-8 py-6 text-right text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Base Salary</th>
                <th className="px-8 py-6 text-right text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Commission</th>
                <th className="px-8 py-6 text-right text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Deductions</th>
                <th className="px-8 py-6 text-right text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Net Amount</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Status</th>
                <th className="px-8 py-6 text-left text-lg font-bold text-black uppercase tracking-wide border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="text-2xl text-black opacity-50">No salary records found</div>
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6 font-semibold text-lg text-black border-r border-gray-200">
                      {record.employeeName}
                    </td>
                    <td className="px-8 py-6 text-lg text-black border-r border-gray-200">
                      {record.salaryMonth}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">
                      {record.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">
                      {record.commission.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-xl text-black border-r border-gray-200">
                      -{record.deductions.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-2xl text-black border-r border-gray-200">
                      {record.netAmount.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 border-r border-gray-200">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold bg-gray-100 text-black shadow-sm">
                        {record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setViewRecord(record)} 
                        className="p-3 text-black hover:bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <Eye size={20} />
                        <span className="font-medium">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {viewRecord && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-8 border-b border-gray-200">
                <h3 className="text-3xl font-bold text-black">{viewRecord.employeeName}</h3>
                <button onClick={() => setViewRecord(null)} className="p-3 rounded-xl hover:bg-gray-100 transition-all">
                  <XCircle size={28} className="text-black" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-lg font-semibold text-black mb-2">Month</p>
                    <p className="text-2xl font-bold text-black">{viewRecord.salaryMonth}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-black mb-2">Base Salary</p>
                    <p className="text-2xl font-bold text-black">{viewRecord.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-black mb-2">Commission</p>
                    <p className="text-2xl font-bold text-black">{viewRecord.commission.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-black mb-2">Deductions</p>
                    <p className="text-2xl font-bold text-black">-{viewRecord.deductions.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-black mb-4">Net Amount</p>
                  <p className="text-5xl font-bold text-black">{viewRecord.netAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-black mb-4">Status</p>
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold bg-gray-100 text-black shadow-lg">
                    {viewRecord.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}