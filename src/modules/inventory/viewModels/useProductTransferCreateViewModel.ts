// Inventory Module - ViewModel Layer
// useProductTransferCreateViewModel - Business logic for creating product transfers

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Product, ProductTransfer, CreateTransferDTO } from '../models/types';
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
 * Transfer line item for multi-product transfers
 */
interface TransferLine {
  productId: string;
  quantity: number;
  selectedSerials: string[];
}

/**
 * Return type for useProductTransferCreateViewModel
 */
interface UseProductTransferCreateViewModelReturn {
  // Data
  products: Product[];
  locations: string[];
  
  // Form State
  formData: {
    date: string;
    fromLocation: string;
    toLocation: string;
    transferredBy: string;
    note: string;
  };
  transferItems: TransferLine[];
  receiptName: string;
  receiptType: string;
  receiptDataUrl: string;
  showSummary: boolean;
  isSubmitting: boolean;
  
  // Validation
  validation: {
    isValid: boolean;
    error?: string;
  };
  
  // Actions
  setFormField: (field: string, value: any) => void;
  addTransferItem: () => void;
  removeTransferItem: (index: number) => void;
  updateTransferItemProduct: (index: number, productId: string) => void;
  updateTransferItemQuantity: (index: number, quantity: number) => void;
  updateTransferItemSerial: (lineIndex: number, serialIndex: number, value: string) => void;
  handleReceiptChange: (file?: File) => void;
  toggleSummary: () => void;
  handleSave: () => void;
  handlePreviewPdf: () => void;
  handleDownloadPdf: () => void;
  onBack: () => void;
  
  // Helpers
  getAvailableSerials: (productId?: string, location?: string) => string[];
  getProductStockByLocation: (productId: string, location: string) => number;
  getProductById: (productId: string) => Product | undefined;
  generatePDF: () => jsPDF;
}

const LOCATIONS = ['Islamabad', 'Karachi', 'Lahore', 'Bullion RND/SITE'];

/**
 * ViewModel hook for Product Transfer Create page
 */
