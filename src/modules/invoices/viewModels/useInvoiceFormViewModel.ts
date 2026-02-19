// Invoice Module - Form ViewModel
// Manages invoice create/edit form state and operations

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Invoice,
  InvoiceProduct,
  CreateInvoiceDTO,
  ProductInfo
} from '../models/types';

// Employee interface for salesperson selection
interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'inactive';
}

import {
  generateInvoiceNumber,
  createEmptyInvoiceProduct,
  updateProductWithSelection,
  updateProductQuantity,
  updateProductPrice,
  updateSerialNumber,
  getAvailableSerials,
  getUniqueCustomers,
  validateInvoice,
  calculateTotal,
  calculateDeductionCharges,
  provinceCities,
  salespersonLocations,
  deliveryStatuses,
  collectionMethods,
  createInvoice,
  updateInvoice
} from '../models/invoiceService';

interface UseInvoiceFormViewModelProps {
  invoices: Invoice[];
  products: ProductInfo[];
  employees: Employee[];
  banks: { id: string; name: string; accountNumber: string }[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

interface UseInvoiceFormViewModelReturn {
  // Form state
  formData: Partial<Invoice>;
  selectedProducts: InvoiceProduct[];
  customerSuggestions: Invoice[];
  showSuggestions: boolean;
  isEditing: boolean;
  editingInvoice: Invoice | null;
  
  // Options
  provinceCities: Record<string, string[]>;
  salespersonLocations: string[];
  deliveryStatuses: string[];
  collectionMethods: string[];
  availableProducts: ProductInfo[];
  activeEmployees: Employee[];
  
  // Actions
  setFormData: (data: Partial<Invoice>) => void;
  handleCustomerSearch: (value: string, field: 'customerName' | 'customerPhone') => void;
  handleCustomerSelect: (customer: Invoice) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, field: string, value: any) => void;
  updateSerial: (productId: string, index: number, value: string) => void;
  getAvailableSerialsForProduct: (productId: string) => string[];
  handleSave: () => void;
  handleCancel: () => void;
  
  // Helpers
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
}

export const useInvoiceFormViewModel = ({
  invoices,
  products,
  employees,
  banks,
  setInvoices,
  setProducts
}: UseInvoiceFormViewModelProps): UseInvoiceFormViewModelReturn => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Check if editing
  const editingInvoice = useMemo(() => {
    return id ? invoices.find(inv => inv.id === id) || null : null;
  }, [id, invoices]);
  
  const isEditing = !!editingInvoice;
  
  // Form state
  const [formData, setFormDataState] = useState<Partial<Invoice>>(() => {
    if (editingInvoice) {
      return { ...editingInvoice };
    }
    return {
      invoiceNumber: generateInvoiceNumber(),
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
      status: 'Unpaid',
      salesperson: '',
      salespersonLocation: '',
      clientDealBy: '',
      referralBy: '',
      createdBy: '',
      paymentMode: 'Cash',
      paymentStatus: 'Full',
      paidAmount: 0,
      remainingAmount: 0,
      collectionMethod: 'Self Collection',
      deductionCharges: 0,
      bankId: '',
      bankName: '',
      bankAccountNumber: '',
      digitalStamp: false
    };
  });
  
  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState<InvoiceProduct[]>(
    editingInvoice?.products || []
  );
  
  // Customer suggestions state
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Update form data helper
  const setFormData = useCallback((data: Partial<Invoice>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);
  
  // Get unique customers for suggestions
  const uniqueCustomers = useMemo(() => {
    return getUniqueCustomers(invoices);
  }, [invoices]);
  
  // Handle customer search
  const handleCustomerSearch = useCallback((value: string, field: 'customerName' | 'customerPhone') => {
    setFormData({ [field]: value });
    
    if (value.length >= 2) {
      const filtered = invoices.filter(inv => {
        if (field === 'customerName') {
          return inv.customerName.toLowerCase().includes(value.toLowerCase());
        } else {
          return inv.customerPhone.includes(value);
        }
      });
      
      // Get unique customers
      const uniqueMap = new Map<string, Invoice>();
      filtered.forEach(inv => {
        if (!uniqueMap.has(inv.customerPhone)) {
          uniqueMap.set(inv.customerPhone, inv);
        }
      });
      
      setCustomerSuggestions(Array.from(uniqueMap.values()));
      setShowSuggestions(uniqueMap.size > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [invoices, setFormData]);
  
  // Handle customer selection from suggestions
  const handleCustomerSelect = useCallback((customer: Invoice) => {
    setFormData({
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      customerPhone2: customer.customerPhone2 || '',
      customerCNIC: customer.customerCNIC,
      customerProvince: customer.customerProvince,
      customerCity: customer.customerCity,
      customerAddress: customer.customerAddress || '',
      warrantyLocation: customer.warrantyLocation || '',
      exchangeWarrantyNote: customer.exchangeWarrantyNote
    });
    setShowSuggestions(false);
  }, [setFormData]);
  
  // Add new product line
  const addProduct = useCallback(() => {
    setSelectedProducts(prev => [...prev, createEmptyInvoiceProduct()]);
  }, []);
  
  // Remove product line
  const removeProduct = useCallback((id: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  }, []);
  
  // Update product
  const updateProduct = useCallback((id: string, field: string, value: any) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      
      switch (field) {
        case 'productId':
          return updateProductWithSelection(p, value, products);
        case 'quantity':
          return updateProductQuantity(p, value);
        case 'price':
          return updateProductPrice(p, value);
        default:
          return { ...p, [field]: value };
      }
    }));
  }, [products]);
  
