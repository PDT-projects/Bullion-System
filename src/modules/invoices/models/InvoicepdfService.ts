// Invoice Module — PDF Generation Service (v5 — Proforma layout)
//
// Rewritten to match the reference "GoldXtra"-style proforma invoice layout:
//   • Yellow strip + black header bar with brand name
//   • PROFORMA INVOICE title, right-aligned date + PI #
//   • Company info block (seller)
//   • Bill To / Ship To dual columns with gold header bars
//   • Product table (IMAGE | DESCRIPTION | QTY | UNIT PRICE US $ | TOTAL US $)
//   • Totals block with gold-highlighted TOTAL row
//   • Amount in words
//   • Terms + stamp + beneficiary payment instructions
//   • Thank You footer
//
// Same exports as prior versions (generateInvoicePdf / downloadInvoicePdf)
// so all upstream callers (InventoryDashboardView eye icon, InvoiceListView
// download button, etc.) keep working unchanged.

import { jsPDF } from 'jspdf';
import { Invoice } from './types';

// ── Palette ─────────────────────────────────────────────────────────────────
const GOLD      = { r: 232, g: 185, b: 57  };   // #E8B939 — yellow strips
const GOLD_DARK = { r: 212, g: 160, b: 23  };   // #D4A017 — brand text
const BLACK     = { r: 20,  g: 20,  b: 20  };   // near-black for header
const LINE      = { r: 210, g: 210, b: 210 };   // grey borders
const LIGHT_BG  = { r: 250, g: 250, b: 250 };   // zebra row tint
const TEXT_D    = { r: 30,  g: 30,  b: 30  };   // primary text
const TEXT_M    = { r: 90,  g: 90,  b: 90  };   // muted text
const RED       = { r: 190, g: 30,  b: 30  };

// ── Page geometry (A4 portrait) ─────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML     = 8;                  // left margin
const MR     = 8;                  // right margin
const CONTENT_W = PAGE_W - ML - MR;

// ── Seller (hardcoded — same values as prior PDF versions) ─────────────────
const SELLER = {
  brand:    'Bullion Electronics',
  name:     'BULLION Specialized Electronic Devices Trading',
  contact:  'Ref: Sales Team',
  email:    'sales@bullionelectronics.ae',
  address1: 'C108 Building 936 M-04, Plot Mohammed Bin Zayed City',
  address2: 'ME9, Abu Dhabi',
  country:  'UAE',
  phone:    '+971 56 985 2213',
};

// ── Beneficiary bank info (hardcoded — from existing PDF) ──────────────────
const BENEFICIARY = {
  companyName:   'BULLION Specialized Electronic Devices Trading L.L.C - O.P.C',
  bankName:      'Emirates NBD',
  swiftCode:     'EBILAEAD',
  accountNumber: '1015895052001',
  routingCode:   '302620122',
  iban:          'AE220260000101589505200001',
  branch:        'Dalma Mall, Abu Dhabi, UAE',
};

// ── Currency ────────────────────────────────────────────────────────────────
// Reference invoice used US$; we default to AED to match the rest of the app.
// Change CURRENCY_CODE if you want USD/etc.
const CURRENCY_CODE   = 'AED';
const CURRENCY_SYMBOL = 'AED';

// ── Image loader (kept identical to prior versions — proven with Firebase) ─
interface ImageData { dataUrl: string; format: 'PNG' | 'JPEG'; }
async function loadImage(src: string): Promise<ImageData | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = 'blob';
    xhr.timeout = 8000;
    xhr.onload = () => {
      if (xhr.status !== 200) { resolve(null); return; }
      const blob: Blob = xhr.response;
      if (!blob || blob.size === 0) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const b = new Uint8Array(reader.result as ArrayBuffer);
          let format: 'PNG' | 'JPEG';
          if (b[0] === 0x89 && b[1] === 0x50) format = 'PNG';
          else if (b[0] === 0xff && b[1] === 0xd8) format = 'JPEG';
          else { resolve(null); return; }
          const r2 = new FileReader();
          r2.onload  = () => resolve(r2.result ? { dataUrl: r2.result as string, format } : null);
          r2.onerror = () => resolve(null);
          r2.readAsDataURL(blob);
        } catch { resolve(null); }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(blob);
    };
    xhr.onerror   = () => resolve(null);
    xhr.ontimeout = () => resolve(null);
    xhr.send();
  });
}

