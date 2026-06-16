// Invoice Module - Service Layer
// Pure business logic (no Firestore — that lives in invoiceFirebaseService.ts)
// Changes:
//   - Added 'Federal' province with Islamabad
//   - Deduction charges are now manually entered (auto-calc removed from useEffect)

import {
  Invoice, InvoiceProduct, InvoiceFilters, InvoiceStats,
  ValidationResult, ProductInfo, CustomerSuggestion, ProvinceCities,
} from './types';

export const provinceCities: ProvinceCities = {
  'Federal': ['Islamabad'],
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Jacobabad', 'Shikarpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Swabi'],
  'Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Sibi'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Ghanche', 'Diamir'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber'],
};

export const salespersonLocations = ['Saudia', 'Chad'];

// Supported invoice currencies
export type InvoiceCurrency = 'PKR' | 'CAD' | 'SAR' | 'AED';
export const INVOICE_CURRENCIES: { code: InvoiceCurrency; label: string; symbol: string }[] = [
  { code: 'PKR', label: 'Pakistani Rupee', symbol: '₨' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'SAR', label: 'Saudi Riyal',     symbol: 'SAR' },
  { code: 'AED', label: 'UAE Dirham',      symbol: 'AED' },
];

// NOTE: These are the *default* seed values only.
// The live lists are stored in Firestore and fetched at runtime;
// custom entries added via "Add New" are appended there, not here.
export const deliveryStatuses: string[] = [
  'Self-collected', 'Delivered',
];

export const collectionMethods: string[] = [
  'Self-collected', 'Delivered',
];

// Kept for reference but NOT used automatically — deduction charges are entered manually
export const calculateDeductionCharges = (totalAmount: number, collectionMethod?: string): number => {
  if (!collectionMethod || collectionMethod === 'Self Collection') return 0;
  if (totalAmount <= 150000) return 500;
  if (totalAmount <= 250000) return 10000;
  if (totalAmount <= 600000) return 15000;
  if (totalAmount <= 1000000) return 20000;
  return 25000;
};

export const CURRENCY_RATE_FALLBACK: Record<InvoiceCurrency, number> = {
  PKR: 279.5,
  CAD: 1.38,
  AED: 3.67,
  SAR: 3.75,
};

export async function fetchCurrencyRates(): Promise<Record<InvoiceCurrency, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data?.result === 'success') {
      return {
        PKR: data.rates.PKR,
        CAD: data.rates.CAD,
        SAR: data.rates.SAR,
        AED: data.rates.AED,
      };
    }
    console.warn('[InvoiceService] Currency API returned non-success result, falling back');
  } catch (err) {
    console.warn('[InvoiceService] Currency fetch failed:', err);
  }
  return CURRENCY_RATE_FALLBACK;
}

