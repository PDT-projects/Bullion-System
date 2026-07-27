// Transactions Module - List Wrapper
// Intercepts "Add Transaction" to open the QuickTransactionModal popup
// instead of navigating to a separate page.
//
// FIXED: account balances now come from the shared `useAccountBalances` hook,
// which seeds Cash-in-Hand with the opening balance stored in
// `settings/cashOpening`. Previously this file computed
// `computeCashInHandBalance(vm.transactions)` with no seed, so the modal's
// Account dropdown showed the raw ledger delta and never reflected the opening
// balance — even right after the user set or changed it.
//
// Also fixed: banks/companies used to load only once the modal was opened
// (`if (!showModal) return`), so the first render of the dropdown showed an
// empty list and a 0 balance until the fetch landed. Both are now loaded up
// front, and banks stay live via onSnapshot.

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useTransactionListViewModel } from '../viewModels/useTransactionListViewModel';
import { useAccountBalances } from '../viewModels/useAccountBalances';
import { TransactionListView } from './TransactionListView';
import { QuickTransactionModal } from './QuickTransactionModal';

export function TransactionListWrapper() {
  const vm = useTransactionListViewModel();
  const [showModal, setShowModal] = useState(false);
  const [companies, setCompanies] = useState<string[]>(['Main Office']);

  // Cash-in-Hand + per-bank balances, live, opening-balance-seeded.
  const { banksWithLiveBalance, cashBalance } = useAccountBalances(vm.transactions);

  // Branch/company list for the popup. Loaded once on mount rather than on
  // modal open so the dropdown is populated the instant the modal appears.
  useEffect(() => {
    getDocs(collection(db, 'companies'))
      .then(snap => {
        const list = snap.docs.map(d => (d.data() as any).name).filter(Boolean);
        setCompanies(list.length ? list : ['Main Office']);
      })
      .catch(() => setCompanies(['Main Office']));
  }, []);

  return (
    <>
      <TransactionListView
        {...vm}
        handleCreateTransaction={() => setShowModal(true)}
      />
      {showModal && (
        <QuickTransactionModal
          banks={banksWithLiveBalance}
          companies={companies}
          cashBalance={cashBalance}
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