// Bills Module - ViewModel Layer
// Delete confirmation logic and state management

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill } from '../models/types';
import { BillsService } from '../models/billsService';

interface BillsContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseBillsDeleteViewModelReturn {
  // State
  bill: Bill | null;
  isDeleting: boolean;
  
  // Bill Info
  categoryColor: string;
  
  // Actions
  handleConfirmDelete: () => void;
  handleCancel: () => void;
}

export function useBillsDeleteViewModel(): UseBillsDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<BillsContext>();
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load bill data
  useEffect(() => {
    if (id) {
      const allBills = transactions.filter((t: any) => t.mainCategory === 'Bills') as Bill[];
      const foundBill = BillsService.findById(allBills, id);
      if (foundBill) {
        setBill(foundBill);
      } else {
        toast.error('Bill not found');
        navigate('/bills');
      }
    }
  }, [id, transactions, navigate]);

  // Calculate category color
  const categoryColor = bill ? BillsService.getCategoryColor(bill.subCategory) : '';

  const handleConfirmDelete = useCallback(() => {
    if (!id || !bill) return;
    
    setIsDeleting(true);
    
    try {
      // Reverse bank transaction if it was a bank payment
      if ((bill.mode === 'Bank' || bill.mode === 'Cheque') && bill.bankName && setBanks) {
        const updatedBanks = banks.map((bank: any) => {
          if (bank.name === bill.bankName) {
            return { ...bank, balance: bank.balance + bill.amount };
          }
          return bank;
        });
        setBanks(updatedBanks);
      }

      // Remove bill from transactions
      const updatedTransactions = transactions.filter((t: any) => t.id !== id);
      setTransactions(updatedTransactions);
      
      toast.success(`Bill for "${bill.paidTo || bill.subCategory}" deleted successfully!`);
      navigate('/bills');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill. Please try again.');
      setIsDeleting(false);
    }
  }, [id, bill, transactions, setTransactions, banks, setBanks, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/bills');
  }, [navigate]);

  return {
    bill,
    isDeleting,
    categoryColor,
    handleConfirmDelete,
    handleCancel
  };
}
