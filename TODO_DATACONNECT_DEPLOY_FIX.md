# Firebase Data Connect Deployment Fix Plan

## Objective
Fix the Firebase Data Connect initialization error and ensure schema is deployed and SDKs are regenerated.

## Current Status
- ✅ `dataconnect/dataconnect.yaml` exists
- ✅ `firebase.json` configured
- ✅ Schema exists in `dataconnect/schema/schema.gql`
- ✅ Generated SDKs exist in `src/dataconnect-generated/`
- ✅ DEPLOYMENT COMPLETED - Schema deployed to Firebase Cloud
- ✅ SDK GENERATED - SDKs regenerated successfully (2026-03-11 12:35 PM)

## Root Cause
The error "no dataconnect.yaml file detected" was misleading. The real issue:
1. Project has Data Connect configured locally
2. But schema has NOT been deployed to Firebase Cloud
3. SDKs need to be regenerated after deployment

## Recommended Solution: Deploy Schema → Regenerate SDK

### Step 1: Deploy Data Connect Schema to Firebase
```bash
npx firebase-tools dataconnect:services:deploy --project erp-system-baacb
```

Or deploy all:
```bash
npx firebase-tools deploy --only dataconnect --project erp-system-baacb
```

### Step 2: Regenerate SDKs after deployment
```bash
npx firebase-tools dataconnect:sdk:generate --project erp-system-baacb
```

## Alternative: If Step 1 fails

If deployment fails, check:
1. Firebase CLI version (should be 13.0+ for Data Connect)
2. Run `npx firebase-tools login` to ensure authenticated
3. Verify project ID `erp-system-baacb` exists in Firebase Console

## Expected Outcome
- Schema deployed to Firebase Cloud SQL
- Connectors (banking, loans, budgets, inventory) available
- SDKs regenerated with latest types
- Application can query/mutate data via generated SDKs

