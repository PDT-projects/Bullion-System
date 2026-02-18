import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Loan, Bank } from '../../App';
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle,
  X,
  Building2,
  User,
  Users,
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

export function DeleteLoanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loans, setLoans, banks, setBanks } = useOutletContext<{
    loans: Loan[];
    setLoans: (loans: Loan[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const foundLoan = loans.find(l => l.id === id);
    setLoan(foundLoan || null);
    setIsLoading(false);
  }, [id, loans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = () => {
    if (!loan) return;

    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);

    // Reverse bank transaction if it was a bank loan
    if (loan.mode === 'Bank' && loan.bankId && setBanks) {
      const updatedBanks = banks.map(bank => {
        if (bank.id === loan.bankId) {
          // Reverse the transaction
          // For Receivable: money went OUT, so add it back
          // For Payable: money came IN, so deduct it
          const adjustment = loan.type === 'Receivable' ? loan.loanAmount : -loan.loanAmount;
          return { ...bank, balance: bank.balance + adjustment };
        }
        return bank;
      });
      setBanks(updatedBanks);
    }

    setLoans(loans.filter(l => l.id !== id));
    toast.success('Loan deleted successfully');
    
    navigate('/loans/all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan Not Found</h2>
          <p className="text-gray-600 mb-4">The loan you're trying to delete doesn't exist.</p>
          <button
            onClick={() => navigate('/loans/all')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Loans
          </button>
        </div>
      </div>
    );
  }

  const getReceiverIcon = () => {
    if (loan.receiverType === 'Employee' || loan.employeeId) {
      return <Users className="w-6 h-6 text-blue-600" />;
    }
    if (loan.type === 'Payable') {
      return <Building2 className="w-6 h-6 text-red-600" />;
    }
    return <User className="w-6 h-6 text-green-600" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'Receivable' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    return type === 'Receivable' 
      ? <TrendingUp className="w-4 h-4" />
      : <TrendingDown className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'Full' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  // Calculate bank impact
  const getBankImpact = () => {
    if (loan.mode !== 'Bank' || !loan.bankId) return null;
    
    const bank = banks.find(b => b.id === loan.bankId);
    if (!bank) return null;

    const currentBalance = bank.balance;
    // Reversing the transaction
    const newBalance = loan.type === 'Receivable' 
      ? currentBalance + loan.loanAmount  // Add back the money that went out
      : currentBalance - loan.loanAmount;  // Remove the money that came in

    return {
      bankName: bank.name,
      currentBalance,
      newBalance,
      isNegative: newBalance < 0
    };
  };

  const bankImpact = getBankImpact();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/loans/all')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Delete Loan</h2>
            <p className="text-gray-600 mt-1">Permanently remove this loan record</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Warning: This action cannot be undone</h3>
              <p className="text-sm text-red-700">
                Deleting this loan will permanently remove it from the system and reverse any bank transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Loan Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="p-3 bg-gray-100 rounded-lg">
              {getReceiverIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {loan.receiverName || loan.entityName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(loan.type)}`}>
                  {getTypeIcon(loan.type)}
                  {loan.type}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.loanAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="font-medium text-gray-900">{formatDate(loan.date)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-medium text-gray-900">{loan.loanType}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
              <p className="font-medium text-gray-900">
                {loan.mode === 'Bank' ? `Bank (${loan.bankName})` : 'Cash'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Paid</p>
              <p className="font-medium text-green-600">{formatCurrency(loan.paid)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className="font-medium text-red-600">{formatCurrency(loan.remaining)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-medium text-blue-900">{loan.status}</p>
            </div>
          </div>

          {/* Bank Impact Warning */}
          {bankImpact && (
            <div className={`border rounded-lg p-4 ${bankImpact.isNegative ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <h4 className={`font-semibold mb-3 ${bankImpact.isNegative ? 'text-red-900' : 'text-blue-900'}`}>
                🏦 Bank Account Impact
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className={bankImpact.isNegative ? 'text-red-700' : 'text-blue-700'}>Current Balance:</p>
                  <p className={`font-medium ${bankImpact.isNegative ? 'text-red-900' : 'text-blue-900'}`}>
                    {formatCurrency(bankImpact.currentBalance)}
                  </p>
                </div>
                <div>
                  <p className={bankImpact.isNegative ? 'text-red-700' : 'text-blue-700'}>
                    {loan.type === 'Receivable' ? 'Refund (Add back):' : 'Reversal (Deduct):'}
                  </p>
                  <p className={`font-medium ${loan.type === 'Receivable' ? 'text-green-600' : 'text-red-600'}`}>
                    {loan.type === 'Receivable' ? '+' : '-'}{formatCurrency(loan.loanAmount)}
                  </p>
                </div>
                <div>
                  <p className={bankImpact.isNegative ? 'text-red-700' : 'text-blue-700'}>New Balance:</p>
                  <p className={`font-bold ${bankImpact.isNegative ? 'text-red-600' : bankImpact.isNegative ? 'text-red-900' : 'text-blue-900'}`}>
                    {formatCurrency(bankImpact.newBalance)}
                  </p>
                </div>
              </div>
              {bankImpact.isNegative && (
                <p className="text-sm text-red-600 mt-3">
                  ⚠️ Warning: This will result in a negative balance in {bankImpact.bankName}!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
          <p className="text-gray-600 mb-4">
            To confirm deletion, please type <strong className="text-red-600">DELETE</strong> in the field below:
          </p>
          
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
            placeholder="Type DELETE to confirm"
          />

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => navigate('/loans/all')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== 'DELETE'}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              <Trash2 size={20} />
              {isDeleting ? 'Deleting...' : 'Permanently Delete Loan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
