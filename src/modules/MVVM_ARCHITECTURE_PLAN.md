# MVVM Architecture Plan for All Modules

## Current Architecture Pattern (Keep This Consistent!)

Each module follows this structure:
```
src/modules/[moduleName]/
├── index.ts                    # Public API exports
├── models/
│   ├── types.ts               # All interfaces/types
│   └── [module]Service.ts     # Business logic & data operations
├── viewModels/
│   ├── use[Module]ListViewModel.ts      # List page logic
│   ├── use[Module]FormViewModel.ts      # Create/Edit logic
│   └── use[Module]DeleteViewModel.ts    # Delete confirmation logic
└── views/
    ├── [Module]ListView.tsx             # List UI
    ├── [Module]FormView.tsx             # Form UI
    ├── [Module]DeleteView.tsx             # Delete confirmation UI
    └── [Module][Feature]Wrapper.tsx      # Wrapper components
```

## Modules to Build (9-10 Total)

### ✅ Completed (2 modules)
1. **Employee Module** - Full CRUD with list, create, edit, delete
2. **Inventory Module** - Products, transfers, 4-step creation flow

### ⏳ Remaining (7-8 modules)

| Module | Features | Priority |
|--------|----------|----------|
| 3. **Customers** | List, Create, Edit, Delete, View | High |
| 4. **Suppliers** | List, Create, Edit, Delete, View | High |
| 5. **Invoices** | List, Create, Edit, Delete, PDF generation | High |
| 6. **Orders** | List, Create, Edit, Status tracking | Medium |
| 7. **Payments** | List, Create, Payment methods, Receipts | Medium |
| 8. **Expenses** | List, Create, Categories, Reports | Medium |
| 9. **Reports** | Dashboard, Analytics, Export | Low |
| 10. **Settings** | Company, Users, Permissions | Low |

## Standard Files Per Module (Copy-Paste Template)

### 1. types.ts Template
```typescript
// [Module] Module - Model Layer

export interface [Entity] {
  id: string;
  // Add entity fields
  createdAt?: string;
  updatedAt?: string;
}

export interface Create[Entity]DTO {
  // All fields except id
}

export interface Update[Entity]DTO extends Create[Entity]DTO {
  id: string;
}

export interface [Entity]Filters {
  // Filter fields
}

export interface [Entity]Stats {
  // Statistics fields
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: { [key: string]: string };
}
```

### 2. Service Template
```typescript
// [Module] Module - Service Layer

import { [Entity], Create[Entity]DTO, Update[Entity]DTO, [Entity]Filters, [Entity]Stats, ValidationResult } from './types';

export class [Module]Service {
  
  // ==================== FILTERING & SEARCH ====================
  
  static filter[Entity]s(items: [Entity][], filters: [Entity]Filters): [Entity][] {
    return items.filter(item => {
      // Implement filters
      return true;
    });
  }

  // ==================== CRUD OPERATIONS ====================

  static create[Entity](items: [Entity][], data: Create[Entity]DTO): [Entity][] {
    const newItem: [Entity] = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    return [...items, newItem];
  }

  static update[Entity](items: [Entity][], id: string, data: Update[Entity]DTO): [Entity][] {
    return items.map(item => 
      item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
    );
  }

  static delete[Entity](items: [Entity][], id: string): [Entity][] {
    return items.filter(item => item.id !== id);
  }

  static findById(items: [Entity][], id: string): [Entity] | undefined {
    return items.find(item => item.id === id);
  }

  // ==================== VALIDATION ====================

  static validate(data: Partial<[Entity]>): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    // Add validation rules
    // if (!data.name?.trim()) fieldErrors.name = 'Name is required';

    const isValid = Object.keys(fieldErrors).length === 0;
    return { isValid, error: isValid ? undefined : 'Please fix errors', fieldErrors };
  }

  // ==================== STATISTICS ====================

  static calculateStats(items: [Entity][]): [Entity]Stats {
    return {
      totalCount: items.length
      // Add more stats
    };
  }

  // ==================== FORMATTING ====================

  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK');
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
```

