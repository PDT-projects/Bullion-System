# Receivable Stock Integration - Progress Tracker

## Completed (0/12)
- [x] 1. Extend inventory schema with receivable fields/queries
- [x] 2. Update dataconnect/inventory/inventory_mutations.gql for receivable insert/update
- [x] 3. Update src/modules/inventory/models/types.ts with ReceivableProduct type
- [x] 4. Update src/modules/bills/models/types.ts to include inventoryItems[]
- [x] 5. Implement src/api/dataconnect/inventoryDataConnectService.ts receivable methods
- [ ] 6. Update src/modules/bills/views/BillsListView.tsx - Add "Convert to Receivable" for pending bills
- [ ] 7. Update src/modules/bills/models/billsService.ts - Add convertToReceivable() method
- [ ] 8. Create src/modules/inventory/views/ReceivableStockView.tsx + list table
- [ ] 9. Create useReceivableStockViewModel.ts + service calls
- [ ] 10. Update src/modules/inventory/views/CreateInventoryView.tsx - Add "From Pending Bill" option
- [ ] 11. Update useInventoryListViewModel.ts - Add receivable tab/filter
- [ ] 12. Add route to src/routes.tsx + regenerate SDK

## Post-Implementation
- Run `regenerate-sdk.ps1`
- Test flow: Bills → Receivable → Receive → Inventory
- Deploy DataConnect: `deploy-dataconnect-fixed.ps1`

**Next Step: 1. Schema updates**

