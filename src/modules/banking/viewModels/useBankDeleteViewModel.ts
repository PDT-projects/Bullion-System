// Banking Module - Bank Delete ViewModel

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bank } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';

export function useBankDeleteViewModel() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { navigate('/banking/banks'); return; }
    BankFirebaseService.fetchBankById(id)
      .then(data => {
        if (!data) { toast.error('Bank not found'); navigate('/banking/banks'); return; }
        setBank(data);
      })
      .catch(() => setError('Failed to load bank'))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      await BankFirebaseService.deleteBank(id);
      toast.success('Bank account deleted successfully');
      navigate('/banking/banks');
    } catch (err) {
      toast.error('Failed to delete bank account');
      setIsLoading(false);
    }
  }, [id, navigate]);

  const handleCancel = useCallback(() => navigate('/banking/banks'), [navigate]);

  return { bank, isLoading, error, handleDelete, handleCancel, formatCurrency: BankingService.formatCurrency };
}