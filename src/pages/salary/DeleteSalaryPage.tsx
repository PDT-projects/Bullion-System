import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Transaction } from '../../App';
import { 
  ArrowLeft, 
  AlertTriangle,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function DeleteSalaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, setTransactions } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const foundTransaction = transactions.find(t => t.id === id);
    if (foundTransaction) {
      setTransaction(foundTransaction);
    }
    setIsLoading(false);
  }, [id, transactions]);

  const handleDelete = () => {
    if (!transaction) return;

    setIsDeleting(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Salary record deleted successfully');
      
      // Navigate back to appropriate page
      const isAdvance = transaction.mainCategory === 'Cash Outflow' && transaction.subCategory === 'Advance Salary';
      if (isAdvance) {
        navigate('/salary/advance');
      } else {
        navigate('/salary/regular');
      }
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary record...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary Record Not Found</h2>
          <p className="text-gray-600 mb-4">The salary record you're trying to delete doesn't exist.</p>
          <button
            onClick={() => navigate('/salary')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Salary
          </button>
        </div>
      </div>
    );
  }

  const isAdvance = transaction.mainCategory === 'Cash Outflow' && transaction.subCategory === 'Advance Salary';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(isAdvance ? '/salary/advance' : '/salary/regular')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Delete Salary Record</h2>
            <p className="text-gray-600 mt-1">Confirm deletion of this salary record</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Warning: This action cannot be undone</h3>
              <p className="text-red-700">
                You are about to permanently delete this {isAdvance ? 'advance' : 'regular'} salary record. 
                This will remove all associated data including payment history, receipts, and transaction records.
              </p>
            </div>
          </div>
        </div>

        {/* Record Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                <p className="font-mono font-medium text-gray-900">{transaction.transactionId || transaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium text-gray-900">{formatDate(transaction.date)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee</p>
                  <p className="font-medium text-blue-600">{transaction.employeeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Salary Type</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    isAdvance 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdvance ? 'Advance Salary' : 'Regular Salary'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Salary Month</p>
                  <p className="font-medium text-gray-900">{transaction.salaryMonth || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="font-bold text-xl text-gray-900">
                    {formatCurrency(transaction.netAmount || transaction.amount)}
                  </p>
                </div>
              </div>
            </div>

            {!isAdvance && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Base Salary</p>
                    <p className="font-medium text-gray-900">{formatCurrency(transaction.baseSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Commission</p>
                    <p className="font-medium text-green-600">+{formatCurrency(transaction.commission || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Deductions</p>
                    <p className="font-medium text-red-600">-{formatCurrency(transaction.deductions || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
                  <p className="font-medium text-gray-900">
                    {transaction.mode}{transaction.bankName ? ` (${transaction.bankName})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid By</p>
                  <p className="font-medium text-gray-900">{transaction.paidBy || '-'}</p>
                </div>
              </div>
            </div>

            {transaction.note && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Note</p>
                <p className="font-medium text-gray-900">{transaction.note}</p>
              </div>
            )}

            {transaction.imageUrl && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">Receipt Image</p>
                <img 
                  src={transaction.imageUrl} 
                  alt="Receipt" 
                  className="h-32 w-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => navigate(isAdvance ? '/salary/advance' : '/salary/regular')}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            <Trash2 size={18} />
            {isDeleting ? 'Deleting...' : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
