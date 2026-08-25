// Payroll Module - Employee Form embedded inside Payroll
// AED-only: PKR toggle is hidden — salary is always stored and displayed in AED.

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Employee, CreateEmployeeDTO } from '../../employee/models/types';
import { EmployeeService } from '../../employee/models/employeeService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { EmployeeFormFields } from '../../employee/views/components/EmployeeFormFields';

interface PayrollEmployeeFormWrapperProps {
  mode:      'create' | 'edit';
  editId?:   string;
  onSuccess: () => void;
  onCancel:  () => void;
}

export function PayrollEmployeeFormWrapper({
  mode, editId, onSuccess, onCancel,
}: PayrollEmployeeFormWrapperProps) {
  const [formData, setFormData] = useState<Partial<Employee>>(
    // Always start with AED as the currency
    { ...EmployeeService.getDefaultFormData(), salaryCurrency: 'AED' }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);

  // Load employee when editing
  useEffect(() => {
    if (mode === 'edit' && editId) {
      setIsLoading(true);
      EmployeeFirebaseService.fetchEmployeeById(editId)
        .then(emp => {
          if (emp) {
            // Force AED on load — override whatever was stored
            setFormData({ ...emp, salaryCurrency: 'AED' });
          } else {
            toast.error('Employee not found');
            onCancel();
          }
        })
        .catch(() => { toast.error('Failed to load employee'); onCancel(); })
        .finally(() => setIsLoading(false));
    }
  }, [mode, editId, onCancel]);

  const setField = useCallback((field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const v = EmployeeService.validateEmployee(formData);
    if (!v.isValid) { toast.error(v.error || 'Please fill in all required fields'); return; }

    setIsSaving(true);
    try {
      // Always save with salaryCurrency: 'AED'
      const payload: CreateEmployeeDTO = {
        ...(formData as CreateEmployeeDTO),
        salaryCurrency: 'AED',
      };
      if (mode === 'edit' && editId) {
        await EmployeeFirebaseService.updateEmployee({ ...payload, id: editId });
        toast.success('Employee updated successfully');
      } else {
        await EmployeeFirebaseService.createEmployee(payload);
        toast.success('Employee added successfully');
      }
      onSuccess();
    } catch {
      toast.error('An error occurred while saving the employee');
    } finally {
      setIsSaving(false);
    }
  }, [formData, mode, editId, onSuccess]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading employee data…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onCancel} style={{ padding: 6, border: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} color="#fff" />
            </button>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>
              {mode === 'edit' ? 'Edit Employee' : 'Add Employee'}
            </h3>
          </div>

          {/* AED badge only — no PKR toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Salary in:</span>
            <span style={{ padding: '5px 14px', background: '#fff', color: '#0f172a', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              د.إ AED
            </span>
          </div>
        </div>

        {/* ── Form body ── */}
        <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
          {/* Render the existing EmployeeFormFields but lock currency to AED */}
          {/* Hide the PKR/AED currency toggle pills that EmployeeFormFields renders
              by using a scoped style — we want AED-only in the payroll context */}
          <style>{`
            .payroll-form-aed-only .bg-gray-100.rounded-lg.p-1 { display: none !important; }
          `}</style>
          <div className="payroll-form-aed-only">
            <EmployeeFormFields
              formData={formData}
              onFieldChange={setField}
              allLocations={[
                'Dubai', 'Abu Dhabi', 'Sharjah', 'Riyadh', 'Jeddah', 'Dammam',
                'Doha', 'Kuwait City', 'Muscat', 'Bahrain', 'Cairo', 'London',
                'Toronto', 'New York', 'Karachi', 'Lahore', 'Islamabad', 'Other',
              ]}
              addCustomLocation={() => {}}
              salaryCurrency="AED"
              onSalaryCurrencyChange={() => {}}
            />
          </div>

          {/* ── Footer actions ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onCancel} style={{ padding: '10px 22px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: 8,
                background: isSaving ? '#94a3b8' : '#0f172a',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving
                ? (mode === 'edit' ? 'Updating…' : 'Saving…')
                : (mode === 'edit' ? 'Update Employee' : 'Save Employee')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}