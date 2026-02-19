// Inventory Module - ViewModel Layer
// useInventoryCostingOptionViewModel - Step 1: Choose costing option

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CostingOption } from '../models/types';

export interface UseInventoryCostingOptionViewModelReturn {
  // State
  selectedOption: CostingOption | null;
  
  // Actions
  selectOption: (option: CostingOption) => void;
  handleContinue: () => void;
  handleBack: () => void;
  
  // Validation
  canContinue: boolean;
}

export function useInventoryCostingOptionViewModel(): UseInventoryCostingOptionViewModelReturn {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<CostingOption | null>(null);

  const selectOption = useCallback((option: CostingOption) => {
    setSelectedOption(option);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedOption) {
      // Navigate to product details with costing option in URL
      navigate(`/inventory/create-new/details?costing=${selectedOption}`);
    }
  }, [navigate, selectedOption]);

  const handleBack = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  return {
    selectedOption,
    selectOption,
    handleContinue,
    handleBack,
    canContinue: selectedOption !== null,
  };
}
