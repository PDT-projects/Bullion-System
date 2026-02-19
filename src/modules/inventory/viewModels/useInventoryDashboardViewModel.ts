// Inventory Module - ViewModel Layer
// useInventoryDashboardViewModel - Business logic for inventory entry dashboard

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Return type for useInventoryDashboardViewModel
 */
interface UseInventoryDashboardViewModelReturn {
  // Navigation actions
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
}

/**
 * ViewModel hook for Inventory Dashboard page
 * Simple navigation hub for inventory entry options
 */
export function useInventoryDashboardViewModel(): UseInventoryDashboardViewModelReturn {
  const navigate = useNavigate();

  /**
   * Navigate to create new inventory page
   */
  const onAddNewInventory = useCallback(() => {
    navigate('/inventory/create-new');
  }, [navigate]);

  /**
   * Navigate to add to existing inventory page
   */
  const onAddToExisting = useCallback(() => {
    navigate('/inventory/add-existing');
  }, [navigate]);

  /**
   * Navigate to receivable stock page
   */
  const onViewReceivable = useCallback(() => {
    navigate('/inventory/receivable');
  }, [navigate]);

  /**
   * Navigate to view inventory page
   */
  const onViewInventory = useCallback(() => {
    navigate('/inventory/view');
  }, [navigate]);

  return {
    onAddNewInventory,
    onAddToExisting,
    onViewReceivable,
    onViewInventory
  };
}
