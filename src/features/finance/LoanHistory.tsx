import { useState } from 'react';
import { Loan } from '../App';
import { Printer, Download, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type LoanHistoryProps = {
  loans: Loan[];
};

export function LoanHistory({ loans }: LoanHistoryProps) {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const handlePrint = (loan: Loan) => {
    toast.success('Printing loan slip');
    window.print();
  };

  const handleDownload = (loan: Loan) => {
    toast.success('Downloading loan slip');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    return type === 'Receivable' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'Full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const filteredLoans = loans.filter(loan => {
    if (filterType && loan.type !== filterType) return false;
    if (filterStatus && loan.status !== filterStatus) return false;
    return true;
  });

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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Types</option>
              <option value="Receivable">Receivable (Given)</option>
              <option value="Payable">Payable (Taken)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Status</option>
              <option value="Full">Fully Paid</option>
              <option value="Partial">Partially Paid</option>
            </select>
          </div>
        </div>
        {(filterType || filterStatus) && (
          <button
            onClick={() => {
              setFilterType('');
              setFilterStatus('');
            }}
            className="mt-3 text-sm text-[#4f46e5] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Loans</p>
          <p className="text-2xl font-bold text-gray-900">{filteredLoans.length}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-[#4f46e5]">
            {formatCurrency(filteredLoans.reduce((sum, l) => sum + l.loanAmount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(filteredLoans.reduce((sum, l) => sum + l.paid, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Remaining</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(filteredLoans.reduce((sum, l) => sum + l.remaining, 0))}
          </p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(loan.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(loan.type)}`}>
                      {loan.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {loan.loanType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {loan.bankName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(loan.loanAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {formatCurrency(loan.paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(loan.remaining)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(loan)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print Slip"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(loan)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Slip"
                      >
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
