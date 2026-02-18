import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, Employee, Bank } from '../../App';
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  X,
  CreditCard,
  ArrowUpCircle,
  Search,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export function AllSalariesPage() {
  const navigate = useNavigate();
  const { transactions, setTransactions, employees, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    employees: Employee[];
    banks: Bank[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'regular' | 'advance'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
  const [viewSalary, setViewSalary] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter salary transactions
  const allSalaries = transactions.filter(t => 
    t.mainCategory === 'Salary' ||
    (t.mainCategory === 'Cash Outflow' && t.subCategory === 'Advance Salary')
  );

  const filteredSalaries = allSalaries.filter(salary => {
    const matchesSearch = 
      salary.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.salaryMonth?.includes(searchTerm);
    
    const isAdvance = salary.mainCategory === 'Cash Outflow' && salary.subCategory === 'Advance Salary';
    const matchesType = filterType === 'all' || 
      (filterType === 'regular' && !isAdvance) ||
      (filterType === 'advance' && isAdvance);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && salary.paymentStatus === 'Full') ||
      (filterStatus === 'partial' && salary.paymentStatus === 'Partial') ||
      (filterStatus === 'pending' && !salary.paymentStatus);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this salary record?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Salary record deleted successfully');
    }
  };

  const handlePrint = (salary: Transaction) => {
    toast.success('Printing salary slip...');
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/salary')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">All Salary Records</h2>
              <p className="text-gray-600 mt-1">View and manage all salary payments</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/salary/create-regular')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Pay Regular Salary
            </button>
            <button
              onClick={() => navigate('/salary/create-advance')}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <ArrowUpCircle size={20} />
              Advance Salary
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by employee name, transaction ID, or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              Filters
            </button>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={18} />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="regular">Regular Salary</option>
                  <option value="advance">Advance Salary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid (Full)</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{filteredSalaries.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(filteredSalaries.reduce((sum, s) => sum + s.amount, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Regular Salaries</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredSalaries.filter(s => !(s.mainCategory === 'Cash Outflow' && s.subCategory === 'Advance Salary')).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Advance Salaries</p>
            <p className="text-2xl font-bold text-orange-600">
              {filteredSalaries.filter(s => s.mainCategory === 'Cash Outflow' && s.subCategory === 'Advance Salary').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalaries.map((salary) => {
                  const isAdvance = salary.mainCategory === 'Cash Outflow' && salary.subCategory === 'Advance Salary';
                  
                  return (
                    <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(salary.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {salary.transactionId || salary.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {salary.employeeName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          isAdvance 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isAdvance ? (
                            <><ArrowUpCircle size={12} /> Advance</>
                          ) : (
                            <><CreditCard size={12} /> Regular</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salary.salaryMonth || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(salary.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          salary.paymentStatus === 'Full' 
                            ? 'bg-green-100 text-green-800' 
                            : salary.paymentStatus === 'Partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {salary.paymentStatus === 'Full' ? 'Paid' : salary.paymentStatus === 'Partial' ? 'Partial' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {salary.mode}{salary.bankName ? ` (${salary.bankName})` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewSalary(salary)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/salary/${salary.id}/edit`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handlePrint(salary)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Print"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/salary/${salary.id}/delete`)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSalaries.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No salary records found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new salary payment</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {viewSalary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Salary Details</h3>
                <button 
                  onClick={() => setViewSalary(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-medium font-mono">{viewSalary.transactionId || viewSalary.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{formatDate(viewSalary.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee</p>
                    <p className="font-medium text-blue-600">{viewSalary.employeeName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary Month</p>
                    <p className="font-medium">{viewSalary.salaryMonth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-medium">{formatCurrency(viewSalary.baseSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commission</p>
                    <p className="font-medium text-green-600">+{formatCurrency(viewSalary.commission || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deductions</p>
                    <p className="font-medium text-red-600">-{formatCurrency(viewSalary.deductions || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className="font-bold text-lg text-blue-600">{formatCurrency(viewSalary.netAmount || viewSalary.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid By</p>
                    <p className="font-medium">{viewSalary.paidBy || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{viewSalary.mode}{viewSalary.bankName ? ` (${viewSalary.bankName})` : ''}</p>
                  </div>
                </div>
                {viewSalary.note && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-1">Note</p>
                    <p className="font-medium">{viewSalary.note}</p>
                  </div>
                )}
                {viewSalary.imageUrl && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Receipt</p>
                    <img src={viewSalary.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
