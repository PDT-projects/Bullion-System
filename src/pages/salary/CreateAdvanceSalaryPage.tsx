import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, Employee, Bank } from '../../App';
import { 
  ArrowLeft, 
  Save,
  Building2,
  ArrowUpCircle,
  User,
  Upload,
  X,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { generateTransactionId } from '../../utils/transactionIdGenerator';

// Office/Branch options
const companies = [
  'Pakistan Detectors Technologies: Islamabad/ Head Office',
  'Pakistan Detectors Technologies: Karachi',
  'Pakistan Detectors Technologies: Lahore',
  'Pakistan Detectors Technologies: Bullion RND/ SITE office'
];

export function CreateAdvanceSalaryPage() {
  const navigate = useNavigate();
  const { transactions, setTransactions, employees, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    employees: Employee[];
    banks: Bank[];
  }>();

  // Form State
  const [company, setCompany] = useState(companies[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paidAmount, setPaidAmount] = useState(0);
  const [mode, setMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [bankName, setBankName] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const remainingSalary = selectedEmployee ? selectedEmployee.salary - paidAmount : 0;

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
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    if (!salaryMonth) {
      toast.error('Please select a salary month');
      return;
    }
    if (paidAmount <= 0) {
      toast.error('Paid amount must be greater than 0');
      return;
    }
    if (paidAmount > selectedEmployee.salary) {
      toast.error(`Advance amount cannot exceed employee's salary of ${formatCurrency(selectedEmployee.salary)}`);
      return;
    }
    if ((mode === 'Bank' || mode === 'Cheque') && !bankName) {
      toast.error('Please select a bank for bank/cheque transactions');
      return;
    }
    if ((mode === 'Bank' || mode === 'Cheque') && bankName) {
      const bank = banks.find(b => b.name === bankName);
      if (bank && bank.balance < paidAmount) {
        toast.error(`Insufficient balance in ${bank.name}`);
        return;
      }
    }

    const now = new Date();

    // Create transaction record
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionId: generateTransactionId('ADV'),
      date: date,
      time: now.toTimeString().split(' ')[0],
      company: company,
      mainCategory: 'Cash Outflow',
      subCategory: 'Advance Salary',
      amount: paidAmount,
      mode: mode,
      bankName: bankName || undefined,
      paidBy: company.split(': ')[1] || company,
      paidTo: selectedEmployee.name,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      note: note || `Advance salary for ${selectedEmployee.name} - ${salaryMonth}`,
      imageUrl: imageUrl,
      paymentStatus: 'Partial'
    };

    // Update bank balances
    if ((mode === 'Bank' || mode === 'Cheque') && bankName) {
      const updatedBanks = banks.map(b =>
        b.name === bankName
          ? { ...b, balance: b.balance - paidAmount }
          : b
      );
      // Note: In a real app, you'd update banks through context or API
    }

    setTransactions([...transactions, newTransaction]);
    toast.success(`Advance salary of ${formatCurrency(paidAmount)} paid successfully`);
    navigate('/salary/advance');
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/salary/advance')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pay Advance Salary</h2>
            <p className="text-gray-600 mt-1">Create advance salary payment for an employee</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              General Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Branch *</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatDateDisplay(date)}</p>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Employee Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select employee</option>
                  {employees.filter(e => e.status === 'active').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position} (Salary: {formatCurrency(emp.salary)})
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {selectedEmployee && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
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
                    <p className="text-sm text-gray-600">Total Salary</p>
                    <p className="font-bold text-lg text-orange-600">{formatCurrency(selectedEmployee.salary)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-orange-600" />
              Payment Details
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount *</label>
                <input
                  type="number"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  placeholder="Enter advance amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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

            {selectedEmployee && paidAmount > 0 && (
              <div className={`p-4 rounded-lg border ${
                remainingSalary < 0 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`w-5 h-5 ${
                    remainingSalary < 0 ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <span className={`font-medium ${
                    remainingSalary < 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {remainingSalary < 0 ? 'Warning: Amount exceeds salary!' : 'Remaining Salary Calculation'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Salary</p>
                    <p className="font-medium">{formatCurrency(selectedEmployee.salary)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Advance Paid</p>
                    <p className="font-medium text-orange-600">{formatCurrency(paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className={`font-bold text-lg ${
                      remainingSalary < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(remainingSalary)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          {selectedEmployee && paidAmount > 0 && remainingSalary >= 0 && (
            <div className="bg-orange-600 text-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Payment Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-white/80 text-sm mb-1">Employee</p>
                  <p className="text-xl font-bold">{selectedEmployee.name}</p>
                </div>
                <div className="text-center border-x border-white/20">
                  <p className="text-white/80 text-sm mb-1">Advance Amount</p>
                  <p className="text-2xl font-bold text-green-300">{formatCurrency(paidAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-sm mb-1">Remaining Salary</p>
                  <p className="text-2xl font-bold text-yellow-300">{formatCurrency(remainingSalary)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => navigate('/salary/advance')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedEmployee || paidAmount <= 0 || paidAmount > (selectedEmployee?.salary || 0)}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Pay Advance Salary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
