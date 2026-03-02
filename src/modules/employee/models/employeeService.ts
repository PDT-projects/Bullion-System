// Employee Module - Service Layer
// Business logic, data operations, and utilities

import { 
  Employee, 
  CreateEmployeeDTO, 
  UpdateEmployeeDTO, 
  EmployeeFilters, 
  EmployeeStats,
  ValidationResult 
} from './types';

/**
 * EmployeeService - Contains all business logic for employee operations
 * This is a pure service class with no React dependencies
 */
export class EmployeeService {
  
  // ==================== FILTERING & SEARCH ====================
  
  /**
   * Filter employees based on multiple criteria
   */
  static filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
    return employees.filter(employee => {
      // Name search (case-insensitive, partial match)
      if (filters.nameSearch && !employee.name.toLowerCase().includes(filters.nameSearch.toLowerCase())) {
        return false;
      }

      // Position filter
      if (filters.positionFilter && employee.position !== filters.positionFilter) {
        return false;
      }

      // Salary range filter
      const min = filters.minSalary ?? 0;
      const max = filters.maxSalary ?? Infinity;
      if (employee.salary < min || employee.salary > max) {
        return false;
      }

      // Phone search
      if (filters.phoneSearch && !employee.phone.toLowerCase().includes(filters.phoneSearch.toLowerCase())) {
        return false;
      }

      // Email search
      if (filters.emailSearch && !employee.email.toLowerCase().includes(filters.emailSearch.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.statusFilter && employee.status !== filters.statusFilter) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get unique positions from all employees (sorted)
   */
  static getUniquePositions(employees: Employee[]): string[] {
    return Array.from(new Set(employees.map(emp => emp.position))).sort();
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new employee
   */
  static createEmployee(employees: Employee[], data: CreateEmployeeDTO): Employee[] {
    const newEmployee: Employee = {
      ...data,
      id: Date.now().toString()
    };
    return [...employees, newEmployee];
  }

  /**
   * Update an existing employee
   */
  static updateEmployee(employees: Employee[], id: string, data: UpdateEmployeeDTO): Employee[] {
    return employees.map(e => 
      e.id === id ? { ...data, id: e.id } : e
    );
  }

  /**
   * Delete an employee by ID
   */
  static deleteEmployee(employees: Employee[], id: string): Employee[] {
    return employees.filter(e => e.id !== id);
  }

  /**
   * Find employee by ID
   */
  static findById(employees: Employee[], id: string): Employee | undefined {
    return employees.find(e => e.id === id);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate employee data before create/update
   */
  static validateEmployee(data: Partial<Employee>): ValidationResult {
    // Required fields
    if (!data.name || data.name.trim() === '') {
      return { isValid: false, error: 'Name is required' };
    }

    if (!data.position || data.position.trim() === '') {
      return { isValid: false, error: 'Position is required' };
    }

    if (!data.email || data.email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Salary validation
    if (data.salary !== undefined && data.salary < 0) {
      return { isValid: false, error: 'Salary cannot be negative' };
    }

    // Phone validation (if provided)
    if (data.phone && data.phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]*$/;
      if (!phoneRegex.test(data.phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
    }

    // Location validation
    if (!data.location) {
      return { isValid: false, error: 'Location is required' };
    }

    const validLocations = ['Karachi', 'Islamabad', 'Lahore'];
    if (!validLocations.includes(data.location)) {
      return { isValid: false, error: 'Please select a valid location' };
    }

    return { isValid: true, error: null };
  }

  // ==================== STATISTICS ====================

  /**
   * Calculate employee statistics
   */
  static calculateStats(employees: Employee[]): EmployeeStats {
    const totalCount = employees.length;
    const activeCount = employees.filter(e => e.status === 'active').length;
    const inactiveCount = employees.filter(e => e.status === 'inactive').length;
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    const averageSalary = totalCount > 0 ? totalSalary / totalCount : 0;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      averageSalary,
      totalSalary
    };
  }

  // ==================== FORMATTING UTILITIES ====================

  /**
   * Format number as PKR currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date string to locale date
   */
  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get default empty employee form data
   */
  static getDefaultFormData(): Partial<Employee> {
    return {
      name: '',
      position: '',
      salary: 0,
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      location: 'Karachi',
      accountNumber: '',
      bankName: '',
      accountTitle: ''
    };
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: EmployeeFilters): boolean {
    return !!(
      filters.nameSearch ||
      filters.positionFilter ||
      filters.minSalary ||
      filters.maxSalary ||
      filters.phoneSearch ||
      filters.emailSearch ||
      filters.statusFilter
    );
  }

  /**
   * Count active filters
   */
  static countActiveFilters(filters: EmployeeFilters): number {
    let count = 0;
    if (filters.nameSearch) count++;
    if (filters.positionFilter) count++;
    if (filters.minSalary) count++;
    if (filters.maxSalary) count++;
    if (filters.phoneSearch) count++;
    if (filters.emailSearch) count++;
    if (filters.statusFilter) count++;
    return count;
  }
}
