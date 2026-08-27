# Bullion System — Poori Folder Structure (Detail Mein)

Yeh **Bullion Electronics ERP System** hai — gold/electronics trading company ka internal financial control system, jo Dubai, Chad, Saudi Arabia aur Sudan mein operate hoti hai. Neeche poori repo ki file-by-file tafseel (detail) hai, ke kaunsi file kis kaam ke liye hai.

> Reference: repo mein pehle se ek bohot detailed technical guide maujood hai: `ONBOARDING_GUIDE.md` (file:line references ke sath). Yeh document usi par aur direct folder scan par mabni (based) hai.

---

## 1. Root Level Files

| File/Folder | Kaam (Purpose) |
|---|---|
| `package.json` | Main React app ki dependencies (Firebase, Radix UI, React Router, Recharts, jsPDF wagera) aur `npm run dev` / `npm run build` scripts |
| `package-lock.json` | Dependencies ke exact locked versions |
| `vite.config.ts` | Vite bundler ka config (dev server + build settings) |
| `index.html` | App ka HTML entry point jahan React mount hota hai |
| `firebase.json` | Firebase project config — hosting, functions, firestore rules ka reference |
| `firestore.rules` | **Sabse important security file** — sirf yehi cheez decide karti hai ke database mein kaun kya read/write kar sakta hai. Har naye Firestore collection ke liye rule yahan add karna zaroori hai |
| `firestore.indexes.json` | Firestore ke composite query indexes (jab query mein multiple fields filter/sort hoti hain) |
| `cors.json` | Firebase Storage ke liye CORS config |
| `.firebaserc` | Kaunsa Firebase project (project ID) use ho raha hai |
| `.gitignore` | Git ko batata hai kaunsi files/folders ignore karni hain (node_modules, .env wagera) |
| `README.md` | Bohot short — sirf "Figma Make project" likha hai, koi real documentation nahi |
| `ONBOARDING_GUIDE.md` | **Poori app ka detailed technical guide** — architecture, data flow, security landmines, sab kuch file:line references ke sath |
| `test-vars.json` | Testing ke liye temporary/sample variables ki file |
| `tmpInvoiceDebug.mjs` | Invoice-related ek debugging script (temporary/leftover) |
| `useProductTransferCreateViewModel.ts` (root mein) | Yeh galti se root mein pada hua lagta hai — asal file `src/modules/inventory/viewModels/useProductTransferCreateViewModel.ts` mein honi chahiye. Duplicate/misplaced file |
| `cors.json`, `test-vars.json` | Config/testing helper files |

### `.firebase/`, `.vscode/`
| File | Kaam |
|---|---|
| `.firebase/.graphqlrc` | Firebase tooling ka internal config |
| `.vscode/extensions.json` | VS Code ke liye recommended extensions list |
| `.vscode/settings.json` | Is project ke liye VS Code editor settings |

---

## 2. `build/` — Production Build Output

Yeh folder `vite build` command se **automatically generate** hota hai. Hath se edit nahi karna chahiye.

| File | Kaam |
|---|---|
| `build/index.html` | Compiled/minified HTML |
| `build/assets/index-*.js` | Poora React app ek bundled JS file mein compile ho ke |
| `build/assets/index-*.css` | Compiled CSS (Tailwind se) |
| `build/assets/html2canvas.esm-*.js` | PDF/screenshot generation ke liye library bundle |
| `build/assets/purify.es-*.js` | HTML sanitization library (XSS se bachne ke liye) |
| `build/BullionLogo.jpeg`, `build/BullionStamp.jpeg` | Company logo/stamp, build mein copy hui |

## 3. `public/` — Static Assets

| File | Kaam |
|---|---|
| `public/BullionLogo.jpeg` | Company ka logo — invoices, PDFs, header mein use hota hai |
| `public/BullionStamp.jpeg` | Company ki official stamp — PDF invoices par print hoti hai |

---

## 4. `functions/` — Backend (Cloud Functions)

Yeh poore app ka **sara server-side code** hai, sirf ek file mein likha hua:

