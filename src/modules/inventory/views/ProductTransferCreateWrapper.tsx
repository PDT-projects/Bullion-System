// Inventory Module - Wrapper Component
// ProductTransferCreateWrapper - Connects ViewModel to View for creating transfers

import React, { useState } from 'react';
import { useProductTransferCreateViewModel } from '../viewModels/useProductTransferCreateViewModel';
import { ProductTransferCreateView } from './ProductTransferCreateView';

export const ProductTransferCreateWrapper: React.FC = () => {
  const viewModel = useProductTransferCreateViewModel();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  return (
    <ProductTransferCreateView
      products={viewModel.products}
      locations={viewModel.locations}
      formData={viewModel.formData}
      transferItems={viewModel.transferItems}
      receiptName={viewModel.receiptName}
      receiptType={viewModel.receiptType}
      receiptDataUrl={viewModel.receiptDataUrl}
      showSummary={viewModel.showSummary}
      isSubmitting={viewModel.isSubmitting}
      validation={viewModel.validation}
      isFullScreen={isFullScreen}
      setFormField={viewModel.setFormField}
      addTransferItem={viewModel.addTransferItem}
      removeTransferItem={viewModel.removeTransferItem}
      updateTransferItemProduct={viewModel.updateTransferItemProduct}
      updateTransferItemQuantity={viewModel.updateTransferItemQuantity}
      updateTransferItemSerial={viewModel.updateTransferItemSerial}
      handleReceiptChange={viewModel.handleReceiptChange}
      toggleSummary={viewModel.toggleSummary}
      toggleFullScreen={toggleFullScreen}
      handleSave={viewModel.handleSave}
      handlePreviewPdf={viewModel.handlePreviewPdf}
      handleDownloadPdf={viewModel.handleDownloadPdf}
      onBack={viewModel.onBack}
      getAvailableSerials={viewModel.getAvailableSerials}
      getProductStockByLocation={viewModel.getProductStockByLocation}
      getProductById={viewModel.getProductById}
    />
  );
};
