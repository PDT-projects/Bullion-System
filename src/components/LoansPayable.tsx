import { useState, useMemo } from 'react';
import { Loan, Bank } from '../App';
import { Plus, Eye, Edit, Trash2, X, Printer, Download, FileText, DollarSign, Maximize2, Minimize2, Building2, Calendar, Banknote, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type LoansPayableProps = {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function LoansPayable({ loans, setLoans, banks, setBanks }: LoansPayableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLoan, setViewLoan] = useState<Loan | null>(null);
  const [viewSlip, setViewSlip] = useState<Loan | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
  const [paymentBankId, setPaymentBankId] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Loan>>({
    entityName: '',
    loanAmount: 0,
    paid: 0,
    remaining: 0,
    type: 'Payable',
    loanType: 'Official',
    status: 'Partial',
    date: new Date().toISOString().split('T')[0],
    mode: 'Bank',
    bankId: '',
    bankName: ''
  });

  // Filter only Payable loans
  const payableLoans = useMemo(() => {
    return loans.filter(l => l.type === 'Payable');
  }, [loans]);

  // Calculate real-time bank balance preview
  const getBankPreview = (bankId: string, amount: number, isPayment: boolean = false) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return null;
    
    // For new loan: money comes IN (increases balance)
    // For payment: money goes OUT (decreases balance)
    const newBalance = isPayment ? bank.balance - amount : bank.balance + amount;
    
    return {
      currentBalance: bank.balance,
      newBalance,
      bank
    };
  };

  const handleAdd = () => {
    setEditingLoan(null);
    setFormData({
      entityName: '',
      loanAmount: 0,
      paid: 0,
      remaining: 0,
      type: 'Payable',
      loanType: 'Official',
      status: 'Partial',
      date: new Date().toISOString().split('T')[0],
      mode: 'Bank',
      bankId: '',
      bankName: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData(loan);
    setIsModalOpen(true);
  };

  const handleModeChange = (mode: 'Cash' | 'Bank') => {
    setFormData({
      ...formData,
      mode,
      bankId: mode === 'Cash' ? '' : formData.bankId,
      bankName: mode === 'Cash' ? '' : formData.bankName
    });
  };

  const handleBankChange = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    setFormData({
      ...formData,
      bankId,
      bankName: bank?.name || ''
    });
  };

  const handleSave = () => {
    // Validation
    if (!formData.entityName || !formData.loanAmount) {
      toast.error('Please fill in Entity Name and Loan Amount');
      return;
    }

    if (formData.mode === 'Bank' && !formData.bankId) {
      toast.error('Please select a bank account');
      return;
    }

    const bank = formData.mode === 'Bank' ? banks.find(b => b.id === formData.bankId) : null;

    const remaining = (formData.loanAmount || 0) - (formData.paid || 0);
    const status = remaining === 0 ? 'Full' : 'Partial';

    const newLoan: Loan = {
      id: editingLoan?.id || Date.now().toString(),
      entityName: formData.entityName!,
      loanAmount: formData.loanAmount!,
      paid: formData.paid || 0,
      remaining,
      type: 'Payable',
      loanType: formData.loanType!,
      status,
      date: formData.date!,
      mode: formData.mode!,
      bankId: formData.bankId,
      bankName: formData.bankName
    };

    if (editingLoan) {
      setLoans(loans.map(l => l.id === editingLoan.id ? newLoan : l));
      toast.success('Loan updated successfully');
    } else {
      // Update bank balance for new loan (money coming IN)
      if (formData.mode === 'Bank' && bank) {
        const updatedBanks = banks.map(b => {
          if (b.id === formData.bankId) {
            return { ...b, balance: b.balance + formData.loanAmount! };
          }
          return b;
        });
        setBanks(updatedBanks);
        toast.success(`Loan added. ${formatCurrency(formData.loanAmount!)} added to ${bank.name}`);
      } else {
        toast.success('Loan added successfully (Cash)');
      }
      setLoans([...loans, newLoan]);
    }

    setIsModalOpen(false);
  };

  const handleMakePayment = (loan: Loan) => {
    setPaymentLoan(loan);
    setPaymentAmount(0);
    setPaymentMode('Bank');
    setPaymentBankId('');
    setIsPaymentModal(true);
  };

  const handlePaymentSave = () => {
    if (!paymentLoan || !paymentAmount) {
      toast.error('Please enter payment amount');
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

    const bank = paymentMode === 'Bank' ? banks.find(b => b.id === paymentBankId) : null;
    
    // Validate bank balance for payment (money going OUT)
    if (paymentMode === 'Bank' && bank) {
      if (bank.balance < paymentAmount) {
        toast.error('Insufficient bank balance for this payment');
        return;
      }
    }

    // Update bank balance (money going OUT)
    if (paymentMode === 'Bank' && bank) {
      const updatedBanks = banks.map(b => {
        if (b.id === paymentBankId) {
          return { ...b, balance: b.balance - paymentAmount };
        }
        return b;
      });
      setBanks(updatedBanks);
      toast.success(`Payment made. ${formatCurrency(paymentAmount)} deducted from ${bank.name}`);
    } else {
      toast.success('Payment made successfully (Cash)');
    }

    // Update loan
    const newPaid = paymentLoan.paid + paymentAmount;
    const newRemaining = paymentLoan.loanAmount - newPaid;
    const newStatus = newRemaining === 0 ? 'Full' : 'Partial';

    const updatedLoan: Loan = {
      ...paymentLoan,
      paid: newPaid,
      remaining: newRemaining,
      status: newStatus
    };

    setLoans(loans.map(l => l.id === paymentLoan.id ? updatedLoan : l));
    setIsPaymentModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      setLoans(loans.filter(l => l.id !== id));
      toast.success('Loan deleted successfully');
    }
  };

  const handlePrint = (loan: Loan) => {
    setViewSlip(loan);
    setTimeout(() => window.print(), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return status === 'Full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  // Calculate totals
  const totals = useMemo(() => {
    return payableLoans.reduce((acc, loan) => ({
      totalAmount: acc.totalAmount + loan.loanAmount,
      totalPaid: acc.totalPaid + loan.paid,
      totalRemaining: acc.totalRemaining + loan.remaining
    }), { totalAmount: 0, totalPaid: 0, totalRemaining: 0 });
  }, [payableLoans]);

  // Get bank preview for form
  const bankPreview = formData.mode === 'Bank' && formData.bankId && formData.loanAmount 
    ? getBankPreview(formData.bankId, formData.loanAmount || 0, false)
    : null;

  // Get bank preview for payment
  const paymentBankPreview = paymentMode === 'Bank' && paymentBankId && paymentAmount
    ? getBankPreview(paymentBankId, paymentAmount, true)
    : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payable Loans</h2>
        <p className="text-sm text-gray-600 mt-1">Loans taken from companies or individuals that need to be repaid</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-gray-600" />
            <p className="text-sm text-gray-600">Total Loans</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{payableLoans.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(totals.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(totals.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Total Remaining</p>
          </div>
          <p className="text-2xl font-bold text-[#ef4444]">{formatCurrency(totals.totalRemaining)}</p>
        </div>
      </div>

      {/* Add Loan Button */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Add Loan Payable
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Taken From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payableLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No payable loans yet</p>
                    <p className="text-sm mt-1">Click "Add Loan Payable" to record a loan taken from a company or person</p>
                  </td>
                </tr>
              ) : (
                payableLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{loan.entityName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(loan.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(loan.loanAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(loan.paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {formatCurrency(loan.remaining)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        {loan.mode === 'Bank' ? (
                          <>
                            <Banknote size={14} className="text-blue-600" />
                            <span>{loan.bankName}</span>
                          </>
                        ) : (
                          <>
                            <DollarSign size={14} className="text-green-600" />
                            <span>Cash</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewLoan(loan)}
                          className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setViewSlip(loan)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Slip"
                        >
                          <FileText size={16} />
                        </button>
                        {loan.remaining > 0 && (
                          <button
                            onClick={() => handleMakePayment(loan)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Make Payment"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(loan)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handlePrint(loan)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Print Slip"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingLoan ? 'Edit Loan Payable' : 'Add Loan Payable'}</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6 space-y-4`}>
              {/* Entity Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Taken From (Company or Person) *
                </label>
                <input
                  type="text"
                  value={formData.entityName || ''}
                  onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="e.g., ABC Company, John Doe"
                  disabled={!!editingLoan}
                />
                <p className="text-xs text-gray-500 mt-1">Enter the name of the company or person you took the loan from</p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>

              {/* Loan Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Category *</label>
                <select
                  value={formData.loanType || 'Official'}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="Official">Official</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.mode === 'Bank'}
                      onChange={() => handleModeChange('Bank')}
                      className="w-4 h-4 text-[#4f46e5]"
                      disabled={!!editingLoan}
                    />
                    <span>Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.mode === 'Cash'}
                      onChange={() => handleModeChange('Cash')}
                      className="w-4 h-4 text-[#4f46e5]"
                      disabled={!!editingLoan}
                    />
                    <span>Cash</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.mode === 'Bank' 
                    ? '💰 Loan amount will be added to selected bank account' 
                    : '💵 Loan recorded as cash transaction'}
                </p>
              </div>

              {/* Bank Selection (only if mode is Bank) */}
              {formData.mode === 'Bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                  <select
                    value={formData.bankId || ''}
                    onChange={(e) => handleBankChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    disabled={!!editingLoan}
                  >
                    <option value="">Select bank account</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - Balance: {formatCurrency(bank.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Loan Amount *</label>
                <input
                  type="number"
                  value={formData.loanAmount || ''}
                  onChange={(e) => {
                    const amount = Number(e.target.value);
                    const paid = formData.paid || 0;
                    setFormData({ 
                      ...formData, 
                      loanAmount: amount,
                      remaining: amount - paid
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="0"
                  disabled={!!editingLoan}
                />
              </div>

              {/* Bank Balance Preview */}
              {bankPreview && !editingLoan && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">💰 Bank Balance Preview</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Current Balance:</span>
                      <span className="font-medium text-blue-900">{formatCurrency(bankPreview.currentBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Loan Amount:</span>
                      <span className="font-medium text-green-600">+ {formatCurrency(formData.loanAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-blue-900 font-semibold">New Balance:</span>
                      <span className="font-bold text-blue-900">{formatCurrency(bankPreview.newBalance)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Already Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Already Paid (Optional)</label>
                <input
                  type="number"
                  value={formData.paid || ''}
                  onChange={(e) => {
                    const paid = Number(e.target.value);
                    const amount = formData.loanAmount || 0;
                    setFormData({ 
                      ...formData, 
                      paid,
                      remaining: amount - paid
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="0"
                />
              </div>

              {/* Remaining Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-medium text-red-600">
                  {formatCurrency((formData.loanAmount || 0) - (formData.paid || 0))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                {editingLoan ? 'Update Loan' : 'Add Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModal && paymentLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Make Payment</h3>
              <button onClick={() => setIsPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Loan Taken From</p>
                <p className="font-medium text-lg">{paymentLoan.entityName}</p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Remaining Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(paymentLoan.remaining)}</p>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={paymentLoan.remaining}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMode === 'Bank'}
                      onChange={() => setPaymentMode('Bank')}
                      className="w-4 h-4 text-[#4f46e5]"
                    />
                    <span>Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMode === 'Cash'}
                      onChange={() => setPaymentMode('Cash')}
                      className="w-4 h-4 text-[#4f46e5]"
                    />
                    <span>Cash</span>
                  </label>
                </div>
              </div>

              {/* Bank Selection */}
              {paymentMode === 'Bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                  <select
                    value={paymentBankId}
                    onChange={(e) => setPaymentBankId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - {formatCurrency(bank.balance)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">💸 Payment will be deducted from selected bank</p>
                </div>
              )}

              {/* Bank Balance Preview for Payment */}
              {paymentBankPreview && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-900 mb-2">💸 Bank Balance Preview</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Current Balance:</span>
                      <span className="font-medium text-orange-900">{formatCurrency(paymentBankPreview.currentBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Payment Amount:</span>
                      <span className="font-medium text-red-600">- {formatCurrency(paymentAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-orange-300">
                      <span className="text-orange-900 font-semibold">New Balance:</span>
                      <span className={`font-bold ${paymentBankPreview.newBalance < 0 ? 'text-red-600' : 'text-orange-900'}`}>
                        {formatCurrency(paymentBankPreview.newBalance)}
                      </span>
                    </div>
                  </div>
                  {paymentBankPreview.newBalance < 0 && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Warning: Insufficient balance</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSave}
                className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Make Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Loan Modal */}
      {viewLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Loan Details</h3>
              <button onClick={() => setViewLoan(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Loan Taken From</p>
                  <p className="font-medium text-lg">{viewLoan.entityName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewLoan.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewLoan.loanType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="font-medium">{viewLoan.mode === 'Bank' ? viewLoan.bankName : 'Cash'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewLoan.status)}`}>
                    {viewLoan.status}
                  </span>
                </div>
              </div>
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Loan Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(viewLoan.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(viewLoan.paid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(viewLoan.remaining)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
              <h3 className="text-xl font-bold">Loan Transaction Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={20} />
                </button>
                <button onClick={() => setViewSlip(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              {/* Company Header */}
              <div className="text-center border-b-2 border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-lg font-semibold mt-2 text-gray-800">Loan Payable Transaction Slip</p>
              </div>

              {/* Slip Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Transaction ID:</span>
                  <span className="font-semibold">{viewSlip.id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Date:</span>
                  <span className="font-semibold">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Loan Taken From:</span>
                  <span className="font-semibold text-[#4f46e5]">{viewSlip.entityName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Category:</span>
                  <span className="font-semibold">{viewSlip.loanType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Payment Mode:</span>
                  <span className="font-semibold">
                    {viewSlip.mode === 'Bank' ? `Bank (${viewSlip.bankName})` : 'Cash'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewSlip.status)}`}>
                    {viewSlip.status}
                  </span>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Loan Amount:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(viewSlip.loanAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Amount Paid:</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(viewSlip.paid)}</span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-gray-300 pt-3">
                  <span className="text-lg font-bold text-gray-900">Remaining Balance:</span>
                  <span className="text-2xl font-bold text-red-600">{formatCurrency(viewSlip.remaining)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 mt-8 pt-4 text-center text-sm text-gray-500">
                <p className="font-medium">This is a computer-generated transaction slip</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
