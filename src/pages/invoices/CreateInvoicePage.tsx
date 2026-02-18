import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Invoice, Product, InvoiceProduct, Employee, initialData, normalizeInitialData } from '../../App';
import { Plus, Trash2, X, Hash, Truck, User, CreditCard, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

const deliveryStatuses: ('Self-collect' | 'LCS' | 'Daewoo' | 'Self-delivered')[] = ['Self-collect', 'LCS', 'Daewoo', 'Self-delivered'];
const collectionMethods: ('Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others')[] = ['Self Collection', 'TCS', 'LCS', 'Daewoo', 'Others'];

const provinceCities: { [key: string]: string[] } = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Jacobabad', 'Shikarpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Swabi'],
  'Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Sibi'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Ghanche', 'Diamir'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber']
};

const locations = ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan'];

const calculateDeductionCharges = (totalAmount: number, collectionMethod?: string): number => {
  if (!collectionMethod || collectionMethod === 'Self Collection') {
    return 0;
  }
  if (totalAmount <= 150000) return 500;
  else if (totalAmount <= 250000) return 10000;
  else if (totalAmount <= 600000) return 15000;
  else if (totalAmount <= 1000000) return 20000;
  else return 25000;
};

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(() => normalizeInitialData(initialData));
  
  const invoices = data.invoices;
  const products = data.products;
  const banks = data.banks;
  const employees = data.employees;
  
  const editingInvoice = id ? invoices.find(inv => inv.id === id) : null;
  
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: editingInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    date: editingInvoice?.date || new Date().toISOString().split('T')[0],
    customerName: editingInvoice?.customerName || '',
    customerPhone: editingInvoice?.customerPhone || '',
    customerPhone2: editingInvoice?.customerPhone2 || '',
    customerCNIC: editingInvoice?.customerCNIC || '',
    customerProvince: editingInvoice?.customerProvince || '',
    customerCity: editingInvoice?.customerCity || '',
    customerAddress: editingInvoice?.customerAddress || '',
    warrantyLocation: editingInvoice?.warrantyLocation || '',
    products: editingInvoice?.products || [],
    exchangeWarrantyNote: editingInvoice?.exchangeWarrantyNote || '',
    deliveryStatus: editingInvoice?.deliveryStatus || 'Self-collect',
    status: editingInvoice?.status || 'Unpaid',
    salesperson: editingInvoice?.salesperson || '',
    salespersonLocation: editingInvoice?.salespersonLocation || '',
    clientDealBy: editingInvoice?.clientDealBy || '',
    referralBy: editingInvoice?.referralBy || '',
    createdBy: editingInvoice?.createdBy || '',
    paymentMode: editingInvoice?.paymentMode || 'Cash',
    paymentStatus: editingInvoice?.paymentStatus || 'Full',
    paidAmount: editingInvoice?.paidAmount || 0,
    remainingAmount: editingInvoice?.remainingAmount || 0,
    collectionMethod: editingInvoice?.collectionMethod || 'Self Collection',
    deductionCharges: editingInvoice?.deductionCharges || 0,
    bankId: editingInvoice?.bankId || '',
    bankName: editingInvoice?.bankName || '',
    bankAccountNumber: editingInvoice?.bankAccountNumber || '',
    digitalStamp: editingInvoice?.digitalStamp || false
  });
  
  const [selectedProducts, setSelectedProducts] = useState<InvoiceProduct[]>(editingInvoice?.products || []);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getUniqueCustomers = () => {
    const uniqueMap = new Map<string, Invoice>();
    invoices.forEach(inv => {
      const key = inv.customerPhone;
      if (!uniqueMap.has(key) || new Date(inv.date) > new Date(uniqueMap.get(key)!.date)) {
        uniqueMap.set(key, inv);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const handleCustomerSelect = (customer: Invoice) => {
    setFormData({
      ...formData,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      customerPhone2: customer.customerPhone2 || '',
      customerCNIC: customer.customerCNIC,
      customerProvince: customer.customerProvince,
      customerCity: customer.customerCity,
      customerAddress: customer.customerAddress,
      warrantyLocation: customer.warrantyLocation || '',
      exchangeWarrantyNote: customer.exchangeWarrantyNote
    });
    setShowSuggestions(false);
  };

  const handleCustomerSearch = (value: string, field: 'customerName' | 'customerPhone') => {
    setFormData({ ...formData, [field]: value });
    
    if (value.length >= 2) {
      const filtered = getUniqueCustomers().filter(inv => {
        if (field === 'customerName') {
          return inv.customerName.toLowerCase().includes(value.toLowerCase());
        } else {
          return inv.customerPhone.includes(value);
        }
      });
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      brandName: '',
      modelName: '',
      category: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      serialNumbers: []
    }]);
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'productId') {
          const product = products.find(pr => pr.id === value);
          if (product) {
            updated.productName = `${product.brandName} ${product.modelName}`;
            updated.brandName = product.brandName;
            updated.modelName = product.modelName;
            updated.category = product.category;
            updated.description = product.description;
            updated.price = product.sellPrice;
            updated.total = updated.quantity * product.sellPrice;
            updated.serialNumbers = [];
            updated.serialCities = {};
          }
        } else if (field === 'quantity') {
          const currentSerials = updated.serialNumbers || [];
          if (value > currentSerials.length) {
            updated.serialNumbers = [...currentSerials, ...Array(value - currentSerials.length).fill('')];
          } else {
            updated.serialNumbers = currentSerials.slice(0, value);
          }
          updated.total = value * updated.price;
        } else if (field === 'price') {
          updated.total = updated.quantity * value;
        }
        return updated;
      }
      return p;
    }));
  };

  const updateSerialNumber = (productId: string, serialIndex: number, value: string) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === productId) {
        const updated = { ...p };
        const serials = [...(updated.serialNumbers || [])];
        serials[serialIndex] = value;
        updated.serialNumbers = serials;
        return updated;
      }
      return p;
    }));
  };

  const getAvailableSerials = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const usedSerials = invoices
      .filter(inv => inv.id !== editingInvoice?.id)
      .flatMap(inv => inv.products.flatMap(p => p.serialNumbers || []));

    return (product.serialNumbers || []).filter(serial => {
      if (usedSerials.includes(serial)) return false;
      const status = product.serialStatus?.[serial] || 'Available';
      return status === 'Available' || status === 'Returned';
    });
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.total, 0);
  };

  const handleSave = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.customerCNIC) {
      toast.error('Please fill in all required customer fields');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    for (const product of selectedProducts) {
      if (!product.serialNumbers || product.serialNumbers.length !== product.quantity) {
        toast.error(`Please select ${product.quantity} serial number(s) for ${product.productName}`);
        return;
      }
      const validSerials = product.serialNumbers.filter(s => s.trim() !== '');
      if (validSerials.length !== product.quantity) {
        toast.error(`Please select all serial numbers for ${product.productName}`);
        return;
      }
    }

    const ensureInvoiceSerialsInInventory = (currentProducts: Product[]) => {
      return currentProducts.map((invProduct) => {
        const line = selectedProducts.find(sp => sp.productId === invProduct.id);
        if (!line || !line.serialNumbers) return invProduct;

        const nextSerialNumbers = [...(invProduct.serialNumbers || [])];
        const nextSerialCities = { ...(invProduct.serialCities || {}) };
        const nextSerialStatus = { ...(invProduct.serialStatus || {}) };

        line.serialNumbers.forEach((serial) => {
          if (!serial) return;
          if (!nextSerialNumbers.includes(serial)) {
            nextSerialNumbers.push(serial);
          }
          if (formData.customerCity) {
            nextSerialCities[serial] = formData.customerCity;
          }
          if (!nextSerialStatus[serial]) {
            nextSerialStatus[serial] = 'Available';
          }
        });

        return {
          ...invProduct,
          serialNumbers: nextSerialNumbers,
          serialCities: nextSerialCities,
          serialStatus: nextSerialStatus,
          stock: nextSerialNumbers.length,
        };
      });
    };

    const newInvoice: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      invoiceNumber: formData.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      date: formData.date || new Date().toISOString().split('T')[0],
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerPhone2: formData.customerPhone2,
      customerCNIC: formData.customerCNIC,
      customerProvince: formData.customerProvince || '',
      customerCity: formData.customerCity || '',
      customerAddress: formData.customerAddress || '',
      warrantyLocation: formData.warrantyLocation || '',
      products: selectedProducts,
      exchangeWarrantyNote: formData.exchangeWarrantyNote || '',
      deliveryStatus: formData.deliveryStatus || 'Self-collect',
      deliveryReceivedStatus: 'Pending',
      totalAmount: calculateTotal(),

      status: formData.status || 'Unpaid',
      salesperson: formData.salesperson || '',
      salespersonLocation: formData.salespersonLocation || '',
      clientDealBy: formData.clientDealBy || '',
      referralBy: formData.referralBy || '',
      createdBy: formData.createdBy || '',
      paymentMode: formData.paymentMode || 'Cash',
      paymentStatus: formData.paymentStatus || 'Full',
      paidAmount: formData.paymentStatus === 'Partial' ? formData.paidAmount || 0 : calculateTotal(),
      remainingAmount: formData.paymentStatus === 'Partial' ? formData.remainingAmount || 0 : 0,
      collectionMethod: formData.collectionMethod || 'Self Collection',
      deductionCharges: calculateDeductionCharges(calculateTotal(), formData.collectionMethod),
      bankId: formData.bankId || '',
      bankName: formData.bankName || '',
      bankAccountNumber: formData.bankAccountNumber || '',
      digitalStamp: formData.digitalStamp || false
    };

    if (!editingInvoice) {
      const normalizedProducts = ensureInvoiceSerialsInInventory(products);
      const updatedProducts = normalizedProducts.map(product => {
        const soldProduct = selectedProducts.find(sp => sp.productId === product.id);
        if (soldProduct && soldProduct.serialNumbers) {
          const remainingSerials = product.serialNumbers.filter(
            serial => !soldProduct.serialNumbers.includes(serial)
          );
          const remainingCities = { ...(product.serialCities || {}) };
          const remainingStatus = { ...(product.serialStatus || {}) };
          soldProduct.serialNumbers.forEach((serial) => {
            delete remainingCities[serial];
            delete remainingStatus[serial];
          });
          return {
            ...product,
            serialNumbers: remainingSerials,
            serialCities: remainingCities,
            serialStatus: remainingStatus,
            stock: remainingSerials.length
          };
        }
        return product;
      });
      setData(prev => ({ ...prev, products: updatedProducts, invoices: [newInvoice, ...prev.invoices] }));
    } else {
      setData(prev => ({ 
        ...prev, 
        products: ensureInvoiceSerialsInInventory(prev.products),
        invoices: prev.invoices.map(inv => inv.id === editingInvoice.id ? newInvoice : inv)
      }));
    }

    toast.success(editingInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
    navigate('/invoices');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-xl font-bold">{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/invoices')} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Exit Full Screen"
          >
            <Minimize2 size={20} />
          </button>
          <button 
            onClick={() => navigate('/invoices')} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Customer Information */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => handleCustomerSearch(e.target.value, 'customerName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Enter customer name"
              />
              {showSuggestions && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-md w-full max-h-40 overflow-y-auto mt-1">
                  {customerSuggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleCustomerSelect(suggestion)}
                    >
                      {suggestion.customerName} ({suggestion.customerPhone})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
              <input
                type="text"
                value={formData.customerCNIC || ''}
                onChange={(e) => setFormData({ ...formData, customerCNIC: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="42101-1234567-1"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.customerPhone || ''}
                onChange={(e) => handleCustomerSearch(e.target.value, 'customerPhone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="+92 300 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Second Phone Number</label>
              <input
                type="tel"
                value={formData.customerPhone2 || ''}
                onChange={(e) => setFormData({ ...formData, customerPhone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="+92 321 7654321"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Province</label>
              <select
                value={formData.customerProvince || ''}
                onChange={(e) => setFormData({ ...formData, customerProvince: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
              >
                <option value="">Select province</option>
                {Object.keys(provinceCities).map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer City</label>
              <select
                value={formData.customerCity || ''}
                onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                disabled={!formData.customerProvince}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select city</option>
                {formData.customerProvince && provinceCities[formData.customerProvince]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input
                type="text"
                value={formData.customerAddress || ''}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Warehouse A, Section 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Location</label>
              <input
                type="text"
                value={formData.warrantyLocation || ''}
                onChange={(e) => setFormData({ ...formData, warrantyLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Warranty Center, Floor 2"
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Products</h4>
<button onClick={addProduct} className="flex items-center gap-1 text-sm bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors"><Plus size={16} />Add Product</button>


          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No products added yet</p>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map((product, index) => {
                const availableSerials = product.productId ? getAvailableSerials(product.productId) : [];
                return (
                  <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Product {index + 1}</span>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                        <select
                          value={product.productId}
                          onChange={(e) => updateProduct(product.id, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        >
                          <option value="">Select product</option>
                          {products.filter(p => getAvailableSerials(p.id).length > 0).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brandName} {p.modelName} ({getAvailableSerials(p.id).length} available)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProduct(product.id, 'quantity', Number(e.target.value))}
                          min="1"
                          max={availableSerials.length}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        />
                      </div>
                    </div>

                    {product.productId && product.quantity > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Hash size={14} className="text-[#4f46e5]" />
                          <label className="text-xs font-medium text-gray-700">Select Serial Numbers ({product.quantity} required)</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: product.quantity }).map((_, serialIndex) => (
                            <select
                              key={serialIndex}
                              value={product.serialNumbers?.[serialIndex] || ''}
                              onChange={(e) => updateSerialNumber(product.id, serialIndex, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            >
                              <option value="">Select serial #{serialIndex + 1}</option>
                              {availableSerials.map(serial => (
                                <option 
                                  key={serial} 
                                  value={serial}
                                  disabled={product.serialNumbers?.includes(serial) && product.serialNumbers[serialIndex] !== serial}
                                >
                                  {serial}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                        {availableSerials.length === 0 && (
                          <p className="text-xs text-red-600 mt-1">No available serial numbers for this product</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Total: {formatCurrency(product.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery & Additional Information */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Delivery & Additional Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status *</label>
              <select
                value={formData.deliveryStatus || 'Self-collect'}
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                {deliveryStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
              <select
                value={formData.status || 'Unpaid'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Paid' | 'Unpaid' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exchange & Warranty Note</label>
            <textarea
              value={formData.exchangeWarrantyNote || ''}
              onChange={(e) => setFormData({ ...formData, exchangeWarrantyNote: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
              placeholder="e.g., 2 years warranty, no exchange after 7 days"
            />
          </div>
        </div>

        {/* Sales Details Section */}
        <div className="border-b pb-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-[#4f46e5]" />
            <h4 className="font-semibold text-gray-900">Sales Details</h4>
            <span className="text-xs text-gray-500 ml-auto">(Internal - not shown on invoice slip)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
              <select
                value={formData.salesperson || ''}
                onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">Select salesperson</option>
                {employees.filter(emp => emp.status === 'active').map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson Location</label>
              <select
                value={formData.salespersonLocation || ''}
                onChange={(e) => setFormData({ ...formData, salespersonLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">Select location</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral To</label>
              <input
                type="text"
                value={formData.clientDealBy || ''}
                onChange={(e) => setFormData({ ...formData, clientDealBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Ahmed Khan, Company XYZ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral From</label>
              <input
                type="text"
                value={formData.referralBy || ''}
                onChange={(e) => setFormData({ ...formData, referralBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Existing customer, Partner company"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <input
                type="text"
                value={formData.createdBy || ''}
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Manager Ali, Admin User"
              />
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="border-b pb-4 bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-[#10b981]" />
            <h4 className="font-semibold text-gray-900">Payment & Collection Details</h4>
            <span className="text-xs text-gray-500 ml-auto">(Internal - not shown on invoice slip)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode || 'Cash'}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online (Bank)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus || 'Full'}
                onChange={(e) => {
                  const newStatus = e.target.value as 'Full' | 'Partial';
                  const total = calculateTotal();
                  setFormData({ 
                    ...formData, 
                    paymentStatus: newStatus,
                    paidAmount: newStatus === 'Full' ? total : formData.paidAmount || 0,
                    remainingAmount: newStatus === 'Full' ? 0 : total - (formData.paidAmount || 0)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Full">Full Payment</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>
            {formData.paymentStatus === 'Partial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      paidAmount: Number(e.target.value), 
                      remainingAmount: calculateTotal() - Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remaining Amount
                  </label>
                  <input
                    type="number"
                    value={formData.remainingAmount || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
