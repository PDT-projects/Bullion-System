import { useState } from 'react';
import { Product, ProductTransfer } from '../../App';
import { ProductTransfers } from '../../features/inventory/ProductTransfer';
import { mockData } from '../../mockData';

export function ProductTransferPage() {
  const [products, setProducts] = useState<Product[]>(mockData.products);
  const [transfers, setTransfers] = useState<ProductTransfer[]>(mockData.productTransfers);

  return (
    <ProductTransfers 
      products={products}
      setProducts={setProducts}
      transfers={transfers}
      setTransfers={setTransfers}
    />
  );
}
