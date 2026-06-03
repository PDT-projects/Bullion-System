// Employee Module - ViewModel Layer
// useEmployeeFormViewModel - Business logic for employee form (Create/Edit)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../models/types';
import { EmployeeService } from '../models/employeeService';
import { EmployeeFirebaseService } from '../models/employeeFirebaseService';

// ── Locations ──────────────────────────────────────────────────────────────────
export const DEFAULT_EMPLOYEE_LOCATIONS: readonly string[] = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Doha',
  'Kuwait City',
  'Muscat',
  'Bahrain',
  'Chad',
  'Sudan',
  'Cairo',
  'Nairobi',
  'Lagos',
  'London',
  'Toronto',
  'New York',
  'Other',
];

const CUSTOM_LOCATIONS_KEY = 'employee_custom_locations';

function loadCustomEmployeeLocations(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomEmployeeLocations(locs: string[]): void {
  try {
    localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(locs));
  } catch {
    // localStorage unavailable — ignore
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface UseEmployeeFormViewModelProps {
  mode: 'create' | 'edit';
}

// ── Return type ────────────────────────────────────────────────────────────────
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

  // Locations
  allLocations: string[];
  addCustomLocation: (name: string) => void;

  // Actions
  onFieldChange: (field: keyof Employee, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useEmployeeFormViewModel({
  mode,
}: UseEmployeeFormViewModelProps): UseEmployeeFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ==================== STATE ====================

  const [formData, setFormData] = useState<Partial<Employee>>(
    EmployeeService.getDefaultFormData()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Custom locations — persisted in localStorage
  const [customLocations, setCustomLocations] = useState<string[]>(
    loadCustomEmployeeLocations
  );

  const allLocations: string[] = [
    ...DEFAULT_EMPLOYEE_LOCATIONS,
    ...customLocations.filter(
      (l) => !(DEFAULT_EMPLOYEE_LOCATIONS as readonly string[]).includes(l)
    ),
  ];

  const addCustomLocation = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomLocations((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      saveCustomEmployeeLocations(next);
      return next;
    });
  }, []);

  // ==================== COMPUTED VALUES ====================

  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode ? 'Edit Employee' : 'Add Employee';
  const submitButtonText = isEditMode ? 'Update Employee' : 'Save Employee';

  const validation = useCallback(() => {
    return EmployeeService.validateEmployee(formData);
  }, [formData]);

  const isValid = validation().isValid;
  const errorMessage = validation().error;

  // ==================== EFFECTS ====================

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

  const setField = useCallback((field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log('🔘 Save button clicked');
    console.log('📋 Form data:', formData);

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
        console.log('📝 Updating employee:', id);
        const updateData: UpdateEmployeeDTO = {
          ...(formData as CreateEmployeeDTO),
          id,
        };
        await EmployeeFirebaseService.updateEmployee(updateData);
        toast.success('Employee updated successfully');
      } else {
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

  const handleCancel = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  // ==================== RETURN ====================

  return {
    formData,
    isValid,
    errorMessage,
    isLoading,
    isSaving,
    isEditMode,
    pageTitle,
    submitButtonText,
    allLocations,
    addCustomLocation,
    onFieldChange: setField,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
  };
}