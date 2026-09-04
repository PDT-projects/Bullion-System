// Payroll Batch Wrapper - wires ViewModel to View

import { usePayrollBatchViewModel } from '../viewModels/UsePayrollBatchViewModel';
import { PayrollBatchView } from './PayrollBatchView';

export function PayrollBatchWrapper() {
  const vm = usePayrollBatchViewModel();

  return (
    <PayrollBatchView
      batches={vm.batches}
      activeBatch={vm.activeBatch}
      rows={vm.rows}
      allRows={vm.allRows}
      employees={vm.employees}
      selectedRows={vm.selectedRows}
      isLoading={vm.isLoading}
      isGenerating={vm.isGenerating}
      editingRowId={vm.editingRowId}
      editValues={vm.editValues}
      showGenModal={vm.showGenModal}
      setShowGenModal={vm.setShowGenModal}
      genMonth={vm.genMonth}
      setGenMonth={vm.setGenMonth}
      filter={vm.filter}
      setFilter={vm.setFilter}
      departments={vm.departments}
      summaryStats={vm.summaryStats}
      fmt={vm.fmt}
      loadBatch={vm.loadBatch}
      generateBatch={vm.generateBatch}
      startEdit={vm.startEdit}
      saveEdit={vm.saveEdit}
      cancelEdit={vm.cancelEdit}
      recordPayment={vm.recordPayment}
      approveHR={vm.approveHR}
      approveManager={vm.approveManager}
      toggleWorkStatus={vm.toggleWorkStatus}
      toggleSelect={vm.toggleSelect}
      toggleSelectAll={vm.toggleSelectAll}
      setEditValues={vm.setEditValues}
    />
  );
}