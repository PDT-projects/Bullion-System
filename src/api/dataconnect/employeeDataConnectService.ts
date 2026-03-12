// Employee Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for employees

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig, 
  employeeInsert, 
  employeeUpdate, 
  employeeDelete,
  listEmployees,
  getEmployeeById,
  EmployeeInsertVariables,
  EmployeeUpdateVariables,
  EmployeeDeleteVariables,
  ListEmployeesVariables,
  GetEmployeeByIdVariables,
  ListEmployeesData,
  GetEmployeeByIdData
} from '@erp-system/employees';
import { Employee as EmployeeType, CreateEmployeeDTO, UpdateEmployeeDTO } from '../../modules/employee/models/types';

// Data Connect client instance
let dcInstance: DataConnect | null = null;
let isEmulatorConnected = false;

/**
 * Get Data Connect instance (singleton)
 * Connects to emulator if running locally
 */
function getDC(): DataConnect {
  if (!dcInstance) {
    // Create the Data Connect instance
    dcInstance = getDataConnect(connectorConfig);
    
    // Connect to emulator if running locally
    if (!isEmulatorConnected) {
      try {
        // Try to connect to emulator on localhost:9399
        connectDataConnectEmulator(dcInstance, 'localhost', 9399);
        isEmulatorConnected = true;
        console.log('Connected to Data Connect Emulator at localhost:9399');
      } catch (error) {
        // Emulator might not be running, continue without emulator connection
        console.log('Could not connect to Data Connect Emulator, using production');
      }
    }
  }
  return dcInstance;
}

/**
 * Helper to convert string to Employee status
 */
function toEmployeeStatus(status: string): 'active' | 'inactive' {
  return status === 'active' ? 'active' : 'inactive';
}

/**
 * Helper to convert string to Employee location
 */
function toEmployeeLocation(location: string): 'Karachi' | 'Islamabad' | 'Lahore' {
  if (location === 'Karachi' || location === 'Islamabad' || location === 'Lahore') {
    return location;
  }
  return 'Karachi'; // default
}

/**
 * EmployeeDataConnectService - Data Connect operations for employees
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class EmployeeDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all employees from Data Connect
   */
  static async fetchAllEmployees(): Promise<EmployeeType[]> {
    try {
      console.log('📡 Fetching all employees from Data Connect...');
      
      const dc = getDC();
      // Explicitly pass limit and offset to ensure playground works
      const variables: ListEmployeesVariables = { limit: 100, offset: 0 };
      
      // Call listEmployees with explicit variables
      const result = await listEmployees(dc, variables) as unknown as QueryResult<ListEmployeesData, ListEmployeesVariables>;
      const data = result.data;
      
      const employees: EmployeeType[] = data.employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        salary: emp.salary,
        phone: emp.phone,
        email: emp.email,
        joinDate: emp.joinDate,
        status: toEmployeeStatus(emp.status),
        location: toEmployeeLocation(emp.location),
        accountNumber: emp.accountNumber || '',
        bankName: emp.bankName || '',
        accountTitle: emp.accountTitle || '',
        createdAt: emp.createdAt || new Date().toISOString(),
        updatedAt: emp.updatedAt || new Date().toISOString()
      }));
      
      console.log(`✅ Fetched ${employees.length} employees from Data Connect`);
      return employees;
    } catch (error) {
      console.error('❌ Error fetching employees from Data Connect:', error);
      throw new Error('Failed to fetch employees from Data Connect');
    }
  }

  /**
   * Fetch a single employee by ID
   */
  static async fetchEmployeeById(id: string): Promise<EmployeeType | null> {
    try {
      console.log(`📡 Fetching employee ${id} from Data Connect...`);
      
      const dc = getDC();
      const variables: GetEmployeeByIdVariables = { id };
      
      // Call getEmployeeById - result is QueryResult with .data property
      const result = await getEmployeeById(dc, variables) as unknown as QueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;
      const data = result.data;
      
      if (!data.employee) {
        console.log(`Employee not found: ${id}`);
        return null;
      }
      
      const emp = data.employee;
      const employee: EmployeeType = {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        salary: emp.salary,
        phone: emp.phone,
        email: emp.email,
        joinDate: emp.joinDate,
        status: toEmployeeStatus(emp.status),
        location: toEmployeeLocation(emp.location),
        accountNumber: emp.accountNumber || '',
        bankName: emp.bankName || '',
        accountTitle: emp.accountTitle || '',
        createdAt: emp.createdAt || new Date().toISOString(),
        updatedAt: emp.updatedAt || new Date().toISOString()
      };
      
      console.log(`✅ Fetched employee: ${employee.name}`);
      return employee;
    } catch (error) {
      console.error(`❌ Error fetching employee ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch employee ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new employee in Data Connect
   */
  static async createEmployee(data: CreateEmployeeDTO): Promise<EmployeeType> {
    try {
      console.log('📡 Creating employee in Data Connect:', data.name);
      
      // Generate a unique ID
      const id = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: EmployeeInsertVariables = {
        id,
        name: data.name,
        position: data.position,
        salary: Number(data.salary),
        phone: data.phone,
        email: data.email,
        joinDate: data.joinDate,
        status: data.status,
        location: data.location,
        accountNumber: data.accountNumber || null,
        bankName: data.bankName || null,
        accountTitle: data.accountTitle || null
      };

      // Execute the mutation
      await employeeInsert(variables);
      console.log('✅ Employee created in Data Connect');

      const createdEmployee: EmployeeType = {
        ...data,
        id: variables.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Employee created with ID:', createdEmployee.id);
      return createdEmployee;
    } catch (error) {
      console.error('❌ Error creating employee in Data Connect:', error);
      throw new Error('Failed to create employee in Data Connect');
    }
  }

  /**
   * Update an existing employee in Data Connect
   */
  static async updateEmployee(data: UpdateEmployeeDTO): Promise<EmployeeType> {
    try {
      console.log('📡 Updating employee in Data Connect:', data.id);
      
      // Prepare variables for Data Connect
      const variables: EmployeeUpdateVariables = {
        id: data.id,
        name: data.name,
        position: data.position,
        salary: Number(data.salary),
        phone: data.phone,
        email: data.email,
        joinDate: data.joinDate,
        status: data.status,
        location: data.location,
        accountNumber: data.accountNumber || null,
        bankName: data.bankName || null,
        accountTitle: data.accountTitle || null
      };

      // Execute the mutation
      await employeeUpdate(variables);

      const updatedEmployee: EmployeeType = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Employee updated:', data.id);
      return updatedEmployee;
    } catch (error) {
      console.error(`❌ Error updating employee ${data.id} in Data Connect:`, error);
      throw new Error('Failed to update employee in Data Connect');
    }
  }

  /**
   * Delete an employee from Data Connect
   */
  static async deleteEmployee(id: string): Promise<void> {
    try {
      console.log('📡 Deleting employee from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: EmployeeDeleteVariables = { id };

      // Execute the mutation
      await employeeDelete(variables);
      
      console.log('✅ Employee deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting employee ${id} from Data Connect:`, error);
      throw new Error('Failed to delete employee from Data Connect');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Data Connect is connected
   */
  static isConnected(): boolean {
    try {
      getDC();
      return true;
    } catch {
      return false;
    }
  }
}
