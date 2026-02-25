// Employee Module - Firebase Data Connect Service Layer
// Handles all Firebase Data Connect operations for employees

import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { initializeApp } from 'firebase/app';
import {
  connectorConfig,
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  CreateEmployeeVariables,
  UpdateEmployeeVariables,
  DeleteEmployeeVariables,
  GetEmployeesData,
  GetEmployeeByIdData,
  CreateEmployeeData,
  UpdateEmployeeData,
  DeleteEmployeeData,
} from '../../../dataconnect-generated';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from './types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcTOJImNIZ1luoGVIbRmTMfRjKyHc3o-Y",
  authDomain: "erp-system-baacb.firebaseapp.com",
  projectId: "erp-system-baacb",
  storageBucket: "erp-system-baacb.firebasestorage.app",
  messagingSenderId: "637818110198",
  appId: "1:637818110198:web:623aa945d32788b20fecd7"
};

// Initialize Firebase app for Data Connect
const firebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Data Connect instance for employee operations
 */
let dataConnectInstance: DataConnect | null = null;

/**
 * Get or initialize the Data Connect instance
 */
function getDataConnectInstance(): DataConnect {
  if (!dataConnectInstance) {
    dataConnectInstance = getDataConnect(firebaseApp, connectorConfig);
  }
  return dataConnectInstance;
}

/**
 * Transform Firebase employee data to our Employee type
 */
function transformEmployeeData(data: any): Employee {
  return {
    id: data.id,
    name: data.name || '',
    position: data.position || '',
    salary: data.salary || 0,
    phone: data.phone || '',
    email: data.email || '',
    joinDate: data.joinDate || '',
    status: (data.status as 'active' | 'inactive') || 'active',
    location: (data.location as 'Karachi' | 'Islamabad' | 'Lahore') || 'Karachi',
    accountNumber: data.accountNumber || '',
    bankName: data.bankName || '',
    accountTitle: data.accountTitle || '',
  };
}

/**
 * Transform CreateEmployeeDTO to Firebase variables
 */
function transformCreateVariables(data: CreateEmployeeDTO, id: string): CreateEmployeeVariables {
  return {
    id,
    name: data.name,
    position: data.position,
    salary: data.salary,
    phone: data.phone,
    email: data.email,
    joinDate: data.joinDate,
    status: data.status,
    location: data.location,
    accountNumber: data.accountNumber,
    bankName: data.bankName,
    accountTitle: data.accountTitle,
  };
}

/**
 * Transform UpdateEmployeeDTO to Firebase variables
 */
function transformUpdateVariables(data: UpdateEmployeeDTO): UpdateEmployeeVariables {
  return {
    id: data.id,
    name: data.name,
    position: data.position,
    salary: data.salary,
    phone: data.phone,
    email: data.email,
    joinDate: data.joinDate,
    status: data.status,
    location: data.location,
    accountNumber: data.accountNumber,
    bankName: data.bankName,
    accountTitle: data.accountTitle,
  };
}

/**
 * EmployeeFirebaseService - Firebase Data Connect operations
 */
export class EmployeeFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all employees from Firebase
   */
  static async fetchAllEmployees(): Promise<Employee[]> {
    try {
      console.log('🔥 Fetching all employees from Firebase...');
      const dc = getDataConnectInstance();
      const result = await getEmployees(dc);
      
      if (!result.data || !result.data.employees) {
        console.log('⚠️ No employees found');
        return [];
      }

      const employees = result.data.employees.map(transformEmployeeData);
      console.log(`✅ Fetched ${employees.length} employees`);
      return employees;
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      throw new Error('Failed to fetch employees from Firebase');
    }
  }

  /**
   * Fetch a single employee by ID
   */
  static async fetchEmployeeById(id: string): Promise<Employee | null> {
    try {
      console.log(`🔥 Fetching employee ${id} from Firebase...`);
      const dc = getDataConnectInstance();
      const result = await getEmployeeById(dc, { id });
      
      if (!result.data || !result.data.employee) {
        console.log('⚠️ Employee not found');
        return null;
      }

      const employee = transformEmployeeData(result.data.employee);
      console.log('✅ Employee fetched:', employee.name);
      return employee;
    } catch (error) {
      console.error(`❌ Error fetching employee ${id}:`, error);
      throw new Error('Failed to fetch employee from Firebase');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new employee in Firebase
   */
  static async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
    try {
      console.log('🔥 Creating employee in Firebase:', data.name);
      const dc = getDataConnectInstance();
      
      // Generate a unique ID
      const id = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const variables = transformCreateVariables(data, id);
      const result = await createEmployee(dc, variables);
      
      if (!result.data || !result.data.employee_insert) {
        throw new Error('Failed to create employee - no data returned');
      }

      // Return the created employee with the generated ID
      const createdEmployee: Employee = {
        ...data,
        id: result.data.employee_insert.id,
      };
      
      console.log('✅ Employee created with ID:', createdEmployee.id);
      return createdEmployee;
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      throw new Error('Failed to create employee in Firebase');
    }
  }

  /**
   * Update an existing employee in Firebase
   */
  static async updateEmployee(data: UpdateEmployeeDTO): Promise<Employee> {
    try {
      console.log('🔥 Updating employee in Firebase:', data.id);
      const dc = getDataConnectInstance();
      
      const variables = transformUpdateVariables(data);
      const result = await updateEmployee(dc, variables);
      
      if (!result.data || !result.data.employee_update) {
        throw new Error('Failed to update employee - no data returned');
      }

      // Return the updated employee
      const updatedEmployee: Employee = {
        ...data,
        id: result.data.employee_update.id,
      };
      
      console.log('✅ Employee updated:', updatedEmployee.id);
      return updatedEmployee;
    } catch (error) {
      console.error(`❌ Error updating employee ${data.id}:`, error);
      throw new Error('Failed to update employee in Firebase');
    }
  }

  /**
   * Delete an employee from Firebase
   */
  static async deleteEmployee(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting employee from Firebase:', id);
      const dc = getDataConnectInstance();
      
      const variables: DeleteEmployeeVariables = { id };
      const result = await deleteEmployee(dc, variables);
      
      if (!result.data || !result.data.employee_delete) {
        throw new Error('Failed to delete employee - no confirmation returned');
      }
      
      console.log('✅ Employee deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting employee ${id}:`, error);
      throw new Error('Failed to delete employee from Firebase');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Firebase is connected
   */
  static isConnected(): boolean {
    return !!dataConnectInstance;
  }

  /**
   * Reset the Data Connect instance (useful for testing)
   */
  static resetConnection(): void {
    dataConnectInstance = null;
  }
}