// ── Formatters ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Convert integer to English words. Used for the "In Words" line. */
function numberToWords(n: number): string {
  n = Math.floor(Number(n) || 0);
  if (n === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inner = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + inner(num % 100) : '');
    return '';
  };
  const parts: string[] = [];
  const crore  = Math.floor(n / 10000000); n %= 10000000;
  const lakh   = Math.floor(n / 100000);   n %= 100000;
  const thou   = Math.floor(n / 1000);     n %= 1000;
  if (crore) parts.push(inner(crore) + ' Crore');
  if (lakh)  parts.push(inner(lakh)  + ' Lakh');
  if (thou)  parts.push(inner(thou)  + ' Thousand');
  if (n)     parts.push(inner(n));
  return parts.join(' ');
}

function formatDateDDMMMYYYY(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = d.getDate();
    const suf = day % 10 === 1 && day !== 11 ? 'st'
             : day % 10 === 2 && day !== 12 ? 'nd'
             : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${day}${suf} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return iso; }
}

// ── Drawing primitives ──────────────────────────────────────────────────────
function fill(doc: jsPDF, c: {r:number;g:number;b:number}) { doc.setFillColor(c.r,c.g,c.b); }
function stroke(doc: jsPDF, c: {r:number;g:number;b:number}) { doc.setDrawColor(c.r,c.g,c.b); }
function text(doc: jsPDF, c: {r:number;g:number;b:number}) { doc.setTextColor(c.r,c.g,c.b); }

