# TODO: Add Device Creation Routing from Invoice

## Task
In invoices, when creating new invoice, add routing to create new device and separate the code from invoices too.

## Plan

### Step 1: Create Device Types
- [ ] Add Device type in App.tsx or create separate types file

### Step 2: Create Device Creation Page
- [ ] Create `src/pages/devices/CreateDevicePage.tsx`
- [ ] Create a simplified form for adding new device with serial numbers

### Step 3: Add Routing
- [ ] Add route in `src/routes.tsx` for `/devices/new`
- [ ] Include route params for return URL

### Step 4: Update CreateInvoicePage
- [ ] Add "Create New Device" button in products section
- [ ] Handle navigation to device creation page
- [ ] Handle return from device creation with new device selected

### Step 5: Test and Verify
- [ ] Test creating device from invoice page
- [ ] Verify device appears in product list after creation
