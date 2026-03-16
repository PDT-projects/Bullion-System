// Commission Calculation Wrapper — fetches employees + invoices from Firestore

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import { CommissionCalculationView } from './CommissionCalculationView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import type { InvoiceReference } from '../models/types';

interface CommissionCalculationWrapperProps {
  onCommissionsSaved?: () => void;
}

export function CommissionCalculationWrapper({
  onCommissionsSaved = () => {}
}: CommissionCalculationWrapperProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<InvoiceReference[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch employees + invoices from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [fetchedEmployees, fetchedInvoices] = await Promise.all([
          EmployeeFirebaseService.fetchAllEmployees(),
          InvoiceFirebaseService.fetchAllInvoices(),
        ]);

        setEmployees(fetchedEmployees);

        // Map Invoice → InvoiceReference shape used by commission calculation logic
        const mappedInvoices: InvoiceReference[] = fetchedInvoices.map((inv) => ({
          id: inv.id,
          date: inv.date || '',
          // Use salespersonLocation (the city branch) for commission territory matching
          customerCity: inv.salespersonLocation || inv.customerCity || '',
          totalAmount: inv.totalAmount || 0,
          // Only 'Paid' invoices count toward commission
          status: inv.status === 'Paid' ? 'Paid' : 'Unpaid',
          salesperson: inv.salesperson || '',
        }));

        setInvoices(mappedInvoices);
      } catch (error) {
        toast.error('Failed to load data for commission calculation');
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const vm = useCommissionCalculationViewModel(onCommissionsSaved);

  // Pass real invoices + employees into the calculation
  const handleCalculate = () => vm.calculateCommission(invoices, employees);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto" />
          <p className="text-sm text-gray-500">Loading invoices and employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <CommissionCalculationView
      selectedCity={vm.selectedCity}
      setSelectedCity={vm.setSelectedCity}
      selectedMonth={vm.selectedMonth}
      setSelectedMonth={vm.setSelectedMonth}
      commissionData={vm.commissionData}
      calculationErrors={vm.calculationErrors}
      summary={vm.summary}
      showModal={vm.showModal}
      setShowModal={vm.setShowModal}
      isFullScreen={vm.isFullScreen}
      setIsFullScreen={vm.setIsFullScreen}
      isCalculating={vm.isCalculating}
      isEditing={vm.isEditing}
      editValues={vm.editValues}
      setEditValues={vm.setEditValues}
      calculateCommission={handleCalculate}
      confirmSingleCommission={vm.confirmSingleCommission}
      confirmAllCommissions={vm.confirmAllCommissions}
      startEdit={vm.startEdit}
      saveEdit={vm.saveEdit}
      cancelEdit={vm.cancelEdit}
      handleModalConfirm={vm.handleModalConfirm}
      handleModalCancel={vm.handleModalCancel}
      formatCurrency={vm.formatCurrency}
      formatMonth={vm.formatMonth}
      cities={vm.cities}
      employees={employees}
      // Pass invoice stats for the info panel
      totalInvoices={invoices.length}
      paidInvoices={invoices.filter(i => i.status === 'Paid').length}
    />
  );
}