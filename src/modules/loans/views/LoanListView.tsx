/**
 * Loan List View
 * Presentational component for displaying and managing loans.
 */

import React from 'react';
import { Search, Filter, Plus, Download, Trash2, Edit, Eye, CreditCard, ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, X } from 'lucide-react';
import type { Loan, LoanFilters, LoanSortField, SortOrder, LoanType, LoanStatus, LoanCategory } from '../models/types';
import { formatCurrency, formatDate } from '../models/loanService';

interface LoanListViewProps {
  loans: Loan[];
  filteredLoans: Loan[];
  isLoading: boolean;
  error: string | null;
  filters: LoanFilters;
  setSearchTerm: (term: string) => void;
  setTypeFilter: (type: LoanType | 'all') => void;
  setStatusFilter: (status: LoanStatus | 'all') => void;
  setCategoryFilter: (category: LoanCategory | 'all') => void;
  clearFilters: () => void;
  sortField: LoanSortField;
  sortOrder: SortOrder;
  setSortField: (field: LoanSortField) => void;
  toggleSortOrder: () => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  selectedLoans: string[];
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onPayment: (id: string) => void;
  onExport: () => void;
  onBulkDelete: () => void;
  totalCount: number;
  totalAmount: number;
}

const typeColors: Record<string, string> = {
  Payable: 'bg-red-100 text-red-800',
  Receivable: 'bg-green-100 text-green-800',
};
const statusColors: Record<string, string> = {
  Full: 'bg-green-100 text-green-800',
  Partial: 'bg-yellow-100 text-yellow-800',
};
const categoryColors: Record<string, string> = {
  Official: 'bg-blue-100 text-blue-800',
  Personal: 'bg-purple-100 text-purple-800',
  Other: 'bg-gray-100 text-gray-800',
};

export const LoanListView: React.FC<LoanListViewProps> = ({
  loans, filteredLoans, isLoading, error, filters,
  setSearchTerm, setTypeFilter, setStatusFilter, setCategoryFilter, clearFilters,
  sortField, sortOrder, setSortField, toggleSortOrder,
  currentPage, pageSize, totalPages, setPage, setPageSize,
  selectedLoans, toggleSelection, selectAll, clearSelection,
  onRefresh, onCreate, onEdit, onView, onDelete, onPayment, onExport, onBulkDelete,
  totalCount, totalAmount,
}) => {
  const hasActiveFilters = filters.searchTerm || filters.type !== 'all' || filters.status !== 'all' || filters.loanCategory !== 'all';
  const sortIndicator = (field: LoanSortField) => sortField === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

  if (error) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-red-700">
          {error}
          <button onClick={onRefresh} className="ml-4 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Loans</h1>
          <p className="text-gray-500 mt-1">{totalCount} loans • Total: {formatCurrency(totalAmount)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Refresh</button>
          <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
            <Plus className="h-4 w-4" /> Create Loan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
              <X className="h-4 w-4" /> Clear All
            </button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search loans..." value={filters.searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={filters.type} onChange={e => setTypeFilter(e.target.value as LoanType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
              <option value="all">All Types</option>
              <option value="Payable">Payable</option>
              <option value="Receivable">Receivable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filters.status} onChange={e => setStatusFilter(e.target.value as LoanStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
              <option value="all">All Statuses</option>
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={filters.loanCategory} onChange={e => setCategoryFilter(e.target.value as LoanCategory | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]">
              <option value="all">All Categories</option>
              <option value="Official">Official</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">{selectedLoans.length} loan{selectedLoans.length > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={clearSelection} className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">Clear</button>
            <button onClick={onBulkDelete} className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              <Trash2 className="h-4 w-4" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Loans</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Page size:</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]" />
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No loans found. Create your first loan to get started.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selectedLoans.length === loans.length && loans.length > 0} onChange={selectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortField('entityName')}>
                    Entity{sortIndicator('entityName')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortField('loanAmount')}>
                    Amount{sortIndicator('loanAmount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortField('paid')}>
                    Paid{sortIndicator('paid')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortField('remaining')}>
                    Remaining{sortIndicator('remaining')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortField('date')}>
                    Date{sortIndicator('date')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedLoans.includes(loan.id)} onChange={() => toggleSelection(loan.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loan.entityName}</div>
                      <div className="text-sm text-gray-500">{loan.receiverName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${typeColors[loan.type]}`}>
                        {loan.type === 'Payable' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {loan.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[loan.loanType]}`}>{loan.loanType}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.paid)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(loan.remaining)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[loan.status]}`}>
                        {loan.status === 'Full' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(loan.date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onView(loan.id)} className="p-1 hover:bg-gray-100 rounded transition-colors text-blue-600" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => onEdit(loan.id)} className="p-1 hover:bg-gray-100 rounded transition-colors text-green-600" title="Edit"><Edit className="h-4 w-4" /></button>
                        {loan.status !== 'Full' && (
                          <button onClick={() => onPayment(loan.id)} className="p-1 hover:bg-gray-100 rounded transition-colors text-purple-600" title="Make Payment"><CreditCard className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => onDelete(loan.id)} className="p-1 hover:bg-gray-100 rounded transition-colors text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredLoans.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};