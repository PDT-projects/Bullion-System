# Inventory Costing - Multi-Model Support Implementation Plan

## Overview
Transform the inventory costing entry to support multiple models per brand with real-time landed cost calculations in PKR.

---

## Phase 1: Data Models & Types (Step 1)

### 1.1 Update TypeScript Interfaces
**File:** `src/modules/inventory/models/types.ts`

- [ ] Create new interface `CostingModel` for individual model entries
  - modelName: string
  - units: number
  - unitCostUSD: number
  - totalCostUSD: number (calculated)
  - percentage: number (calculated)
  - customPerModel: number (calculated)
  - customPerUnit: number (calculated)
  - freightPerModel: number (calculated)
  - freightPerUnit: number (calculated)
  - unitCostPKR: number (calculated)
  - totalLandedUnitCost: number (calculated)
  - totalShipmentValuePKR: number (calculated)

- [ ] Update `CostingInfo` interface to include:
  - usdRate: number
  - totalCustomsValue: number
  - totalFreightValue: number
  - models: CostingModel[] (array for multiple models)
  - shipmentTotalUSD: number (calculated)
  - consignmentValue: number (calculated)
  - totalValueOfBrand: number (calculated)

- [ ] Update `ProductFormData` with new costing structure

---

## Phase 2: Mathematical Engine (Step 2)

### 2.1 Create Calculation Utility Functions
**File:** `src/modules/inventory/models/costingCalculator.ts` (new file)

- [ ] Create `calculateModelCosts(model, shipmentTotalUSD, usdRate, totalCustomsValue, totalFreightValue)` function
- [ ] Create `calculateBrandSummary(models[], usdRate, totalCustomsValue, totalFreightValue)` function
- [ ] Implement division-by-zero protection
- [ ] Implement currency formatting (2 decimal places)

### 2.2 Calculation Logic (per model)
```
For each model:
1. totalCostUSD = units * unitCostUSD
2. percentage = (shipmentTotalUSD > 0) ? totalCostUSD / shipmentTotalUSD : 0
3. customPerModel = percentage * totalCustomsValue
4. customPerUnit = (units > 0) ? customPerModel / units : 0
5. freightPerModel = percentage * totalFreightValue
6. freightPerUnit = (units > 0) ? freightPerModel / units : 0
7. unitCostPKR = unitCostUSD * usdRate
8. totalLandedUnitCost = unitCostPKR + customPerUnit + freightPerUnit
9. totalShipmentValuePKR = totalLandedUnitCost * units
```

### 2.3 Brand Summary Calculations
```
shipmentTotalUSD = Sum of all models' totalCostUSD
consignmentValue = shipmentTotalUSD * usdRate
totalValueOfBrand = consignmentValue + totalCustomsValue + totalFreightValue
```

---

## Phase 3: ViewModel State Management (Step 3)

### 3.1 Update useInventoryProductDetailsViewModel
**File:** `src/modules/inventory/viewModels/useInventoryProductDetailsViewModel.ts`

- [ ] Replace single-model costing state with models array
- [ ] Add global inputs: usdRate, totalCustomsValue, totalFreightValue
- [ ] Add setter functions for global inputs
- [ ] Add model management functions:
  - addModel()
  - updateModel(index, field, value)
  - removeModel(index)
- [ ] Implement recalculateAll() function
- [ ] Add useEffect to recalculate when any input changes

### 3.2 State Structure
```
typescript
{
  costing: {
    usdRate: number,
    totalCustomsValue: number,
    totalFreightValue: number,
    models: CostingModel[],
    // calculated
    shipmentTotalUSD: number,
    consignmentValue: number,
    totalValueOfBrand: number
  }
}
```

---

## Phase 4: UI Components (Step 4)

### 4.1 Create CostingTable Component
**File:** `src/modules/inventory/views/components/CostingTable.tsx` (new)

