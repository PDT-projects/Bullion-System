import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, Employee, Bank } from '../../App';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  X,
  Building2,
  CreditCard,
  User,
  Upload,
  Calculator,
  CheckCircle,
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

type SalaryTransaction = {
  id: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  commission: number;
  deductions: number;
  netAmount: number;
  paidBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  salaryMonth: string;
  note: string;
  imageUrl: string;
};

export function CreateRegularSalaryPage() {
  const navigate = useNavigate();
  const { transactions, setTransactions, employees, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    employees: Employee[];
    banks: Bank[];
  }>();

  // General Information
  const [company, setCompany] = useState(companies[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalNote, setGeneralNote] = useState('');

  // Salary Transactions
  const [salaryTransactions, setSalaryTransactions] = useState<SalaryTransaction[]>([
    {
      id: Date.now().toString(),
      employeeId: '',
      employeeName: '',
      baseSalary: 0,
      commission: 0,
      deductions: 0,
      netAmount: 0,
      paidBy: companies[0].split(': ')[1] || companies[0],
      mode: 'Cash',
      bankName: '',
      salaryMonth: new Date().toISOString().slice(0, 7),
      note: '',
      imageUrl: ''
    }
  ]);

  const [isMultiple, setIsMultiple] = useState(false);

  const addSalaryTransaction = () => {
    setSalaryTransactions([...salaryTransactions, {
      id: Date.now().toString(),
      employeeId: '',
      employeeName: '',
      baseSalary: 0,
      commission: 0,
      deductions: 0,
      netAmount: 0,
      paidBy: company.split(': ')[1] || company,
      mode: 'Cash',
      bankName: '',
      salaryMonth: new Date().toISOString().slice(0, 7),
      note: '',
      imageUrl: ''
    }]);
  };

  const removeSalaryTransaction = (id: string) => {
    if (salaryTransactions.length > 1) {
      setSalaryTransactions(salaryTransactions.filter(t => t.id !== id));
    }
  };

  const updateSalaryTransaction = (id: string, field: keyof SalaryTransaction, value: any) => {
    setSalaryTransactions(salaryTransactions.map(t => {
      if (t.id !== id) return t;

      const updated = { ...t, [field]: value };

      // Auto-fetch employee data when employee is selected
      if (field === 'employeeId') {
        const employee = employees.find(e => e.id === value);
        if (employee) {
          updated.employeeName = employee.name;
          updated.baseSalary = employee.salary;
          // Recalculate net amount
          updated.netAmount = employee.salary + updated.commission - updated.deductions;
        }
      }

      // Recalculate net amount when commission or deductions change
      if (field === 'commission' || field === 'deductions') {
        const commission = field === 'commission' ? Number(value) : t.commission;
        const deductions = field === 'deductions' ? Number(value) : t.deductions;
        updated.netAmount = t.baseSalary + commission - deductions;
      }

      // Clear bank name if switching to Cash
      if (field === 'mode' && value === 'Cash') {
        updated.bankName = '';
      }

      return updated;
    }));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
        toast.error('Please upload a JPG or PNG image');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSalaryTransaction(id, 'imageUrl', reader.result as string);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    return salaryTransactions.reduce((sum, t) => sum + t.netAmount, 0);
  };

  const handleSave = () => {
    // Validate all transactions
    for (const txn of salaryTransactions) {
      if (!txn.employeeId) {
        toast.error('Please select an employee for all transactions');
        return;
      }
      if (!txn.salaryMonth) {
        toast.error('Please select a salary month for all transactions');
        return;
      }
      if (txn.netAmount <= 0) {
        toast.error('Net amount must be greater than 0');
        return;
      }
      if (!txn.paidBy) {
        toast.error('Please specify who is paying for all transactions');
        return;
      }
      if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && !txn.bankName) {
        toast.error('Please select a bank for bank/cheque transactions');
        return;
      }
      if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && txn.bankName) {
        const bank = banks.find(b => b.name === txn.bankName);
        if (bank && bank.balance < txn.netAmount) {
          toast.error(`Insufficient balance in ${bank.name}`);
          return;
        }
      }
    }

    const now = new Date();
    
    // Create transaction records
    const newTransactions: Transaction[] = salaryTransactions.map((txn, index) => ({
      id: Date.now().toString() + index,
      transactionId: generateTransactionId('SAL'),
      date: date,
      time: now.toTimeString().split(' ')[0],
      company: company,
      mainCategory: 'Salary',
      subCategory: 'Employee Salary',
      amount: txn.netAmount,
      mode: txn.mode,
      bankName: txn.bankName || undefined,
      paidBy: txn.paidBy,
      paidTo: txn.employeeName,
      employeeId: txn.employeeId,
      employeeName: txn.employeeName,
      baseSalary: txn.baseSalary,
      commission: txn.commission,
      deductions: txn.deductions,
      netAmount: txn.netAmount,
      salaryMonth: txn.salaryMonth,
      note: txn.note || generalNote,
      imageUrl: txn.imageUrl,
      paymentStatus: 'Full'
    }));

    // Update bank balances
    const updatedBanks = [...banks];
    for (const txn of salaryTransactions) {
      if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && txn.bankName) {
        const bankIndex = updatedBanks.findIndex(b => b.name === txn.bankName);
        if (bankIndex !== -1) {
          updatedBanks[bankIndex] = {
            ...updatedBanks[bankIndex],
            balance: updatedBanks[bankIndex].balance - txn.netAmount
          };
        }
      }
    }

    setTransactions([...transactions, ...newTransactions]);
    toast.success(`${newTransactions.length} salary payment(s) created successfully`);
    navigate('/salary/regular');
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/salary/regular')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pay Regular Salary</h2>
            <p className="text-gray-600 mt-1">Create regular salary payment for employees</p>
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
                  onChange={(e) => {
                    setCompany(e.target.value);
                    // Update paidBy for all transactions
                    setSalaryTransactions(salaryTransactions.map(t => ({
                      ...t,
                      paidBy: e.target.value.split(': ')[1] || e.target.value
                    })));
                  }}
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">General Note</label>
                <input
                  type="text"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="Optional note for all transactions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Multiple Transactions Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="multiple"
                  checked={isMultiple}
                  onChange={(e) => setIsMultiple(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="multiple" className="text-sm font-medium text-gray-700">
                  Add Multiple Salary Payments
                </label>
              </div>
              {isMultiple && (
                <button
                  onClick={addSalaryTransaction}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Employee
                </button>
              )}
            </div>
          </div>

          {/* Salary Transactions */}
          <div className="space-y-4">
            {salaryTransactions.map((txn, index) => (
              <div key={txn.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Salary Payment {index + 1}
                  </h3>
                  {salaryTransactions.length > 1 && (
                    <button
                      onClick={() => removeSalaryTransaction(txn.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                    <select
                      value={txn.employeeId}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'employeeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select employee</option>
                      {employees.filter(e => e.status === 'active').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.position} (Base: {formatCurrency(emp.salary)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Month *</label>
                    <input
                      type="month"
                      value={txn.salaryMonth}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'salaryMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary</label>
                    <input
                      type="number"
                      value={txn.baseSalary || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission (+)</label>
                    <input
                      type="number"
                      value={txn.commission || ''}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'commission', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (-)</label>
                    <input
                      type="number"
                      value={txn.deductions || ''}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'deductions', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-semibold">
                      {formatCurrency(txn.netAmount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={txn.paidBy}
                        onChange={(e) => updateSalaryTransaction(txn.id, 'paidBy', e.target.value)}
                        placeholder="e.g., Pakistan Detectors"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                    <select
                      value={txn.mode}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'mode', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  {(txn.mode === 'Bank' || txn.mode === 'Cheque') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                      <select
                        value={txn.bankName}
                        onChange={(e) => updateSalaryTransaction(txn.id, 'bankName', e.target.value)}
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
                      value={txn.note}
                      onChange={(e) => updateSalaryTransaction(txn.id, 'note', e.target.value)}
                      placeholder="Additional notes for this payment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image (Optional)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload size={16} className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">{txn.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => handleImageUpload(txn.id, e)}
                          className="hidden"
                        />
                      </label>
                      {txn.imageUrl && (
                        <button
                          onClick={() => updateSalaryTransaction(txn.id, 'imageUrl', '')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    {txn.imageUrl && (
                      <img src={txn.imageUrl} alt="Receipt" className="mt-2 h-16 w-16 object-cover rounded border" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-blue-600 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Payment Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Total Employees</p>
                <p className="text-2xl font-bold">{salaryTransactions.length}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-white/80 text-sm mb-1">Total Base Salaries</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(salaryTransactions.reduce((sum, t) => sum + t.baseSalary, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Total Net Amount</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => navigate('/salary/regular')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} />
              Save Salary Payment(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
