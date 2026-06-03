// Employee Module - View Layer
// EmployeeFormFields - Reusable form fields for Create/Edit employee
// Includes international location picker with persistent custom cities

import { useState } from 'react';
import { PlusCircle, MapPin } from 'lucide-react';
import { Employee } from '../../models/types';

const ADD_NEW_LOCATION = '__ADD_NEW__';

interface EmployeeFormFieldsProps {
  formData: Partial<Employee>;
  onFieldChange: (field: keyof Employee, value: any) => void;
  allLocations?: string[];
  addCustomLocation?: (name: string) => void;
}

export function EmployeeFormFields({
  formData,
  onFieldChange,
  allLocations = [],
  addCustomLocation = () => {},
}: EmployeeFormFieldsProps) {
  const [newCityInput, setNewCityInput] = useState('');
  const [showNewCityInput, setShowNewCityInput] = useState(false);

  const handleLocationChange = (value: string) => {
    if (value === ADD_NEW_LOCATION) {
      setShowNewCityInput(true);
    } else {
      setShowNewCityInput(false);
      onFieldChange('location', value);
    }
  };

  const handleAddCity = () => {
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    addCustomLocation(trimmed);
    onFieldChange('location', trimmed);
    setNewCityInput('');
    setShowNewCityInput(false);
  };

  const inp =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={e => onFieldChange('name', e.target.value)}
          className={inp}
          placeholder="Enter full name"
        />
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.position || ''}
          onChange={e => onFieldChange('position', e.target.value)}
          className={inp}
          placeholder="e.g. Sales Manager"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={e => onFieldChange('email', e.target.value)}
          className={inp}
          placeholder="email@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={e => onFieldChange('phone', e.target.value)}
          className={inp}
          placeholder="+971 50 000 0000"
        />
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salary (PKR)
        </label>
        <input
          type="number"
          min="0"
          value={formData.salary || ''}
          onChange={e => onFieldChange('salary', parseFloat(e.target.value) || 0)}
          className={inp}
          placeholder="0"
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
          onChange={e => onFieldChange('joinDate', e.target.value)}
          className={inp}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status || 'active'}
          onChange={e => onFieldChange('status', e.target.value)}
          className={inp}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Location — full-width with add-new-city support */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <MapPin
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            value={showNewCityInput ? ADD_NEW_LOCATION : (formData.location || '')}
            onChange={e => handleLocationChange(e.target.value)}
            className={`${inp} pl-8`}
          >
            <option value="">Select Location</option>
            {allLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
            <option value={ADD_NEW_LOCATION}>＋ Add new city…</option>
          </select>
        </div>

        {/* Inline new-city input */}
        {showNewCityInput && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              type="text"
              autoFocus
              placeholder="Enter city name (e.g. Karachi, Istanbul)"
              value={newCityInput}
              onChange={e => setNewCityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddCity(); }
                if (e.key === 'Escape') { setShowNewCityInput(false); setNewCityInput(''); }
              }}
              className={`${inp} flex-1`}
            />
            <button
              type="button"
              onClick={handleAddCity}
              disabled={!newCityInput.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <PlusCircle size={14} />
              Add City
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCityInput(false); setNewCityInput(''); }}
              className="px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {showNewCityInput && (
          <p className="mt-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <PlusCircle size={11} />
            New cities are saved for future use on this device.
          </p>
        )}
      </div>

      {/* Bank Details section */}
      <div className="md:col-span-2 pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
          Bank Details (optional)
        </p>
      </div>

      {/* Bank Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bank Name
        </label>
        <input
          type="text"
          value={formData.bankName || ''}
          onChange={e => onFieldChange('bankName', e.target.value)}
          className={inp}
          placeholder="e.g. HBL, Meezan"
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
          onChange={e => onFieldChange('accountTitle', e.target.value)}
          className={inp}
          placeholder="Account holder name"
        />
      </div>

      {/* Account Number */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Number
        </label>
        <input
          type="text"
          value={formData.accountNumber || ''}
          onChange={e => onFieldChange('accountNumber', e.target.value)}
          className={inp}
          placeholder="IBAN or account number"
        />
      </div>

    </div>
  );
}