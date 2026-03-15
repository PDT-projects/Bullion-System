// Bills Module - ViewModel Layer
// Delete confirmation logic — fetches from Firestore

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/billsFirebaseService';

interface UseBillsDeleteViewModelReturn {
  bill: Bill | null;
  isDeleting: boolean;
  categoryColor: string;
  handleConfirmDelete: () => void;
  handleCancel: () => void;
}

export function useBillsDeleteViewModel(): UseBillsDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [bill, setBill] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) { navigate('/bills'); return; }
    const load = async () => {
      try {
        const data = await BillsFirebaseService.fetchBillById(id);
        if (!data) {
          toast.error('Bill not found');
          navigate('/bills');
          return;
        }
        setBill(data);
      } catch (error) {
        toast.error('Failed to load bill');
        navigate('/bills');
      }
    };
    load();
  }, [id, navigate]);

  const categoryColor = bill ? BillsService.getCategoryColor(bill.subCategory) : '';

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await BillsFirebaseService.deleteBill(id);
      toast.success(`Bill deleted successfully`);
      navigate('/bills');
    } catch (error) {
      toast.error('Failed to delete bill');
      setIsDeleting(false);
    }
  }, [id, navigate]);

  const handleCancel = useCallback(() => navigate('/bills'), [navigate]);

  return { bill, isDeleting, categoryColor, handleConfirmDelete, handleCancel };
}