# TODO: Complete Advance Salary Integration

## Tasks
- [ ] Update Salary.tsx: Remove useNavigate import, add setActiveModule prop, change button to use setActiveModule('advance-salary')
- [ ] Update App.tsx: Pass setActiveModule to Salary, add 'advance-salary' case in renderModule, remove Route for AdvanceSalary
- [ ] Update Sidebar.tsx: Add 'Advance Salary' menu item under Finance
- [ ] Improve AdvanceSalary.tsx: Add min="0" to inputs, prevent negatives, add bank validation, integrate with transactions

## Followup
- [ ] Test navigation from Salary to Advance Salary
- [ ] Verify transactions and bank updates
- [ ] Ensure no negative values in forms
