// Transactions Module - List Wrapper
// Intercepts "Add Transaction" to open the QuickTransactionModal popup
// instead of navigating to a separate page.
//
// UPDATED for Phase 3: passes `cashBalance` to the modal so its Account
// dropdown can show a live Cash-in-Hand balance alongside each bank.

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useTransactionListViewModel } from '../viewModels/useTransactionListViewModel';
import { TransactionListView } from './TransactionListView';
import { QuickTransactionModal } from './QuickTransactionModal';
import { computeCashInHandBalance, computeBankBalance } from '../models/transactionsService';

export function TransactionListWrapper() {
  const vm = useTransactionListViewModel();
  const [showModal, setShowModal] = useState(false);
  const [banks, setBanks] = useState<{ id: string; name: string; balance?: number; accountNumber?: string }[]>([]);
  const [companies, setCompanies] = useState<string[]>(['Main Office']);

  // Load banks + companies for the popup
  useEffect(() => {
    if (!showModal) return;
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => setBanks(snap.docs.map(d => {
        const b = d.data() as any;
        return {
          id:            d.id,
          name:          b.name || '—',
          balance:       Number(b.balance) || 0,
          accountNumber: b.accountNumber,
        };
      })))
      .catch(() => {});
    getDocs(collection(db, 'companies'))
      .then(snap => {
        const list = snap.docs.map(d => (d.data() as any).name).filter(Boolean);
        setCompanies(list.length ? list : ['Main Office']);
      })
      .catch(() => setCompanies(['Main Office']));
  }, [showModal]);

  // Cash-in-Hand balance is computed live from the transactions the VM's
  // onSnapshot subscription is already streaming — no extra query needed.
  const cashBalance = useMemo(
    () => computeCashInHandBalance(vm.transactions || []),
    [vm.transactions],
  );

  // Bank running balances also derived live. The saved bank's stored balance
  // (if any) is used as the seed; the ledger delta is added on top so the
  // Account dropdown reflects reality regardless of whether other modules
  // updated the bank doc directly.
  const banksWithLiveBalance = useMemo(
    () => banks.map(b => ({
      ...b,
      balance: computeBankBalance(vm.transactions || [], b.id, b.balance ?? 0),
    })),
    [banks, vm.transactions],
  );

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