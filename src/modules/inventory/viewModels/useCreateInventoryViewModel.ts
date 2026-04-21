// Inventory Module - ViewModel Layer
// useCreateInventoryViewModel - Multi-step inventory creation & editing wizard
//
// FIXES APPLIED:
//   1. costPrice initialised to 0 (was `undefined`) — stripUndefined in the
//      Firebase service silently dropped undefined fields before Firestore write.
//   2. setField sanitises numeric inputs: Number('') → NaN coerced to 0 so
//      Firestore never receives NaN (which it rejects silently).
//   3. paidAmount used everywhere (paymentAmount doesn't exist on ProductFormData).
//   4. handleSubmit now maps ProductFormData → CreateProductDTO/UpdateProductDTO
//      correctly, so description, costPrice, and all fields are persisted.
//      Previously, augmentedFormData (a ProductFormData) was passed directly to
//      InventoryFirebaseService.createProduct which expects a CreateProductDTO —
//      this caused description and other fields to be silently ignored.
//   5. paymentInfo is passed as the explicit second argument to createProduct().
//   6. EDIT MODE: useEffect detects /:id/edit route, fetches the product from
//      Firestore by ID, and hydrates the form via loadFromExisting(). Previously
//      there was no fetch — the form was always blank in edit mode.
//   7. BrandModelSelector pre-population: loadFromExisting sets brandId/modelId
//      so the selector can show the correct values.

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
  // FIX 1 — MUST be 0, not undefined. stripUndefined drops undefined before Firestore write.
  costPrice:     0,
  sellPrice:     0,
  buyType:       'Import' as const,
  warrantyYears: 0,
  stock:         0,
  location:      '',
  description:   '',
  paymentMethod: undefined,
  paidAmount:    undefined,
  serialNumbers: [],
  serialCities:  {},
  isDamaged:     false,
  status:        'New',
  currentStep:   'details' as const,
};

