import { useState } from 'react';
import { Plus, Package, CreditCard, Calculator, Hash, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type InventoryType = 'new' | 'existing';
type CostingOption = 'with' | 'without';
type PaymentStatus = 'paid' | 'unpaid' | 'partial';
type InventoryStatus = 'New' | 'Used' | 'Returned' | 'Damaged';

type InventoryEntryForm = {
  // Inventory Type Selection
  inventoryType: InventoryType;

  // Costing Option
  costingOption: CostingOption;

  // Costing Fields (shown only if costingOption === 'with')
  brandName: string;
  modelName: string;
  category: string;
  units: number;
  unitCostUSD: number;
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalUnitCost: number;
  totalShipmentValuePKR: number;

  // Inventory Fields
  sellPrice: number;
  buyType: 'Import' | 'Export';
  warrantyYears: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  description: string;
  status: InventoryStatus;
  isDamaged: boolean;

  // Payment Status
  paymentStatus: PaymentStatus;
  transactionId: string;
  paidAmount: number;
  totalAmount: number;
  remainingAmount: number;
};

type InventoryEntryProps = {
  products: any[];
  productCosting: any[];
  setProducts: (products: any[]) => void;
  setProductCosting: (productCosting: any[]) => void;
};

const categories = [
  'Detection Equipment',
  'Security Equipment',
  'Imaging Equipment',
  'Surveillance Systems',
  'Access Control',
  'Other'
];

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function InventoryEntry({ products, productCosting, setProducts, setProductCosting }: InventoryEntryProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'costing' | 'form' | 'payment' | 'show' | 'receivable'>('type');
  const [formData, setFormData] = useState<InventoryEntryForm>({
    inventoryType: 'new',
    costingOption: 'with',
    brandName: '',
    modelName: '',
    category: '',
    units: 0,
    unitCostUSD: 0,
    totalCostUSD: 0,
    percentage: 0,
    customPerModel: 0,
    customPerUnit: 0,
    freightPerModel: 0,
    freightPerUnit: 0,
    unitCostPKR: 0,
    totalUnitCost: 0,
    totalShipmentValuePKR: 0,
    sellPrice: 0,
    buyType: 'Import',
    warrantyYears: 0,
    stock: 0,
    serialNumbers: [],
    serialCities: {},
    description: '',
    status: 'New',
    isDamaged: false,
    paymentStatus: 'paid',
    transactionId: '',
    paidAmount: 0,
    totalAmount: 0,
    remainingAmount: 0,
  });

  // Serial number management
  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [serialCities, setSerialCities] = useState<{[key: string]: string}>({});

  // Get unique brands from Product Costing
  const getUniqueBrands = () => {
    return Array.from(new Set(productCosting.map(p => p.brandName).filter(Boolean))).sort();
  };

  const getUniqueModels = (brand?: string) => {
    if (brand) {
      return Array.from(new Set(
        productCosting.filter(p => p.brandName === brand).map(p => p.modelName).filter(Boolean)
      )).sort();
    }
    return Array.from(new Set(productCosting.map(p => p.modelName).filter(Boolean))).sort();
  };

  // Get costing data for selected brand and model
  const getCostingData = (brand: string, model: string) => {
    return productCosting.find(p => p.brandName === brand && p.modelName === model);
  };

  // Handle inventory type selection
  const handleInventoryTypeSelect = (type: InventoryType) => {
    setFormData({
      ...formData,
      inventoryType: type,
      costingOption: type === 'existing' ? 'without' : 'with'
    });
    if (type === 'existing') {
      setCurrentStep('form');
    } else {
      setCurrentStep('costing');
    }
  };

  // Handle costing option selection
  const handleCostingOptionSelect = (option: CostingOption) => {
    setFormData({ ...formData, costingOption: option });
    setCurrentStep('form');
  };

  // Update serial inputs when stock quantity changes
  const handleStockChange = (newStock: number) => {
    setFormData({ ...formData, stock: newStock });

    // Adjust serial inputs array
    const currentSerials = [...serialInputs];
    if (newStock > currentSerials.length) {
      // Add empty strings for new units
      const toAdd = newStock - currentSerials.length;
      setSerialInputs([...currentSerials, ...Array(toAdd).fill('')]);
    } else if (newStock < currentSerials.length) {
      // Remove excess serials and clean up city mappings for removed serials
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

    // Keep serialCities mapping in sync with serial values
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

  // Handle payment status change
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    const updatedForm = { ...formData, paymentStatus: status };

    if (status === 'unpaid') {
      updatedForm.transactionId = '';
      updatedForm.paidAmount = 0;
      updatedForm.remainingAmount = formData.totalAmount;
    } else if (status === 'paid') {
      updatedForm.paidAmount = formData.totalAmount;
      updatedForm.remainingAmount = 0;
    } else if (status === 'partial') {
      updatedForm.paidAmount = 0;
      updatedForm.remainingAmount = formData.totalAmount;
    }

    setFormData(updatedForm);
  };

  // Handle paid amount change for partial payments
  const handlePaidAmountChange = (amount: number) => {
    const remaining = formData.totalAmount - amount;
    setFormData({
      ...formData,
      paidAmount: amount,
      remainingAmount: remaining > 0 ? remaining : 0
    });
  };

  // Calculate total amount based on costing
  const calculateTotalAmount = () => {
    if (formData.costingOption === 'with') {
      return formData.totalShipmentValuePKR || 0;
    }
    return formData.sellPrice * formData.stock;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle edit product
  const handleEditProduct = (product: any) => {
    // Populate form with product data
    setFormData({
      inventoryType: 'existing',
      costingOption: 'without', // Assume editing without costing for simplicity
      brandName: product.brandName,
      modelName: product.modelName,
      category: product.category,
      units: 0,
      unitCostUSD: 0,
      totalCostUSD: 0,
      percentage: 0,
      customPerModel: 0,
      customPerUnit: 0,
      freightPerModel: 0,
      freightPerUnit: 0,
      unitCostPKR: product.costPrice,
      totalUnitCost: 0,
      totalShipmentValuePKR: 0,
      sellPrice: product.sellPrice,
      buyType: product.buyType,
      warrantyYears: product.warrantyYears,
      stock: product.stock,
      serialNumbers: product.serialNumbers || [],
      serialCities: product.serialCities || {},
      description: product.description,
      status: product.status,
      isDamaged: product.status === 'Damaged',
      paymentStatus: 'paid',
      transactionId: '',
      paidAmount: 0,
      totalAmount: 0,
      remainingAmount: 0,
    });

    // Set serial inputs
    setSerialInputs(product.serialNumbers || []);

    // Navigate to form step
    setCurrentStep('form');

    toast.info('Editing product. Make your changes and submit.');
  };

  // Handle delete product
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully!');
    }
  };

  // Validation
  const validateForm = () => {
    if (formData.costingOption === 'with') {
      if (!formData.brandName || !formData.modelName || !formData.category) {
        toast.error('Please fill in Brand Name, Model Name, and Category for costing');
        return false;
      }
    }

    if (!formData.description) {
      toast.error('Please provide a product description');
      return false;
    }

    // Validate serial numbers
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    if (validSerials.length !== (formData.stock || 0)) {
      toast.error(`Please provide ${formData.stock} unique serial numbers`);
      return false;
    }

    // Check for duplicate serial numbers
    const uniqueSerials = new Set(validSerials);
    if (uniqueSerials.size !== validSerials.length) {
      toast.error('Serial numbers must be unique');
      return false;
    }

    // Check if serial numbers already exist in other products
    const existingSerials = products
      .flatMap(p => p.serialNumbers || []);
    const duplicates = validSerials.filter(s => existingSerials.includes(s));
    if (duplicates.length > 0) {
      toast.error(`Serial numbers already exist: ${duplicates.join(', ')}`);
      return false;
    }

    // Payment validation (always required now)
    if ((formData.paymentStatus === 'paid' || formData.paymentStatus === 'partial') && !formData.transactionId) {
      toast.error('Transaction ID is required for Paid and Partial payments');
      return false;
    }

    if (formData.paymentStatus === 'partial' && formData.paidAmount <= 0) {
      toast.error('Paid amount must be greater than 0 for partial payments');
      return false;
    }

    return true;
  };

  // Submit handler
  const handleSubmit = () => {
    if (!validateForm()) return;

    const totalAmount = calculateTotalAmount();
    const validSerials = serialInputs.filter(s => s.trim() !== '');

    // Build payload
    const payload = {
      inventoryType: formData.inventoryType,
      costingOption: formData.costingOption,
      costingData: formData.costingOption === 'with' ? {
        brandName: formData.brandName,
        modelName: formData.modelName,
        category: formData.category,
        units: formData.units,
        unitCostUSD: formData.unitCostUSD,
        totalCostUSD: formData.totalCostUSD,
        percentage: formData.percentage,
        customPerModel: formData.customPerModel,
        customPerUnit: formData.customPerUnit,
        freightPerModel: formData.freightPerModel,
        freightPerUnit: formData.freightPerUnit,
        unitCostPKR: formData.unitCostPKR,
        totalUnitCost: formData.totalUnitCost,
        totalShipmentValuePKR: formData.totalShipmentValuePKR,
      } : null,
      inventoryData: {
        brandName: formData.brandName,
        modelName: formData.modelName,
        category: formData.category,
        costPrice: formData.costingOption === 'with' ? formData.unitCostPKR : 0,
        sellPrice: formData.sellPrice,
        buyType: formData.buyType,
        warrantyYears: formData.warrantyYears,
        stock: formData.stock,
        serialNumbers: validSerials,
        serialCities: serialCities,
        description: formData.description,
        status: formData.isDamaged ? 'Damaged' : formData.status,
        createdDate: new Date().toISOString().split('T')[0],
      },
      paymentData: {
        paymentStatus: formData.paymentStatus,
        transactionId: formData.transactionId,
        totalAmount: totalAmount,
        paidAmount: formData.paidAmount,
        remainingAmount: formData.remainingAmount,
      },
    };

    console.log('Final Payload:', payload);

    // Save costing data if applicable
    if (formData.costingOption === 'with') {
      const costingRecord = {
        id: Date.now().toString(),
        brandName: formData.brandName,
        modelName: formData.modelName,
        category: formData.category,
        units: formData.units,
        unitCostUSD: formData.unitCostUSD,
        totalCostUSD: formData.totalCostUSD,
        percentage: formData.percentage,
        customPerModel: formData.customPerModel,
        customPerUnit: formData.customPerUnit,
        freightPerModel: formData.freightPerModel,
        freightPerUnit: formData.freightPerUnit,
        unitCostPKR: formData.unitCostPKR,
        totalUnitCost: formData.totalUnitCost,
        totalShipmentValuePKR: formData.totalShipmentValuePKR,
      };
      setProductCosting([...productCosting, costingRecord]);
    }

    // Save inventory data
    const nextSerialStatus: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' } = {};
    validSerials.forEach((serial) => {
      nextSerialStatus[serial] = formData.isDamaged ? 'Damaged' : 'Available';
    });

    const productData = {
      id: Date.now().toString(),
      brandName: formData.brandName,
      modelName: formData.modelName,
      category: formData.category,
      costPrice: formData.costingOption === 'with' ? formData.unitCostPKR : 0,
      sellPrice: formData.sellPrice,
      buyType: formData.buyType,
      warrantyYears: formData.warrantyYears,
      stock: formData.stock,
      serialNumbers: validSerials,
      serialCities: serialCities,
      serialStatus: nextSerialStatus,
      description: formData.description,
      status: formData.isDamaged ? 'Damaged' : formData.status,
      createdDate: new Date().toISOString().split('T')[0],
    };

    setProducts([...products, productData]);

    toast.success('Inventory entry created successfully!');

    // Reset form
    setCurrentStep('type');
    setFormData({
      inventoryType: 'new',
      costingOption: 'with',
      brandName: '',
      modelName: '',
      category: '',
      units: 0,
      unitCostUSD: 0,
      totalCostUSD: 0,
      percentage: 0,
      customPerModel: 0,
      customPerUnit: 0,
      freightPerModel: 0,
      freightPerUnit: 0,
      unitCostPKR: 0,
      totalUnitCost: 0,
      totalShipmentValuePKR: 0,
      sellPrice: 0,
      buyType: 'Import',
      warrantyYears: 0,
      stock: 0,
      serialNumbers: [],
      serialCities: {},
      description: '',
      status: 'New',
      isDamaged: false,
      paymentStatus: 'paid',
      transactionId: '',
      paidAmount: 0,
      totalAmount: 0,
      remainingAmount: 0,
    });
    setSerialInputs([]);
    setSerialCities({});
  };

  const brands = getUniqueBrands();
  const models = getUniqueModels(formData.brandName);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inventory Entry</h2>
          <p className="text-sm text-gray-600 mt-1">Smart inventory intake flow with conditional costing and payment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentStep('show')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Package size={20} />
            View Inventory
          </button>
        </div>
      </div>



      {/* Progress Indicator - Always Visible */}
      <div className="mb-16 bg-white rounded-2xl shadow-xl border-4 border-blue-200 p-10">
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          {/* Step 1 - Always Visible */}
          <div className={`flex flex-col items-center ${currentStep === 'type' ? 'text-blue-700' : 'text-green-700'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-2xl border-4 border-white ${currentStep === 'type' ? 'bg-white text-blue-600 border-blue-600 ring-4 ring-blue-300' : 'bg-green-600 text-white'}`}>
              {currentStep !== 'type' ? <CheckCircle size={32} /> : '1'}
            </div>
            <span className={`text-lg font-bold text-center ${currentStep === 'type' ? 'text-blue-700' : 'text-green-700'}`}>Inventory Type</span>
          </div>
          <div className={`flex-1 h-3 mx-8 rounded-full ${currentStep !== 'type' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

          {/* Step 2 - Always Visible */}
          <div className={`flex flex-col items-center ${currentStep === 'costing' ? 'text-blue-700' : currentStep === 'form' || currentStep === 'payment' ? 'text-green-700' : 'text-black'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-2xl border-4 border-white ${currentStep === 'costing' ? 'bg-blue-600 text-white ring-4 ring-blue-300' : currentStep === 'form' || currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black'}`}>
              {currentStep === 'form' || currentStep === 'payment' ? <CheckCircle size={32} /> : '2'}
            </div>
            <span className={`text-lg font-bold text-center ${currentStep === 'costing' ? 'text-blue-700' : currentStep === 'form' || currentStep === 'payment' ? 'text-green-700' : 'text-black'}`}>Costing Option</span>
          </div>
          <div className={`flex-1 h-3 mx-8 rounded-full ${currentStep === 'form' || currentStep === 'payment' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

          {/* Step 3 - Always Visible */}
          <div className={`flex flex-col items-center ${currentStep === 'form' ? 'text-blue-700' : currentStep === 'payment' ? 'text-green-700' : 'text-black'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-2xl border-4 border-white ${currentStep === 'form' ? 'bg-blue-600 text-white ring-4 ring-blue-300' : currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black'}`}>
              {currentStep === 'payment' ? <CheckCircle size={32} /> : '3'}
            </div>
            <span className={`text-lg font-bold text-center ${currentStep === 'form' ? 'text-blue-700' : currentStep === 'payment' ? 'text-green-700' : 'text-black'}`}>Product Details</span>
          </div>
          <div className={`flex-1 h-3 mx-8 rounded-full ${currentStep === 'payment' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

          {/* Step 4 - Always Visible */}
          <div className={`flex flex-col items-center ${currentStep === 'payment' ? 'text-blue-700' : 'text-black'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-2xl border-4 border-white ${currentStep === 'payment' ? 'bg-blue-600 text-white ring-4 ring-blue-300' : 'bg-gray-200 text-black'}`}>
              4
            </div>
            <span className={`text-lg font-bold text-center ${currentStep === 'payment' ? 'text-blue-700' : 'text-black'}`}>Payment</span>
          </div>
        </div>
      </div>

      {/* Step 1: Inventory Type Selection */}
      {currentStep === 'type' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-slate-950 mt-8 mb-5">What type of inventory entry?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => handleInventoryTypeSelect('new')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Plus className="w-8 h-8 text-blue-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">Add New Inventory</h4>
              </div>
              <p className="text-gray-600">Create a new product entry with optional costing information</p>
            </button>

            <button
              onClick={() => handleInventoryTypeSelect('existing')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-green-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">Add to Existing Inventory</h4>
              </div>
              <p className="text-gray-600">Add more units to an existing product in inventory</p>
            </button>

            <button
              onClick={() => setCurrentStep('receivable')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-orange-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">Receivable Stock</h4>
              </div>
              <p className="text-gray-600">View shipments on the way but not yet received</p>
            </button>

            <button
              onClick={() => setCurrentStep('show')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-purple-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">View Inventory</h4>
              </div>
              <p className="text-gray-600">View existing inventory items</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Costing Option (only for new inventory) */}
      {currentStep === 'costing' && formData.inventoryType === 'new' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Do you want to include costing information?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleCostingOptionSelect('with')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Calculator className="w-8 h-8 text-purple-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">With Costing</h4>
              </div>
              <p className="text-gray-600">Include detailed cost breakdown, expenses, and payment tracking</p>
            </button>

            <button
              onClick={() => handleCostingOptionSelect('without')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-orange-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">Without Costing</h4>
              </div>
              <p className="text-gray-600">Simple inventory entry without cost details</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Form Fields */}
      {currentStep === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Product Information</h3>
            <button
              onClick={() => setCurrentStep(formData.inventoryType === 'new' ? 'costing' : 'type')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">💡 Fill in the product details below, then click "Next: Payment" to proceed to payment information.</p>
          </div>

          {/* Navigation Buttons at Top */}
          <div className="flex items-center justify-between mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <button
              onClick={() => setCurrentStep(formData.inventoryType === 'new' ? 'costing' : 'type')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentStep('payment')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg"
              >
                Next: Payment →
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Costing Fields (only if with costing) */}
            {formData.costingOption === 'with' && (
              <div className="border-b pb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                  Costing Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value, modelName: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                    <input
                      type="text"
                      value={formData.modelName}
                      onChange={(e) => {
                        const value = e.target.value;
                        const costingData = getCostingData(formData.brandName, value);
                        setFormData({
                          ...formData,
                          modelName: value,
                          category: costingData?.category || '',
                          unitCostPKR: costingData?.unitCostPKR || 0,
                          totalShipmentValuePKR: costingData?.totalShipmentValuePKR || 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter model name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="Auto-filled from costing data"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.units || ''}
                      onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCostUSD || ''}
                      onChange={(e) => setFormData({ ...formData, unitCostUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalCostUSD || ''}
                      onChange={(e) => setFormData({ ...formData, totalCostUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.percentage || ''}
                      onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Model</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.customPerModel || ''}
                      onChange={(e) => setFormData({ ...formData, customPerModel: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.customPerUnit || ''}
                      onChange={(e) => setFormData({ ...formData, customPerUnit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Model</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.freightPerModel || ''}
                      onChange={(e) => setFormData({ ...formData, freightPerModel: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.freightPerUnit || ''}
                      onChange={(e) => setFormData({ ...formData, freightPerUnit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCostPKR || ''}
                      onChange={(e) => setFormData({ ...formData, unitCostPKR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Unit Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalUnitCost || ''}
                      onChange={(e) => setFormData({ ...formData, totalUnitCost: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Shipment Value (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalShipmentValuePKR || ''}
                      onChange={(e) => setFormData({ ...formData, totalShipmentValuePKR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Fields */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Inventory Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {formData.costingOption === 'without' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        value={formData.brandName}
                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter brand name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                      <input
                        type="text"
                        value={formData.modelName}
                        onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter model name"
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
                  </>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Years *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyYears || ''}
                    onChange={(e) => setFormData({ ...formData, warrantyYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Returned">Returned</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDamaged}
                      onChange={(e) => setFormData({ ...formData, isDamaged: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Is this item damaged?</span>
                  </label>
                </div>
              </div>

              {/* Serial Numbers Section */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-4"># Serial Numbers & Locations</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={formData.stock || ''}
                    onChange={(e) => handleStockChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Serial number fields will be generated based on quantity</p>
                </div>

                {/* Serial Numbers Section */}
                {(formData.stock || 0) > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash size={18} className="text-blue-600" />
                      <label className="text-sm font-medium text-gray-700">Serial Numbers * ({formData.stock} units)</label>
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
                            placeholder={`e.g., ${formData.brandName?.substring(0, 3).toUpperCase() || 'PRD'}-${String(index + 1).padStart(3, '0')}`}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter product description..."
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(formData.inventoryType === 'new' ? 'costing' : 'type')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Skip Payment & Create Entry
                </button>
                <button
                  onClick={() => setCurrentStep('payment')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Payment →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Show Inventory */}
      {currentStep === 'show' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Inventory Overview</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentStep('type')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Inventory
              </button>
              <button
                onClick={() => setCurrentStep('type')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h4>
                <p className="text-gray-600 mb-4">Start by adding your first inventory item.</p>
                <button
                  onClick={() => setCurrentStep('type')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.brandName} {product.modelName}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.status === 'New' ? 'bg-green-100 text-green-800' :
                        product.status === 'Used' ? 'bg-yellow-100 text-yellow-800' :
                        product.status === 'Damaged' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className="font-medium">{product.stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sell Price:</span>
                        <span className="font-medium">{formatCurrency(product.sellPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buy Type:</span>
                        <span className="font-medium">{product.buyType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Inventory Button */}
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep('type')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Payment Section */}
      {currentStep === 'payment' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Payment Information</h3>
            <button
              onClick={() => setCurrentStep('form')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-6">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status *</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handlePaymentStatusChange('paid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.paymentStatus === 'paid'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Paid</div>
                    <div className="text-xs text-gray-600">Full payment received</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentStatusChange('unpaid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.paymentStatus === 'unpaid'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Unpaid</div>
                    <div className="text-xs text-gray-600">No payment yet</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentStatusChange('partial')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.paymentStatus === 'partial'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Partial</div>
                    <div className="text-xs text-gray-600">Partial payment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Transaction ID (for Paid and Partial) */}
            {(formData.paymentStatus === 'paid' || formData.paymentStatus === 'partial') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}

            {/* Paid Amount (for Partial) */}
            {formData.paymentStatus === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paidAmount || ''}
                  onChange={(e) => handlePaidAmountChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(calculateTotalAmount())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(formData.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Remaining Amount:</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(formData.remainingAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg shadow-xl border-2 border-red-500"
              >
                Create Inventory Entry
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
