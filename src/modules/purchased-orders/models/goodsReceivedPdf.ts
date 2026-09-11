// Goods received note — PDF
//
// Laid out like the invoice PDF on purpose: the same header block, the same
// yellow table header, the same totals panel. Someone who reads one should not
// have to learn the other.
//
// Only lines with a received quantity above zero are printed. A receiving note
// listing items that did not arrive is not a receiving note — the shortfall
// belongs on the shipment, not on the document that says what was delivered.

import jsPDF from 'jspdf';
import { Shipment, ShipmentCosting } from './types';
import { fmtAed } from './purchasedOrderService';

const PAGE_W = 210;
const PAGE_H = 297;
const ML     = 14;
const MR     = 14;
const W      = PAGE_W - ML - MR;

const INK    = { r:  15, g:  23, b:  42 };
const MUTED  = { r: 100, g: 116, b: 139 };
const LINE   = { r: 226, g: 232, b: 240 };
const GOLD   = { r: 250, g: 204, b:  21 };

function text(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}
function fill(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setFillColor(c.r, c.g, c.b);
}
function stroke(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setDrawColor(c.r, c.g, c.b);
}

/** Column layout for the receiving table. */
const COL = {
  no:       { x: ML,        w: 10 },
  product:  { x: ML + 10,   w: 74 },
  model:    { x: ML + 84,   w: 44 },
  ordered:  { x: ML + 128,  w: 24 },
  unitCost: { x: ML + 152,  w: 30 },
} as const;

function header(doc: jsPDF, s: Shipment): number {
  let y = 16;

  fill(doc, INK);
  doc.rect(ML, y, W, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('GOODS RECEIVED NOTE', ML + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Bullion Electronics', ML + 6, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(s.shipmentNumber, PAGE_W - MR - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const finalised = s.receivingFinalisedAt
    ? new Date(s.receivingFinalisedAt).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');
  doc.text(finalised, PAGE_W - MR - 6, y + 15, { align: 'right' });

  return y + 26;
}

function details(doc: jsPDF, s: Shipment, y: number): number {
  const pairs: Array<[string, string]> = [
    ['Supplier',        s.supplierName || '—'],
    ['Brand',           s.brandName || '—'],
    ['Origin',          s.originCountry || '—'],
    ['Destination',     s.destinationCountry || '—'],
    ['Order date',      s.orderDate || '—'],
    
  ];

  const colW = W / 3;
  pairs.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x   = ML + col * colW;
    const yy  = y + row * 11;

    text(doc, MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), x, yy);

    text(doc, INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(value, x, yy + 4.5);
  });

  const bottom = y + Math.ceil(pairs.length / 3) * 11 + 2;
  stroke(doc, LINE);
  doc.setLineWidth(0.2);
  doc.line(ML, bottom, PAGE_W - MR, bottom);
  return bottom + 6;
}

