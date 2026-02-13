import { createContext, useContext, useState } from 'react';
import { Employee } from '../App';

type DataContextType = {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
};

export const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  return (
    <DataContext.Provider value={{ employees, setEmployees }}>
      {children}
    </DataContext.Provider>
  );
}
