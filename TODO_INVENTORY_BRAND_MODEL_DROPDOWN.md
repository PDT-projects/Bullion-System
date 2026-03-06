# Inventory Brand/Model Dropdown Integration Plan

## Progress Tracking

### Step 1: Update Schema (dataconnect/schema/schema.gql)
- [x] Add Brand table with id, name, category
- [x] Add Model table with id, brandId (FK), name, category
- [x] Add optional brandId, modelId fields to Product table
- [x] Add optional costingId field to Product table (for linking to costing)

### Step 2: Create GraphQL Operations
- [x] Create brand_queries.gql - listBrands, getBrandById
- [x] Create model_queries.gql - listModels, listModelsByBrand, getModelById
- [x] Create brand_mutations.gql - createBrand, updateBrand, deleteBrand
- [x] Create model_mutations.gql - createModel, updateModel, deleteModel

### Step 3: Update Connector Config
- [x] Update dataconnect/inventory/connector.yaml if needed (No changes needed - Firebase DC auto-picks up .gql files)

### Step 4: Regenerate Data Connect SDK
- [x] Run Firebase DC generate command

### Step 5: Update brandModelDataConnectService.ts
- [x] Implement actual fetchBrands using new SDK
- [x] Implement actual fetchModelsByBrand using new SDK
- [x] Added CRUD operations for Brand and Model

### Step 6: Update UI Components
- [x] Create BrandModelSelector component with cascading dropdowns
- [x] Update CreateInventoryView to use dropdowns
- [x] Add "Add Costing" feature for existing products

### Step 7: Add "Add Costing" Feature
- [ ] Update Product type with optional costingId
- [ ] Create InventoryCostingOptionView modal for linking existing items
- [ ] Update InventoryListView to show "Add Costing" button

---

## Implementation Notes

### Backward Compatibility
- All new fields (brandId, modelId, costingId) must be optional
- Existing products without costing must continue to work
- Brand/model dropdowns should allow free text entry as fallback

### Firebase Data Connect Compatibility
- New GraphQL queries must support pagination
- Follow existing naming conventions (listX, getXById, XInsert, XUpdate, XDelete)

### UI Behavior
- Brand dropdown: fetch all brands from Firebase Data Connect
- Model dropdown: load models only for selected brand
- When model selected, fetch and display costing details
- User only enters sale price and quantity

