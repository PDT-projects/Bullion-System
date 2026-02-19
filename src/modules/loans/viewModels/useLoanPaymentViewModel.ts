/**
 * Loan Payment ViewModel
 * 
 * Manages payment processing on existing loans with bank balance updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { 
  Loan, 
  Bank, 
  PaymentFormState, 
  PaymentMode
} from '../models/types';
import {
  getAllLoans,
  getLoanById,
  makePayment,
  formatCurrency,
  calculateProgress
} from '../models/loanService';

export interface UseLoanPaymentViewModelReturn {
  // State
  loan: Loan | null;
  formData: PaymentFormState;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Derived state
  canPay: boolean;
  maxPaymentAmount: number;
  remainingAfterPayment: number;
  newStatus: 'Full' | 'Partial';
  progressBefore: number;
  progressAfter: number;
  
  // Bank options
  availableBanks: Bank[];
  selectedBank?: Bank;
  isBankMode: boolean;
  
  // Form handlers
  setAmount: (value: string) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setBank: (bankId: string) => void;
  
  // Actions
  validateForm: () => boolean;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  refreshLoan: () => void;
}

const initialFormState: PaymentFormState = {
  amount: '',
  mode: 'Cash',
  bankId: ''
};

export const useLoanPaymentViewModel = (
  banks: Bank[],
  setBanks: (banks: Bank[]) => void
): UseLoanPaymentViewModelReturn => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State
  const [loan, setLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState<PaymentFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  
  // Load loan data
  const loadLoan = useCallback(() => {
    if (!id) {
      setError('No loan ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const loans = getAllLoans();
      setAllLoans(loans);
      
      const foundLoan = getLoanById(loans, id);
      if (foundLoan) {
        setLoan(foundLoan);
      } else {
        setError('Loan not found');
        toast.error('Loan not found');
        navigate('/loans/all');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan');
      toast.error('Failed to load loan');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);
  
  // Initial load
  useEffect(() => {
    loadLoan();
  }, [loadLoan]);
  
  // Derived values
  const canPay = useMemo(() => {
    return loan !== null && loan.remaining > 0 && loan.status !== 'Full';
  }, [loan]);
  
  const maxPaymentAmount = useMemo(() => {
    return loan?.remaining || 0;
  }, [loan]);
  
  const paymentAmount = useMemo(() => {
    return parseFloat(formData.amount) || 0;
  }, [formData.amount]);
  
  const remainingAfterPayment = useMemo(() => {
    if (!loan) return 0;
    return Math.max(0, loan.remaining - paymentAmount);
  }, [loan, paymentAmount]);
  
  const newStatus = useMemo<'Full' | 'Partial'>(() => {
    return remainingAfterPayment === 0 ? 'Full' : 'Partial';
  }, [remainingAfterPayment]);
  
  const progressBefore = useMemo(() => {
    if (!loan) return 0;
    return calculateProgress(loan);
  }, [loan]);
  
  const progressAfter = useMemo(() => {
    if (!loan) return 0;
    const newPaid = loan.paid + paymentAmount;
    if (loan.loanAmount === 0) return 0;
    return Math.round((newPaid / loan.loanAmount) * 100);
  }, [loan, paymentAmount]);
  
  const isBankMode = formData.mode === 'Bank';
  
  const selectedBank = useMemo(() => 
    banks.find(b => b.id === formData.bankId),
  [banks, formData.bankId]);
  
  // Field setters
  const setAmount = useCallback((value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }));
    }
  }, []);
  
  const setPaymentMode = useCallback((mode: PaymentMode) => {
    setFormData(prev => ({ 
      ...prev, 
      mode, 
      bankId: mode === 'Cash' ? '' : prev.bankId 
    }));
  }, []);
  
  const setBank = useCallback((bankId: string) => {
    setFormData(prev => ({ ...prev, bankId }));
  }, []);
  
  // Validation
  const validateForm = useCallback((): boolean => {
    if (!loan) return false;
    
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return false;
    }
    
    if (amount > loan.remaining) {
      toast.error(`Payment amount cannot exceed remaining balance (${formatCurrency(loan.remaining)})`);
      return false;
    }
    
    if (formData.mode === 'Bank' && !formData.bankId) {
      toast.error('Please select a bank account');
      return false;
    }
    
    // Check bank balance for payable loans
    if (formData.mode === 'Bank' && loan.type === 'Payable' && selectedBank) {
      if (selectedBank.balance < amount) {
        toast.error(`Insufficient balance in ${selectedBank.name}. Available: ${formatCurrency(selectedBank.balance)}`);
        return false;
      }
    }
    
    return true;
  }, [loan, formData, selectedBank]);
  
  // Submit handler
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!loan || !id) {
      toast.error('No loan selected');
      return false;
    }
    
    if (!validateForm()) {
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = makePayment(
        {
          loanId: id,
          amount: parseFloat(formData.amount),
          mode: formData.mode,
          bankId: formData.bankId || undefined,
          bankName: selectedBank?.name,
          date: new Date().toISOString().split('T')[0]
        },
        allLoans,
        banks,
        setBanks
      );
      
      if (result.success && result.loan) {
        toast.success(`Payment of ${formatCurrency(parseFloat(formData.amount))} recorded successfully`);
        
        // If loan is now fully paid, show special message
        if (result.loan.status === 'Full') {
          toast.success('Loan is now fully paid!');
        }
        
        navigate('/loans/all');
        return true;
      } else {
        toast.error(result.error || 'Failed to process payment');
        return false;
      }
    } catch (err) {
      toast.error('An error occurred while processing payment');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loan, id, formData, allLoans, banks, setBanks, selectedBank, validateForm, navigate]);
  
  // Cancel handler
  const handleCancel = useCallback(() => {
    navigate('/loans/all');
  }, [navigate]);
  
  // Refresh loan data
  const refreshLoan = useCallback(() => {
    loadLoan();
    setFormData(initialFormState);
  }, [loadLoan]);
  
  return {
    loan,
    formData,
    isLoading,
    isSubmitting,
    error,
    canPay,
    maxPaymentAmount,
    remainingAfterPayment,
    newStatus,
    progressBefore,
    progressAfter,
    availableBanks: banks,
    selectedBank,
    isBankMode,
    setAmount,
    setPaymentMode,
    setBank,
    validateForm,
    handleSubmit,
    handleCancel,
    refreshLoan
  };
};
