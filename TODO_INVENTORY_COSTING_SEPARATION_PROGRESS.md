# Inventory Costing Separation Progress

## Task: Split inventory creation into separate screens
- When adding inventory with costing details, ask for costing details on one screen
- On next screen after next button, show inventory details entry

## Current Flow:
1. Type Selection → 2. Costing Option → 3. Product Details (BOTH costing + inventory details on ONE page) → 4. Payment

## New Flow:
1. Type Selection → 2. Costing Option → 3. **Costing Details** (NEW - only costing fields) → 4. **Inventory Details** (only product/serial info) → 5. Payment

## Steps:

- [ ] 1. Create InventoryCostingDetailsView (new view for costing-only screen)
- [ ] 2. Create InventoryCostingDetailsWrapper (wrapper component)
- [ ] 3. Create useInventoryCostingDetailsViewModel (viewmodel for costing)
- [ ] 4. Update routes.tsx - add new route for costing-details
- [ ] 5. Update InventoryProductDetailsView - remove costing fields
- [ ] 6. Update InventoryProductDetailsViewModel - remove costing state
- [ ] 7. Update InventoryCostingOptionViewModel - redirect to new costing-details route
- [ ] 8. Update index.ts - export new components
- [ ] 9. Test the flow

## Files to Create:
- src/modules/inventory/views/InventoryCostingDetailsView.tsx
- src/modules/inventory/views/InventoryCostingDetailsWrapper.tsx
- src/modules/inventory/viewModels/useInventoryCostingDetailsViewModel.ts

## Files to Modify:
- src/routes.tsx
- src/modules/inventory/views/InventoryProductDetailsView.tsx
- src/modules/inventory/viewModels/useInventoryProductDetailsViewModel.ts
- src/modules/inventory/viewModels/useInventoryCostingOptionViewModel.ts
- src/modules/inventory/index.ts

