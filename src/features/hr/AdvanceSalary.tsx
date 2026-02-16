import { useState } from 'react';
import { Employee, Bank, Transaction } from '../../App';
import { Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

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

type Props = {
  employees: Employee[];
  banks: Bank[];
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  setBanks: (banks: Bank[]) => void;
};

export function AdvanceSalary({ employees, banks, transactions, setTransactions, setBanks }: Props) {
  const [records, setRecords] = useState<AdvanceSalaryRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    salaryMonth: '',
    paidAmount: 0,
    mode: 'Cash' as 'Cash' | 'Bank' | 'Cheque',
    bankName: '',
    imageUrl: ''
  });

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);

  const remainingAmount =
    selectedEmployee
      ? selectedEmployee.salary - formData.paidAmount
      : 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!selectedEmployee || !formData.salaryMonth) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.paidAmount <= 0) {
      toast.error('Paid amount must be greater than 0');
      return;
    }

    if ((formData.mode === 'Bank' || formData.mode === 'Cheque') && !formData.bankName) {
      toast.error('Please select a bank for Bank or Cheque mode');
      return;
    }

    if ((formData.mode === 'Bank' || formData.mode === 'Cheque') && formData.bankName) {
      const bank = banks.find(b => b.name === formData.bankName);
      if (bank && bank.balance < formData.paidAmount) {
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
      salaryMonth: formData.salaryMonth,
      totalSalary: selectedEmployee.salary,
      paidAmount: formData.paidAmount,
      remainingAmount: selectedEmployee.salary - formData.paidAmount,
      mode: formData.mode,
      bankName: formData.bankName || undefined,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      imageUrl: formData.imageUrl
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
      amount: formData.paidAmount,
      mode: formData.mode,
      bankName: formData.bankName || undefined,
      note: `Advance salary for ${selectedEmployee.name} - ${formData.salaryMonth}`,
      paidBy: 'Pakistan Detectors Technologies',
      paidTo: selectedEmployee.name,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      imageUrl: formData.imageUrl
    };

    // Update bank balances
    if ((formData.mode === 'Bank' || formData.mode === 'Cheque') && formData.bankName) {
      const updatedBanks = banks.map(bank =>
        bank.name === formData.bankName
          ? { ...bank, balance: bank.balance - formData.paidAmount }
          : bank
      );
      setBanks(updatedBanks);
    }

    setRecords([...records, newRecord]);
    setTransactions([...transactions, newTransaction]);
    toast.success('Advance salary recorded and transaction added');
    setIsModalOpen(false);

    setFormData({
      employeeId: '',
      salaryMonth: '',
      paidAmount: 0,
      mode: 'Cash',
      bankName: '',
      imageUrl: ''
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Advance Salary</h2>
          <p className="text-sm text-gray-600">
            Track salary paid in advance with month-wise records
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Advance Salary
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Designation</th>
              <th className="px-4 py-3 text-left">Salary Month</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Remaining</th>
              <th className="px-4 py-3 text-left">Mode</th>
              <th className="px-4 py-3 text-left">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-3 font-medium text-[#4f46e5]">
                  {r.employeeName}
                </td>
                <td className="px-4 py-3">{r.designation}</td>
                <td className="px-4 py-3">{r.salaryMonth}</td>
                <td className="px-4 py-3 text-green-600">
                  {formatCurrency(r.paidAmount)}
                </td>
                <td className="px-4 py-3 text-red-600">
                  {formatCurrency(r.remainingAmount)}
                </td>
                <td className="px-4 py-3">
                  {r.mode}{r.bankName ? ` (${r.bankName})` : ''}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {r.date} {r.time}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No advance salary records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Advance Salary</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={formData.employeeId}
                onChange={e =>
                  setFormData({ ...formData, employeeId: e.target.value })
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
                value={formData.salaryMonth}
                onChange={e =>
                  setFormData({ ...formData, salaryMonth: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <input
                type="number"
                placeholder="Advance Amount Paid"
                value={formData.paidAmount}
                onChange={e => {
                  const value = Number(e.target.value);
                  if (value >= 0) {
                    setFormData({
                      ...formData,
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
                value={formData.mode}
                onChange={e => {
                  const newMode = e.target.value as 'Cash' | 'Bank' | 'Cheque';
                  setFormData({
                    ...formData,
                    mode: newMode,
                    bankName: newMode === 'Cash' ? '' : formData.bankName
                  });
                }}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Cheque">Cheque</option>
              </select>

              {formData.mode !== 'Cash' && (
                <select
                  value={formData.bankName}
                  onChange={e =>
                    setFormData({ ...formData, bankName: e.target.value })
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
                <input type="file" hidden onChange={handleImageUpload} />
              </label>

              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  className="h-20 rounded border"
                />
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
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