| File | Kaam |
|---|---|
| `functions/src/index.ts` | **Sabse high-stakes file.** Isme 3 Firestore triggers aur 2 public HTTP endpoints hain:<br>• `onTransactionCreated` — naya transaction banne par approval email bhejta hai (agar approval required ho)<br>• `onTransactionUpdated` — approval status change hone par deferred bank balance apply karta hai<br>• `approveTransaction` — public link jise manager click karke transaction approve karta hai (token check ke sath, lekin identity verify nahi hoti — security risk)<br>• `rejectTransaction` — reject karne par transaction hard-delete ho jata hai<br>• User account delete hone par cascading cleanup |
| `functions/package.json` | Cloud Functions ki apni dependencies (Node.js project, React se alag) |
| `functions/tsconfig.json`, `tsconfig.dev.json` | TypeScript compiler config |
| `functions/.eslintrc.js` | Code linting rules |

### `cashflow/` — Dead/Abandoned Folder
Yeh ek **abandoned second Cloud Functions project** hai — default `firebase init functions` template, kabhi actually use nahi hua. `firebase.json` ki functions list mein bhi registered nahi hai. **Ignore kar sakte hain.**

---

## 5. `scripts/` — One-Time Admin Scripts

| File | Kaam |
|---|---|
| `scripts/migrateBanksToAED.js` | Ek **purani one-time migration script** jo bank balances ko PKR se AED mein convert karne ke liye likhi gayi thi. Dobara run karne se pehle ONBOARDING_GUIDE ke Section 9 zaroor padhein |

---

## 6. `src/` — Main React Application

### 6.1 Entry Points

| File | Kaam |
|---|---|
| `src/main.tsx` | **Asal (real) entry point.** Yahan se `AuthProvider` → `CurrencyProvider` → `RouterProvider` set hota hai. Yehi file poori app ko boot karti hai |
| `src/App.tsx` | **Dead/purana code.** `main.tsx` isko import nahi karta. Apna alag `AuthProvider` aur router tree hai. Sirf isliye zinda hai kyunke `src/features/finance/` ki 11 purani report files abhi bhi ise import karti hain |
| `src/routes.tsx` | App ki **har screen ka complete map** — kaunsa URL kaunsa component render karega. Sabse pehle yehi file padhni chahiye poori app samajhne ke liye |
| `src/index.css`, `src/styles/globals.css` | Global CSS, Tailwind imports |
| `src/manual-product-workflow.ts` | Inventory/product ke manual workflow se related helper code |
| `src/ERP_SYSTEM_GUIDE.md` | Ek purani prototype guide ("Pakistan Detectors Technologies" ke naam se) — company ki history ka evidence, ke pehle yeh Pakistan-based tha |

### 6.2 `src/api/firebase/`

| File | Kaam |
|---|---|
| `firebase.ts` | Firebase SDK ka initialization — `app`, `db` (Firestore), `auth` yahan se poore app mein export hote hain |

### 6.3 `src/assets/`

| File | Kaam |
|---|---|
| `BullionLogo.jpeg`, `BullionStamp.jpeg` | Source images (public/ waali copies ka original) |

### 6.4 `src/components/` — Shared/Reusable UI

`src/components/ui/` — **Design system layer** (Radix UI + shadcn/ui pattern). Yeh sab generic, reusable components hain jo har module use karta hai. Third-party library ki tarah treat karein, routine edit na karein:

