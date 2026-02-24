// Inventory Module - ViewModel Layer
// useInventoryTypeSelectionViewModel - Step 1: Choose inventory entry type

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryEntryType } from '../models/types';

export interface UseInventoryTypeSelectionViewModelReturn {
  // State
  selectedType: InventoryEntryType | null;
  
  // Actions
  selectType: (type: InventoryEntryType) => void;
  selectTypeAndContinue: (type: InventoryEntryType) => void;
  handleContinue: () => void;
  handleBack: () => void;
  
  // Validation
  canContinue: boolean;
}


export function useInventoryTypeSelectionViewModel(): UseInventoryTypeSelectionViewModelReturn {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<InventoryEntryType | null>(null);

  const selectType = useCallback((type: InventoryEntryType) => {
    setSelectedType(type);
  }, []);

  const selectTypeAndContinue = useCallback((type: InventoryEntryType) => {
    // Select type and immediately navigate
    setSelectedType(type);
    navigate(`/inventory/create-new/costing?type=${type}`);
  }, [navigate]);

  const handleContinue = useCallback(() => {
    if (selectedType) {
      // Navigate to costing option with inventory type in URL
      navigate(`/inventory/create-new/costing?type=${selectedType}`);
    }
  }, [navigate, selectedType]);


  const handleBack = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  return {
    selectedType,
    selectType,
    selectTypeAndContinue,
    handleContinue,
    handleBack,
    canContinue: selectedType !== null,
  };

}
