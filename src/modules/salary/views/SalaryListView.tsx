// Salary Module - View Layer
// SalaryListView - Main list page with filters
// Changes:
// 1. Type column shows Regular/Advance badge
// 2. Status column shows paid status relative to employee's full salary
// 3. For regular salary rows: shows "Advance Paid" context if any
// 4. Month filter prominently shows paid/unpaid summary

import {
  Plus, Filter, ArrowLeft, Eye, Edit, Trash2, Search,
  CreditCard, Printer, FileText, TrendingUp, X, CheckCircle, AlertCircle, Clock,
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
    totalRecords: number; totalAmount: number;
    regularCount: number; regularTotal: number;
    advanceCount: number; advanceTotal: number;
    thisMonthTotal: number; pendingSlips: number;
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

const modeBadge = (mode: string) => {
  if (mode === 'Bank')   return 'bg-blue-100 text-blue-700';
  if (mode === 'Cheque') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
};

export function SalaryListView({
  salaries, allSalaries, filters, showFilters, activeFilterCount,
  viewingSalary, isLoading, stats, uniqueEmployees, uniqueMonths,
  setFilter, clearFilters, toggleFilters, setViewingSalary,
  handleDelete, handleAdd, handlePrint, handleEdit,
  getSalaryTypeColor, getEmployeeTotalPaid, isEmployeeFullyPaid,
  employees, onBack, title, type,
}: SalaryListViewProps) {
  const fmt     = SalaryService.formatCurrency;
  const fmtDate = SalaryService.formatDate;

  // Per-employee advance paid lookup across allSalaries
  const getAdvancePaidForMonth = (employeeId: string, month: string) =>
    allSalaries
      .filter(s => s.employeeId === employeeId && s.salaryMonth === month && s.subCategory === 'Advance salary')
      .reduce((sum, s) => sum + (s.netAmount || s.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">Manage salary payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border"
              style={showFilters
                ? { backgroundColor: '#1e293b', color: '#fff', borderColor: '#1e293b' }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }
              }>
              <Filter size={20} />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            {type !== 'all' && (
              <button onClick={() => handleAdd(type)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#1e293b' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; }}>
                <Plus size={20} />
                Pay {type === 'regular' ? 'Regular' : 'Advance'} Salary
              </button>
            )}
{type === 'all' && (
              <div className="flex gap-2">
                <button onClick={() => handleAdd('regular')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                  <Plus size={16} /> Regular
                </button>
                <button onClick={() => handleAdd('advance')} className="flex items-center gap-1.5 bg-orange-600 text-black px-3 py-2 rounded-lg hover:bg-orange-700 text-sm">
                  <Plus size={16} /> Advance
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-blue-600" /><span className="text-xs text-gray-500">Total Records</span></div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">Total Amount</span></div>
            <p className="text-xl font-bold text-green-600">{fmt(stats.totalAmount)}</p>
            <p className="text-xs text-gray-400">Reg: {fmt(stats.regularTotal)} · Adv: {fmt(stats.advanceTotal)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-purple-600" /><span className="text-xs text-gray-500">This Month</span></div>
            <p className="text-xl font-bold text-purple-600">{fmt(stats.thisMonthTotal)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-orange-600" /><span className="text-xs text-gray-500">Pending</span></div>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingSlips}</p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Name, ID, or month..."
                    value={filters.searchTerm} onChange={(e) => setFilter('searchTerm', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              </div>
              {type === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={filters.typeFilter} onChange={(e) => setFilter('typeFilter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <option value="all">All Types</option>
                    <option value="regular">Regular</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select value={filters.employeeFilter} onChange={(e) => setFilter('employeeFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <option value="">All Employees</option>
                  {uniqueEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={filters.monthFilter} onChange={(e) => setFilter('monthFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <option value="">All Months</option>
                  {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={filters.paymentMethodFilter} onChange={(e) => setFilter('paymentMethodFilter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilter('dateFrom', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input type="date" value={filters.dateTo || ''} onChange={(e) => setFilter('dateTo', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 font-medium">Clear all filters</button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1e293b' }} />
              <p className="text-gray-600">Loading salary records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date', 'Employee', 'Month', 'Type', 'Base', 'Commission', 'Deductions', 'Net Amount', 'Method', 'Payment Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-10 text-center text-gray-500">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No salary records found</p>
                        <p className="text-sm text-gray-400 mt-1">Create a new salary payment to get started</p>
                      </td>
                    </tr>
                  ) : salaries.map((salary) => {
                    const employee       = employees.find(e => e.id === salary.employeeId);
                    const fullSalary     = employee?.salary || 0;
                    const isRegular      = salary.subCategory === 'Employee salary';
                    const advPaid        = isRegular ? getAdvancePaidForMonth(salary.employeeId, salary.salaryMonth) : 0;
                    const totalPaid      = getEmployeeTotalPaid(salary.employeeId, salary.salaryMonth);
                    const fullyPaid      = isEmployeeFullyPaid(salary.employeeId, salary.salaryMonth, fullSalary);

                    return (
                      <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(salary.date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">{salary.employeeName || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{salary.salaryMonth || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSalaryTypeColor(salary.subCategory)}`}>
                            {isRegular ? 'Regular' : 'Advance'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmt(salary.baseSalary || 0)}</td>
                        <td className="px-4 py-3 text-sm text-green-600">+{fmt(salary.commission || 0)}</td>
                        <td className="px-4 py-3 text-sm text-red-600">−{fmt(salary.deductions || 0)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(salary.netAmount || salary.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(salary.mode)}`}>{salary.mode}</span>
                          {salary.bankName && <p className="text-xs text-gray-400 mt-0.5">{salary.bankName}</p>}
                          {salary.chequeNumber && <p className="text-xs text-purple-500 mt-0.5">#{salary.chequeNumber}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {/* Overall payment status for this employee+month */}
                            {isRegular ? (
                              fullyPaid ? (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                                  <CheckCircle size={10} /> Fully Paid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full w-fit">
                                  <AlertCircle size={10} /> Partial ({fmt(totalPaid)})
                                </span>
                              )
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full w-fit">
                                Advance
                              </span>
                            )}
                            {/* Show advance paid context on regular rows */}
                            {isRegular && advPaid > 0 && (
                              <p className="text-xs text-orange-500">Adv: {fmt(advPaid)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewingSalary(salary)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15} /></button>
                            <button onClick={() => handleEdit(salary.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Edit"><Edit size={15} /></button>
                            <button onClick={() => handlePrint(salary)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Print"><Printer size={15} /></button>
                            <button onClick={() => handleDelete(salary.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {viewingSalary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold">Salary Details</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{viewingSalary.transactionId || viewingSalary.id}</p>
                </div>
                <button onClick={() => setViewingSalary(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Date',         fmtDate(viewingSalary.date)],
                    ['Employee',     viewingSalary.employeeName || '—'],
                    ['Salary Month', viewingSalary.salaryMonth || '—'],
                    ['Type',         viewingSalary.subCategory],
                    ['Paid By',      viewingSalary.paidBy || '—'],
                    ['Mode',         viewingSalary.mode + (viewingSalary.bankName ? ` (${viewingSalary.bankName})` : '')],
                  ].map(([l, v]) => (
                    <div key={l}><p className="text-gray-500 text-xs">{l}</p><p className="font-medium text-gray-900">{v}</p></div>
                  ))}
                </div>

                {/* Cheque details */}
                {viewingSalary.chequeNumber && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-2">Cheque Details</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-gray-400">Number</p><p className="font-medium">{viewingSalary.chequeNumber}</p></div>
                      <div><p className="text-gray-400">Date</p><p className="font-medium">{viewingSalary.chequeDate || '—'}</p></div>
                      <div><p className="text-gray-400">Bank</p><p className="font-medium">{viewingSalary.chequeBank || '—'}</p></div>
                    </div>
                  </div>
                )}

                {/* Salary breakdown */}
                <div className="grid grid-cols-4 gap-3 border-t pt-4">
                  {[
                    ['Base Salary',  fmt(viewingSalary.baseSalary || 0),  'bg-gray-50 text-gray-700'],
                    ['Commission',   `+${fmt(viewingSalary.commission || 0)}`, 'bg-green-50 text-green-700'],
                    ['Deductions',   `−${fmt(viewingSalary.deductions || 0)}`, 'bg-red-50 text-red-700'],
                    ['Net Amount',   fmt(viewingSalary.netAmount || viewingSalary.amount), 'bg-blue-50 text-blue-700'],
                  ].map(([l, v, cls]) => (
                    <div key={l} className={`${cls} p-3 rounded-lg text-center`}>
                      <p className="text-xs opacity-70">{l}</p>
                      <p className="font-bold">{v}</p>
                    </div>
                  ))}
                </div>

                {viewingSalary.note && (
                  <div className="bg-gray-50 rounded-lg p-3 border-t pt-3">
                    <p className="text-xs text-gray-400 mb-1">Note</p>
                    <p className="font-medium">{viewingSalary.note}</p>
                  </div>
                )}
                {viewingSalary.imageUrl && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Receipt</p>
                    <img src={viewingSalary.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
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