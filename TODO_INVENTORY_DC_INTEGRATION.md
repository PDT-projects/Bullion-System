# TODO_INVENTORY_DC_INTEGRATION.md
## Inventory DataConnect Integration - Costing → Product Details Flow

**Status: [IN PROGRESS]**

### Phase 1: DataConnect Service Enhancements
- [x] ✅ **Step 1.1**: Enhance `src/api/dataconnect/brandModelDataConnectService.ts`
  - Add `saveCostingToDataConnect(costingInfo)` → create brand → create models → return `{brandId, modelIds[]}`
  - Add `fetchBrandsWithModels()` → join brands+models for dropdowns
  - Add duplicate check logic
  - Add `saveCostingToDataConnect(costingInfo)` → create brand → create models → return `{brandId, modelIds[]}`
  - Add `fetchBrandsWithModels()` → join brands+models for dropdowns
  - Add duplicate check logic

### Phase 2: Costing Screen → DC Persistence
- [ ] **Step 2.1**: Update `useInventoryCostingDetailsViewModel.ts`
  - Import service, call `saveCostingToDataConnect()` in `handleNext()`
  - Pass `brandId, modelIds` via URL params instead of full JSON
- [ ] **Step 2.2**: Minor UI update `InventoryCostingDetailsView.tsx` (success message)

### Phase 3: Product Details → DC Dropdowns + Multi-Model
- [x] **Step 3.1**: Create `src/modules/inventory/components/BrandModelDropdown.tsx`
  - Brand Combobox (fetch + add new)
  - Model Combobox (per brand + add new)
  - Brand Combobox (fetch + add new)
  - Model Combobox (per brand + add new)
- [ ] **Step 3.2**: Update `useInventoryProductDetailsViewModel.ts`
  - Fetch/parse `brandId, modelIds` from URL params
  - Load initial selected models + costing
  - Add multi-model state + sale price override
- [ ] **Step 3.3**: Update `InventoryProductDetailsView.tsx`
  - Replace mock dropdowns with real components
  - Add MultiModelTable: Model | Cost | Sale Price | Qty

### Phase 4: Firebase Save + View Inventory
- [ ] **Step 4.1**: Create/Update `src/modules/inventory/models/inventoryFirebaseService.ts`
  - `saveProduct(product)` with `brandId`, `modelIds`, `modelsData[]`
- [ ] **Step 4.2**: Update `useInventoryPaymentViewModel.ts` → call Firebase save
- [ ] **Step 4.3**: Update `useInventoryListViewModel.ts` + `InventoryListView_updated.tsx`
  - Display linked brand/model/costing data

### Phase 5: Testing & Regeneration
- [ ] **Step 5.1**: Regenerate SDK → `./regenerate-sdk.ps1`
- [ ] **Step 5.2**: E2E test full flow
- [ ] **Step 5.3**: Fix styling/edge cases

**Next Step: 2.2 - Update InventoryCostingDetailsView.tsx UI**

