# Employee DataConnect Fix Progress

## Completed ✅
- [x] Created dataconnect/employees/employees.gql (queries)
- [x] Created dataconnect/employees/employees_mutations.gql (mutations)  
- [x] Updated dataconnect/dataconnect.yaml (added employees to connectorDirs)
- [x] Fixed employeeDataConnectService.ts import to '@erp-system/employees'

## Next Steps ⏳
1. **Regenerate SDK**: Run SDK generation command
2. **Restart DataConnect Emulator**: `start-emulator.ps1` or `firebase emulators:start`
3. **Restart dev server**: `npm run dev`
4. **Test**: Navigate to employees page, add/fetch employees

## Commands to run:
```
# Generate SDK (check regenerate-sdk.ps1 or use CLI)
./regenerate-sdk.ps1

# Or Firebase CLI:
npx firebase dataconnect:sdk-generate

# Restart emulator if running
# Ctrl+C then start-emulator.ps1

# Dev server
npm run dev
```

