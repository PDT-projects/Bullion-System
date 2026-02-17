import { useState } from 'react';
import { Invoices } from '../../features/sales/Invoices';
import { Invoice, Product, Bank, Employee, initialData, normalizeInitialData } from '../../App';

export function InvoicesPage() {
  // Use the initial data from App.tsx
  const [data, setData] = useState(() => normalizeInitialData(initialData));
  
  const setInvoices = (invoices: Invoice[]) => setData(prev => ({ ...prev, invoices }));
  const setProducts = (products: Product[]) => setData(prev => ({ ...prev, products }));

  return (
    <Invoices 
      invoices={data.invoices}
      setInvoices={setInvoices}
      products={data.products}
      setProducts={setProducts}
      banks={data.banks}
      employees={data.employees}
    />
  );
}
