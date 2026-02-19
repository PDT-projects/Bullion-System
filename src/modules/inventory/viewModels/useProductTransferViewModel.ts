// Inventory Module - ViewModel Layer
// useProductTransferViewModel - Business logic for product transfers

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Product, ProductTransfer, CreateTransferDTO, TransferFilters, ValidationResult } from '../models/types';
import { InventoryService } from '../models/inventoryService';

/**
 * Context type from InventoryLayout
 */
interface InventoryContext {
  products: Product[];
  transfers: ProductTransfer[];
  setTransfers: (transfers: ProductTransfer[]) => void;
}

/**
 * Return type for useProductTransferViewModel
 */
interface UseProductTransferViewModelReturn {
  // Data
  products: Product[];
  transfers: ProductTransfer[];
  locations: string[];
  
  // Selected Product
  selectedProduct: Product | null;
  availableSerials: string[];
  
  // Filter State
  filters: TransferFilters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // Form State (for new transfer)
  formData: Partial<CreateTransferDTO>;
  selectedSerials: string[];
  validation: ValidationResult;
  isSubmitting: boolean;
  
  // View State
  viewTransfer: ProductTransfer | null;
  
  // Stats
  stats: {
    totalTransfers: number;
    pendingTransfers: number;
    completedTransfers: number;
    inTransitTransfers: number;
  };
  
