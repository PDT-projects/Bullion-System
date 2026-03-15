// // Transactions Module - Transaction Delete ViewModel

// import { useState, useCallback, useEffect } from 'react';
// import { Transaction } from '../models/types';
// import { TransactionService } from '../models/transactionsService';

// export interface TransactionDeleteViewModel {
//   // State
//   transaction: Transaction | null;
//   isLoading: boolean;
//   isDeleting: boolean;
//   confirmText: string;
  
//   // Actions
//   setConfirmText: (text: string) => void;
//   loadTransaction: (id: string) => void;
//   deleteTransaction: () => boolean;
//   resetForm: () => void;
  
//   // Utils
//   formatCurrency: (amount: number) => string;
//   formatDate: (dateString: string) => string;
// }

// export const useTransactionDeleteViewModel = (
//   transactions: Transaction[],
//   setTransactions: (transactions: Transaction[]) => void
// ): TransactionDeleteViewModel => {
//   const [transaction, setTransaction] = useState<Transaction | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [confirmText, setConfirmText] = useState('');

//   // Load transaction
//   const loadTransaction = useCallback((id: string) => {
//     setIsLoading(true);
//     const foundTransaction = transactions.find(t => t.id === id);
//     setTransaction(foundTransaction || null);
//     setIsLoading(false);
//   }, [transactions]);

//   // Delete transaction
//   const deleteTransaction = useCallback((): boolean => {
//     if (!transaction) return false;
    
//     if (confirmText !== 'DELETE') {
//       return false;
//     }

//     setIsDeleting(true);
//     setTransactions(TransactionService.deleteTransaction(transactions, transaction.id));
//     setIsDeleting(false);
    
//     return true;
//   }, [transactions, setTransactions, transaction, confirmText]);

//   // Reset form
//   const resetForm = useCallback(() => {
//     setTransaction(null);
//     setConfirmText('');
//     setIsLoading(false);
//     setIsDeleting(false);
//   }, []);

//   return {
//     transaction,
//     isLoading,
//     isDeleting,
//     confirmText,
//     setConfirmText,
//     loadTransaction,
//     deleteTransaction,
//     resetForm,
//     formatCurrency: TransactionService.formatCurrency,
//     formatDate: TransactionService.formatDate
//   };
// };
