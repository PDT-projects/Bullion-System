// Employee Module - View Layer
// EmployeeFormFields Component - Shared form fields for Create/Edit

import { Employee } from '../../models/types';

/**
 * Props for EmployeeFormFields component
 */
interface EmployeeFormFieldsProps {
  formData: Partial<Employee>;
  onFieldChange: (field: keyof Employee, value: any) => void;
}

/**
 * EmployeeFormFields - Dumb component for employee form inputs
 * Shared between Create and Edit pages
 */
export function EmployeeFormFields({ 
  formData, 
  onFieldChange 
}: EmployeeFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter employee name"
        />
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position *
        </label>
        <input
          type="text"
          value={formData.position || ''}
          onChange={(e) => onFieldChange('position', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter position"
        />
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salary
        </label>
        <input
          type="number"
          value={formData.salary || ''}
          onChange={(e) => onFieldChange('salary', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter salary"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="text"
          value={formData.phone || ''}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter phone number"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onFieldChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter email address"
        />
      </div>

      {/* Join Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Join Date
        </label>
        <input
          type="date"
          value={formData.joinDate || ''}
          onChange={(e) => onFieldChange('joinDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status || 'active'}
          onChange={(e) => onFieldChange('status', e.target.value as 'active' | 'inactive')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <select
          value={formData.location || 'Karachi'}
          onChange={(e) => onFieldChange('location', e.target.value as 'Karachi' | 'Islamabad' | 'Lahore')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="Karachi">Karachi</option>
          <option value="Islamabad">Islamabad</option>
          <option value="Lahore">Lahore</option>
        </select>
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Number
        </label>
        <input
          type="text"
          value={formData.accountNumber || ''}
          onChange={(e) => onFieldChange('accountNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter account number"
        />
      </div>

      {/* Bank Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bank Name
        </label>
        <input
          type="text"
          value={formData.bankName || ''}
          onChange={(e) => onFieldChange('bankName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter bank name"
        />
      </div>

      {/* Account Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Title
        </label>
        <input
          type="text"
          value={formData.accountTitle || ''}
          onChange={(e) => onFieldChange('accountTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          placeholder="Enter account title"
        />
      </div>
    </div>


  );
}
