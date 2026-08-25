import { Transactions } from '../../features/finance/Transactions';
import { Transaction, Bank } from '../../App';

type CashInflowProps = {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function CashInflow({ transactions, setTransactions, banks, setBanks }: CashInflowProps) {
  // Filter only Cash Inflow transactions
  const inflowTransactions = transactions.filter(t => t.mainCategory === 'Cash Inflow');
  
  return (
    <div>
      <Transactions 
        transactions={inflowTransactions}
        setTransactions={setTransactions}
        banks={banks}
        setBanks={setBanks}
      />
    </div>
  );
}