| File | Kaam |
|---|---|
| `accordion.tsx` | Collapsible sections |
| `alert.tsx`, `alert-dialog.tsx` | Warning messages aur confirmation popups |
| `aspect-ratio.tsx` | Image/video ka aspect ratio maintain karna |
| `avatar.tsx` | User profile picture circle |
| `badge.tsx` | Chota status label (e.g. "Pending", "Approved") |
| `breadcrumb.tsx` | Navigation path (Home > Inventory > Product) |
| `button.tsx` | Har jagah use hone wala button component |
| `calendar.tsx` | Date picker calendar |
| `card.tsx` | Content ko box mein wrap karne wala container |
| `carousel.tsx` | Image/content slider |
| `chart.tsx` | Charts/graphs ka wrapper (Recharts ke sath) |
| `checkbox.tsx` | Checkbox input |
| `collapsible.tsx` | Expand/collapse section |
| `command.tsx` | Search/command palette (Ctrl+K jaisa) |
| `context-menu.tsx` | Right-click menu |
| `dialog.tsx` | Modal popup window |
| `drawer.tsx` | Side se slide hone wala panel |
| `dropdown-menu.tsx` | Dropdown select menu |
| `form.tsx` | Form fields ka wrapper (react-hook-form ke sath) |
| `hover-card.tsx` | Hover karne par info card |
| `input.tsx`, `input-otp.tsx` | Text input aur OTP input |
| `label.tsx` | Form field label |
| `menubar.tsx` | Top menu bar |
| `navigation-menu.tsx` | Navigation dropdown menu |
| `pagination.tsx` | List ke pages navigate karna (1, 2, 3...) |
| `popover.tsx` | Chota floating box |
| `progress.tsx` | Progress bar |
| `radio-group.tsx` | Radio buttons |
| `resizable.tsx` | Panels ko resize karna |
| `scroll-area.tsx` | Custom scrollbar wala area |
| `select.tsx` | Dropdown select |
| `separator.tsx` | Horizontal/vertical line divider |
| `sheet.tsx` | Side panel (drawer jaisa) |
| `sidebar.tsx` | Sidebar layout primitive |
| `skeleton.tsx` | Loading placeholder animation |
| `slider.tsx` | Range slider |
| `sonner.tsx` | Toast notifications (success/error messages) |
| `switch.tsx` | Toggle switch |
| `table.tsx` | Data table |
| `tabs.tsx` | Tab navigation |
| `textarea.tsx` | Multi-line text input |
| `toggle.tsx`, `toggle-group.tsx` | Toggle buttons |
| `tooltip.tsx` | Hover tooltip |
| `use-mobile.ts` | Mobile screen detect karne wala hook |
| `utils.ts` | className merge karne wala helper (`cn()` function) |

`src/components/figma/`:
| File | Kaam |
|---|---|
| `ImageWithFallback.tsx` | Figma-to-code se aayi ek leftover file — image load fail ho to fallback dikhati hai |

### 6.5 `src/constants/`

| File | Kaam |
|---|---|
| `roles.ts` | User roles (Admin, Manager, Clerk wagera) ki constant list |

### 6.6 `src/features/` — Purana Layer (mostly dead, except Dashboard)

`src/features/finance/`:
| File | Kaam |
|---|---|
| `Dashboard.tsx` | **Zinda/Active** — login ke baad ka home screen, saari summary yahan dikhti hai |
| `AccountsPayableReport.tsx`, `AccountsReceivableReport.tsx`, `Accountspayablereceivablereport.tsx` | Payable/Receivable accounts ki reports (purane, `App.tsx` se linked) |
| `BalanceSheetReport.tsx` | Balance sheet report |
| `BankBalanceReport.tsx` | Bank balances ki report |
| `Bills.tsx` | Purana bills view |
| `CashFlowCharts.tsx`, `TransactionCharts.tsx` | Charts/graphs components |
| `CashInflow.tsx`, `CashOutflow.tsx` | Cash in/out ki purani reports |
| `CurrencyPicker.tsx` | Currency select karne wala dropdown |
| `ExpensesReport.tsx` | Expenses ki report |
| `FixedBillsReport.tsx` | Fixed/recurring bills report |
| `Incomestatementreport.tsx` | Income statement report |
| `LoanHistory.tsx` | Loans ki history |
| `Overview.tsx` | General overview screen |
| `PendingPayments.tsx` | Pending payments ki list |
| `ProfitLossReport.tsx` | Profit/Loss report |
| `ReportsHub.tsx`, `ReportsPage.tsx` | Reports ka main hub/index page |
| `SalariesReport.tsx` | Salaries ki report |
| `TransactionHistoryReport.tsx` | Transaction history report |
| `Transactions.tsx` | Purana transactions view |
| `UseDashboardData.tsx` | Dashboard ke liye data-fetching hook |
| `currencyUtils.ts` | Currency conversion helper functions |

`src/features/inventory/`:
| File | Kaam |
|---|---|
| `InventoryAuditLog.tsx` | Inventory changes ka audit trail |
| `InventoryCharts.tsx` | Inventory ke charts |
| `InventoryReport.tsx` | Inventory report (purana) |
| `ProductTransferReport.tsx` | Branch-to-branch product transfer report |

`src/features/sales/`:
| File | Kaam |
|---|---|
| `CommissionCalculation.tsx` | Sales commission calculate karna (purana) |
| `CommissionReport.tsx` | Commission report (purana) |
| `CommissionSlabs.tsx` | Commission ke slabs/tiers set karna (purana) |
| `ReferralReport.tsx` | Referral-based sales report |
| `SalesReport.tsx` | Sales ki overall report |

