// Inventory Module - ViewModel Layer
// useInventoryReturnViewModel
// Add Returned Inventory: look up a serial number, then either
//   - mark it Damaged → archived to Damaged Inventory, removed from stock, or
//   - mark it Not Damaged → back into stock under the same serial number
//     with a fresh stock-in date. If the product was on supplier credit,
//     it becomes Owned (per business rule: a return closes out credit terms).

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../providers/context/AuthContext';
import { Product } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';

export interface UseInventoryReturnViewModelReturn {
  serialInput: string;
  setSerialInput: (v: string) => void;
  isSearching: boolean;
  foundProduct: Product | null;
  notFound: boolean;
  handleSearch: () => Promise<void>;
  isDamaged: boolean;
  setIsDamaged: (v: boolean) => void;
  damageReason: string;
  setDamageReason: (v: string) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  onBack: () => void;
}

export function useInventoryReturnViewModel(): UseInventoryReturnViewModelReturn {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [serialInput, setSerialInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageReason, setDamageReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = serialInput.trim();
    if (!trimmed) { toast.error('Enter a serial number to search'); return; }
    setIsSearching(true);
    setNotFound(false);
    setFoundProduct(null);
    try {
      const product = await InventoryFirebaseService.findProductBySerial(trimmed);
      if (!product) {
        setNotFound(true);
      } else {
        setFoundProduct(product);
      }
    } catch {
      toast.error('Failed to search for serial number');
    } finally {
      setIsSearching(false);
    }
  }, [serialInput]);

  const reset = useCallback(() => {
    setSerialInput('');
    setFoundProduct(null);
    setNotFound(false);
    setIsDamaged(false);
    setDamageReason('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!foundProduct) return;
    const serial = serialInput.trim();
    setIsSubmitting(true);
    try {
      if (isDamaged) {
        await InventoryFirebaseService.moveSerialToDamaged(
          foundProduct.id,
          serial,
          user ? { uid: user.uid, email: user.email || '' } : undefined,
          damageReason.trim() || undefined
        );
        toast.success(`Serial ${serial} moved to Damaged Inventory`);
      } else {
        await InventoryFirebaseService.returnSerialToStock(foundProduct.id, serial);
        toast.success(`Serial ${serial} returned to stock`);
      }
      reset();
      navigate('/inventory');
    } catch (err) {
      toast.error('Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  }, [foundProduct, serialInput, isDamaged, damageReason, user, navigate, reset]);

  const onBack = useCallback(() => navigate('/inventory'), [navigate]);

  return {
    serialInput, setSerialInput, isSearching, foundProduct, notFound, handleSearch,
    isDamaged, setIsDamaged, damageReason, setDamageReason,
    isSubmitting, handleSubmit, reset, onBack,
  };
}