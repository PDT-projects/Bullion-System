import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Employee } from '../../App';
import { EmployeeForm } from '../../features/hr/EmployeeForm';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function EditEmployeePage() {
  const { employees, setEmployees } = useOutletContext<{ employees: Employee[]; setEmployees: (employees: Employee[]) => void }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    position: '',
    salary: 0,
    phone: '',
    email: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  // Find the employee and pre-populate form on mount
  useEffect(() => {
    if (id && employees.length > 0) {
      const employee = employees.find(e => e.id === id);
      if (employee) {
        setFormData(employee);
      } else {
        toast.error('Employee not found');
        navigate('/employees');
      }
    }
  }, [id, employees, navigate]);

  const handleSubmit = () => {
    if (!formData.name || !formData.position || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (id) {
      setEmployees(employees.map(e => e.id === id ? { ...formData, id: e.id } as Employee : e));
      toast.success('Employee updated successfully');
      navigate('/employees');
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <div className="p-6">
      {/* Full-Screen Form View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#4f46e5] text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to Employees"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-xl font-bold">Edit Employee</h3>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 max-w-4xl mx-auto">
          <EmployeeForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  );
}
