import { Loans } from './Loans';
import { Loan, Employee, Bank } from '../App';

type LoansReceivableProps = {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  employees: Employee[];
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function LoansReceivable({ loans, setLoans, employees, banks, setBanks }: LoansReceivableProps) {
  // Filter only Receivable loans
  const receivableLoans = loans.filter(l => l.type === 'Receivable');
  
  return (
    <div>
      <div className="p-6 pb-0">
        <h2 className="text-2xl font-bold mb-2">Receivable Loans</h2>
        <p className="text-sm text-gray-600">Loans that the company will receive back</p>
      </div>
      <Loans 
        loans={receivableLoans}
        setLoans={setLoans}
        employees={employees}
        banks={banks}
        setBanks={setBanks}
      />
    </div>
  );
}