export function useProductTransferCreateViewModel(): UseProductTransferCreateViewModelReturn {
  const navigate = useNavigate();
  const { products, transfers: allTransfers, setTransfers } = useOutletContext<InventoryContext>();

  // ==================== STATE ====================
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromLocation: '',
    toLocation: '',
    transferredBy: '',
    note: ''
  });

  const [transferItems, setTransferItems] = useState<TransferLine[]>([
    { productId: '', quantity: 1, selectedSerials: [] }
  ]);

  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptType, setReceiptType] = useState<string>('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== COMPUTED VALUES ====================
  
  const locations = useMemo(() => LOCATIONS, []);

  const validation = useMemo(() => {
    if (!formData.fromLocation || !formData.toLocation || !formData.transferredBy) {
      return { isValid: false, error: 'Please fill in all required fields' };
    }

    if (formData.fromLocation === formData.toLocation) {
      return { isValid: false, error: 'From and To locations must be different' };
    }

    for (let i = 0; i < transferItems.length; i++) {
      const item = transferItems[i];
      if (!item.productId || item.quantity < 1) {
        return { isValid: false, error: 'Please select product and quantity for all lines' };
      }
      const validSerials = (item.selectedSerials || []).filter(s => s && s.trim() !== '');
      if (validSerials.length !== item.quantity) {
        return { isValid: false, error: 'Please select all serial numbers for each product line' };
      }
    }

    return { isValid: true };
  }, [formData, transferItems]);

  // ==================== HELPERS ====================
  
  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  const getProductStockByLocation = useCallback((productId: string, location: string) => {
    const product = getProductById(productId);
    if (!product) return 0;
    return product.serialNumbers?.filter(serial => product.serialCities?.[serial] === location).length || 0;
  }, [getProductById]);

  const getAvailableSerials = useCallback((productId?: string, location?: string) => {
    const pid = productId;
    const loc = location || formData.fromLocation;
    if (!pid || !loc) return [];

    const product = getProductById(pid);
    if (!product) return [];

    return product.serialNumbers?.filter(serial => {
      const cityMatch = product.serialCities?.[serial] === loc;
      const status = product.serialStatus?.[serial] || 'Available';
      return cityMatch && status !== 'In Transit' && status !== 'Damaged' && status !== 'Returned';
    }) || [];
  }, [getProductById, formData.fromLocation]);

  const generatePDF = useCallback(() => {
    const transfer: ProductTransfer = {
      id: Date.now().toString(),
      date: formData.date,
      productId: transferItems[0]?.productId || '',
      productName: (() => {
        const p = getProductById(transferItems[0]?.productId || '');
        return p ? `${p.brandName} ${p.modelName}` : '';
      })(),
      brandName: '',
      modelName: '',
      serialNumbers: transferItems.flatMap(it => it.selectedSerials.filter(Boolean)),
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      quantity: transferItems.reduce((s, it) => s + it.quantity, 0),
      transferredBy: formData.transferredBy,
      note: formData.note,
      status: 'Pending',
    };

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let y = 40;
    doc.setFontSize(14);
    doc.text(`Transfer ID: ${transfer.id}`, left, y);
    y += 20;
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(transfer.date).toLocaleString()}`, left, y);
    y += 18;
    doc.text(`From: ${transfer.fromLocation}`, left, y);
    y += 16;
    doc.text(`To: ${transfer.toLocation}`, left, y);
    y += 16;
    doc.text(`Transferred By: ${transfer.transferredBy}`, left, y);
    y += 24;
    doc.setFontSize(13);
    doc.text('Items:', left, y);
    y += 18;
    transfer.serialNumbers.forEach((s, idx) => {
      doc.text(`${idx + 1}. ${s}`, left + 10, y);
      y += 14;
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
    });
    y += 10;
    doc.setFontSize(11);
    doc.text(`Status: ${transfer.status || 'Pending'}`, left, y);
    
    return doc;
  }, [formData, transferItems, getProductById]);

  // ==================== ACTIONS ====================
  
  const setFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addTransferItem = useCallback(() => {
    setTransferItems(prev => [...prev, { productId: '', quantity: 1, selectedSerials: [] }]);
  }, []);

  const removeTransferItem = useCallback((index: number) => {
    setTransferItems(prev => {
      const items = prev.filter((_, idx) => idx !== index);
      return items.length ? items : [{ productId: '', quantity: 1, selectedSerials: [] }];
    });
  }, []);

  const updateTransferItemProduct = useCallback((index: number, productId: string) => {
    setTransferItems(prev => {
      const items = [...prev];
      items[index] = { ...items[index], productId, selectedSerials: [] };
      return items;
    });
  }, []);

  const updateTransferItemQuantity = useCallback((index: number, quantity: number) => {
    setTransferItems(prev => {
      const items = [...prev];
      const currentSerials = items[index].selectedSerials;
      let newSerials: string[];
      
      if (currentSerials.length < quantity) {
        newSerials = [...currentSerials, ...Array(quantity - currentSerials.length).fill('')];
      } else {
        newSerials = currentSerials.slice(0, quantity);
      }
      
      items[index] = { ...items[index], quantity, selectedSerials: newSerials };
      return items;
    });
  }, []);

  const updateTransferItemSerial = useCallback((lineIndex: number, serialIndex: number, value: string) => {
    setTransferItems(prev => {
      const items = [...prev];
      items[lineIndex].selectedSerials[serialIndex] = value;
      return items;
    });
  }, []);

  const handleReceiptChange = useCallback((file?: File) => {
    if (!file) {
      setReceiptName('');
      setReceiptType('');
      setReceiptDataUrl('');
      return;
    }

    const isAllowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    const maxSize = 5 * 1024 * 1024;

    if (!isAllowed) {
      toast.error('Receipt must be a PDF, JPG, or PNG file');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Receipt must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptName(file.name);
      setReceiptType(file.type);
      setReceiptDataUrl(String(reader.result || ''));
      toast.success('Receipt attached');
    };
    reader.onerror = () => toast.error('Failed to read receipt file');
    reader.readAsDataURL(file);
  }, []);

  const toggleSummary = useCallback(() => {
    setShowSummary(prev => !prev);
  }, []);

  const handleSave = useCallback(() => {
    if (!validation.isValid) {
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newTransfer: ProductTransfer = {
        id: Date.now().toString(),
        date: formData.date,
        productId: transferItems[0].productId,
        productName: (() => {
          const p = getProductById(transferItems[0].productId);
          return p ? `${p.brandName} ${p.modelName}` : '';
        })(),
        brandName: '',
        modelName: '',
        serialNumbers: transferItems.flatMap(it => it.selectedSerials.filter(Boolean)),
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        quantity: transferItems.reduce((s, it) => s + it.quantity, 0),
        transferredBy: formData.transferredBy,
        note: formData.note,
        status: 'Pending',
        receiptName: receiptDataUrl ? receiptName : undefined,
        receiptType: receiptDataUrl ? receiptType : undefined,
        receiptDataUrl: receiptDataUrl || undefined,
      };

      // Update products to mark serials as "In Transit"
      const updatedProducts = products.map(p => {
        const item = transferItems.find(it => it.productId === p.id);
        if (!item) return p;
        
        const newSerialCities = { ...p.serialCities };
        const newSerialStatus = { ...(p.serialStatus || {}) };

        item.selectedSerials.forEach(serial => {
          if (!serial) return;
          newSerialStatus[serial] = 'In Transit';
          newSerialCities[serial] = 'In Transit';
        });

        return { ...p, serialCities: newSerialCities, serialStatus: newSerialStatus };
      });

      // Add the new transfer
      const updatedTransfers = [newTransfer, ...allTransfers];
      
      setTransfers(updatedTransfers);
      toast.success('Product transfer created and marked as In Transit');
      navigate('/product-transfer');
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, transferItems, validation, allTransfers, setTransfers, products, receiptDataUrl, receiptName, receiptType, navigate, getProductById]);

  const handlePreviewPdf = useCallback(() => {
    const doc = generatePDF();
    window.open(doc.output('bloburl'));
  }, [generatePDF]);

  const handleDownloadPdf = useCallback(() => {
    const doc = generatePDF();
    const transferId = Date.now().toString();
    doc.save(`transfer-${transferId}.pdf`);
  }, [generatePDF]);

  const onBack = useCallback(() => {
    navigate('/product-transfer');
  }, [navigate]);

  return {
    products,
    locations,
    formData,
    transferItems,
    receiptName,
    receiptType,
    receiptDataUrl,
    showSummary,
    isSubmitting,
    validation,
    setFormField,
    addTransferItem,
    removeTransferItem,
    updateTransferItemProduct,
    updateTransferItemQuantity,
    updateTransferItemSerial,
    handleReceiptChange,
    toggleSummary,
    handleSave,
    handlePreviewPdf,
    handleDownloadPdf,
    onBack,
    getAvailableSerials,
    getProductStockByLocation,
    getProductById,
    generatePDF
  };
}
