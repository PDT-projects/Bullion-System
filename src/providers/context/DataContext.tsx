import { createContext, useContext, useState } from 'react';
import { AppData, normalizeInitialData, initialData } from '../../App';

type DataContextType = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
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
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}
