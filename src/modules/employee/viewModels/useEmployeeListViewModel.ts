// Employee Module - ViewModel Layer
// useEmployeeListViewModel - Business logic for employee list page

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Employee, EmployeeFilters } from '../models/types';
import { EmployeeService } from '../models/employeeService';

/**
 * Context type from EmployeesLayout
 */
interface EmployeeContext {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
}

/**
 * Return type for useEmployeeListViewModel
 */
interface UseEmployeeListViewModelReturn {
  // Data
  employees: Employee[];
  allEmployees: Employee[];
  uniquePositions: string[];
  
  // Filter State
  filters: EmployeeFilters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // View Modal State
  viewEmployee: Employee | null;
  
  // Stats
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  
  // Actions
  setFilter: (key: keyof EmployeeFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewEmployee: (employee: Employee | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAddEmployee: () => void;
}

/**
 * ViewModel hook for Employee List page
 * Encapsulates all business logic, state management, and navigation
 */
export function useEmployeeListViewModel(): UseEmployeeListViewModelReturn {
  const navigate = useNavigate();
  const { employees: allEmployees, setEmployees } = useOutletContext<EmployeeContext>();

  // ==================== STATE ====================
  
  // Filter states
  const [filters, setFilters] = useState<EmployeeFilters>({
    nameSearch: '',
    positionFilter: '',
    minSalary: null,
    maxSalary: null,
    phoneSearch: '',
    emailSearch: '',
    statusFilter: ''
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // ==================== COMPUTED VALUES ====================
  
  // Filtered employees list
  const employees = useMemo(() => {
    return EmployeeService.filterEmployees(allEmployees, filters);
  }, [allEmployees, filters]);

  // Unique positions for dropdown
  const uniquePositions = useMemo(() => {
    return EmployeeService.getUniquePositions(allEmployees);
  }, [allEmployees]);

  // Statistics
  const stats = useMemo(() => {
    return EmployeeService.calculateStats(employees);
  }, [employees]);

  // Active filter count for UI badge
  const activeFilterCount = useMemo(() => {
    return EmployeeService.countActiveFilters(filters);
  }, [filters]);

  // ==================== ACTIONS ====================
  
  /**
   * Update a specific filter value
   */
  const setFilter = useCallback((key: keyof EmployeeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      nameSearch: '',
      positionFilter: '',
      minSalary: null,
      maxSalary: null,
      phoneSearch: '',
      emailSearch: '',
      statusFilter: ''
    });
  }, []);

  /**
   * Toggle filter panel visibility
   */
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  /**
   * Navigate to edit page
   */
  const handleEdit = useCallback((id: string) => {
    navigate(`/employees/${id}/edit`);
  }, [navigate]);

  /**
   * Navigate to delete page
   */
  const handleDelete = useCallback((id: string) => {
    navigate(`/employees/${id}/delete`);
  }, [navigate]);

  /**
   * Navigate to create page
   */
  const handleAddEmployee = useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  // ==================== RETURN ====================
  
  return {
    // Data
    employees,
    allEmployees,
    uniquePositions,
    
    // Filter State
    filters,
    showFilters,
    activeFilterCount,
    
    // View Modal
    viewEmployee,
    
    // Stats
    totalCount: stats.totalCount,
    activeCount: stats.activeCount,
    inactiveCount: stats.inactiveCount,
    
    // Actions
    setFilter,
    clearFilters,
    toggleFilters,
    setViewEmployee,
    handleEdit,
    handleDelete,
    handleAddEmployee
  };
}