- [ ] Table with columns: Model Name, Units, Unit Cost (USD), Total Cost (USD), %, Custom/Unit, Freight/Unit, Unit Cost (PKR), Landed Cost, Total Value
- [ ] "Add Model" button
- [ ] Delete row button per model
- [ ] Real-time input fields

### 4.2 Create GlobalInputs Component  
**File:** `src/modules/inventory/views/components/CostingGlobalInputs.tsx` (new)

- [ ] USD Rate input
- [ ] Total Customs Value input
- [ ] Total Freight Value input

### 4.3 Create BrandSummary Component
**File:** `src/modules/inventory/views/components/BrandSummary.tsx` (new)

- [ ] Display shipmentTotalUSD
- [ ] Display consignmentValue
- [ ] Display totalValueOfBrand

### 4.4 Update InventoryProductDetailsView
**File:** `src/modules/inventory/views/InventoryProductDetailsView.tsx`

- [ ] Replace existing costing fields with new components
- [ ] Integrate CostingGlobalInputs
- [ ] Integrate CostingTable
- [ ] Integrate BrandSummary

---

## Phase 5: Navigation & Data Flow (Step 5)

### 5.1 Update Payment ViewModel
**File:** `src/modules/inventory/viewModels/useInventoryPaymentViewModel.ts`

- [ ] Parse new costing structure from URL params
- [ ] Include all model data in product creation
- [ ] Handle navigation back with full model data

### 5.2 Update Product Details ViewModel Navigation
**File:** `src/modules/inventory/viewModels/useInventoryProductDetailsViewModel.ts`

- [ ] Serialize models array to URL params
- [ ] Include all calculated fields in navigation

---

## Phase 6: Firebase Data Connect Backend (Step 6)

### 6.1 Update GraphQL Schema
**File:** `dataconnect/inventory/schema.gql`

- [ ] Add CostingModel type to schema
- [ ] Update Inventory type with nested costing structure

### 6.2 Update GQL Operations
**Files:** 
- `dataconnect/inventory/inventory_queries.gql`
- `dataconnect/inventory/inventory_mutations.gql`

- [ ] Update queries for new structure
- [ ] Update mutations for nested models

### 6.3 Regenerate Data Connect SDK
- [ ] Run dataconnect generate command
- [ ] Verify generated types

### 6.4 Update InventoryDataConnectService
**File:** `src/api/dataconnect/inventoryDataConnectService.ts`

- [ ] Update createProduct to handle multiple models
- [ ] Update fetchProducts to return costing data

---

## Phase 7: Testing & Validation (Step 7)

### 7.1 Manual Testing
- [ ] Test adding multiple models
- [ ] Test real-time calculations
- [ ] Test deletion with recalculation
- [ ] Test division by zero handling
- [ ] Test currency formatting
- [ ] Test Firebase Data Connect save/retrieve

---

## Dependencies

### New npm packages: None required (using existing utilities)

### Existing Files to Modify:
1. `src/modules/inventory/models/types.ts`
2. `src/modules/inventory/viewModels/useInventoryProductDetailsViewModel.ts`
3. `src/modules/inventory/viewModels/useInventoryPaymentViewModel.ts`
4. `src/modules/inventory/views/InventoryProductDetailsView.tsx`

### New Files to Create:
1. `src/modules/inventory/models/costingCalculator.ts`
2. `src/modules/inventory/views/components/CostingGlobalInputs.tsx`
3. `src/modules/inventory/views/components/CostingTable.tsx`
4. `src/modules/inventory/views/components/BrandSummary.tsx`

### Backend Files to Modify:
1. `dataconnect/inventory/schema.gql`
2. `dataconnect/inventory/inventory_queries.gql`
3. `dataconnect/inventory/inventory_mutations.gql`
4. `src/api/dataconnect/inventoryDataConnectService.ts`

---

## Follow-up Steps

1. Approve this plan
2. Begin Phase 1: Update TypeScript types
3. Continue through each phase sequentially
4. Run tests at Phase 7
5. Deploy to Firebase
