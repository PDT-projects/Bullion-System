/**
 * Loan Form ViewModel
 * 
 * Manages loan creation and editing form state, validation, and submission.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { 
  Loan, 
  Bank, 
  Employee, 
  LoanFormState, 
  LoanValidationErrors,
  LoanType,
  LoanCategory,
  PaymentMode,
  ReceiverType,
  CreateLoanDTO,
  UpdateLoanDTO
} from '../models/types';
import {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  validateLoan
} from '../models/loanService';

export interface UseLoanFormViewModelReturn {
  // Form state
  formData: LoanFormState;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: LoanValidationErrors;
  
  // Derived state
  isEditing: boolean;
  loanId?: string;
  remaining: number;
  status: 'Full' | 'Partial';
  
  // Bank/Employee options
  availableBanks: Bank[];
  availableEmployees: Employee[];
  
  // Form handlers
  setField: <K extends keyof LoanFormState>(field: K, value: LoanFormState[K]) => void;
  setEntityName: (value: string) => void;
  setLoanAmount: (value: string) => void;
  setPaidAmount: (value: string) => void;
  setDate: (value: string) => void;
  setType: (value: LoanType) => void;
  setLoanCategory: (value: LoanCategory) => void;
  setPaymentMode: (value: PaymentMode) => void;
  setBank: (bankId: string) => void;
  setReceiverType: (value: ReceiverType) => void;
  setReceiverName: (value: string) => void;
  setReceiverPhone: (value: string) => void;
  setEmployee: (employeeId: string) => void;
  
  // Actions
  validateForm: () => boolean;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  resetForm: () => void;
  
  // Calculated values
  isBankMode: boolean;
  isEmployeeReceiver: boolean;
  selectedBank?: Bank;
  selectedEmployee?: Employee;
}

const initialFormState: LoanFormState = {
  entityName: '',
  loanAmount: '',
  paid: '',
  date: new Date().toISOString().split('T')[0],
  type: 'Payable',
  loanType: 'Official',
  mode: 'Cash',
  bankId: '',
  receiverType: 'Person',
  receiverName: '',
  receiverId: '',
  receiverPhone: '',
  employeeId: ''
};

export const useLoanFormViewModel = (
  banks: Bank[],
  employees: Employee[],
  setBanks: (banks: Bank[]) => void,
  defaultType?: LoanType
): UseLoanFormViewModelReturn => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State
  const [formData, setFormData] = useState<LoanFormState>({
    ...initialFormState,
    type: defaultType || 'Payable'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoanValidationErrors>({});
  const [existingLoans, setExistingLoans] = useState<Loan[]>([]);
  
  // Check if editing
  const isEditing = Boolean(id);
  const loanId = id;
  
  // Load existing loan if editing
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      const loans = getAllLoans();
      setExistingLoans(loans);
      
      const loan = getLoanById(loans, id);
      if (loan) {
        setFormData({
          entityName: loan.entityName || '',
          loanAmount: loan.loanAmount.toString(),
          paid: loan.paid.toString(),
          date: loan.date,
          type: loan.type,
          loanType: loan.loanType,
          mode: loan.mode,
          bankId: loan.bankId || '',
          receiverType: loan.receiverType,
          receiverName: loan.receiverName || '',
          receiverId: loan.receiverId || '',
          receiverPhone: loan.receiverPhone || '',
          employeeId: loan.employeeId || ''
        });
      } else {
        toast.error('Loan not found');
        navigate('/loans/all');
      }
      
      setIsLoading(false);
    } else {
      setExistingLoans(getAllLoans());
    }
  }, [id, navigate, defaultType]);
  
  // Derived values
  const remaining = useMemo(() => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    return Math.max(0, amount - paid);
  }, [formData.loanAmount, formData.paid]);
  
  const status = useMemo<'Full' | 'Partial'>(() => {
    return remaining === 0 ? 'Full' : 'Partial';
  }, [remaining]);
  
  const isBankMode = formData.mode === 'Bank';
  const isEmployeeReceiver = formData.receiverType === 'Employee';
  
  const selectedBank = useMemo(() => 
    banks.find(b => b.id === formData.bankId),
  [banks, formData.bankId]);
  
  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === formData.employeeId),
  [employees, formData.employeeId]);
  
  // Field setters
  const setField = useCallback(<K extends keyof LoanFormState>(
    field: K, 
    value: LoanFormState[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof LoanValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const setEntityName = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, entityName: value }));
    if (errors.entityName) setErrors(prev => ({ ...prev, entityName: undefined }));
  }, [errors.entityName]);
  
  const setLoanAmount = useCallback((value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, loanAmount: value }));
      if (errors.loanAmount) setErrors(prev => ({ ...prev, loanAmount: undefined }));
    }
  }, [errors.loanAmount]);
  
  const setPaidAmount = useCallback((value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, paid: value }));
      if (errors.paid) setErrors(prev => ({ ...prev, paid: undefined }));
    }
  }, [errors.paid]);
  
  const setDate = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, date: value }));
    if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
  }, [errors.date]);
  
  const setType = useCallback((value: LoanType) => {
    setFormData(prev => ({ ...prev, type: value }));
    if (errors.type) setErrors(prev => ({ ...prev, type: undefined }));
  }, [errors.type]);
  
  const setLoanCategory = useCallback((value: LoanCategory) => {
    setFormData(prev => ({ ...prev, loanType: value }));
    if (errors.loanType) setErrors(prev => ({ ...prev, loanType: undefined }));
  }, [errors.loanType]);
  
  const setPaymentMode = useCallback((value: PaymentMode) => {
    setFormData(prev => ({ ...prev, mode: value, bankId: value === 'Cash' ? '' : prev.bankId }));
    if (errors.mode) setErrors(prev => ({ ...prev, mode: undefined }));
  }, [errors.mode]);
  
  const setBank = useCallback((bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    setFormData(prev => ({ 
      ...prev, 
      bankId,
      bankName: bank?.name 
    }));
    if (errors.bankId) setErrors(prev => ({ ...prev, bankId: undefined }));
  }, [banks, errors.bankId]);
  
  const setReceiverType = useCallback((value: ReceiverType) => {
    setFormData(prev => ({ 
      ...prev, 
      receiverType: value,
      employeeId: value === 'Person' ? '' : prev.employeeId,
      receiverName: value === 'Employee' && prev.employeeId ? '' : prev.receiverName
    }));
    if (errors.receiverType) setErrors(prev => ({ ...prev, receiverType: undefined }));
  }, [errors.receiverType]);
  
  const setReceiverName = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, receiverName: value }));
    if (errors.receiverName) setErrors(prev => ({ ...prev, receiverName: undefined }));
  }, [errors.receiverName]);
  
  const setReceiverPhone = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, receiverPhone: value }));
  }, []);
  
  const setEmployee = useCallback((employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData(prev => ({ 
      ...prev, 
      employeeId,
      employeeName: employee?.name,
      receiverName: employee?.name || prev.receiverName
    }));
  }, [employees]);
  
  // Validation
  const validateForm = useCallback((): boolean => {
    const dto: CreateLoanDTO = {
      entityName: formData.entityName,
      loanAmount: parseFloat(formData.loanAmount) || 0,
      paid: parseFloat(formData.paid) || 0,
      date: formData.date,
      type: formData.type,
      loanType: formData.loanType,
      mode: formData.mode,
      bankId: formData.bankId || undefined,
      bankName: selectedBank?.name,
      receiverType: formData.receiverType,
      receiverName: formData.receiverName,
      receiverId: formData.receiverId || undefined,
      receiverPhone: formData.receiverPhone || undefined,
      employeeId: formData.employeeId || undefined,
      employeeName: selectedEmployee?.name
    };
    
    const validationErrors = validateLoan(dto, existingLoans, id);
    setErrors(validationErrors);
    
    return Object.keys(validationErrors).length === 0;
  }, [formData, selectedBank, selectedEmployee, existingLoans, id]);
  
  // Submit handler
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      const dto: CreateLoanDTO = {
        entityName: formData.entityName,
        loanAmount: parseFloat(formData.loanAmount) || 0,
        paid: parseFloat(formData.paid) || 0,
        date: formData.date,
        type: formData.type,
        loanType: formData.loanType,
        mode: formData.mode,
        bankId: formData.bankId || undefined,
        bankName: selectedBank?.name,
        receiverType: formData.receiverType,
        receiverName: formData.receiverName,
        receiverId: formData.receiverId || undefined,
        receiverPhone: formData.receiverPhone || undefined,
        employeeId: formData.employeeId || undefined,
        employeeName: selectedEmployee?.name
      };
      
      if (isEditing && id) {
        // Update existing loan
        const updateDto: UpdateLoanDTO = { ...dto, id };
        const result = updateLoan(updateDto, existingLoans, banks, setBanks);
        
        if (result.success) {
          toast.success('Loan updated successfully');
          navigate('/loans/all');
          return true;
        } else {
          toast.error(result.error || 'Failed to update loan');
          return false;
        }
      } else {
        // Create new loan
        const result = createLoan(dto, existingLoans, banks, setBanks);
        
        if (result.success) {
          toast.success('Loan created successfully');
          navigate('/loans/all');
          return true;
        } else {
          toast.error(result.error || 'Failed to create loan');
          return false;
        }
      }
    } catch (err) {
      toast.error('An error occurred');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedBank, selectedEmployee, isEditing, id, existingLoans, banks, setBanks, validateForm, navigate]);
  
  // Cancel handler
  const handleCancel = useCallback(() => {
    navigate('/loans/all');
  }, [navigate]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
  }, []);
  
  return {
    formData,
    isLoading,
    isSubmitting,
    errors,
    isEditing,
    loanId,
    remaining,
    status,
    availableBanks: banks,
    availableEmployees: employees,
    setField,
    setEntityName,
    setLoanAmount,
    setPaidAmount,
    setDate,
    setType,
    setLoanCategory,
    setPaymentMode,
    setBank,
    setReceiverType,
    setReceiverName,
    setReceiverPhone,
    setEmployee,
    validateForm,
    handleSubmit,
    handleCancel,
    resetForm,
    isBankMode,
    isEmployeeReceiver,
    selectedBank,
    selectedEmployee
  };
};
