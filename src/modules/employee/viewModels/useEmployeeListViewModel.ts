// Employee Module - ViewModel Layer
// useEmployeeListViewModel - Business logic for employee list page with Data Connect

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Employee, EmployeeFilters } from '../models/types';
import { EmployeeService } from '../models/employeeService';
import { EmployeeFirebaseService } from '../models/employeeFirebaseService';

/**
 * Return type for useEmployeeListViewModel
 */
interface UseEmployeeListViewModelReturn {
  // Data
  employees: Employee[];
  uniquePositions: string[];
  
  // Loading & Error States
  isLoading: boolean;
  error: string | null;
  
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
  refreshEmployees: () => Promise<void>;
}

/**
 * ViewModel hook for Employee List page
 * Encapsulates all business logic, state management, and navigation
 * Now integrated with Firebase Data Connect
 */
export function useEmployeeListViewModel(): UseEmployeeListViewModelReturn {
  const navigate = useNavigate();

  // ==================== STATE ====================
  
  // Employee data from Firebase
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetch employees from Firebase
   */
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching employees from Firebase...');
      
const employees = await EmployeeFirebaseService.fetchAllEmployees();
      setAllEmployees(employees);
      
      console.log(`✅ Loaded ${employees.length} employees`);
    } catch (err) {
      console.error('❌ Error loading employees:', err);
      setError('Failed to load employees. Please try again.');
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

  /**
   * Refresh employees list
   */
  const refreshEmployees = useCallback(async () => {
    await fetchEmployees();
    toast.success('Employee list refreshed');
  }, [fetchEmployees]);

  // ==================== RETURN ====================
  
  return {
    // Data
    employees,
    uniquePositions,
    
    // Loading & Error
    isLoading,
    error,
    
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
    handleAddEmployee,
    refreshEmployees,
  };
}