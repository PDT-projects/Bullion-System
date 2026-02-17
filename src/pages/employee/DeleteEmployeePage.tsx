import { useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Employee } from '../../App';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export function DeleteEmployeePage() {
  const { employees, setEmployees } = useOutletContext<{ employees: Employee[]; setEmployees: (employees: Employee[]) => void }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employee = id ? employees.find(e => e.id === id) : null;

  useEffect(() => {
    if (id && employees.length > 0 && !employee) {
      toast.error('Employee not found');
      navigate('/employees');
    }
  }, [id, employees, employee, navigate]);

  const handleDelete = () => {
    if (id) {
      setEmployees(employees.filter(e => e.id !== id));
      toast.success('Employee deleted successfully');
      navigate('/employees');
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  if (!employee) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Delete Confirmation View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#ef4444] text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to Employees"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-xl font-bold">Delete Employee</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h4>
            <p className="text-gray-600">
              You are about to delete <strong>{employee.name}</strong>. This action cannot be undone.
            </p>
          </div>

          {/* Employee Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{employee.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Position:</span>
                <p className="font-medium">{employee.position}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium">{employee.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2.5 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Employee
          </button>
        </div>
      </div>
    </div>
  );
}
