// Inventory Module - Wrapper Layer
// DeletedInventoryWrapper
// Route wrapper — same pattern as every other wrapper in this module.
// routes.tsx imports this from './modules/inventory' and renders it at
// /inventory/deleted

import React from 'react';
import { DeletedInventoryPage } from '../pages/DeletedInventoryPage';

export function DeletedInventoryWrapper() {
  return <DeletedInventoryPage />;
}