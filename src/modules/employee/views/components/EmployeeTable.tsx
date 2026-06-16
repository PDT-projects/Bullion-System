// Employee Module - View Layer
// EmployeeTable Component - Table UI for employee list
// UPDATED: Each employee's salary is shown in their own stored currency
//          (salaryCurrency field on the Employee record), not a global toggle.
//          The global displayCurrency toggle is kept for the header label only.

import { Eye, Edit, Trash2 } from 'lucide-react';
import { Employee } from '../../models/types';
import type { SalaryCurrency } from '../EmployeeFormView';
import { AED_TO_PKR, PKR_TO_AED } from '../../utils/CurrencyUtils';

interface EmployeeTableProps {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number, currency?: SalaryCurrency) => string;
  convertSalary: (amount: number, from: SalaryCurrency, to: SalaryCurrency) => number;
  displayCurrency: SalaryCurrency; // kept for header label
}

function CurrencyPill({ currency }: { currency: SalaryCurrency }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ml-1.5"
      style={currency === 'AED'
        ? { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }
        : { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
    >
      {currency === 'AED' ? 'د.إ AED' : '₨ PKR'}
    </span>
  );
}

function formatNative(salary: number, currency: SalaryCurrency): string {
  if (currency === 'AED') {
    return `د.إ ${salary.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₨ ${Math.round(salary).toLocaleString('en-PK')}`;
}

function formatConverted(salary: number, nativeCurrency: SalaryCurrency): string {
  if (nativeCurrency === 'AED') {
    // show PKR equivalent
    const pkr = Math.round(salary * AED_TO_PKR);
    return `≈ ₨ ${pkr.toLocaleString('en-PK')}`;
  }
  // show AED equivalent
  const aed = (salary * PKR_TO_AED).toFixed(2);
  return `≈ د.إ ${aed}`;
}

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <div className="text-lg font-medium mb-2">No employees found</div>
        <div className="text-sm">Try adjusting your filters or clearing them to see all employees.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Name', 'Position', 'Salary', 'Phone', 'Email', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map(employee => {
            // Each employee carries their own salaryCurrency — fall back to PKR for legacy records
            const currency: SalaryCurrency = (employee as any).salaryCurrency || 'PKR';
            const salary = employee.salary || 0;

            return (
              <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>

                {/* Salary — native currency always */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-0.5">
                    <span className="font-semibold text-gray-900">{formatNative(salary, currency)}</span>
                    <CurrencyPill currency={currency} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatConverted(salary, currency)}</p>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(employee)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onEdit(employee.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(employee.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}