import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'budgets',
  service: 'erp-system-service',
  location: 'asia-south1'
};

export const budgetInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetInsert', inputVars);
}
budgetInsertRef.operationName = 'budgetInsert';

export function budgetInsert(dcOrVars, vars) {
  return executeMutation(budgetInsertRef(dcOrVars, vars));
}

export const budgetUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetUpdate', inputVars);
}
budgetUpdateRef.operationName = 'budgetUpdate';

export function budgetUpdate(dcOrVars, vars) {
  return executeMutation(budgetUpdateRef(dcOrVars, vars));
}

export const budgetDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetDelete', inputVars);
}
budgetDeleteRef.operationName = 'budgetDelete';

export function budgetDelete(dcOrVars, vars) {
  return executeMutation(budgetDeleteRef(dcOrVars, vars));
}

export const budgetUpdateSpentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'budgetUpdateSpent', inputVars);
}
budgetUpdateSpentRef.operationName = 'budgetUpdateSpent';

export function budgetUpdateSpent(dcOrVars, vars) {
  return executeMutation(budgetUpdateSpentRef(dcOrVars, vars));
}

export const listBudgetsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listBudgets', inputVars);
}
listBudgetsRef.operationName = 'listBudgets';

export function listBudgets(dcOrVars, vars) {
  return executeQuery(listBudgetsRef(dcOrVars, vars));
}

export const getBudgetByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getBudgetById', inputVars);
}
getBudgetByIdRef.operationName = 'getBudgetById';

export function getBudgetById(dcOrVars, vars) {
  return executeQuery(getBudgetByIdRef(dcOrVars, vars));
}

