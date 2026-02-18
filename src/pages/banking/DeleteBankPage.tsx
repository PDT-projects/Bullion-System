import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Bank } from '../../App';
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle,
  X,
  Building2,
  Landmark
} from 'lucide-react';
import { toast } from 'sonner';

export function DeleteBankPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const foundBank = banks.find(b => b.id === id);
    setBank(foundBank || null);
    setIsLoading(false);
  }, [id, banks]);

  const handleDelete = () => {
    if (!bank) return;

    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setBanks(banks.filter(b => b.id !== id));
    toast.success('Bank account deleted successfully');
    navigate('/banking/banks');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Not Found</h2>
          <p className="text-gray-600 mb-4">The bank account you're trying to delete doesn't exist.</p>
          <button
            onClick={() => navigate('/banking/banks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Banks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/banking/banks')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Delete Bank Account</h2>
            <p className="text-gray-600 mt-1">Permanently remove this bank account</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Warning: This action cannot be undone</h3>
              <p className="text-sm text-red-700">
                Deleting this bank account will permanently remove it from the system.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{bank.name}</h3>
              <p className="text-sm text-gray-500">{bank.accountNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Account ID</p>
              <p className="text-sm font-medium text-gray-900">{bank.id}</p>
            </div>
          </div>

          {bank.balance !== 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> This account has a balance of {formatCurrency(bank.balance)}. 
                Deleting it will remove this balance from your records. Consider transferring the balance first.
              </p>
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
              onClick={() => navigate('/banking/banks')}
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
              {isDeleting ? 'Deleting...' : 'Permanently Delete Bank'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