### 6.7 `src/guidelines/`

| File | Kaam |
|---|---|
| `Guidelines.md` | Design/coding guidelines document |

### 6.8 `src/layouts/` — App ka Persistent Chrome

| File | Kaam |
|---|---|
| `Sidebar.tsx` | **Active** — side navigation menu (lekin sirf Transactions, Inventory, Invoices, Payroll, Dashboard, Reports ke links hain — baqi modules ke links missing hain) |
| `TopBar.tsx` | Upar ki header bar (user info, logout wagera) |
| `NotificationBell.tsx` | Notification icon — `appNotifications` collection se live notifications dikhata hai |
| `Sidebar.backup.tsx` | **Dead** — purani sidebar ka backup, use nahi hota |

### 6.9 `src/pages/`

| File | Kaam |
|---|---|
| `Login.tsx` | Login screen — Firebase Auth se sign-in |
| `Signup.tsx` | Naya account banane ka screen |

### 6.10 `src/providers/context/`

| File | Kaam |
|---|---|
| `AuthContext.tsx` | **Sabse important context** — logged-in Firebase user, uska role, permissions array, aur branch — poori app ka ek hi global React state |
| `CurrencyContext.tsx` | Currency ka global state (zyada tar AED, kam use hota hai) |

### 6.11 `src/types/`

| File | Kaam |
|---|---|
| `Budget.ts` | Budget se related TypeScript types |
| `Notification.ts` | Notification se related TypeScript types |

### 6.12 `src/utils/` — Purani/Unused Scripts

| File | Kaam |
|---|---|
| `repairTransactions.ts` | Ek one-off script (currently commented-out) jo purane transactions ki currency repair karti thi |
| `transactionIdGenerator.ts` | Ek unused, **unsafe** alternative transaction-ID generator — memory mein counter rakhta hai jo page reload par reset ho jata hai |

---

## 7. `src/modules/` — Asal Business Logic (16 Modules)

Yeh app ka **sabse bada aur important hissa** hai — har real business feature yahan hai. Har module isi consistent pattern (MVVM jaisa) par bana hai:

```
views/XxxWrapper.tsx        → sirf UI render karta hai, koi logic nahi (2-5 lines)
viewModels/useXxxViewModel.ts → form state, validation, save/delete logic (React hook)
models/XxxFirebaseService.ts  → Firestore ke sath direct baat cheet (static async methods)
                                 → Firestore SDK call (addDoc/updateDoc/onSnapshot/runTransaction)
```

Har module ki `index.ts` file us module ke exports ko outside world ke liye expose karti hai.

### 7.1 `transactions/` — Ledger Entries (Sabse Important Module)

| File | Kaam |
|---|---|
| `models/transactionFirebaseService.ts` | Transactions ka Firestore layer — create, update, delete, sequential ID generation (`TXN-DDMMYY-NNN`), AED/PKR conversion constant, cash balance calculation |
| `models/transactionBridgeService.ts` | Doosre modules (invoices, loans) se transactions ko link/bridge karta hai |
| `models/transactionsService.ts` | Extra helper/service functions |
| `models/types.ts` | Transaction ka TypeScript type/interface |
| `viewModels/useTransactionFormViewModel.ts` | **Codebase ki sabse dense file** — form state, `requiresApproval()` business rule, AED→PKR conversion, approval token generation |
| `viewModels/useTransactionListViewModel.ts` | Transaction list ke liye live `onSnapshot` listener |
| `viewModels/useTransactionDeleteViewModel.ts` | Delete (archive-then-delete) logic |
| `viewModels/useAccountBalances.ts` | Bank/cash balances calculate karna |
| `viewModels/usePendingPaymentsViewModel.ts` | Pending payments ki list ka logic |
| `views/TransactionFormView.tsx`, `TransactionCreateWrapper.tsx`, `TransactionEditWrapper.tsx` | Transaction add/edit karne ke forms |
| `views/TransactionListView.tsx`, `TransactionListWrapper.tsx` | Transaction list screen |
| `views/TransactionDeleteWrapper.tsx` | Delete confirmation |
| `views/QuickTransactionModal.tsx` | Jaldi transaction add karne ka popup |
| `views/PendingPaymentsView.tsx`, `PendingPaymentsWrapper.tsx` | Pending payments screen |

