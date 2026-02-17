import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Employee } from '../../App';
import { EmployeeForm } from '../../features/hr/EmployeeForm';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function CreateEmployeePage() {
  const { employees, setEmployees } = useOutletContext<{ employees: Employee[]; setEmployees: (employees: Employee[]) => void }>();
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

  const handleSubmit = () => {
    if (!formData.name || !formData.position || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newEmployee: Employee = {
      ...formData,
      id: Date.now().toString()
    } as Employee;
    
    setEmployees([...employees, newEmployee]);
    toast.success('Employee added successfully');
    navigate('/employees');
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
            <h3 className="text-xl font-bold">Add Employee</h3>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 max-w-4xl mx-auto">
          <EmployeeForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={false}
          />
        </div>
      </div>
    </div>
  );
}
