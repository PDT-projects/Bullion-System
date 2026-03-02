const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'loans',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const createLoanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createLoan', inputVars);
}
createLoanRef.operationName = 'createLoan';
exports.createLoanRef = createLoanRef;

exports.createLoan = function createLoan(dcOrVars, vars) {
  return executeMutation(createLoanRef(dcOrVars, vars));
};

const createLoanPaymentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createLoanPayment', inputVars);
}
createLoanPaymentRef.operationName = 'createLoanPayment';
exports.createLoanPaymentRef = createLoanPaymentRef;

exports.createLoanPayment = function createLoanPayment(dcOrVars, vars) {
  return executeMutation(createLoanPaymentRef(dcOrVars, vars));
};

const listLoansRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listLoans', inputVars);
}
listLoansRef.operationName = 'listLoans';
exports.listLoansRef = listLoansRef;

exports.listLoans = function listLoans(dcOrVars, vars) {
  return executeQuery(listLoansRef(dcOrVars, vars));
};

const getLoanByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getLoanById', inputVars);
}
getLoanByIdRef.operationName = 'getLoanById';
exports.getLoanByIdRef = getLoanByIdRef;

exports.getLoanById = function getLoanById(dcOrVars, vars) {
  return executeQuery(getLoanByIdRef(dcOrVars, vars));
};

const listLoanPaymentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listLoanPayments', inputVars);
}
listLoanPaymentsRef.operationName = 'listLoanPayments';
exports.listLoanPaymentsRef = listLoanPaymentsRef;

exports.listLoanPayments = function listLoanPayments(dcOrVars, vars) {
  return executeQuery(listLoanPaymentsRef(dcOrVars, vars));
};

const getLoanPaymentByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getLoanPaymentById', inputVars);
}
getLoanPaymentByIdRef.operationName = 'getLoanPaymentById';
exports.getLoanPaymentByIdRef = getLoanPaymentByIdRef;

exports.getLoanPaymentById = function getLoanPaymentById(dcOrVars, vars) {
  return executeQuery(getLoanPaymentByIdRef(dcOrVars, vars));
};
