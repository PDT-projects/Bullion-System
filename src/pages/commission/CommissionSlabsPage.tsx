import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Percent,
  MapPin,
  User,
  X,
  Save,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

type CommissionSlab = {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
};

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function CommissionSlabsPage() {
  const navigate = useNavigate();
  const { commissionSlabs, setCommissionSlabs, employees } = useOutletContext<{
    commissionSlabs: CommissionSlab[];
    setCommissionSlabs: (slabs: CommissionSlab[]) => void;
    employees: any[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<CommissionSlab | null>(null);

  const [formData, setFormData] = useState<Partial<CommissionSlab>>({
    salesperson: '',
    city: '',
    fromAmount: 0,
    toAmount: 0,
    commissionPercentage: 0,
  });

  const filteredSlabs = commissionSlabs.filter(slab => {
    const employee = employees.find(emp => emp.id === slab.salesperson);
    const salespersonName = employee?.name || '';
    return (
      salespersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slab.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAdd = () => {
    setEditingSlab(null);
    setFormData({
      salesperson: '',
      city: '',
      fromAmount: 0,
      toAmount: 0,
      commissionPercentage: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (slab: CommissionSlab) => {
    setEditingSlab(slab);
    setFormData(slab);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this commission slab?')) {
      setCommissionSlabs(commissionSlabs.filter(item => item.id !== id));
      toast.success('Commission slab deleted successfully');
    }
  };

  const handleSave = () => {
    if (!formData.salesperson || !formData.city || !formData.fromAmount || !formData.toAmount || formData.commissionPercentage === undefined) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromAmount >= formData.toAmount) {
      toast.error('From Amount must be less than To Amount');
      return;
    }

    if (formData.commissionPercentage < 0 || formData.commissionPercentage > 100) {
      toast.error('Commission Percentage must be between 0 and 100');
      return;
    }

    // Check for overlapping slabs
    const overlappingSlab = commissionSlabs.find(slab =>
      slab.id !== editingSlab?.id &&
      slab.salesperson === formData.salesperson &&
      slab.city === formData.city &&
      (
        ((formData.fromAmount ?? 0) >= slab.fromAmount && (formData.fromAmount ?? 0) < slab.toAmount) ||
        ((formData.toAmount ?? 0) > slab.fromAmount && (formData.toAmount ?? 0) <= slab.toAmount) ||
        ((formData.fromAmount ?? 0) <= slab.fromAmount && (formData.toAmount ?? 0) >= slab.toAmount)
      )
    );

    if (overlappingSlab) {
      toast.error('Commission slabs cannot overlap for the same salesperson and city');
      return;
    }

    const slabRecord = {
      ...formData,
      id: editingSlab?.id || Date.now().toString(),
    } as CommissionSlab;

    if (editingSlab) {
      setCommissionSlabs(commissionSlabs.map(item =>
        item.id === editingSlab.id ? slabRecord : item
      ));
      toast.success('Commission slab updated successfully');
    } else {
      setCommissionSlabs([...commissionSlabs, slabRecord]);
      toast.success('Commission slab added successfully');
    }

    setIsModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSalespersonName = (salespersonId: string) => {
    const employee = employees.find(emp => emp.id === salespersonId);
    return employee ? employee.name : salespersonId;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/commission')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Commission Slabs</h2>
              <p className="text-gray-600 mt-1">Manage commission criteria and percentage rates</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Commission Slab
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Slabs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{commissionSlabs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Salespersons</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {new Set(commissionSlabs.map(s => s.salesperson)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Cities</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(commissionSlabs.map(s => s.city)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Avg Rate</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {commissionSlabs.length > 0 
                ? (commissionSlabs.reduce((sum, s) => sum + s.commissionPercentage, 0) / commissionSlabs.length).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by salesperson or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">From Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">To Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSlabs.map((slab) => (
                  <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getSalespersonName(slab.salesperson)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <MapPin size={12} className="mr-1" />
                        {slab.city}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(slab.fromAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(slab.toAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <Percent size={12} className="mr-1" />
                        {slab.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(slab)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(slab.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSlabs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No commission slabs found</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first commission slab to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">
                  {editingSlab ? 'Edit Commission Slab' : 'Add Commission Slab'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson *</label>
                    <select
                      value={formData.salesperson || ''}
                      onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Salesperson</option>
                      {employees.filter(emp => emp.status === 'active').map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City / Territory *</label>
                    <select
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.fromAmount || ''}
                      onChange={(e) => setFormData({ ...formData, fromAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.toAmount || ''}
                      onChange={(e) => setFormData({ ...formData, toAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.0"
                    />
                    <Percent size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={18} />
                  {editingSlab ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
