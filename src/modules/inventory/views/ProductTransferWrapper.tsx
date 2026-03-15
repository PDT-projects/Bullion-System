// Inventory Module - Wrapper
// ProductTransferWrapper

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductTransferViewModel } from '../viewModels/useProductTransferViewModel';
import { ProductTransferView } from './ProductTransferView';

export const ProductTransferWrapper: React.FC = () => {
  const navigate  = useNavigate();
  const viewModel = useProductTransferViewModel();

  return (
    <ProductTransferView
      transfers={viewModel.transfers}
      viewTransfer={viewModel.viewTransfer}
      isLoading={viewModel.isLoading}
      stats={viewModel.stats}
      onAdd={() => navigate('/product-transfer/new')}
      onView={t => viewModel.setViewTransfer(t)}
      onMarkReceived={t => viewModel.handleMarkReceived(t)}
      onDelete={id => viewModel.handleDeleteTransfer(id)}
      onCloseView={() => viewModel.setViewTransfer(null)}
      formatDate={viewModel.formatDate}
    />
  );
};