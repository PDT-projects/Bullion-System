/**
 * Loan Form ViewModel
 * Manages loan creation and editing form state, validation, and submission.
 * Backed by Firebase Firestore.
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
  UpdateLoanDTO,
} from '../models/types';
import { validateLoan } from '../models/loanService';
import { LoanFirebaseService } from '../models/Loanfirebaseservice';

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
  employeeId: '',
};

export function useLoanFormViewModel(
  banks: Bank[],
  employees: Employee[],
  defaultType?: LoanType,
) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditing = Boolean(id);

  // ==================== STATE ====================

  const [formData, setFormData] = useState<LoanFormState>({
    ...initialFormState,
    type: defaultType || 'Payable',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoanValidationErrors>({});

  // ==================== LOAD EXISTING ====================

  useEffect(() => {
    if (isEditing && id) {
      const load = async () => {
        setIsLoading(true);
        try {
          console.log(`🔄 Loading loan ${id} for editing...`);
          const loan = await LoanFirebaseService.fetchLoanById(id);
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
              employeeId: loan.employeeId || '',
            });
            console.log('✅ Loan loaded for editing:', loan.entityName);
          } else {
            toast.error('Loan not found');
            navigate('/loans/all');
          }
        } catch {
          toast.error('Failed to load loan');
          navigate('/loans/all');
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [isEditing, id, navigate]);

  // ==================== DERIVED ====================

  const remaining = useMemo(() => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    return Math.max(0, amount - paid);
  }, [formData.loanAmount, formData.paid]);

  const status = useMemo<'Full' | 'Partial'>(() => remaining === 0 ? 'Full' : 'Partial', [remaining]);
  const isBankMode = formData.mode === 'Bank';
  const isEmployeeReceiver = formData.receiverType === 'Employee';

  const selectedBank = useMemo(() => banks.find(b => b.id === formData.bankId), [banks, formData.bankId]);
  const selectedEmployee = useMemo(() => employees.find(e => e.id === formData.employeeId), [employees, formData.employeeId]);

  // ==================== FIELD SETTERS ====================

  const clearFieldError = useCallback((field: keyof LoanValidationErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  const setEntityName = useCallback((v: string) => { setFormData(p => ({ ...p, entityName: v })); clearFieldError('entityName'); }, [clearFieldError]);
  const setLoanAmount = useCallback((v: string) => { if (v === '' || /^\d*\.?\d*$/.test(v)) { setFormData(p => ({ ...p, loanAmount: v })); clearFieldError('loanAmount'); } }, [clearFieldError]);
  const setPaidAmount = useCallback((v: string) => { if (v === '' || /^\d*\.?\d*$/.test(v)) { setFormData(p => ({ ...p, paid: v })); clearFieldError('paid'); } }, [clearFieldError]);
  const setDate = useCallback((v: string) => { setFormData(p => ({ ...p, date: v })); clearFieldError('date'); }, [clearFieldError]);
  const setType = useCallback((v: LoanType) => { setFormData(p => ({ ...p, type: v })); clearFieldError('type'); }, [clearFieldError]);
  const setLoanCategory = useCallback((v: LoanCategory) => { setFormData(p => ({ ...p, loanType: v })); clearFieldError('loanType'); }, [clearFieldError]);
  const setPaymentMode = useCallback((v: PaymentMode) => { setFormData(p => ({ ...p, mode: v, bankId: v === 'Cash' ? '' : p.bankId })); clearFieldError('mode'); }, [clearFieldError]);
  const setBank = useCallback((bankId: string) => { setFormData(p => ({ ...p, bankId })); clearFieldError('bankId'); }, [clearFieldError]);
  const setReceiverType = useCallback((v: ReceiverType) => { setFormData(p => ({ ...p, receiverType: v, employeeId: v === 'Person' ? '' : p.employeeId })); clearFieldError('receiverType'); }, [clearFieldError]);
  const setReceiverName = useCallback((v: string) => { setFormData(p => ({ ...p, receiverName: v })); clearFieldError('receiverName'); }, [clearFieldError]);
  const setReceiverPhone = useCallback((v: string) => setFormData(p => ({ ...p, receiverPhone: v })), []);
  const setEmployee = useCallback((employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    setFormData(p => ({ ...p, employeeId, receiverName: emp?.name || p.receiverName }));
  }, [employees]);

  const setField = useCallback(<K extends keyof LoanFormState>(field: K, value: LoanFormState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field as keyof LoanValidationErrors);
  }, [clearFieldError]);

  // ==================== SUBMIT ====================

  const buildDTO = useCallback((): CreateLoanDTO => ({
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
    employeeName: selectedEmployee?.name,
  }), [formData, selectedBank, selectedEmployee]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    const dto = buildDTO();
    const validationErrors = validateLoan(dto);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return false;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        const existing = await LoanFirebaseService.fetchLoanById(id);
        if (!existing) { toast.error('Loan not found'); return false; }
        const updateDto: UpdateLoanDTO = { ...dto, id };
        await LoanFirebaseService.updateLoan(updateDto, existing);
        toast.success('Loan updated successfully');
      } else {
        await LoanFirebaseService.createLoan(dto);
        toast.success('Loan created successfully');
      }
      navigate('/loans/all');
      return true;
    } catch {
      toast.error('An error occurred while saving the loan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [buildDTO, isEditing, id, navigate]);

  const handleCancel = useCallback(() => navigate('/loans/all'), [navigate]);
  const resetForm = useCallback(() => { setFormData(initialFormState); setErrors({}); }, []);

  // ==================== RETURN ====================

  return {
    formData,
    isLoading,
    isSubmitting,
    errors,
    isEditing,
    loanId: id,
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
    validateForm: () => Object.keys(validateLoan(buildDTO())).length === 0,
    handleSubmit,
    handleCancel,
    resetForm,
    isBankMode,
    isEmployeeReceiver,
    selectedBank,
    selectedEmployee,
  };
}