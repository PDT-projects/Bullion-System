// // Transactions Module - Transaction Form ViewModel
// // Updated to use banks from props instead of hardcoded BANKS constant

// import { useState, useCallback, useMemo } from 'react';
// import { Transaction, TransactionItem, COMPANIES, SUB_CATEGORIES } from '../models/types';
// import { TransactionService } from '../models/transactionsService';

// // Bank type for transactions
// interface BankInfo {
//   id: string;
//   name: string;
//   balance: number;
// }

// export interface TransactionFormViewModel {
//   // State
//   formData: {
//     date: string;
//     company: string;
//     mainCategory: string;
//     subCategory: string;
//     amount: string;
//     mode: 'Cash' | 'Bank' | 'Cheque';
//     bankName: string;
//     note: string;
//   };
//   office: string;
//   transactionType: 'Cash Inflow' | 'Cash Outflow' | 'Loan';
//   paymentMode: 'Cash' | 'Bank' | 'Cheque';
//   selectedBank: string;
//   enableMultiple: boolean;
//   transactionItems: TransactionItem[];
//   availableSubCategories: string[];
//   isEditing: boolean;
//   editingTransaction: Transaction | null;
  
//   // Current bank balance
//   currentBankBalance: number;
//   totalAmount: number;
//   totalPaid: number;
//   totalRemaining: number;
//   remainingBalanceAfter: number;
  
//   // Constants
//   companies: typeof COMPANIES;
//   subCategories: typeof SUB_CATEGORIES;
//   banks: BankInfo[];
  
//   // Actions
//   setOffice: (office: string) => void;
//   setDate: (date: string) => void;
//   setTransactionType: (type: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => void;
//   setPaymentMode: (mode: 'Cash' | 'Bank' | 'Cheque') => void;
//   setSelectedBank: (bank: string) => void;
//   setEnableMultiple: (enabled: boolean) => void;
//   updateTransactionItem: (id: string, field: keyof TransactionItem, value: any) => void;
//   addTransactionItem: () => void;
//   removeTransactionItem: (id: string) => void;
//   setFormData: (data: Partial<TransactionFormViewModel['formData']>) => void;
//   resetForm: () => void;
//   loadTransaction: (transaction: Transaction) => void;
  
//   // Submit
//   handleSave: () => Transaction[];
//   validateForm: () => { isValid: boolean; errors: string[] };
// }

// const getInitialFormData = (): {
//   date: string;
//   company: string;
//   mainCategory: string;
//   subCategory: string;
//   amount: string;
//   mode: 'Cash' | 'Bank' | 'Cheque';
//   bankName: string;
//   note: string;
// } => ({
//   date: new Date().toISOString().split('T')[0],
//   company: '',
//   mainCategory: '',
//   subCategory: '',
//   amount: '',
//   mode: 'Cash',
//   bankName: '',
//   note: ''
// });

// const getInitialTransactionItem = (transactionType: 'Cash Inflow' | 'Cash Outflow' | 'Loan'): TransactionItem => ({
//   id: Date.now().toString(),
//   mainCategory: transactionType,
//   subCategory: '',
//   detailCategory: '',
//   amount: 0,
//   amountPaid: 0,
//   remainingAmount: 0,
//   paymentStatus: 'Full',
//   paidBy: '',
//   paidTo: '',
//   note: ''
// });

// export const useTransactionFormViewModel = (
//   transactions: Transaction[],
//   setTransactions: (transactions: Transaction[]) => void,
//   banks: BankInfo[],
//   existingTransaction?: Transaction
// ): TransactionFormViewModel => {
//   const isEditing = !!existingTransaction;
  
//   // General Information
//   const [office, setOffice] = useState(COMPANIES[0].id);
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
//   // Transaction Type
//   const [transactionType, setTransactionType] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  
//   // Payment Mode
//   const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Bank');
//   const [selectedBank, setSelectedBank] = useState('');
  
//   // Multiple transactions
//   const [enableMultiple, setEnableMultiple] = useState(false);
//   const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([
//     getInitialTransactionItem('Cash Inflow')
//   ]);

//   const [formData, setFormDataState] = useState(getInitialFormData());

//   const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

//   // Get selected bank balance from passed banks array
//   const selectedBankData = useMemo(() => {
//     return banks.find(b => b.id === selectedBank);
//   }, [banks, selectedBank]);
  
