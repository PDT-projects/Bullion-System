const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'employees',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const employeeInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeInsert', inputVars);
}
employeeInsertRef.operationName = 'employeeInsert';
exports.employeeInsertRef = employeeInsertRef;

exports.employeeInsert = function employeeInsert(dcOrVars, vars) {
  return executeMutation(employeeInsertRef(dcOrVars, vars));
};

const employeeUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeUpdate', inputVars);
}
employeeUpdateRef.operationName = 'employeeUpdate';
exports.employeeUpdateRef = employeeUpdateRef;

exports.employeeUpdate = function employeeUpdate(dcOrVars, vars) {
  return executeMutation(employeeUpdateRef(dcOrVars, vars));
};

const employeeDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'employeeDelete', inputVars);
}
employeeDeleteRef.operationName = 'employeeDelete';
exports.employeeDeleteRef = employeeDeleteRef;

exports.employeeDelete = function employeeDelete(dcOrVars, vars) {
  return executeMutation(employeeDeleteRef(dcOrVars, vars));
};

const listEmployeesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEmployees', inputVars);
}
listEmployeesRef.operationName = 'ListEmployees';
exports.listEmployeesRef = listEmployeesRef;

exports.listEmployees = function listEmployees(dcOrVars, vars) {
  return executeQuery(listEmployeesRef(dcOrVars, vars));
};

const getEmployeeByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployeeById', inputVars);
}
getEmployeeByIdRef.operationName = 'GetEmployeeById';
exports.getEmployeeByIdRef = getEmployeeByIdRef;

exports.getEmployeeById = function getEmployeeById(dcOrVars, vars) {
  return executeQuery(getEmployeeByIdRef(dcOrVars, vars));
};
