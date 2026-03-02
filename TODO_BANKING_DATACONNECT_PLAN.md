# Banking Module - Firebase Data Connect Implementation Plan

## Overview
Implement Firebase Data Connect for the complete Banking Module including:
1. Bank Accounts Management
2. Cash In Hand Management
3. Bank Transfers

## Current State
- **Employee Module**: Already implemented with Data Connect ✓
- **Banking Module**: Currently using Firebase Firestore (need to migrate to Data Connect)

## Information Gathered

### Banking Types (src/modules/banking/models/types.ts)
- `Bank`: id, name, accountNumber, balance
- `BankTransfer`: id, date, fromBankId, fromBankName, toBankId, toBankName, amount, note
- `CashTransaction`: id, date, company, mainCategory (Cash Inflow/Cash Outflow), subCategory, amount, mode, note

### Banking Services (Current Firestore)
- `BankFirebaseService`: CRUD for banks, balance updates
- `CashFirebaseService`: CRUD for cash records, balance adjustments

### Data Connect Structure (Employee Reference)
- Schema: `dataconnect/schema/schema.gql` - defines PostgreSQL tables
- Connector: `dataconnect/example/` - defines queries and mutations
- Generated SDK: `src/dataconnect-generated/`

## Plan

### Phase 1: Schema Design
- [ ] 1.1 Create new schema file `dataconnect/schema/banking_schema.gql` with:
  - `Bank` table: id, name, accountNumber, balance, createdAt, updatedAt
  - `BankTransfer` table: id, date, fromBankId, fromBankName, toBankId, toBankName, amount, note, createdAt
  - `CashTransaction` table: id, date, company, mainCategory, subCategory, amount, mode, note, createdAt
- [ ] 1.2 Update `dataconnect/dataconnect.yaml` to include new tables

### Phase 2: Create Connectors
- [ ] 2.1 Create `dataconnect/banking/bank_connector.yaml` for Bank operations
- [ ] 2.2 Create `dataconnect/banking/bank_queries.gql`:
  - listBanks query
  - getBankById query
- [ ] 2.3 Create `dataconnect/banking/bank_mutations.gql`:
  - bankInsert mutation
  - bankUpdate mutation
  - bankDelete mutation
- [ ] 2.4 Create `dataconnect/banking/transfer_connector.yaml` for Transfer operations
- [ ] 2.5 Create `dataconnect/banking/transfer_queries.gql`:
  - listTransfers query
  - getTransferById query
- [ ] 2.6 Create `dataconnect/banking/transfer_mutations.gql`:
  - transferInsert mutation (includes balance updates)
- [ ] 2.7 Create `dataconnect/banking/cash_connector.yaml` for Cash operations
- [ ] 2.8 Create `dataconnect/banking/cash_queries.gql`:
  - listCashTransactions query
  - getCashTransactionById query
- [ ] 2.9 Create `dataconnect/banking/cash_mutations.gql`:
  - cashTransactionInsert mutation

### Phase 3: Generate SDKs
- [ ] 3.1 Run Firebase Data Connect SDK generation
- [ ] 3.2 Configure output directories for banking SDKs:
  - Bank SDK: `@erp-system/banking`
  - Transfer SDK: `@erp-system/transfers`
  - Cash SDK: `@erp-system/cash`

### Phase 4: Create Data Connect Services
- [ ] 4.1 Create `src/api/dataconnect/bankDataConnectService.ts`:
  - fetchAllBanks(), fetchBankById()
  - createBank(), updateBank(), deleteBank()
  - updateBankBalance()
- [ ] 4.2 Create `src/api/dataconnect/transferDataConnectService.ts`:
  - fetchAllTransfers(), fetchTransferById()
  - createTransfer() (with atomic balance updates)
- [ ] 4.3 Create `src/api/dataconnect/cashDataConnectService.ts`:
  - fetchAllCashTransactions()
  - createCashTransaction()
  - updateCashBalance()

### Phase 5: Update Index Exports
- [ ] 5.1 Update `src/api/dataconnect/index.ts` to export new services

### Phase 6: Integrate with ViewModels
- [ ] 6.1 Update `src/modules/banking/viewModels/useBankListViewModel.ts`
- [ ] 6.2 Update `src/modules/banking/viewModels/useBankFormViewModel.ts`
- [ ] 6.3 Update `src/modules/banking/viewModels/useBankDeleteViewModel.ts`
- [ ] 6.4 Update `src/modules/banking/viewModels/useTransferListViewModel.ts`
- [ ] 6.5 Update `src/modules/banking/viewModels/useTransferFormViewModel.ts`
- [ ] 6.6 Update `src/modules/banking/viewModels/useCashListViewModel.ts`
- [ ] 6.7 Update `src/modules/banking/viewModels/useCashFormViewModel.ts`

## Dependent Files to be Edited
- `dataconnect/schema/schema.gql` - Add banking tables
- `dataconnect/dataconnect.yaml` - Update configuration
- New files to create:
  - `dataconnect/banking/bank_connector.yaml`
  - `dataconnect/banking/bank_queries.gql`
  - `dataconnect/banking/bank_mutations.gql`
  - `dataconnect/banking/transfer_connector.yaml`
  - `dataconnect/banking/transfer_queries.gql`
  - `dataconnect/banking/transfer_mutations.gql`
  - `dataconnect/banking/cash_connector.yaml`
  - `dataconnect/banking/cash_queries.gql`
  - `dataconnect/banking/cash_mutations.gql`
  - `src/api/dataconnect/bankDataConnectService.ts`
  - `src/api/dataconnect/transferDataConnectService.ts`
  - `src/api/dataconnect/cashDataConnectService.ts`
  - `src/api/dataconnect/index.ts`

## Followup Steps
- Run `firebase dataconnect:sdk:generate` to regenerate SDKs
- Test each connector with GraphQL queries
- Verify data persists in PostgreSQL emulator
- Update ViewModels to use new Data Connect services
