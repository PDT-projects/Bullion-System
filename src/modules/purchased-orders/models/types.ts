// Purchased Orders (Import Shipments) — data model
//
// CURRENCY MODEL
// --------------
// AED is the base currency. Every stored figure and every calculation is in
// AED, without exception. `currency` and `exchangeRate` describe the supplier's
// commercial invoice; `exchangeRate` converts that invoice INTO AED at the time
// the shipment was entered, and is frozen on the document so a later rate
// change cannot silently restate a closed shipment.
//
// Viewing in another currency is a display concern only — see convertForDisplay
// in purchasedOrderService. Nothing converted for display is ever written back.
//
// ALLOCATION MODEL
// ----------------
// Freight, customs duty and other import charges are allocated across the lines
// in proportion to EACH LINE'S SHARE OF PURCHASE VALUE — not by quantity, not
// by weight. This is the rule the business already uses in its shipment costing
// spreadsheet, and the one the inventory costing screen implements
// (src/modules/inventory/models/costingCalculator.ts). Keeping all three on the
// same rule is deliberate: two rules would make the same shipment cost two
// different amounts depending on which screen entered it.

export type ShipmentStatus =
  | 'Draft'
  | 'Ordered'
  | 'Dispatched'
  | 'In Transit'
  | 'Arrived'
  | 'Customs Cleared'
  | 'Costing Complete'
  | 'Received Into Inventory'
  | 'Cancelled';

export type ApplyStatus  = 'Not Applied' | 'Applied';
export type CostingState = 'Pending' | 'Complete';
export type ShipMethod   = 'Air' | 'Sea' | 'Road' | 'Courier';
export type FreightTerms = 'Prepaid' | 'Collect';

/** Currency of the supplier's commercial invoice. */
export type ShipmentCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'PKR';

/** Currency the user is *looking* at. Storage is always AED. */
export type DisplayCurrency = ShipmentCurrency;

export const SHIPMENT_CURRENCIES: ShipmentCurrency[] = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'PKR'];
export const SHIP_METHODS: ShipMethod[]    = ['Air', 'Sea', 'Road', 'Courier'];
export const FREIGHT_TERMS: FreightTerms[] = ['Prepaid', 'Collect'];

/** Unit of measure, as printed on supplier proforma invoices. */
export type UnitOfMeasure = 'EA' | 'BOX' | 'SET' | 'PC' | 'KG' | 'M';
export const UNITS_OF_MEASURE: UnitOfMeasure[] = ['EA', 'BOX', 'SET', 'PC', 'KG', 'M'];

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'Draft', 'Ordered', 'Dispatched', 'In Transit', 'Arrived',
  'Customs Cleared', 'Costing Complete', 'Received Into Inventory', 'Cancelled',
];

/**
 * One product line on the supplier's commercial invoice.
 *
 * Field names follow the proforma layout so a data-entry clerk can read across
 * from the paper document without translating anything: ITEM NUMBER, QTY
 * ORDERED, UNIT PRICE, DISC%, UOM.
 */
export interface ShipmentLine {
  id: string;
  /** Supplier's item number, e.g. F22-11DD. Not our internal product id. */
  sku: string;
  productName: string;
  modelName: string;
  uom: UnitOfMeasure;
  quantity: number;
  /** Unit price in the shipment's currency, before discount. */
  unitPrice: number;
  /** Line discount, 0..100. */
  discountPercent: number;
  /** Units actually received. Drives partial-receipt tracking. */
  receivedQuantity: number;
  /** Our inventory product id, once the line has been received. */
  linkedProductId?: string;
}

/**
 * A line with every derived figure filled in, plus the arithmetic that produced
 * it. `formulas` exists so the UI can show a user how a number was reached —
 * the spreadsheet this replaces let an accountant click a cell and read its
 * formula, and losing that is what makes people distrust a costing screen.
 */
export interface CostedLine extends ShipmentLine {
  grossTotal: number;
  discountAmount: number;
  netTotal: number;
  netTotalBase: number;
  share: number;
  freightShare: number;
  customsShare: number;
  otherShare: number;
  dutyPerUnit: number;
  freightPerUnit: number;
  unitPriceBase: number;
  landedTotal: number;
  landedUnitCost: number;
  remainingQuantity: number;
  formulas: Record<string, string>;
}

export interface ShipmentCosting {
  purchaseGross: number;
  discountTotal: number;
  purchaseNet: number;
  purchaseNetBase: number;
  freightBase: number;
  customsBase: number;
  otherBase: number;
  taxBase: number;
  landedTotal: number;
  totalQuantity: number;
  totalReceived: number;
  averageLandedUnitCost: number;
  /** True when the line landed totals sum back to the shipment total. */
  reconciles: boolean;
  lines: CostedLine[];
  formulas: Record<string, string>;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  /** Supplier's own order number, from their proforma. */
  supplierOrderNumber?: string;

  brandId?: string;
  brandName: string;
  supplierName: string;
  originCountry: string;
  destinationCountry: string;

  orderDate: string;
  shipmentDate?: string;
  expectedArrivalDate?: string;
  actualArrivalDate?: string;

  shipMethod?: ShipMethod;
  freightTerms?: FreightTerms;
  trackingNumber?: string;

  /** Currency of the supplier's invoice. */
  currency: ShipmentCurrency;
  /** AED per 1 unit of `currency`. Always 1 when currency is AED. */
  exchangeRate: number;

  status: ShipmentStatus;
  customsStatus: ApplyStatus;
  freightStatus: ApplyStatus;
  costingStatus: CostingState;

  /** Import charges, entered in the shipment's currency. */
  freightAmount: number;
  customsAmount: number;
  otherCharges: number;
  salesTaxAmount: number;

  lines: ShipmentLine[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export type CreateShipmentDTO = Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateShipmentDTO = Partial<Omit<Shipment, 'id' | 'createdAt'>>;

export interface ShipmentFilters {
  search: string;
  brand: string;
  status: string;
  costing: string;
}

export interface ShipmentSummary {
  total: number;
  inTransit: number;
  arrived: number;
  pendingCustoms: number;
  pendingFreight: number;
  pendingCosting: number;
  partiallyReceived: number;
  landedValue: number;
}
