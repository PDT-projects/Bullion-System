import { useState } from 'react';
import { Loan, Employee, Bank } from '../App';
import { Plus, Eye, Edit, Trash2, X, Printer, Download, FileText, DollarSign, Maximize2, Minimize2, User, Users } from 'lucide-react';
import { toast } from 'sonner';

type LoansProps = {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  employees: Employee[];
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function Loans({ loans, setLoans, employees, banks, setBanks }: LoansProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLoan, setViewLoan] = useState<Loan | null>(null);
  const [viewSlip, setViewSlip] = useState<Loan | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentBankId, setPaymentBankId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'Bank Transfer'>('Cash');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Loan>>({
    receiverType: 'Employee',
    receiverName: '',
    receiverId: '',
    receiverPhone: '',
    loanAmount: 0,
    paid: 0,
    remaining: 0,
    type: 'Receivable',
    loanType: 'Official',
    status: 'Partial',
    date: new Date().toISOString().split('T')[0],
    mode: 'Bank',
    bankId: '',
    bankName: ''
  });

  const handleAdd = () => {
    setEditingLoan(null);
    setFormData({
      receiverType: 'Employee',
      receiverName: '',
      receiverId: '',
      receiverPhone: '',
      loanAmount: 0,
      paid: 0,
      remaining: 0,
      type: 'Receivable',
      loanType: 'Official',
      status: 'Partial',
      date: new Date().toISOString().split('T')[0],
      mode: 'Bank',
      bankId: '',
      bankName: ''
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    // Handle backward compatibility
    const receiverType = loan.receiverType || (loan.employeeId ? 'Employee' : 'Person');
    const receiverName = loan.receiverName || loan.employeeName || loan.entityName || '';
    const receiverId = loan.receiverId || loan.employeeId || '';
    
    setFormData({
      ...loan,
      receiverType,
      receiverName,
      receiverId
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleReceiverTypeChange = (type: 'Employee' | 'Person') => {
    setFormData({
      ...formData,
      receiverType: type,
      receiverName: '',
      receiverId: '',
      receiverPhone: ''
    });
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({
      ...formData,
      receiverId: employeeId,
      receiverName: employee?.name || '',
      receiverPhone: employee?.phone || ''
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
    // Validate required fields
    if (!formData.receiverName || !formData.loanAmount || !formData.bankId) {
      toast.error('Please fill in all required fields including receiver and bank selection');
      return;
    }

    if (formData.receiverType === 'Employee' && !formData.receiverId) {
      toast.error('Please select an employee');
      return;
    }

    const bank = banks.find(b => b.id === formData.bankId);
    if (!bank) {
      toast.error('Invalid bank selection');
      return;
    }

    // For new loans, validate bank balance for Receivable loans (money going out)
    if (!editingLoan && formData.type === 'Receivable') {
      if (bank.balance < formData.loanAmount!) {
        toast.error('Insufficient bank balance for this loan amount');
        return;
      }
    }

    const remaining = (formData.loanAmount || 0) - (formData.paid || 0);
    const status: 'Full' | 'Partial' = remaining === 0 ? 'Full' : 'Partial';

    const newLoan: Loan = {
      id: editingLoan?.id || Date.now().toString(),
      entityName: formData.receiverName!, // Add entityName for backward compatibility
      receiverType: formData.receiverType!,
      receiverName: formData.receiverName!,
      receiverId: formData.receiverId,
      receiverPhone: formData.receiverPhone,
      loanAmount: formData.loanAmount!,
      paid: formData.paid || 0,
      remaining,
      type: formData.type!,
      loanType: formData.loanType!,
      status,
      date: formData.date!,
      mode: formData.mode!,
      bankId: formData.bankId!,
      bankName: formData.bankName!
    };

    if (editingLoan) {
      setLoans(loans.map(l => l.id === editingLoan.id ? newLoan : l));
      toast.success('Loan updated successfully');
    } else {
      // Update bank balance for new loan
      if (formData.type === 'Receivable') {
        // Loan given: Money going out from bank (decrease balance)
        const updatedBanks = banks.map(b => {
          if (b.id === formData.bankId) {
            return { ...b, balance: b.balance - formData.loanAmount! };
          }
          return b;
        });
        setBanks(updatedBanks);
        toast.success(`Loan added. ${formatCurrency(formData.loanAmount!)} deducted from ${bank.name}`);
      } else {
        // Loan taken (Payable): Money coming in to bank (increase balance)
        const updatedBanks = banks.map(b => {
          if (b.id === formData.bankId) {
            return { ...b, balance: b.balance + formData.loanAmount! };
          }
          return b;
        });
        setBanks(updatedBanks);
        toast.success(`Loan added. ${formatCurrency(formData.loanAmount!)} added to ${bank.name}`);
      }
      setLoans([...loans, newLoan]);
    }

    setIsModalOpen(false);
  };

  const handleMakePayment = (loan: Loan) => {
    setPaymentLoan(loan);
    setPaymentAmount(0);
    setPaymentBankId('');
    setPaymentMode('Cash');
    setIsPaymentModal(true);
  };

  const handlePaymentSave = () => {
    if (!paymentLoan || !paymentAmount || !paymentBankId || !paymentMode) {
      toast.error('Please fill in all required fields: amount, payment mode, and bank');
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

    const bank = banks.find(b => b.id === paymentBankId);
    if (!bank) {
      toast.error('Invalid bank selection');
      return;
    }

    // Update bank balance based on loan type
    if (paymentLoan.type === 'Receivable') {
      // Receiving payment back (money coming in) - increase bank balance
      const updatedBanks = banks.map(b => {
        if (b.id === paymentBankId) {
          return { ...b, balance: b.balance + paymentAmount };
        }
        return b;
      });
      setBanks(updatedBanks);
      toast.success(`Payment received. ${formatCurrency(paymentAmount)} added to ${bank.name}`);
    } else {
      // Paying back loan (money going out) - decrease bank balance
      if (bank.balance < paymentAmount) {
        toast.error('Insufficient bank balance for this payment');
        return;
      }
      const updatedBanks = banks.map(b => {
        if (b.id === paymentBankId) {
          return { ...b, balance: b.balance - paymentAmount };
        }
        return b;
      });
      setBanks(updatedBanks);
      toast.success(`Payment made. ${formatCurrency(paymentAmount)} deducted from ${bank.name}`);
    }

    // Create payment record
    const paymentRecord = {
      id: Date.now().toString(),
      amount: paymentAmount,
      mode: paymentMode,
      date: new Date().toISOString().split('T')[0],
      bankId: paymentBankId,
      bankName: bank.name
    };

    // Update loan
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

    // Update the loan in the current loans array (which may be filtered)
    const updatedLoans = loans.map(l => l.id === paymentLoan.id ? updatedLoan : l);
    setLoans(updatedLoans);
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

  const handleDownload = (loan: Loan) => {
    toast.success('Downloading loan slip');
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

  const getTypeColor = (type: string) => {
    return type === 'Receivable' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  // Helper function to get receiver name with backward compatibility
  const getReceiverName = (loan: Loan) => {
    return loan.receiverName || loan.employeeName || loan.entityName || 'N/A';
  };

  // Helper function to get receiver type display
  const getReceiverTypeDisplay = (loan: Loan) => {
    if (loan.receiverType) return loan.receiverType;
    if (loan.employeeId) return 'Employee';
    return 'Person';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Loans & Advances</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Add Loan
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getReceiverTypeDisplay(loan) === 'Employee' ? <Users size={14} className="text-gray-400" /> : <User size={14} className="text-gray-400" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getReceiverName(loan)}</p>
                        <p className="text-xs text-gray-500">{getReceiverTypeDisplay(loan)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(loan.type)}`}>
                      {loan.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.loanType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(loan.paid)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatCurrency(loan.remaining)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.bankName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewLoan(loan)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                        type="button"
                      >
                        <Eye size={16} />
                      </button>
                      {loan.remaining > 0 && (
                        <button
                          onClick={() => handleMakePayment(loan)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Pay Remaining"
                          type="button"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(loan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                        type="button"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No loans available
                  </td>
                </tr>
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
              <h3 className="text-xl font-bold">{editingLoan ? 'Edit Loan' : 'Add Loan'}</h3>
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
              {/* Receiver Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Employee"
                      checked={formData.receiverType === 'Employee'}
                      onChange={() => handleReceiverTypeChange('Employee')}
                      disabled={!!editingLoan}
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 focus:ring-[#4f46e5]"
                    />
                    <span className="text-sm text-gray-700">Employee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Person"
                      checked={formData.receiverType === 'Person'}
                      onChange={() => handleReceiverTypeChange('Person')}
                      disabled={!!editingLoan}
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 focus:ring-[#4f46e5]"
                    />
                    <span className="text-sm text-gray-700">Person</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select Employee for company employees or Person for external individuals
                </p>
              </div>

              {/* Conditional Receiver Fields */}
              {formData.receiverType === 'Employee' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                  <select
                    value={formData.receiverId || ''}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    disabled={!!editingLoan}
                  >
                    <option value="">Select employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Person Name *</label>
                    <input
                      type="text"
                      value={formData.receiverName || ''}
                      onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="Enter person name"
                      disabled={!!editingLoan}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact/Phone (Optional)</label>
                    <input
                      type="text"
                      value={formData.receiverPhone || ''}
                      onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="+92 XXX XXXXXXX"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type *</label>
                  <select
                    value={formData.type || 'Receivable'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Payable' | 'Receivable' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    disabled={!!editingLoan}
                  >
                    <option value="Receivable">Receivable (Given to Receiver)</option>
                    <option value="Payable">Payable (Taken from Receiver)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 'Receivable' 
                      ? '💸 Money will be deducted from bank' 
                      : '💰 Money will be added to bank'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.loanType || 'Official'}
                    onChange={(e) => setFormData({ ...formData, loanType: e.target.value as 'Official' | 'Personal' | 'Other' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="Official">Official</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account * (Required for transaction)</label>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount *</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Already Paid</label>
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-medium">
                  {formatCurrency((formData.loanAmount || 0) - (formData.paid || 0))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
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
                {editingLoan ? 'Update' : 'Add Loan'}
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
                <p className="text-sm text-gray-600 mb-1">Receiver</p>
                <p className="font-medium">{getReceiverName(paymentLoan)}</p>
                <p className="text-xs text-gray-500">{getReceiverTypeDisplay(paymentLoan)}</p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Remaining Amount</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(paymentLoan.remaining)}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Enter amount"
                />
                {paymentAmount > paymentLoan.remaining && (
                  <p className="text-xs text-red-600 mt-1">Amount cannot exceed remaining balance</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Cheque' | 'Bank Transfer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="">Select payment mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  {paymentLoan.type === 'Receivable'
                    ? '💰 Payment will be added to selected bank'
                    : '💸 Payment will be deducted from selected bank'}
                </p>
              </div>
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
          {console.log('View modal is rendering for loan:', viewLoan.id)}
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
                  <p className="text-sm text-gray-600">Receiver</p>
                  <p className="font-medium text-lg">{getReceiverName(viewLoan)}</p>
                  <p className="text-xs text-gray-500">{getReceiverTypeDisplay(viewLoan)}</p>
                  {viewLoan.receiverPhone && (
                    <p className="text-sm text-gray-600 mt-1">{viewLoan.receiverPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewLoan.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loan Type</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(viewLoan.type)}`}>
                    {viewLoan.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewLoan.loanType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bank Account</p>
                  <p className="font-medium">{viewLoan.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewLoan.status)}`}>
                    {viewLoan.status}
                  </span>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(viewLoan.loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Paid</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(viewLoan.paid)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Remaining</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(viewLoan.remaining)}</p>
                    </div>
                  </div>
                </div>
                {/* Payment History */}
                <div className="col-span-2">
                  <h4 className="text-lg font-semibold mb-3">Payment History</h4>
                  {viewLoan.paymentHistory && viewLoan.paymentHistory.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {viewLoan.paymentHistory.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(payment.date).toLocaleDateString('en-PK')}
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-green-600">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {payment.mode}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {payment.bankName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No payments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto print:shadow-none">
            <div className="print:hidden flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Loan Receipt</h3>
              <button onClick={() => setViewSlip(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-[#4f46e5] mb-2">Pakistan Detectors Technologies</h1>
                <p className="text-gray-600">Loan Receipt / Acknowledgment</p>
              </div>

              {/* Receipt Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Receipt Date:</p>
                  <p className="font-medium">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Receipt ID:</p>
                  <p className="font-medium">LR-{viewSlip.id}</p>
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Receiver Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Receiver Name:</p>
                    <p className="font-medium">{getReceiverName(viewSlip)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Receiver Type:</p>
                    <p className="font-medium">{getReceiverTypeDisplay(viewSlip)}</p>
                  </div>
                  {viewSlip.receiverPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Contact:</p>
                      <p className="font-medium">{viewSlip.receiverPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Details */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Loan Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loan Type:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(viewSlip.type)}`}>
                      {viewSlip.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{viewSlip.loanType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Account:</span>
                    <span className="font-medium">{viewSlip.bankName}</span>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-[#4f46e5]/5 p-6 rounded-lg mb-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Loan Amount:</span>
                    <span className="font-bold">{formatCurrency(viewSlip.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-semibold">{formatCurrency(viewSlip.paid)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between text-xl">
                    <span className="font-bold">Remaining:</span>
                    <span className="font-bold text-red-600">{formatCurrency(viewSlip.remaining)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewSlip.status)}`}>
                      {viewSlip.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-gray-200">
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Receiver Signature</p>
                    <p className="text-xs text-gray-500 mt-1">{getReceiverName(viewSlip)}</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Authorized Signatory</p>
                    <p className="text-xs text-gray-500 mt-1">Pakistan Detectors Technologies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="print:hidden flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setViewSlip(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(viewSlip)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