### 7.2 `invoices/` — Customer/Supplier Invoices

| File | Kaam |
|---|---|
| `models/InvoiceFirebaseService.ts` | Invoice ka Firestore layer (create/read/update/delete) |
| `models/InvoicePaymentService.ts` | Invoice par payment record karna — `transactions` collection mein bhi entry karta hai |
| `models/InvoiceLifecycleService.ts` | Invoice ke status/lifecycle (draft → sent → paid) manage karta hai |
| `models/InvoiceMiscExpenseService.ts` | Invoice se related misc expenses |
| `models/InvoicepdfService.ts` | Invoice ka PDF generate karta hai (jsPDF ke sath) |
| `models/CustomerFirebaseService.ts` | Customers ka data manage karta hai |
| `models/DummyInvoiceFirebaseService.ts` | "Dummy" invoices (simpler invoice type) — `dummy_invoices` collection, jo firestore.rules mein cover nahi hai |
| `models/invoiceService.ts` | Currency conversion fallback rate wagera |
| `models/types.ts` | Invoice types |
| `viewModels/useInvoiceFormViewModel.ts` | Invoice form ka state/logic |
| `viewModels/useInvoiceListViewModel.ts` | Invoice list |
| `viewModels/useInvoiceDeleteViewModel.ts` | Delete logic |
| `viewModels/useDeletedInvoicesViewModel.ts` | Deleted/archived invoices dekhna |
| `viewModels/useInvoiceReportViewModel.ts` | Invoice report ka data |
| `viewModels/UseDummyInvoiceFormViewModel.ts` | Dummy invoice form logic |
| `views/InvoiceFormView.tsx`, `InvoiceFormWrapper.tsx` | Invoice create/edit form |
| `views/InvoiceListView.tsx`, `InvoiceListWrapper.tsx` | Invoice list screen |
| `views/InvoiceDeleteView.tsx`, `InvoiceDeleteWrapper.tsx` | Delete confirmation |
| `views/InvoiceMultiFilter.tsx` | Multiple filters lagane ka UI |
| `views/InvoiceReportView.tsx`, `InvoiceReportWrapper.tsx` | Invoice report screen |
| `views/DeletedInvoicesView.tsx`, `DeletedInvoicesWrapper.tsx` | Deleted invoices screen |
| `views/DummyInvoiceFormView.tsx`, `DummyInvoiceFormWrapper.tsx`, `DummyInvoiceListView.tsx` | Dummy invoice ke forms/list |

### 7.3 `inventory/` — Stock Management (Sabse Bada Module)

| File | Kaam |
|---|---|
| `models/InventoryFirebaseService.ts` | Products ka main Firestore layer |
| `models/BrandModelService.ts` | Brand/model data manage karta hai |
| `models/costingCalculator.ts` | Product costing calculation logic |
| `models/inventoryService.ts` | Extra helper functions |
| `models/types.ts` | Inventory se related types, `INVENTORY_LOCATIONS` (branches list) |
| `components/AddCostingDialog.tsx` | Costing add karne ka popup |
| `components/BrandModelDropdown.tsx`, `BrandModelSelector.tsx` | Brand/model select karne wale dropdowns |
| `components/BrandModelStaticData.ts` | Brand/model ki static/hardcoded list |
| `components/BrandSummary.tsx` | Brand-wise summary |
| `components/CostingGlobalInputs.tsx`, `CostingTable.tsx` | Costing ke inputs aur table |
| `components/MultiModelInventoryTable.tsx` | Multiple models ki table |
| `pages/DeletedInventoryPage.tsx` | Deleted inventory items ka page |
| `utils/transferPdfGenerator.ts` | Product transfer ki PDF generate karta hai |
| `viewModels/useCreateInventoryViewModel.ts` | Naya product/inventory create karna |
| `viewModels/useDamagedInventoryViewModel.ts` | Damaged items track karna |
| `viewModels/useDeletedInventoryViewModel.ts` | Deleted items dekhna |
| `viewModels/useInventoryAddExistingViewModel.ts` | Existing product mein quantity add karna |
| `viewModels/useInventoryCostingDetailsViewModel.ts`, `useInventoryCostingOptionViewModel.ts` | Costing details/options |
| `viewModels/useInventoryCurrency.ts` | Currency-related logic |
| `viewModels/useInventoryDashboardViewModel.ts` | Inventory dashboard ka data |
| `viewModels/useInventoryListViewModel.ts` | Product list |
| `viewModels/useInventoryMultimodelViewModel.ts` | Multi-model entries |
| `viewModels/useInventoryPayablesViewModel.ts`, `useInventoryPaymentViewModel.ts` | Payable/payment se related logic |
| `viewModels/useInventoryProductDetailsViewModel.ts` | Single product ki detail |
| `viewModels/useInventoryReportViewModel.ts` | Inventory report ka data |
| `viewModels/useInventoryReturnViewModel.ts` | Return/wapsi ka logic |
| `viewModels/useInventoryTypeSelectionViewModel.ts` | Inventory type select karna |
| `viewModels/useProductTransferCreateViewModel.ts`, `useProductTransferViewModel.ts` | Branch-to-branch product transfer |
| `views/*` (30+ files) | Har viewModel ke corresponding UI screens — Create, List, Report, Costing, Payment, Return, Transfer, Deleted, Damaged wagera |

