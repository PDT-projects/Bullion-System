// Transactions Module - Shared Account Balances hook
//
// ONE source of truth for "what is each account actually worth right now".
//
// The bug this fixes: the Cash-in-Hand OPENING balance lives in a single
// Firestore doc (`settings/cashOpening`). Only TransactionListView ever read
// it, and it read it once on mount. TransactionListWrapper — the thing that
// feeds QuickTransactionModal — computed `cashBalance` straight from
// computeCashInHandBalance(transactions), i.e. the raw ledger delta with no
// seed. So the summary strip showed one number and the Account dropdown inside
// the transaction modal showed a different one, and changing the opening
// balance never moved the modal at all.
//
// Everything here is a live subscription, so setting or changing the opening
// balance is reflected everywhere immediately — no refresh, no remount.

import { useEffect, useMemo, useState } from 'react';
import { Transaction } from '../models/types';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { computeCashInHandBalance, computeBankBalance } from '../models/transactionsService';

export interface AccountBank {
  id: string;
  name: string;
  /** Opening/seed balance as stored on the bank doc. */
  balance: number;
  accountNumber?: string;
}

export interface UseAccountBalancesReturn {
  /** Raw bank docs — `balance` is the stored OPENING balance. */
  banks: AccountBank[];
  /** Same banks, but `balance` is opening + live ledger delta. Use for display. */
  banksWithLiveBalance: AccountBank[];
  /** Cash-in-Hand opening balance (settings/cashOpening.amount). */
  cashOpening: number;
  /** Cash-in-Hand LIVE balance = opening + cash ledger delta. Use for display. */
  cashBalance: number;
  /** Sum of every opening seed (cash + all banks). */
  openingTotal: number;
  /** Sum of every live balance (cash + all banks). */
  liveTotal: number;
  isLoading: boolean;
}

/**
 * @param transactions The live transactions list (from useTransactionListViewModel's
 *                     onSnapshot subscription). Ledger deltas are derived from it.
 */
export function useAccountBalances(transactions: Transaction[]): UseAccountBalancesReturn {
  const [banks,       setBanks]       = useState<AccountBank[]>([]);
  const [cashOpening, setCashOpening] = useState<number>(0);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    let cashReady = false;
    let banksReady = false;
    const settle = () => { if (cashReady && banksReady) setIsLoading(false); };

    const unsubCash = TransactionFirebaseService.subscribeToCashOpening(amount => {
      setCashOpening(amount);
      cashReady = true;
      settle();
    });
    const unsubBanks = TransactionFirebaseService.subscribeToBanks(list => {
      setBanks(list);
      banksReady = true;
      settle();
    });

    return () => { unsubCash(); unsubBanks(); };
  }, []);

  // Cash: opening seed + cash-mode ledger delta.
  const cashBalance = useMemo(
    () => computeCashInHandBalance(transactions || [], cashOpening),
    [transactions, cashOpening],
  );

  // Banks: each bank's stored opening seed + its own ledger delta.
  const banksWithLiveBalance = useMemo(
    () => banks.map(b => ({
      ...b,
      balance: computeBankBalance(transactions || [], b.id, b.balance ?? 0),
    })),
    [banks, transactions],
  );

  const openingTotal = useMemo(
    () => cashOpening + banks.reduce((s, b) => s + (b.balance || 0), 0),
    [cashOpening, banks],
  );

  const liveTotal = useMemo(
    () => cashBalance + banksWithLiveBalance.reduce((s, b) => s + (b.balance || 0), 0),
    [cashBalance, banksWithLiveBalance],
  );

  return {
    banks,
    banksWithLiveBalance,
    cashOpening,
    cashBalance,
    openingTotal,
    liveTotal,
    isLoading,
  };
}