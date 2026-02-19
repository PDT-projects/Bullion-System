// Commission Slab List View - Presentational Component

import { Plus, Search, MoreVertical, Edit, Trash2, Filter, SlidersHorizontal } from 'lucide-react';
import type { CommissionSlab, CommissionSlabFilter } from '../models/types';

interface CommissionSlabListViewProps {
  // Data
  slabs: CommissionSlab[];
  filteredSlabs: CommissionSlab[];
  isLoading: boolean;
  
  // Filters
  filter: CommissionSlabFilter;
  setFilter: (filter: CommissionSlabFilter) => void;
  clearFilters: () => void;
  
  // Actions
  onAdd: () => void;
  onEdit: (slab: CommissionSlab) => void;
  onDelete: (id: string) => void;
  
  // Stats
  totalSlabs: number;
  
  // Utils
  getSalespersonName: (salespersonId: string) => string;
  formatCurrency: (amount: number) => string;
  employees: any[];
}

export function CommissionSlabListView({
  slabs,
  filteredSlabs,
  isLoading,
  filter,
  setFilter,
  clearFilters,
  onAdd,
  onEdit,
  onDelete,
  totalSlabs,
  getSalespersonName,
  formatCurrency,
  employees
}: CommissionSlabListViewProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Slabs</h1>
          <p className="text-gray-600 mt-1">
            Manage commission percentage slabs for salespeople
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Add Slab
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Slabs</span>
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalSlabs}</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Filters</span>
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Object.keys(filter).length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Showing</span>
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{filteredSlabs.length}</div>
          <p className="text-xs text-gray-500">of {slabs.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by salesperson..."
                value={filter.salesperson || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter({ ...filter, salesperson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Filter by city..."
                value={filter.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter({ ...filter, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Commission Slabs</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]"></div>
            </div>
          ) : filteredSlabs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No commission slabs found. Add your first slab to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSlabs.map((slab) => (
                    <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getSalespersonName(slab.salesperson)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {slab.city}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(slab.fromAmount)} - {formatCurrency(slab.toAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slab.commissionPercentage}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slab.createdAt ? new Date(slab.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(slab)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-blue-600"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => onDelete(slab.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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
