// Inventory Module - ViewModel Layer
// useInventoryCostingOptionViewModel - Step 2: Choose costing option

import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CostingOption } from '../models/types';

export interface UseInventoryCostingOptionViewModelReturn {
  selectedOption: CostingOption | null;
  selectOption: (option: CostingOption) => void;
  handleContinue: () => void;
  handleBack: () => void;
  canContinue: boolean;
}

export function useInventoryCostingOptionViewModel(): UseInventoryCostingOptionViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<CostingOption | null>(null);
  const inventoryType = searchParams.get('type') || 'in-stock';

  const selectOption = useCallback((option: CostingOption) => setSelectedOption(option), []);

  const handleContinue = useCallback(() => {
    if (!selectedOption) return;
    if (selectedOption === 'with') {
      navigate(`/inventory/create-new/costing-details?type=${inventoryType}&costing=${selectedOption}`);
    } else {
      navigate(`/inventory/create-new/details?type=${inventoryType}&costing=${selectedOption}`);
    }
  }, [navigate, selectedOption, inventoryType]);

  const handleBack = useCallback(() => navigate('/inventory/create-new'), [navigate]);

  return { selectedOption, selectOption, handleContinue, handleBack, canContinue: selectedOption !== null };
}