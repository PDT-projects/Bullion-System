// // Transactions Module - Transaction List Wrapper

// import { useOutletContext } from 'react-router-dom';
// import { TransactionListView } from './TransactionListView';
// import { Transaction } from '../models/types';
// import { useTransactionListViewModel } from '../viewModels/useTransactionListViewModel';

// export function TransactionListWrapper() {
//   // Get transactions from FinanceLayout Outlet context
//   const { transactions, setTransactions } = useOutletContext<{
//     transactions: Transaction[];
//     setTransactions: (transactions: Transaction[]) => void;
//   }>();

//   // Initialize ViewModel
//   const viewModel = useTransactionListViewModel(transactions, setTransactions);

//   return (
//     <TransactionListView 
//       transactions={viewModel.transactions}
//       setTransactions={setTransactions}
//     />
//   );
// }
