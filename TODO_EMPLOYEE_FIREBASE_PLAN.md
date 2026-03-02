# Employee Module - Firebase Backend Implementation Plan

## Current Status

### ✅ Already Implemented
1. **Firebase Firestore Integration**
   - `EmployeeFirebaseService` - Complete CRUD operations for employees
   - Collection: `employees` in Firestore
   
2. **Data Connect Service Layer**
   - `EmployeeDataConnectService` - Unified API with Firestore fallback
   - Automatic fallback to Firestore when Data Connect is not available

3. **ViewModels** - All integrated with Data Connect service
   - `useEmployeeListViewModel` - List employees with filters
   - `useEmployeeFormViewModel` - Create/Edit employees
   - `useEmployeeDeleteViewModel` - Delete employees

### ⚠️ Data Connect Status
- **Issue**: Firebase Data Connect requires Cloud SQL (PostgreSQL) setup
- **Current**: Uses Firestore as fallback backend
- **Schema**: Defined in `dataconnect/schema/schema.gql`
- **Connector**: Configured in `dataconnect/example/connector.yaml`

## Employee Schema (Firestore)

```
typescript
interface Employee {
  id: string;              // Auto-generated Firestore document ID
  name: string;           // Required
  position: string;       // Required
  salary: number;         // Required
  phone: string;          // Required
  email: string;         // Required
  joinDate: string;       // Required (ISO date string)
  status: 'active' | 'inactive';
  location: 'Karachi' | 'Islamabad' | 'Lahore';
  accountNumber: string;  // Bank details
  bankName: string;
  accountTitle: string;
  createdAt: string;     // Auto-generated
  updatedAt: string;      // Auto-generated
}
```

## Operations Flow

```
User Action → ViewModel → EmployeeDataConnectService → [Data Connect SDK] or [Firestore Fallback]
                                                                    ↓
                                                    EmployeeFirebaseService
                                                                    ↓
                                                    Firestore 'employees' collection
```

## Files Structure

```
src/
├── api/
│   ├── firebase/
│   │   └── firebase.ts              # Firebase initialization
│   └── dataconnect/
│       └── employeeDataConnectService.ts  # Data Connect service with fallback
│
└── modules/
    └── employee/
        ├── models/
        │   ├── types.ts             # Employee interfaces
        │   ├── employeeService.ts  # Business logic
        │   └── employeeFirebaseService.ts  # Firestore operations
        ├── viewModels/
        │   ├── useEmployeeListViewModel.ts
        │   ├── useEmployeeFormViewModel.ts
        │   └── useEmployeeDeleteViewModel.ts
        └── views/
            ├── EmployeeListView.tsx
            ├── EmployeeFormView.tsx
            └── EmployeeDeleteView.tsx
```

## Implementation Steps Completed

- [x] Create Firestore collection schema
- [x] Implement EmployeeFirebaseService with all CRUD operations
- [x] Create EmployeeDataConnectService with Firestore fallback
- [x] Update ViewModels to use the service layer
- [x] Connect form fields to Firestore
- [x] Fetch employees from Firestore on app load

## Next Steps (Optional - Data Connect)

To fully enable Firebase Data Connect (PostgreSQL):

1. **Set up Cloud SQL**
   - Create a PostgreSQL instance in Google Cloud
   - Configure connection in `dataconnect/dataconnect.yaml`

2. **Deploy Schema**
   
```
bash
   firebase dataconnect:sql:setup
   firebase dataconnect:sql:migrate
   
```

3. **Generate SDK**
   
```
bash
   firebase dataconnect:sdk:generate
   
```

4. **Enable Data Connect**
   - Update `USE_DATA_CONNECT = true` in `employeeDataConnectService.ts`

## Current Functionality

✅ Employees can be created from the screen
✅ Employees are saved to Firestore
✅ Employees are fetched from Firestore when app runs
✅ All CRUD operations work via Firestore
✅ Filtering and search work with Firestore data

## Testing

To test the current implementation:
1. Run the app: `npm run dev`
2. Navigate to /employees
3. Click "Add Employee"
4. Fill in the form and save
5. Verify employee appears in the list
6. Refresh the page - employee should persist (loaded from Firestore)
