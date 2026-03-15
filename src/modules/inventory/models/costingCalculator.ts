// Inventory Module - Costing Calculator
// Mathematical engine for multi-model landed cost calculations

import { CostingModel, CostingInfo } from './types';

export function generateModelId(): string {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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

export function calculateModelCosts(
  model: CostingModel,
  totalUnitCostUSD: number,
  shipmentTotalUSD: number,
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): CostingModel {
  const totalCostUSD = model.units * model.unitCostUSD;
  const percentage = totalUnitCostUSD > 0 ? (model.unitCostUSD / totalUnitCostUSD) * 100 : 0;
  const customPerModel = (percentage / 100) * totalCustomsValue;
  const customPerUnit = model.units > 0 ? customPerModel / model.units : 0;
  const freightPerModel = (percentage / 100) * totalFreightValue;
  const freightPerUnit = model.units > 0 ? freightPerModel / model.units : 0;
  const unitCostPKR = model.unitCostUSD * usdRate;
  const totalLandedUnitCost = unitCostPKR + customPerUnit + freightPerUnit;
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

export function calculateBrandSummary(
  models: CostingModel[],
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): { totalUnitCostUSD: number; shipmentTotalUSD: number; consignmentValue: number; totalValueOfBrand: number } {
  const totalUnitCostUSD = models.reduce((sum, model) => sum + model.unitCostUSD, 0);
  const shipmentTotalUSD = models.reduce((sum, model) => sum + (model.units * model.unitCostUSD), 0);
  const consignmentValue = shipmentTotalUSD * usdRate;
  const totalValueOfBrand = consignmentValue + totalCustomsValue + totalFreightValue;
  return {
    totalUnitCostUSD: roundToTwo(totalUnitCostUSD),
    shipmentTotalUSD: roundToTwo(shipmentTotalUSD),
    consignmentValue: roundToTwo(consignmentValue),
    totalValueOfBrand: roundToTwo(totalValueOfBrand),
  };
}

export function recalculateAllModels(
  models: CostingModel[],
  usdRate: number,
  totalCustomsValue: number,
  totalFreightValue: number
): { models: CostingModel[]; summary: { totalUnitCostUSD: number; shipmentTotalUSD: number; consignmentValue: number; totalValueOfBrand: number } } {
  const totalUnitCostUSD = models.reduce((sum, model) => sum + model.unitCostUSD, 0);
  const shipmentTotalUSD = models.reduce((sum, model) => sum + (model.units * model.unitCostUSD), 0);
  const recalculatedModels = models.map(model =>
    calculateModelCosts(model, totalUnitCostUSD, shipmentTotalUSD, usdRate, totalCustomsValue, totalFreightValue)
  );
  const summary = calculateBrandSummary(recalculatedModels, usdRate, totalCustomsValue, totalFreightValue);
  return { models: recalculatedModels, summary };
}

export function createInitialCostingInfo(): CostingInfo {
  return {
    brandName: '',
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

export function formatCurrency(value: number): string {
  return roundToTwo(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}