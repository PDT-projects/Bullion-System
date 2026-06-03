// Employee Module - View Layer
// EmployeeFormView - Shared form page for Create/Edit employee

import { ArrowLeft } from 'lucide-react';
import { Employee } from '../models/types';
import { EmployeeFormFields } from './components/EmployeeFormFields';

interface EmployeeFormViewProps {
  formData: Partial<Employee>;
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  allLocations: string[];
  addCustomLocation: (name: string) => void;
  onFieldChange: (field: keyof Employee, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EmployeeFormView({
  formData,
  isEditMode,
  pageTitle,
  submitButtonText,
  allLocations,
  addCustomLocation,
  onFieldChange,
  onSubmit,
  onCancel,
}: EmployeeFormViewProps) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#4f46e5] text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to Employees"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-xl font-bold">{pageTitle}</h3>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <EmployeeFormFields
              formData={formData}
              onFieldChange={onFieldChange}
              allLocations={allLocations}
              addCustomLocation={addCustomLocation}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={onCancel}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('🖱️ Button clicked in View');
                  onSubmit();
                }}
                className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors flex items-center gap-2"
              >
                {submitButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}