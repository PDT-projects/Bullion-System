import { useState } from 'react';
import { FileText, DollarSign, Percent, Calendar, MapPin, User, Filter, X } from 'lucide-react';

type Commission = {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string; // Format: "YYYY-MM"
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
  isLocked: boolean;
};

type CommissionReportProps = {
  commissions: Commission[];
};

export function CommissionReport({ commissions }: CommissionReportProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    salesperson: '',
    city: '',
    month: '',
    status: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const filteredCommissions = commissions.filter(commission => {
    return (
      (filters.salesperson === '' || commission.salespersonName.toLowerCase().includes(filters.salesperson.toLowerCase())) &&
      (filters.city === '' || commission.city.toLowerCase().includes(filters.city.toLowerCase())) &&
      (filters.month === '' || commission.month.includes(filters.month)) &&
      (filters.status === '' || commission.status === filters.status)
    );
  });

  const clearFilters = () => {
    setFilters({
      salesperson: '',
      city: '',
      month: '',
      status: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={28} />
            Commission Report
          </h2>
          <p className="text-sm text-gray-600 mt-1">View and analyze commission payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
            </div>
            <FileText size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(commissions.reduce((sum, c) => sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 0))}
              </p>
            </div>
            <DollarSign size={24} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {commissions.filter(c => c.status === 'Confirmed').length}
              </p>
            </div>
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {commissions.length > 0
                  ? `${(commissions.reduce((sum, c) => sum + (c.overriddenCommissionPercentage || c.commissionPercentage), 0) / commissions.length).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <Percent size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeFilterCount > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                Salesperson
              </label>
              <input
                type="text"
                value={filters.salesperson}
                onChange={(e) => setFilters({ ...filters, salesperson: e.target.value })}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                City
              </label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Month
              </label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Calculated">Calculated</option>
                <option value="Adjusted">Adjusted</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Commission Report Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Commission Details</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredCommissions.length} of {commissions.length} commissions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  <User size={14} className="inline mr-1" />
                  Salesperson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  <MapPin size={14} className="inline mr-1" />
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  <Calendar size={14} className="inline mr-1" />
                  Month
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  <DollarSign size={14} className="inline mr-1" />
                  Total Sales
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Applied Slab
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  <Percent size={14} className="inline mr-1" />
                  Commission %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  <DollarSign size={14} className="inline mr-1" />
                  Commission Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Calculated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Confirmed By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No commission data found</p>
                    <p className="text-sm">Try adjusting your filters or calculate commissions first.</p>
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {commission.salespersonName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{commission.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatMonth(commission.month)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(commission.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {formatCurrency(commission.appliedSlabFrom)} - {formatCurrency(commission.appliedSlabTo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {commission.overriddenCommissionPercentage || commission.commissionPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.calculatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.confirmedBy || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
