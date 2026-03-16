// Transactions Module - List Wrapper
import React from 'react';
import { useTransactionListViewModel } from '../viewModels/useTransactionListViewModel';
import { TransactionListView } from './TransactionListView';
export function TransactionListWrapper() {
  const vm = useTransactionListViewModel();
  return <TransactionListView {...vm} />;
}