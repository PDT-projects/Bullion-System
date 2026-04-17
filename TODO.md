# Inventory Refactoring TODO

## Overview
Rename \"Inventory Entry\" → \"Inventory\", add Product Transfer card to Inventory dashboard, remove Product Transfer from sidebar. No functionality changes.

Status: [ ] In Progress | [ ] Completed

## Step-by-Step Plan

### 1. Update Sidebar.tsx [Priority: High] ✅
   - Rename menu item: `{ id: 'inventory-entry', name: 'Inventory Entry' }` → `{ id: 'inventory-entry', name: 'Inventory' }`
   - Remove `{ id: 'product-transfer', name: 'Product Transfer', path: '/product-transfer' }`
   - Update SCREEN_PERMISSIONS: remove `'product-transfer': 'Product Transfer List',`
   - Keep `'inventory-entry': 'Inventory Dashboard',`

### 2. Update InventoryDashboardView.tsx Header [Priority: High] ✅
   - `<h2 className=\"text-3xl font-bold text-gray-900\">Inventory Entry</h2>` → `<h2 className=\"text-3xl font-bold text-gray-900\">Inventory</h2>`

### 3. Read & Update useInventoryDashboardViewModel.ts [Priority: Medium] ✅
   - Add `onProductTransfer: () => void` handler using `useNavigate() to '/product-transfer'`
   - Update InventoryDashboardWrapper to pass it to InventoryDashboardView

### 4. Add Product Transfer Card to InventoryDashboardView.tsx [Priority: High] ✅
   - Add new card object to `cards` array with title \"Product Transfer\", description, ArrowRightLeft icon, onClick: onProductTransfer
   - Match styling of existing cards (border-orange-200 etc.)

### 5. Update TopBar.tsx [Priority: Medium] ✅
   - `'inventory-entry': 'Inventory Entry',` → `'inventory-entry': 'Inventory',`
   - Remove `'product-transfer': 'Product Transfer',`

### 6. Global Text Updates [Priority: Low] ✅
   - Replace \"Back to Inventory Entry\" → \"Back to Inventory\" in:
     - src/modules/inventory/views/InventoryListView.tsx
     - src/modules/inventory/views/InventoryAddExistingView.tsx
   - Any other occurrences via search

### 7. Verify Permissions & No Breakage [Priority: High]
   - Check userService.ts Screen types if needed
   - Test navigation to /product-transfer from inventory card works
   - Sidebar shows only \"Inventory\" under Operations

### 8. Test & Complete
   - Run `npm run dev`
   - Verify: Sidebar clean, Inventory dashboard has 5 cards, Product Transfer accessible via card only
   - Mark complete

**Completed Steps:** 