### 7.4 `banking/` — Bank Accounts & Cash

| File | Kaam |
|---|---|
| `models/bankFirebaseService.ts` | Bank accounts ka Firestore layer — balance updates (**landmine**: `runTransaction` use nahi karta) |
| `models/Transferfirebaseservice.ts` | Bank-to-bank transfer ka Firestore layer |
| `models/cashFirebaseService.ts` | Cash-in-hand ka data |
| `models/bankingService.ts` | Extra helper functions |
| `models/types.ts` | Banking types |
| `viewModels/useBankListViewModel.ts`, `useBankFormViewModel.ts`, `useBankDeleteViewModel.ts` | Bank add/edit/delete/list |
| `viewModels/useBankActivityViewModel.ts` | Bank activity log |
| `viewModels/useBankingDashboardViewModel.ts` | Banking dashboard |
| `viewModels/useCashFormViewModel.ts`, `useCashListViewModel.ts` | Cash entries |
| `viewModels/useTransferFormViewModel.ts`, `useTransferListViewModel.ts` | Bank transfer form/list |
| `views/*` | Corresponding UI screens (BankForm, BankList, BankActivity, CashForm, CashList, TransferForm, TransferList, BankingDashboard) |

### 7.5 `loans/` — Loans Payable/Receivable

| File | Kaam |
|---|---|
| `models/Loanfirebaseservice.ts` | Loans ka Firestore layer — `makePayment()` method (jo bank balance update nahi karta — bug) |
| `models/loanService.ts` | Extra helpers |
| `models/types.ts` | Loan types |
| `viewModels/useLoanDashboardViewModel.ts` | Loan dashboard |
| `viewModels/useLoanFormViewModel.ts` | Loan add/edit form |
| `viewModels/useLoanListViewModel.ts` | Loan list |
| `viewModels/useLoanPaymentViewModel.ts` | Loan payment form |
| `views/*` | Corresponding screens (Dashboard, Form, List, Payment) |

### 7.6 `bills/` — Bills Management

| File | Kaam |
|---|---|
| `models/Billsfirebaseservice.ts` | Bills ka Firestore layer |
| `models/billsService.ts` | Extra helpers |
| `models/types.ts` | Bill types |
| `viewModels/useBillsFormViewModel.ts`, `useBillsListViewModel.ts`, `useBillsDeleteViewModel.ts` | Add/list/delete logic |
| `views/*` | Create, Edit, List, Delete screens |

### 7.7 `budget/` — Budget Management

| File | Kaam |
|---|---|
| `models/Budgetfirebaseservice.ts` | Budget ka Firestore layer |
| `models/budgetService.ts` | Extra helpers |
| `models/types.ts` | Budget types |
| `viewModels/useBudgetFormViewModel.ts`, `useBudgetListViewModel.ts`, `useBudgetDeleteViewModel.ts` | Add/list/delete logic |
| `views/*` | Create, Edit, List, Delete screens |

### 7.8 `employee/` — Employee Records