//   const currentBankBalance = selectedBankData?.balance || 0;

//   // Load existing transaction for editing
//   const loadTransaction = useCallback((transaction: Transaction) => {
//     // Set office based on company name
//     const officeId = COMPANIES.find(o => transaction.company?.includes(o.name.split(':')[1]?.trim()))?.id || COMPANIES[0].id;
//     setOffice(officeId);
//     setDate(transaction.date);
//     setTransactionType(transaction.mainCategory as 'Cash Inflow' | 'Cash Outflow' | 'Loan');
//     setPaymentMode(transaction.mode as 'Cash' | 'Bank' | 'Cheque');
    
//     if (transaction.bankName) {
//       const bankId = banks.find(b => transaction.bankName?.includes(b.name))?.id || '';
//       setSelectedBank(bankId);
//     }
    
//     setFormDataState({
//       date: transaction.date,
//       company: transaction.company,
//       mainCategory: transaction.mainCategory,
//       subCategory: transaction.subCategory,
//       amount: transaction.amount.toString(),
//       mode: transaction.mode as 'Cash' | 'Bank' | 'Cheque',
//       bankName: transaction.bankName || '',
//       note: transaction.note
//     });
    
//     setAvailableSubCategories(SUB_CATEGORIES[transaction.mainCategory] || []);
    
//     setTransactionItems([{
//       id: transaction.id,
//       mainCategory: transaction.mainCategory || '',
//       subCategory: transaction.subCategory || '',
//       detailCategory: (transaction as any).detailCategory || '',
//       amount: transaction.amount || 0,
//       amountPaid: (transaction as any).amountPaid || transaction.amount || 0,
//       remainingAmount: (transaction as any).remainingAmount || 0,
//       paymentStatus: (transaction as any).paymentStatus || 'Full',
//       paidBy: (transaction as any).paidBy || '',
//       paidTo: (transaction as any).paidTo || '',
//       note: transaction.note || ''
//     }]);
//   }, [banks]);

//   // Handle transaction type change
//   const handleTransactionTypeChange = useCallback((type: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => {
//     setTransactionType(type);
//     setAvailableSubCategories(SUB_CATEGORIES[type] || []);
//     setTransactionItems(items => items.map(item => ({
//       ...item,
//       mainCategory: type,
//       subCategory: ''
//     })));
//   }, []);

//   // Add transaction item
//   const handleAddTransactionItem = useCallback(() => {
//     setTransactionItems([...transactionItems, {
//       ...getInitialTransactionItem(transactionType),
//       id: Date.now().toString()
//     }]);
//   }, [transactionItems, transactionType]);

//   // Remove transaction item
//   const handleRemoveTransactionItem = useCallback((id: string) => {
//     if (transactionItems.length > 1) {
//       setTransactionItems(transactionItems.filter(item => item.id !== id));
//     }
//   }, [transactionItems]);

//   // Update transaction item
//   const updateTransactionItem = useCallback((id: string, field: keyof TransactionItem, value: any) => {
//     setTransactionItems(items => items.map(item => {
//       if (item.id !== id) return item;
      
//       const updated = { ...item, [field]: value };
      
//       // Auto-calculate remaining amount when amount or amountPaid changes
//       if (field === 'amount' || field === 'amountPaid') {
//         const amount = field === 'amount' ? Number(value) : item.amount;
//         const amountPaid = field === 'amountPaid' ? Number(value) : item.amountPaid;
//         updated.remainingAmount = Math.max(0, amount - amountPaid);
//         updated.paymentStatus = amountPaid >= amount ? 'Full' : 'Partial';
//       }
      
//       return updated;
//     }));
//   }, []);

//   // Calculate totals
//   const calculateTotals = useCallback(() => {
//     const totalAmount = transactionItems.reduce((sum, item) => sum + (item.amount || 0), 0);
//     const totalPaid = transactionItems.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
//     const totalRemaining = totalAmount - totalPaid;
//     return { totalAmount, totalPaid, totalRemaining };
//   }, [transactionItems]);

//   const { totalAmount, totalPaid, totalRemaining } = calculateTotals();
//   const remainingBalanceAfter = currentBankBalance + (transactionType === 'Cash Inflow' ? totalPaid : -totalPaid);

