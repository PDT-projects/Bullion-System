// Bills Module - ViewModel Layer
// Create/Edit form logic — fetches from Firestore

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillTransaction, BILL_CATEGORIES, COMPANIES } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/billsFirebaseService';

interface UseBillsFormViewModelReturn {
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
  predefinedVendors: string[];
  companies: string[];
  banks: any[];
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
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    company: COMPANIES[0] as string,
    billCategory: 'Electricity' as keyof typeof BILL_CATEGORIES,
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([
    BillsService.getDefaultTransaction()
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const predefinedVendors = [
    'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
    'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
    'Office Landlord', 'Maintenance Company'
  ];

  // Load existing bill in edit mode
  useEffect(() => {
    if (!isEditing || !id) return;
    const load = async () => {
      try {
        setIsSubmitting(true);
        const bill = await BillsFirebaseService.fetchBillById(id);
        if (!bill) {
          toast.error('Bill not found');
          navigate('/bills');
          return;
        }
        setFormData({
          company: bill.company || COMPANIES[0],
          billCategory: (bill.subCategory as keyof typeof BILL_CATEGORIES) || 'Electricity',
          date: bill.date || new Date().toISOString().split('T')[0],
          note: bill.note || ''
        });
        setBillTransactions([{
          id: bill.id,
          amount: bill.amount || 0,
          paidBy: bill.paidBy || '',
          paidTo: bill.paidTo || '',
          transactionBy: bill.transactionBy || '',
          mode: bill.mode || 'Cash',
          bankName: bill.bankName || '',
          imageUrl: bill.imageUrl || '',
          paymentStatus: bill.paymentStatus || 'Full',
          remainingAmount: bill.remainingAmount || 0,
          billMonth: bill.billMonth || new Date().toISOString().slice(0, 7)
        }]);
      } catch (error) {
        toast.error('Failed to load bill');
        navigate('/bills');
      } finally {
        setIsSubmitting(false);
      }
    };
    load();
  }, [isEditing, id, navigate]);

  const setFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, [errors]);

  const addBillTransaction = useCallback(() => {
    setBillTransactions(prev => [...prev, BillsService.getDefaultTransaction()]);
  }, []);

  const removeBillTransaction = useCallback((txnId: string) => {
    setBillTransactions(prev => prev.length > 1 ? prev.filter(t => t.id !== txnId) : prev);
  }, []);

  const updateBillTransaction = useCallback((txnId: string, field: keyof BillTransaction, value: any) => {
    setBillTransactions(prev => prev.map(t => {
      if (t.id !== txnId) return t;
      const updated = { ...t, [field]: value };
      if (field === 'mode' && value === 'Cash') updated.bankName = '';
      return updated;
    }));
  }, []);

  const handleImageUpload = useCallback((txnId: string, file: File) => {
    if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => updateBillTransaction(txnId, 'imageUrl', reader.result as string);
    reader.readAsDataURL(file);
  }, [updateBillTransaction]);

  const calculateTotal = useCallback(
    () => billTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    [billTransactions]
  );

  const handleSubmit = useCallback(async () => {
    const validation = BillsService.validateBill(
      { company: formData.company, date: formData.date, subCategory: formData.billCategory as any },
      billTransactions
    );
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        const payload: Partial<Omit<Bill, 'id'>> = {
          company: formData.company,
          date: formData.date,
          subCategory: formData.billCategory as any,
          note: formData.note,
          amount: billTransactions[0]?.amount || 0,
          mode: billTransactions[0]?.mode || 'Cash',
          bankName: billTransactions[0]?.bankName || '',
          paidBy: billTransactions[0]?.paidBy || '',
          paidTo: billTransactions[0]?.paidTo || '',
          transactionBy: billTransactions[0]?.transactionBy || '',
          billMonth: billTransactions[0]?.billMonth || '',
          imageUrl: billTransactions[0]?.imageUrl || '',
          paymentStatus: billTransactions[0]?.paymentStatus || 'Full',
          remainingAmount: billTransactions[0]?.remainingAmount || 0
        };
        await BillsFirebaseService.updateBill(id, payload);
        toast.success('Bill updated successfully');
      } else {
        // Create one Firestore doc per transaction
        for (const txn of billTransactions) {
          const payload: Omit<Bill, 'id'> = {
            transactionId: `TXN-${Date.now()}${Math.random().toString().slice(-4)}`,
            date: formData.date,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            company: formData.company,
            mainCategory: 'Bills',
            subCategory: formData.billCategory as any,
            amount: txn.amount,
            mode: txn.mode,
            bankName: txn.bankName || '',
            paidBy: txn.paidBy,
            paidTo: txn.paidTo,
            transactionBy: txn.transactionBy || '',
            billMonth: txn.billMonth,
            note: formData.note || '',
            imageUrl: txn.imageUrl || '',
            paymentStatus: txn.paymentStatus,
            remainingAmount: txn.remainingAmount || 0
          };
          await BillsFirebaseService.createBill(payload);
        }
        toast.success(`${billTransactions.length} bill(s) added successfully`);
      }
      navigate('/bills');
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, billTransactions, isEditing, id, navigate]);

  const handleCancel = useCallback(() => navigate('/bills'), [navigate]);

  return {
    formData,
    billTransactions,
    isEditing,
    isSubmitting,
    errors,
    predefinedVendors,
    companies: COMPANIES as unknown as string[],
    banks: [],
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