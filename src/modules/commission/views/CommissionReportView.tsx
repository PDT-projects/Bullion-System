// Commission Report View - Presentational Component
// UPDATED: Shows salary linkage status badge on each commission row

import { Download, Filter, FileText, TrendingUp, DollarSign, CheckCircle, Receipt, Link, AlertCircle, Clock } from 'lucide-react';
import type { Commission, CommissionFilter, CommissionStats } from '../models/types';
import type { SalaryLinkStatus } from '../viewModels/useCommissionReportViewModel';

interface CommissionReportViewProps {
  commissions:         Commission[];
  filteredCommissions: Commission[];
  isLoading:           boolean;
  filters:             CommissionFilter;
  updateFilter:        (key: keyof CommissionFilter, value: string) => void;
  clearFilters:        () => void;
  activeFilterCount:   number;
  showFilters:         boolean;
  setShowFilters:      (show: boolean) => void;
  stats:               CommissionStats;
  refreshCommissions:  () => void;
  exportToCSV:         () => string;
  formatCurrency:      (amount: number) => string;
  formatMonth:         (monthStr: string) => string;
  cities:              readonly string[];
  employees:           any[];
  getSalaryLinkStatus: (commission: Commission) => SalaryLinkStatus;
  salaryLinkLoading:   boolean;
}

function SalaryLinkBadge({ status }: { status: SalaryLinkStatus }) {
  if (status === 'not-confirmed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
      <Clock size={9} /> Not confirmed
    </span>
  );
  if (status === 'linked') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
      <Link size={9} /> Linked to salary
    </span>
  );
  if (status === 'salary-exists-no-commission') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
      <AlertCircle size={9} /> Salary exists, not linked
    </span>
  );
  // no-salary
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
      <Clock size={9} /> Salary not created
    </span>
  );
}

export function CommissionReportView({
  commissions, filteredCommissions, isLoading,
  filters, updateFilter, clearFilters, activeFilterCount,
  showFilters, setShowFilters, stats,
  exportToCSV, formatCurrency, formatMonth, cities, employees,
  getSalaryLinkStatus, salaryLinkLoading,
}: CommissionReportViewProps) {

  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || id;

  const handleExport = () => {
    const csv  = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalInvoicesInReport = filteredCommissions.reduce(
    (sum, c) => sum + (c.invoiceCount ?? 0), 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Report</h1>
          <p className="text-gray-600 mt-1">Full history of all commission records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Commissions</span>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCommissions}</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Invoices</span>
            <Receipt className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalInvoicesInReport}</div>
          <p className="text-xs text-gray-500">across filtered records</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Amount</span>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Confirmed</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.confirmedCount}</div>
          <p className="text-xs text-gray-500">
            {stats.totalCommissions > 0
              ? Math.round((stats.confirmedCount / stats.totalCommissions) * 100)
              : 0}% of total
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Average Rate</span>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.averageRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salesperson</label>
              <select
                value={filters.salesperson || ''}
                onChange={(e) => updateFilter('salesperson', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">All Salespeople</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <select
                value={filters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={filters.month || ''}
                onChange={(e) => updateFilter('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">All Statuses</option>
                <option value="Calculated">Calculated</option>
                <option value="Adjusted">Adjusted</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Commission Records</h3>
          <span className="text-sm text-gray-600">
            Showing {filteredCommissions.length} of {commissions.length}
          </span>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]" />
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No commission records found. Try adjusting your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoices</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Slab</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getEmployeeName(commission.salesperson)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{commission.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatMonth(commission.month)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          <Receipt size={11} />{commission.invoiceCount ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(commission.totalSales)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatCurrency(commission.appliedSlabFrom)} – {formatCurrency(commission.appliedSlabTo)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {commission.overriddenCommissionPercentage ?? commission.commissionPercentage}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          commission.status === 'Confirmed' ? 'bg-green-100 text-green-800'
                          : commission.status === 'Adjusted' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {salaryLinkLoading ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <SalaryLinkBadge status={getSalaryLinkStatus(commission)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}