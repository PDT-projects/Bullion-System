// Invoice Module - Service Layer
// Business logic and data operations for invoices

import {
  Invoice,
  InvoiceProduct,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceFilters,
  InvoiceStats,
  ValidationResult,
  ProductInfo,
  CustomerSuggestion,
  ProvinceCities
} from './types';

// Province-City mapping
export const provinceCities: ProvinceCities = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Jacobabad', 'Shikarpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Swabi'],
  'Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Sibi'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Ghanche', 'Diamir'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber']
};

// Salesperson locations
export const salespersonLocations = ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan'];

// Delivery statuses
export const deliveryStatuses: ('Self-collect' | 'LCS' | 'Daewoo' | 'Self-delivered')[] = [
  'Self-collect', 'LCS', 'Daewoo', 'Self-delivered'
];

// Collection methods
export const collectionMethods: ('Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others')[] = [
  'Self Collection', 'TCS', 'LCS', 'Daewoo', 'Others'
];

/**
 * Generate a unique invoice number
 */
export const generateInvoiceNumber = (): string => {
  return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
};

/**
 * Calculate deduction charges based on total amount and collection method
 */
export const calculateDeductionCharges = (totalAmount: number, collectionMethod?: string): number => {
  if (!collectionMethod || collectionMethod === 'Self Collection') {
    return 0;
  }
  if (totalAmount <= 150000) return 500;
  else if (totalAmount <= 250000) return 10000;
  else if (totalAmount <= 600000) return 15000;
  else if (totalAmount <= 1000000) return 20000;
  else return 25000;
};

/**
 * Calculate total from selected products
 */
export const calculateTotal = (products: InvoiceProduct[]): number => {
  return products.reduce((sum, p) => sum + p.total, 0);
};

/**
 * Validate invoice data
 */
export const validateInvoice = (invoice: Partial<Invoice>, products: InvoiceProduct[]): ValidationResult => {
  if (!invoice.customerName?.trim()) {
    return { isValid: false, error: 'Customer name is required' };
  }
  if (!invoice.customerPhone?.trim()) {
    return { isValid: false, error: 'Customer phone is required' };
  }
  if (!invoice.customerCNIC?.trim()) {
    return { isValid: false, error: 'Customer CNIC is required' };
  }
  if (products.length === 0) {
    return { isValid: false, error: 'At least one product is required' };
  }
  
  for (const product of products) {
    if (!product.productId) {
      return { isValid: false, error: 'Please select a product for all items' };
    }
    if (!product.serialNumbers || product.serialNumbers.length !== product.quantity) {
      return { isValid: false, error: `Please select ${product.quantity} serial number(s) for ${product.productName}` };
    }
    const validSerials = product.serialNumbers.filter(s => s.trim() !== '');
    if (validSerials.length !== product.quantity) {
      return { isValid: false, error: `Please select all serial numbers for ${product.productName}` };
    }
  }
  
  return { isValid: true, error: null };
};

/**
 * Create a new invoice product line item
 */
export const createEmptyInvoiceProduct = (): InvoiceProduct => ({
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
});

/**
 * Update product with selected product info
 */
export const updateProductWithSelection = (
  product: InvoiceProduct,
  productId: string,
  products: ProductInfo[]
): InvoiceProduct => {
  const selectedProduct = products.find(p => p.id === productId);
  if (!selectedProduct) return product;
  
  return {
    ...product,
    productId: selectedProduct.id,
    productName: `${selectedProduct.brandName} ${selectedProduct.modelName}`,
    brandName: selectedProduct.brandName,
    modelName: selectedProduct.modelName,
    category: selectedProduct.category,
    description: selectedProduct.description,
    price: selectedProduct.sellPrice,
    total: product.quantity * selectedProduct.sellPrice,
    serialNumbers: []
  };
};

/**
 * Update product quantity and adjust serial numbers
 */
export const updateProductQuantity = (
  product: InvoiceProduct,
  quantity: number
): InvoiceProduct => {
  const currentSerials = product.serialNumbers || [];
  let newSerials: string[];
  
  if (quantity > currentSerials.length) {
    newSerials = [...currentSerials, ...Array(quantity - currentSerials.length).fill('')];
  } else {
    newSerials = currentSerials.slice(0, quantity);
  }
  
  return {
    ...product,
    quantity,
    serialNumbers: newSerials,
    total: quantity * product.price
  };
};

/**
 * Update product price
 */
export const updateProductPrice = (product: InvoiceProduct, price: number): InvoiceProduct => ({
  ...product,
  price,
  total: product.quantity * price
});

/**
 * Update serial number at specific index
 */