function tableHeader(doc: jsPDF, y: number): number {
  const h = 8;
  fill(doc, GOLD);
  doc.rect(ML, y, W, h, 'F');

  text(doc, INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#',            COL.no.x + 2,                        y + 5.5);
  doc.text('PRODUCT',      COL.product.x + 2,                   y + 5.5);
  doc.text('MODEL',        COL.model.x + 2,                     y + 5.5);
  doc.text('ORDERED',      COL.ordered.x + COL.ordered.w - 2,   y + 5.5, { align: 'right' });
  doc.text('LANDED/UNIT',  COL.unitCost.x + COL.unitCost.w - 2, y + 5.5, { align: 'right' });

  return y + h;
}

/**
 * Generate the note and hand back a Blob.
 *
 * Takes the ShipmentCosting rather than recalculating, so the unit costs on the
 * note are provably the same numbers the costing sheet showed — not a second
 * calculation that ought to agree with the first.
 */
export function buildGoodsReceivedPdf(s: Shipment, c: ShipmentCosting): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = header(doc, s);
  y = details(doc, s, y);
  y = tableHeader(doc, y);

    // Every line prints. Partial receipt is no longer tracked, so there is no
  // subset to select — the note lists what the shipment contained.
  const received = c.lines;

  const ROW = 9;
  received.forEach((l, i) => {
    if (y + ROW > PAGE_H - 45) {
      doc.addPage();
      y = 16;
      y = tableHeader(doc, y);
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 251, 252);
      doc.rect(ML, y, W, ROW, 'F');
    }

    text(doc, INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(String(i + 1), COL.no.x + 2, y + 6);
    doc.text(doc.splitTextToSize(l.productName || '—', COL.product.w - 4)[0], COL.product.x + 2, y + 6);
    doc.text(doc.splitTextToSize(l.modelName || '', COL.model.w - 4)[0] || '', COL.model.x + 2, y + 6);
    doc.text(String(l.quantity || 0),         COL.ordered.x + COL.ordered.w - 2,   y + 6, { align: 'right' });

    
    text(doc, INK);
    doc.text(fmtAed(l.landedUnitCost), COL.unitCost.x + COL.unitCost.w - 2, y + 6, { align: 'right' });

    stroke(doc, LINE);
    doc.setLineWidth(0.1);
    doc.line(ML, y + ROW, PAGE_W - MR, y + ROW);
    y += ROW;
  });

  if (received.length === 0) {
    text(doc, MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('This shipment has no product lines.', ML + 4, y + 8);
    y += 14;
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  y += 4;
  const totalOrdered  = c.totalQuantity;

  const boxH = 28;
  if (y + boxH > PAGE_H - 40) { doc.addPage(); y = 16; }

  fill(doc, INK);
  doc.rect(ML, y, W, boxH, 'F');

  const cells: Array<[string, string, { r: number; g: number; b: number }]> = [
    // Three figures, all from the costing sheet. Partial receipt is no longer
    // tracked, so there is no received count and no shortfall to report — the
    // note says what the shipment contained and what it cost to land.
    ['LINES',         String(c.lines.length),          { r: 226, g: 232, b: 240 }],
    ['UNITS',         String(totalOrdered),            { r: 134, g: 239, b: 172 }],
    ['LANDED TOTAL',  fmtAed(c.landedTotal),           { r: 255, g: 255, b: 255 }],
    ['LANDED / UNIT', fmtAed(c.averageLandedUnitCost), { r: 148, g: 163, b: 184 }],
  ];

  const cw = W / cells.length;
  cells.forEach(([label, value, colour], i) => {
    const x = ML + i * cw + 5;
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(label, x, y + 9);

    doc.setTextColor(colour.r, colour.g, colour.b);
    doc.setFontSize(13);
    doc.text(value, x, y + 19);
  });

  y += boxH + 10;

  // ── Signatures ────────────────────────────────────────────────────────────
  if (y + 26 > PAGE_H - 15) { doc.addPage(); y = PAGE_H - 45; }

  const sigW = (W - 10) / 2;
  ([['Received by', ML], ['Checked by', ML + sigW + 10]] as Array<[string, number]>)
    .forEach(([label, x]) => {
      stroke(doc, MUTED);
      doc.setLineWidth(0.2);
      doc.line(x, y + 14, x + sigW, y + 14);
      text(doc, MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(label, x, y + 19);
    });

  // ── Footer ────────────────────────────────────────────────────────────────
  text(doc, MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const finalised = s.receivingFinalisedAt
    ? `Finalised ${new Date(s.receivingFinalisedAt).toLocaleString('en-GB')}`
    : 'Draft — receiving not finalised';
  doc.text(finalised, ML, PAGE_H - 10);
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, PAGE_W - MR, PAGE_H - 10, { align: 'right' });

  return doc.output('blob');
}

/** Build and download in one step. */
export function downloadGoodsReceivedPdf(s: Shipment, c: ShipmentCosting): void {
  const blob = buildGoodsReceivedPdf(s, c);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `GRN-${s.shipmentNumber}.pdf`;
  a.click();
  // Revoked on the next tick: revoking immediately can cancel the download in
  // some browsers before it has read the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}