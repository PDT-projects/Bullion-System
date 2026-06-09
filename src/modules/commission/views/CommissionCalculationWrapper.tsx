// Commission Calculation Wrapper
// CHANGED (salesperson-first multi-select):
//   - No longer derives `invoiceCities` from invoice data.
//   - Passes `allEmployees` to CommissionCalculationView for the salesperson dropdown.
//   - Wires `selectedSalespersons`, `toggleSalesperson`, `clearSalespersons`
//     from the updated ViewModel.
//   - Everything else (invoice mapping, salary linking, debug panel) is unchanged.

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import { CommissionCalculationView } from './CommissionCalculationView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import type { InvoiceReference } from '../models/types';

// Strip the full company prefix from a branch string.
const COMPANY_PREFIXES = [
  'Pakistan Detector Technologies Pvt. Ltd — ', // em-dash U+2014 (most common)
  'Pakistan Detector Technologies Pvt. Ltd – ', // en-dash U+2013
  'Pakistan Detector Technologies Pvt. Ltd - ', // plain hyphen-space
];
function extractBranch(raw: string | undefined): string {
  if (!raw) return '';
  const t = raw.trim();
  for (const prefix of COMPANY_PREFIXES) {
    if (t.startsWith(prefix)) return t.slice(prefix.length).trim();
  }
  const genericMatch = t.match(/^Pakistan Detector Technologies[^—–-]*[—–-]\s*(.+)$/);
  if (genericMatch) return genericMatch[1].trim();
  const bareCompanyPrefix = t.match(/^Pakistan Detector Technologies[^—–-]*$/i);
  if (bareCompanyPrefix) return '';
  return t;
}

interface CommissionCalculationWrapperProps {
  onCommissionsSaved?: () => void;
}

export function CommissionCalculationWrapper({
  onCommissionsSaved = () => {}
}: CommissionCalculationWrapperProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<InvoiceReference[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const vm = useCommissionCalculationViewModel(onCommissionsSaved);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [fetchedEmployees, fetchedInvoices] = await Promise.all([
          EmployeeFirebaseService.fetchAllEmployees(),
          InvoiceFirebaseService.fetchAllInvoices(),
        ]);

        setEmployees(fetchedEmployees);

        const mappedInvoices: InvoiceReference[] = fetchedInvoices.map((inv) => {
          const locFromBranch      = extractBranch(inv.branch);
          const locFromSalesperson = extractBranch(inv.salespersonLocation);
          const locFromCustomerCity = extractBranch(inv.customerCity);

          const branchCity = locFromSalesperson || locFromBranch || locFromCustomerCity || '';

          // Resolve salesperson by ID → name for consistent grouping
          let salespersonRaw = inv.salesperson || '';
          const matchedById = (fetchedEmployees || []).find((e: any) => e.id === salespersonRaw);
          const salespersonName = matchedById ? matchedById.name : salespersonRaw;

          return {
            id:   inv.id,
            date: inv.date || '',
            salesperson:         salespersonName,
            salespersonLocation: branchCity,
            branch:              inv.branch || branchCity,
            customerCity:        inv.customerCity || branchCity,
            totalAmount:         inv.totalAmount || 0,
            status:              inv.status === 'Paid' ? 'Paid' : 'Unpaid',
          };
        });

        setInvoices(mappedInvoices);

        console.log('[CommissionWrapper] Total invoices mapped:', mappedInvoices.length);
        console.log('[CommissionWrapper] Paid invoices:', mappedInvoices.filter(i => i.status === 'Paid').length);
        console.log('[CommissionWrapper] Employees loaded:', fetchedEmployees.length);

      } catch (error) {
        toast.error('Failed to load data for commission calculation');
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCalculate = () => vm.calculateCommission(invoices, employees);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto" />
          <p className="text-sm text-gray-500">Loading invoices and employee data…</p>
        </div>
      </div>
    );
  }

  return (
    <CommissionCalculationView
      // ── Salesperson multi-select (new) ──────────────────────────────────
      selectedSalespersons={vm.selectedSalespersons}
      toggleSalesperson={vm.toggleSalesperson}
      clearSalespersons={vm.clearSalespersons}
      allEmployees={employees.map((e: any) => ({ id: e.id, name: e.name }))}

      // ── Month ────────────────────────────────────────────────────────────
      selectedMonth={vm.selectedMonth}
      setSelectedMonth={vm.setSelectedMonth}

      // ── Results / state ──────────────────────────────────────────────────
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

      // ── Breakdown panel ───────────────────────────────────────────────────
      invoiceBreakdowns={vm.invoiceBreakdowns}
      expandedSalesperson={vm.expandedSalesperson}
      setExpandedSalesperson={vm.setExpandedSalesperson}

      // ── Actions ──────────────────────────────────────────────────────────
      calculateCommission={handleCalculate}
      confirmSingleCommission={vm.confirmSingleCommission}
      confirmAllCommissions={vm.confirmAllCommissions}
      startEdit={vm.startEdit}
      saveEdit={vm.saveEdit}
      cancelEdit={vm.cancelEdit}
      handleModalConfirm={vm.handleModalConfirm}
      handleModalCancel={vm.handleModalCancel}

      // ── Formatters ────────────────────────────────────────────────────────
      formatCurrency={vm.formatCurrency}
      formatMonth={vm.formatMonth}

      // ── Invoice count cards ───────────────────────────────────────────────
      totalInvoices={invoices.length}
      paidInvoices={invoices.filter(i => i.status === 'Paid').length}

      // ── Live commissions panel ────────────────────────────────────────────
      liveCommissions={vm.liveCommissions}
      liveCommissionsLoading={vm.liveCommissionsLoading}
      refreshLiveCommissions={vm.refreshLiveCommissions}

      // ── Kept for any consumers that still read `employees` from this prop ─
      employees={employees}
    />
  );
}