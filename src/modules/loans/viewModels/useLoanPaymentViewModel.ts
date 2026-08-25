/**
 * Loan Payment ViewModel
 * Manages payment processing on existing loans.
 * Backed by Firebase Firestore.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Loan, Bank, PaymentFormState, PaymentMode, MakePaymentDTO } from '../models/types';
import { calculateProgress, formatCurrency } from '../models/loanService';
import { LoanFirebaseService } from '../models/Loanfirebaseservice';

const initialFormState: PaymentFormState = { amount: '', mode: 'Cash', bankId: '' };

export function useLoanPaymentViewModel(banks: Bank[]) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ==================== STATE ====================

  const [loan, setLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState<PaymentFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== LOAD ====================

  const loadLoan = useCallback(async () => {
    if (!id) { setError('No loan ID provided'); setIsLoading(false); return; }
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Loading loan ${id} for payment...`);
      const found = await LoanFirebaseService.fetchLoanById(id);
      if (found) {
        setLoan(found);
        console.log('✅ Loan loaded:', found.entityName);
      } else {
        setError('Loan not found');
        toast.error('Loan not found');
        navigate('/loans/all');
      }
    } catch {
      setError('Failed to load loan');
      toast.error('Failed to load loan');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadLoan(); }, [loadLoan]);

  // ==================== DERIVED ====================

  const canPay = useMemo(() => loan !== null && loan.remaining > 0 && loan.status !== 'Full', [loan]);
  const maxPaymentAmount = useMemo(() => loan?.remaining || 0, [loan]);
  const paymentAmount = useMemo(() => parseFloat(formData.amount) || 0, [formData.amount]);

  const remainingAfterPayment = useMemo(() => {
    if (!loan) return 0;
    return Math.max(0, loan.remaining - paymentAmount);
  }, [loan, paymentAmount]);

  const newStatus = useMemo<'Full' | 'Partial'>(() => remainingAfterPayment === 0 ? 'Full' : 'Partial', [remainingAfterPayment]);

  const progressBefore = useMemo(() => loan ? calculateProgress(loan) : 0, [loan]);

  const progressAfter = useMemo(() => {
    if (!loan) return 0;
    const newPaid = loan.paid + paymentAmount;
    return loan.loanAmount === 0 ? 0 : Math.round((newPaid / loan.loanAmount) * 100);
  }, [loan, paymentAmount]);

  const isBankMode = formData.mode === 'Bank';
  const selectedBank = useMemo(() => banks.find(b => b.id === formData.bankId), [banks, formData.bankId]);

  // ==================== FIELD SETTERS ====================

  const setAmount = useCallback((v: string) => {
    if (v === '' || /^\d*\.?\d*$/.test(v)) setFormData(p => ({ ...p, amount: v }));
  }, []);

  const setPaymentMode = useCallback((mode: PaymentMode) => {
    setFormData(p => ({ ...p, mode, bankId: mode === 'Cash' ? '' : p.bankId }));
  }, []);

  const setBank = useCallback((bankId: string) => setFormData(p => ({ ...p, bankId })), []);

  // ==================== SUBMIT ====================

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!loan || !id) { toast.error('No loan selected'); return false; }

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return false;
    }
    if (paymentAmount > loan.remaining) {
      toast.error(`Payment amount cannot exceed remaining balance (${formatCurrency(loan.remaining)})`);
      return false;
    }
    if (formData.mode === 'Bank' && !formData.bankId) {
      toast.error('Please select a bank account');
      return false;
    }
    if (formData.mode === 'Bank' && loan.type === 'Payable' && selectedBank && selectedBank.balance < paymentAmount) {
      toast.error(`Insufficient balance in ${selectedBank.name}. Available: ${formatCurrency(selectedBank.balance)}`);
      return false;
    }

    setIsSubmitting(true);
    try {
      const dto: MakePaymentDTO = {
        loanId: id,
        amount: paymentAmount,
        mode: formData.mode,
        bankId: formData.bankId || undefined,
        bankName: selectedBank?.name,
        date: new Date().toISOString().split('T')[0],
      };

      const updatedLoan = await LoanFirebaseService.makePayment(dto, loan);
      toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded successfully`);
      if (updatedLoan.status === 'Full') toast.success('Loan is now fully paid!');
      navigate('/loans/all');
      return true;
    } catch {
      toast.error('An error occurred while processing payment');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loan, id, formData, paymentAmount, selectedBank, navigate]);

  const handleCancel = useCallback(() => navigate('/loans/all'), [navigate]);

  const refreshLoan = useCallback(() => {
    loadLoan();
    setFormData(initialFormState);
  }, [loadLoan]);

  // ==================== RETURN ====================

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
    validateForm: () => !(!paymentAmount || paymentAmount <= 0 || paymentAmount > maxPaymentAmount || (isBankMode && !formData.bankId)),
    handleSubmit,
    handleCancel,
    refreshLoan,
  };
}