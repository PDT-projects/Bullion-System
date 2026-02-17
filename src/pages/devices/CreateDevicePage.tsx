import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Hash, MapPin, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Product, initialData, normalizeInitialData } from '../../App';

const categories = [
  'Detection Equipment',
  'Security Equipment',
  'Imaging Equipment',
  'Surveillance Systems',
  'Access Control',
  'Other'
];

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function CreateDevicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/invoices/new';
  
  const [data, setData] = useState(() => normalizeInitialData(initialData));
  
  // Form state
  const [formData, setFormData] = useState({
    brandName: '',
    modelName: '',
    category: '',
    costPrice: 0,
    sellPrice: 0,
    buyType: 'Import' as 'Import' | 'Export',
    warrantyYears: 1,
    description: '',
    status: 'New' as 'New' | 'Used' | 'Returned',
  });

  // Serial number management
  const [stock, setStock] = useState(1);
  const [serialInputs, setSerialInputs] = useState<string[]>(['']);
  const [serialCities, setSerialCities] = useState<{[key: string]: string}>({});

  // Handle stock change and generate serial inputs
  const handleStockChange = (newStock: number) => {
    setStock(newStock);
    
    const currentSerials = [...serialInputs];
    if (newStock > currentSerials.length) {
      const toAdd = newStock - currentSerials.length;
      setSerialInputs([...currentSerials, ...Array(toAdd).fill('')]);
    } else if (newStock < currentSerials.length) {
      const removedSerials = currentSerials.slice(newStock);
      const keptSerials = currentSerials.slice(0, newStock);
      const updatedCities: { [key: string]: string } = {};
      Object.entries(serialCities).forEach(([serial, city]) => {
        if (!removedSerials.includes(serial)) {
          updatedCities[serial] = city;
        }
      });
      setSerialInputs(keptSerials);
      setSerialCities(updatedCities);
    }
  };

  const updateSerialNumber = (index: number, value: string) => {
    const updatedSerials = [...serialInputs];
    const oldSerial = updatedSerials[index];
    updatedSerials[index] = value;
    setSerialInputs(updatedSerials);

    if (oldSerial && serialCities[oldSerial]) {
      const updatedCities = { ...serialCities };
      const city = updatedCities[oldSerial];
      delete updatedCities[oldSerial];
      if (value) {
        updatedCities[value] = city;
      }
      setSerialCities(updatedCities);
    }
  };

  const updateSerialCity = (index: number, value: string) => {
    const serialKey = serialInputs[index];
    if (!serialKey) return;
    const updated = { ...serialCities };
    updated[serialKey] = value;
    setSerialCities(updated);
  };

  const handleSave = () => {
    // Validate form
    if (!formData.brandName || !formData.modelName || !formData.category) {
      toast.error('Please fill in Brand Name, Model Name, and Category');
      return;
    }
    if (!formData.description) {
      toast.error('Please provide a product description');
      return;
    }
    
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    const uniqueSerials = new Set(validSerials);
    
    if (uniqueSerials.size !== validSerials.length) {
      toast.error('Serial numbers must be unique');
      return;
    }

    if (validSerials.length !== stock) {
      toast.error(`Please provide ${stock} unique serial numbers`);
      return;
    }

    // Create new product
    const newProduct: Product = {
      id: Date.now().toString(),
      brandName: formData.brandName,
      modelName: formData.modelName,
      category: formData.category,
      costPrice: formData.costPrice,
      sellPrice: formData.sellPrice,
      buyType: formData.buyType,
      warrantyYears: formData.warrantyYears,
      stock: validSerials.length,
      serialNumbers: validSerials,
      serialCities: serialCities,
      serialStatus: {},
      description: formData.description,
      status: formData.status,
      createdDate: new Date().toISOString()
    };

    // Initialize serial status
    validSerials.forEach(serial => {
      newProduct.serialStatus![serial] = 'Available';
    });

    // Add to products
    const updatedProducts = [...data.products, newProduct];
    setData(prev => ({ ...prev, products: updatedProducts }));

    toast.success('Device created successfully!');
    
    // Navigate back to return URL
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(returnUrl)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Invoice</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create New Device
              </h2>
              <p className="text-gray-600">
                Add a new device/product to inventory
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Device Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Metal Detector"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                  <input
                    type="text"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Pro X1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buy Type *</label>
                  <select
                    value={formData.buyType}
                    onChange={(e) => setFormData({ ...formData, buyType: e.target.value as 'Import' | 'Export' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Import">Import</option>
                    <option value="Export">Export</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Years</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyYears || ''}
                    onChange={(e) => setFormData({ ...formData, warrantyYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Serial Numbers Section */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2 text-blue-600" />
                Serial Numbers & Locations
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  value={stock || ''}
                  onChange={(e) => handleStockChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Serial number fields will be generated based on quantity</p>
              </div>

              {(stock || 0) > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={18} className="text-blue-600" />
                    <label className="text-sm font-medium text-gray-700">Serial Numbers * ({stock} units)</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {serialInputs.map((serial, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit {index + 1}</label>
                        <input
                          type="text"
                          value={serial}
                          onChange={(e) => updateSerialNumber(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                          placeholder={`e.g., ${formData.brandName?.substring(0, 3).toUpperCase() || 'DEV'}-${String(index + 1).padStart(3, '0')}`}
                        />
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-500" />
                          <select
                            value={serialCities[serial] || ''}
                            onChange={(e) => updateSerialCity(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select city/location</option>
                            {cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">💡 Each serial number must be unique across all products</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter product description..."
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(returnUrl)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Save size={20} />
                Create Device
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
