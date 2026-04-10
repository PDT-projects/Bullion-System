import { useState, useMemo } from 'react';
import { Filter, Download, Eye, Calendar, FileText, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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

interface FixedBillsReportProps {
  data: BillRecord[];
}

export function FixedBillsReport({ data }: FixedBillsReportProps) {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewBill, setViewBill] = useState<BillRecord | null>(null);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    data.forEach(bill => catSet.add(bill.category));
    return Array.from(catSet).sort();
  }, [data]);

  const statuses = ['Due', 'Paid', 'Overdue'];

  const filteredData = useMemo(() => {
    return data.filter(bill => {
      if (filterCategory && bill.category !== filterCategory) return false;
      if (filterStatus && bill.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterCategory, filterStatus]);

  const totalDue = filteredData.filter(b => b.status === 'Due').reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = filteredData.filter(b => b.status === 'Overdue').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = filteredData.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Vendor', 'Bill Number', 'Category', 'Amount', 'Due Date', 'Status'];
    const rows = filteredData.map(bill => [
      bill.vendorName,
      bill.billNumber,
      bill.category,
      bill.amount.toString(),
      bill.dueDate,
      bill.status
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixed-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Fixed bills report exported');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fixed Bills Report</h2>
        <p className="text-sm text-gray-600 mt-1">Recurring bills, due dates, and payment tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Bills</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{filteredData.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Overdue Amount</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Due Today</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{totalDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No bills found
                </td>
              </tr>
            ) : (
              filteredData.map((bill) => (
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
                      bill.status === 'Due' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setViewBill(bill)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{viewBill.vendorName}</h3>
              <button onClick={() => setViewBill(null)}>
                <XCircle size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Bill Number</p>
                <p className="font-mono">{viewBill.billNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{viewBill.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">{viewBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p>{new Date(viewBill.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  viewBill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  viewBill.status === 'Due' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {viewBill.status}
                </span>
              </div>
              {viewBill.paidDate && (
                <div>
                  <p className="text-sm text-gray-600">Paid Date</p>
                  <p>{new Date(viewBill.paidDate).toLocaleDateString()}</p>
                </div>
              )}
              {viewBill.repeat && (
                <div>
                  <p className="text-sm text-gray-600">Repeat</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Recurring
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

