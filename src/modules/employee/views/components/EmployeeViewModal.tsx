// Employee Module - View Layer
// EmployeeViewModal Component - Modal for viewing employee details
// UPDATED: salary is shown in the employee's own salaryCurrency (from their record),
//          with a secondary line showing the equivalent in the other currency.

import { X } from 'lucide-react';
import { Employee } from '../../models/types';
import type { SalaryCurrency } from '../EmployeeFormView';
import { AED_TO_PKR, PKR_TO_AED } from '../../utils/CurrencyUtils';

interface EmployeeViewModalProps {
  employee: Employee;
  onClose: () => void;
  formatCurrency: (amount: number, currency?: SalaryCurrency) => string;
  formatDate: (dateString: string) => string;
  convertSalary: (amount: number, from: SalaryCurrency, to: SalaryCurrency) => number;
  displayCurrency: SalaryCurrency; // kept for prop compat, but we use employee's own currency
}

function formatNative(salary: number, currency: SalaryCurrency): string {
  if (currency === 'AED') {
    return `د.إ ${salary.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₨ ${Math.round(salary).toLocaleString('en-PK')} PKR`;
}

function formatConverted(salary: number, nativeCurrency: SalaryCurrency): string {
  if (nativeCurrency === 'AED') {
    const pkr = Math.round(salary * AED_TO_PKR);
    return `≈ ₨ ${pkr.toLocaleString('en-PK')} PKR`;
  }
  const aed = (salary * PKR_TO_AED).toFixed(2);
  return `≈ د.إ ${aed} AED`;
}

export function EmployeeViewModal({
  employee,
  onClose,
  formatDate,
}: EmployeeViewModalProps) {
  // Use the employee's own stored currency — fall back to PKR for legacy records
  const nativeCurrency: SalaryCurrency = (employee as any).salaryCurrency || 'PKR';
  const salary = employee.salary || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl">
        {/* Header */}
        <div style={{ backgroundColor: '#374151' }} className="flex items-center justify-between p-6 border-b border-gray-200 text-white rounded-t-xl">
          <h3 className="text-xl font-bold">Employee Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
              <p className="font-medium text-gray-900">{employee.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Position</p>
              <p className="font-medium text-gray-900">{employee.position}</p>
            </div>

            {/* Salary — in employee's own currency */}
            <div className="col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Monthly Salary</p>
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{formatNative(salary, nativeCurrency)}</p>
                    {/* Currency badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold border"
                      style={nativeCurrency === 'AED'
                        ? { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }
                        : { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
                    >
                      {nativeCurrency === 'AED' ? 'AED — Dubai/GCC' : 'PKR — Pakistan'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatConverted(salary, nativeCurrency)}</p>
                </div>
                <p className="text-xs text-gray-400 border-l border-gray-200 pl-4 self-center">
                  Rate: 1 AED = {AED_TO_PKR} PKR
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
              <p className="font-medium text-gray-900">{employee.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
              <p className="font-medium text-gray-900">{employee.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Join Date</p>
              <p className="font-medium text-gray-900">{formatDate(employee.joinDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
              <p className="font-medium text-gray-900">{employee.location || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.status}
              </span>
            </div>

            {/* Bank details */}
            {(employee.bankName || employee.accountNumber) && (
              <div className="col-span-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bank Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {employee.bankName && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bank</p>
                      <p className="font-medium text-gray-900">{employee.bankName}</p>
                    </div>
                  )}
                  {employee.accountTitle && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Account Title</p>
                      <p className="font-medium text-gray-900">{employee.accountTitle}</p>
                    </div>
                  )}
                  {employee.accountNumber && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Account Number</p>
                      <p className="font-medium text-gray-900 font-mono">{employee.accountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}