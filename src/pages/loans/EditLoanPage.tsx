import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Loan, Bank, Employee } from '../../App';
import { 
  ArrowLeft, 
  Save, 
  X,
  User,
  Users,
  Building2,
  DollarSign,
  Calendar,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export function EditLoanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loans, setLoans, banks, employees } = useOutletContext<{
    loans: Loan[];
    setLoans: (loans: Loan[]) => void;
    banks: Bank[];
    employees: Employee[];
  }>();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    loanType: 'Official' as 'Official' | 'Personal' | 'Other',
    date: '',
    notes: ''
  });

  useEffect(() => {
    const foundLoan = loans.find(l => l.id === id);
    if (foundLoan) {
      setLoan(foundLoan);
      setFormData({
        receiverName: foundLoan.receiverName || foundLoan.entityName || '',
        receiverPhone: foundLoan.receiverPhone || '',
        loanType: foundLoan.loanType,
        date: foundLoan.date,
        notes: ''
      });
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    setIsSubmitting(true);

    // Only allow editing certain fields for existing loans
    const updatedLoan: Loan = {
      ...loan,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone || undefined,
      loanType: formData.loanType,
      date: formData.date
    };

    setLoans(loans.map(l => l.id === loan.id ? updatedLoan : l));
    toast.success('Loan updated successfully');
    
    navigate('/loans/all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <p className="text-gray-600 mb-4">The loan you're trying to edit doesn't exist.</p>
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
      return <Users className="w-5 h-5 text-blue-600" />;
    }
    if (loan.type === 'Payable') {
      return <Building2 className="w-5 h-5 text-red-600" />;
    }
    return <User className="w-5 h-5 text-green-600" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'Receivable' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'Full' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/loans/all')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Edit Loan</h2>
            <p className="text-gray-600 mt-1">Update loan information</p>
          </div>
        </div>

        {/* Loan Info Banner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                {getReceiverIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {loan.receiverName || loan.entityName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(loan.type)}`}>
                    {loan.type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(loan.date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.loanAmount)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Edit Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              Editable Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receiver Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Receiver/Entity Name
                </label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+92 XXX XXXXXXX"
                />
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Category
                </label>
                <select
                  value={formData.loanType}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Official">Official</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Loan Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Read-only Information */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Loan Details (Read-only)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(loan.loanAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="font-medium text-green-600">{formatCurrency(loan.paid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="font-medium text-red-600">{formatCurrency(loan.remaining)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Mode</p>
                <p className="font-medium text-gray-900">
                  {loan.mode === 'Bank' ? `Bank (${loan.bankName})` : 'Cash'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Amount, payment mode, and bank details cannot be edited to maintain financial accuracy. 
              To change these, please delete this loan and create a new one.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/loans/all')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
