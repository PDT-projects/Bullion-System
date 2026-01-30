# Historical Balance Viewing Feature Implementation

## Overview
Add functionality to view bank balance history by selecting a specific date, showing how much balance was available on that date.

## Tasks

### 1. Update Bank Interface and Data Structure
- [x] Add `balanceHistory` array to Bank interface with structure: `{date: string, balance: number, transaction: string, type: 'initial' | 'transfer' | 'transaction' | 'salary' | 'loan' | 'payment'}`
- [x] Initialize balance history for existing banks with initial balance entries

### 2. Modify Banks.tsx Component
- [x] Add balance history recording for bank transfers
- [x] Add date picker component for historical date selection
- [x] Implement `calculateHistoricalBalance(bankId: number, targetDate: string)` function
- [x] Add "View Historical Balance" UI section with date picker and balance display
- [x] Update transfer logic to record history entries

### 3. Update Transaction Components
- [x] Modify `src/components/Transactions.tsx` to record balance history on inflow/outflow
- [ ] Modify `src/components/Salary.tsx` to record balance history on salary payments
- [ ] Modify `src/components/LoansPayable.tsx` to record balance history on loan payments
- [ ] Modify `src/components/Loans.tsx` to record balance history on loan disbursements
- [ ] Modify `src/components/PendingPayments.tsx` to record balance history on payments

### 4. Testing and Validation
- [ ] Test historical balance calculations for various dates
- [ ] Verify history recording works across all transaction types
- [ ] Test date picker functionality and edge cases
- [ ] Ensure backward compatibility with existing functionality

### 5. UI/UX Enhancements
- [ ] Add visual indicators for historical vs current balances
- [ ] Improve date picker styling and user experience
- [ ] Add loading states for historical calculations if needed
