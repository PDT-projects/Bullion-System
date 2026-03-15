// // Transactions Module - Transaction Edit Wrapper

// import { useParams } from 'react-router-dom';
// import { TransactionFormView } from './TransactionFormView';
// import { Transaction } from '../models/types';

// interface TransactionEditWrapperProps {
//   transactions: Transaction[];
//   setTransactions: (transactions: Transaction[]) => void;
// }

// export function TransactionEditWrapper({ transactions, setTransactions }: TransactionEditWrapperProps) {
//   const { id } = useParams<{ id: string }>();
//   const existingTransaction = transactions.find(t => t.id === id);

//   return (
//     <TransactionFormView 
//       transactions={transactions} 
//       setTransactions={setTransactions}
//       existingTransaction={existingTransaction}
//     />
//   );
// }
