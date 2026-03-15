// // Transactions Module - Transaction List ViewModel

// import { useState, useMemo, useCallback } from 'react';
// import { Transaction } from '../models/types';
// import { 
//   TransactionService, 
//   calculateTransactionStats, 
//   searchTransactions 
// } from '../models/transactionsService';

// export interface TransactionListViewModel {
//   // State
//   transactions: Transaction[];
//   searchQuery: string;
//   filteredTransactions: Transaction[];
//   stats: {
//     totalInflow: number;
//     totalOutflow: number;
//     netBalance: number;
//     transactionCount: number;
//   };
  
//   // Actions
//   setSearchQuery: (query: string) => void;
//   deleteTransaction: (id: string) => void;
//   refreshTransactions: () => void;
  
//   // Utils
//   formatCurrency: (amount: number) => string;
// }

// export const useTransactionListViewModel = (
//   transactions: Transaction[],
//   setTransactions: (transactions: Transaction[]) => void
// ): TransactionListViewModel => {
//   const [searchQuery, setSearchQuery] = useState('');

//   // Filter transactions based on search
//   const filteredTransactions = useMemo(() => {
//     if (!searchQuery.trim()) {
//       return transactions;
//     }
//     return searchTransactions(transactions, searchQuery);
//   }, [transactions, searchQuery]);

//   // Calculate stats
//   const stats = useMemo(() => {
//     return calculateTransactionStats(filteredTransactions);
//   }, [filteredTransactions]);

//   // Delete transaction
//   const deleteTransaction = useCallback((id: string) => {
//     setTransactions(TransactionService.deleteTransaction(transactions, id));
//   }, [transactions, setTransactions]);

//   // Refresh transactions (force update)
//   const refreshTransactions = useCallback(() => {
//     // This can be used to refresh data from server if needed
//   }, []);

//   return {
//     transactions,
//     searchQuery,
//     filteredTransactions,
//     stats,
//     setSearchQuery,
//     deleteTransaction,
//     refreshTransactions,
//     formatCurrency: TransactionService.formatCurrency
//   };
// };
