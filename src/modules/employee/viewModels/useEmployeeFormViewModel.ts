// Employee Module - ViewModel Layer
// useEmployeeFormViewModel - Business logic for employee form (Create/Edit) with Firebase

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../models/types';
import { EmployeeService } from '../models/employeeService';
import { EmployeeFirebaseService } from '../models/employeeFirebaseService';

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
  isSaving: boolean;
  
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
 * Now integrated with Firebase Data Connect
 */
export function useEmployeeFormViewModel({ 
  mode 
}: UseEmployeeFormViewModelProps): UseEmployeeFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ==================== STATE ====================
  
  const [formData, setFormData] = useState<Partial<Employee>>(
    EmployeeService.getDefaultFormData()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (isEditMode && id) {
      const loadEmployee = async () => {
        try {
          setIsLoading(true);
          console.log(`🔄 Loading employee ${id} for editing...`);
          
          const employee = await EmployeeFirebaseService.fetchEmployeeById(id);
          
          if (employee) {
            setFormData(employee);
            console.log('✅ Employee loaded for editing:', employee.name);
          } else {
            toast.error('Employee not found');
            navigate('/employees');
          }
        } catch (error) {
          console.error('❌ Error loading employee:', error);
          toast.error('Failed to load employee');
          navigate('/employees');
        } finally {
          setIsLoading(false);
        }
      };

      loadEmployee();
    }
  }, [isEditMode, id, navigate]);

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
  const handleSubmit = useCallback(async () => {
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

    setIsSaving(true);

    try {
      if (isEditMode && id) {
        // Update existing employee
        console.log('📝 Updating employee:', id);
        const updateData: UpdateEmployeeDTO = {
          ...(formData as CreateEmployeeDTO),
          id
        };
        await EmployeeFirebaseService.updateEmployee(updateData);
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        console.log('➕ Creating new employee');
        const createData: CreateEmployeeDTO = formData as CreateEmployeeDTO;
        await EmployeeFirebaseService.createEmployee(createData);
        toast.success('Employee added successfully');
      }

      console.log('✅ Employee saved, navigating to /employees');
      navigate('/employees');
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      toast.error('An error occurred while saving the employee');
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditMode, id, navigate]);


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
    isSaving,
    
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

