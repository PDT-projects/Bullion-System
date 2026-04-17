// Inventory Module - ViewModel Layer
// useInventoryDashboardViewModel - Navigation hub for inventory entry options

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseInventoryDashboardViewModelReturn {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
  onProductTransfer: () => void;
}

export function useInventoryDashboardViewModel(): UseInventoryDashboardViewModelReturn {
  const navigate = useNavigate();

  const onAddNewInventory = useCallback(() => navigate('/inventory/create-new'), [navigate]);
  const onAddToExisting = useCallback(() => navigate('/inventory/add-existing'), [navigate]);
  const onViewReceivable = useCallback(() => navigate('/inventory/receivable'), [navigate]);
  const onViewInventory = useCallback(() => navigate('/inventory/view'), [navigate]);
  const onProductTransfer = useCallback(() => navigate('/product-transfer'), [navigate]);

  return { onAddNewInventory, onAddToExisting, onViewReceivable, onViewInventory, onProductTransfer };
}
