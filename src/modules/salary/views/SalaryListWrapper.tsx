// Salary Module - Wrapper Component
// SalaryListWrapper - Connects ViewModel to View for list page

import { useOutletContext } from 'react-router-dom';
import { useSalaryListViewModel } from '../viewModels/useSalaryListViewModel';
import { SalaryListView } from './SalaryListView';

interface SalaryContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  employees: any[];
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface SalaryListWrapperProps {
  type: 'regular' | 'advance' | 'all';
  title: string;
}

export function SalaryListWrapper({ type, title }: SalaryListWrapperProps) {
  const context = useOutletContext<SalaryContext>();
  const viewModel = useSalaryListViewModel();
  
  // Filter salaries by type if needed
  // Handle case-insensitive matching for subCategory
  const filteredSalaries = type === 'all' 
    ? viewModel.salaries 
    : viewModel.salaries.filter(s => {
        const subCat = s.subCategory?.toLowerCase() || '';
        if (type === 'regular') {
          return subCat.includes('employee salary') || subCat === 'salary';
        } else {
          return subCat.includes('advance salary');
        }
      });

  return (
    <SalaryListView
      salaries={filteredSalaries}
      allSalaries={viewModel.allSalaries}
      filters={viewModel.filters}
      showFilters={viewModel.showFilters}
      activeFilterCount={viewModel.activeFilterCount}
      viewingSalary={viewModel.viewingSalary}
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
      employees={context.employees}
      onBack={() => window.history.back()}
      title={title}
      type={type}
    />
  );
}
