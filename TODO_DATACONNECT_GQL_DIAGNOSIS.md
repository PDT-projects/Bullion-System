# Firebase Data Connect - GQL Files Diagnosis & Resolution Plan

## 📋 DIAGNOSIS SUMMARY

After analyzing all your `.gql` files, here are the findings:

---

## 🔴 ISSUES IDENTIFIED

### Issue 1: Inconsistent Naming Conventions (HIGH PRIORITY)

| File | Query Name | Issue |
|------|-----------|-------|
| `loans/loan_queries.gql` | `listLoans` | Uses camelCase |
| `banking/bank_queries.gql` | `listBanks` | Uses camelCase |
| `banking/cash_queries.gql` | `listCashInHand` | Uses camelCase (long) |
| `banking/transfer_queries.gql` | `listTransfers` | Uses camelCase |
| `budgets/budget_queries.gql` | `listBudgets` | Uses camelCase |
| `inventory/inventory_queries.gql` | `listProducts`, `listProductTransfers` | Uses camelCase |
| `example/employees.gql` | `ListEmployees` | Uses PascalCase ❌ |

**Problem**: Mixed naming conventions cause confusion and potential SDK issues.

---

### Issue 2: Hardcoded Default Values in Mutations (HIGH PRIORITY)

Example from `banking/bank_mutations.gql`:
```graphql
mutation bankInsert(
  $id: String! = "bank001"      # HARDCODED DEFAULT
  $name: String! = "Test Bank"   # HARDCODED DEFAULT
  $accountNumber: String! = "1234567890"  # HARDCODED DEFAULT
  $balance: Float! = 0.0         # HARDCODED DEFAULT
) @auth(level: PUBLIC) { ... }
```

**Problems Caused**:
1. **Console shows old test data** every time you run
2. **SDK conflicts** - default values can "leak" between calls
3. **Debug/test data persists** in autocomplete

**Affected Files**:
- `banking/bank_mutations.gql` - ALL mutations have defaults
- `banking/transfer_mutations.gql` - ALL mutations have defaults
- `banking/cash_mutations.gql` - ALL mutations have defaults

---

### Issue 3: Query/Operation Duplication (MEDIUM PRIORITY)

The console may show duplicate operations because:

1. **Same query name in multiple files** - NOT the case here (each is unique)
2. **Emulator caching old operations** - LIKELY THE ISSUE
3. **Multiple connector definitions** - Check `connector.yaml` files

---

### Issue 4: Console Variables Issue (MEDIUM PRIORITY)

**Expected Behavior**: 
- Query with defaults: `$limit: Int = 10` → Console should work without variables

**Your Experience**:
- Console requires explicit JSON even with defaults
- Greyed out Run button persists

**Root Cause**: Firebase Console bug, not your GQL files.

---

### Issue 5: Missing Variables in Inventory Queries (MEDIUM PRIORITY)

From `inventory/inventory_queries.gql`:
```graphql
query listProducts @auth(level: PUBLIC) { ... }  # NO VARIABLES!
query listProductTransfers @auth(level: PUBLIC) { ... }  # NO VARIABLES!
```

**Problem**: No pagination, no filtering - returns ALL records. This will cause performance issues with large datasets.

---

### Issue 6: Schema Location Issue (LOW PRIORITY)

Found: `loans/schema.gql` - EMPTY FILE (0 bytes)

This is unexpected. The main schema is in `schema/schema.gql`. The `loans/schema.gql` should either:
- Be deleted (if not needed)
- Have content (if it extends the main schema)

---

## ✅ WHAT IS CORRECT

1. **Query structure** - All queries use correct GraphQL syntax
2. **Variable syntax** - Uses `$` prefix correctly (not `:`)
3. **Auth directives** - All operations have `@auth(level: PUBLIC)`
4. **Main schema** - `schema/schema.gql` is complete with all types

---

## 📝 STEP-BY-STEP RESOLUTION PLAN

### Phase 1: Clean Up Hardcoded Defaults (CRITICAL)

**Action**: Remove ALL hardcoded default values from mutations

**Files to Fix**:
1. `banking/bank_mutations.gql`
2. `banking/transfer_mutations.gql`
3. `banking/cash_mutations.gql`

