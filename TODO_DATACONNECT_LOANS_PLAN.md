# Firebase Data Connect Implementation Plan

## Phase 1: Rename CashTransaction → CashInHand
- [ ] Update dataconnect/schema/schema.gql - rename CashTransaction to CashInHand
- [ ] Update dataconnect/banking/cash_queries.gql - rename queries
- [ ] Update dataconnect/banking/cash_mutations.gql - rename mutations
- [ ] Update dataconnect.yaml - ensure connector reference
- [ ] Regenerate SDK
- [ ] Update src/api/dataconnect/cashDataConnectService.ts

## Phase 2: Create Loans Data Connect Backend
- [ ] Create dataconnect/loans/schema.gql - loans and loan_payments tables
- [ ] Create dataconnect/loans/connector.yaml
- [ ] Create dataconnect/loans/loan_queries.gql
- [ ] Create dataconnect/loans/loan_mutations.gql
- [ ] Create dataconnect/loans/payment_queries.gql
- [ ] Create dataconnect/loans/payment_mutations.gql
- [ ] Create src/api/dataconnect/loanDataConnectService.ts
- [ ] Create src/api/dataconnect/loanPaymentDataConnectService.ts
- [ ] Update src/api/dataconnect/index.ts

## Phase 3: Update Loans Module
- [ ] Update src/modules/loans/models/loanService.ts to use Data Connect
- [ ] Update viewModels to use new service
