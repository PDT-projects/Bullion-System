import { useState } from 'react';
import { Transaction, Bank, Employee } from '../App';
import { Plus, Eye, Trash2, X, Printer, Upload, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

// Advance Salary types and state
type AdvanceSalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  salaryMonth: string; // e.g. 2024-03
  totalSalary: number;
  paidAmount: number;
  remainingAmount: number;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName?: string;
  date: string;
  time: string;
  imageUrl?: string;
};



type SalaryProps = {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  employees: Employee[];
  setActiveModule: (module: string) => void;
};

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
  netAmount: number; // baseSalary + commission - deductions
  paidBy: string; // Person/company who paid
  mode: 'Cash' | 'Bank' | 'Cheque'; // Payment method
  bankName?: string;
  imageUrl?: string;
};

export function Salary({ transactions, setTransactions, banks, setBanks, employees, setActiveModule }: SalaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewSalary, setViewSalary] = useState<Transaction | null>(null);
  const [viewSlip, setViewSlip] = useState<Transaction | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Advance Salary state
  const [advanceRecords, setAdvanceRecords] = useState<AdvanceSalaryRecord[]>([]);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceFormData, setAdvanceFormData] = useState({
    employeeId: '',
    salaryMonth: '',
    paidAmount: 0,
    mode: 'Cash' as 'Cash' | 'Bank' | 'Cheque',
    bankName: '',
    imageUrl: ''
  });
  
  const [formData, setFormData] = useState({
    company: companies[0],
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [salaryTransactions, setSalaryTransactions] = useState<SalaryTransaction[]>([{
    id: Date.now().toString(),
    employeeId: '',
    employeeName: '',
    baseSalary: 0,
    commission: 0,
    deductions: 0,
    netAmount: 0,
    paidBy: 'Pakistan Detectors - Islamabad',
    mode: 'Cash',
    bankName: '',
    imageUrl: ''
  }]);

  // Filter salary transactions (both regular salary and advance salary)
  const allSalaries = transactions.filter(t =>
    t.mainCategory === 'Salary' ||
    (t.mainCategory === 'Cash Outflow' && t.subCategory === 'Advance Salary')
  );

  const handleAdd = () => {
    setFormData({
      company: companies[0],
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setSalaryTransactions([{
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
      imageUrl: ''
    }]);
    setIsModalOpen(true);
  };

  const addSalaryTransaction = () => {
    setSalaryTransactions([...salaryTransactions, {
      id: Date.now().toString(),
      employeeId: '',
      employeeName: '',
      baseSalary: 0,
      commission: 0,
      deductions: 0,
      netAmount: 0,
      paidBy: formData.company.split(': ')[1] || formData.company,
      mode: 'Cash',
      bankName: '',
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
        updated.netAmount = updated.baseSalary + (field === 'commission' ? value : updated.commission) - (field === 'deductions' ? value : updated.deductions);
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
        toast.success('Image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    return salaryTransactions.reduce((sum, t) => sum + t.netAmount, 0);
  };

  const handleSave = () => {
    // Validate all transactions
    for (const salTxn of salaryTransactions) {
      if (!salTxn.employeeId || !salTxn.paidBy || salTxn.netAmount <= 0) {
        toast.error('Please fill in all required fields for each transaction');
        return;
      }

      if ((salTxn.mode === 'Bank' || salTxn.mode === 'Cheque') && !salTxn.bankName) {
        toast.error('Please select a bank for bank/cheque transactions');
        return;
      }

      if ((salTxn.mode === 'Bank' || salTxn.mode === 'Cheque') && salTxn.bankName) {
        const bank = banks.find(b => b.name === salTxn.bankName);
        if (bank && bank.balance < salTxn.netAmount) {
          toast.error(`Insufficient balance in ${bank.name}`);
          return;
        }
      }
    }

    // Create individual transaction records
    const now = new Date();
    const newTransactions: Transaction[] = salaryTransactions.map((salTxn, index) => ({
      id: Date.now().toString() + Math.random().toString() + index,
      transactionId: `TXN-${Date.now()}-${index + 1}`,
      date: formData.date,
      time: now.toTimeString().split(' ')[0],
      company: formData.company,
      mainCategory: 'Salary',
      subCategory: 'Employee Salary',
      amount: salTxn.netAmount,
      mode: salTxn.mode,
      bankName: salTxn.bankName,
      paidBy: salTxn.paidBy,
      paidTo: salTxn.employeeName,
      employeeId: salTxn.employeeId,
      employeeName: salTxn.employeeName,
      baseSalary: salTxn.baseSalary,
      commission: salTxn.commission,
      deductions: salTxn.deductions,
      netAmount: salTxn.netAmount,
      note: formData.note,
      imageUrl: salTxn.imageUrl
    }));

    // Update bank balances
    const updatedBanks = [...banks];
    for (const salTxn of salaryTransactions) {
      if ((salTxn.mode === 'Bank' || salTxn.mode === 'Cheque') && salTxn.bankName) {
        const bankIndex = updatedBanks.findIndex(b => b.name === salTxn.bankName);
        if (bankIndex !== -1) {
          updatedBanks[bankIndex] = {
            ...updatedBanks[bankIndex],
            balance: updatedBanks[bankIndex].balance - salTxn.netAmount
          };
        }
      }
    }
    setBanks(updatedBanks);

    setTransactions([...transactions, ...newTransactions]);
    toast.success(`${newTransactions.length} salary transaction(s) added successfully`);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this salary transaction?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Salary transaction deleted successfully');
    }
  };

  const handlePrint = (salary: Transaction) => {
    toast.success(`Printing salary slip`);
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Advance Salary handlers
  const selectedEmployee = employees.find(e => e.id === advanceFormData.employeeId);
  const remainingAmount = selectedEmployee ? selectedEmployee.salary - advanceFormData.paidAmount : 0;

  const handleAdvanceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAdvanceFormData({ ...advanceFormData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAdvanceSave = () => {
    if (!selectedEmployee || !advanceFormData.salaryMonth) {
      toast.error('Please fill all required fields');
      return;
    }

    if (advanceFormData.paidAmount <= 0) {
      toast.error('Paid amount must be greater than 0');
      return;
    }

    if ((advanceFormData.mode === 'Bank' || advanceFormData.mode === 'Cheque') && !advanceFormData.bankName) {
      toast.error('Please select a bank for Bank or Cheque mode');
      return;
    }

    if ((advanceFormData.mode === 'Bank' || advanceFormData.mode === 'Cheque') && advanceFormData.bankName) {
      const bank = banks.find(b => b.name === advanceFormData.bankName);
      if (bank && bank.balance < advanceFormData.paidAmount) {
        toast.error(`Insufficient balance in ${bank.name}`);
        return;
      }
    }

    if (remainingAmount < 0) {
      toast.error('Paid amount cannot exceed total salary');
      return;
    }

    const now = new Date();

    const newRecord: AdvanceSalaryRecord = {
      id: `ADV-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      designation: selectedEmployee.position,
      salaryMonth: advanceFormData.salaryMonth,
      totalSalary: selectedEmployee.salary,
      paidAmount: advanceFormData.paidAmount,
      remainingAmount: selectedEmployee.salary - advanceFormData.paidAmount,
      mode: advanceFormData.mode,
      bankName: advanceFormData.bankName || undefined,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      imageUrl: advanceFormData.imageUrl
    };

    // Create transaction record
    const newTransaction: Transaction = {
      id: newRecord.id,
      transactionId: `TXN-${Date.now()}`,
      date: newRecord.date,
      time: newRecord.time,
      company: 'Pakistan Detectors Technologies: Islamabad/ Head Office', // Default company
      mainCategory: 'Cash Outflow',
      subCategory: 'Advance Salary',
      amount: advanceFormData.paidAmount,
      mode: advanceFormData.mode,
      bankName: advanceFormData.bankName || undefined,
      note: `Advance salary for ${selectedEmployee.name} - ${advanceFormData.salaryMonth}`,
      paidBy: 'Pakistan Detectors Technologies',
      paidTo: selectedEmployee.name,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      imageUrl: advanceFormData.imageUrl
    };

    // Update bank balances
    if ((advanceFormData.mode === 'Bank' || advanceFormData.mode === 'Cheque') && advanceFormData.bankName) {
      const updatedBanks = banks.map(bank =>
        bank.name === advanceFormData.bankName
          ? { ...bank, balance: bank.balance - advanceFormData.paidAmount }
          : bank
      );
      setBanks(updatedBanks);
    }

    setAdvanceRecords([...advanceRecords, newRecord]);
    setTransactions([...transactions, newTransaction]);
    toast.success('Advance salary recorded and transaction added');
    setIsAdvanceModalOpen(false);

    setAdvanceFormData({
      employeeId: '',
      salaryMonth: '',
      paidAmount: 0,
      mode: 'Cash',
      bankName: '',
      imageUrl: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Salary</h2>
          <p className="text-sm text-gray-600 mt-1">Manage employee salary payments</p>
        </div>
        <div className="flex gap-3">
  <button
    onClick={handleAdd}
    className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg"
  >
    <Plus size={20} />
    Add Salary Payment
  </button>


  <button
    onClick={() => setIsAdvanceModalOpen(true)}
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
  >
    Advance Salary
  </button>
</div>


        {/* <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Add Salary Payment
        </button> */}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allSalaries.map((salary) => {
                const isAdvanceSalary = salary.mainCategory === 'Cash Outflow' && salary.subCategory === 'Advance Salary';
                const employee = employees.find(e => e.id === salary.employeeId);
                const remainingSalary = employee ? employee.salary - (salary.advanceAmount || 0) : 0;

                return (
                  <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(salary.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{salary.company.split(': ')[1] || salary.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#4f46e5]">{salary.employeeName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isAdvanceSalary ? 'Advance Salary' : 'Regular Salary'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {isAdvanceSalary ? formatCurrency(remainingSalary) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {salary.mode}{salary.bankName ? ` (${salary.bankName})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isAdvanceSalary ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isAdvanceSalary ? 'Paid Advance' : 'Full Salary'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewSalary(salary)}
                          className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setViewSlip(salary)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Slip"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handlePrint(salary)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(salary.id)}
                          className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {allSalaries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No salary payments found. Click "Add Salary Payment" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Salary Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">Add Salary Payment</h3>
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
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6 space-y-6`}>
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    {companies.map(company => (
                      <option key={company} value={company}>{company.split(': ')[1] || company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              {/* Salary Transactions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Salary Transactions</h4>
                  <button
                    onClick={addSalaryTransaction}
                    className="flex items-center gap-1 text-sm bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors"
                  >
                    <Plus size={16} />
                    Add Transaction
                  </button>
                </div>

                <div className="space-y-4">
                  {salaryTransactions.map((txn, index) => (
                    <div key={txn.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Transaction {index + 1}</span>
                        {salaryTransactions.length > 1 && (
                          <button
                            onClick={() => removeSalaryTransaction(txn.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Employee *</label>
                          <select
                            value={txn.employeeId}
                            onChange={(e) => updateSalaryTransaction(txn.id, 'employeeId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                          >
                            <option value="">Select employee</option>
                            {employees.filter(e => e.status === 'active').map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} - {emp.position} (Base Salary: {formatCurrency(emp.salary)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Base Salary</label>
                          <input
                            type="number"
                            value={txn.baseSalary || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Commission (+)</label>
                          <input
                            type="number"
                            value={txn.commission || ''}
                            onChange={(e) => updateSalaryTransaction(txn.id, 'commission', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Deductions (-)</label>
                          <input
                            type="number"
                            value={txn.deductions || ''}
                            onChange={(e) => updateSalaryTransaction(txn.id, 'deductions', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Net Amount</label>
                          <input
                            type="number"
                            value={txn.netAmount || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#10b981]/10 text-[#10b981] font-semibold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Paid By (Person/Company) *</label>
                          <input
                            type="text"
                            value={txn.paidBy}
                            onChange={(e) => updateSalaryTransaction(txn.id, 'paidBy', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            placeholder="e.g., Pakistan Detectors - Islamabad"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                          <select
                            value={txn.mode}
                            onChange={(e) => updateSalaryTransaction(txn.id, 'mode', e.target.value as 'Cash' | 'Bank' | 'Cheque')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>
                        {(txn.mode === 'Bank' || txn.mode === 'Cheque') && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name *</label>
                            <select
                              value={txn.bankName}
                              onChange={(e) => updateSalaryTransaction(txn.id, 'bankName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
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
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Receipt Image (JPG/PNG)</label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <Upload size={16} className="mr-2" />
                              <span className="text-sm">{txn.imageUrl ? 'Change' : 'Upload'}</span>
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
                                title="Remove image"
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
              </div>

              {/* Total */}
              <div className="bg-[#4f46e5]/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Net Amount:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(calculateTotal())}</span>
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
                Save Salary Payment(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Salary Details Modal */}
      {viewSalary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Salary Details</h3>
              <button onClick={() => setViewSalary(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewSalary.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{viewSalary.company.split(': ')[1] || viewSalary.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-[#4f46e5]">{viewSalary.employeeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Base Salary</p>
                  <p className="font-medium text-gray-900">{formatCurrency(viewSalary.baseSalary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission</p>
                  <p className="font-medium text-green-600">{formatCurrency(viewSalary.commission || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="font-medium text-red-600">{formatCurrency(viewSalary.deductions || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Amount</p>
                  <p className="font-semibold text-lg text-[#4f46e5]">{formatCurrency(viewSalary.netAmount || viewSalary.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid By</p>
                  <p className="font-medium text-gray-900">{viewSalary.paidBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {viewSalary.mode}{viewSalary.bankName ? ` (${viewSalary.bankName})` : ''}
                  </p>
                </div>
              </div>
              {viewSalary.note && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium text-gray-900">{viewSalary.note}</p>
                </div>
              )}
              {viewSalary.imageUrl && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Receipt Image</p>
                  <img src={viewSalary.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Salary Payment Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-sm text-gray-600 mt-1">{viewSlip.company.split(': ')[1] || viewSlip.company}</p>
                <p className="text-lg font-semibold mt-3">SALARY PAYMENT SLIP</p>
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold text-gray-900">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee:</p>
                  <p className="font-semibold text-[#4f46e5]">{viewSlip.employeeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Base Salary:</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(viewSlip.baseSalary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission:</p>
                  <p className="font-semibold text-green-600">+{formatCurrency(viewSlip.commission || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions:</p>
                  <p className="font-semibold text-red-600">-{formatCurrency(viewSlip.deductions || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid By:</p>
                  <p className="font-semibold text-gray-900">{viewSlip.paidBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="font-semibold text-gray-900">
                    {viewSlip.mode}{viewSlip.bankName ? ` (${viewSlip.bankName})` : ''}
                  </p>
                </div>
              </div>

              {/* Net Amount */}
              <div className="bg-[#4f46e5]/10 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Net Amount Paid:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewSlip.netAmount || viewSlip.amount)}</span>
                </div>
              </div>

              {viewSlip.note && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Note:</p>
                  <p className="text-sm text-gray-600">{viewSlip.note}</p>
                </div>
              )}

              {viewSlip.imageUrl && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Receipt:</p>
                  <img src={viewSlip.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Salary Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Advance Salary</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={advanceFormData.employeeId}
                onChange={e =>
                  setAdvanceFormData({ ...advanceFormData, employeeId: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} – {emp.position}
                  </option>
                ))}
              </select>

              <input
                type="month"
                value={advanceFormData.salaryMonth}
                onChange={e =>
                  setAdvanceFormData({ ...advanceFormData, salaryMonth: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <input
                type="number"
                placeholder="Advance Amount Paid"
                value={advanceFormData.paidAmount}
                onChange={e => {
                  const value = Number(e.target.value);
                  if (value >= 0) {
                    setAdvanceFormData({
                      ...advanceFormData,
                      paidAmount: value
                    });
                  }
                }}
                min="0"
                className="w-full border px-3 py-2 rounded"
              />

              {selectedEmployee && (
                <p className="text-sm text-gray-600">
                  Remaining Salary:{' '}
                  <span className="font-medium text-red-600">
                    {formatCurrency(remainingAmount)}
                  </span>
                </p>
              )}

              <select
                value={advanceFormData.mode}
                onChange={e => {
                  const newMode = e.target.value as 'Cash' | 'Bank' | 'Cheque';
                  setAdvanceFormData({
                    ...advanceFormData,
                    mode: newMode,
                    bankName: newMode === 'Cash' ? '' : advanceFormData.bankName
                  });
                }}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Cheque">Cheque</option>
              </select>

              {advanceFormData.mode !== 'Cash' && (
                <select
                  value={advanceFormData.bankName}
                  onChange={e =>
                    setAdvanceFormData({ ...advanceFormData, bankName: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Bank</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex items-center gap-2 cursor-pointer border p-2 rounded">
                <Upload size={16} />
                Upload Receipt
                <input type="file" hidden onChange={handleAdvanceImageUpload} />
              </label>

              {advanceFormData.imageUrl && (
                <img
                  src={advanceFormData.imageUrl}
                  className="h-20 rounded border"
                />
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdvanceSave}
                  className="px-4 py-2 bg-[#4f46e5] text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
