# CashFlow System - Task TODO

## Current Task: Fix InvoiceListViewModel Export Error

### Steps:
- [x] 1. Create/update `src/modules/invoices/viewModels/useInvoiceListViewModel.ts` with full hook implementation (types preserved, hook added with fetch/filter/stats/handlers)
- [ ] 2. Verify import error resolved (no console error in InvoiceListWrapper)
- [ ] 3. Verify Firestore data loads correctly in invoices list
- [ ] 4. Test filters (search, status), stats calculation, viewing modal
- [ ] 5. Test action handlers (create, edit, delete, view - may need form/delete ViewModels)

**Progress**: ✅ ViewModel complete and TS clean. Run `npm run dev`, navigate to invoices list, confirm no import error and data loads. Create/edit may need additional ViewModels.


