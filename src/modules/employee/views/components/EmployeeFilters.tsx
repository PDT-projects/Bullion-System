// Employee Module - View Layer
// EmployeeFilters Component - Filter UI for employee list

import { EmployeeFilters as EmployeeFiltersType } from '../../models/types';

/**
 * Props for EmployeeFilters component
 */
interface EmployeeFiltersProps {
  filters: EmployeeFiltersType;
  uniquePositions: string[];
  onFilterChange: (key: keyof EmployeeFiltersType, value: any) => void;
  onClearFilters: () => void;
}

/**
 * EmployeeFilters - Dumb component for filter inputs
 * Receives all data and callbacks from ViewModel
 */
export function EmployeeFilters({ 
  filters, 
  uniquePositions, 
  onFilterChange, 
  onClearFilters 
}: EmployeeFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Name Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Name
          </label>
          <input
            type="text"
            value={filters.nameSearch}
            onChange={(e) => onFilterChange('nameSearch', e.target.value)}
            placeholder="Enter name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Position
          </label>
          <select
            value={filters.positionFilter}
            onChange={(e) => onFilterChange('positionFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          >
            <option value="">All Positions</option>
            {uniquePositions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Salary
          </label>
          <input
            type="number"
            value={filters.minSalary || ''}
            onChange={(e) => onFilterChange('minSalary', e.target.value ? Number(e.target.value) : null)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Salary
          </label>
          <input
            type="number"
            value={filters.maxSalary || ''}
            onChange={(e) => onFilterChange('maxSalary', e.target.value ? Number(e.target.value) : null)}
            placeholder="No limit"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
        </div>

        {/* Phone Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Phone
          </label>
          <input
            type="text"
            value={filters.phoneSearch}
            onChange={(e) => onFilterChange('phoneSearch', e.target.value)}
            placeholder="Enter phone..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
        </div>

        {/* Email Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Email
          </label>
          <input
            type="text"
            value={filters.emailSearch}
            onChange={(e) => onFilterChange('emailSearch', e.target.value)}
            placeholder="Enter email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange('statusFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Filter Actions */}
        <div className="flex items-end gap-2">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
