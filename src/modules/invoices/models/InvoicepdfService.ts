// Invoice Module - PDF Generation Service
// Pure jsPDF native drawing — NO html2canvas (causes blank PDFs).
// Key fix: jsPDF has NO doc.circle() — use doc.ellipse(cx, cy, r, r, style).

import jsPDF from 'jspdf';
import { Invoice } from './types';

// ── Palette ───────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const INDIGO_DARK:   RGB = [67,  56,  202];
const INDIGO:        RGB = [79,  70,  229];
const INDIGO_MID:    RGB = [99,  102, 241];
const INDIGO_DEEP:   RGB = [30,  27,   75];
const INDIGO_LIGHT:  RGB = [238, 242, 255];
const INDIGO_BORDER: RGB = [199, 210, 254];
const INDIGO_3:      RGB = [55,  48,  163];
const WHITE:         RGB = [255, 255, 255];
const BLACK:         RGB = [17,  24,   39];
const GRAY:          RGB = [107, 114, 128];
const GRAY_STRIPE:   RGB = [245, 247, 255];
const GRAY_LINE:     RGB = [229, 231, 235];
const GREEN:         RGB = [22,  163,  74];
const RED:           RGB = [220,  38,  38];
const YELLOW_BG:     RGB = [254, 252, 232];
const YELLOW_BD:     RGB = [234, 179,   8];
const YELLOW_TXT:    RGB = [120,  53,  15];
const PURPLE_LIGHT:  RGB = [245, 243, 255];
const PURPLE_BD:     RGB = [224, 231, 255];
const PURPLE_BADGE:  RGB = [91,  33,  182];
const VIOLET:        RGB = [196, 181, 253];

const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const st = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

// ── Layout ────────────────────────────────────────────────────────────────────
const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
const FOOTER_H = 11;