### 3. List ViewModel Template
```typescript
// [Module] Module - ViewModel Layer

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { [Entity], [Entity]Filters } from '../models/types';
import { [Module]Service } from '../models/[module]Service';

interface [Module]Context {
  [entity]s: [Entity][];
  set[Entity]s: (items: [Entity][]) => void;
}

interface Use[Module]ListViewModelReturn {
  // Data
  [entity]s: [Entity][];
  all[Entity]s: [Entity][];
  
  // Filters
  filters: [Entity]Filters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // View State
  view[Entity]: [Entity] | null;
  
  // Stats
  totalCount: number;
  
  // Actions
  setFilter: (key: keyof [Entity]Filters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setView[Entity]: (item: [Entity] | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
}

export function use[Module]ListViewModel(): Use[Module]ListViewModelReturn {
  const navigate = useNavigate();
  const { [entity]s: all[Entity]s, set[Entity]s } = useOutletContext<[Module]Context>();

  // State
  const [filters, setFilters] = useState<[Entity]Filters>({
    // Initialize filters
  });
  const [showFilters, setShowFilters] = useState(false);
  const [view[Entity], setView[Entity]] = useState<[Entity] | null>(null);

  // Computed
  const [entity]s = useMemo(() => {
    return [Module]Service.filter[Entity]s(all[Entity]s, filters);
  }, [all[Entity]s, filters]);

  const stats = useMemo(() => {
    return [Module]Service.calculateStats([entity]s);
  }, [[entity]s]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '' && v !== null).length;
  }, [filters]);

  // Actions
  const setFilter = useCallback((key: keyof [Entity]Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      // Reset to defaults
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleEdit = useCallback((id: string) => {
    navigate('/[module]s/${id}/edit');
  }, [navigate]);

  const handleDelete = useCallback((id: string) => {
    navigate('/[module]s/${id}/delete');
  }, [navigate]);

  const handleAdd = useCallback(() => {
    navigate('/[module]s/create');
  }, [navigate]);

  return {
    [entity]s,
    all[Entity]s,
    filters,
    showFilters,
    activeFilterCount,
    view[Entity],
    totalCount: stats.totalCount,
    setFilter,
    clearFilters,
    toggleFilters,
    setView[Entity],
    handleEdit,
    handleDelete,
    handleAdd
  };
}
```

### 4. Wrapper Template
```typescript
// [Module] Module - Wrapper Component

import React from 'react';
import { use[Module]ListViewModel } from '../viewModels/use[Module]ListViewModel';
import { [Module]ListView } from './[Module]ListView';

export const [Module]ListWrapper: React.FC = () => {
  const viewModel = use[Module]ListViewModel();
  return <[Module]ListView {...viewModel} />;
};
```

### 5. Route Configuration Template
```typescript
// In routes.tsx

// Import
import { [Module]ListWrapper } from './modules/[module]/views/[Module]ListWrapper';

// Add to router
{
  path: "/[module]s",
  element: (
    <ProtectedRoute>
      <[Module]Layout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <[Module]ListWrapper />,
    },
    {
      path: "create",
      element: <[Module]CreateWrapper />,
    },
    {
      path: ":id/edit",
      element: <[Module]EditWrapper />,
    },
    {
      path: ":id/delete",
      element: <[Module]DeleteWrapper />,
    }
  ],
}
```

## Code Duplication Checklist

When building new modules, check for these duplications:

- [ ] ValidationResult interface (copy from existing)
- [ ] Service methods: filter, create, update, delete, findById
- [ ] ViewModel patterns: setFilter, clearFilters, toggleFilters
- [ ] Wrapper component boilerplate
- [ ] Formatting utilities: formatDate, formatCurrency
- [ ] Route configuration pattern

## Future Firebase Integration Plan

When ready to integrate Firebase:

1. **Modify Service Layer Only** - Add Firebase methods to each Service class
2. **Keep ViewModels Unchanged** - They already use Service methods
3. **Keep Views Unchanged** - Pure UI components
4. **Add Real-time Subscriptions** - In ViewModels, subscribe to Firebase changes

Example Firebase-ready Service:
```typescript
export class [Module]Service {
  // Keep existing methods for local state
  
  // Add Firebase methods
  static async fetchFromFirebase(): Promise<[Entity][]> {
    // Firebase fetch
  }
  
  static subscribeToChanges(callback: (data: [Entity][]) => void) {
    // Firebase real-time subscription
  }
}
```

## Next Steps

1. ✅ Employee Module - Done
2. ✅ Inventory Module - Done
3. 🔄 Create Customer Module (use templates above)
4. ⏳ Create Supplier Module
5. ⏳ Create Invoice Module
6. ⏳ Continue with remaining modules...

## Important Notes

- **Consistency is key** - Follow the exact same patterns
- **Copy-paste templates** - Use the templates above for speed
- **Test each module** - Before moving to next module
- **Document changes** - If you improve a pattern, update this doc
- **Prepare for Firebase** - Service layer is the only place that changes

---

**Current Status**: 2/10 modules complete (20%)
**Estimated completion**: 8 more modules to build
