import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Trash2, Edit2, HardDrive, Plus, X, Check
} from 'lucide-react';
import type { Asset } from '../models/types';
import { AssetsServiceClass as AssetsService } from '../models/assetsService';

interface FormData {
  assetName: string;
  price: string;
  purchaseDate: string;
  employee: {
    name: string;
    contact: string;
  };
}

export function AssetsManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    assetName: '',
    price: '',
    purchaseDate: '',
    employee: { name: '', contact: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoadingAssets(true);
      const loadedAssets = await AssetsService.fetchAllAssets();
      setAssets(loadedAssets);
    } catch (error) {
      console.error('Load assets error:', error);
      toast.error('Failed to load assets');
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(formData.price);
    if (!formData.assetName.trim() || !formData.purchaseDate || priceNum <= 0 ||
      !formData.employee.name.trim() || !formData.employee.contact.trim()) {
      toast.error('Please fill all fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      await AssetsService.createAsset({
        assetName: formData.assetName.trim(),
        price: priceNum,
        purchaseDate: formData.purchaseDate,
        employee: {
          name: formData.employee.name.trim(),
          contact: formData.employee.contact.trim()
        },
        updatedAt: new Date(),
      });
      setFormData({ assetName: '', price: '', purchaseDate: '', employee: { name: '', contact: '' } });
      loadAssets();
    } catch (error: any) {
      console.error('Create asset error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset({ ...asset });
    setExpandedId(asset.id);
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    const priceNum = Number(editingAsset.price);
    if (priceNum <= 0) { toast.error('Price must be greater than 0'); return; }
    try {
      await AssetsService.updateAsset(editingAsset.id, {
        assetName: editingAsset.assetName.trim(),
        price: priceNum,
        purchaseDate: editingAsset.purchaseDate,
        employee: editingAsset.employee
      });
      setEditingAsset(null);
      loadAssets();
    } catch (error: any) {
      console.error('Update asset error:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await AssetsService.deleteAsset(id);
      loadAssets();
    } catch (error: any) {
      console.error('Delete asset error:', error);
    }
    setDeleteConfirmId(null);
  };

  if (isLoadingAssets) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <HardDrive size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Assets Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">Track office equipment assigned to employees</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Add New Asset Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-indigo-600 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus size={16} />
              Add New Asset
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">Record new office equipment assigned to employees</p>
          </div>
          <div className="p-5">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Asset Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Dell XPS Laptop, iPhone 15..."
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="150000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Employee Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                    value={formData.employee.name}
                    onChange={(e) => setFormData({ ...formData, employee: { ...formData.employee, name: e.target.value } })}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Employee Contact</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+92 300 1234567"
                    value={formData.employee.contact}
                    onChange={(e) => setFormData({ ...formData, employee: { ...formData.employee, contact: e.target.value } })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#4f46e5', color: 'white' }}
className="inline-flex items-center gap-2 px-8 py-2 border-2 border-white hover:bg-[#3730a3] hover:border-white disabled:bg-gray-400 text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 whitespace-nowrap !important"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Asset
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <HardDrive size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              All Assets <span className="text-indigo-600">({assets.length})</span>
            </h2>
          </div>

          <div className="p-5">
            {assets.length === 0 ? (
              <div className="text-center py-14">
                <HardDrive size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">No Assets Yet</h3>
                <p className="text-xs text-gray-400">Add your first asset using the form above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="group border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <HardDrive size={16} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">{asset.assetName}</h3>
                          <span className="text-xs text-indigo-600 font-medium">{AssetsService.formatPrice(asset.price)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(asset.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100">
                        {asset.employee.name}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100">
                        {asset.employee.contact}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Purchased: {new Date(asset.purchaseDate).toLocaleDateString('en-PK')}
                    </div>

                    {/* Edit inline form */}
                    {expandedId === asset.id && editingAsset?.id === asset.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <input
                          type="text"
                          value={editingAsset.assetName}
                          onChange={(e) => setEditingAsset({ ...editingAsset, assetName: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          placeholder="Asset name"
                        />
                        <input
                          type="number"
                          value={editingAsset.price}
                          onChange={(e) => setEditingAsset({ ...editingAsset, price: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          placeholder="Price"
                        />
                        <input
                          type="date"
                          value={editingAsset.purchaseDate}
                          onChange={(e) => setEditingAsset({ ...editingAsset, purchaseDate: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={editingAsset.employee.name}
                          onChange={(e) => setEditingAsset({ ...editingAsset, employee: { ...editingAsset.employee, name: e.target.value } })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          placeholder="Employee name"
                        />
                        <input
                          type="tel"
                          value={editingAsset.employee.contact}
                          onChange={(e) => setEditingAsset({ ...editingAsset, employee: { ...editingAsset.employee, contact: e.target.value } })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          placeholder="Contact"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Check size={12} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingAsset(null); setExpandedId(null); }}
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete confirmation */}
                    {deleteConfirmId === asset.id && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-medium mb-2">Delete "{asset.assetName}"?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(asset.id, asset.assetName)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Total assets: <span className="font-semibold text-indigo-600">{assets.length}</span>
        </p>
      </div>
    </div>
  );
}