export const updateSerialNumber = (
  product: InvoiceProduct,
  index: number,
  value: string
): InvoiceProduct => {
  const serials = [...(product.serialNumbers || [])];
  serials[index] = value;
  return {
    ...product,
    serialNumbers: serials
  };
};

/**
 * Get available serial numbers for a product
 */
export const getAvailableSerials = (
  productId: string,
  products: ProductInfo[],
  usedSerials: string[]
): string[] => {
  const product = products.find(p => p.id === productId);
  if (!product) return [];
  
  return (product.serialNumbers || []).filter(serial => {
    if (usedSerials.includes(serial)) return false;
    const status = product.serialStatus?.[serial] || 'Available';
    return status === 'Available' || status === 'Returned';
  });
};

/**
 * Get unique customers from existing invoices
 */
export const getUniqueCustomers = (invoices: Invoice[]): CustomerSuggestion[] => {
  const uniqueMap = new Map<string, { suggestion: CustomerSuggestion; date: string }>();
  
  invoices.forEach(inv => {
    const key = inv.customerPhone;
    const existing = uniqueMap.get(key);
    if (!existing || new Date(inv.date) > new Date(existing.date)) {
      uniqueMap.set(key, {
        suggestion: {
          customerName: inv.customerName,
          customerPhone: inv.customerPhone,
          customerPhone2: inv.customerPhone2,
          customerCNIC: inv.customerCNIC,
          customerProvince: inv.customerProvince,
          customerCity: inv.customerCity,
          customerAddress: inv.customerAddress,
          warrantyLocation: inv.warrantyLocation,
          exchangeWarrantyNote: inv.exchangeWarrantyNote
        },
        date: inv.date
      });
    }
  });
  
  return Array.from(uniqueMap.values()).map(item => item.suggestion);
};


/**
 * Filter invoices based on criteria
 */
export const filterInvoices = (invoices: Invoice[], filters: InvoiceFilters): Invoice[] => {
  return invoices.filter(invoice => {
    // Search term filter
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(search) ||
        invoice.customerName.toLowerCase().includes(search) ||
        invoice.customerPhone.includes(search);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.statusFilter !== 'all' && invoice.status !== filters.statusFilter) {
      return false;
    }
    
    // Date range filter
    if (filters.dateFrom && invoice.date < filters.dateFrom) return false;
    if (filters.dateTo && invoice.date > filters.dateTo) return false;
    
    // City filter
    if (filters.cityFilter && invoice.customerCity !== filters.cityFilter) return false;
    
    // Salesperson filter
    if (filters.salespersonFilter && invoice.salesperson !== filters.salespersonFilter) return false;
    
    return true;
  });
};

/**
 * Calculate invoice statistics
 */
export const calculateInvoiceStats = (invoices: Invoice[]): InvoiceStats => {
  const totalCount = invoices.length;
  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const unpaidCount = invoices.filter(inv => inv.status === 'Unpaid').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalDeductionCharges = invoices.reduce((sum, inv) => sum + (inv.deductionCharges || 0), 0);
  
  return {
    totalCount,
    paidCount,
    unpaidCount,
    totalAmount,
    totalDeductionCharges,
    netAmount: totalAmount - totalDeductionCharges
  };
};

/**
 * Create new invoice object
 */
export const createInvoice = (dto: CreateInvoiceDTO, products: InvoiceProduct[]): Invoice => {
  const totalAmount = calculateTotal(products);
  return {
    ...dto,
    id: Date.now().toString(),
    deliveryReceivedStatus: 'Pending',
    totalAmount
  };
};


/**
 * Update existing invoice
 */
export const updateInvoice = (existing: Invoice, dto: UpdateInvoiceDTO, products: InvoiceProduct[]): Invoice => {
  const totalAmount = calculateTotal(products);
  return {
    ...dto,
    id: existing.id,
    deliveryReceivedStatus: existing.deliveryReceivedStatus,
    totalAmount
  };
};


/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Export invoices to CSV
 */
export const exportInvoicesToCSV = (invoices: Invoice[]): string => {
  const headers = ['Date', 'Invoice #', 'Customer Name', 'City', 'Total Amount', 'Deduction Charges', 'Net Amount', 'Status', 'Salesperson', 'Delivery Status'];
  const rows = invoices.map(inv => [
    inv.date,
    inv.invoiceNumber,
    inv.customerName,
    inv.customerCity,
    inv.totalAmount.toString(),
    (inv.deductionCharges || 0).toString(),
    (inv.totalAmount - (inv.deductionCharges || 0)).toString(),
    inv.status,
    inv.salesperson || 'N/A',
    inv.deliveryStatus
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
