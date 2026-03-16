// LoanHistory.tsx
// Updated to match actual Loan type from LoanFirebaseService:
//   - uses receiverName (not employeeName) as primary display name
//   - handles paymentHistory array

import { useState } from 'react';
import { Printer, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

type Loan = {
  id: string;
  entityName: string;
  receiverName: string;
  receiverType: 'Employee' | 'Person';
  loanAmount: number;
  paid: number;
  remaining: number;
  type: 'Payable' | 'Receivable';
  loanType: string;
  status: 'Full' | 'Partial';
  date: string;
  mode: string;
  bankName?: string;
  employeeName?: string;
  paymentHistory?: any[];
  notes?: string;
};

type LoanHistoryProps = { loans: Loan[] };

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v);

const typeColor   = (t: string) => t === 'Receivable' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
const statusColor = (s: string) => s === 'Full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

export function LoanHistory({ loans }: LoanHistoryProps) {
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = loans.filter(l => {
    if (filterType   && l.type   !== filterType)   return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  const handlePrint    = () => { toast.success('Printing loan slip'); window.print(); };
  const handleDownload = () =>   toast.success('Downloading loan slip');

  const totals = {
    amount:    filtered.reduce((s, l) => s + l.loanAmount, 0),
    paid:      filtered.reduce((s, l) => s + l.paid,       0),
    remaining: filtered.reduce((s, l) => s + l.remaining,  0),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Loan History</h2>
        <p className="text-sm text-gray-600 mt-1">Complete record of all loans and advances</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
              <option value="">All Types</option>
              <option value="Receivable">Receivable (Given)</option>
              <option value="Payable">Payable (Taken)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
              <option value="">All Status</option>
              <option value="Full">Fully Paid</option>
              <option value="Partial">Partially Paid</option>
            </select>
          </div>
        </div>
        {(filterType || filterStatus) && (
          <button onClick={() => { setFilterType(''); setFilterStatus(''); }}
            className="mt-3 text-sm text-[#4f46e5] hover:underline">Clear filters</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Loans',     value: filtered.length,       fmt: false, color: 'text-gray-900' },
          { label: 'Total Amount',    value: totals.amount,          fmt: true,  color: 'text-[#4f46e5]' },
          { label: 'Total Paid',      value: totals.paid,            fmt: true,  color: 'text-green-600' },
          { label: 'Total Remaining', value: totals.remaining,       fmt: true,  color: 'text-red-600' },
        ].map(({ label, value, fmt, color }) => (
          <div key={label} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>
              {fmt ? formatCurrency(value as number) : value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Name', 'Type', 'Category', 'Bank', 'Amount', 'Paid', 'Remaining', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">No loans found</td>
                </tr>
              ) : filtered.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(loan.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.receiverName || loan.entityName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor(loan.type)}`}>
                      {loan.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.loanType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.bankName || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(loan.paid)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatCurrency(loan.remaining)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={handlePrint}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Print">
                        <Printer size={16} />
                      </button>
                      <button onClick={handleDownload}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}