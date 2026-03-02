import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'employees',
  service: 'erp-system-service',
  location: 'asia-south1'
};

export const listEmployeesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEmployees', inputVars);
}
listEmployeesRef.operationName = 'ListEmployees';

export function listEmployees(dcOrVars, vars) {
  return executeQuery(listEmployeesRef(dcOrVars, vars));
}

export const getEmployeeByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployeeById', inputVars);
}
getEmployeeByIdRef.operationName = 'GetEmployeeById';

export function getEmployeeById(dcOrVars, vars) {
  return executeQuery(getEmployeeByIdRef(dcOrVars, vars));
}

export const employeeInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeInsert', inputVars);
}
employeeInsertRef.operationName = 'employeeInsert';

export function employeeInsert(dcOrVars, vars) {
  return executeMutation(employeeInsertRef(dcOrVars, vars));
}

export const employeeUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeUpdate', inputVars);
}
employeeUpdateRef.operationName = 'employeeUpdate';

export function employeeUpdate(dcOrVars, vars) {
  return executeMutation(employeeUpdateRef(dcOrVars, vars));
}

export const employeeDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeDelete', inputVars);
}
employeeDeleteRef.operationName = 'employeeDelete';

export function employeeDelete(dcOrVars, vars) {
  return executeMutation(employeeDeleteRef(dcOrVars, vars));
}

