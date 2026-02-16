import { useState } from 'react';
import { Employees } from '../features/hr/Employees';
import { Employee } from '../App';

// Dummy employees data
const dummyEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ahmed Khan',
    position: 'Sales Manager',
    salary: 85000,
    phone: '+92 300 1234567',
    email: 'ahmed.khan@pdt.com',
    joinDate: '2023-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Fatima Ali',
    position: 'Product Developer',
    salary: 75000,
    phone: '+92 321 9876543',
    email: 'fatima.ali@pdt.com',
    joinDate: '2023-03-20',
    status: 'active'
  },
  {
    id: '3',
    name: 'Hassan Raza',
    position: 'Marketing Executive',
    salary: 65000,
    phone: '+92 333 5551234',
    email: 'hassan.raza@pdt.com',
    joinDate: '2023-06-10',
    status: 'active'
  },
  {
    id: '4',
    name: 'Ayesha Malik',
    position: 'Accountant',
    salary: 70000,
    phone: '+92 345 7778888',
    email: 'ayesha.malik@pdt.com',
    joinDate: '2022-11-05',
    status: 'active'
  }
];

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(dummyEmployees);

  return (
    <Employees employees={employees} setEmployees={setEmployees} />
  );
}
