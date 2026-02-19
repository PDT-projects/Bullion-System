// Employee Module - View Layer
// EmployeeTable Component - Table UI for employee list

import { Eye, Edit, Trash2 } from 'lucide-react';
import { Employee } from '../../models/types';

/**
 * Props for EmployeeTable component
 */
interface EmployeeTableProps {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

/**
 * EmployeeTable - Dumb component for displaying employee data in a table
 */
export function EmployeeTable({ 
  employees, 
  onView, 
  onEdit, 
  onDelete,
  formatCurrency 
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <div className="flex flex-col items-center">
          <div className="text-lg font-medium mb-2">No employees found</div>
          <div className="text-sm">
            Try adjusting your filters or clearing them to see all employees.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {employee.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.position}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(employee.salary)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(employee)}
                    className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(employee.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(employee.id)}
                    className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
