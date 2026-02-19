// Employee Module - ViewModel Layer
// useEmployeeFormViewModel - Business logic for employee form (Create/Edit)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../models/types';
import { EmployeeService } from '../models/employeeService';

/**
 * Context type from EmployeesLayout
 */
interface EmployeeContext {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
}

/**
 * Props for useEmployeeFormViewModel
 */
interface UseEmployeeFormViewModelProps {
  mode: 'create' | 'edit';
}

/**
 * Return type for useEmployeeFormViewModel
 */
interface UseEmployeeFormViewModelReturn {
  // Form State
  formData: Partial<Employee>;
  isValid: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  
  // Meta
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  onFieldChange: (field: keyof Employee, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}


/**
 * ViewModel hook for Employee Form page (Create/Edit)
 * Shared logic for both creating and editing employees
 */
export function useEmployeeFormViewModel({ 
  mode 
}: UseEmployeeFormViewModelProps): UseEmployeeFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { employees, setEmployees } = useOutletContext<EmployeeContext>();

  // ==================== STATE ====================
  
  const [formData, setFormData] = useState<Partial<Employee>>(
    EmployeeService.getDefaultFormData()
  );
  const [isLoading, setIsLoading] = useState(false);

  // ==================== COMPUTED VALUES ====================
  
  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode ? 'Edit Employee' : 'Add Employee';
  const submitButtonText = isEditMode ? 'Update Employee' : 'Save Employee';

  // Validation
  const validation = useCallback(() => {
    return EmployeeService.validateEmployee(formData);
  }, [formData]);

  const isValid = validation().isValid;
  const errorMessage = validation().error;

  // ==================== EFFECTS ====================
  
  // Load existing employee data when in edit mode
  useEffect(() => {
    if (isEditMode && id && employees.length > 0) {
      const employee = EmployeeService.findById(employees, id);
      if (employee) {
        setFormData(employee);
      } else {
        toast.error('Employee not found');
        navigate('/employees');
      }
    }
  }, [isEditMode, id, employees, navigate]);

  // ==================== ACTIONS ====================
  
  /**
   * Update a specific form field
   */
  const setField = useCallback((field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    console.log('🔘 Save button clicked');
    console.log('📋 Form data:', formData);
    
    // Validate
    const validation = EmployeeService.validateEmployee(formData);
    console.log('✅ Validation result:', validation);
    
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.error);
      toast.error(validation.error || 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && id) {
        // Update existing employee
        console.log('📝 Updating employee:', id);
        const updateData: UpdateEmployeeDTO = {
          ...(formData as CreateEmployeeDTO),
          id
        };
        const updatedEmployees = EmployeeService.updateEmployee(employees, id, updateData);
        setEmployees(updatedEmployees);
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        console.log('➕ Creating new employee');
        const createData: CreateEmployeeDTO = formData as CreateEmployeeDTO;
        const updatedEmployees = EmployeeService.createEmployee(employees, createData);
        setEmployees(updatedEmployees);
        toast.success('Employee added successfully');
      }

      console.log('✅ Employee saved, navigating to /employees');
      navigate('/employees');
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      toast.error('An error occurred while saving the employee');
    } finally {
      setIsLoading(false);
    }
  }, [formData, isEditMode, id, employees, setEmployees, navigate]);


  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  // ==================== RETURN ====================
  
  return {
    // Form State
    formData,
    isValid,
    errorMessage,
    isLoading,
    
    // Meta
    isEditMode,
    pageTitle,
    submitButtonText,
    
    // Actions (renamed to match View props)
    onFieldChange: setField,
    onSubmit: handleSubmit,
    onCancel: handleCancel
  };

}
