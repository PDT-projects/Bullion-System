// Salary Module - View Layer
// SalaryListView - Main list page with filters

import {
  Plus,
  Filter,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Search,
  CreditCard,
  Printer,
  FileText,
  TrendingUp,
  X
} from 'lucide-react';
import { Salary, SalaryFilters as SalaryFiltersType } from '../models/types';
import { SalaryService } from '../models/salaryService';

interface SalaryListViewProps {
  salaries: Salary[];
  allSalaries: Salary[];
  filters: SalaryFiltersType;
  showFilters: boolean;
  activeFilterCount: number;
  viewingSalary: Salary | null;
  isLoading: boolean;
  stats: {
    totalRecords: number;
    totalAmount: number;
    regularCount: number;
    regularTotal: number;
    advanceCount: number;
    advanceTotal: number;
    thisMonthTotal: number;
    pendingSlips: number;
  };
  uniqueEmployees: { id: string; name: string }[];
  uniqueMonths: string[];
  setFilter: (key: keyof SalaryFiltersType, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingSalary: (salary: Salary | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: (type: 'regular' | 'advance') => void;
  handlePrint: (salary: Salary) => void;
  handleEdit: (id: string) => void;
  getSalaryTypeColor: (subCategory: string) => string;
  getEmployeeTotalPaid: (employeeId: string, month: string) => number;
  isEmployeeFullyPaid: (employeeId: string, month: string, fullSalary: number) => boolean;
  employees: any[];
  onBack: () => void;
  title: string;
  type: 'regular' | 'advance' | 'all';
}

export function SalaryListView({
  salaries,
  filters,
  showFilters,
  activeFilterCount,
  viewingSalary,
  isLoading,
  stats,
  uniqueEmployees,
  uniqueMonths,
  setFilter,
  clearFilters,
  toggleFilters,
  setViewingSalary,
  handleDelete,
  handleAdd,
  handlePrint,
  handleEdit,
  getSalaryTypeColor,
  getEmployeeTotalPaid,
  isEmployeeFullyPaid,
  employees,
  onBack,
  title,
  type
}: SalaryListViewProps) {
  const formatCurrency = SalaryService.formatCurrency;
  const formatDate = SalaryService.formatDate;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">Manage salary payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={20} />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            {type !== 'all' && (
              <button
                onClick={() => handleAdd(type)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Pay {type === 'regular' ? 'Regular' : 'Advance'} Salary
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Records</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Total Amount</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">This Month</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.thisMonthTotal)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Pending Slips</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingSlips}</p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Name, ID, or month..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilter('searchTerm', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {type === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.typeFilter}
                    onChange={(e) => setFilter('typeFilter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="regular">Regular</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={filters.employeeFilter}
                  onChange={(e) => setFilter('employeeFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {uniqueEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={filters.monthFilter}
                  onChange={(e) => setFilter('monthFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={filters.paymentMethodFilter}
                  onChange={(e) => setFilter('paymentMethodFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilter('dateFrom', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilter('dateTo', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading salary records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaries.map((salary) => {
                    const totalPaid = getEmployeeTotalPaid(salary.employeeId || '', salary.salaryMonth || '');
                    const employee = employees.find(e => e.id === salary.employeeId);
                    const fullSalary = employee?.salary || 0;
                    const isFullyPaid = isEmployeeFullyPaid(
                      salary.employeeId || '',
                      salary.salaryMonth || '',
                      fullSalary
                    );

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
                          {salary.salaryMonth || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(salary.baseSalary || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{formatCurrency(salary.commission || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{formatCurrency(salary.deductions || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(salary.netAmount || salary.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            isFullyPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isFullyPaid ? 'Paid' : 'Partial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingSalary(salary)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(salary.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handlePrint(salary)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Print Slip"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(salary.id)}
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
                  {salaries.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No salary records found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Create a new salary payment to get started
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {viewingSalary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Salary Details</h3>
                <button
                  onClick={() => setViewingSalary(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-medium font-mono">{viewingSalary.transactionId || viewingSalary.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{formatDate(viewingSalary.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee</p>
                    <p className="font-medium text-blue-600">{viewingSalary.employeeName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary Month</p>
                    <p className="font-medium">{viewingSalary.salaryMonth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-medium">{formatCurrency(viewingSalary.baseSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commission</p>
                    <p className="font-medium text-green-600">+{formatCurrency(viewingSalary.commission || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deductions</p>
                    <p className="font-medium text-red-600">-{formatCurrency(viewingSalary.deductions || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className="font-bold text-lg text-blue-600">
                      {formatCurrency(viewingSalary.netAmount || viewingSalary.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid By</p>
                    <p className="font-medium">{viewingSalary.paidBy || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">
                      {viewingSalary.mode}{viewingSalary.bankName ? ` (${viewingSalary.bankName})` : ''}
                    </p>
                  </div>
                </div>
                {viewingSalary.note && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-1">Note</p>
                    <p className="font-medium">{viewingSalary.note}</p>
                  </div>
                )}
                {viewingSalary.imageUrl && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Receipt</p>
                    <img
                      src={viewingSalary.imageUrl}
                      alt="Receipt"
                      className="max-w-full h-auto rounded border"
                    />
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