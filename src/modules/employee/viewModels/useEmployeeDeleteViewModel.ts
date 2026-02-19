// Employee Module - ViewModel Layer
// useEmployeeDeleteViewModel - Business logic for employee delete confirmation

import { useEffect, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Employee } from '../models/types';
import { EmployeeService } from '../models/employeeService';
/**
 * Context type from EmployeesLayout
 */
interface EmployeeContext {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
}

/**
 * Return type for useEmployeeDeleteViewModel
 */
interface UseEmployeeDeleteViewModelReturn {
  // Data
  employee: Employee | null;
  isLoading: boolean;
  
  // Actions
  onDelete: () => void;
  onCancel: () => void;
}


/**
 * ViewModel hook for Employee Delete confirmation page
 */
export function useEmployeeDeleteViewModel(): UseEmployeeDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { employees, setEmployees } = useOutletContext<EmployeeContext>();

  // ==================== COMPUTED VALUES ====================
  
  // Find the employee to delete
  const employee = id ? EmployeeService.findById(employees, id) || null : null;

  // ==================== EFFECTS ====================
  
  // Redirect if employee not found
  useEffect(() => {
    if (id && employees.length > 0 && !employee) {
      toast.error('Employee not found');
      navigate('/employees');
    }
  }, [id, employees, employee, navigate]);

  // ==================== ACTIONS ====================
  
  /**
   * Handle delete confirmation
   */
  const handleDelete = useCallback(() => {
    if (!id) {
      toast.error('Invalid employee ID');
      return;
    }

    try {
      const updatedEmployees = EmployeeService.deleteEmployee(employees, id);
      setEmployees(updatedEmployees);
      toast.success('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      toast.error('An error occurred while deleting the employee');
      console.error('Error deleting employee:', error);
    }
  }, [id, employees, setEmployees, navigate]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  // ==================== RETURN ====================
  
  return {
    employee,
    isLoading: false, // Could be used for async operations in the future
    onDelete: handleDelete,
    onCancel: handleCancel
  };

}
