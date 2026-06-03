// Employee Module - Service Layer
// Business logic, data operations, and utilities

import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeFilters,
  EmployeeStats,
  ValidationResult,
} from './types';

export class EmployeeService {

  // ==================== FILTERING & SEARCH ====================

  static filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
    return employees.filter(employee => {
      if (filters.nameSearch && !employee.name.toLowerCase().includes(filters.nameSearch.toLowerCase())) {
        return false;
      }
      if (filters.positionFilter && employee.position !== filters.positionFilter) {
        return false;
      }
      const min = filters.minSalary ?? 0;
      const max = filters.maxSalary ?? Infinity;
      if (employee.salary < min || employee.salary > max) {
        return false;
      }
      if (filters.phoneSearch && !employee.phone.toLowerCase().includes(filters.phoneSearch.toLowerCase())) {
        return false;
      }
      if (filters.emailSearch && !employee.email.toLowerCase().includes(filters.emailSearch.toLowerCase())) {
        return false;
      }
      if (filters.statusFilter && employee.status !== filters.statusFilter) {
        return false;
      }
      return true;
    });
  }

  static getUniquePositions(employees: Employee[]): string[] {
    return Array.from(new Set(employees.map(emp => emp.position))).sort();
  }

  // ==================== CRUD OPERATIONS ====================

  static createEmployee(employees: Employee[], data: CreateEmployeeDTO): Employee[] {
    const newEmployee: Employee = { ...data, id: Date.now().toString() };
    return [...employees, newEmployee];
  }

  static updateEmployee(employees: Employee[], id: string, data: UpdateEmployeeDTO): Employee[] {
    return employees.map(e => (e.id === id ? { ...data, id: e.id } : e));
  }

  static deleteEmployee(employees: Employee[], id: string): Employee[] {
    return employees.filter(e => e.id !== id);
  }

  static findById(employees: Employee[], id: string): Employee | undefined {
    return employees.find(e => e.id === id);
  }

  // ==================== VALIDATION ====================

  static validateEmployee(data: Partial<Employee>): ValidationResult {
    if (!data.name || data.name.trim() === '') {
      return { isValid: false, error: 'Name is required' };
    }
    if (!data.position || data.position.trim() === '') {
      return { isValid: false, error: 'Position is required' };
    }
    if (!data.email || data.email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    if (data.salary !== undefined && data.salary < 0) {
      return { isValid: false, error: 'Salary cannot be negative' };
    }
    if (data.phone && data.phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]*$/;
      if (!phoneRegex.test(data.phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
    }
    // Location validation — accepts any non-empty string (custom cities supported)
    if (!data.location || data.location.trim() === '') {
      return { isValid: false, error: 'Location is required' };
    }
    return { isValid: true, error: null };
  }

  // ==================== STATISTICS ====================

  static calculateStats(employees: Employee[]): EmployeeStats {
    const totalCount = employees.length;
    const activeCount = employees.filter(e => e.status === 'active').length;
    const inactiveCount = employees.filter(e => e.status === 'inactive').length;
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    const averageSalary = totalCount > 0 ? totalSalary / totalCount : 0;
    return { totalCount, activeCount, inactiveCount, averageSalary, totalSalary };
  }

  // ==================== FORMATTING UTILITIES ====================

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  static getDefaultFormData(): Partial<Employee> {
    return {
      name: '',
      position: '',
      salary: 0,
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      location: 'Dubai',
      accountNumber: '',
      bankName: '',
      accountTitle: '',
    };
  }

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