**Before**:
```graphql
mutation bankInsert(
  $id: String! = "bank001"
  $name: String! = "Test Bank"
) @auth(level: PUBLIC) { ... }
```

**After**:
```graphql
mutation bankInsert(
  $id: String!
  $name: String!
  $accountNumber: String!
  $balance: Float!
) @auth(level: PUBLIC) { ... }
```

**Risk**: Low - SDK will require variables, console will work properly
**Expected**: Console shows clean input fields, no stale test data

---

### Phase 2: Add Pagination to Inventory Queries (IMPORTANT)

**Action**: Add pagination variables to inventory queries

**File**: `inventory/inventory_queries.gql`

**Before**:
```graphql
query listProducts @auth(level: PUBLIC) { ... }
```

**After**:
```graphql
query listProducts(
  $limit: Int = 50
  $offset: Int = 0
) @auth(level: PUBLIC) {
  products(limit: $limit, offset: $offset, orderBy: { createdAt: DESC }) { ... }
}
```

**Risk**: Low - Improves performance
**Expected**: SDK returns paginated results

---

### Phase 3: Standardize Naming Convention (OPTIONAL)

**Action**: Choose one naming convention

**Recommended**: Use `list` prefix + PascalCase for consistency

| Current | Recommended |
|---------|-------------|
| `listLoans` | `ListLoans` |
| `listBanks` | `ListBanks` |
| `ListEmployees` | `ListEmployees` (already correct) |

**Risk**: Medium - Requires SDK regeneration and code updates
**Expected**: Consistent naming across console

---

### Phase 4: Delete Empty Schema File (OPTIONAL)

**Action**: Delete `loans/schema.gql` if empty

**Risk**: Low - Verify main schema still works first

---

### Phase 5: Console Workarounds (FOR FIREBASE BUG)

Since the Console has bugs:

**Option A**: Use Emulator + Local Testing
```bash
firebase emulators:start
# Test at localhost:9399
```

**Option B**: Use CLI for all operations
```bash
firebase dataconnect:execute <file> <operation> --vars @vars.json
```

**Option C**: Wait for Google to fix Console

---

## 🛡️ BEST PRACTICES FOR FUTURE

### 1. Never Use Hardcoded Defaults in GQL Files
```graphql
# ❌ BAD
mutation create($name: String! = "test") { ... }

# ✅ GOOD  
mutation create($name: String!) { ... }
```

### 2. Separate Debug/Console Queries
Create separate files for console-friendly operations:
```
dataconnect/
  loans/
    loan_queries.gql      # Production - variables required
    loan_queries_debug.gql  # Console-friendly - with defaults
```

### 3. Always Use Pagination
```graphql
query listItems($limit: Int = 20, $offset: Int = 0) {
  items(limit: $limit, offset: $offset) { ... }
}
```

### 4. Regenerate SDK After GQL Changes
```bash
firebase dataconnect:sdk:generate
```

### 5. Clear Emulator Data for Fresh Start
```bash
# Stop emulator, then:
rm -rf dataconnect/.dataconnect/pgliteData
firebase emulators:start
```

---

## 📊 EXPECTED OUTCOMES

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Remove mutation defaults | Console shows clean inputs |
| 2 | Add pagination to inventory | Better performance |
| 3 | Standardize naming | Consistent console display |
| 4 | Delete empty file | Cleaner project |
| 5 | Use emulator/CLI | Reliable operations |

---

## ⚠️ POTENTIAL RISKS

1. **SDK Breaking Changes**: Removing defaults may require code updates where mutations are called
2. **Pagination Changes**: Inventory components need to handle pagination params
3. **Naming Changes**: If you change query names, SDK function names change

---

## 🚀 RECOMMENDED ORDER

1. **First**: Phase 1 - Remove hardcoded defaults (biggest impact)
2. **Second**: Phase 2 - Add pagination to inventory
3. **Third**: Phase 3 - Naming (if you want)
4. **Ongoing**: Use CLI/emulator instead of Console

---

## 📌 APPROVAL NEEDED

Please review and confirm which phases to implement:

- [ ] Phase 1: Remove mutation defaults
- [ ] Phase 2: Add pagination to inventory
- [ ] Phase 3: Standardize naming
- [ ] Phase 4: Delete empty schema file

Once approved, I'll implement the changes and provide updated files.

