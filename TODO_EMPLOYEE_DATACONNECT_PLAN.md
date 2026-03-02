# Employee Data Connect Integration Plan

## Current Status
- Firebase Data Connect connection is established
- Employee schema exists in dataconnect/schema/schema.gql
- SDK generation has schema conflicts with prelude
- Existing Firestore employee service works

## Goal
Integrate Firebase Data Connect for PostgreSQL-based employee data persistence with proper service layer.

## Plan

### Phase 1: Fix Schema & Generate SDK
- [ ] Simplify schema to use @table only (Data Connect auto-generates CRUD)
- [ ] Resolve prelude conflict for Query/Mutation
- [ ] Successfully generate SDK

### Phase 2: Create Data Connect Service Layer
- [ ] Create employee data connect service (src/api/dataconnect/employeeService.ts)
- [ ] Create TypeScript types matching schema
- [ ] Implement CRUD operations using generated SDK patterns

### Phase 3: Update Employee Module Integration
- [ ] Update useEmployeeFormViewModel to use Data Connect service
- [ ] Update useEmployeeListViewModel to fetch from Data Connect
- [ ] Ensure proper error handling and loading states

### Phase 4: Testing & Verification
- [ ] Test employee creation flow
- [ ] Test employee list loading on app start
- [ ] Verify data persists correctly
