// Salary Module - Wrapper Component
// SalaryListWrapper - No context dependency

import { useSalaryListViewModel } from '../viewModels/useSalaryListViewModel';
import { SalaryListView } from './SalaryListView';

interface SalaryListWrapperProps {
  type: 'regular' | 'advance' | 'all';
  title: string;
  employees?: any[];
}

export function SalaryListWrapper({ type, title, employees = [] }: SalaryListWrapperProps) {
  const viewModel = useSalaryListViewModel();

  // Filter by type if needed
  const filteredSalaries =
    type === 'all'
      ? viewModel.salaries
      : viewModel.salaries.filter(s => {
          const subCat = s.subCategory?.toLowerCase() || '';
          if (type === 'regular') {
            return subCat.includes('employee salary') || subCat === 'salary';
          }
          return subCat.includes('advance salary');
        });

  return (
    <SalaryListView
      salaries={filteredSalaries}
      allSalaries={viewModel.allSalaries}
      filters={viewModel.filters}
      showFilters={viewModel.showFilters}
      activeFilterCount={viewModel.activeFilterCount}
      viewingSalary={viewModel.viewingSalary}
      isLoading={viewModel.isLoading}
      stats={viewModel.stats}
      uniqueEmployees={viewModel.uniqueEmployees}
      uniqueMonths={viewModel.uniqueMonths}
      setFilter={viewModel.setFilter}
      clearFilters={viewModel.clearFilters}
      toggleFilters={viewModel.toggleFilters}
      setViewingSalary={viewModel.setViewingSalary}
      handleDelete={viewModel.handleDelete}
      handleAdd={viewModel.handleAdd}
      handlePrint={viewModel.handlePrint}
      handleEdit={viewModel.handleEdit}
      getSalaryTypeColor={viewModel.getSalaryTypeColor}
      getEmployeeTotalPaid={viewModel.getEmployeeTotalPaid}
      isEmployeeFullyPaid={viewModel.isEmployeeFullyPaid}
      employees={employees}
      onBack={() => window.history.back()}
      title={title}
      type={type}
    />
  );
}