export function useCreateInventoryViewModel(): UseCreateInventoryViewModelReturn {
  const navigate = useNavigate();
  // FIX 6 — detect /:id/edit route to know we are in edit mode
  const params = useParams<{ id?: string }>();

  const [currentStep,       setCurrentStep]       = useState<InventoryEntryStep>('details');
  const [isEditMode,        setIsEditMode]         = useState(false);
  const [editingId,         setEditingId]          = useState<string | null>(null);
  const [isFetchingProduct, setIsFetchingProduct]  = useState(false);
  const [formData,          setFormData]           = useState<ProductFormData>(EMPTY_FORM);
  const [serialInput,       setSerialInput]        = useState('');
  const [serialCity,        setSerialCity]         = useState('');
  const [validation,        setValidation]         = useState<ValidationResult>({ isValid: true, fieldErrors: {} });
  const [isSubmitting,      setIsSubmitting]       = useState(false);

  // FIX 6 — When route contains an id param, fetch that product and pre-fill the form.
  useEffect(() => {
    const productId = params?.id;
    if (!productId) return; // create mode — nothing to fetch

    setIsEditMode(true);
    setEditingId(productId);
    setIsFetchingProduct(true);

    (async () => {
      try {
        console.log('📂 Fetching product for edit:', productId);
        const product = await InventoryFirebaseService.fetchProductById(productId);
        if (!product) {
          toast.error('Product not found');
          navigate('/inventory');
          return;
        }

        // Map Product → ProductFormData
        const hydrated: ProductFormData = {
          brandId:       product.brandId       || '',
          brandName:     product.brandName     || '',
          modelId:       product.modelId       || '',
          modelName:     product.modelName     || '',
          category:      product.category      || '',
          costPrice:     product.costPrice     ?? 0,   // FIX 1 — never undefined
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
          // Payment fields — may not exist on older documents
          paymentMethod: undefined,
          paidAmount:    undefined,
          currentStep:   'details' as const,
        };

        setFormData(hydrated);
        setCurrentStep('details');
        console.log('✅ Loaded product for editing:', { productId, costPrice: product.costPrice, description: product.description });
      } catch (err) {
        console.error('❌ Failed to fetch product for editing:', err);
        toast.error('Failed to load product for editing');
        navigate('/inventory');
      } finally {
        setIsFetchingProduct(false);
      }
    })();
  }, [params?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX 2 — sanitise numeric inputs before storing in state.
  // CRITICAL: Do NOT use `Number(value) || 0` — that coerces legitimate 0 to 0
  // which is fine but more importantly it hides NaN bugs. Use explicit isNaN guard.
  const setField = useCallback((field: string, value: any) => {
    let sanitised = value;
    // For ANY numeric field: if NaN slips through, coerce to 0
    if (typeof sanitised === 'number' && isNaN(sanitised)) sanitised = 0;
    // costPrice: parse from string if needed, guarantee it is a finite number
    if (field === 'costPrice') {
      const parsed = typeof sanitised === 'string' ? parseFloat(sanitised) : Number(sanitised);
      sanitised = isFinite(parsed) ? parsed : 0;
      console.log(`📍 costPrice set to: ${sanitised} (from raw: ${value})`);
    }
    setFormData(prev => ({ ...prev, [field]: sanitised }));
  }, []);

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

  const validateCurrentStep = useCallback((): boolean => {
    const fieldErrors: { [key: string]: string } = {};
    const validSerials = formData.serialNumbers.filter(s => s.trim() !== '');

    if (currentStep === 'details') {
      if (!formData.brandName)                              fieldErrors.brandName     = 'Brand is required';
      if (!formData.modelName)                              fieldErrors.modelName     = 'Model is required';
      if (!formData.category)                               fieldErrors.category      = 'Category is required';
      if (!formData.sellPrice || formData.sellPrice <= 0)   fieldErrors.sellPrice     = 'Valid sell price required';
      if (formData.costPrice === undefined || formData.costPrice === null || (formData.costPrice as any) === '')
        fieldErrors.costPrice = 'Cost price is required (can be 0)';
      // In edit mode we allow the existing serials count to differ from stock
      // (user may not re-enter all serials). Skip this check in edit mode.
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

  // Manual load — used by parent pages that already have a product object.
  const loadFromExisting = useCallback((existingData: ProductFormData, docId: string) => {
    setIsEditMode(true);
    setEditingId(docId);
    setFormData({ ...existingData, costPrice: existingData.costPrice ?? 0 });
    setCurrentStep('details');
    console.log('📂 loadFromExisting:', { docId, costPrice: existingData.costPrice });
  }, []);

  // ── SUBMIT ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);

    try {
      // FIX 4 — Build a proper CreateProductDTO / UpdateProductDTO from ProductFormData.
      // Previously `augmentedFormData` (a ProductFormData) was passed directly to
      // InventoryFirebaseService.createProduct which expects CreateProductDTO — causing
      // fields like `description` and payment info to be silently ignored / lost.

      // CRITICAL: coerce costPrice to a real finite number.
      // If BrandModelSelector reset it to undefined/NaN, catch it here and warn.
      const rawCost = formData.costPrice;
      const costPrice: number =
        typeof rawCost === 'number' && isFinite(rawCost) ? rawCost : 0;
      if (rawCost === undefined || rawCost === null || (typeof rawCost === 'number' && isNaN(rawCost))) {
        console.warn('⚠️ costPrice was', rawCost, '— coerced to 0 at submit. BrandModelSelector likely reset it.');
      }
      const totalAmount   = costPrice * (formData.stock ?? 0);
      const paidAmount    = formData.paidAmount ?? 0;
      const paymentStatus: 'paid' | 'unpaid' | 'partial' =
        paidAmount >= totalAmount ? 'paid' :
        paidAmount > 0            ? 'partial' :
                                    'unpaid';

      console.log('📦 Submitting inventory payload:', {
        mode:          isEditMode ? 'EDIT' : 'CREATE',
        docId:         editingId,
        brandName:     formData.brandName,
        modelName:     formData.modelName,
        category:      formData.category,
        costPrice,
        sellPrice:     formData.sellPrice,
        stock:         formData.stock,
        description:   formData.description,
        location:      formData.location,
        serialNumbers: formData.serialNumbers,
        paymentMethod: formData.paymentMethod,
        paidAmount:    formData.paidAmount,
        totalAmount,
      });

      if (isEditMode && editingId) {
        // ── UPDATE ────────────────────────────────────────────────────────────
        // Build UpdateProductDTO with ONLY the fields that exist on the type.
        // This prevents stray ProductFormData-only keys (currentStep, paidAmount,
        // paymentMethod) from polluting the Firestore document.
        const updateDto: UpdateProductDTO = {
          brandName:     formData.brandName,
          modelName:     formData.modelName,
          category:      formData.category,
          costPrice,                              // FIX 4 — explicit, guaranteed non-undefined
          sellPrice:     formData.sellPrice,
          buyType:       formData.buyType,
          warrantyYears: formData.warrantyYears,
          stock:         formData.stock,
          location:      formData.location,
          description:   formData.description,   // FIX 4 — was missing before
          serialNumbers: formData.serialNumbers,
          serialCities:  formData.serialCities,
          status:        formData.status,
          isDamaged:     formData.isDamaged,
          costingOption: formData.costingOption,
          costing:       formData.costing,
        };

        await InventoryFirebaseService.updateProduct(editingId, updateDto);
        toast.success('Inventory item updated successfully!');
      } else {
        // ── CREATE ────────────────────────────────────────────────────────────
        // Build CreateProductDTO explicitly so every field is correctly typed.
        const createDto: CreateProductDTO = {
          brandName:     formData.brandName,
          modelName:     formData.modelName,
          category:      formData.category,
          costPrice,                              // FIX 4 — explicit, guaranteed non-undefined
          sellPrice:     formData.sellPrice,
          buyType:       formData.buyType,
          warrantyYears: formData.warrantyYears,
          stock:         formData.stock,
          location:      formData.location,
          description:   formData.description,   // FIX 4 — was missing before
          serialNumbers: formData.serialNumbers,
          serialCities:  formData.serialCities  || {},
          status:        formData.status,
          isDamaged:     formData.isDamaged      ?? false,
          costingOption: formData.costingOption,
          costing:       formData.costing,
        };

        // FIX 5 — pass paymentInfo as the second argument so payment fields
        // are persisted. Previously this argument was never passed.
        const paymentInfo = formData.paymentMethod
          ? {
              paymentStatus,
              transactionId: formData.transactionId,
              paidAmount:    formData.paidAmount,
              totalAmount,
            }
          : undefined;

        await InventoryFirebaseService.createProduct(createDto, paymentInfo);
        toast.success('Inventory item created successfully!');
      }

      navigate('/inventory');
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