// Inventory Module - ViewModel Layer
// useCreateInventoryViewModel - Multi-step inventory creation & editing wizard
//
// CHANGES:
//   - Transaction ID (TXN-DDMMYY-###) generated on mount via
//     InventoryFirebaseService.generateTransactionId() — no direct db/firebase
//     import here; all Firestore access is encapsulated in the service.
//   - transactionId stored in formData and saved to Firestore via paymentInfo
//   - ID shown as read-only on Payment step; edit mode preserves original ID
//   - isGeneratingTxnId returned so View can gate the Next button

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ProductFormData,
  InventoryEntryStep,
  ValidationResult,
  CreateProductDTO,
  UpdateProductDTO,
} from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';

// ─────────────────────────────────────────────────────────────────────────────
// Pure-JS fallback — used only when Firestore is unreachable.
// Format: TXN-DDMMYY-###  e.g. TXN-220426-743
// ─────────────────────────────────────────────────────────────────────────────
function generateFallbackTxnId(): string {
  const now     = new Date();
  const dd      = String(now.getDate()).padStart(2, '0');
  const mm      = String(now.getMonth() + 1).padStart(2, '0');
  const yy      = String(now.getFullYear()).slice(-2);
  const counter = String(Math.floor(Math.random() * 900) + 100);
  return `TXN-${dd}${mm}${yy}-${counter}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface UseCreateInventoryViewModelReturn {
  currentStep: InventoryEntryStep;
  formData: ProductFormData;
  validation: ValidationResult;
  isSubmitting: boolean;
  isEditMode: boolean;
  editingId: string | null;
  serialInput: string;
  serialCity: string;
  isFetchingProduct: boolean;
  isGeneratingTxnId: boolean;
  setField: (field: string, value: any) => void;
  setCurrentStep: (step: InventoryEntryStep) => void;
  setSerialInput: (value: string) => void;
  setSerialCity: (value: string) => void;
  addSerialNumber: () => void;
  removeSerialNumber: (serial: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  loadFromExisting: (existingData: ProductFormData, docId: string) => void;
}

const EMPTY_FORM: ProductFormData = {
  brandId:       '',
  brandName:     '',
  modelId:       '',
  modelName:     '',
  category:      '',
  costPrice:     0,
  sellPrice:     0,
  buyType:       'Import' as const,
  warrantyYears: 0,
  stock:         0,
  location:      '',
  description:   '',
  paymentMethod: undefined,
  paidAmount:    undefined,
  transactionId: '',
  serialNumbers: [],
  serialCities:  {},
  isDamaged:     false,
  status:        'New',
  currentStep:   'details' as const,
};

export function useCreateInventoryViewModel(): UseCreateInventoryViewModelReturn {
  const navigate = useNavigate();
  const params   = useParams<{ id?: string }>();

  const [currentStep,       setCurrentStep]       = useState<InventoryEntryStep>('details');
  const [isEditMode,        setIsEditMode]         = useState(false);
  const [editingId,         setEditingId]          = useState<string | null>(null);
  const [isFetchingProduct, setIsFetchingProduct]  = useState(false);
  const [isGeneratingTxnId, setIsGeneratingTxnId]  = useState(false);
  const [formData,          setFormData]           = useState<ProductFormData>(EMPTY_FORM);
  const [serialInput,       setSerialInput]        = useState('');
  const [serialCity,        setSerialCity]         = useState('');
  const [validation,        setValidation]         = useState<ValidationResult>({ isValid: true, fieldErrors: {} });
  const [isSubmitting,      setIsSubmitting]       = useState(false);

  // ── Generate TXN ID on mount — CREATE mode only ───────────────────────────
  // InventoryFirebaseService.generateTransactionId() owns the db reference
  // and the Firestore atomic counter logic. We just call it here.
  useEffect(() => {
    if (params?.id) return; // edit mode — keep original ID from Firestore document

    setIsGeneratingTxnId(true);
    InventoryFirebaseService.generateTransactionId()
      .then(id => {
        setFormData(prev => ({ ...prev, transactionId: id }));
        console.log('✅ TXN ID generated:', id);
      })
      .catch(err => {
        console.error('⚠️ TXN ID generation failed, using fallback:', err);
        const fallback = generateFallbackTxnId();
        setFormData(prev => ({ ...prev, transactionId: fallback }));
      })
      .finally(() => setIsGeneratingTxnId(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edit mode: fetch product from Firestore ───────────────────────────────
  useEffect(() => {
    const productId = params?.id;
    if (!productId) return;

    setIsEditMode(true);
    setEditingId(productId);
    setIsFetchingProduct(true);

    (async () => {
      try {
        const product = await InventoryFirebaseService.fetchProductById(productId);
        if (!product) {
          toast.error('Product not found');
          navigate('/inventory');
          return;
        }

        const hydrated: ProductFormData = {
          brandId:       product.brandId       || '',
          brandName:     product.brandName     || '',
          modelId:       product.modelId       || '',
          modelName:     product.modelName     || '',
          category:      product.category      || '',
          costPrice:     product.costPrice     ?? 0,
          sellPrice:     product.sellPrice     ?? 0,
          buyType:       product.buyType       || 'Import',
          warrantyYears: product.warrantyYears ?? 0,
          stock:         product.stock         ?? 0,
          location:      product.location      || '',
          description:   product.description   || '',
          serialNumbers: product.serialNumbers || [],
          serialCities:  product.serialCities  || {},
          isDamaged:     product.isDamaged     ?? false,
          status:        product.status        || 'New',
          costingOption: product.costingOption,
          costing:       product.costing,
          transactionId: product.transactionId || '',   // preserve original TXN ID
          paymentMethod: undefined,
          paidAmount:    undefined,
          currentStep:   'details' as const,
        };

        setFormData(hydrated);
        setCurrentStep('details');
        console.log('✅ Loaded product for editing:', { productId, transactionId: product.transactionId });
      } catch (err) {
        console.error('❌ Failed to fetch product for editing:', err);
        toast.error('Failed to load product for editing');
        navigate('/inventory');
      } finally {
        setIsFetchingProduct(false);
      }
    })();
  }, [params?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── setField ──────────────────────────────────────────────────────────────
  const setField = useCallback((field: string, value: any) => {
    let sanitised = value;
    if (typeof sanitised === 'number' && isNaN(sanitised)) sanitised = 0;
    if (field === 'costPrice') {
      const parsed = typeof sanitised === 'string' ? parseFloat(sanitised) : Number(sanitised);
      sanitised = isFinite(parsed) ? parsed : 0;
    }
    setFormData(prev => ({ ...prev, [field]: sanitised }));
  }, []);

  // ── Serial numbers ────────────────────────────────────────────────────────
  const addSerialNumber = useCallback(() => {
    if (!serialInput.trim()) return;
    if (formData.serialNumbers.includes(serialInput.trim())) {
      toast.error('Serial number already exists');
      return;
    }
    const trimmed = serialInput.trim();
    const city    = serialCity.trim() || formData.location || '';
    setFormData(prev => ({
      ...prev,
      serialNumbers: [...prev.serialNumbers, trimmed],
      serialCities:  { ...prev.serialCities, [trimmed]: city },
      stock:         prev.serialNumbers.length + 1,
    }));
    setSerialInput('');
    setSerialCity('');
  }, [serialInput, serialCity, formData.serialNumbers, formData.location]);

  const removeSerialNumber = useCallback((serial: string) => {
    setFormData(prev => {
      const newSerials = prev.serialNumbers.filter(s => s !== serial);
      const newCities  = { ...prev.serialCities };
      delete newCities[serial];
      return { ...prev, serialNumbers: newSerials, serialCities: newCities, stock: newSerials.length };
    });
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateCurrentStep = useCallback((): boolean => {
    const fieldErrors: { [key: string]: string } = {};
    const validSerials = formData.serialNumbers.filter(s => s.trim() !== '');

    if (currentStep === 'details') {
      if (!formData.brandName)                              fieldErrors.brandName  = 'Brand is required';
      if (!formData.modelName)                              fieldErrors.modelName  = 'Model is required';
      if (!formData.category)                               fieldErrors.category   = 'Category is required';
      if (!formData.sellPrice || formData.sellPrice <= 0)   fieldErrors.sellPrice  = 'Valid sell price required';
      if (formData.costPrice === undefined || formData.costPrice === null || (formData.costPrice as any) === '')
        fieldErrors.costPrice = 'Cost price is required (can be 0)';
      if (!isEditMode && validSerials.length !== formData.stock)
        fieldErrors.serialNumbers = `Provide ${formData.stock} serial number(s)`;
    } else if (currentStep === 'payment') {
      if (!formData.paymentMethod) fieldErrors.paymentMethod = 'Payment method required';
    }

    setValidation({ isValid: Object.keys(fieldErrors).length === 0, fieldErrors });
    return Object.keys(fieldErrors).length === 0;
  }, [currentStep, formData, isEditMode]);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;
    const steps: InventoryEntryStep[] = ['details', 'payment', 'confirmation'];
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    const steps: InventoryEntryStep[] = ['details', 'payment', 'confirmation'];
    const idx = steps.indexOf(currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1]);
  }, [currentStep]);

  const loadFromExisting = useCallback((existingData: ProductFormData, docId: string) => {
    setIsEditMode(true);
    setEditingId(docId);
    setFormData({ ...existingData, costPrice: existingData.costPrice ?? 0 });
    setCurrentStep('details');
  }, []);

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);

    try {
      const rawCost  = formData.costPrice;
      const costPrice: number =
        typeof rawCost === 'number' && isFinite(rawCost) ? rawCost : 0;

      const totalAmount   = costPrice * (formData.stock ?? 0);
      const paidAmount    = formData.paidAmount ?? 0;
      const paymentStatus: 'paid' | 'unpaid' | 'partial' =
        paidAmount >= totalAmount ? 'paid' :
        paidAmount > 0            ? 'partial' :
                                    'unpaid';

      const duplicateCheck = await InventoryFirebaseService.findDuplicateInventory({
        brandName: formData.brandName,
        modelName: formData.modelName,
        costPrice,
        sellPrice: formData.sellPrice,
        location: formData.location,
        serialNumbers: formData.serialNumbers || [],
      }, isEditMode ? editingId ?? undefined : undefined);

      if (duplicateCheck) {
        if (duplicateCheck.type === 'serial' && duplicateCheck.serials?.length) {
          toast.error(`This inventory contains serial number${duplicateCheck.serials.length > 1 ? 's' : ''} already in stock: ${duplicateCheck.serials.join(', ')}`);
        } else {
          toast.error('This inventory already exists with the same product, price, location and serial numbers.');
        }
        return;
      }

      if (isEditMode && editingId) {
        // ── UPDATE ─────────────────────────────────────────────────────────
        const updateDto: UpdateProductDTO = {
          brandName:     formData.brandName,
          modelName:     formData.modelName,
          category:      formData.category,
          costPrice,
          sellPrice:     formData.sellPrice,
          buyType:       formData.buyType,
          warrantyYears: formData.warrantyYears,
          stock:         formData.stock,
          location:      formData.location,
          description:   formData.description,
          serialNumbers: formData.serialNumbers,
          serialCities:  formData.serialCities,
          status:        formData.status,
          isDamaged:     formData.isDamaged,
          costingOption: formData.costingOption,
          costing:       formData.costing,
          transactionId: formData.transactionId || undefined,
        };

        await InventoryFirebaseService.updateProduct(editingId, updateDto);
        toast.success(`✅ Inventory updated — ${formData.transactionId || editingId}`);

      } else {
        // ── CREATE ─────────────────────────────────────────────────────────
        const createDto: CreateProductDTO = {
          brandName:     formData.brandName,
          modelName:     formData.modelName,
          category:      formData.category,
          costPrice,
          sellPrice:     formData.sellPrice,
          buyType:       formData.buyType,
          warrantyYears: formData.warrantyYears,
          stock:         formData.stock,
          location:      formData.location,
          description:   formData.description,
          serialNumbers: formData.serialNumbers,
          serialCities:  formData.serialCities  || {},
          status:        formData.status,
          isDamaged:     formData.isDamaged      ?? false,
          costingOption: formData.costingOption,
          costing:       formData.costing,
          transactionId: formData.transactionId,   // ← TXN-DDMMYY-### saved on document
        };

        const paymentInfo = formData.paymentMethod
          ? {
              paymentStatus,
              transactionId:  formData.transactionId,  // ← links activity records
              paidAmount:     formData.paidAmount,
              totalAmount,
              paymentMode:    formData.paymentMethod === 'Cash' ? 'cash' : 'bank',
            }
          : {
              paymentStatus:  'unpaid' as const,
              transactionId:  formData.transactionId,  // ← always saved even if unpaid
              totalAmount,
            };

        await InventoryFirebaseService.createProduct(createDto, paymentInfo);
        toast.success(`✅ Inventory saved — ${formData.transactionId}`);
      }

      navigate('/inventory/view');
    } catch (error) {
      console.error('❌ Error saving inventory item:', error);
      toast.error(isEditMode ? 'Failed to update inventory item' : 'Failed to create inventory item');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, formData, navigate, isEditMode, editingId]);

  const handleCancel = useCallback(() => navigate('/inventory'), [navigate]);

  return {
    currentStep,
    formData,
    validation,
    isSubmitting,
    isEditMode,
    editingId,
    isFetchingProduct,
    isGeneratingTxnId,
    serialInput,
    serialCity,
    setField,
    setCurrentStep,
    setSerialInput,
    setSerialCity,
    addSerialNumber,
    removeSerialNumber,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    handleCancel,
    loadFromExisting,
  };
}