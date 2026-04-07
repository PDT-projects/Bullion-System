// Invoice Module - PDF Generation Service
// Layout mirrors the real Pakistan Detector Technologies invoice exactly:
//   Logo (left) | Company name + address (right of logo)
//   "Invoice To" heading + full-width underline
//   Customer block (left) | Inv No + Date (right)
//   Table: Sr.No | Product Name | Product Detail | Batch No | Amount
//   Note (left) + Total (right) on same line  ← bold on both sides
//   Terms and Conditions with filled-circle (●) bullets
//   "Thank you for your purchase!" centred at bottom

import jsPDF from 'jspdf';
import { Invoice } from './types';

// ── Page geometry ─────────────────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const ML = 14;
const MR = 14;
const CW = PW - ML - MR; // 182 mm

type RGB = [number, number, number];
const DARK:       RGB = [17,  17,  17];
const GRAY:       RGB = [90,  90,  90];
const LIGHT_GRAY: RGB = [200, 200, 200];
const WHITE:      RGB = [255, 255, 255];
const GREEN_DARK: RGB = [34,  85,  34];

const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const st = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

const fmtAmt  = (n: number) =>
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

// ── Vector logo (green circle with white box + green cross) ──────────────────
function drawLogo(doc: jsPDF, x: number, y: number, size: number) {
  const cx = x + size / 2, cy = y + size / 2, r = size / 2;
  sf(doc, GREEN_DARK); sd(doc, GREEN_DARK); doc.setLineWidth(0);
  doc.ellipse(cx, cy, r, r, 'F');
  const iw = size * 0.55, ih = size * 0.55;
  sf(doc, WHITE); sd(doc, WHITE);
  doc.roundedRect(cx - iw / 2, cy - ih / 2, iw, ih, 1.2, 1.2, 'F');
  const arm = size * 0.09, len = size * 0.30;
  sf(doc, GREEN_DARK); sd(doc, GREEN_DARK);
  doc.rect(cx - arm / 2, cy - len / 2, arm, len, 'F');
  doc.rect(cx - len / 2, cy - arm / 2, len, arm, 'F');
  sf(doc, WHITE); sd(doc, WHITE);
  doc.ellipse(cx, y + size * 0.11, size * 0.17, size * 0.12, 'F');
  sf(doc, GREEN_DARK); sd(doc, GREEN_DARK);
  doc.ellipse(cx, y + size * 0.12, size * 0.09, size * 0.07, 'F');
}

// ── Table cell: draws border + wraps text. Returns actual height. ─────────────
function tCell(
  doc: jsPDF,
  x: number, y: number, w: number, minH: number,
  lines: string[],
  opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; fs?: number } = {},
): number {
  const { bold = false, align = 'left', fs = 9 } = opts;
  const LH  = fs * 0.42;
  const PAD = 2.2;
  const h   = Math.max(minH, lines.length * LH + PAD * 2 + (lines.length > 1 ? (lines.length - 1) * 0.4 : 0));

  sd(doc, LIGHT_GRAY); doc.setLineWidth(0.2);
  doc.rect(x, y, w, h, 'S');

  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fs); st(doc, DARK);

  const baseY = lines.length === 1
    ? y + h / 2 + LH * 0.35
    : y + PAD + LH;

  lines.forEach((ln, i) => {
    const ty = baseY + i * (LH + 0.4);
    if (align === 'center') doc.text(ln, x + w / 2, ty, { align: 'center' });
    else if (align === 'right') doc.text(ln, x + w - PAD, ty, { align: 'right' });
    else doc.text(ln, x + PAD, ty);
  });
  return h;
}

// ── Column definitions (14 … 196 = 182 mm total) ─────────────────────────────
// Sr.No=13 | ProductName=45 | ProductDetail=55 | BatchNo=42 | Amount=27 → 182 ✓
const C = {
  sr:  { x: ML,       w: 13 },
  pn:  { x: ML + 13,  w: 45 },
  pd:  { x: ML + 58,  w: 55 },
  bn:  { x: ML + 113, w: 42 },
  am:  { x: ML + 155, w: 27 },
} as const;
const ROW_H = 9;

// ── Page-break guard ──────────────────────────────────────────────────────────
function pb(doc: jsPDF, y: number, need: number): number {
  if (y + need > PH - 10) { doc.addPage(); return 12; }
  return y;
}

