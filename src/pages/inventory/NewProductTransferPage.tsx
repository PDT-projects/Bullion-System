import { useState } from 'react';
import { Product, ProductTransfer } from '../../App';
import { NewProductTransferForm } from '../../features/inventory/NewProductTransferForm';
import { mockData } from '../../mockData';

export function NewProductTransferPage() {
  const [products, setProducts] = useState<Product[]>(mockData.products);
  const [transfers, setTransfers] = useState<ProductTransfer[]>(mockData.productTransfers);

  return (
    <NewProductTransferForm 
      products={products}
      setProducts={setProducts}
      transfers={transfers}
      setTransfers={setTransfers}
    />
  );
}
