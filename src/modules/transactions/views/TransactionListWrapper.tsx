// Transactions Module - List Wrapper
// Intercepts "Add Transaction" to open the QuickTransactionModal popup
// instead of navigating to a separate page.

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useTransactionListViewModel } from '../viewModels/useTransactionListViewModel';
import { TransactionListView } from './TransactionListView';
import { QuickTransactionModal } from './QuickTransactionModal';

export function TransactionListWrapper() {
  const vm = useTransactionListViewModel();
  const [showModal, setShowModal] = useState(false);
  const [banks, setBanks] = useState<{ id: string; name: string; balance?: number }[]>([]);
  const [companies, setCompanies] = useState<string[]>(['Main Office']);

  // Load banks + companies for the popup
  useEffect(() => {
    if (!showModal) return;
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => setBanks(snap.docs.map(d => {
        const b = d.data() as any;
        return { id: d.id, name: b.name || '—', balance: Number(b.balance) || 0 };
      })))
      .catch(() => {});
    getDocs(collection(db, 'companies'))
      .then(snap => {
        const list = snap.docs.map(d => (d.data() as any).name).filter(Boolean);
        setCompanies(list.length ? list : ['Main Office']);
      })
      .catch(() => setCompanies(['Main Office']));
  }, [showModal]);

  return (
    <>
      <TransactionListView
        {...vm}
        handleCreateTransaction={() => setShowModal(true)}
      />
      {showModal && (
        <QuickTransactionModal
          banks={banks}
          companies={companies}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            // onSnapshot keeps the list live, but trigger a manual refresh too
            vm.refreshTransactions?.();
          }}
        />
      )}
    </>
  );
}