export function convertCurrency(
  amount: number,
  from: InvoiceCurrency,
  to: InvoiceCurrency,
  rates: Record<InvoiceCurrency, number>,
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? CURRENCY_RATE_FALLBACK[from];
  const toRate = rates[to] ?? CURRENCY_RATE_FALLBACK[to];
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

export const calculateTotal = (products: InvoiceProduct[]): number =>
  products.reduce((sum, p) => sum + p.total, 0);

export const validateInvoice = (invoice: Partial<Invoice>, products: InvoiceProduct[]): ValidationResult => {
  if (!invoice.customerName?.trim()) return { isValid: false, error: 'Customer name is required' };
  if (!invoice.customerPhone?.trim()) return { isValid: false, error: 'Customer phone is required' };
  if (products.length === 0) return { isValid: false, error: 'At least one product is required' };
  for (const p of products) {
    if (!p.productId) return { isValid: false, error: 'Please select a product for all items' };
    const validSerials = (p.serialNumbers || []).filter(s => s.trim() !== '');
    if (validSerials.length !== p.quantity)
      return { isValid: false, error: `Please select ${p.quantity} serial number(s) for ${p.productName}` };
  }
  return { isValid: true, error: null };
};

export const createEmptyInvoiceProduct = (): InvoiceProduct => ({
  id: Date.now().toString(),
  productId: '', productName: '', brandName: '', modelName: '',
  category: '', description: '', quantity: 1, price: 0, total: 0, serialNumbers: [],
  currency: 'AED',
});

export const updateProductWithSelection = (product: InvoiceProduct, productId: string, products: ProductInfo[]): InvoiceProduct => {
  const p = products.find(x => x.id === productId);
  if (!p) return product;
  return {
    ...product,
    productId: p.id,
    productName: `${p.brandName} ${p.modelName}`,
    brandName: p.brandName,
    modelName: p.modelName,
    category: p.category,
    description: p.description,
    price: p.sellPrice,
    total: product.quantity * p.sellPrice,
    serialNumbers: [],
    currency: 'PKR', // TODO: set based on branch or product
    imageUrls: p.imageUrls || [],
  };
};

export const updateProductQuantity = (product: InvoiceProduct, quantity: number): InvoiceProduct => {
  const curr = product.serialNumbers || [];
  const serials = quantity > curr.length
    ? [...curr, ...Array(quantity - curr.length).fill('')]
    : curr.slice(0, quantity);
  return { ...product, quantity, serialNumbers: serials, total: quantity * product.price };
};

export const updateProductPrice = (product: InvoiceProduct, price: number): InvoiceProduct => ({
  ...product, price, total: product.quantity * price,
});

export const updateSerialNumber = (product: InvoiceProduct, index: number, value: string): InvoiceProduct => {
  const serials = [...(product.serialNumbers || [])];
  serials[index] = value;
  return { ...product, serialNumbers: serials };
};

export const getAvailableSerials = (productId: string, products: ProductInfo[], usedSerials: string[]): string[] => {
  const p = products.find(x => x.id === productId);
  if (!p) return [];
  return (p.serialNumbers || []).filter(s => {
    if (usedSerials.includes(s)) return false;
    const status = p.serialStatus?.[s] || 'Available';
    return status === 'Available' || status === 'Returned';
  });
};

export const getUniqueCustomers = (invoices: Invoice[]): CustomerSuggestion[] => {
  const map = new Map<string, { suggestion: CustomerSuggestion; date: string }>();
  invoices.forEach(inv => {
    const existing = map.get(inv.customerPhone);
    if (!existing || new Date(inv.date) > new Date(existing.date)) {
      map.set(inv.customerPhone, {
        suggestion: {
          customerName: inv.customerName, customerPhone: inv.customerPhone,
          customerPhone2: inv.customerPhone2, customerCNIC: inv.customerCNIC,
          customerProvince: inv.customerProvince, customerCity: inv.customerCity,
          customerAddress: inv.customerAddress, warrantyLocation: inv.warrantyLocation,
          exchangeWarrantyNote: inv.exchangeWarrantyNote,
        },
        date: inv.date,
      });
    }
  });
  return Array.from(map.values()).map(x => x.suggestion);
};

export const filterInvoices = (invoices: Invoice[], filters: InvoiceFilters): Invoice[] =>
  invoices.filter(inv => {
    if (filters.searchTerm) {
      const s = filters.searchTerm.toLowerCase();
      if (!inv.invoiceNumber.toLowerCase().includes(s) &&
          !inv.customerName.toLowerCase().includes(s) &&
          !inv.customerPhone.includes(s)) return false;
    }
    if (filters.statusFilter !== 'all' && inv.status !== filters.statusFilter) return false;
    if (filters.dateFrom && inv.date < filters.dateFrom) return false;
    if (filters.dateTo   && inv.date > filters.dateTo)   return false;
    if (filters.cityFilter && inv.customerCity !== filters.cityFilter) return false;
    if (filters.salespersonFilter && inv.salesperson !== filters.salespersonFilter) return false;
    return true;
  });

export const calculateInvoiceStats = (invoices: Invoice[]): InvoiceStats => ({
  totalCount:            invoices.length,
  paidCount:             invoices.filter(i => i.status === 'Paid').length,
  unpaidCount:           invoices.filter(i => i.status === 'Unpaid').length,
  totalAmount:           invoices.reduce((s, i) => s + i.totalAmount, 0),
  totalDeductionCharges: invoices.reduce((s, i) => s + (i.deductionCharges || 0), 0),
  netAmount:             invoices.reduce((s, i) => s + i.totalAmount - (i.deductionCharges || 0), 0),
});

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (dateString: string): string =>
  dateString ? new Date(dateString).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const exportInvoicesToCSV = (invoices: Invoice[]): string => {
  const headers = ['Date', 'Invoice #', 'Customer Name', 'City', 'Total Amount', 'Deduction Charges', 'Net Amount', 'Status', 'Salesperson', 'Delivery Status'];
  const rows = invoices.map(inv => [
    inv.date, inv.invoiceNumber, inv.customerName, inv.customerCity,
    inv.totalAmount.toString(), (inv.deductionCharges || 0).toString(),
    (inv.totalAmount - (inv.deductionCharges || 0)).toString(),
    inv.status, inv.salesperson || 'N/A', inv.deliveryStatus,
  ]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
};