| File | Kaam |
|---|---|
| `models/employeeFirebaseService.ts` | Employees ka Firestore layer |
| `models/employeeService.ts` | Extra helpers |
| `models/types.ts` | Employee types |
| `viewModels/useEmployeeFormViewModel.ts`, `useEmployeeListViewModel.ts`, `useEmployeeDeleteViewModel.ts` | Add/list/delete logic |
| `views/EmployeeFormView.tsx`, `EmployeeListView.tsx`, etc. | Main screens |
| `views/CurrencyUtils.ts` | Currency helper (module-specific copy) |
| `views/components/EmployeeFilters.tsx` | List filter UI |
| `views/components/EmployeeFormFields.tsx` | Form ke individual fields |
| `views/components/EmployeeTable.tsx` | Employee data table |
| `views/components/EmployeeViewModal.tsx` | Employee detail popup |

### 7.9 `payroll/` — Unified Payroll System (Naya/Active)

| File | Kaam |
|---|---|
| `models/payrollBatchFirebaseService.ts` | **Active** — batch-based payroll ka Firestore layer (`payroll_batches`/`payroll_batch_rows` collections, jo firestore.rules mein cover nahi hain) |
| `models/payrollBatchTypes.ts` | Batch payroll types |
| `models/payrollFirebaseService.ts`, `payrollService.ts` | **Puraana/possibly dead** — batch system se pehle ka code, exported hai lekin live UI se call nahi hota |
| `models/types.ts` | Payroll types |
| `viewModels/UsePayrollBatchViewModel.ts` | Batch payroll ka main logic |
| `viewModels/useSalaryDashboardViewModel.ts`, `useSalaryListViewModel.ts`, `useSalaryDeleteViewModel.ts` | Salary-related views (naye payroll system ke andar) |
| `views/PayrollDashboardWrapper.tsx` | Payroll ka main dashboard |
| `views/PayrollBatchView.tsx`, `PayrollBatchWrapper.tsx` | Batch create/manage screen |
| `views/PayrollEmployeeListWrapper.tsx`, `PayrollEmployeeFormWrapper.tsx`, `PayrollEmployeeDeleteWrapper.tsx` | Payroll ke andar employee management |
| `views/SalaryDashboardWrapper.tsx` | Salary dashboard |
| `views/CommissionCalculationWrapper.tsx`, `CommissionReportWrapper.tsx`, `CommissionSlabListWrapper.tsx` | Payroll module commission module ko internally reuse karta hai |

### 7.10 `salary/` — Purana Salary System (Dead/Superseded)

Yeh poora module payroll module ne replace kar diya hai, lekin delete nahi hua.

| File | Kaam |
|---|---|
| `models/salaryFirebaseService.ts`, `salaryService.ts`, `types.ts` | Purana salary data layer |
| `viewModels/useSalaryDashboardViewModel.ts`, `useSalaryListViewModel.ts`, `useSalaryDeleteViewModel.ts`, `useSalaryFormViewModel.ts` | Purani logic |
| `views/*` | Purani UI screens — koi bhi live route se reachable nahi |

### 7.11 `commission/` — Sales Commission

| File | Kaam |
|---|---|
| `models/Commissionfirebaseservice.ts` | **Active** — Payroll module ise internally use karta hai (Firestore layer zinda hai) |
| `models/Commissionautoservice.ts` | Automatic commission calculation logic |
| `models/CurrencyUtils.ts` | Currency helper |
| `models/commissionService.ts` | Extra helpers |
| `models/types.ts` | Commission types |
| `viewModels/useCommissionCalculationViewModel.ts`, `useCommissionReportViewModel.ts` | Calculation/report logic |
| `viewModels/useCommissionSlabFormViewModel.ts`, `useCommissionSlabListViewModel.ts` | Commission slabs/tiers |
| `views/*` | **Zyada tar dead** — apni screens standalone unreachable hain, lekin Payroll module in wrappers ko reuse karta hai |

### 7.12 `user-management/` — Users, Roles, Permissions

| File | Kaam |
|---|---|
| `models/userService.ts` | Users ka Firestore layer — `createUser()`, roles, `Screen` type, `ALL_SCREEN_GROUPS` (kaunse screens kis role ko milte hain) |
| `hooks/useUserPermissions.ts` | **Critical file** — screen permissions decide karta hai (localStorage se, live Firestore fetch se nahi) |
| `components/protectedroute.tsx` | Route ko permission-check ke sath wrap karta hai |
| `views/UserManagement.tsx` | Users add/edit/permissions assign karne ki screen |

### 7.13 `assets-management/` — Company Assets

