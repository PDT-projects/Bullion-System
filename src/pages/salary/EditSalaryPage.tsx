import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Transaction, Employee, Bank } from '../../App';
import { 
  ArrowLeft, 
  Save,
  Building2,
  CreditCard,
  User,
  Upload,
  X,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';

// Office/Branch options
const companies = [
  'Pakistan Detectors Technologies: Islamabad/ Head Office',
  'Pakistan Detectors Technologies: Karachi',
  'Pakistan Detectors Technologies: Lahore',
  'Pakistan Detectors Technologies: Bullion RND/ SITE office'
];

export function EditSalaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, setTransactions, employees, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    employees: Employee[];
    banks: Bank[];
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  // Form State
  const [company, setCompany] = useState(companies[0]);
  const [date, setDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [commission, setCommission] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [paidBy, setPaidBy] = useState('');
  const [mode, setMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [bankName, setBankName] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const isAdvance = transaction?.mainCategory === 'Cash Outflow' && transaction?.subCategory === 'Advance Salary';

  useEffect(() => {
    const foundTransaction = transactions.find(t => t.id === id);
    if (foundTransaction) {
      setTransaction(foundTransaction);
      
      // Set form values
      setCompany(foundTransaction.company || companies[0]);
      setDate(foundTransaction.date);
      setEmployeeId(foundTransaction.employeeId || '');
      setSalaryMonth(foundTransaction.salaryMonth || '');
      setBaseSalary(foundTransaction.baseSalary || 0);
      setCommission(foundTransaction.commission || 0);
      setDeductions(foundTransaction.deductions || 0);
      setNetAmount(foundTransaction.netAmount || foundTransaction.amount || 0);
      setPaidBy(foundTransaction.paidBy || '');
      setMode((foundTransaction.mode as 'Cash' | 'Bank' | 'Cheque') || 'Cash');
      setBankName(foundTransaction.bankName || '');
      setNote(foundTransaction.note || '');
      setImageUrl(foundTransaction.imageUrl || '');
    }
    setIsLoading(false);
  }, [id, transactions]);

  // Recalculate net amount when base, commission, or deductions change
  useEffect(() => {
    setNetAmount(baseSalary + commission - deductions);
  }, [baseSalary, commission, deductions]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
        toast.error('Please upload a JPG or PNG image');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!transaction) return;

    if (!employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!salaryMonth) {
      toast.error('Please select a salary month');
      return;
    }
    if (netAmount <= 0) {
      toast.error('Net amount must be greater than 0');
      return;
    }
    if ((mode === 'Bank' || mode === 'Cheque') && !bankName) {
      toast.error('Please select a bank for bank/cheque transactions');
      return;
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      company: company,
      date: date,
      employeeId: employeeId,
      employeeName: selectedEmployee?.name || transaction.employeeName,
      salaryMonth: salaryMonth,
      baseSalary: baseSalary,
      commission: commission,
      deductions: deductions,
      netAmount: netAmount,
      amount: netAmount, // Update main amount field too
      paidBy: paidBy,
      mode: mode,
      bankName: bankName || undefined,
      note: note,
      imageUrl: imageUrl
    };

    setTransactions(transactions.map(t => t.id === id ? updatedTransaction : t));
    toast.success('Salary record updated successfully');
    
    // Navigate back to appropriate page
    if (isAdvance) {
      navigate('/salary/advance');
    } else {
      navigate('/salary/regular');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary record...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary Record Not Found</h2>
          <p className="text-gray-600 mb-4">The salary record you're trying to edit doesn't exist.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(isAdvance ? '/salary/advance' : '/salary/regular')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Edit {isAdvance ? 'Advance' : 'Regular'} Salary
            </h2>
            <p className="text-gray-600 mt-1">Update salary payment details</p>
          </div>
        </div>

        {/* Transaction ID Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-mono font-medium">{transaction.transactionId || transaction.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Amount</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(transaction.amount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              General Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Branch *</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map(c => (
                    <option key={c} value={c}>{c.split(': ')[1] || c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatDateDisplay(date)}</p>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Employee Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    const emp = employees.find(emp => emp.id === e.target.value);
                    if (emp) {
                      setBaseSalary(emp.salary);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee</option>
                  {employees.filter(e => e.status === 'active').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Month *</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {selectedEmployee && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-bold text-lg text-blue-600">{formatCurrency(selectedEmployee.salary)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Salary Calculation */}
          {!isAdvance && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Salary Calculation
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary</label>
                  <input
                    type="number"
                    value={baseSalary || ''}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission (+)</label>
                  <input
                    type="number"
                    value={commission || ''}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (-)</label>
                  <input
                    type="number"
                    value={deductions || ''}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-semibold">
                    {formatCurrency(netAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Details
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                <input
                  type="text"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  placeholder="e.g., Pakistan Detectors"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as any);
                    if (e.target.value === 'Cash') setBankName('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              {(mode === 'Bank' || mode === 'Cheque') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name} (Balance: {formatCurrency(bank.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image (Optional)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={16} className="mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">{imageUrl ? 'Change Image' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageUrl && (
                    <button
                      onClick={() => setImageUrl('')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Receipt" className="mt-2 h-16 w-16 object-cover rounded border" />
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-600 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Updated Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Employee</p>
                <p className="text-xl font-bold">{selectedEmployee?.name || '-'}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-white/80 text-sm mb-1">Salary Month</p>
                <p className="text-xl font-bold">{salaryMonth || '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Net Amount</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(netAmount)}</p>
              </div>
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
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
