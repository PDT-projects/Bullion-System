// Loans Module - Loan Form Wrapper
// Fetches employees and banks from Firestore before mounting the ViewModel.
// The inner component is only rendered once both arrays are ready,
// preventing useMemo in useLoanFormViewModel from calling .find on a non-array.

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLoanFormViewModel } from '../viewModels/useLoanFormViewModel';
import { LoanFormView } from './LoanFormView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import type { Bank, Employee, LoanType } from '../models/types';

interface LoanFormWrapperProps {
  defaultType?: LoanType;
}

// ─── Inner component — only mounted after employees + banks are loaded ────────
// Keeps all ViewModel hooks in a child that never renders with empty/undefined arrays.

interface InnerProps {
  banks: Bank[];
  employees: Employee[];
  defaultType?: LoanType;
}

const LoanFormInner: React.FC<InnerProps> = ({ banks, employees, defaultType }) => {
  const vm = useLoanFormViewModel(banks, employees, defaultType);

  return (
    <LoanFormView
      formData={vm.formData}
      isLoading={vm.isLoading}
      isSubmitting={vm.isSubmitting}
      errors={vm.errors}
      isEditing={vm.isEditing}
      remaining={vm.remaining}
      status={vm.status}
      availableBanks={vm.availableBanks}
      availableEmployees={vm.availableEmployees}
      setEntityName={vm.setEntityName}
      setLoanAmount={vm.setLoanAmount}
      setPaidAmount={vm.setPaidAmount}
      setDate={vm.setDate}
      setType={vm.setType}
      setLoanCategory={vm.setLoanCategory}
      setPaymentMode={vm.setPaymentMode}
      setBank={vm.setBank}
      setReceiverType={vm.setReceiverType}
      setReceiverName={vm.setReceiverName}
      setReceiverPhone={vm.setReceiverPhone}
      setEmployee={vm.setEmployee}
      onSubmit={vm.handleSubmit}
      onCancel={vm.handleCancel}
      isBankMode={vm.isBankMode}
      isEmployeeReceiver={vm.isEmployeeReceiver}
      selectedBank={vm.selectedBank}
    />
  );
};

// ─── Outer wrapper — fetches deps, gates rendering until ready ───────────────

export const LoanFormWrapper: React.FC<LoanFormWrapperProps> = ({ defaultType }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      EmployeeFirebaseService.fetchAllEmployees(),
      BankFirebaseService.fetchAllBanks(),
    ])
      .then(([emps, bnks]) => {
        setEmployees(emps);
        setBanks(bnks);
      })
      .catch(() => toast.error('Failed to load employees/banks'))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading form data...</p>
        </div>
      </div>
    );
  }

  return <LoanFormInner banks={banks} employees={employees} defaultType={defaultType} />;
};