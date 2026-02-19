// Invoice Module - Delete ViewModel
// Manages invoice delete confirmation and execution

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Invoice, ProductInfo } from '../models/types';

interface UseInvoiceDeleteViewModelProps {
  invoices: Invoice[];
  products: ProductInfo[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

interface UseInvoiceDeleteViewModelReturn {
  handleDelete: (id: string) => void;
  handleCancel: () => void;
}

export const useInvoiceDeleteViewModel = ({
  invoices,
  products,
  setInvoices,
  setProducts
}: UseInvoiceDeleteViewModelProps): UseInvoiceDeleteViewModelReturn => {
  const navigate = useNavigate();
  
  const handleDelete = useCallback((id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (!invoiceToDelete) {
      toast.error('Invoice not found');
      navigate('/invoices');
      return;
    }
    
    // Return products to inventory
    const updatedProducts = products.map(product => {
      const returnedProduct = invoiceToDelete.products.find(p => p.productId === product.id);
      if (returnedProduct && returnedProduct.serialNumbers) {
        return {
          ...product,
          serialNumbers: [...product.serialNumbers, ...returnedProduct.serialNumbers],
          stock: product.stock + returnedProduct.quantity
        };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    setInvoices(invoices.filter(inv => inv.id !== id));
    toast.success('Invoice deleted successfully');
    navigate('/invoices');
  }, [invoices, products, setInvoices, setProducts, navigate]);
  
  const handleCancel = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);
  
  return {
    handleDelete,
    handleCancel
  };
};
