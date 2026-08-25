# Bullion System — Onboarding Guide

A standalone technical introduction to the Bullion Electronics ERP codebase, written for a developer who has inherited this project and knows React/JavaScript but nothing about this specific app's decisions, conventions, or history.

Every factual claim below cites an exact `file:line` so you can go verify it yourself. Claims that could not be confirmed from the code alone are explicitly marked **INFERRED** (a reasonable guess, not verified) or **NEEDS RUNTIME CHECK** (requires running the app, checking the Firebase Console, or checking deployed config to confirm).

No files in the project were modified to produce this guide — it is a read-only analysis, current as of **18 August 2026**.

---

## Table of Contents

1. [Cheat Sheet](#cheat-sheet)
2. [The 60-Second Version](#1-the-60-second-version)
3. [The Mental Model](#2-the-mental-model)
4. [Trace One Complete Journey: Recording a Cash Outflow Transaction](#3-trace-one-complete-journey-recording-a-cash-outflow-transaction)
5. [The Folder Tour](#4-the-folder-tour)
6. [Business Concept → Code Map](#5-business-concept--code-map)
7. ["If I Want to Change X, I Go to Y"](#6-if-i-want-to-change-x-i-go-to-y)
8. [The History Lesson](#7-the-history-lesson)
9. [The Unwritten Rules](#8-the-unwritten-rules)
10. [Where the Landmines Are](#9-where-the-landmines-are-ranked)
11. [What to Read This Week, In Order](#10-what-to-read-this-week-in-order)
12. [Open Questions](#open-questions)

---

## Cheat Sheet

**What this app is, in 3 sentences.** Bullion Electronics is a gold/electronics trading company with branches in Dubai, Chad, Saudi Arabia, and Sudan, and this is their internal financial control system. It replaced spreadsheets for recording every incoming/outgoing payment, issuing invoices, tracking inventory across branches, running payroll, and tracking loans — all backed by a single shared Firestore database with no separate backend server. Its one distinctive workflow: certain outgoing-money transactions require a manager to click Approve or Reject in an emailed link before they take financial effect.

**The 5 files that matter most.**
1. `src/routes.tsx` — the map of every screen in the app.
2. `src/modules/transactions/viewModels/useTransactionFormViewModel.ts` — the densest file in the codebase; contains the AED/PKR currency landmine and the approval-routing logic.
3. `functions/src/index.ts` — the entire server side, in one file.
4. `firestore.rules` — the only server-side security gate for the whole database.
5. `src/modules/user-management/hooks/useUserPermissions.ts` — how screen permissions are actually decided.

**The repeating pattern, in one diagram.**
```
   VIEW                  VIEWMODEL                    MODEL                    FIRESTORE
 XxxWrapper.tsx   →   useXxxViewModel.ts   →   XxxFirebaseService.ts   →   Firestore SDK call
 (renders UI,          (form state,               (static async               (addDoc / updateDoc /
  no logic)              handleSave)                methods, try/catch)        onSnapshot / runTransaction)
```
There is no server layer in between. The frontend talks to Firestore directly. The only exception is the transaction-approval workflow, where a Cloud Function sits in the loop (see Section 3).

**The 5 most dangerous files to touch.**
1. `functions/src/index.ts` — `approveTransaction` / `rejectTransaction` (lines 388–552): move money or hard-delete records, gated only by a token check with no identity verification.
2. `firestore.rules` — the only thing stopping any logged-in user from reading/writing almost everything.
3. `src/modules/transactions/viewModels/useTransactionFormViewModel.ts` — the AED→PKR conversion; get it wrong and every downstream number is off by ~76x.
4. `src/modules/banking/models/bankFirebaseService.ts` and its callers — un-transacted balance math; a partial failure can silently create or destroy recorded money.
5. `src/modules/user-management/hooks/useUserPermissions.ts` paired with the `users/{userId}` rule in `firestore.rules` — together, these are the entire authorization system.

**The 3 things most likely to confuse a newcomer.**
1. **Storage currency ≠ display currency.** The UI only shows AED, but the `amount` field stored on every transaction document is PKR-converted. The real AED figure lives in a separate `originalAmount` field.
2. **The sidebar does not list most of the app.** `routes.tsx` defines routes for Banking, Loans, Bills, Budgets, Employees, User Management, Assets Management, Product Transfer, Against-the-Invoice, and Payable-to-Futuristic — none of them have a link in `Sidebar.tsx` or the Dashboard. They only exist if you type the URL directly.
3. **Two parallel "root" architectures exist.** `src/main.tsx` is the real entry point; `src/App.tsx` is a dead second one, still imported by a cluster of otherwise-unreachable legacy report files under `src/features/finance/`.

---

## 1. The 60-Second Version

Bullion Electronics is a gold and electronics trading business operating across four locations — Dubai, Chad, Saudi Arabia, and Sudan (`src/modules/transactions/viewModels/useTransactionFormViewModel.ts:235-240`). This application is their internal financial control system: the software that replaced spreadsheets for day-to-day bookkeeping.

Staff use it to:
- **Record every payment** — money coming in or going out — as a ledger entry ("transaction").
- **Issue invoices** to customers and track whether they've been paid.
- **Track inventory** — what stock exists, at which branch, and move it between branches.
- **Manage bank accounts and cash** — balances, transfers between banks, cash-in-hand.
- **Run payroll and sales commissions** for employees.
- **Track loans** — money the company has borrowed or lent out.
- **Set budgets** — spending limits per category.
- **Control who can see what** — a permission system so, for example, a branch clerk can't see payroll data.

The one genuinely distinctive business rule baked into the software: certain kinds of outgoing money — cash paid out, or a loan given to someone — can't simply be recorded and be done. The system automatically emails a manager an "Approve" and "Reject" link, and the entry only takes financial effect (the bank balance only actually changes) once that manager clicks Approve. Reject permanently deletes the entry with no financial impact. This single workflow is the most complex piece of the entire application, and it's covered in full, file by file, in Section 3.

Everything else in the app is fairly conventional record-keeping: a form, a save button, a list, a database.

---

## 2. The Mental Model

**The one idea you need to hold in your head:** every business feature ("module") in this app is a stack of four layers, and data flows straight down through all of them with essentially nothing in between except, in one specific case, a background email workflow.

```
VIEW  (what you click)
  ↓
VIEWMODEL  (a React hook holding form state and a save function)
  ↓
MODEL  (a *FirebaseService class — a thin wrapper around Firestore calls)
  ↓
FIRESTORE  (the actual database)
```

Concretely, in code: a `*Wrapper.tsx` component calls a `use*ViewModel.ts` hook and passes its return value as props to a `*View.tsx` component. The hook calls static methods on a `*FirebaseService.ts` class. That class calls the Firestore SDK directly (`addDoc`, `updateDoc`, `getDocs`, `onSnapshot`, `runTransaction`). There is no REST API, no controller layer, no repository interface, no server sitting between the browser and the database for ordinary reads and writes.

The smallest possible example of this whole chain is `src/modules/transactions/views/TransactionCreateWrapper.tsx`, which in its entirety is:

```tsx
export function TransactionCreateWrapper() {
  const vm = useTransactionFormViewModel();
  return <TransactionFormView {...vm} />;
}
```

(`src/modules/transactions/views/TransactionCreateWrapper.tsx:5-7`)

Once you've read one module end to end, here is what you can and cannot predict about every other module:

**You CAN predict:**
- `models/XxxFirebaseService.ts` will be a class of `static async` methods, one per Firestore operation, each wrapped in `try/catch`, logging failures with `console.error` and a friendly re-thrown `Error` for the UI layer to catch and display as a toast notification (using the `sonner` library).
- `viewModels/useXxxViewModel.ts` will hold `useState` for every form field, a `validate()` function that returns a list of error strings, and a `handleSave()` async function that calls into the model layer and navigates away on success.
- `views/XxxView.tsx` will be a presentational component that receives everything as props from the viewmodel — it has no Firestore calls of its own (in the *well-formed* modules; see Section 8 for where this breaks down).
- `views/XxxWrapper.tsx` will be a two-to-five-line glue file connecting the viewmodel hook to the view component.

**You CANNOT predict, and must check per-module:**
- Whether writes that touch multiple documents (e.g., moving money between two banks) are wrapped in a Firestore `runTransaction` for safety, or done as two separate, un-guarded writes. Both patterns exist in this codebase — see Section 9.
- Whether the list screen for a given module subscribes live via `onSnapshot` (updates automatically when the data changes) or does a one-time `getDocs` fetch (you have to manually refresh or re-navigate to see new data). See Section 8.

---

## 3. Trace One Complete Journey: Recording a Cash Outflow Transaction

This journey was chosen over something like "create an invoice" because it's the only flow in the entire application that leaves the browser and involves the backend Cloud Functions — it's the fullest possible tour of the stack, and it's also where the most serious issues in the codebase live (see Section 9).

### Step 1 — The user clicks "Save" on the transaction form

`src/modules/transactions/views/TransactionCreateWrapper.tsx:5-7` renders `TransactionFormView` with every value and function returned by `useTransactionFormViewModel()`. The Save button in that view is wired to call `handleSave`, defined starting at `src/modules/transactions/viewModels/useTransactionFormViewModel.ts:585`.

### Step 2 — The viewmodel decides whether this transaction needs approval

The function `requiresApproval()` at `useTransactionFormViewModel.ts:181-188` contains the actual business rule:

```ts
function requiresApproval(mainCategory, subCategory): boolean {
  if (mainCategory === 'Cash Outflow') return true;
  if (mainCategory === 'Loan' && LOAN_GIVEN_SUB_CATEGORIES.has(subCategory)) return true;
  return false; // Cash Inflow and Loan received → no approval
}
```

For our example — a Cash Outflow — this returns `true`. A cryptographically random 24-byte token is generated client-side at this point too, using `generateToken()` (`useTransactionFormViewModel.ts:157-161`, built on `crypto.getRandomValues`). This token is what the email link the manager receives will later be checked against — remember this, it matters in Step 8.

### Step 3 — The viewmodel gets a sequential, human-readable transaction ID

`TransactionFirebaseService.generateTransactionId()` is called at `useTransactionFormViewModel.ts:696`. This is a thin alias (`transactionFirebaseService.ts:242-244`) for `commitTransactionId()` (`transactionFirebaseService.ts:220-235`), which runs a Firestore `runTransaction` against a per-day counter document at `transactionCounters/{DDMMYY}`. The atomic increment happens *inside* the Firestore transaction specifically so that two people saving at the same moment can't be handed the same number. The result looks like `TXN-180826-004`.

### Step 4 — The viewmodel converts the amount from AED to PKR before saving

This is the single most important thing to understand about this codebase's data model, so read it carefully.

At `useTransactionFormViewModel.ts:721`:

```ts
const amountPKR = +convertCurrency(item.amount, 'AED', 'PKR', currencyRates as any).toFixed(2);
```

Even though the form only ever accepts and displays AED (the United Arab Emirates Dirham — this is a UAE-based operation today), the value that actually gets written into Firestore's `amount` field is converted into Pakistani Rupees. The genuine AED figure the user typed is preserved separately, in a field called `originalAmount` (`useTransactionFormViewModel.ts:759`), alongside `originalCurrency` and `originalAmountPaid`.

Why this exists: this business used to operate primarily in Pakistan (see Section 7 for the historical evidence), and the ledger's internal "amount" field has stayed PKR-denominated ever since, even as the UI-facing currency moved to AED. Every dashboard, report, and running-balance calculation that reads `transaction.amount` is implicitly reading a PKR number, not an AED one. If you ever write a new report or calculation against this field without knowing this, your numbers will be off by roughly a factor of 76 (the approximate PKR-to-AED exchange rate baked into the fallback conversion constant at `transactionFirebaseService.ts:39`).

### Step 5 — The transaction document is written to Firestore

`TransactionFirebaseService.createTransaction(txData)` is called from `useTransactionFormViewModel.ts:763`, which calls into `transactionFirebaseService.ts:281-301`:

```ts
static async createTransaction(data) {
  const body = deepStripUndefined({ ...data, currency: data.currency || 'AED', createdAt: now, updatedAt: now });
  const ref = await addDoc(collection(db, COLLECTION), body);
  return { ...data, id: ref.id, createdAt: now, updatedAt: now };
}
```

(`COLLECTION` is `'transactions'`, defined at `transactionFirebaseService.ts:12`.) The document now exists in Firestore with `approvalStatus: 'pending_approval'` and `approvalToken: <the random token from Step 2>`.

### Step 6 — The bank balance is deliberately left untouched

Back in the viewmodel, the helper `updateBankBalance()` (`useTransactionFormViewModel.ts:575-582`) is only invoked for transactions that don't require approval. For our Cash Outflow, the balance change is intentionally deferred. The reasoning is documented directly in the Cloud Functions code, at `functions/src/index.ts:86-94`:

> "When a Cash Outflow / Loan-given transaction is created with `approvalStatus = 'pending_approval'`, the frontend deliberately does NOT touch the bank balance. This means a rejection leaves liquidity fully intact."

### Step 7 — Firestore fires a Cloud Function, entirely outside the browser

The moment the document from Step 5 is created, Google's infrastructure automatically invokes `onTransactionCreated`, a Firestore trigger defined at `functions/src/index.ts:149-300`. This code runs on Google's servers, not in the user's browser, and the user's tab has already moved on (it navigated to `/transactions` after Step 5 completed).

Because `data.approvalStatus === "pending_approval"`, the function skips the simple notification-email branch and instead builds an HTML email containing "Approve" and "Reject" buttons (`functions/src/index.ts:222-286`). The URLs behind those buttons are built at `functions/src/index.ts:215-220`:

```ts
const token = data.approvalToken || "";
const approveUrl = `${base}/approveTransaction?id=${firestoreId}&token=${token}`;
const rejectUrl  = `${base}/rejectTransaction?id=${firestoreId}&token=${token}`;
```

The email is sent via Gmail SMTP (using `nodemailer`, configured at `functions/src/index.ts:13-19` with credentials read from environment variables, not hardcoded) to whichever addresses are configured in the `APPROVER_EMAILS` environment variable (`functions/src/index.ts:288-298`, resolved through `getApprovers()` at `:26-29`).

### Step 8 — A manager clicks "Approve" in their email inbox

This is a plain HTTP request to a public Cloud Function called `approveTransaction`, defined at `functions/src/index.ts:388-427`. No login is involved — clicking the link is enough to reach this endpoint. The function:

1. Reads `id` and `token` from the URL's query string (`:389`).
2. Looks up the transaction document by `id` (`:395-396`).
3. Compares `data.approvalToken !== token` (`:407`) — if they don't match, it refuses.
4. If they match, updates the document: `approvalStatus: "approved"`, and explicitly clears the token field using `admin.firestore.FieldValue.delete()` (`:412-417`).

**This is the single riskiest piece of code in the application** — see Section 9, Landmine #1, for why: there is no check anywhere in this function that the person who clicked the link is actually an authorized approver, only that they possess a valid token.

### Step 9 — The approval update fires a second Cloud Function trigger

The document update from Step 8 automatically fires `onTransactionUpdated`, another Firestore trigger, at `functions/src/index.ts:312-383`. It notices `approvalStatus` changed and, because the new value is `"approved"`, calls `applyDeferredBankBalanceOnApproval(after)` at `functions/src/index.ts:337`, which is defined at `:98-144`. **This is the moment — potentially minutes or days after the original save — where the bank balance actually changes**, entirely server-side, using the Firebase Admin SDK which bypasses `firestore.rules` entirely (Admin SDK access is always unrestricted by security rules).

### Step 10 — The screen updates itself, with no explicit refresh anywhere

Back in the browser (which may belong to a completely different user than the one who created the transaction, or the same one who's navigated back to the list), the transactions list screen set up a live Firestore listener the moment it mounted:

`src/modules/transactions/viewModels/useTransactionListViewModel.ts:58-97` calls `onSnapshot(collection(db, 'transactions'), ...)`. Firestore's client SDK maintains an open connection and pushes every change — the original creation in Step 5, and the approval update in Step 8 — directly to any browser tab with this listener active. React re-renders automatically. Nobody wrote any polling or manual-refresh code; it's a property of using `onSnapshot` instead of a one-time `getDocs` fetch.

### The whole loop, summarized

```
Click Save
  → useTransactionFormViewModel.handleSave()
  → TransactionFirebaseService.createTransaction()
  → Firestore write (transactions/{id})
  → [Cloud Function] onTransactionCreated → sends approval email
  → Manager clicks "Approve" in their inbox (no login)
  → [Cloud Function] approveTransaction → checks token, updates document
  → [Cloud Function] onTransactionUpdated → applies deferred bank balance
  → Firestore push → useTransactionListViewModel's onSnapshot listener
  → React re-renders the list, showing the approved transaction
```

---

## 4. The Folder Tour

| Folder | What lives here | What does NOT live here | Open it when... | Safe to ignore for now? |
|---|---|---|---|---|
| `src/modules/` | 16 self-contained business domains (transactions, invoices, inventory, banking, payroll, loans, bills, budgets, employee, user-management, assets-management, commission, salary, against-the-invoice, Payable-to-futuristic), each following the models → viewModels → views pattern from Section 2. | Generic UI components, routing definitions. | You're changing how a specific business feature works. | No — this is the large majority of the application's real logic. |
| `src/features/finance/` | `Dashboard.tsx` (the live home screen after login) plus a large family of report components (`SalesReport.tsx`, `ReferralReport.tsx`, `CashInflow.tsx`, etc.), many of which still import the dead `src/App.tsx`. | Anything module-specific business logic. | You're touching the Dashboard, or a financial report — but check Section 7 first to see which report files are actually reachable. | Mostly, except `Dashboard.tsx` itself, which is very much alive. |
| `functions/src/` | The entire server side of the application, in one file: `index.ts`. Three Firestore triggers, two public HTTP endpoints. | Any frontend/React code — this is a completely separate Node.js/TypeScript project with its own `package.json`. | You're changing anything about email notifications, the approval workflow, or user-account deletion cascading. | No — small (under 700 lines) but the highest-stakes file in the repo. |
| `cashflow/` | An abandoned second Cloud Functions project scaffold — the default `firebase init functions` template with its one example function commented out. | Anything actually implemented or deployed. | Essentially never. | Yes, entirely — it isn't even registered in `firebase.json`'s functions list. |
| `src/providers/context/` | `AuthContext.tsx` (tracks the logged-in Firebase user, their role, permissions array, and branch — the one piece of global React state in the app) and `CurrencyContext.tsx` (mostly unused, defaults to AED). | Business/domain logic. | You're changing how login state or permission data flows to the rest of the app. | No. |
| `src/components/ui/` | The design-system layer — Radix UI wrappers styled in the shadcn/ui convention (buttons, dialogs, tables, dropdowns, etc.), used throughout every module. | Anything module-specific. | You need a new generic, reusable UI primitive. | Usually yes — treat it like a third-party library you consume, not code you routinely edit. |
| `src/components/figma/` | One file, `ImageWithFallback.tsx` — a leftover Figma-to-code scaffold artifact. | Anything else. | Essentially never. | Yes. |
| `src/layouts/` | `Sidebar.tsx`, `TopBar.tsx`, `NotificationBell.tsx` — the persistent chrome around every authenticated screen. Also a dead `Sidebar.backup.tsx`. | Route definitions (those live in `src/routes.tsx`). | You're adding a navigation entry, or changing the top bar / notification bell. | No — and see Section 7's big surprise about what's actually linked here. |
| `firestore.rules` / `firestore.indexes.json` | The declarative security rules for Cloud Firestore — the only server-side gate on any data in the whole application — and the composite query indexes Firestore needs for certain queries. | Any procedural/business logic — this is a rules DSL, not JavaScript. | Any time you add a new Firestore collection, or need to reason about who can read/write what. | Absolutely not — read this before writing to any collection you haven't used before. |
| `src/utils/` | Two leftover one-off scripts: `repairTransactions.ts` (a commented-out one-time currency repair) and `transactionIdGenerator.ts` (an unused, unsafe alternative ID generator). | Anything currently exercised by the running app. | Basically never — these are historical debris, not a "utilities" folder in active use. | Yes. |
| `scripts/` | `migrateBanksToAED.js` — a one-time admin-SDK script from a past PKR→AED bank-currency migration. | Anything else, and nothing meant to run automatically. | Only if someone specifically asks you to re-run or understand that past migration — read Section 9 first regarding re-running it. | Yes, for day-to-day work. |
| `build/`, `public/` | `build/` is the compiled production bundle (checked into git, unusually — see the companion audit report for why that's a problem); `public/` holds static assets like the company logo copied verbatim into the build. | Source code. | Almost never by hand — `build/` is regenerated by `vite build`. | Yes. |

---

## 5. Business Concept → Code Map

| Concept | Firestore collection | Read/write file | Screen(s) |
|---|---|---|---|
| Ledger entry ("transaction") | `transactions` (soft-deletes archive to `deleted_transactions`) | `src/modules/transactions/models/transactionFirebaseService.ts` | `/transactions` |
| Invoice | `invoices` | `src/modules/invoices/models/InvoiceFirebaseService.ts` | `/invoices`, `/invoices/new` |
| Invoice payment (customer or supplier) | writes into `invoices`, and books a corresponding row into `transactions` | `src/modules/invoices/models/InvoicePaymentService.ts` | inside the Invoices screens |
| "Dummy" invoice (a separate, simpler invoice type) | `dummy_invoices` — **not matched by any rule in `firestore.rules`, see Section 9** | `src/modules/invoices/models/DummyInvoiceFirebaseService.ts` | `/invoices/dummy` |
| Employee | `employees` | `src/modules/employee/models/employeeFirebaseService.ts` | `/employees` (no sidebar link — see Section 7) |
| Stock item ("product") | `products` | `src/modules/inventory/models/InventoryFirebaseService.ts` | `/inventory/view` |
| Product transfer between branches | `product_transfers` / `transfers` | `src/modules/inventory/viewModels/useProductTransferCreateViewModel.ts` | `/product-transfer` (no sidebar link) |
| Bank account | `banks` | `src/modules/banking/models/bankFirebaseService.ts` | `/banking/banks` (no sidebar link) |
| Bank transfer | `bank_transfers` | `src/modules/banking/models/Transferfirebaseservice.ts` | `/banking/transfers` |
| Bank activity log | `bank_transactions` — **not matched by any rule in `firestore.rules`** | `bankFirebaseService.ts:137-147` | `/reports/bank-activity` |
| Cash in hand | one doc at `settings/cashOpening` (the opening balance) plus the live `transactions` collection filtered to `mode === 'Cash'` | `transactionFirebaseService.ts:625-681` | `/banking/cash` |
| Loan (payable or receivable) | `loans` | `src/modules/loans/models/Loanfirebaseservice.ts` | `/loans` (no sidebar link) |
| Bill | `bills` | `src/modules/bills/models/Billsfirebaseservice.ts` | `/bills` (no sidebar link) |
| Budget | `budgets` | `src/modules/budget/models/Budgetfirebaseservice.ts` | `/budgets` (no sidebar link) |
| Payroll batch (current system) | `payroll_batches` / `payroll_batch_rows` — **not matched by any rule in `firestore.rules`** | `src/modules/payroll/models/payrollBatchFirebaseService.ts` | `/payroll` |
| Salary (old system, mostly dead — see Section 7) | `salaries` | `src/modules/salary/models/salaryFirebaseService.ts` | unreachable from the UI |
| Commission | `commissions` / `commission_slabs` | `src/modules/commission/models/Commissionfirebaseservice.ts` | reused internally by `/payroll`; its own screens are unreachable |
| Company asset | `assets` — **not matched by any rule in `firestore.rules`** | `src/modules/assets-management/models/assetsFirebaseService.ts` | `/assets-management` (no sidebar link) |
| Payment against invoice (a separate reconciliation flow) | `againstInvoiceEntries` — **not matched by any rule in `firestore.rules`** | `src/modules/against-the-invoice/models/atiFirebaseService.ts` | `/against-the-invoice` (no sidebar link) |
| Payable to "Futuristic" (a related company) | `inventory_payable_configs` — **not matched by any rule in `firestore.rules`** | `src/modules/Payable-to-futuristic/models/inventoryPayableConfigService.ts` | `/payable-to-futuristic` (no sidebar link) |
| User account / role / permissions | `users` | `src/modules/user-management/models/userService.ts` | `/user-management` (no sidebar link) |
| In-app notification (bell icon) | `appNotifications` | both `transactionFirebaseService.ts:507-561` (frontend writes) and `functions/src/index.ts:46-58` (backend writes) | `src/layouts/NotificationBell.tsx` |

**Practical use of this table:** if someone tells you "the invoice total is wrong," start at `InvoiceFirebaseService.ts` for how the total is calculated and stored, check `InvoicePaymentService.ts` if a payment is involved, and specifically check whether the number you're looking at has gone through the AED/PKR conversion described in Section 3, Step 4 — that conversion is the single most common source of "the number looks wrong" bugs in this codebase.

---

## 6. "If I Want to Change X, I Go to Y"

1. **"Add a field to the invoice form."**
   `src/modules/invoices/models/types.ts` (add the field to the `Invoice` type) → `InvoiceFirebaseService.ts` (persist it in reads/writes) → `useInvoiceFormViewModel.ts` (add form state) → the invoice form view (add the input) → `firestore.rules` if the field should be required server-side.

2. **"Change who receives the transaction approval email."**
   First check `functions/.env`'s `APPROVER_EMAILS` variable — this is configuration, not code (NEEDS RUNTIME CHECK to confirm the deployed value). If the *logic* for choosing recipients needs to change, go to `functions/src/index.ts:21-29` (`getApprovers()`).

3. **"Give a specific employee access to a new screen."**
   `src/modules/user-management/models/userService.ts` (add the screen name to the `Screen` type and to `ALL_SCREEN_GROUPS` so it's assignable in the admin UI) → `src/routes.tsx` (wrap the route element in `<ScreenProtectedRoute requiredScreen="...">`) → **`src/layouts/Sidebar.tsx` or `src/features/finance/Dashboard.tsx`**, if you also want the screen to be discoverable by clicking around — many existing routes currently aren't (see Section 7).

4. **"Fix the bug where a failed bank transfer can lose money."**
   `src/modules/banking/viewModels/useTransferFormViewModel.ts` and `useBankListViewModel.ts` (both independently implement the same unsafe two-step balance update) → `bankFirebaseService.ts`'s `updateMultipleBanks()` method, which needs to be wrapped in a Firestore `runTransaction`.

5. **"Update the currency conversion rate."**
   Check **two** places, not one: `src/modules/invoices/models/invoiceService.ts` (`CURRENCY_RATE_FALLBACK`) and `src/modules/transactions/models/transactionFirebaseService.ts:39` (`PKR_TO_AED`). They are independently maintained constants, not a shared source of truth.

6. **"Add a fifth branch/location."**
   Again, two places: `src/modules/inventory/models/types.ts` (`INVENTORY_LOCATIONS` array) and `src/modules/transactions/viewModels/useTransactionFormViewModel.ts:235-240` (`DEFAULT_LOCATIONS` array). These describe roughly the same four branches today but are two separate, hand-maintained lists.

7. **"Make loan payments actually deduct the paying bank's balance."**
   `src/modules/loans/models/Loanfirebaseservice.ts`'s `makePayment()` method (currently updates the loan record only — it never writes to the `banks` collection despite the UI validating against a bank's balance) → `useLoanPaymentViewModel.ts`, which drives the form that calls it.

8. **"Add a new financial report."**
   `src/features/finance/ReportsHub.tsx` / `ReportsPage.tsx`, following whichever existing report file looks newest and cleanest as a template. **NEEDS RUNTIME CHECK**: this layer is a mix of old and new report components (see Section 7), and I could not determine from static reading alone which specific file is the current best template — that's worth asking a teammate or checking recent git history for.

9. **"Require the approver to actually be verified before clicking Approve/Reject."**
   `functions/src/index.ts`'s `approveTransaction` (starting `:388`) and `rejectTransaction` (starting `:439`) — this is the fix for the most serious issue described in this document (Section 9, Landmine #1).

10. **"Change what happens when an admin creates a new user account."**
    `src/modules/user-management/models/userService.ts`'s `createUser()` method (`:218-254`). Be aware of a documented risk noted in an inline comment at `UserManagement.tsx:117`, which claims the creating admin's session isn't affected — but the Firebase Auth SDK's documented behavior for `createUserWithEmailAndPassword` is that it *does* sign in as the newly created account on the same shared `auth` object used everywhere else in the app. **NEEDS RUNTIME CHECK** to confirm which behavior actually occurs today.

---

## 7. The History Lesson

This codebase was clearly built in at least two distinct eras by people making different architectural choices, and the transition between them isn't finished. Knowing which layer you're looking at will save you from spending time on code that never actually runs.

### The OLD layer (present on disk, mostly not executed)

- **`src/App.tsx`** — an entire second root component, complete with its own `AuthProvider` and its own router tree. The real entry point, `src/main.tsx`, never imports it (confirmed: `main.tsx` builds `AuthProvider` → `CurrencyProvider` → `RouterProvider` directly from `./routes`, with no reference to `App.tsx`). It survives only because 11 files under `src/features/finance/` still import from it.
- **`src/modules/salary/`** (the entire module) and most of **`src/modules/commission/views/`** — superseded by the unified Payroll module described below, but never deleted from the repository. Note the nuance: `commission`'s *data-access file* (`Commissionfirebaseservice.ts`) is still genuinely imported and used by the new Payroll module — only its *screens* (the Commission Slabs, Commission Calculation, and Commission Report views) are dead.
- **`src/utils/repairTransactions.ts`** and **`src/utils/transactionIdGenerator.ts`** — one-off repair and ID-generation scripts from an earlier point in the project's life. Neither is imported anywhere in the live application. The ID generator, notably, isn't even safe: it keeps its counter in a plain in-memory JavaScript object that resets on every page reload, so if it were ever wired back in, it would produce duplicate IDs under normal use.
- **PKR (Pakistani Rupee) as the ledger's base currency** — this is a direct fossil of the business's history. `src/ERP_SYSTEM_GUIDE.md` describes an earlier prototype built for "Pakistan Detectors Technologies." The company now operates and displays everything in AED, but the `transactions.amount` field is still PKR-denominated by design today, as detailed in Section 3.

### The NEW layer (the current standard to build against)

- **The `src/modules/*` MVVM pattern** described in Section 2 — this is what you should copy when adding anything new.
- **`src/modules/payroll/`** — a batch-based, unified payroll system that replaced the old separate salary and commission screens.
- **`src/modules/against-the-invoice/`** and **`src/modules/Payable-to-futuristic/`** — the newest modules in the codebase, and notably the *only* ones that consistently wrap multi-document financial writes in `runTransaction`. If you're looking for a template for "the correct way to write money-moving code in this app," use one of these two — not the banking module.
- **AED as the current display currency** — `CurrencyContext.tsx` and the `SUPPORTED_CURRENCIES` constant (`useTransactionFormViewModel.ts:33-35`) both reflect that AED is the only currency the UI presents today.

### HALF-MIGRATED (the genuinely dangerous middle ground)

- **Currency.** As covered in depth in Section 3: storage is PKR, all input and display is AED-only, and a transaction document simultaneously carries a `currency: 'AED'` field (misleadingly, since it describes the *original input* currency, not the unit `amount` is actually stored in) and a PKR-converted `amount` field. This is unfinished migration work, and it is the single most important thing to internalize before writing any code that reads or writes `transaction.amount`.

- **Navigation.** `src/routes.tsx` defines working routes for Banking, Loans, Bills, Budgets, Employees, User Management, Assets Management, Product Transfer, Against-the-Invoice, and Payable-to-Futuristic. A direct search of the codebase confirms **none of these have a corresponding link in `src/layouts/Sidebar.tsx`** — its `menuItems` array (`Sidebar.tsx:25-37`) contains only Transactions, Inventory, Invoices, and Payroll, plus a separately-conditioned Dashboard and Reports link. The Dashboard screen (`src/features/finance/Dashboard.tsx`) adds only a few more (`navigate('/invoices')`, `navigate('/inventory')`, `navigate('/payroll')`, `navigate('/reports')`, `navigate('/transactions')` — the same handful, found around `Dashboard.tsx:467-483`). This may be a deliberate, intentional redesign of the navigation that simply hasn't been finished (**INFERRED** — plausible given how much other mid-migration debris exists in this codebase) or an accidental regression where a sidebar rewrite dropped links that were never re-added. I could not determine which from the code alone — **NEEDS RUNTIME CHECK** / a conversation with whoever last touched `Sidebar.tsx`. Either way: "not in the sidebar" does not mean "not in use" in this application.

- **Payroll's old service files.** `src/modules/payroll/models/payrollFirebaseService.ts` and `payrollService.ts` are still exported from the module's `index.ts`, but do not appear to be called by the live `PayrollDashboardWrapper.tsx` (**INFERRED** leftover from before the batch-based rewrite). **NEEDS RUNTIME CHECK** to be fully certain nothing else in the codebase still imports them before deleting.

---

## 8. The Unwritten Rules

These are conventions a developer would only learn by reading a lot of this codebase — none of them are written down anywhere else.

- **Every `*FirebaseService` class follows the same internal shape, even though the filenames themselves are inconsistently cased.** Compare `InventoryFirebaseService.ts`, `Loanfirebaseservice.ts`, and `Budgetfirebaseservice.ts` — three different casing conventions for the same kind of file. Despite that, the *class* inside each one always follows the same shape: `static async` methods, one per Firestore operation, each Firestore call wrapped in `try/catch`, failures logged with `console.error` prefixed with an emoji (typically `❌`, with `✅` on success), and a generic re-thrown `Error` with a friendlier message for the calling viewmodel to catch and turn into a toast notification.

- **Two different data-fetching styles coexist, by design, not by accident.** Screens that need to feel "live" — the transaction list, the notification bell, the bank list — hold open a Firestore `onSnapshot` listener for the component's entire lifetime, so changes made anywhere (including by Cloud Functions, as in Section 3) appear instantly with no refresh. Screens that only need a one-time load use a plain `getDocs`-based `fetchAllXxx()` method instead. When adding a new list screen, look at a sibling screen inside the *same module* to see which style it already uses, rather than defaulting to one pattern everywhere.

- **`deepStripUndefined()` is reimplemented independently in nearly every service file, rather than shared from one utility.** Firestore throws an error if you try to write a literal `undefined` value, so this helper strips them out recursively before every write. Because each file has its own copy, if you're chasing a bug where a specific field silently fails to save, check whether the local copy in that particular file has drifted from the others.

- **Sequential, human-readable IDs (`TXN-DDMMYY-NNN`, `INV-DDMMYY-NNN`, etc.) always go through a dedicated Firestore counter document plus a `runTransaction`.** The clearest reference implementation of this pattern — including a deliberate split between a read-only "peek" (safe to call on every render, never consumes a number) and a "commit" (the atomic increment, called exactly once, right before the real write) — is documented in detail at `transactionFirebaseService.ts:142-244`. If you're adding a new kind of sequential ID anywhere in the app, copy this pattern rather than inventing a new one.

- **"Delete" frequently means "archive, then delete," not a true hard delete.** `TransactionFirebaseService.deleteTransaction()` (`transactionFirebaseService.ts:352-381`) copies the full document into a `deleted_transactions` collection, stamped with who deleted it and when, before removing it from the live `transactions` collection. The same shape recurs elsewhere in the app (for example, inventory has a parallel `deleted_products` collection). If you're asked to add "delete" to a new entity, check whether this archive-first convention should apply before reaching for a plain `deleteDoc`.

- **Static reference lists (branch names, category names) are duplicated across modules rather than shared from one source of truth**, as demonstrated concretely in Section 6, items 5 and 6. Don't assume that editing one list of "our branches" or "our currency rates" updates the others — it won't.

---

## 9. Where the Landmines Are, Ranked

1. **`functions/src/index.ts`, the `approveTransaction` and `rejectTransaction` functions (lines 388–552).** These are public, unauthenticated HTTP endpoints. Approving moves real money (indirectly, by triggering the bank-balance update described in Section 3, Step 9); rejecting permanently hard-deletes a financial record. The only check performed is `data.approvalToken !== token` (`:407`, `:470`) — a plain string comparison, with **no verification of who is making the request**. Anyone who obtains a valid `id` and `token` pair — via a forwarded email, browser history on a shared computer, or access to mail server/proxy logs — can approve or destroy a transaction. Do not touch this file without first fully understanding the journey traced in Section 3.

2. **`firestore.rules`.** This is the *only* server-side gate standing between any authenticated Firebase user and nearly every collection in the database — there is currently no role- or permission-based logic anywhere in this file; every rule reduces to "is this request authenticated at all." Additionally, several collections that live code actively reads and writes are not matched by any rule in this file at all: `assets`, `payroll_batches`, `payroll_batch_rows`, `againstInvoiceEntries`, `inventory_payable_configs`, `bank_transactions`, `dummy_invoices`, `deleted_transactions`, `companies`, `settings`, `salespersons`, and `pendingInventoryPayments`. Unmatched collections fall through to the default-deny block at the very end of the file (`firestore.rules:335-338`, `allow read, write: if false`). **NEEDS RUNTIME CHECK**: whether the rules actually deployed to the live Firebase project match this file — if they do, every feature listed above should currently be non-functional in production, which would be an important and immediately actionable thing to verify.

3. **`src/modules/transactions/viewModels/useTransactionFormViewModel.ts` — specifically the AED→PKR conversion at lines 606 and 721–725.** Misunderstand or mishandle this once, and every downstream dashboard total, report, or balance calculation that reads `transaction.amount` will be silently wrong by roughly a factor of 76 (the approximate PKR/AED exchange rate).

4. **`src/modules/banking/models/bankFirebaseService.ts`, together with its two callers `useTransferFormViewModel.ts` and `useBankListViewModel.ts`.** Balance updates here are done as separate, sequential `updateDoc` calls with no `runTransaction` or `writeBatch` wrapping them. A network failure partway through, or two people transferring money involving the same bank account at the same moment, can silently create or destroy recorded money with no error surfaced to either user.

5. **`src/modules/user-management/hooks/useUserPermissions.ts`, together with the `users/{userId}` rule in `firestore.rules:31-33`.** These two files, taken together, *are* the entire authorization system for the application. The Firestore rule currently allows a user to write to their own `users/{uid}` document — including its `role` field — with no restriction on which fields can be changed. Before modifying either file, understand both together: a well-intentioned fix to one without the other can leave a privilege-escalation path open even after the "fix" ships.

---

## 10. What to Read This Week, In Order

1. **`src/routes.tsx`.** By the end, you should be able to name essentially every screen the application has, and understand that the visible sidebar only exposes a fraction of them (Section 7).

2. **`src/modules/transactions/viewModels/useTransactionFormViewModel.ts`.** The single most information-dense file in the codebase. By the end, you should be able to explain the AED/PKR currency split (Section 3, Step 4) from memory, without looking it up.

3. **`src/modules/transactions/models/transactionFirebaseService.ts`.** By the end, you should understand the peek/commit sequential-ID pattern and the archive-then-delete convention well enough to correctly reuse both elsewhere in the codebase.

4. **`functions/src/index.ts`.** By the end, you should be able to draw the entire approval email → click → Firestore update → trigger loop from Section 3 on a whiteboard from memory, and explain in one sentence why the current approve/reject endpoints are a security risk.

5. **`firestore.rules`.** By the end, for any collection name someone gives you, you should be able to say with confidence whether a brand-new authenticated user account could successfully write to it.

6. **`src/modules/user-management/hooks/useUserPermissions.ts`, together with `src/modules/user-management/components/protectedroute.tsx`.** By the end, you should understand that screen-permission checks are read from `localStorage`, not fetched live from Firestore on every check, and be able to explain why that distinction matters.

7. **`src/modules/inventory/models/InventoryFirebaseService.ts`.** The largest and most mature module in the app. By the end, you should have a working mental template for what a well-built module in this codebase looks like — including a concrete example of where even the best module still falls short (it contains two separate, divergent ID-generation implementations for what should be one sequence).

---

## Open Questions

Everything below could not be determined from reading the code alone. Each entry names what would be needed to answer it.

1. **Does the deployed `firestore.rules` match the file in this repository?** The repository's version leaves several actively-used collections (`assets`, `payroll_batches`, `payroll_batch_rows`, `againstInvoiceEntries`, `inventory_payable_configs`, `bank_transactions`, `dummy_invoices`, and others) with no rule coverage at all, which would mean those features are currently broken in production if the deployed rules are identical. **To answer:** run `firebase deploy --only firestore:rules --dry-run` or check the Rules tab in the Firebase Console for the live project, and diff it against the local `firestore.rules` file.

2. **Is the navigation gap described in Section 7 (most routes missing from the sidebar/Dashboard) intentional or an accidental regression?** **To answer:** check git blame/history on `src/layouts/Sidebar.tsx` around when its `menuItems` array last shrank, or simply ask a teammate who was present for that change.

3. **Does creating a new user via the User Management screen actually switch the logged-in admin's session to the new user**, as the Firebase SDK's documented behavior for `createUserWithEmailAndPassword` would suggest, contradicting the inline comment at `UserManagement.tsx:117` that claims otherwise? **To answer:** log in as a super admin, create a test user, and check whether the app immediately reflects the new (lower-privilege) account as the active session.

4. **Are the environment variables the Cloud Functions expect (`GMAIL_USER`, `GMAIL_PASS`, `APPROVER_EMAILS`, `GMAIL_TO`) actually configured in the deployed Functions environment**, and do approval emails currently send successfully? **To answer:** check the Firebase Console's Functions configuration, or trigger a test transaction requiring approval and confirm an email arrives.

5. **Which report file(s) under `src/features/finance/` are the current, intended template for new reports**, versus which are legacy and only still present because they're wired into `App.tsx`'s dead import chain? **To answer:** check recent commit history for the most recently modified/added report component, or ask whoever built the most recent report feature.

6. **Are `src/modules/payroll/models/payrollFirebaseService.ts` and `payrollService.ts` genuinely dead**, or is there a code path that still calls them that a static read missed? **To answer:** a full project-wide "find usages" in an IDE, or temporarily instrumenting the two files with a log statement and exercising the Payroll module in a running instance of the app.

7. **Does the application currently build and run at all?** No `node_modules` folder is present in this repository, and the root `package.json` contains a malformed dependency version (`"cmdk": " Asc ^1.1.1"`) that may prevent a clean `npm install`. **To answer:** attempt `npm install` (after fixing the malformed version string) followed by `npm run dev`, in a disposable environment.

---

*This document was generated by reading the repository's source files directly; no code was executed to produce it except where explicitly marked "NEEDS RUNTIME CHECK" above, which remain unverified.*
