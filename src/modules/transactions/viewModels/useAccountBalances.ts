// Transactions Module - Shared Account Balances hook
//
// ONE source of truth for "what is each account actually worth right now" —
// must always agree with the Balance Sheet report (BalanceSheetReport.tsx),
// which is the number users trust.
//
// TWO bugs fixed here (2026-09):
//
// 1. Bank balances were DOUBLE-COUNTED. Every bank transaction already
//    updates the bank doc's stored `balance` field directly at save time
//    (see updateBankBalance() in useTransactionFormViewModel). This hook then
//    treated that already-current `balance` as an "opening seed" and added
//    the SAME transaction's amount again by re-summing the full transaction
//    ledger — so every bank transaction was reflected twice in the Add
//    Transaction popup's Account dropdown, but only once on the Balance
//    Sheet (which just reads the stored field). Fix: banksWithLiveBalance
//    now simply mirrors the stored balance — no ledger re-summation.
//
// 2. Cash-in-Hand opening balance came from a DIFFERENT Firestore doc
//    (`settings/cashOpening`, a separate manual "Opening Balances" setting)
//    than the one the Balance Sheet / Dashboard use (`cashInHand` collection,
//    via CashFirebaseService). It also never merged in the `cash_transactions`
//    ledger collection, only the generic `transactions` collection. Fix:
//    cashBalance now uses the exact same opening source + merge/dedupe logic
//    as BalanceSheetReport, so the popup and the Balance Sheet always agree.

import { useEffect, useMemo, useState } from 'react';
import { Transaction } from '../models/types';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { CashFirebaseService } from '../../banking/models/cashFirebaseService';

export interface AccountBank {
  id: string;
  name: string;
  /** Live balance, straight from the bank doc (kept current on every save). */
  balance: number;
  accountNumber?: string;
}

export interface UseAccountBalancesReturn {
  /** Raw bank docs, live from Firestore — same values the Balance Sheet reads. */
  banks: AccountBank[];
  /** Same as `banks` — kept for API compatibility with existing callers. */
  banksWithLiveBalance: AccountBank[];
  /** Cash-in-Hand opening balance — same source as the Balance Sheet (`cashInHand` collection). */
  cashOpening: number;
  /** Cash-in-Hand LIVE balance = opening + merged cash ledger. Matches the Balance Sheet exactly. */
  cashBalance: number;
  /** Sum of every opening seed (cash + all banks). */
  openingTotal: number;
  /** Sum of every live balance (cash + all banks). */
  liveTotal: number;
  isLoading: boolean;
}

/**
 * @param transactions The live transactions list (from useTransactionListViewModel's
 *                     onSnapshot subscription). Only used for the Cash-mode merge now —
 *                     bank balances read straight off the bank doc, no re-summation.
 */
export function useAccountBalances(transactions: Transaction[]): UseAccountBalancesReturn {
  const [banks,        setBanks]        = useState<AccountBank[]>([]);
  const [cashOpening,  setCashOpening]  = useState<number>(0);
  const [cashLedgerTxns, setCashLedgerTxns] = useState<any[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);

  useEffect(() => {
    let cashReady = false;
    let banksReady = false;
    const settle = () => { if (cashReady && banksReady) setIsLoading(false); };

    // Same opening source as BalanceSheetReport / Dashboard: the `cashInHand`
    // collection, NOT the separate `settings/cashOpening` doc.
    let alive = true;
    Promise.all([
      CashFirebaseService.fetchAllCashRecords(),
      CashFirebaseService.fetchAllCashTransactions(),
    ]).then(([records, txns]) => {
      if (!alive) return;
      setCashOpening(records[0]?.balance || 0);
      setCashLedgerTxns(txns);
      cashReady = true;
      settle();
    }).catch(err => {
      console.error('[useAccountBalances] cash fetch failed:', err);
      cashReady = true;
      settle();
    });

    const unsubBanks = TransactionFirebaseService.subscribeToBanks(list => {
      setBanks(list);
      banksReady = true;
      settle();
    });

    return () => { alive = false; unsubBanks(); };
  }, []);

  // Cash: opening (cashInHand collection) + cash_transactions ledger, merged
  // and deduped with any 'transactions' doc paid via Cash mode — identical
  // logic to BalanceSheetReport's `details.cashIn / details.cashOut`, so the
  // popup and the Balance Sheet never disagree.
  const cashBalance = useMemo(() => {
    const cashModeTxns = (transactions || []).filter((t: any) => t.mode === 'Cash');
    const cashKeyOf = (t: any) => {
      const ref = (t.note || '').trim().toLowerCase();
      return ref ? `${ref}__${t.amount}` : `id__${t.id}`;
    };
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const t of [...cashLedgerTxns, ...cashModeTxns]) {
      const key = cashKeyOf(t);
      if (!seen.has(key)) { seen.add(key); merged.push(t); }
    }
    const cashIn  = merged.filter(t => t.mainCategory === 'Cash Inflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const cashOut = merged.filter(t => t.mainCategory === 'Cash Outflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return cashOpening + cashIn - cashOut;
  }, [transactions, cashLedgerTxns, cashOpening]);

  // Banks: read straight off the live bank doc — no ledger re-summation.
  // The stored `balance` is already kept current on every transaction save
  // (updateBankBalance), so re-adding the ledger here would double-count.
  const banksWithLiveBalance = banks;

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