| File | Kaam |
|---|---|
| `models/assetsFirebaseService.ts` | Assets ka Firestore layer (`assets` collection — firestore.rules mein cover nahi) |
| `models/assetsService.ts` | Extra helpers |
| `models/types.ts` | Asset types |
| `views/AssetsManagement.tsx` | Assets ki list/management screen |

### 7.14 `against-the-invoice/` — Invoice Reconciliation (Naya Module)

| File | Kaam |
|---|---|
| `models/atiFirebaseService.ts` | `againstInvoiceEntries` collection ka Firestore layer — **`runTransaction` consistently use karta hai** (safe pattern ka example) |
| `models/types.ts` | Types |
| `viewModels/useATIViewModel.ts` | Main logic |
| `views/ATICreateForm.tsx` | Entry create karne ka form |
| `views/againstInvoiceDashboard.tsx` | Dashboard screen |

### 7.15 `Payable-to-futuristic/` — "Futuristic" Company ko Payable (Naya Module)

| File | Kaam |
|---|---|
| `models/payableToFuturisticService.ts`, `payableToFuturistic.ts` | Payable amount ka Firestore layer |
| `models/futuristicPayableBridge.ts` | Inventory se payable ko link karta hai |
| `models/inventoryPayableConfigService.ts` | Configuration settings |
| `models/inventoryPayableConfig.types.ts`, `types.ts` | Types |
| `viewModels/usePayableToFuturistic.ts` | Main logic |
| `viewModels/useInventoryPayableConfigViewModel.ts` | Config logic |
| `views/PayableToFuturisticView.tsx` | Main screen |
| `views/payableToFuturisticWrapper.tsx` | Wrapper |
| `views/InventoryPayableConfigPanel.tsx` | Config panel UI |
| `views/CurrencyBadge.tsx`, `StatusBadge.tsx` | Chote UI badges |

---

## 8. Sabse Important Business Rules (Yaad Rakhein)

1. **Currency Landmine**: UI sirf **AED** dikhata hai, lekin Firestore ke `transactions.amount` field mein value **PKR mein convert** ho ke save hoti hai (business pehle Pakistan-based tha, isi ka fossil hai). Asal AED value `originalAmount` field mein rehti hai. Naya report/calculation likhte waqt yeh zaroor dhyan mein rakhein, warna number ~76x galat ho jayega.

2. **Approval Workflow**: `Cash Outflow` ya `Loan` (given) transaction save hone par:
   - Client-side random token generate hota hai
   - Transaction `pending_approval` status ke sath save hota hai, bank balance **touch nahi hota**
   - Cloud Function email bhejta hai manager ko Approve/Reject links ke sath
   - Manager click kare to `approveTransaction`/`rejectTransaction` Cloud Function chalta hai — approve par bank balance apply hota hai, reject par transaction hard-delete
   - **Security risk**: sirf token match check hota hai, koi identity verification nahi

3. **Sidebar Gap**: `routes.tsx` mein Banking, Loans, Bills, Budgets, Employees, User Management, Assets Management, Product Transfer, Against-the-Invoice, Payable-to-Futuristic ke working routes hain, lekin `Sidebar.tsx` mein sirf Transactions, Inventory, Invoices, Payroll ke links hain — baaki sirf direct URL se accessible hain.

4. **Do Parallel Architectures**: `src/main.tsx` (asal/active) vs `src/App.tsx` (dead, lekin kuch purani `features/finance/` files abhi bhi ise import karti hain).

---

## 9. Quick Reference — "Agar X Karna Ho To Y File Mein Jayein"

| Kaam | File |
|---|---|
| Naya screen/route add karna | `src/routes.tsx` |
| Sidebar mein link add karna | `src/layouts/Sidebar.tsx` |
| User ko naye screen ki permission dena | `src/modules/user-management/models/userService.ts` + `firestore.rules` |
| Transaction approval logic badalna | `functions/src/index.ts` + `useTransactionFormViewModel.ts` |
| Currency conversion rate update karna | `invoiceService.ts` (CURRENCY_RATE_FALLBACK) + `transactionFirebaseService.ts` (PKR_TO_AED) — dono jagah |
| Naya branch/location add karna | `inventory/models/types.ts` + `transactions/viewModels/useTransactionFormViewModel.ts` — dono jagah |
| Naya Firestore collection ka security rule | `firestore.rules` |
| Naya financial report banana | `src/features/finance/ReportsHub.tsx` / `ReportsPage.tsx` |
