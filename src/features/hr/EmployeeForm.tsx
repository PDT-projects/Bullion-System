import { Employee } from '../../App';

type EmployeeFormProps = {
  formData: Partial<Employee>;
  setFormData: (data: Partial<Employee>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
};

export function EmployeeForm({ formData, setFormData, onSubmit, onCancel, isEdit = false }: EmployeeFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            placeholder="Enter employee name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
          <input
            type="text"
            value={formData.position || ''}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            placeholder="Enter position"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
          <input
            type="number"
            value={formData.salary || ''}
            onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            placeholder="Enter salary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
          <input
            type="date"
            value={formData.joinDate || ''}
            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors flex items-center gap-2"
        >
          {isEdit ? 'Update Employee' : 'Save Employee'}
        </button>
      </div>
    </div>
  );
}
