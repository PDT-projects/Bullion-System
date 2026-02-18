# Loans Dropdown Implementation

## Tasks:
- [x] 1. Update `src/layouts/Sidebar.tsx` - Add loans dropdown menu with All Loans, Payable, and Receivable options

- [x] 2. Update `src/routes.tsx` - Add loan routes and layout components
- [x] 3. Test navigation and verify all loan pages work correctly


## Implementation Details:

### Sidebar Changes:
- Add `HandCoins` icon import from lucide-react
- Add new loans menu item with children:
  - All Loans → /loans
  - Payable → /loans/payable
  - Receivable → /loans/receivable
- Add 'loans' to expandedSections state

### Routes Changes:
- Import loan components (Loans, LoansPayable, LoansReceivable)
- Create LoansLayout component
- Add /loans route with children for payable and receivable
- Create wrapper components for each loan route
