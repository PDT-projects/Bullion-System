import { useState } from 'react';
import { Plus, Edit, Trash2, X, Maximize2, Minimize2, Percent, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import type { CommissionSlab } from '../../modules/commission/models/types';

interface CommissionSlabsProps {
  employees: any[];
  setActiveModule: (module: string) => void;
}


const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

import { useState, useEffect, useCallback } from 'react';
import { CommissionFirebaseService } from '../../modules/commission/models/Commissionfirebaseservice';

export function CommissionSlabs({ employees, setActiveModule }: CommissionSlabsProps) {
  const [commissionSlabs, setCommissionSlabs] = useState<CommissionSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<CommissionSlab | null>(null);

  const [formData, setFormData] = useState<Partial<CommissionSlab>>({
    salesperson: '',
    city: '',
    fromAmount: 0,
    toAmount: 0,
    commissionPercentage: 0,
  });

  // Load slabs on mount
  useEffect(() => {
    const loadSlabs = async () => {
      try {
        setIsLoading(true);
        const slabs = await CommissionFirebaseService.fetchAllSlabs();
        setCommissionSlabs(slabs);
      } catch (error) {
        toast.error('Failed to load commission slabs');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSlabs();
  }, []);

  const refetchSlabs = useCallback(async () => {
    try {
      const slabs = await CommissionFirebaseService.fetchAllSlabs();
      setCommissionSlabs(slabs);
    } catch (error) {
      toast.error('Failed to refresh slabs');
    }
  }, []);


  const handleAdd = () => {
    setEditingSlab(null);
    setFormData({
      salesperson: '',
      city: '',
      fromAmount: 0,
      toAmount: 0,
      commissionPercentage: 0,
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (slab: CommissionSlab) => {
    setEditingSlab(slab);
    setFormData(slab);
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission slab?')) return;
    try {
      await CommissionFirebaseService.deleteSlab(id);
      await refetchSlabs();
      toast.success('Commission slab deleted successfully');
    } catch (error) {
      toast.error('Failed to delete slab');
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!formData.salesperson || !formData.city || formData.fromAmount === undefined || !formData.toAmount || formData.commissionPercentage === undefined) {
      toast.error('Please fill in all required fields');
      return;
    }

    const fd = formData as CommissionSlab;

    if (fd.fromAmount >= fd.toAmount) {
      toast.error('From Amount must be less than To Amount');
      return;
    }

    if (fd.commissionPercentage < 0 || fd.commissionPercentage > 100) {
      toast.error('Commission Percentage must be between 0 and 100');
      return;
    }

    try {
      if (editingSlab) {
        await CommissionFirebaseService.updateSlab(editingSlab.id, {
          salesperson: fd.salesperson,
          city: fd.city,
          fromAmount: fd.fromAmount,
          toAmount: fd.toAmount,
          commissionPercentage: fd.commissionPercentage,
        });
        toast.success('Commission slab updated successfully');
      } else {
        await CommissionFirebaseService.createSlab({
          salesperson: fd.salesperson,
          city: fd.city,
          fromAmount: fd.fromAmount,
          toAmount: fd.toAmount,
          commissionPercentage: fd.commissionPercentage,
        });
        toast.success('Commission slab created successfully');
      }
      setIsModalOpen(false);
      await refetchSlabs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save slab');
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSalespersonName = (salespersonId: string) => {
    const employee = employees.find(emp => emp.id === salespersonId);
    return employee ? employee.name : salespersonId;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveModule('salary')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
            title="Back to Salary"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h2 className="text-2xl font-bold">Commission Criteria (Slabs)</h2>
            <p className="text-sm text-gray-600 mt-1">Manage commission slabs for salespersons</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Add Commission Slab
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Salesperson</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">City / Territory</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">From Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">To Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Commission (%)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissionSlabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getSalespersonName(slab.salesperson)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slab.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(slab.fromAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(slab.toAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Percent size={14} />
                      {slab.commissionPercentage}
                    </div>
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

{isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Loading commission slabs...
                    </div>
                  </td>
                </tr>
              ) : commissionSlabs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <div className="text-yellow-800">
                      <h3 className="text-lg font-semibold mb-2">⚠️ No Commission Slabs Found</h3>
                      <p className="mb-4">Commission calculation is <strong>disabled</strong> until you create slabs.</p>
                      <p className="text-sm mb-4">Slabs define rates (e.g. 10k-50k sales = 5%) per salesperson+city.</p>
                      <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                      >
                        <Plus size={16} />
                        Create First Slab
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingSlab ? 'Edit Commission Slab' : 'Add Commission Slab'}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6`}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson *</label>
                  <select
                    value={formData.salesperson || ''}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.fromAmount || ''}
                    onChange={(e) => setFormData({ ...formData, fromAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0.0"
                    />
                    <Percent size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                {editingSlab ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
