# Transactions Module MVVM Conversion Plan

## Scope
- Add Transaction (Create)
- Pending Payments (not salary/bills as they are separate modules)

## Steps to Complete

### Step 1: Create Module Directory Structure
- [ ] Create `src/modules/transactions/` directory
- [ ] Create `src/modules/transactions/models/` directory
- [ ] Create `src/modules/transactions/viewModels/` directory  
- [ ] Create `src/modules/transactions/views/` directory
- [ ] Create `src/modules/transactions/views/components/` directory

### Step 2: Create Types
- [ ] Create `src/modules/transactions/models/types.ts` - Transaction types (based on App.tsx Transaction type)
- [ ] Create `src/modules/transactions/models/transactionsService.ts` - Business logic service

### Step 3: Create ViewModels
- [ ] Create `src/modules/transactions/viewModels/useTransactionListViewModel.ts`
- [ ] Create `src/modules/transactions/viewModels/useTransactionFormViewModel.ts`
- [ ] Create `src/modules/transactions/viewModels/useTransactionDeleteViewModel.ts`
- [ ] Create `src/modules/transactions/viewModels/usePendingPaymentsViewModel.ts`

### Step 4: Create Views (UI exactly same as before)
- [ ] Create `src/modules/transactions/views/TransactionListView.tsx` (from TransactionsPage.tsx)
- [ ] Create `src/modules/transactions/views/TransactionFormView.tsx` (from CreateTransactionPage.tsx)
- [ ] Create `src/modules/transactions/views/TransactionEditView.tsx` (from EditTransactionPage.tsx)
- [ ] Create `src/modules/transactions/views/TransactionDeleteView.tsx` (from DeleteTransactionPage.tsx)
- [ ] Create `src/modules/transactions/views/PendingPaymentsView.tsx` (from PendingPayments.tsx)

### Step 5: Create Wrapper Components
- [ ] Create `src/modules/transactions/views/TransactionListWrapper.tsx`
- [ ] Create `src/modules/transactions/views/TransactionCreateWrapper.tsx`
- [ ] Create `src/modules/transactions/views/TransactionEditWrapper.tsx`
- [ ] Create `src/modules/transactions/views/TransactionDeleteWrapper.tsx`
- [ ] Create `src/modules/transactions/views/PendingPaymentsWrapper.tsx`

### Step 6: Create Module Index
- [ ] Create `src/modules/transactions/index.ts` - Public API exports

### Step 7: Update Routes
- [ ] Update `src/routes.tsx` to use new MVVM components

### Step 8: Cleanup
- [ ] Remove old pages from `src/pages/transactions/` (optional - can keep for reference)
