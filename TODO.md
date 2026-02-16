# Fix Dashboard TypeError: Cannot read properties of null (reading 'transactions')

## Problem
The Dashboard component crashes with "TypeError: Cannot read properties of null (reading 'transactions')" at line 38 because `data.transactions` is null when the component first renders.

## Solution
Add null checks and provide default empty arrays in Dashboard.tsx

## Tasks
- [ ] Add null check for `data` prop in Dashboard component
- [ ] Add fallback empty arrays for `data.transactions`, `data.banks`, etc.
- [ ] Test the fix by running the dev server