// ── Terms ─────────────────────────────────────────────────────────────────────
const TERMS = [
  'Company guarantees that this device is a 100% genuine branded product with an official warranty.',
  'We are not responsible for the performance, accuracy, and results of any device as per the claims of the manufacturer.',
  'Customer hereby agrees that the above-purchased product is non-returnable, neither exchangeable nor refundable.',
  'Customer hereby acknowledged that all accessories and parts of the device are complete and the device is in working condition.',
  'The company is not responsible for field testing of the machine.',
  'Customers can watch/visit our YouTube Channel for machine training and Air testing before purchasing the machine.',
  'Machines work well on old/buried objects .',
  'Company is exclusively responsible for providing after-sales services to customers who have purchased machines from us.',
  'For warranty claims, the client must show the person who purchased the machine and whose CNIC is written on the invoice, as well as a copy of the CNIC and the invoice',
  'Warranty claim takes around 90 working days.',
  'The COMPANY shall not be held responsible for any illegal activities undertaken by clients.',
  'CLIENTS are strictly prohibited from excavating on legally owned properties; the COMPANY disclaims any responsibility for such actions',
  'The COMPANY will not hold customers responsible for any illegal activities they may engage in, and will also discourage them from engaging in illegal activities.',
];

// ── Main builder ──────────────────────────────────────────────────────────────
function buildPdf(invoice: Invoice): Blob {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  let y = 12;

  // ══════════════════════════════════════════════════════════════════
  // 1. HEADER  —  logo left, company name/address right-of-logo
  // ══════════════════════════════════════════════════════════════════
  const LOGO = 22;
  // drawLogo(doc, ML, y, LOGO);
  doc.addImage('/PDT-logo.png', 'PNG', ML, y, LOGO, LOGO);

  const nx = ML + LOGO + 4;   // text starts here
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); st(doc, DARK);
  doc.text('Pakistan Detector Technologies Pvt. Ltd - Islamabad', nx, y + 7);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(doc, GRAY);
  // centre the address between nx and right edge
  const midX = (nx + PW - MR) / 2;
  doc.text('Office#5, 4th floor, Gulberg Trade center, Gulberg Green Islamabad', midX, y + 13, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, DARK);
  doc.text('Phone No:', nx, y + 19);
  doc.setFont('helvetica', 'normal'); doc.text(' 03111444615', nx + 21, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.text('NTN:', nx, y + 24.5);
  doc.setFont('helvetica', 'normal'); doc.text(' 52723', nx + 9.5, y + 24.5);

  y += LOGO + 10;

  // ══════════════════════════════════════════════════════════════════
  // 2. "Invoice To" heading + full-width underline
  // ══════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); st(doc, DARK);
  doc.text('Invoice To', ML, y);
  y += 2;
  sd(doc, DARK); doc.setLineWidth(0.5);
  doc.line(ML, y, PW - MR, y);
  y += 7;

  // ══════════════════════════════════════════════════════════════════
  // 3. CUSTOMER block (left) + Inv No / Date (right)
  // ══════════════════════════════════════════════════════════════════
  const RX = ML + 88;   // right-column x
  let lY = y;

  // Customer name — bold
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); st(doc, DARK);
  doc.text(invoice.customerName || '', ML, lY); lY += 5.5;

  // City (no label)
  if (invoice.customerCity) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st(doc, DARK);
    doc.text(invoice.customerCity, ML, lY); lY += 5;
  }

  // CNIC  bold label + normal value
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, DARK);
  doc.text('CNIC: ', ML, lY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerCNIC || '', ML + 13, lY);
  lY += 5;

  // Mobile  bold label + normal value
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile: ', ML, lY);
  doc.setFont('helvetica', 'normal');
  const phone = invoice.customerPhone2
    ? `${invoice.customerPhone}   /   ${invoice.customerPhone2}`
    : (invoice.customerPhone || '');
  doc.text(phone, ML + 16, lY);
  lY += 5;

  // Email label (blank value)
  doc.setFont('helvetica', 'bold');
  doc.text('Email', ML, lY);
  lY += 5;

  // Right column — align with the CNIC line (i.e. after name + optional city)
  const rStartY = y + 5.5 + (invoice.customerCity ? 5 : 0);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, DARK);
  doc.text('Inv No:', RX, rStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || '', RX + 16, rStartY);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', RX, rStartY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(invoice.date), RX + 13, rStartY + 6);

  y = lY + 3;

  // ══════════════════════════════════════════════════════════════════
  // 4. PRODUCTS TABLE
  // ══════════════════════════════════════════════════════════════════

  // Header
  tCell(doc, C.sr.x,  y, C.sr.w,  ROW_H, ['Sr.No'],          { bold: true, align: 'center' });
  tCell(doc, C.pn.x,  y, C.pn.w,  ROW_H, ['Product Name'],   { bold: true });
  tCell(doc, C.pd.x,  y, C.pd.w,  ROW_H, ['Product Detail'], { bold: true });
  tCell(doc, C.bn.x,  y, C.bn.w,  ROW_H, ['Batch No'],       { bold: true });
  tCell(doc, C.am.x,  y, C.am.w,  ROW_H, ['Amount'],         { bold: true });
  y += ROW_H;

  invoice.products.forEach((p, idx) => {
    const serials = (p.serialNumbers || []).filter(s => s.trim() !== '');

    const srLines  = [String(idx + 1)];
    const pnLines  = doc.splitTextToSize(p.productName || '', C.pn.w - 5) as string[];
    // Product Detail = exchangeWarrantyNote if it looks like warranty info, else description
    const detailRaw = p.description?.trim() || '';
    const pdLines  = detailRaw ? doc.splitTextToSize(detailRaw, C.pd.w - 5) as string[] : [''];
    const bnLines  = serials.length > 0
      ? doc.splitTextToSize(serials.join('\n'), C.bn.w - 5) as string[]
      : [''];
    const amLines  = [fmtAmt(p.total)];

    const LH_MM = 9 * 0.42;
    const maxLn = Math.max(srLines.length, pnLines.length, pdLines.length, bnLines.length, 1);
    const rH    = Math.max(ROW_H, maxLn * LH_MM + 5);

    y = pb(doc, y, rH);

    tCell(doc, C.sr.x, y, C.sr.w, rH, srLines,  { align: 'center' });
    tCell(doc, C.pn.x, y, C.pn.w, rH, pnLines,  {});
    tCell(doc, C.pd.x, y, C.pd.w, rH, pdLines,  {});
    tCell(doc, C.bn.x, y, C.bn.w, rH, bnLines,  {});
    tCell(doc, C.am.x, y, C.am.w, rH, amLines,  {});

    y += rH;
  });

  y += 5;

  // ══════════════════════════════════════════════════════════════════
  // 5. NOTE  (left, bold label)  +  TOTAL  (right, bold)
  // ══════════════════════════════════════════════════════════════════
  y = pb(doc, y, 10);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, DARK);
  doc.text('Note:', ML, y);

  if (invoice.exchangeWarrantyNote?.trim()) {
    doc.setFont('helvetica', 'normal'); st(doc, GRAY);
    const nLines = doc.splitTextToSize(invoice.exchangeWarrantyNote, 95) as string[];
    doc.text(nLines[0], ML + 12, y);
    nLines.slice(1).forEach((ln, i) => doc.text(ln, ML + 12, y + (i + 1) * 4.5));
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, DARK);
  doc.text(`Total: ${fmtAmt(invoice.totalAmount)}`, PW - MR, y, { align: 'right' });

  y += 12;

  // ══════════════════════════════════════════════════════════════════
  // 6. TERMS AND CONDITIONS
  // ══════════════════════════════════════════════════════════════════
  y = pb(doc, y, 16);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); st(doc, DARK);
  doc.text('Terms and Conditions', ML, y);
  y += 8;

  const BX   = ML + 3;    // bullet centre X
  const TX   = ML + 8;    // text X
  const TW   = CW - 8;    // text wrap width
  const BFS  = 8;         // body font size
  const BLH  = BFS * 0.42; // line height mm
  const BR   = 1.1;       // bullet radius

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BFS); st(doc, DARK);

  for (const term of TERMS) {
    const lines  = doc.splitTextToSize(term, TW) as string[];
    const termH  = lines.length * BLH + (lines.length - 1) * 0.3 + 2;
    y = pb(doc, y, termH + 2);

    // Filled circle bullet — vertically centred on first text line
    sf(doc, DARK); sd(doc, DARK); doc.setLineWidth(0.01);
    doc.ellipse(BX, y - 0.5, BR, BR, 'F');

    lines.forEach((ln, i) => doc.text(ln, TX, y + i * (BLH + 0.3)));
    y += termH;
  }

  y += 10;

  // ══════════════════════════════════════════════════════════════════
  // 7. THANK YOU
  // ══════════════════════════════════════════════════════════════════
  y = pb(doc, y, 10);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); st(doc, DARK);
  doc.text('Thank you for your purchase!', PW / 2, y, { align: 'center' });

  return doc.output('blob');
}

// ── Public API ────────────────────────────────────────────────────────────────
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