//   // Set form data
//   const setFormData = useCallback((data: Partial<{
//     date: string;
//     company: string;
//     mainCategory: string;
//     subCategory: string;
//     amount: string;
//     mode: 'Cash' | 'Bank' | 'Cheque';
//     bankName: string;
//     note: string;
//   }>) => {
//     setFormDataState(prev => ({ ...prev, ...data }));
//   }, []);

//   // Reset form
//   const resetForm = useCallback(() => {
//     setOffice(COMPANIES[0].id);
//     setDate(new Date().toISOString().split('T')[0]);
//     setTransactionType('Cash Inflow');
//     setPaymentMode('Bank');
//     setSelectedBank('');
//     setEnableMultiple(false);
//     setTransactionItems([getInitialTransactionItem('Cash Inflow')]);
//     setFormDataState(getInitialFormData());
//     setAvailableSubCategories([]);
//   }, []);

//   // Validate form
//   const validateForm = useCallback(() => {
//     const errors: string[] = [];
    
//     const invalidItems = transactionItems.filter(item => !item.subCategory || item.amount <= 0);
//     if (invalidItems.length > 0) {
//       errors.push('Please fill in all required fields for each transaction');
//     }

//     if (paymentMode === 'Bank' && !selectedBank) {
//       errors.push('Please select a bank for bank transactions');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }, [transactionItems, paymentMode, selectedBank]);

//   // Handle save
//   const handleSave = useCallback(() => {
//     const validation = validateForm();
//     if (!validation.isValid) {
//       throw new Error(validation.errors.join(', '));
//     }

//     const selectedBankData = banks.find(b => b.id === selectedBank);

//     // Create transactions for each item
//     const newTransactions: Transaction[] = transactionItems.map((item, index) => ({
//       id: isEditing && existingTransaction ? existingTransaction.id : `${Date.now()}-${index}`,
//       transactionId: isEditing && existingTransaction ? existingTransaction.transactionId : TransactionService.generateTransactionId(),
//       date: date,
//       time: new Date().toLocaleTimeString('en-US', { hour12: false }),
//       company: COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
//       mainCategory: transactionType,
//       subCategory: item.subCategory,
//       amount: item.amount,
//       mode: paymentMode,
//       bankName: paymentMode === 'Bank' ? selectedBankData?.name : undefined,
//       note: item.note,
//       // Additional fields
//       detailCategory: item.detailCategory,
//       amountPaid: item.amountPaid,
//       remainingAmount: item.remainingAmount,
//       paymentStatus: item.paymentStatus,
//       paidBy: item.paidBy,
//       paidTo: item.paidTo
//     }));

//     if (isEditing && existingTransaction) {
//       // Update existing transaction
//       setTransactions(transactions.map(t => 
//         t.id === existingTransaction.id ? { ...newTransactions[0], id: existingTransaction.id, transactionId: existingTransaction.transactionId } : t
//       ));
//     } else {
//       // Add new transactions
//       setTransactions([...newTransactions, ...transactions]);
//     }

//     return newTransactions;
//   }, [transactions, setTransactions, transactionItems, date, office, transactionType, paymentMode, selectedBank, isEditing, existingTransaction, validateForm, banks]);

//   return {
//     // State
//     formData,
//     office,
//     transactionType,
//     paymentMode,
//     selectedBank,
//     enableMultiple,
//     transactionItems,
//     availableSubCategories,
//     isEditing,
//     editingTransaction: existingTransaction || null,
    
//     // Computed
//     currentBankBalance,
//     totalAmount,
//     totalPaid,
//     totalRemaining,
//     remainingBalanceAfter,
    
//     // Constants
//     companies: COMPANIES,
//     subCategories: SUB_CATEGORIES,
//     banks,
    
//     // Actions
//     setOffice,
//     setDate,
//     setTransactionType: handleTransactionTypeChange,
//     setPaymentMode,
//     setSelectedBank,
//     setEnableMultiple,
//     updateTransactionItem,
//     addTransactionItem: handleAddTransactionItem,
//     removeTransactionItem: handleRemoveTransactionItem,
//     setFormData,
//     resetForm,
//     loadTransaction,
    
//     // Submit
//     handleSave,
//     validateForm
//   };
// };