// Table columns  (all x are page-absolute; total content = ML … PW-MR = 14 … 196)
const COL = {
  num:    { x: ML,        w: 10 },
  prod:   { x: ML + 10,   w: 52 },
  serial: { x: ML + 62,   w: 58 },
  qty:    { x: ML + 120,  w: 14 },
  price:  { x: ML + 134,  w: 26 },
  total:  { x: ML + 160,  w: 22 },   // right edge = 196 ✓
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

// ── Draw checkmark via two lines ──────────────────────────────────────────────
function drawCheck(doc: jsPDF, cx: number, cy: number, s: number, c: RGB) {
  sd(doc, c);
  doc.setLineWidth(s * 0.18);
  doc.line(cx - s * 0.38, cy,            cx - s * 0.05, cy + s * 0.40);
  doc.line(cx - s * 0.05, cy + s * 0.40, cx + s * 0.48, cy - s * 0.35);
}

// ── Circular seal (drawn entirely with ellipse + rect + text) ────────────────
function drawSeal(doc: jsPDF, cx: number, cy: number) {
  const r = 21;

  // background fill
  sf(doc, INDIGO_LIGHT);
  sd(doc, INDIGO_LIGHT);
  doc.ellipse(cx, cy, r, r, 'F');

  // outer ring
  sd(doc, INDIGO);
  doc.setLineWidth(0.9);
  doc.ellipse(cx, cy, r, r, 'S');

  // second ring
  doc.setLineWidth(0.45);
  doc.ellipse(cx, cy, r - 3.5, r - 3.5, 'S');

  // inner ring (solid thin — skip dash, jsPDF version may not support it)
  doc.setLineWidth(0.25);
  doc.ellipse(cx, cy, r - 8, r - 8, 'S');

  // horizontal dividers
  const lw = (r - 9) * 2;
  doc.setLineWidth(0.28);
  doc.line(cx - lw / 2, cy - 5,  cx + lw / 2, cy - 5);
  doc.line(cx - lw / 2, cy + 6,  cx + lw / 2, cy + 6);

  // large checkmark
  drawCheck(doc, cx, cy + 0.5, 8.5, INDIGO);

  // top label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  st(doc, INDIGO_3);
  doc.text('PAKISTAN DETECTORS', cx, cy - r + 8,  { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('TECHNOLOGIES',       cx, cy - r + 13, { align: 'center' });

  // bottom label
  doc.setFontSize(4.8);
  st(doc, INDIGO);
  doc.text('VERIFIED INVOICE',   cx, cy + r - 5.5, { align: 'center' });

  // small dot at top of ring
  sf(doc, INDIGO); sd(doc, INDIGO);
  doc.ellipse(cx, cy - r + 4, 1, 1, 'F');
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, invN: string) {
  const fy = PH - FOOTER_H;
  sf(doc, INDIGO_DEEP);
  doc.rect(0, fy, PW, FOOTER_H, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  st(doc, [165, 180, 252]);
  doc.text('Pakistan Detectors Technologies', ML,     fy + 7);
  doc.text('Thank you for your business!',   PW / 2, fy + 7, { align: 'center' });
  doc.text(invN,                             PW - MR,fy + 7, { align: 'right'  });
}

// ── Page break guard ──────────────────────────────────────────────────────────
function guard(doc: jsPDF, y: number, need: number, invN: string): number {
  if (y + need > PH - FOOTER_H - 6) {
    drawFooter(doc, invN);
    doc.addPage();
    return 15;
  }
  return y;
}

// ── Main builder ──────────────────────────────────────────────────────────────
function buildPdf(invoice: Invoice): Blob {
  const doc  = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const net  = invoice.totalAmount - (invoice.deductionCharges || 0);
  const invN = invoice.invoiceNumber || 'INVOICE';
  let   y    = 0;

  // ── HEADER ─────────────────────────────────────────────────────────────────
  sf(doc, INDIGO_DARK); doc.rect(0, 0, PW, 22, 'F');
  st(doc, WHITE);
  doc.setFont('helvetica', 'bold');   doc.setFontSize(14);
  doc.text('Pakistan Detectors Technologies', ML, 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  st(doc, INDIGO_BORDER);
  doc.text('Professional Detection Equipment', ML, 16.5);
  st(doc, WHITE);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('INVOICE', PW - MR, 13, { align: 'right' });

  if (invoice.digitalStamp) {
    sd(doc, WHITE); doc.setLineWidth(0.3); doc.setFontSize(7);
    const bw = 36, bh = 5.5, bx = PW - MR - bw, by = 15.5;
    doc.roundedRect(bx, by, bw, bh, 2, 2, 'S');
    doc.text('✓ DIGITALLY STAMPED', bx + bw / 2, by + 3.8, { align: 'center' });
  }
  y = 22;

  // ── META BAR ───────────────────────────────────────────────────────────────
  sf(doc, INDIGO_LIGHT); doc.rect(0, y, PW, 15, 'F');
  sd(doc, INDIGO_BORDER); doc.setLineWidth(0.5);
  doc.line(0, y + 15, PW, y + 15);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); st(doc, GRAY);
  const mx = [ML, ML + 52, ML + 104, ML + 152];
  ['INVOICE NUMBER', 'DATE', 'PAYMENT STATUS', 'DELIVERY'].forEach((lbl, i) => {
    if (i === 3 && !invoice.deliveryStatus) return;
    doc.text(lbl, mx[i], y + 5);
  });

  doc.setFont('helvetica', 'bold'); st(doc, INDIGO_DEEP);
  doc.setFontSize(9);  doc.text(invN,                 mx[0], y + 12);
  doc.setFontSize(8.5);
  st(doc, BLACK); doc.text(fmtDate(invoice.date),     mx[1], y + 12);
  st(doc, invoice.status === 'Paid' ? GREEN : RED);
  doc.text(invoice.status,                            mx[2], y + 12);
  if (invoice.deliveryStatus) {
    st(doc, BLACK); doc.text(invoice.deliveryStatus,  mx[3], y + 12);
  }
  y += 18;

  // ── CUSTOMER ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); st(doc, INDIGO);
  doc.text('BILL TO', ML, y); y += 6;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); st(doc, BLACK);
  doc.text(invoice.customerName, ML, y); y += 6;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); st(doc, GRAY);
  const custLines = [
    `Phone: ${invoice.customerPhone}${invoice.customerPhone2 ? ' / ' + invoice.customerPhone2 : ''}`,
    ...(invoice.customerCNIC ? [`CNIC: ${invoice.customerCNIC}`] : []),
    ...((invoice.customerCity || invoice.customerProvince)
      ? [`Location: ${[invoice.customerCity, invoice.customerProvince].filter(Boolean).join(', ')}`] : []),
    ...(invoice.customerAddress ? [`Address: ${invoice.customerAddress}`] : []),
  ];
  custLines.forEach(line => { doc.text(line, ML, y); y += 5; });

  if (invoice.warrantyLocation) {
    const wbx = PW - MR - 52, wby = y - custLines.length * 5 - 6;
    sf(doc, [240, 253, 244]); sd(doc, [187, 247, 208]);
    doc.setLineWidth(0.4); doc.roundedRect(wbx, wby, 52, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); st(doc, [22, 101, 52]);
    doc.text('WARRANTY LOCATION', wbx + 26, wby + 6,  { align: 'center' });
    doc.setFontSize(9); st(doc, [20, 83, 45]);
    doc.text(invoice.warrantyLocation,  wbx + 26, wby + 14, { align: 'center' });
  }

  y += 4;
  sd(doc, GRAY_LINE); doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y); y += 6;

  // ── PRODUCTS TABLE ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); st(doc, INDIGO);
  doc.text('PRODUCTS & ITEMS', ML, y); y += 5;

  // header row
  sf(doc, INDIGO); doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(doc, WHITE);
  const hy = y + 5.5;
  doc.text('#',              COL.num.x    + COL.num.w    / 2, hy, { align: 'center' });
  doc.text('Product',        COL.prod.x   + 2,                hy);
  doc.text('Serial Numbers', COL.serial.x + 2,                hy);
  doc.text('Qty',            COL.qty.x    + COL.qty.w    / 2, hy, { align: 'center' });
  doc.text('Unit Price',     COL.price.x  + COL.price.w,      hy, { align: 'right'  });
  doc.text('Total',          COL.total.x  + COL.total.w,      hy, { align: 'right'  });
  y += 8;

  // product rows
  invoice.products.forEach((p, idx) => {
    const serials   = (p.serialNumbers || []).filter(s => s.trim() !== '');
    const sPerRow   = 4;
    const sRowCount = serials.length > 0 ? Math.ceil(serials.length / sPerRow) : 1;
    const rowH      = Math.max(11, sRowCount * 5 + 7);

    y = guard(doc, y, rowH + 1, invN);

    sf(doc, idx % 2 === 0 ? WHITE : GRAY_STRIPE);
    sd(doc, GRAY_LINE); doc.setLineWidth(0.15);
    doc.rect(ML, y, CW, rowH, 'FD');

    const ry = y + 6.5;

    // index
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, INDIGO);
    doc.text(String(idx + 1), COL.num.x + COL.num.w / 2, ry, { align: 'center' });

    // product name
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, BLACK);
    const pName = doc.splitTextToSize(p.productName, COL.prod.w - 3);
    doc.text(pName[0], COL.prod.x + 2, ry);
    if (p.category) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); st(doc, GRAY);
      doc.text(p.category, COL.prod.x + 2, ry + 4.5);
    }

    // serials as small badges
    if (serials.length > 0) {
      let sx = COL.serial.x + 2, sy = y + 3.5;
      serials.forEach((s, si) => {
        if (si > 0 && si % sPerRow === 0) { sx = COL.serial.x + 2; sy += 5; }
        const sw = Math.min(Math.max(s.length * 1.9 + 5, 14), 34);
        sf(doc, INDIGO_LIGHT); sd(doc, INDIGO_BORDER);
        doc.setLineWidth(0.2); doc.roundedRect(sx, sy - 2, sw, 4.5, 0.8, 0.8, 'FD');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); st(doc, INDIGO_DARK);
        doc.text(s, sx + sw / 2, sy + 0.8, { align: 'center' });
        sx += sw + 1.5;
      });
    } else {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(doc, GRAY);
      doc.text('—', COL.serial.x + 2, ry);
    }

    // qty, price, total
    doc.setFont('helvetica', 'bold');   doc.setFontSize(8.5); st(doc, BLACK);
    doc.text(String(p.quantity),          COL.qty.x   + COL.qty.w   / 2, ry, { align: 'center' });
    doc.setFont('helvetica', 'normal');  doc.setFontSize(7.5);
    doc.text(fmtCurrency(p.price),        COL.price.x + COL.price.w,      ry, { align: 'right'  });
    doc.setFont('helvetica', 'bold');    doc.setFontSize(8);
    doc.text(fmtCurrency(p.total),        COL.total.x + COL.total.w,      ry, { align: 'right'  });

    y += rowH;
  });

  y += 6;

  // ── TOTALS ─────────────────────────────────────────────────────────────────
  y = guard(doc, y, 40, invN);
  const totX = PW - MR - 72;

  const totRow = (label: string, value: string, bold = false, color: RGB = BLACK) => {
    sd(doc, GRAY_LINE); doc.setLineWidth(0.2);
    doc.line(totX, y + 2, PW - MR, y + 2);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 8.5 : 8);
    st(doc, GRAY);   doc.text(label, totX + 2, y);
    st(doc, color);  doc.text(value, PW - MR, y, { align: 'right' });
    y += 7;
  };

  totRow('Subtotal', fmtCurrency(invoice.totalAmount));
  if ((invoice.deductionCharges || 0) > 0)
    totRow('Deduction Charges', `- ${fmtCurrency(invoice.deductionCharges)}`, false, RED);
  if (invoice.paymentStatus === 'Partial' && invoice.paidAmount) {
    totRow('Paid Amount',       fmtCurrency(invoice.paidAmount),           false, GREEN);
    totRow('Remaining Balance', fmtCurrency(invoice.remainingAmount || 0), false, RED);
  }

  y += 1;
  sf(doc, INDIGO); doc.rect(totX, y - 4, 72, 11, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); st(doc, WHITE);
  doc.text('Net Total',      totX + 3, y + 3);
  doc.setFontSize(12);
  doc.text(fmtCurrency(net), PW - MR,  y + 3, { align: 'right' });
  y += 14;

  // ── WARRANTY NOTE ──────────────────────────────────────────────────────────
  if (invoice.exchangeWarrantyNote?.trim()) {
    y = guard(doc, y, 30, invN); y += 2;
    const nLines = doc.splitTextToSize(invoice.exchangeWarrantyNote, CW - 10);
    const nH     = nLines.length * 5 + 13;
    sf(doc, YELLOW_BG); sd(doc, YELLOW_BD);
    doc.setLineWidth(0.55); doc.roundedRect(ML, y, CW, nH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');   doc.setFontSize(7); st(doc, [146, 64, 14]);
    doc.text('EXCHANGE & WARRANTY POLICY', ML + 5, y + 6.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(doc, YELLOW_TXT);
    doc.text(nLines, ML + 5, y + 13);
    y += nH + 7;
  }

  // ── DIGITAL STAMP BLOCK ────────────────────────────────────────────────────
  if (invoice.digitalStamp) {
    const stampH = 52;
    y = guard(doc, y, stampH + 4, invN); y += 2;

    sf(doc, PURPLE_LIGHT); sd(doc, PURPLE_BD);
    doc.setLineWidth(0.7); doc.roundedRect(ML, y, CW, stampH, 3, 3, 'FD');

    // seal circle centred vertically in the block
    drawSeal(doc, ML + 27, y + stampH / 2);

    // text block
    const tx = ML + 52;
    doc.setFont('helvetica', 'bold');   doc.setFontSize(13); st(doc, INDIGO_3);
    doc.text('Digitally Stamped & Verified', tx, y + 13);
    doc.setFont('helvetica', 'bold');   doc.setFontSize(9);  st(doc, INDIGO);
    doc.text('Pakistan Detectors Technologies', tx, y + 21);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(doc, INDIGO_MID);
    const desc = doc.splitTextToSize(
      'This invoice has been officially issued and digitally stamped by Pakistan Detectors Technologies.',
      CW - 56 - 30,
    );
    doc.text(desc, tx, y + 29);

    doc.setFont('helvetica', 'bold');   doc.setFontSize(7.5); st(doc, INDIGO);
    doc.text('Invoice No:', tx,      y + 41);
    doc.setFont('helvetica', 'normal'); st(doc, BLACK);
    doc.text(invN,           tx + 22, y + 41);
    doc.setFont('helvetica', 'bold');   st(doc, INDIGO);
    doc.text('Net Total:',   tx + 70, y + 41);
    doc.setFont('helvetica', 'normal'); st(doc, BLACK);
    doc.text(fmtCurrency(net), tx + 88, y + 41);

    // verified badge (right side) — uses ellipse, NOT circle
    const bcx = PW - MR - 17, bcy = y + 26;
    sf(doc, INDIGO); sd(doc, VIOLET); doc.setLineWidth(0.9);
    doc.ellipse(bcx, bcy, 13, 13, 'FD');          // ← ellipse, not circle
    drawCheck(doc, bcx, bcy + 0.5, 6.5, WHITE);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); st(doc, PURPLE_BADGE);
    doc.text('AUTHENTIC', bcx, y + 44, { align: 'center' });

    y += stampH + 8;
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  drawFooter(doc, invN);

  return doc.output('blob');
}

// ── Public API (async wrappers for drop-in compatibility) ─────────────────────
export async function generateInvoicePdf(invoice: Invoice): Promise<Blob> {
  return buildPdf(invoice);
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = buildPdf(invoice);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}