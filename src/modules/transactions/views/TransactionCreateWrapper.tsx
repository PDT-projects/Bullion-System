// Transactions Module - Transaction Create Wrapper

import { TransactionFormView } from './TransactionFormView';
import { Transaction } from '../models/types';

interface TransactionCreateWrapperProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
}

export function TransactionCreateWrapper({ transactions, setTransactions }: TransactionCreateWrapperProps) {
  return (
    <TransactionFormView 
      transactions={transactions} 
      setTransactions={setTransactions}
    />
  );
}
