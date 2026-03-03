const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'budgets',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const budgetInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetInsert', inputVars);
}
budgetInsertRef.operationName = 'budgetInsert';
exports.budgetInsertRef = budgetInsertRef;

exports.budgetInsert = function budgetInsert(dcOrVars, vars) {
  return executeMutation(budgetInsertRef(dcOrVars, vars));
};

const budgetUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetUpdate', inputVars);
}
budgetUpdateRef.operationName = 'budgetUpdate';
exports.budgetUpdateRef = budgetUpdateRef;

exports.budgetUpdate = function budgetUpdate(dcOrVars, vars) {
  return executeMutation(budgetUpdateRef(dcOrVars, vars));
};

const budgetDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetDelete', inputVars);
}
budgetDeleteRef.operationName = 'budgetDelete';
exports.budgetDeleteRef = budgetDeleteRef;

exports.budgetDelete = function budgetDelete(dcOrVars, vars) {
  return executeMutation(budgetDeleteRef(dcOrVars, vars));
};

const budgetUpdateSpentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetUpdateSpent', inputVars);
}
budgetUpdateSpentRef.operationName = 'budgetUpdateSpent';
exports.budgetUpdateSpentRef = budgetUpdateSpentRef;

exports.budgetUpdateSpent = function budgetUpdateSpent(dcOrVars, vars) {
  return executeMutation(budgetUpdateSpentRef(dcOrVars, vars));
};

const listBudgetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listBudgets', inputVars);
}
listBudgetsRef.operationName = 'listBudgets';
exports.listBudgetsRef = listBudgetsRef;

exports.listBudgets = function listBudgets(dcOrVars, vars) {
  return executeQuery(listBudgetsRef(dcOrVars, vars));
};

const getBudgetByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getBudgetById', inputVars);
}
getBudgetByIdRef.operationName = 'getBudgetById';
exports.getBudgetByIdRef = getBudgetByIdRef;

exports.getBudgetById = function getBudgetById(dcOrVars, vars) {
  return executeQuery(getBudgetByIdRef(dcOrVars, vars));
};
