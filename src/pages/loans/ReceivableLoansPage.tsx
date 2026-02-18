import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Loan, Bank, Employee } from '../../App';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  DollarSign,
  TrendingUp,
  User,
  Users,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export function ReceivableLoansPage() {
  const navigate = useNavigate();
  const { loans, setLoans, banks, setBanks, employees } = useOutletContext<{
    loans: Loan[];
    setLoans: (loans: Loan[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
    employees: Employee[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Full' | 'Partial'>('all');
  const [filterLoanType, setFilterLoanType] = useState<'all' | 'Official' | 'Personal' | 'Other'>('all');
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
  const [paymentBankId, setPaymentBankId] = useState('');

  // Filter only Receivable loans
  const receivableLoans = loans.filter(loan => loan.type === 'Receivable');

  // Apply additional filters
  const filteredLoans = receivableLoans.filter(loan => {
    const matchesSearch = 
      loan.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.bankName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
    const matchesLoanType = filterLoanType === 'all' || loan.loanType === filterLoanType;

    return matchesSearch && matchesStatus && matchesLoanType;
  });

  // Calculate statistics
  const stats = {
    totalLoans: receivableLoans.length,
    totalAmount: receivableLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    totalPaid: receivableLoans.reduce((sum, loan) => sum + loan.paid, 0),
    totalRemaining: receivableLoans.reduce((sum, loan) => sum + loan.remaining, 0),
    fullCount: receivableLoans.filter(l => l.status === 'Full').length,
    partialCount: receivableLoans.filter(l => l.status === 'Partial').length
  };

  const handleDeleteLoan = (id: string) => {
    const loanToDelete = loans.find(l => l.id === id);
    if (!loanToDelete) return;

    if (confirm('Are you sure you want to delete this loan?')) {
      if (loanToDelete.mode === 'Bank' && loanToDelete.bankId && setBanks) {
        const updatedBanks = banks.map(bank => {
          if (bank.id === loanToDelete.bankId) {
            const adjustment = loanToDelete.loanAmount; // Add back the money that went out
            return { ...bank, balance: bank.balance + adjustment };
          }
          return bank;
        });
        setBanks(updatedBanks);
      }

      setLoans(loans.filter(l => l.id !== id));
      toast.success('Loan deleted successfully');
    }
  };

  const handleMakePayment = (loan: Loan) => {
    setPaymentLoan(loan);
    setPaymentAmount(0);
    setPaymentMode('Bank');
    setPaymentBankId('');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSave = () => {
    if (!paymentLoan || !paymentAmount || !setBanks) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > paymentLoan.remaining) {
      toast.error('Payment amount cannot exceed remaining amount');
      return;
    }

    if (paymentMode === 'Bank' && !paymentBankId) {
      toast.error('Please select a bank account');
      return;
    }

    const bank = banks.find(b => b.id === paymentBankId);

    if (paymentMode === 'Bank' && bank && setBanks) {
      const updatedBanks = banks.map(b => {
        if (b.id === paymentBankId) {
          return { ...b, balance: b.balance + paymentAmount }; // Money comes IN
        }
        return b;
      });
      setBanks(updatedBanks);
      toast.success(`Payment received. ${formatCurrency(paymentAmount)} added to ${bank.name}`);
    } else {
      toast.success('Payment recorded (Cash)');
    }

    const paymentRecord = {
      id: Date.now().toString(),
      amount: paymentAmount,
      mode: paymentMode === 'Bank' ? 'Bank Transfer' : 'Cash' as 'Cash' | 'Bank Transfer',
      date: new Date().toISOString().split('T')[0],
      bankId: paymentBankId,
      bankName: bank?.name
    };

    const newPaid = paymentLoan.paid + paymentAmount;
    const newRemaining = paymentLoan.loanAmount - newPaid;
    const newStatus: 'Full' | 'Partial' = newRemaining === 0 ? 'Full' : 'Partial';

    const updatedLoan: Loan = {
      ...paymentLoan,
      paid: newPaid,
      remaining: newRemaining,
      status: newStatus,
      paymentHistory: [...(paymentLoan.paymentHistory || []), paymentRecord]
    };

    setLoans(loans.map(l => l.id === paymentLoan.id ? updatedLoan : l));
    setIsPaymentModalOpen(false);
    setPaymentLoan(null);
    setPaymentAmount(0);
  };

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

  const getStatusColor = (status: string) => {
    return status === 'Full' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getReceiverName = (loan: Loan) => {
    return loan.receiverName || loan.entityName || 'N/A';
  };

  const getReceiverTypeDisplay = (loan: Loan) => {
    if (loan.receiverType) return loan.receiverType;
    if (loan.employeeId) return 'Employee';
    return 'Person';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/loans')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Receivable Loans</h2>
            <p className="text-gray-600">Loans given to employees or individuals that will be received back</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/loans/create-receivable')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          Add Loan Receivable
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Loans</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-green-600">{stats.fullCount} Full</span>
            <span className="text-yellow-600">{stats.partialCount} Partial</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Received</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Total Remaining</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalRemaining)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by receiver name, bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="Full">Full</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterLoanType}
            onChange={(e) => setFilterLoanType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="Official">Official</option>
            <option value="Personal">Personal</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Receiver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Received</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remaining</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <User className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">No receivable loans found</p>
                  <p className="text-sm mt-1">Create a new receivable loan to get started</p>
                </td>
              </tr>
            ) : (
              filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getReceiverTypeDisplay(loan) === 'Employee' ? (
                        <Users size={16} className="text-gray-400" />
                      ) : (
                        <User size={16} className="text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{getReceiverName(loan)}</p>
                        <p className="text-xs text-gray-500">{getReceiverTypeDisplay(loan)} • {loan.loanType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(loan.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(loan.loanAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600">
                    {formatCurrency(loan.paid)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    {formatCurrency(loan.remaining)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingLoan(loan)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {loan.remaining > 0 && (
                        <button
                          onClick={() => handleMakePayment(loan)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                          title="Record Payment"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/loans/${loan.id}/edit`)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Loan Modal */}
      {viewingLoan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Loan Details</h3>
              <button
                onClick={() => setViewingLoan(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Receiver</p>
                  <div className="flex items-center gap-2">
                    {getReceiverTypeDisplay(viewingLoan) === 'Employee' ? (
                      <Users size={16} className="text-gray-400" />
                    ) : (
                      <User size={16} className="text-gray-400" />
                    )}
                    <p className="font-medium text-lg">{getReceiverName(viewingLoan)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getReceiverTypeDisplay(viewingLoan)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(viewingLoan.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewingLoan.loanType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="font-medium">
                    {viewingLoan.mode === 'Bank' ? `Bank (${viewingLoan.bankName})` : 'Cash'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingLoan.status)}`}>
                    {viewingLoan.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(viewingLoan.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Received Back</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(viewingLoan.paid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(viewingLoan.remaining)}</p>
                  </div>
                </div>
              </div>

              {viewingLoan.paymentHistory && viewingLoan.paymentHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Payment History</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewingLoan.paymentHistory.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-2 text-sm">{formatDate(payment.date)}</td>
                            <td className="px-4 py-2 text-sm font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-2 text-sm">{payment.mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentLoan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Record Payment Received</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Receiver</p>
                <p className="font-medium text-lg">{getReceiverName(paymentLoan)}</p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Remaining to Receive</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(paymentLoan.remaining)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={paymentLoan.remaining}
                  min={0.01}
                  step={0.01}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMode === 'Bank'}
                      onChange={() => setPaymentMode('Bank')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span>Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMode === 'Cash'}
                      onChange={() => setPaymentMode('Cash')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span>Cash</span>
                  </label>
                </div>
              </div>

              {paymentMode === 'Bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                  <select
                    value={paymentBankId}
                    onChange={(e) => setPaymentBankId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - {formatCurrency(bank.balance)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">💰 Payment will be added to selected bank</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
