// Employee Module - View Layer
// EmployeeListView - Main page for employee list with filters

import { Plus, Filter } from 'lucide-react';
import { Employee, EmployeeFilters as EmployeeFiltersType } from '../models/types';
import { EmployeeService } from '../models/employeeService';
import { EmployeeFilters } from './components/EmployeeFilters';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeViewModal } from './components/EmployeeViewModal';

/**
 * Props for EmployeeListView component
 */
interface EmployeeListViewProps {
  // Data
  employees: Employee[];
  allEmployees: Employee[];
  uniquePositions: string[];
  
  // Filter State
  filters: EmployeeFiltersType;
  showFilters: boolean;
  activeFilterCount: number;

  
  // View Modal State
  viewEmployee: Employee | null;
  
  // Stats
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  
  // Actions
  setFilter: (key: keyof EmployeeFiltersType, value: any) => void;

  clearFilters: () => void;
  toggleFilters: () => void;
  setViewEmployee: (employee: Employee | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAddEmployee: () => void;
}

/**
 * EmployeeListView - Dumb component for employee list page
 * Receives all data and callbacks from ViewModel
 */
export function EmployeeListView({
  employees,
  uniquePositions,
  filters,
  showFilters,
  activeFilterCount,
  viewEmployee,
  totalCount,
  handleEdit,
  handleDelete,
  handleAddEmployee,
  setFilter,
  clearFilters,
  toggleFilters,
  setViewEmployee
}: EmployeeListViewProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your employee records ({totalCount} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-[#4f46e5] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <EmployeeFilters
          filters={filters}
          uniquePositions={uniquePositions}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            All Employees ({employees.length})
          </h3>
        </div>
        <EmployeeTable
          employees={employees}
          onView={setViewEmployee}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatCurrency={EmployeeService.formatCurrency}
        />
      </div>

      {/* View Modal */}
      {viewEmployee && (
        <EmployeeViewModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          formatCurrency={EmployeeService.formatCurrency}
          formatDate={EmployeeService.formatDate}
        />
      )}
    </div>
  );
}
