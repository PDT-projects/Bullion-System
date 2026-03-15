// Inventory Module - Wrapper
// ProductTransferCreateWrapper

import React from 'react';
import { useProductTransferCreateViewModel } from '../viewModels/useProductTransferCreateViewModel';
import { ProductTransferCreateView } from './ProductTransferCreateView';

export const ProductTransferCreateWrapper: React.FC = () => {
  const viewModel = useProductTransferCreateViewModel();
  return <ProductTransferCreateView {...viewModel} />;
};