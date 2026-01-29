  import { useState } from 'react';
import { Invoice, Product, InvoiceProduct, Bank, Employee } from '../App';
import { Plus, Eye, Edit, Trash2, X, Printer, Download, FileText, Hash, Truck, User, Briefcase, CreditCard, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

type InvoicesProps = {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  banks: Bank[];
  employees: Employee[];
};

const deliveryStatuses: ('Self-collect' | 'LCS' | 'Daewoo' | 'Delivered')[] = ['Self-collect', 'LCS', 'Daewoo', 'Delivered'];

// UPDATED: Dynamic delivery tracking statuses
const deliveryReceivedStatuses: ('Pending' | 'In Process' | 'Received')[] = ['Pending', 'In Process', 'Received'];

// Collection methods for deduction charges
const collectionMethods: ('Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others')[] = ['Self Collection', 'TCS', 'LCS', 'Daewoo', 'Others'];

// Pakistan provinces and cities
const provinceCities: { [key: string]: string[] } = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Jacobabad', 'Shikarpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Swabi'],
  'Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Sibi'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Ghanche', 'Diamir'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber']
};

const locations = ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan'];

export function Invoices({ invoices, setInvoices, products, setProducts, banks, employees }: InvoicesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewSlip, setViewSlip] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<Partial<Invoice>>({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerPhone2: '',
    customerCNIC: '',
    customerProvince: '',
    customerCity: '',
    customerAddress: '',
    warrantyLocation: '',
    products: [],
    exchangeWarrantyNote: '',
    deliveryStatus: 'Self-collect',
    deliveryReceivedStatus: 'Pending', // NEW: Delivery tracking status
    status: 'Unpaid',
    salesperson: '',
    salespersonLocation: '',
    referFrom: '', // NEW: Required field replacing clientDealBy
    referTo: '', // NEW: Optional referral destination
    createdBy: '',
    paymentMode: 'Cash',
    paymentStatus: 'Full',
    paidAmount: 0,
    remainingAmount: 0,
    collectionMethod: 'Self Collection',
    deductionCharges: 0, // NEW: Now manually editable
    bankId: '',
    bankName: '',
    bankAccountNumber: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<InvoiceProduct[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get unique customers from invoices
  const getUniqueCustomers = () => {
    const uniqueMap = new Map<string, Invoice>();
    invoices.forEach(inv => {
      const key = inv.customerPhone; // Use phone as unique identifier
      if (!uniqueMap.has(key) || new Date(inv.date) > new Date(uniqueMap.get(key)!.date)) {
        uniqueMap.set(key, inv);
      }
    });
    return Array.from(uniqueMap.values());
  };

  // Auto-fill customer data when selecting from suggestions
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

  // Filter customers based on input
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

  const handleAdd = () => {
    setEditingInvoice(null);
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    setFormData({
      invoiceNumber: invoiceNum,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerPhone2: '',
      customerCNIC: '',
      customerProvince: '',
      customerCity: '',
      customerAddress: '',
      warrantyLocation: '',
      products: [],
      exchangeWarrantyNote: '',
      deliveryStatus: 'Self-collect',
      deliveryReceivedStatus: 'Pending', // NEW: Delivery tracking status
      status: 'Unpaid',
      salesperson: '',
      salespersonLocation: '',
      referFrom: '', // NEW: Required field replacing clientDealBy
      referTo: '', // NEW: Optional referral destination
      createdBy: '',
      paymentMode: 'Cash',
      paymentStatus: 'Full',
      paidAmount: 0,
      remainingAmount: 0,
      collectionMethod: 'Self Collection',
      deductionCharges: 0, // NEW: Manually editable deduction
      bankId: '',
      bankName: '',
      bankAccountNumber: ''
    });
    setSelectedProducts([]);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData(invoice);
    setSelectedProducts(invoice.products);
    setIsModalOpen(true);
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      id: Date.now().toString(),
      productId: '',
      productName: '',
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
            // Initialize empty serial numbers array
            updated.serialNumbers = [];
            // Store serial cities mapping
            updated.serialCities = {};
          }
        } else if (field === 'quantity') {
          // Adjust serial numbers array when quantity changes
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

  // Get available serial numbers for a product (not already sold)
  const getAvailableSerials = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Get all serial numbers already used in invoices (excluding current editing invoice)
    const usedSerials = invoices
      .filter(inv => inv.id !== editingInvoice?.id)
      .flatMap(inv => inv.products.flatMap(p => p.serialNumbers || []));

    // Return only available serials:
    // - Not already used in other invoices
    // - Serial status is Available or Returned (exclude In Transit / Damaged)
    return (product.serialNumbers || []).filter(serial => {
      if (usedSerials.includes(serial)) return false;
      const status = product.serialStatus?.[serial] || 'Available';
      return status === 'Available' || status === 'Returned';
    });
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.total, 0);
  };

  const calculateInvoiceTotal = () => {
    return calculateTotal() + (formData.deductionCharges || 0);
  };

  const handleSave = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.customerCNIC) {
      toast.error('Please fill in all required customer fields');
      return;
    }

    // NEW: Validate required "Refer From" field
    if (!formData.referFrom) {
      toast.error('Please fill in the "Refer From" field');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Validate serial numbers
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

    // NEW: Validate deduction charges don't exceed total amount
    const totalAmount = calculateTotal();
    if (formData.deductionCharges && formData.deductionCharges > totalAmount) {
      toast.error('Deduction charges cannot exceed the total invoice amount');
      return;
    }

    // Ensure serial numbers referenced in the invoice exist in inventory.
    // If missing, auto-add them with invoice customer city and default status.
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

    const invoiceTotal = calculateInvoiceTotal();
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
      deliveryReceivedStatus: formData.deliveryReceivedStatus || 'Pending', // NEW: Delivery tracking status
      totalAmount: invoiceTotal,
      status: formData.status || 'Unpaid',
      salesperson: formData.salesperson || '',
      salespersonLocation: formData.salespersonLocation || '',
      referFrom: formData.referFrom || '', // NEW: Required field replacing clientDealBy
      referTo: formData.referTo || '', // NEW: Optional referral destination
      createdBy: formData.createdBy || '',
      paymentMode: formData.paymentMode || 'Cash',
      paymentStatus: formData.paymentStatus || 'Full',
      paidAmount: formData.paymentStatus === 'Partial' ? formData.paidAmount || 0 : invoiceTotal,
      remainingAmount: formData.paymentStatus === 'Partial' ? formData.remainingAmount || 0 : 0,
      collectionMethod: formData.collectionMethod || 'Self Collection',
      deductionCharges: formData.deductionCharges || 0, // NEW: Manually editable deduction
      bankId: formData.bankId || '',
      bankName: formData.bankName || '',
      bankAccountNumber: formData.bankAccountNumber || ''
    };

    // Update product stock by removing sold serial numbers
    if (!editingInvoice) {
      const normalizedProducts = ensureInvoiceSerialsInInventory(products);
      const updatedProducts = normalizedProducts.map(product => {
        const soldProduct = selectedProducts.find(sp => sp.productId === product.id);
        if (soldProduct && soldProduct.serialNumbers) {
          // Remove sold serial numbers from product
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
      setProducts(updatedProducts);
    } else {
      // Even when editing an invoice, keep inventory consistent for referenced serials.
      setProducts(ensureInvoiceSerialsInInventory(products));
    }

    if (editingInvoice) {
      setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? newInvoice : inv));
      toast.success('Invoice updated successfully');
    } else {
      setInvoices([newInvoice, ...invoices]);
      toast.success('Invoice created successfully');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success('Invoice deleted successfully');
    }
  };

  const handlePrint = (invoice: Invoice) => {
    toast.success(`Printing invoice ${invoice.invoiceNumber}`);
    window.print();
  };

  const handleDownload = (invoice: Invoice) => {
    toast.success(`Downloading ${invoice.invoiceNumber}.pdf`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Self-collect':
        return 'bg-blue-100 text-blue-800';
      case 'LCS':
      case 'Daewoo':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage customer invoices with serial number tracking</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customerPhone}
                    {invoice.customerPhone2 && (
                      <div className="text-xs text-gray-500">{invoice.customerPhone2}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(invoice.deliveryStatus)}`}>
                      <Truck size={12} />
                      {invoice.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewInvoice(invoice)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setViewSlip(invoice)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h3>
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
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6 space-y-6`}>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={formData.customerName || ''}
                      onChange={(e) => handleCustomerSearch(e.target.value, 'customerName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="Enter customer name"
                    />
                    {showSuggestions && (
                      <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-md w-full max-h-40 overflow-y-auto">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.customerPhone || ''}
                      onChange={(e) => handleCustomerSearch(e.target.value, 'customerPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="+92 300 1234567"
                    />
                    {showSuggestions && (
                      <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-md w-full max-h-40 overflow-y-auto">
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
                        <option key={province} value={province}>
                          {province}
                        </option>
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
                        <option key={city} value={city}>
                          {city}
                        </option>
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
                  <button
                    onClick={addProduct}
                    className="flex items-center gap-1 text-sm bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
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

                          {/* Serial Numbers Selection */}
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

              {/* Sales Details Section (Not shown on invoice slip) */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Refer From *</label>
                    <input
                      type="text"
                      value={formData.referFrom || ''}
                      onChange={(e) => setFormData({ ...formData, referFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="e.g., Ahmed Khan, Company XYZ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Refer To</label>
                    <input
                      type="text"
                      value={formData.referTo || ''}
                      onChange={(e) => setFormData({ ...formData, referTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="e.g., Lahore Branch, Karachi Office"
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

              {/* Payment Details Section (Not shown on invoice slip) */}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                        <input
                          type="number"
                          value={formData.paidAmount || ''}
                          onChange={(e) => {
                            const paid = Number(e.target.value);
                            const total = calculateTotal();
                            if (paid > total) {
                              toast.error('Paid amount cannot exceed total amount');
                              return;
                            }
                            if (paid < 0) {
                              toast.error('Paid amount must be positive');
                              return;
                            }
                            const remaining = total - paid;
                            setFormData({ ...formData, paidAmount: paid, remainingAmount: remaining });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Enter paid amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                        <input
                          type="number"
                          value={formData.remainingAmount || 0}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </>
                  )}
                  {formData.paymentMode === 'Online' && (
                    <>
                      <div className={formData.paymentStatus === 'Partial' ? '' : 'col-span-2'}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                        <select
                          value={formData.bankId || ''}
                          onChange={(e) => {
                            const selectedBank = banks.find(b => b.id === e.target.value);
                            setFormData({ 
                              ...formData, 
                              bankId: e.target.value,
                              bankName: selectedBank?.name || '',
                              bankAccountNumber: selectedBank?.accountNumber || ''
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        >
                          <option value="">Select bank</option>
                          {banks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name} - {bank.accountNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.bankId && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={formData.bankName || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input
                              type="text"
                              value={formData.bankAccountNumber || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Collection Method Section (Not shown on invoice slip) */}
              <div className="border-b pb-4 bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={18} className="text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Collection Method & Deduction</h4>
                  <span className="text-xs text-gray-500 ml-auto">(For sales report only - not shown on invoice slip)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection Method</label>
                    <select
                      value={formData.collectionMethod || 'Self Collection'}
                      onChange={(e) => setFormData({
                        ...formData,
                        collectionMethod: e.target.value as any
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      {collectionMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deduction Charges (Manual Entry)</label>
                    <input
                      type="number"
                      value={formData.deductionCharges || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          setFormData({
                            ...formData,
                            deductionCharges: value
                          });
                        }
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>ℹ️ Note:</strong> Deduction charges can be manually entered. Leave as 0 if no deduction applies.
                    This will be shown in the Sales Report only, not on the invoice slip.
                  </p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-[#4f46e5]/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(calculateInvoiceTotal())}</span>
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
                {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Details Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice Details</h3>
              <button onClick={() => setViewInvoice(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium text-gray-900">{viewInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewInvoice.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNIC</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerCNIC}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone 1</p>
                  <p className="font-medium text-gray-900">{viewInvoice.customerPhone}</p>
                </div>
                {viewInvoice.customerPhone2 && (
                  <div>
                    <p className="text-sm text-gray-600">Phone 2</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerPhone2}</p>
                  </div>
                )}
                {viewInvoice.customerProvince && (
                  <div>
                    <p className="text-sm text-gray-600">Province</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerProvince}</p>
                  </div>
                )}
                {viewInvoice.customerCity && (
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerCity}</p>
                  </div>
                )}
                {viewInvoice.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{viewInvoice.customerAddress}</p>
                  </div>
                )}
                {viewInvoice.warrantyLocation && (
                  <div>
                    <p className="text-sm text-gray-600">Warranty Location</p>
                    <p className="font-medium text-gray-900">{viewInvoice.warrantyLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Delivery Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(viewInvoice.deliveryStatus)}`}>
                    <Truck size={12} />
                    {viewInvoice.deliveryStatus}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewInvoice.status)}`}>
                    {viewInvoice.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Products</h4>
                <div className="space-y-3">
                  {viewInvoice.products.map((product, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-lg">{product.productName}</span>
                        <span className="font-semibold text-lg">{formatCurrency(product.total)}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {product.brandName && (
                          <p><span className="font-medium text-gray-700">Brand:</span> {product.brandName}</p>
                        )}
                        {product.modelName && (
                          <p><span className="font-medium text-gray-700">Model:</span> {product.modelName}</p>
                        )}
                        {product.category && (
                          <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>
                        )}
                        {product.description && (
                          <p><span className="font-medium text-gray-700">Description:</span> {product.description}</p>
                        )}
                        <p><span className="font-medium text-gray-700">Quantity:</span> {product.quantity} × {formatCurrency(product.price)}</p>
                        {product.serialNumbers && product.serialNumbers.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-gray-700 mb-1">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.serialNumbers.map((serial, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                                  <Hash size={10} />
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewInvoice.exchangeWarrantyNote && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Exchange & Warranty Note</p>
                  <p className="font-medium text-gray-900">{viewInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

              {/* Sales Details (Internal) */}
              {(viewInvoice.salesperson || viewInvoice.salespersonLocation || viewInvoice.clientDealBy || viewInvoice.referralBy || viewInvoice.createdBy) && (
                <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-[#4f46e5]" />
                    <h4 className="font-semibold text-gray-900">Sales Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.salesperson && (
                      <div>
                        <p className="text-gray-600">Salesperson:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.salesperson}</p>
                      </div>
                    )}
                    {viewInvoice.salespersonLocation && (
                      <div>
                        <p className="text-gray-600">Salesperson Location:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.salespersonLocation}</p>
                      </div>
                    )}
                    {viewInvoice.clientDealBy && (
                      <div>
                        <p className="text-gray-600">Client Deal By:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.clientDealBy}</p>
                      </div>
                    )}
                    {viewInvoice.referralBy && (
                      <div>
                        <p className="text-gray-600">Referral By:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.referralBy}</p>
                      </div>
                    )}
                    {viewInvoice.createdBy && (
                      <div>
                        <p className="text-gray-600">Created By:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.createdBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details (Internal) */}
              {(viewInvoice.paymentMode || viewInvoice.paymentStatus || viewInvoice.bankName) && (
                <div className="border-t pt-4 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={16} className="text-[#10b981]" />
                    <h4 className="font-semibold text-gray-900">Payment Details (Internal)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.paymentMode && (
                      <div>
                        <p className="text-gray-600">Payment Mode:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.paymentMode}</p>
                      </div>
                    )}
                    {viewInvoice.paymentStatus && (
                      <div>
                        <p className="text-gray-600">Payment Status:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.paymentStatus}</p>
                      </div>
                    )}
                    {viewInvoice.paymentStatus === 'Partial' && (
                      <>
                        <div>
                          <p className="text-gray-600">Total Amount:</p>
                          <p className="font-medium text-gray-900">{formatCurrency(viewInvoice.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Paid Amount:</p>
                          <p className="font-medium text-green-600">{formatCurrency(viewInvoice.paidAmount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Remaining Amount:</p>
                          <p className="font-medium text-red-600">{formatCurrency(viewInvoice.remainingAmount || 0)}</p>
                        </div>
                      </>
                    )}
                    {viewInvoice.paymentMode === 'Online' && viewInvoice.bankName && (
                      <>
                        <div>
                          <p className="text-gray-600">Bank:</p>
                          <p className="font-medium text-gray-900">{viewInvoice.bankName}</p>
                        </div>
                        {viewInvoice.bankAccountNumber && (
                          <div>
                            <p className="text-gray-600">Account Number:</p>
                            <p className="font-medium text-gray-900">{viewInvoice.bankAccountNumber}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Collection Method & Deduction (Internal) */}
              {(viewInvoice.collectionMethod || viewInvoice.deductionCharges) && (
                <div className="border-t pt-4 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={16} className="text-orange-600" />
                    <h4 className="font-semibold text-gray-900">Collection & Deduction (For Reports Only)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewInvoice.collectionMethod && (
                      <div>
                        <p className="text-gray-600">Collection Method:</p>
                        <p className="font-medium text-gray-900">{viewInvoice.collectionMethod}</p>
                      </div>
                    )}
                    {viewInvoice.deductionCharges !== undefined && (
                      <div>
                        <p className="text-gray-600">Deduction Charges:</p>
                        <p className={`font-medium ${viewInvoice.deductionCharges > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {viewInvoice.deductionCharges > 0 ? formatCurrency(viewInvoice.deductionCharges) : 'No Deduction'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 bg-[#4f46e5]/10 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleDownload(viewSlip)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Download size={20} />
                </button>
                <button onClick={() => setViewSlip(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              {/* Company Header */}
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-sm text-gray-600 mt-1">Security & Detection Equipment Solutions</p>
                <p className="text-lg font-semibold mt-3">SALES INVOICE</p>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number:</p>
                  <p className="font-semibold text-gray-900">{viewSlip.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold text-gray-900">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border rounded-lg p-4 mb-6 bg-gray-50">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{viewSlip.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CNIC:</span>
                    <span className="ml-2 font-medium">{viewSlip.customerCNIC}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone 1:</span>
                    <span className="ml-2 font-medium">{viewSlip.customerPhone}</span>
                  </div>
                  {viewSlip.customerPhone2 && (
                    <div>
                      <span className="text-gray-600">Phone 2:</span>
                      <span className="ml-2 font-medium">{viewSlip.customerPhone2}</span>
                    </div>
                  )}
                  {viewSlip.customerProvince && (
                    <div>
                      <span className="text-gray-600">Province:</span>
                      <span className="ml-2 font-medium">{viewSlip.customerProvince}</span>
                    </div>
                  )}
                  {viewSlip.customerCity && (
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-medium">{viewSlip.customerCity}</span>
                    </div>
                  )}
                  {viewSlip.customerAddress && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{viewSlip.customerAddress}</span>
                    </div>
                  )}
                  {viewSlip.warrantyLocation && (
                    <div>
                      <span className="text-gray-600">Warranty Location:</span>
                      <span className="ml-2 font-medium">{viewSlip.warrantyLocation}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Delivery:</span>
                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getDeliveryStatusColor(viewSlip.deliveryStatus)}`}>
                      <Truck size={10} />
                      {viewSlip.deliveryStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Products</h3>
                <div className="space-y-4">
                  {viewSlip.products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">#{index + 1} {product.productName}</h4>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            {product.brandName && (
                              <p><span className="font-medium text-gray-700">Brand:</span> {product.brandName}</p>
                            )}
                            {product.modelName && (
                              <p><span className="font-medium text-gray-700">Model:</span> {product.modelName}</p>
                            )}
                            {product.description && (
                              <p><span className="font-medium text-gray-700">Description:</span> {product.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Quantity: <span className="font-medium">{product.quantity}</span></p>
                          <p className="text-sm text-gray-600">Unit Price: <span className="font-medium">{formatCurrency(product.price)}</span></p>
                          <p className="text-lg font-semibold text-[#4f46e5] mt-1">{formatCurrency(product.total)}</p>
                        </div>
                      </div>
                      {product.serialNumbers && product.serialNumbers.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Hash size={14} className="text-[#4f46e5]" />
                            Serial Numbers:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.serialNumbers.map((serial, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono font-medium">
                                <Hash size={12} />
                                {serial}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between items-center bg-[#4f46e5]/10 rounded-lg p-4">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewSlip.totalAmount)}</span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewSlip.status)}`}>
                      {viewSlip.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warranty Note */}
              {viewSlip.exchangeWarrantyNote && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Exchange & Warranty Terms:</p>
                  <p className="text-sm text-gray-600">{viewSlip.exchangeWarrantyNote}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}