  // Actions
  setFilter: (key: keyof TransferFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setSelectedProduct: (product: Product | null) => void;
  setFormField: (field: string, value: any) => void;

  toggleSerialSelection: (serial: string) => void;
  selectAllSerials: () => void;
  clearSerialSelection: () => void;
  handleCreateTransfer: () => void;
  handleCompleteTransfer: (id: string) => void;
  handleCancelTransfer: (id: string) => void;
  setViewTransfer: (transfer: ProductTransfer | null) => void;
  onBack: () => void;
  onNewTransfer: () => void;
}

/**
 * ViewModel hook for Product Transfer page
 */
export function useProductTransferViewModel(): UseProductTransferViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, transfers: allTransfers, setTransfers } = useOutletContext<InventoryContext>();

  // Get productId from URL if present
  const urlProductId = searchParams.get('productId');

  // ==================== STATE ====================
  
  const [filters, setFilters] = useState<TransferFilters>({
    productSearch: '',
    fromLocation: '',
    toLocation: '',
    statusFilter: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewTransfer, setViewTransfer] = useState<ProductTransfer | null>(null);
  
  // Form state for new transfer
  const [formData, setFormData] = useState<Partial<CreateTransferDTO>>({
    fromLocation: '',
    toLocation: '',
    quantity: 0,
    serialNumbers: [],
    transferDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== EFFECTS ====================
  
  // Auto-select product from URL
  useEffect(() => {
    if (urlProductId && products.length > 0) {
      const product = InventoryService.findProductById(products, urlProductId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [urlProductId, products]);

  // Update available serials when product changes
  useEffect(() => {
    if (selectedProduct) {
      const available = InventoryService.getAvailableSerials(selectedProduct);
      setFormData(prev => ({ ...prev, serialNumbers: [] }));
      setSelectedSerials([]);
    }
  }, [selectedProduct]);

  // ==================== COMPUTED VALUES ====================
  
  const transfers = useMemo(() => {
    return InventoryService.filterTransfers(allTransfers, filters);
  }, [allTransfers, filters]);

  const locations = useMemo(() => {
    return InventoryService.getUniqueLocations(allTransfers);
  }, [allTransfers]);

  const availableSerials = useMemo(() => {
    if (!selectedProduct) return [];
    return InventoryService.getAvailableSerials(selectedProduct);
  }, [selectedProduct]);

  const stats = useMemo(() => {
    return InventoryService.calculateTransferStats(transfers);
  }, [transfers]);

  const validation = useMemo((): ValidationResult => {
    if (!selectedProduct) {
      return { isValid: false, error: 'Please select a product' };
    }
    return InventoryService.validateTransfer(
      { ...formData, productId: selectedProduct.id }, 
      selectedProduct.stock
    );
  }, [formData, selectedProduct]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '' && v !== null).length;
  }, [filters]);

  // ==================== ACTIONS ====================
  
  const setFilter = useCallback((key: keyof TransferFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      productSearch: '',
      fromLocation: '',
      toLocation: '',
      statusFilter: '',
      dateFrom: '',
      dateTo: ''
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const setFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);


  const toggleSerialSelection = useCallback((serial: string) => {
    setSelectedSerials(prev => {
      if (prev.includes(serial)) {
        return prev.filter(s => s !== serial);
      }
      if (prev.length >= (formData.quantity || 0)) {
        toast.error(`You can only select ${formData.quantity} serial numbers`);
        return prev;
      }
      return [...prev, serial];
    });
    
    setFormData(prev => ({
      ...prev,
      serialNumbers: prev.serialNumbers?.includes(serial)
        ? prev.serialNumbers.filter(s => s !== serial)
        : [...(prev.serialNumbers || []), serial]
    }));
  }, [formData.quantity]);

  const selectAllSerials = useCallback(() => {
    if (!selectedProduct) return;
    const available = InventoryService.getAvailableSerials(selectedProduct);
    const toSelect = available.slice(0, formData.quantity || available.length);
    setSelectedSerials(toSelect);
    setFormData(prev => ({ ...prev, serialNumbers: toSelect }));
  }, [selectedProduct, formData.quantity]);

  const clearSerialSelection = useCallback(() => {
    setSelectedSerials([]);
    setFormData(prev => ({ ...prev, serialNumbers: [] }));
  }, []);

  const handleCreateTransfer = useCallback(() => {
    if (!selectedProduct || !validation.isValid) {
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transferData: CreateTransferDTO = {
        productId: selectedProduct.id,
        fromLocation: formData.fromLocation || '',
        toLocation: formData.toLocation || '',
        quantity: formData.quantity || 0,
        serialNumbers: formData.serialNumbers || [],
        transferDate: formData.transferDate || new Date().toISOString().split('T')[0],
        notes: formData.notes
      };

      const updatedTransfers = InventoryService.createTransfer(
        allTransfers, 
        transferData, 
        selectedProduct.modelName
      );
      
      setTransfers(updatedTransfers);
      toast.success('Transfer created successfully');
      
      // Reset form
      setSelectedProduct(null);
      setFormData({
        fromLocation: '',
        toLocation: '',
        quantity: 0,
        serialNumbers: [],
        transferDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedSerials([]);
      
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProduct, formData, validation, allTransfers, setTransfers]);

  const handleCompleteTransfer = useCallback((id: string) => {
    const updatedTransfers = InventoryService.completeTransfer(allTransfers, id);
    setTransfers(updatedTransfers);
    toast.success('Transfer completed');
  }, [allTransfers, setTransfers]);

  const handleCancelTransfer = useCallback((id: string) => {
    const updatedTransfers = InventoryService.cancelTransfer(allTransfers, id);
    setTransfers(updatedTransfers);
    toast.success('Transfer cancelled');
  }, [allTransfers, setTransfers]);

  const onBack = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  const onNewTransfer = useCallback(() => {
    navigate('/product-transfer/new');
  }, [navigate]);

  return {
    products,
    transfers,
    locations,
    selectedProduct,
    availableSerials,
    filters,
    showFilters,
    activeFilterCount,
    formData,
    selectedSerials,
    validation,
    isSubmitting,
    viewTransfer,
    stats: {
      totalTransfers: stats.totalTransfers,
      pendingTransfers: stats.pendingTransfers,
      completedTransfers: stats.completedTransfers,
      inTransitTransfers: stats.inTransitTransfers
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setSelectedProduct,
    setFormField,
    toggleSerialSelection,
    selectAllSerials,
    clearSerialSelection,
    handleCreateTransfer,
    handleCompleteTransfer,
    handleCancelTransfer,
    setViewTransfer,
    onBack,
    onNewTransfer
  };
}
