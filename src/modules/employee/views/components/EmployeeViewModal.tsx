// Employee Module - View Layer
// EmployeeViewModal Component - Modal for viewing employee details

import { X } from 'lucide-react';
import { Employee } from '../../models/types';

/**
 * Props for EmployeeViewModal component
 */
interface EmployeeViewModalProps {
  employee: Employee;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

/**
 * EmployeeViewModal - Dumb component for displaying employee details in a modal
 */
export function EmployeeViewModal({ 
  employee, 
  onClose,
  formatCurrency,
  formatDate
}: EmployeeViewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold">Employee Details</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Salary</p>
              <p className="font-medium">{formatCurrency(employee.salary)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{employee.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium">{formatDate(employee.joinDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                employee.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
