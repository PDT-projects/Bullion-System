import { Transactions } from './Transactions';
import { Transaction, Bank } from '../App';

type CashOutflowProps = {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function CashOutflow({ transactions, setTransactions, banks, setBanks }: CashOutflowProps) {
  // Filter only Cash Outflow transactions
  const outflowTransactions = transactions.filter(t => t.mainCategory === 'Cash Outflow');
  
  return (
    <div>
      <Transactions 
        transactions={outflowTransactions}
        setTransactions={setTransactions}
        banks={banks}
        setBanks={setBanks}
      />
    </div>
  );
}
