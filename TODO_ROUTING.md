# Routing Implementation TODO

## Task: Add /employees route while maintaining existing state logic

### Steps:
- [ ] 1. Create DataContext to share App.tsx data with routes.tsx
- [ ] 2. Update routes.tsx to use DataContext and add /employees route
- [ ] 3. Update Sidebar.tsx with correct path for employees (/employees)
- [ ] 4. Verify the implementation

## Requirements:
- Pass exact same props: employees={data.employees} and setEmployees={(emps) => setData({ ...data, employees: emps })}
- Keep all Tailwind CSS classes for layout
- Use NavLink with isActive for active styling
- Protected route: If user is null, redirect to /login
