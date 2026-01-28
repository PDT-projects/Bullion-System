import { useState } from 'react';
import { Employee } from '../App';
import { Plus, Eye, Edit, Trash2, X, Maximize2, Minimize2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type EmployeesProps = {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
};

export function Employees({ employees, setEmployees }: EmployeesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    position: '',
    salary: 0,
    phone: '',
    email: '',
    joinDate: '',
    status: 'active'
  });

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      position: '',
      salary: 0,
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.position || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingEmployee) {
      setEmployees(employees.map(e => e.id === editingEmployee.id ? { ...formData, id: e.id } as Employee : e));
      toast.success('Employee updated successfully');
    } else {
      const newEmployee: Employee = {
        ...formData,
        id: Date.now().toString()
      } as Employee;
      setEmployees([...employees, newEmployee]);
      toast.success('Employee added successfully');
    }

    setIsModalOpen(false);
    setIsFullScreen(false);
    setFormData({});
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsFullScreen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(e => e.id !== id));
      toast.success('Employee deleted successfully');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Render form content
  const renderFormContent = () => (
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
    </div>
  );

  return (
    <div className="p-6">
      {/* Table View */}
      {!isFullScreen && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Employees</h2>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              <Plus size={20} />
              Add Employee
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(employee.salary)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.email}</td>
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
                            onClick={() => setViewEmployee(employee)}
                            className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
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
          </div>
        </>
      )}

      {/* Full-Screen Form View */}
      {isFullScreen && isModalOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#4f46e5] text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Back to Modal"
              >
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Switch to Modal"
            >
              <Minimize2 size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8 max-w-4xl mx-auto">
            {renderFormContent()}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              {editingEmployee ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        </div>
      )}

      {/* Modal View */}
      {!isFullScreen && isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Full Screen"
                >
                  <Maximize2 size={20} />
                </button>
                <button onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {renderFormContent()}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                {editingEmployee ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Employee Details</h3>
              <button onClick={() => setViewEmployee(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{viewEmployee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium">{viewEmployee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="font-medium">{formatCurrency(viewEmployee.salary)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{viewEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{viewEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Join Date</p>
                  <p className="font-medium">{new Date(viewEmployee.joinDate).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    viewEmployee.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewEmployee.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
