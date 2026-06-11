// Loans Module - Loan Payment Wrapper
// Fetches banks from Firestore before mounting the ViewModel.
// The inner component is only rendered once the banks array is ready.
// Currency: AED (UAE Dirham)

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLoanPaymentViewModel } from '../viewModels/useLoanPaymentViewModel';
import { LoanPaymentView } from './LoanPaymentView';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import type { Bank } from '../models/types';

// ─── Inner component — only mounted after banks are loaded ────────────────────

interface InnerProps {
  banks: Bank[];
}

const LoanPaymentInner: React.FC<InnerProps> = ({ banks }) => {
  const vm = useLoanPaymentViewModel(banks);

  return (
    <LoanPaymentView
      loan={vm.loan}
      formData={vm.formData}
      isLoading={vm.isLoading}
      isSubmitting={vm.isSubmitting}
      error={vm.error}
      canPay={vm.canPay}
      maxPaymentAmount={vm.maxPaymentAmount}
      remainingAfterPayment={vm.remainingAfterPayment}
      newStatus={vm.newStatus}
      progressBefore={vm.progressBefore}
      progressAfter={vm.progressAfter}
      availableBanks={vm.availableBanks}
      selectedBank={vm.selectedBank}
      isBankMode={vm.isBankMode}
      setAmount={vm.setAmount}
      setPaymentMode={vm.setPaymentMode}
      setBank={vm.setBank}
      onSubmit={vm.handleSubmit}
      onCancel={vm.handleCancel}
    />
  );
};

// ─── Outer wrapper — fetches deps, gates rendering until ready ───────────────

export const LoanPaymentWrapper: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    BankFirebaseService.fetchAllBanks()
      .then(setBanks)
      .catch(() => toast.error('Failed to load banks'))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading banks...</p>
        </div>
      </div>
    );
  }

  return <LoanPaymentInner banks={banks} />;
};