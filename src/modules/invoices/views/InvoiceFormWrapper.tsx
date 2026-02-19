// Invoice Module - Form Wrapper
// Connects InvoiceFormViewModel to InvoiceFormView

import { Invoice, ProductInfo } from '../models/types';
import { useInvoiceFormViewModel } from '../viewModels/useInvoiceFormViewModel';
import { InvoiceFormView } from './InvoiceFormView';

// Employee interface for salesperson selection
interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'inactive';
}

interface InvoiceFormWrapperProps {
  invoices: Invoice[];
  products: ProductInfo[];
  employees: Employee[];
  banks: { id: string; name: string; accountNumber: string }[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

export function InvoiceFormWrapper({
  invoices,
  products,
  employees,
  banks,
  setInvoices,
  setProducts
}: InvoiceFormWrapperProps) {
  const {
    formData,
    selectedProducts,
    customerSuggestions,
    showSuggestions,
    isEditing,
    provinceCities,
    salespersonLocations,
    deliveryStatuses,
    collectionMethods,
    availableProducts,
    activeEmployees,
    setFormData,
    handleCustomerSearch,
    handleCustomerSelect,
    addProduct,
    removeProduct,
    updateProduct,
    updateSerial,
    getAvailableSerialsForProduct,
    handleSave,
    handleCancel,
    calculateTotal,
    formatCurrency
  } = useInvoiceFormViewModel({
    invoices,
    products,
    employees,
    banks,
    setInvoices,
    setProducts
  });

  return (
    <InvoiceFormView
      formData={formData}
      selectedProducts={selectedProducts}
      customerSuggestions={customerSuggestions}
      showSuggestions={showSuggestions}
      isEditing={isEditing}
      provinceCities={provinceCities}
      salespersonLocations={salespersonLocations}
      deliveryStatuses={deliveryStatuses}
      collectionMethods={collectionMethods}
      availableProducts={availableProducts}
      activeEmployees={activeEmployees}
      banks={banks}
      onFormChange={setFormData}
      onCustomerSearch={handleCustomerSearch}
      onCustomerSelect={handleCustomerSelect}
      onAddProduct={addProduct}
      onRemoveProduct={removeProduct}
      onUpdateProduct={updateProduct}
      onUpdateSerial={updateSerial}
      getAvailableSerials={getAvailableSerialsForProduct}
      onSave={handleSave}
      onCancel={handleCancel}
      calculateTotal={calculateTotal}
      formatCurrency={formatCurrency}
    />
  );
}
