// Commission Calculation Wrapper — fetches employees + invoices from Firestore

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import { CommissionCalculationView } from './CommissionCalculationView';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import type { InvoiceReference } from '../models/types';

// Strip the full company prefix that some invoice form versions store in `branch`.
// The separator character varies by how the invoice was created:
//   hyphen:   'Pakistan Detector Technologies Pvt. Ltd - Saudia'
//   em-dash:  'Pakistan Detector Technologies Pvt. Ltd — Saudia'  ← most common
//   en-dash:  'Pakistan Detector Technologies Pvt. Ltd – Saudia'
// All three are handled. If no prefix matches, the raw value is returned as-is
// (e.g. 'Saudia' stored directly → 'Saudia').
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
  // Generic fallback: match any "Pakistan Detector Technologies..." followed by any dash
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
          // Resolve the invoice's office/branch location from `branch` first.
          // If the invoice has a branch office saved, use that as the commission
          // selection key. Fallback to salespersonLocation only when branch is
          // missing or blank.
          const locFromBranch = extractBranch(inv.branch);
          const locFromSalesperson = extractBranch(inv.salespersonLocation);
          const locFromCustomerCity = extractBranch(inv.customerCity);

          // Prefer the explicit `salespersonLocation` field when present (this
          // is the direct invoice location the salesperson selected). Fall
          // back to `branch` (company prefix stripped) and then
          // `customerCity`. This ensures we use the invoice's exact location
          // rather than an often-stored company branch prefix like 'Saudia'.
          const branchCity = locFromSalesperson || locFromBranch || locFromCustomerCity || '';

          // Some historical invoices may have stored `salesperson` as an employee ID
          // while newer ones store the NAME. If we detect an ID that matches a
          // fetched employee, replace it with the employee's name so downstream
          // grouping (which expects names) works consistently.
          let salespersonRaw = inv.salesperson || '';
          const matchedById = (fetchedEmployees || []).find(e => e.id === salespersonRaw);
          const salespersonName = matchedById ? matchedById.name : salespersonRaw;

          return {
            id:   inv.id,
            date: inv.date || '',

            // Store the resolved salesperson NAME (or original string if unresolved).
            salesperson:         salespersonName,

            // salespersonLocation is what the ViewModel uses for city matching.
            salespersonLocation: branchCity,
            branch:              inv.branch || branchCity,

            // customerCity is kept for reference and can help recover missing
            // branch values from older invoice payloads.
            customerCity: inv.customerCity || branchCity,

            totalAmount: inv.totalAmount || 0,
            status:      inv.status === 'Paid' ? 'Paid' : 'Unpaid',
          };
        });

        setInvoices(mappedInvoices);

        // Unique sorted city list derived from actual invoice data for the dropdown.
        // Derive unique cities from multiple invoice fields. Deduplicate
        // case-insensitively but preserve the first-seen display form so UI
        // shows familiar capitalization (e.g., 'Dubai', 'Abu Dhabi'). Include
        // `productLocation` and `warrantyLocation` as invoices sometimes store
        // the office there.
        const cityCandidates = [
          ...mappedInvoices.map(inv => inv.salespersonLocation || ''),
          ...mappedInvoices.map(inv => inv.branch || ''),
          ...mappedInvoices.map(inv => inv.customerCity || ''),
          ...mappedInvoices.map(inv => (inv as any).productLocation || ''),
          ...mappedInvoices.map(inv => (inv as any).warrantyLocation || ''),
        ].filter(Boolean);

        const cityMap = new Map<string, string>();
        for (const c of cityCandidates) {
          const n = c.trim().toLowerCase();
          if (!n) continue;
          if (!cityMap.has(n)) cityMap.set(n, c.trim());
        }

        const uniqueCities = Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b));

        console.log('[CommissionWrapper] Cities derived from invoices:', uniqueCities);
        console.log('[CommissionWrapper] Total invoices mapped:', mappedInvoices.length);
        console.log('[CommissionWrapper] Paid invoices:', mappedInvoices.filter(i => i.status === 'Paid').length);

        vm.setInvoiceCities(uniqueCities);

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
      totalInvoices={invoices.length}
      paidInvoices={invoices.filter(i => i.status === 'Paid').length}
      invoiceBreakdowns={vm.invoiceBreakdowns}
      expandedSalesperson={vm.expandedSalesperson}
      setExpandedSalesperson={vm.setExpandedSalesperson}
      liveCommissions={vm.liveCommissions}
      liveCommissionsLoading={vm.liveCommissionsLoading}
      refreshLiveCommissions={vm.refreshLiveCommissions}
      // Debug: sample of invoice location fields to help verify mapping
      debugInvoiceLocations={invoices.slice(0, 200).map(i => ({
        id: i.id,
        salespersonLocation: i.salespersonLocation,
        branch: i.branch,
        customerCity: i.customerCity,
        productLocation: (i as any).productLocation,
        warrantyLocation: (i as any).warrantyLocation,
      }))}
    />
  );
}