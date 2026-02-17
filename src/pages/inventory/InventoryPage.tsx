import { useNavigate } from 'react-router-dom';
import { Plus, Package, CreditCard, Calculator, Hash, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';

export function InventoryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Inventory Entry
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Smart inventory intake flow with conditional costing and payment tracking
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-16">
          <h3 className="text-3xl font-bold text-slate-950 mt-8 mb-12">What type of inventory entry?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Add New Inventory Card */}
            <button
              onClick={() => navigate('/inventory/create-new')}
              className="p-6 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors text-left"
            >

              <div className="flex items-center mb-3">
                <Plus className="w-8 h-8 text-blue-600 mr-3" />
                <h4 className="text-lg font-medium">Add New Inventory</h4>
              </div>
              <p className="text-gray-600">Create a new product entry with optional costing information</p>
            </button>

            {/* Add to Existing Inventory Card */}
            <button
              onClick={() => navigate('/inventory/add-existing')}
              className="p-6 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-500 transition-colors text-left"
            >

              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-green-600 mr-3" />
                <h4 className="text-lg font-medium">Add to Existing Inventory</h4>
              </div>
              <p className="text-gray-600">Add more units to an existing product in inventory</p>
            </button>

            {/* Receivable Stock Card */}
            <button
              onClick={() => navigate('/inventory/receivable')}
              className="p-6 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-orange-600 hover:text-white hover:border-orange-500 transition-colors text-left"
            >

              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-orange-600 mr-3" />
                <h4 className="text-lg font-medium">Receivable Stock</h4>
              </div>
              <p className="text-gray-600">View shipments on the way but not yet received</p>
            </button>

            {/* View Inventory Card */}
            <button
              onClick={() => navigate('/inventory/view')}
              className="p-6 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-colors text-left"
            >

              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-purple-600 mr-3" />
                <h4 className="text-lg font-medium">View Inventory</h4>
              </div>
              <p className="text-gray-600">View existing inventory items</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