/** Draws a rectangle with an optional border and fill in one call. */
function box(doc: jsPDF, x: number, y: number, w: number, h: number, opts: {
  fill?: {r:number;g:number;b:number};
  border?: {r:number;g:number;b:number};
  borderWidth?: number;
}) {
  if (opts.fill) {
    fill(doc, opts.fill);
    doc.rect(x, y, w, h, 'F');
  }
  if (opts.border) {
    stroke(doc, opts.border);
    doc.setLineWidth(opts.borderWidth || 0.2);
    doc.rect(x, y, w, h);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Page sections
// ═══════════════════════════════════════════════════════════════════════════

/** Top yellow strip + black header bar with brand name. */
function renderHeader(doc: jsPDF): number {
  // Thin yellow strip at very top
  box(doc, 0, 0, PAGE_W, 4, { fill: GOLD });

  // Black bar
  box(doc, 0, 4, PAGE_W, 14, { fill: BLACK });

  // Brand name in gold
  text(doc, GOLD_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(SELLER.brand, PAGE_W / 2, 13.5, { align: 'center' });

  // Thin gold underline separator below the bar
  box(doc, 0, 18, PAGE_W, 0.6, { fill: GOLD });

  return 22;  // y-cursor after the header
}

/** "PROFORMA INVOICE" title + right-aligned date and PI #. */
function renderTitleRow(doc: jsPDF, invoice: Invoice, y: number): number {
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PROFORMA INVOICE', PAGE_W / 2, y + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${formatDateDDMMMYYYY(invoice.date)}`, PAGE_W - MR, y + 3, { align: 'right' });
  doc.text(`PI # ${invoice.invoiceNumber}`,                PAGE_W - MR, y + 8, { align: 'right' });

  return y + 15;
}

/** Company info block on the left side, below the title. */
function renderSellerInfo(doc: jsPDF, y: number): number {
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(SELLER.name, ML, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let ly = y + 4.5;
  const lines = [SELLER.contact, SELLER.email, SELLER.address1, SELLER.address2, SELLER.country, SELLER.phone];
  for (const l of lines) { doc.text(l, ML, ly); ly += 4; }

  // Subtle divider under the seller block
  stroke(doc, LINE);
  doc.setLineWidth(0.2);
  doc.line(ML, ly + 1, PAGE_W - MR, ly + 1);

  return ly + 4;
}

/** BILL TO / SHIP TO dual columns with gold header bars. */
function renderBillShipTo(doc: jsPDF, invoice: Invoice, y: number): number {
  const colW = (CONTENT_W - 2) / 2;           // 2mm gutter between columns
  const gutter = 2;
  const bh = 6;                                // header bar height

  // Header bars (light gold background, dark text)
  box(doc, ML,               y, colW, bh, { fill: { r: 250, g: 235, b: 200 } });
  box(doc, ML + colW + gutter, y, colW, bh, { fill: { r: 250, g: 235, b: 200 } });

  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO', ML + 2, y + 4);
  doc.text('SHIP TO', ML + colW + gutter + 2, y + 4);

  // Customer info under both headers
  const detailY = y + bh + 4;
  doc.setFontSize(9);
  const cName  = invoice.customerName  || '—';
  const phone1 = invoice.customerPhone || '';
  const cCity  = invoice.customerCity  || '';
  const cProv  = invoice.customerProvince || invoice.customerCountry || '';
  const cAddr  = invoice.customerAddress || '';

  const infoLines = [
    { text: cName,                     bold: true },
    { text: phone1 ? `Phone: ${phone1}` : '',       bold: false },
    { text: cCity && cProv ? `${cCity}, ${cProv}` : cCity || cProv, bold: false },
    { text: cAddr,                     bold: false },
  ].filter(l => l.text);

  let ly = detailY;
  for (const l of infoLines) {
    doc.setFont('helvetica', l.bold ? 'bold' : 'normal');
    // BILL TO column
    const wrapped = doc.splitTextToSize(l.text, colW - 4);
    doc.text(wrapped, ML + 2, ly);
    // SHIP TO column (same info by default — matches reference)
    doc.text(wrapped, ML + colW + gutter + 2, ly);
    ly += wrapped.length * 4;
  }

  // Divider
  stroke(doc, LINE);
  doc.setLineWidth(0.2);
  doc.line(ML, ly + 2, PAGE_W - MR, ly + 2);

  return ly + 5;
}

// ── Product table ──────────────────────────────────────────────────────────
const COL = {
  image: { x: ML,          w: 30 },
  desc:  { x: ML + 30,     w: 90 },
  qty:   { x: ML + 120,    w: 20 },
  unit:  { x: ML + 140,    w: 27 },
  total: { x: ML + 167,    w: 27 },
} as const;

/** Yellow header row for the product table. */
function renderProductsHeader(doc: jsPDF, y: number): number {
  const h = 9;
  box(doc, ML, y, CONTENT_W, h, { fill: GOLD });

  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('IMAGE',           COL.image.x + COL.image.w / 2, y + 6, { align: 'center' });
  doc.text('DESCRIPTION',     COL.desc.x + 4,                y + 6);
  doc.text('QTY',             COL.qty.x + COL.qty.w / 2,     y + 6, { align: 'center' });
  doc.text(`UNIT PRICE ${CURRENCY_SYMBOL}`, COL.unit.x + COL.unit.w / 2,  y + 6, { align: 'center' });
  doc.text(`TOTAL ${CURRENCY_SYMBOL}`,      COL.total.x + COL.total.w / 2, y + 6, { align: 'center' });

  return y + h;
}

/** One product row. Returns the y-cursor after the row. */
function renderProductRow(
  doc: jsPDF, product: any, y: number,
  imageData: ImageData | null, rowIdx: number,
): number {
  const ROW_H = 24;

  // Zebra tinting
  if (rowIdx % 2 === 1) {
    box(doc, ML, y, CONTENT_W, ROW_H, { fill: LIGHT_BG });
  }

  // Column borders
  stroke(doc, LINE);
  doc.setLineWidth(0.15);
  doc.line(ML, y, ML, y + ROW_H);                                        // left
  doc.line(COL.desc.x,  y, COL.desc.x,  y + ROW_H);
  doc.line(COL.qty.x,   y, COL.qty.x,   y + ROW_H);
  doc.line(COL.unit.x,  y, COL.unit.x,  y + ROW_H);
  doc.line(COL.total.x, y, COL.total.x, y + ROW_H);
  doc.line(PAGE_W - MR, y, PAGE_W - MR, y + ROW_H);                      // right
  doc.line(ML, y + ROW_H, PAGE_W - MR, y + ROW_H);                       // bottom

  // Product image — small card with border
  const imgPad = 2;
  const imgSize = ROW_H - imgPad * 2;
  const imgX = COL.image.x + (COL.image.w - imgSize) / 2;
  const imgY = y + imgPad;
  box(doc, imgX, imgY, imgSize, imgSize, { fill: { r: 245, g: 245, b: 245 }, border: LINE, borderWidth: 0.1 });
  if (imageData) {
    try {
      doc.addImage(imageData.dataUrl, imageData.format, imgX + 0.5, imgY + 0.5, imgSize - 1, imgSize - 1);
    } catch { /* image draw failed — leave the placeholder card */ }
  }

  // Description
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const brand = (product.brandName || '').toUpperCase();
  const model = product.modelName || '';
  const nameLine = `${brand} ${model}`.trim() || (product.productName || 'Item');
  doc.text(nameLine, COL.desc.x + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  text(doc, TEXT_M);
  const typeLine = product.type || product.category || 'Product';
  doc.text(typeLine, COL.desc.x + 4, y + 11);
  const warrantyLine = product.warranty || product.warrantyPeriod || (product.exchangeWarrantyNote ? '' : '');
  if (warrantyLine) doc.text(warrantyLine, COL.desc.x + 4, y + 16);

  // Numbers
  const qty       = Number(product.quantity) || 1;
  const unitPrice = Number(product.sellPrice || product.unitPrice || product.price) || 0;
  const total     = qty * unitPrice;

  text(doc, TEXT_D);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(String(qty),   COL.qty.x + COL.qty.w / 2,   y + 13, { align: 'center' });
  doc.text(fmt(unitPrice), COL.unit.x + COL.unit.w - 3, y + 13, { align: 'right' });
  doc.text(fmt(total),     COL.total.x + COL.total.w - 3, y + 13, { align: 'right' });

  return y + ROW_H;
}

/** Totals block on the right side. */
function renderTotals(doc: jsPDF, invoice: Invoice, y: number): number {
  const rowW = 90;
  const labelW = 50;
  const valW = rowW - labelW;
  const rowH = 6;
  const rightX = PAGE_W - MR;
  const leftX  = rightX - rowW;

  const subtotal = (invoice.products || []).reduce((s, p: any) => s + (Number(p.sellPrice || p.unitPrice || p.price) || 0) * (Number(p.quantity) || 1), 0);
  const discount = Number((invoice as any).deductionCharges) || 0;
  const afterDisc = Math.max(0, subtotal - discount);
  const shipping  = Number((invoice as any).cargoAmount) || 0;
  const totalDue  = afterDisc + shipping;

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: 'SUBTOTAL',              value: fmt(subtotal) },
    { label: 'DISCOUNT',              value: fmt(discount) },
    { label: 'SUBTOTAL LESS DISCOUNT', value: fmt(afterDisc) },
    { label: shipping > 0 ? 'SHIPPING' : 'Free SHIPPING', value: fmt(shipping) },
  ];

  let cursorY = y;
  stroke(doc, LINE);
  doc.setLineWidth(0.15);
  for (const r of rows) {
    doc.line(leftX, cursorY, rightX, cursorY);
    text(doc, TEXT_D);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(r.label, leftX + labelW - 2, cursorY + 4, { align: 'right' });
    doc.text(r.value, rightX - 2,          cursorY + 4, { align: 'right' });
    cursorY += rowH;
  }
  doc.line(leftX, cursorY, rightX, cursorY);

  // TOTAL row — gold background
  box(doc, leftX, cursorY, rowW, rowH + 2, { fill: GOLD });
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL  ${CURRENCY_CODE}`, leftX + labelW - 2, cursorY + 5, { align: 'right' });
  doc.text(`${CURRENCY_SYMBOL}  ${fmt(totalDue)}`, rightX - 2, cursorY + 5, { align: 'right' });
  cursorY += rowH + 2;

  // In Words row (spans full width)
  const wordsY = cursorY + 3;
  box(doc, ML, wordsY, CONTENT_W, 8, { border: LINE, borderWidth: 0.15 });
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('In Words', ML + 2, wordsY + 5.2);
  doc.setFont('helvetica', 'normal');
  const words = numberToWords(Math.floor(totalDue)) + ` ${CURRENCY_CODE}${totalDue % 1 > 0 ? ' and ' + numberToWords(Math.round((totalDue % 1) * 100)) + ' Fils' : ''}`;
  doc.text(words, ML + 22, wordsY + 5.2);

  return wordsY + 8 + 4;
}

/** Terms & Conditions block on the left + stamp/signature area on the right. */
function renderTermsAndStamp(doc: jsPDF, invoice: Invoice, y: number, stamp: ImageData | null): number {
  const blockH = 32;

  // Left half — terms
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TERMS & CONDITIONS:', ML, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const terms = [
    `Tentative Ship Date: ${formatDateDDMMMYYYY(invoice.date)}`,
    'Ship Via : DHL',
    'Payment Terms 100% in Advance',
    `All Prices listed are in ${CURRENCY_CODE}`,
  ];
  let ly = y + 9;
  for (const t of terms) { doc.text(t, ML, ly); ly += 4.5; }

  // Right half — stamp area (only when the invoice was flagged with
  // digitalStamp=true at creation time). Strict opt-in — undefined or false
  // both skip drawing.
  //
  // The stamp image is circular. Previously we drew it into a fixed 42×28
  // box which stretched the round stamp into an ellipse. Now we read the
  // image's natural dimensions via getImageProperties and scale to fit
  // inside a square bounding box, preserving aspect ratio so a circular
  // stamp renders as an actual circle.
  if (stamp && (invoice as any).digitalStamp === true) {
    try {
      const boxMax = Math.min(blockH - 2, 34);   // square-ish bounding box
      let drawW = boxMax;
      let drawH = boxMax;
      try {
        const props = doc.getImageProperties(stamp.dataUrl);
        const ratio = props.width / props.height;
        if (ratio >= 1) { drawW = boxMax; drawH = boxMax / ratio; }
        else            { drawH = boxMax; drawW = boxMax * ratio; }
      } catch { /* fall through — use the square defaults if we can't read the dims */ }
      // Right-align within the reserved 45mm strip, vertically center in block
      const sX = PAGE_W - MR - drawW;
      const sY = y + (blockH - drawH) / 2;
      doc.addImage(stamp.dataUrl, stamp.format, sX, sY, drawW, drawH);
    } catch { /* stamp failed — no fallback needed */ }
  }

  return y + blockH;
}

/** Beneficiary payment instructions block at the bottom. */
function renderBeneficiary(doc: jsPDF, y: number): number {
  text(doc, TEXT_D);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Beneficiary Payment Instructions:', ML, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const rows = [
    `Company Name: ${BENEFICIARY.companyName}`,
    `Bank Name: ${BENEFICIARY.bankName}`,
    `SWIFT Code: ${BENEFICIARY.swiftCode}`,
    `Account Number: ${BENEFICIARY.accountNumber}`,
    `Routing Code: ${BENEFICIARY.routingCode}`,
    `IBAN: ${BENEFICIARY.iban}`,
    `Bank Branch: ${BENEFICIARY.branch}`,
  ];
  let ly = y + 5;
  for (const r of rows) { doc.text(r, ML, ly); ly += 4.2; }

  return ly + 2;
}

/** Thank You footer bar. */
function renderThankYou(doc: jsPDF, y: number) {
  const h = 6;
  box(doc, 0, y, PAGE_W, h, { fill: BLACK });
  text(doc, { r: 255, g: 255, b: 255 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('THANK YOU', PAGE_W / 2, y + 4.3, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════════════════════════

export async function generateInvoicePdf(invoice: Invoice): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Load product images + stamp in parallel so drawing isn't blocked serially.
  // Skip the stamp fetch entirely when the invoice hasn't opted in — no point
  // hitting the network for an asset we won't draw.
  const products = invoice.products || [];
  const wantsStamp = (invoice as any).digitalStamp === true;
  const [productImages, stampImage] = await Promise.all([
    Promise.all(products.map((p: any) => p.imageUrl ? loadImage(p.imageUrl) : Promise.resolve(null))),
    wantsStamp ? loadImage('/BullionStamp.jpeg') : Promise.resolve(null),
  ]);

  // ── First page ──────────────────────────────────────────────────────────
  let y = renderHeader(doc);
  y = renderTitleRow(doc, invoice, y);
  y = renderSellerInfo(doc, y);
  y = renderBillShipTo(doc, invoice, y);
  y = renderProductsHeader(doc, y);

  for (let i = 0; i < products.length; i++) {
    // Rough end-of-content check — reserve ~90mm for totals + terms + beneficiary + thank-you
    if (y + 26 > PAGE_H - 90) {
      // New page — repeat just the yellow strip + black bar + products header
      renderThankYou(doc, PAGE_H - 7);
      doc.addPage();
      y = renderHeader(doc);
      y = renderProductsHeader(doc, y + 3);
    }
    y = renderProductRow(doc, products[i], y, productImages[i], i);
  }

  // ── Trailing sections on the last page ──────────────────────────────────
  y += 4;
  y = renderTotals(doc, invoice, y);
  y = renderTermsAndStamp(doc, invoice, y, stampImage);
  y += 2;
  renderBeneficiary(doc, y);
  renderThankYou(doc, PAGE_H - 7);

  return doc.output('blob');
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await generateInvoicePdf(invoice);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}