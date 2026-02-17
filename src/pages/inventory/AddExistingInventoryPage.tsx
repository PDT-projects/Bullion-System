import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - in real app this would come from API/context
const mockProducts = [
  { id: '1', brandName: 'Samsung', modelName: 'A15', category: 'Detection Equipment', stock: 50, sellPrice: 25000 },
  { id: '2', brandName: 'Dell', modelName: 'Inspiron 15', category: 'Security Equipment', stock: 20, sellPrice: 45000 },
  { id: '3', brandName: 'HP', modelName: 'Pavilion', category: 'Imaging Equipment', stock: 30, sellPrice: 35000 },
];

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function AddExistingInventoryPage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [serialCities, setSerialCities] = useState<{[key: string]: string}>({});

  const selectedProductData = mockProducts.find(p => p.id === selectedProduct);

  const handleQuantityChange = (qty: number) => {
    setQuantityToAdd(qty);
    const currentSerials = [...serialInputs];
    if (qty > currentSerials.length) {
      const toAdd = qty - currentSerials.length;
      setSerialInputs([...currentSerials, ...Array(toAdd).fill('')]);
    } else if (qty < currentSerials.length) {
      const removedSerials = currentSerials.slice(qty);
      const keptSerials = currentSerials.slice(0, qty);
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

  const handleSubmit = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    if (quantityToAdd <= 0) {
      alert('Please enter quantity to add');
      return;
    }
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    if (validSerials.length !== quantityToAdd) {
      alert(`Please provide ${quantityToAdd} unique serial numbers`);
      return;
    }

    // Create update payload
    const updateData = {
      productId: selectedProduct,
      quantityAdded: quantityToAdd,
      newSerialNumbers: validSerials,
      serialCities,
      updatedStock: (selectedProductData?.stock || 0) + quantityToAdd,
      updatedDate: new Date().toISOString().split('T')[0],
    };

    console.log('Stock Added:', updateData);
    toast.success(`Added ${quantityToAdd} units to ${selectedProductData?.brandName} ${selectedProductData?.modelName}`);
    navigate('/inventory/view');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Add to Existing Inventory
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Add more units to an existing product in your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Product *</label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setQuantityToAdd(0);
                  setSerialInputs([]);
                  setSerialCities({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a product</option>
                {mockProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.brandName} {product.modelName} - {product.category} (Current: {product.stock} units)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Info */}
            {selectedProductData && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Selected Product</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Brand:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedProductData.brandName}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Model:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedProductData.modelName}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Current Stock:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedProductData.stock} units</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity to Add */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
              <input
                type="number"
                min="1"
                value={quantityToAdd || ''}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter quantity"
              />
            </div>

            {/* Serial Numbers */}
            {quantityToAdd > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-green-600" />
                  Serial Numbers for New Units ({quantityToAdd} units)
                </h4>
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {serialInputs.map((serial, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="block text-xs font-medium text-gray-600 mb-1">New Unit {index + 1}</label>
                      <input
                        type="text"
                        value={serial}
                        onChange={(e) => updateSerialNumber(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-2"
                        placeholder={`e.g., ${selectedProductData?.brandName?.substring(0, 3).toUpperCase() || 'PRD'}-${String(index + 1).padStart(3, '0')}`}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">Location:</span>
                        <select
                          value={serialCities[serial] || ''}
                          onChange={(e) => updateSerialCity(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select city</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg shadow-lg flex items-center gap-2"
              >
                <Save size={20} />
                Add Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