  // Update serial number
  const updateSerial = useCallback((productId: string, index: number, value: string) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return updateSerialNumber(p, index, value);
    }));
  }, []);
  
  // Get available serials for a product
  const getAvailableSerialsForProduct = useCallback((productId: string): string[] => {
    const usedSerials = invoices
      .filter(inv => inv.id !== editingInvoice?.id)
      .flatMap(inv => inv.products.flatMap(p => p.serialNumbers || []));
    
    return getAvailableSerials(productId, products, usedSerials);
  }, [products, invoices, editingInvoice]);
  
  // Calculate total
  const total = useMemo(() => {
    return calculateTotal(selectedProducts);
  }, [selectedProducts]);
  
  // Update deduction charges when collection method changes
  useEffect(() => {
    const charges = calculateDeductionCharges(total, formData.collectionMethod);
    setFormData({ deductionCharges: charges });
  }, [total, formData.collectionMethod, setFormData]);
  
  // Handle save
  const handleSave = useCallback(() => {
    // Validate
    const validation = validateInvoice(formData, selectedProducts);
    if (!validation.isValid) {
      toast.error(validation.error || 'Please fill in all required fields');
      return;
    }
    
    // Prepare DTO
    const dto: CreateInvoiceDTO = {
      invoiceNumber: formData.invoiceNumber || generateInvoiceNumber(),
      date: formData.date || new Date().toISOString().split('T')[0],
      customerName: formData.customerName!,
      customerPhone: formData.customerPhone!,
      customerPhone2: formData.customerPhone2,
      customerCNIC: formData.customerCNIC!,
      customerProvince: formData.customerProvince || '',
      customerCity: formData.customerCity || '',
      customerAddress: formData.customerAddress,
      warrantyLocation: formData.warrantyLocation,
      products: selectedProducts,
      exchangeWarrantyNote: formData.exchangeWarrantyNote || '',
      deliveryStatus: formData.deliveryStatus || 'Self-collect',
      status: formData.status || 'Unpaid',
      salesperson: formData.salesperson,
      salespersonLocation: formData.salespersonLocation,
      clientDealBy: formData.clientDealBy,
      referralBy: formData.referralBy,
      createdBy: formData.createdBy,
      paymentMode: formData.paymentMode,
      paymentStatus: formData.paymentStatus,
      paidAmount: formData.paidAmount,
      remainingAmount: formData.remainingAmount,
      collectionMethod: formData.collectionMethod,
      deductionCharges: formData.deductionCharges || 0,
      bankId: formData.bankId,
      bankName: formData.bankName,
      bankAccountNumber: formData.bankAccountNumber,
      digitalStamp: formData.digitalStamp
    };
    
    if (isEditing && editingInvoice) {
      // Update existing
      const updated = updateInvoice(editingInvoice, dto as any, selectedProducts);
      setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv));
      toast.success('Invoice updated successfully');
    } else {
      // Create new
      const created = createInvoice(dto, selectedProducts);
      
      // Update product inventory
      const updatedProducts = products.map(product => {
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
      
      setProducts(updatedProducts);
      setInvoices([created, ...invoices]);
      toast.success('Invoice created successfully');
    }
    
    navigate('/invoices');
  }, [formData, selectedProducts, isEditing, editingInvoice, invoices, products, setInvoices, setProducts, navigate]);
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);
  
  // Filter available products (those with stock)
  const availableProducts = useMemo(() => {
    return products.filter(p => {
      const availableCount = getAvailableSerialsForProduct(p.id).length;
      return availableCount > 0;
    });
  }, [products, getAvailableSerialsForProduct]);
  
  // Filter active employees
  const activeEmployees = useMemo(() => {
    return employees.filter(emp => emp.status === 'active');
  }, [employees]);
  
  return {
    formData,
    selectedProducts,
    customerSuggestions,
    showSuggestions,
    isEditing,
    editingInvoice,
    provinceCities,
    salespersonLocations,
    deliveryStatuses,
    collectionMethods,
    availableProducts,
    activeEmployees,
    setFormData,
    handleCustomerSearch,
    handleCustomerSelect,
    addProduct,
    removeProduct,
    updateProduct,
    updateSerial,
    getAvailableSerialsForProduct,
    handleSave,
    handleCancel,
    calculateTotal: () => total,
    formatCurrency: (amount: number) => {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0
      }).format(amount);
    }
  };
};
