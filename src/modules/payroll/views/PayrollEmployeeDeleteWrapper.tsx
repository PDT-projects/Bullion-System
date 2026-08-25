// Payroll Module - Employee Delete inside Payroll
// Uses the existing EmployeeDeleteView unchanged,
// but uses onSuccess/onCancel callbacks instead of navigate().

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Employee } from '../../employee/models/types';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { EmployeeDeleteView } from '../../employee/views/EmployeeDeleteView';

interface PayrollEmployeeDeleteWrapperProps {
  deleteId:   string;
  onSuccess:  () => void;
  onCancel:   () => void;
}

export function PayrollEmployeeDeleteWrapper({
  deleteId, onSuccess, onCancel,
}: PayrollEmployeeDeleteWrapperProps) {
  const [employee,   setEmployee]   = useState<Employee | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    EmployeeFirebaseService.fetchEmployeeById(deleteId)
      .then(emp => {
        if (emp) setEmployee(emp);
        else { toast.error('Employee not found'); onCancel(); }
      })
      .catch(() => { toast.error('Failed to load employee'); onCancel(); })
      .finally(() => setIsLoading(false));
  }, [deleteId, onCancel]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await EmployeeFirebaseService.deleteEmployee(deleteId);
      toast.success('Employee deleted successfully');
      onSuccess();
    } catch {
      toast.error('Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <EmployeeDeleteView
      employee={employee}
      onDelete={handleDelete}
      onCancel={onCancel}
    />
  );
}