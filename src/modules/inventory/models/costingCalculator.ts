// Inventory Module - Costing Calculator
// Mathematical engine for multi-model landed cost calculations

import { CostingModel, CostingInfo } from './types';

/**
 * Generate a unique ID for a model
 */
export function generateModelId(): string {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty CostingModel with default values
 */
export function createEmptyCostingModel(): CostingModel {
  return {
    id: generateModelId(),
    modelName: '',
    units: 0,
    unitCostUSD: 0,
    totalCostUSD: 0,
    percentage: 0,
    customPerModel: 0,
    customPerUnit: 0,
    freightPerModel: 0,
    freightPerUnit: 0,
    unitCostPKR: 0,
    totalLandedUnitCost: 0,
    totalShipmentValuePKR: 0,
  };
}

/**
 * Calculate costs for a single model based on global values and totals
 * Percentage is now based on unitCostUSD / totalUnitCostUSD
 */
export function calculateModelCosts(
  model: CostingModel,
  totalUnitCostUSD: number,
  shipmentTotalUSD: number,
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): CostingModel {
  // 1. Total Cost USD = units * unitCostUSD
  const totalCostUSD = model.units * model.unitCostUSD;

  // 2. Weightage/Percentage = unitCostUSD / totalUnitCostUSD (based on unit cost, not total cost)
  const percentage = totalUnitCostUSD > 0 ? (model.unitCostUSD / totalUnitCostUSD) * 100 : 0;

  // 3. Customs Allocation per Model = percentage * totalCustomsValue
  const customPerModel = (percentage / 100) * totalCustomsValue;

  // 4. Customs per Unit = customPerModel / units (with division by zero protection)
  const customPerUnit = model.units > 0 ? customPerModel / model.units : 0;

  // 5. Freight Allocation per Model = percentage * totalFreightValue
  const freightPerModel = (percentage / 100) * totalFreightValue;

  // 6. Freight per Unit = freightPerModel / units (with division by zero protection)
  const freightPerUnit = model.units > 0 ? freightPerModel / model.units : 0;

  // 7. Base PKR Conversion = unitCostUSD * usdRate
  const unitCostPKR = model.unitCostUSD * usdRate;

  // 8. Final Landed Cost = unitCostPKR + customPerUnit + freightPerUnit
  const totalLandedUnitCost = unitCostPKR + customPerUnit + freightPerUnit;

  // 9. Model Inventory Value = totalLandedUnitCost * units
  const totalShipmentValuePKR = totalLandedUnitCost * model.units;

  return {
    ...model,
    totalCostUSD: roundToTwo(totalCostUSD),
    percentage: roundToTwo(percentage),
    customPerModel: roundToTwo(customPerModel),
    customPerUnit: roundToTwo(customPerUnit),
    freightPerModel: roundToTwo(freightPerModel),
    freightPerUnit: roundToTwo(freightPerUnit),
    unitCostPKR: roundToTwo(unitCostPKR),
    totalLandedUnitCost: roundToTwo(totalLandedUnitCost),
    totalShipmentValuePKR: roundToTwo(totalShipmentValuePKR),
  };
}

/**
 * Calculate brand summary values
 * Now includes totalUnitCostUSD for percentage calculation based on unit cost
 */
export function calculateBrandSummary(
  models: CostingModel[],
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): { totalUnitCostUSD: number; shipmentTotalUSD: number; consignmentValue: number; totalValueOfBrand: number } {
  // Sum all unitCostUSD from models (for percentage calculation)
  const totalUnitCostUSD = models.reduce((sum, model) => sum + model.unitCostUSD, 0);

  // Sum all totalCostUSD from models (units * unitCostUSD)
  const shipmentTotalUSD = models.reduce((sum, model) => sum + (model.units * model.unitCostUSD), 0);

  // consignmentValue = shipmentTotalUSD * usdRate
  const consignmentValue = shipmentTotalUSD * usdRate;

  // totalValueOfBrand = consignmentValue + totalCustomsValue + totalFreightValue
  const totalValueOfBrand = consignmentValue + totalCustomsValue + totalFreightValue;

  return {
    totalUnitCostUSD: roundToTwo(totalUnitCostUSD),
    shipmentTotalUSD: roundToTwo(shipmentTotalUSD),
    consignmentValue: roundToTwo(consignmentValue),
    totalValueOfBrand: roundToTwo(totalValueOfBrand),
  };
}

/**
 * Recalculate all models in the costing array
 * This should be called whenever any input changes
 * Now includes totalUnitCostUSD in the summary for percentage calculation
 */
export function recalculateAllModels(
  models: CostingModel[],
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): { models: CostingModel[]; summary: { totalUnitCostUSD: number; shipmentTotalUSD: number; consignmentValue: number; totalValueOfBrand: number } } {
  // First calculate total unit cost (sum of all unitCostUSD - for percentage calculation)
  const totalUnitCostUSD = models.reduce((sum, model) => sum + model.unitCostUSD, 0);

  // Then calculate shipment total (sum of units * unitCostUSD)
  const shipmentTotalUSD = models.reduce((sum, model) => sum + (model.units * model.unitCostUSD), 0);

  // Recalculate each model with the totals
  const recalculatedModels = models.map(model => 
    calculateModelCosts(model, totalUnitCostUSD, shipmentTotalUSD, usdRate, totalCustomsValue, totalFreightValue)
  );

  // Calculate summary
  const summary = calculateBrandSummary(recalculatedModels, usdRate, totalCustomsValue, totalFreightValue);

  return {
    models: recalculatedModels,
    summary,
  };
}

/**
 * Create initial CostingInfo with default values
 */
export function createInitialCostingInfo(): CostingInfo {
  return {
    usdRate: 0,
    totalCustomsValue: 0,
    totalFreightValue: 0,
    models: [],
    totalUnitCostUSD: 0,
    shipmentTotalUSD: 0,
    consignmentValue: 0,
    totalValueOfBrand: 0,
  };
}

/**
 * Format number as currency with 2 decimal places
 */
export function formatCurrency(value: number): string {
  return roundToTwo(value).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Round to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
