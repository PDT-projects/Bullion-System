import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Percent,
  TrendingUp,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type Commission = {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string;
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: 'Calculated' | 'Adjusted' | 'Confirmed';
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
};

export function CommissionReportsPage() {
  const navigate = useNavigate();
  const { commissions, employees } = useOutletContext<{
    commissions: Commission[];
    employees: any[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Calculated' | 'Adjusted' | 'Confirmed'>('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [viewCommission, setViewCommission] = useState<Commission | null>(null);

  // Get unique cities and months for filters
  const uniqueCities = Array.from(new Set(commissions.map(c => c.city))).sort();
  const uniqueMonths = Array.from(new Set(commissions.map(c => c.month))).sort().reverse();

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = 
      commission.salespersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !cityFilter || commission.city === cityFilter;
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesMonth = !monthFilter || commission.month === monthFilter;
    return matchesSearch && matchesCity && matchesStatus && matchesMonth;
  });

  const handlePrint = () => {
    toast.success('Printing commission report...');
    window.print();
  };

  const handleExport = () => {
    toast.success('Exporting commission report to CSV...');
    // CSV export logic would go here
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  // Calculate stats
  const totalSales = filteredCommissions.reduce((sum, c) => sum + c.totalSales, 0);
  const totalCommission = filteredCommissions.reduce((sum, c) => 
    sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 0
  );
  const confirmedCount = filteredCommissions.filter(c => c.status === 'Confirmed').length;
  const adjustedCount = filteredCommissions.filter(c => c.status === 'Adjusted').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/commission')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Commission Reports</h2>
              <p className="text-gray-600 mt-1">View all calculated and confirmed commissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Records</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredCommissions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Total Sales</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Total Commission</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommission)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Confirmed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Adjusted</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{adjustedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search salesperson..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Month
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Months</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>{formatMonth(month)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="Calculated">Calculated</option>
                <option value="Adjusted">Adjusted</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {commission.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {commission.salespersonName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <MapPin size={12} className="mr-1" />
                        {commission.city}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatMonth(commission.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(commission.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <Percent size={12} className="mr-1" />
                        {commission.overriddenCommissionPercentage || commission.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(commission.overriddenCommissionAmount || commission.calculatedCommissionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        commission.status === 'Confirmed'
                          ? 'bg-green-100 text-green-800'
                          : commission.status === 'Adjusted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => setViewCommission(commission)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCommissions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No commission records found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or calculate new commissions</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {viewCommission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Commission Details</h3>
                <button 
                  onClick={() => setViewCommission(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Commission ID</p>
                    <p className="font-medium font-mono">{viewCommission.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewCommission.status === 'Confirmed'
                        ? 'bg-green-100 text-green-800'
                        : viewCommission.status === 'Adjusted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {viewCommission.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salesperson</p>
                    <p className="font-medium">{viewCommission.salespersonName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium">{viewCommission.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Month</p>
                    <p className="font-medium">{formatMonth(viewCommission.month)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="font-medium">{formatCurrency(viewCommission.totalSales)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Applied Slab</p>
                  <p className="font-medium">
                    {formatCurrency(viewCommission.appliedSlabFrom)} - {formatCurrency(viewCommission.appliedSlabTo)}
                  </p>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Commission Percentage</p>
                    <p className="font-medium">
                      {viewCommission.overriddenCommissionPercentage || viewCommission.commissionPercentage}%
                      {viewCommission.overriddenCommissionPercentage && (
                        <span className="text-xs text-yellow-600 ml-2">(Adjusted)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commission Amount</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(viewCommission.overriddenCommissionAmount || viewCommission.calculatedCommissionAmount)}
                      {viewCommission.overriddenCommissionAmount && (
                        <span className="text-xs text-yellow-600 ml-2">(Adjusted)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Calculated By</p>
                    <p className="font-medium">{viewCommission.calculatedBy}</p>
                    <p className="text-xs text-gray-500">{formatDate(viewCommission.calculatedAt)}</p>
                  </div>
                  {viewCommission.confirmedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Confirmed By</p>
                      <p className="font-medium">{viewCommission.confirmedBy}</p>
                      <p className="text-xs text-gray-500">{viewCommission.confirmedAt ? formatDate(viewCommission.confirmedAt) : ''}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
