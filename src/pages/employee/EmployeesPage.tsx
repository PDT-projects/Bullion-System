import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Employee } from '../../App';
import { Plus, Eye, Edit, Trash2, Filter, X } from 'lucide-react';

type EmployeesPageProps = {
  employees?: Employee[];
  setEmployees?: (employees: Employee[]) => void;
};

export function EmployeesPage({ employees: propEmployees, setEmployees: propSetEmployees }: EmployeesPageProps = {}) {
  const context = useOutletContext<{ employees: Employee[]; setEmployees: (employees: Employee[]) => void }>();
  const navigate = useNavigate();
  
  const employees = propEmployees ?? context.employees;
  const setEmployees = propSetEmployees ?? context.setEmployees;

  
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // Filter states
  const [nameSearch, setNameSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique positions for dropdown
  const uniquePositions = Array.from(new Set(employees.map(emp => emp.position))).sort();

  // Apply filters to employees
  const filteredEmployees = employees.filter(employee => {
    // Name search (case-insensitive, partial match)
    if (nameSearch && !employee.name.toLowerCase().includes(nameSearch.toLowerCase())) {
      return false;
    }

    // Position filter
    if (positionFilter && employee.position !== positionFilter) {
      return false;
    }

    // Salary range filter
    const salary = employee.salary;
    const min = minSalary ? parseFloat(minSalary) : 0;
    const max = maxSalary ? parseFloat(maxSalary) : Infinity;
    if (salary < min || salary > max) {
      return false;
    }

    // Phone search
    if (phoneSearch && !employee.phone.toLowerCase().includes(phoneSearch.toLowerCase())) {
      return false;
    }

    // Email search
    if (emailSearch && !employee.email.toLowerCase().includes(emailSearch.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter && employee.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setNameSearch('');
    setPositionFilter('');
    setMinSalary('');
    setMaxSalary('');
    setPhoneSearch('');
    setEmailSearch('');
    setStatusFilter('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Table View */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your employee records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters {(nameSearch || positionFilter || minSalary || maxSalary || phoneSearch || emailSearch || statusFilter) && `(${(nameSearch ? 1 : 0) + (positionFilter ? 1 : 0) + (minSalary ? 1 : 0) + (maxSalary ? 1 : 0) + (phoneSearch ? 1 : 0) + (emailSearch ? 1 : 0) + (statusFilter ? 1 : 0)})`}
          </button>
          <button
            onClick={() => navigate('/employees/create')}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Name Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Position</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              >
                <option value="">All Positions</option>
                {uniquePositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>

            {/* Phone Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Phone</label>
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                placeholder="Enter phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>

            {/* Email Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Email</label>
              <input
                type="text"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder="Enter email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">All Employees ({filteredEmployees.length})</h3>
        </div>
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
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
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
                          onClick={() => navigate(`/employees/${employee.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${employee.id}/delete`)}
                          className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-medium mb-2">No employees found</div>
                      <div className="text-sm">Try adjusting your filters or clearing them to see all employees.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
