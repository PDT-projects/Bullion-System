import { useOutletContext } from 'react-router-dom';
import { Employees } from '../features/hr/Employees';
import { Employee } from '../App';

export function EmployeesPage() {
  const { employees, setEmployees } = useOutletContext<{ employees: Employee[]; setEmployees: (employees: Employee[]) => void }>();

  return (
    <Employees employees={employees} setEmployees={setEmployees} />
  );
}
