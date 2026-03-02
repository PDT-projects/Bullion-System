import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'loans',
  service: 'erp-system-service',
  location: 'asia-south1'
};

export const createLoanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createLoan', inputVars);
}
createLoanRef.operationName = 'createLoan';

export function createLoan(dcOrVars, vars) {
  return executeMutation(createLoanRef(dcOrVars, vars));
}

export const createLoanPaymentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createLoanPayment', inputVars);
}
createLoanPaymentRef.operationName = 'createLoanPayment';

export function createLoanPayment(dcOrVars, vars) {
  return executeMutation(createLoanPaymentRef(dcOrVars, vars));
}

export const listLoansRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listLoans', inputVars);
}
listLoansRef.operationName = 'listLoans';

export function listLoans(dcOrVars, vars) {
  return executeQuery(listLoansRef(dcOrVars, vars));
}

export const getLoanByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getLoanById', inputVars);
}
getLoanByIdRef.operationName = 'getLoanById';

export function getLoanById(dcOrVars, vars) {
  return executeQuery(getLoanByIdRef(dcOrVars, vars));
}

export const listLoanPaymentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listLoanPayments', inputVars);
}
listLoanPaymentsRef.operationName = 'listLoanPayments';

export function listLoanPayments(dcOrVars, vars) {
  return executeQuery(listLoanPaymentsRef(dcOrVars, vars));
}

export const getLoanPaymentByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getLoanPaymentById', inputVars);
}
getLoanPaymentByIdRef.operationName = 'getLoanPaymentById';

export function getLoanPaymentById(dcOrVars, vars) {
  return executeQuery(getLoanPaymentByIdRef(dcOrVars, vars));
}

