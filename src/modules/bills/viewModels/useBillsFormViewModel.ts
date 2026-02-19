// Bills Module - ViewModel Layer
// Create/Edit form logic and state management

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillTransaction, CreateBillDTO, UpdateBillDTO, BILL_CATEGORIES, COMPANIES } from '../models/types';
import { BillsService } from '../models/billsService';

interface BillsContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseBillsFormViewModelReturn {
  // Form State
  formData: {
    company: string;
    billCategory: keyof typeof BILL_CATEGORIES;
    date: string;
    note: string;
  };
  billTransactions: BillTransaction[];
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  
  // UI State
  predefinedVendors: string[];
  companies: string[];
  banks: any[];
  
  // Actions
  setFormField: (field: string, value: any) => void;
  addBillTransaction: () => void;
  removeBillTransaction: (id: string) => void;
  updateBillTransaction: (id: string, field: keyof BillTransaction, value: any) => void;
  handleImageUpload: (id: string, file: File) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
}

export function useBillsFormViewModel(): UseBillsFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<BillsContext>();
  
  const isEditing = !!id;
  
  // Form state
  const [formData, setFormData] = useState({
    company: COMPANIES[0],
    billCategory: 'Electricity' as keyof typeof BILL_CATEGORIES,
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  
  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([
    BillsService.getDefaultTransaction()
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Predefined data
  const predefinedVendors = [
    'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
    'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
    'Office Landlord', 'Maintenance Company'
  ];

  // Load existing bill data if editing
  useEffect(() => {
    if (isEditing && id) {
      const existingBill = transactions.find((t: any) => t.id === id && t.mainCategory === 'Bills');
      if (existingBill) {
        setFormData({
          company: existingBill.company || COMPANIES[0],
          billCategory: existingBill.subCategory || 'Electricity',
          date: existingBill.date || new Date().toISOString().split('T')[0],
          note: existingBill.note || ''
        });
        
        setBillTransactions([{
          id: existingBill.id,
          amount: existingBill.amount || 0,
          paidBy: existingBill.paidBy || '',
          paidTo: existingBill.paidTo || '',
          transactionBy: existingBill.transactionBy || '',
          mode: existingBill.mode || 'Cash',
          bankName: existingBill.bankName || '',
          imageUrl: existingBill.imageUrl || '',
          paymentStatus: existingBill.paymentStatus || 'Full',
          remainingAmount: existingBill.remainingAmount || 0,
          billMonth: existingBill.billMonth || new Date().toISOString().slice(0, 7)
        }]);
      } else {
        toast.error('Bill not found');
        navigate('/bills');
      }
    }
  }, [isEditing, id, transactions, navigate]);

  const setFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user changes it
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const addBillTransaction = useCallback(() => {
    setBillTransactions(prev => [...prev, BillsService.getDefaultTransaction()]);
  }, []);

  const removeBillTransaction = useCallback((id: string) => {
    setBillTransactions(prev => {
      if (prev.length > 1) {
        return prev.filter(t => t.id !== id);
      }
      return prev;
    });
  }, []);

  const updateBillTransaction = useCallback((id: string, field: keyof BillTransaction, value: any) => {
    setBillTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        // Clear bank name if switching to cash
        if (field === 'mode' && value === 'Cash') {
          updated.bankName = '';
        }
        return updated;
      }
      return t;
    }));
    
    // Clear error for this field
    const errorKey = `transaction_${billTransactions.findIndex(t => t.id === id)}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [billTransactions, errors]);

  const handleImageUpload = useCallback((id: string, file: File) => {
    if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      updateBillTransaction(id, 'imageUrl', reader.result as string);
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  }, [updateBillTransaction]);

  const calculateTotal = useCallback(() => {
    return billTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [billTransactions]);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    
    // Validate
    const validation = BillsService.validateBill(
      { ...formData, subCategory: formData.billCategory },
      billTransactions
    );
    
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      setIsSubmitting(false);
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    try {
      // Check bank balances
      for (const txn of billTransactions) {
        if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && txn.bankName) {
          const bank = banks.find((b: any) => b.name === txn.bankName);
          if (bank && bank.balance < txn.amount) {
            toast.error(`Insufficient balance in ${bank.name}`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (isEditing && id) {
        // Update existing bill
        const updateData: UpdateBillDTO = {
          id,
          company: formData.company,
          date: formData.date,
          subCategory: formData.billCategory,
          note: formData.note,
          transactions: billTransactions
        };
        
        const allBills = transactions.filter((t: any) => t.mainCategory === 'Bills') as Bill[];
        const updatedBills = BillsService.updateBill(allBills, id, updateData);
        
        // Update transactions array
        const nonBillTransactions = transactions.filter((t: any) => t.mainCategory !== 'Bills');
        setTransactions([...nonBillTransactions, ...updatedBills]);
        
        toast.success('Bill updated successfully!');
      } else {
        // Create new bills
        const createData: CreateBillDTO = {
          company: formData.company,
          date: formData.date,
          subCategory: formData.billCategory,
          note: formData.note,
          transactions: billTransactions
        };
        
        const allBills = transactions.filter((t: any) => t.mainCategory === 'Bills') as Bill[];
        const newBills = BillsService.createBills(allBills, createData);
        
        // Update transactions array
        const nonBillTransactions = transactions.filter((t: any) => t.mainCategory !== 'Bills');
        setTransactions([...nonBillTransactions, ...newBills]);
        
        // Update bank balances
        if (setBanks) {
          const updatedBanks = [...banks];
          for (const txn of billTransactions) {
            if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && txn.bankName) {
              const bankIndex = updatedBanks.findIndex((b: any) => b.name === txn.bankName);
              if (bankIndex !== -1) {
                updatedBanks[bankIndex] = {
                  ...updatedBanks[bankIndex],
                  balance: updatedBanks[bankIndex].balance - txn.amount
                };
              }
            }
          }
          setBanks(updatedBanks);
        }
        
        toast.success(`${billTransactions.length} bill transaction(s) added successfully`);
      }
      
      navigate('/bills');
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, billTransactions, isEditing, id, transactions, setTransactions, banks, setBanks, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/bills');
  }, [navigate]);

  return {
    formData,
    billTransactions,
    isEditing,
    isSubmitting,
    errors,
    predefinedVendors,
    companies: COMPANIES as unknown as string[],
    banks,
    setFormField,
    addBillTransaction,
    removeBillTransaction,
    updateBillTransaction,
    handleImageUpload,
    handleSubmit,
    handleCancel,
    calculateTotal
  };
}
