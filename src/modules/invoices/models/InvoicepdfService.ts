// Invoice Module - PDF Generation Service
// Theme: Yellow · Black · Gold (Bullion Electronics brand palette)
//
// CHANGES:
//   1. Full yellow/black/gold theme — header, table headers, total box, footer.
//   2. Warranty location removed from BILL TO section (field still stored internally).
//   3. loadImage() validates PNG/JPEG magic bytes — corrupt/missing assets silently skipped.
//   4. Deduction charges NOT shown on customer PDF (internal only).
//   5. Tight layout so a typical single-product invoice fits on one A4 page.

import jsPDF from 'jspdf';
import { Invoice } from './types';
import { InvoiceCurrency, fetchCurrencyRates, convertCurrency, CURRENCY_RATE_FALLBACK } from './invoiceService';

const logoAsset = '/PDT-logo.png';

const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;

type RGB = [number, number, number];

// ── Brand palette ─────────────────────────────────────────────────────────────
const BLACK:      RGB = [17,  17,  17];   // near-black body
const GOLD:       RGB = [180, 140, 60];   // muted gold for accents & rules
const GOLD_RICH:  RGB = [212, 160, 23];   // vivid gold for header text
const YELLOW:     RGB = [255, 193, 7];    // bright yellow highlights
const YELLOW_BG:  RGB = [255, 248, 220];  // pale yellow alt-row
const WHITE:      RGB = [255, 255, 255];
const GRAY:       RGB = [110, 110, 110];
const LIGHT_GRAY: RGB = [200, 200, 200];

const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const st = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

const currencyMeta: Record<InvoiceCurrency, { locale: string; fractionDigits: number; code: string }> = {
  PKR: { locale: 'en-PK', fractionDigits: 0, code: 'PKR' },
  CAD: { locale: 'en-CA', fractionDigits: 2, code: 'CAD' },
  SAR: { locale: 'en-US', fractionDigits: 2, code: 'SAR' },
  AED: { locale: 'en-AE', fractionDigits: 2, code: 'AED' },
};

function formatCurrency(amount: number, currency: InvoiceCurrency = 'PKR'): string {
  const meta = currencyMeta[currency] ?? currencyMeta.PKR;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.fractionDigits,
      maximumFractionDigits: meta.fractionDigits,
    }).format(amount);
  } catch {
    return `${meta.code} ${amount.toFixed(meta.fractionDigits)}`;
  }
}

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

interface ImageData { dataUrl: string; format: 'PNG' | 'JPEG' }

// ── Image validation ──────────────────────────────────────────────────────────
function isPngValid(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const b = new Uint8Array(buffer);
  return b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47 &&
         b[4]===0x0D && b[5]===0x0A && b[6]===0x1A && b[7]===0x0A;
}

function isJpegValid(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const b = new Uint8Array(buffer);
  return b[0] === 0xFF && b[1] === 0xD8;
}

async function loadImage(src: string): Promise<ImageData | null> {
  if (!src) return null;
  try {
    const resp = await fetch(src, { cache: 'force-cache' });
    if (!resp.ok) { console.warn(`[InvoicePdf] HTTP ${resp.status}: ${src}`); return null; }
    const blob = await resp.blob();
    if (blob.size === 0) { console.warn(`[InvoicePdf] Empty blob: ${src}`); return null; }
    const buffer = await blob.arrayBuffer();
    const mime = blob.type.toLowerCase();
    let format: 'PNG' | 'JPEG';
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      if (!isJpegValid(buffer)) { console.warn(`[InvoicePdf] Corrupt JPEG: ${src}`); return null; }
      format = 'JPEG';
    } else {
      if (!isPngValid(buffer)) { console.warn(`[InvoicePdf] Corrupt PNG: ${src}`); return null; }
      format = 'PNG';
    }
    const dataUrl = await new Promise<string | null>(resolve => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result as string);
      r.onerror = () => { console.warn(`[InvoicePdf] FileReader failed: ${src}`); resolve(null); };
      r.readAsDataURL(blob);
    });
    return dataUrl ? { dataUrl, format } : null;
  } catch (err) {
    console.warn(`[InvoicePdf] loadImage error "${src}":`, err);
    return null;
  }
}

// ── Table columns ─────────────────────────────────────────────────────────────
// Sr=10 | ProductName=55 | Detail=57 | Serial=35 | Amount=25
const C = {
  sr: { x: ML,       w: 10 },
  pn: { x: ML + 10,  w: 55 },
  pd: { x: ML + 65,  w: 57 },
  bn: { x: ML + 122, w: 35 },
  am: { x: ML + 157, w: 25 },
} as const;

const ROW_H = 7.5;

// Table header cell — black background with gold text
function thCell(doc: jsPDF, x: number, y: number, w: number, label: string, align: 'left'|'center'|'right' = 'left') {
  sf(doc, BLACK); doc.setLineWidth(0); doc.rect(x, y, w, ROW_H, 'F');
  // Gold left border accent on first col
  if (x === ML) { sf(doc, GOLD); doc.rect(x, y, 1.2, ROW_H, 'F'); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(doc, GOLD_RICH);
  const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 2 : x + 2.5;
  doc.text(label, tx, y + ROW_H / 2 + 1.5, { align });
}

// Table data cell — alternates pale-yellow / white
function tdCell(
  doc: jsPDF, x: number, y: number, w: number, minH: number,
  lines: string[], opts: { bold?: boolean; align?: 'left'|'center'|'right'; fs?: number; alt?: boolean } = {}
): number {
  const { bold = false, align = 'left', fs = 8, alt = false } = opts;
  const LH = fs * 0.42, PAD = 2;
  const h  = Math.max(minH, lines.length * LH + PAD * 2);
  if (alt) { sf(doc, YELLOW_BG); doc.setLineWidth(0); doc.rect(x, y, w, h, 'F'); }
  sd(doc, GOLD); doc.setLineWidth(0.12); doc.rect(x, y, w, h, 'S');
  doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(fs); st(doc, BLACK);
  const baseY = lines.length === 1 ? y + h / 2 + LH * 0.35 : y + PAD + LH;
  lines.forEach((ln, i) => {
    const ty = baseY + i * (LH + 0.5);
    if (align === 'center') doc.text(ln, x + w / 2, ty, { align: 'center' });
    else if (align === 'right') doc.text(ln, x + w - PAD, ty, { align: 'right' });
    else doc.text(ln, x + PAD, ty);
  });
  return h;
}

/** Add a new page only if truly needed; returns updated y. */
function pb(doc: jsPDF, y: number, need: number): number {
  if (y + need > PH - 18) { doc.addPage(); return 14; }
  return y;
}

// Gold horizontal rule
function goldRule(doc: jsPDF, x: number, y: number, w: number) {
  sd(doc, GOLD); doc.setLineWidth(0.5); doc.line(x, y, x + w, y);
}

// Thin yellow rule (lighter accent)
function yellowRule(doc: jsPDF, x: number, y: number, w: number) {
  sd(doc, YELLOW); doc.setLineWidth(0.25); doc.line(x, y, x + w, y);
}

const TERMS = [
  'Bullion Electronics guarantees that this device is a 100% genuine branded product with an official warranty.',
  'We are not responsible for the performance, accuracy, and results of any device as per the claims of the manufacturer.',
  'Customer hereby agrees that the above-purchased product is non-returnable, neither exchangeable nor refundable.',
  'Customer hereby acknowledges that all accessories and parts of the device are complete and the device is in working condition.',
  'The company is not responsible for field testing of the machine.',
  'Customers can watch/visit our YouTube Channel for machine training and air testing before purchasing the machine.',
  'Machines work well on old/buried objects.',
  'Company is exclusively responsible for providing after-sales services to customers who have purchased machines from us.',
  "For warranty claims, the client must present the original purchaser's CNIC and a copy of this invoice.",
  'Warranty claims take approximately 90 working days to process.',
  'The Company shall not be held responsible for any illegal activities undertaken by clients.',
  'Clients are strictly prohibited from excavating on legally restricted properties; the Company disclaims any responsibility for such actions.',
];

const STAMP_W = 45, STAMP_H = 23;

async function buildPdf(invoice: Invoice): Promise<Blob> {
  const [logoImg, stampImg] = await Promise.all([
    loadImage(logoAsset),
    invoice.digitalStamp
      ? Promise.resolve(null as ImageData | null)
      : Promise.resolve(null as ImageData | null),
  ]);

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // ── 1. HEADER BAR ─────────────────────────────────────────────────
  // Main black header band
  const HEADER_H = 36;
  sf(doc, BLACK); doc.setLineWidth(0); doc.rect(0, 0, PW, HEADER_H, 'F');

  // Gold top accent stripe
  sf(doc, GOLD); doc.rect(0, 0, PW, 2, 'F');

  // Yellow bottom accent stripe
  sf(doc, YELLOW); doc.rect(0, HEADER_H - 1.5, PW, 1.5, 'F');

  // Logo
  const LOGO_SIZE = 22, LOGO_Y = (HEADER_H - LOGO_SIZE) / 2;
  if (logoImg) {
    try { doc.addImage(logoImg.dataUrl, logoImg.format, ML, LOGO_Y, LOGO_SIZE, LOGO_SIZE); }
    catch (e) { console.warn('[InvoicePdf] Logo add failed:', e); }
  }

  // Company name & branch
  const TEXT_X = logoImg ? ML + LOGO_SIZE + 5 : ML;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); st(doc, WHITE);
  doc.text('Bullion Electronics', TEXT_X, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(doc, GOLD_RICH);
  const branchName = (invoice as any).branch || 'Islamabad';
  doc.text(branchName, TEXT_X, 20);

  // Right-side contact info
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); st(doc, LIGHT_GRAY);
  doc.text('+971 56 985 2213', PW - MR, 12, { align: 'right' });
  doc.text('C108 Building 936 - M-04, Plot - Mohamed Bin Zayed City - ME9', PW - MR, 17.5, { align: 'right' });
  doc.text('Abu Dhabi, United Arab Emirates', PW - MR, 23, { align: 'right' });

  // "INVOICE" badge
  sf(doc, GOLD); doc.setLineWidth(0); doc.roundedRect(PW - MR - 26, HEADER_H - 10, 26, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, BLACK);
  doc.text('INVOICE', PW - MR - 13, HEADER_H - 4.5, { align: 'center' });

  let y = HEADER_H + 8;

  // ── 2. CUSTOMER (left) + INVOICE META (right) ──────────────────────
  const COL_MID = ML + CW / 2 + 4;
  const LEFT_W  = COL_MID - ML - 4;
  const RIGHT_W = PW - MR - COL_MID;

  // Section headings with gold-underline
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); st(doc, GRAY);
  doc.text('BILL TO', ML, y);
  goldRule(doc, ML, y + 1.5, LEFT_W);
  doc.text('INVOICE DETAILS', COL_MID, y);
  goldRule(doc, COL_MID, y + 1.5, RIGHT_W);
  y += 5;

  let lY = y;

  // Customer name
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); st(doc, BLACK);
  doc.text(invoice.customerName || '', ML, lY); lY += 5.5;

  // Location & address
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(doc, GRAY);
  const locationStr = [invoice.customerCity, invoice.customerProvince].filter(Boolean).join(', ');
  if (locationStr) { doc.text(locationStr, ML, lY); lY += 4.5; }
  if (invoice.customerAddress?.trim()) { doc.text(invoice.customerAddress.trim(), ML, lY); lY += 4.5; }

  // CNIC / Identity Number & Mobile — warranty location intentionally omitted
  const infoRows: [string, string, number][] = [];
  if (invoice.customerCNIC?.trim()) infoRows.push(['Identity:', invoice.customerCNIC.trim(), 16]);
  infoRows.push(['Mobile:', invoice.customerPhone2
    ? `${invoice.customerPhone} / ${invoice.customerPhone2}`
    : (invoice.customerPhone || ''), 16]);

  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, BLACK);
    doc.text(label, ML, lY);
    doc.setFont('helvetica', 'normal'); st(doc, GRAY);
    doc.text(value, ML + 16, lY); lY += 4.5;
  });

  // Right column — invoice meta with alternating yellow highlight rows
  const metaRows: [string, string][] = [
    ['Invoice No', invoice.invoiceNumber || ''],
    ['Date',       fmtDate(invoice.date)],
    ['Status',     invoice.status || 'Unpaid'],
    ['Delivery',   invoice.deliveryStatus || ''],
  ];

  let rY = y;
  metaRows.forEach(([label, value], idx) => {
    // Alternating row highlight
    if (idx % 2 === 0) {
      sf(doc, YELLOW_BG);
      doc.setLineWidth(0);
      doc.rect(COL_MID - 1, rY - 3.5, RIGHT_W + 1, 5, 'F');
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(doc, GRAY);
    doc.text(label, COL_MID, rY);
    const isUnpaid = label === 'Status' && invoice.status === 'Unpaid';
    doc.setFont('helvetica', label === 'Invoice No' ? 'bold' : 'normal');
    doc.setFontSize(8);
    st(doc, isUnpaid ? [200, 40, 40] as RGB : BLACK);
    doc.text(value, PW - MR, rY, { align: 'right' });
    rY += 5.5;
  });

  y = Math.max(lY, rY) + 5;

  // ── 3. PRODUCTS TABLE ──────────────────────────────────────────────
  y = pb(doc, y, ROW_H + 10);
  thCell(doc, C.sr.x, y, C.sr.w, '#',             'center');
  thCell(doc, C.pn.x, y, C.pn.w, 'Product Name',  'left');
  thCell(doc, C.pd.x, y, C.pd.w, 'Details',        'left');
  thCell(doc, C.bn.x, y, C.bn.w, 'Serial / Batch', 'left');
  thCell(doc, C.am.x, y, C.am.w, 'Amount',         'right');
  y += ROW_H;

  const selectedCurrencies = Array.isArray((invoice as any).selectedCurrencies) && (invoice as any).selectedCurrencies.length
    ? (invoice as any).selectedCurrencies as InvoiceCurrency[]
    : ['PKR'];
  const primaryCurrency = selectedCurrencies[0] || 'PKR';
  const rates = await fetchCurrencyRates();

  invoice.products.forEach((p, idx) => {
    const serials   = (p.serialNumbers || []).filter(s => s.trim() !== '');
    const alt       = idx % 2 === 1;
    const pnLines   = doc.splitTextToSize(p.productName || '', C.pn.w - 4) as string[];
    const detailRaw = p.description?.trim()
      || [p.brandName, p.modelName, p.category].filter(Boolean).join(' · ')
      || '';
    const pdLines   = detailRaw ? doc.splitTextToSize(detailRaw, C.pd.w - 4) as string[] : ['—'];
    const bnLines   = serials.length > 0
      ? doc.splitTextToSize(serials.join('\n'), C.bn.w - 4) as string[]
      : ['—'];
    const LH_MM     = 8 * 0.42;
    const maxLn     = Math.max(1, pnLines.length, pdLines.length, bnLines.length);
    const rH        = Math.max(ROW_H, maxLn * LH_MM + 4);
    const convertedTotal = convertCurrency(p.total, 'PKR', primaryCurrency, rates);

    y = pb(doc, y, rH);
    tdCell(doc, C.sr.x, y, C.sr.w, rH, [String(idx + 1)],                           { align: 'center', alt });
    tdCell(doc, C.pn.x, y, C.pn.w, rH, pnLines,                                      { bold: true, alt });
    tdCell(doc, C.pd.x, y, C.pd.w, rH, pdLines,                                      { alt });
    tdCell(doc, C.bn.x, y, C.bn.w, rH, bnLines,                                      { fs: 7, alt });
    tdCell(doc, C.am.x, y, C.am.w, rH, [formatCurrency(convertedTotal, primaryCurrency)], { bold: true, align: 'right', alt });
    y += rH;
  });

  y += 4;

  // ── 4. TOTAL BOX ──────────────────────────────────────────────────
  y = pb(doc, y, 18);
  const TOT_W = 75, TOT_X = PW - MR - TOT_W;

  const totalLines = selectedCurrencies.map(currency =>
    formatCurrency(convertCurrency(invoice.totalAmount, 'PKR', currency, rates), currency)
  );
  const totalBoxH = Math.max(11, totalLines.length * 5.5 + 5);

  // Gold outer border box
  sd(doc, GOLD); doc.setLineWidth(0.6); doc.rect(TOT_X - 0.5, y - 0.5, TOT_W + 1, totalBoxH + 1, 'S');

  // Black fill
  sf(doc, BLACK); doc.setLineWidth(0); doc.rect(TOT_X, y, TOT_W, totalBoxH, 'F');

  // Yellow left accent bar
  sf(doc, YELLOW); doc.rect(TOT_X, y, 3, totalBoxH, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, GOLD_RICH);
  doc.text('TOTAL', TOT_X + 6, y + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(doc, WHITE);
  doc.text(totalLines, PW - MR - 2, y + 6, { align: 'right' });
  y += totalBoxH + 5;

  // ── 5. EXCHANGE NOTE ──────────────────────────────────────────────
  if (invoice.exchangeWarrantyNote?.trim()) {
    y = pb(doc, y, 12);
    // Pale yellow note box
    sf(doc, YELLOW_BG); sd(doc, GOLD); doc.setLineWidth(0.2);
    const nLines = doc.splitTextToSize(invoice.exchangeWarrantyNote, CW - 22) as string[];
    const noteH  = nLines.length * 4.5 + 6;
    doc.rect(ML, y - 2, CW, noteH, 'FD');
    // Gold left accent bar
    sf(doc, GOLD); doc.rect(ML, y - 2, 2, noteH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, BLACK);
    doc.text('Note:', ML + 4.5, y + 2);
    doc.setFont('helvetica', 'normal'); st(doc, GRAY);
    doc.text(nLines, ML + 14, y + 2); y += noteH + 3;
  }

  y += 2;

  // ── 6. TERMS & CONDITIONS ─────────────────────────────────────────
  y = pb(doc, y, 18);
  // Section heading bar
  sf(doc, BLACK); doc.rect(ML, y - 2, CW, 7.5, 'F');
  sf(doc, GOLD);  doc.rect(ML, y - 2, 2.5, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(doc, GOLD_RICH);
  doc.text('Terms & Conditions', ML + 5, y + 3);
  y += 8;

  const TX = ML + 5, TW = CW - 5, BFS = 6.8, BLH = BFS * 0.38;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BFS); st(doc, GRAY);

  for (const term of TERMS) {
    const lines = doc.splitTextToSize(term, TW) as string[];
    const termH = lines.length * BLH + (lines.length - 1) * 0.2 + 1.8;
    y = pb(doc, y, termH + 1.5);
    // Gold bullet dot
    sf(doc, GOLD_RICH); sd(doc, GOLD_RICH); doc.setLineWidth(0.01);
    doc.ellipse(ML + 1.2, y - 0.4, 0.8, 0.8, 'F');
    lines.forEach((ln, i) => doc.text(ln, TX, y + i * (BLH + 0.3)));
    y += termH;
  }

  y += 5;

  // ── 7. THANK YOU + STAMP ──────────────────────────────────────────
  const stampReserve   = stampImg ? STAMP_H + 3 : 0;
  const bottomReserve  = 10 + stampReserve + 20 + 14;
  y = pb(doc, y, bottomReserve);

  // Thank you banner
  sf(doc, YELLOW_BG); sd(doc, GOLD); doc.setLineWidth(0.2);
  doc.rect(ML, y - 2, CW, 14, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); st(doc, BLACK);
  doc.text('Thank you for your purchase!', PW / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(doc, GOLD);
  doc.text('We value your trust in Bullion Electronics.', PW / 2, y + 9.5, { align: 'center' });
  y += 17;

  // ── 8. DIGITAL STAMP ──────────────────────────────────────────────
  if (stampImg) {
    try { doc.addImage(stampImg.dataUrl, stampImg.format, ML, y, STAMP_W, STAMP_H); }
    catch (e) { console.warn('[InvoicePdf] Stamp add failed:', e); }
    y += STAMP_H + 2;
  }

  // ── 9. SIGNATURE LINES ────────────────────────────────────────────
  const SIG_W = 60, L_SIG_X = ML, R_SIG_X = PW - MR - SIG_W;
  const SIG_Y = PH - 28;
  sd(doc, GOLD); doc.setLineWidth(0.5);
  doc.line(L_SIG_X, SIG_Y, L_SIG_X + SIG_W, SIG_Y);
  doc.line(R_SIG_X, SIG_Y, R_SIG_X + SIG_W, SIG_Y);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); st(doc, BLACK);
  doc.text('Authorized Signature', L_SIG_X + SIG_W / 2, SIG_Y + 4.5, { align: 'center' });
  doc.text('Customer Signature',   R_SIG_X + SIG_W / 2, SIG_Y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); st(doc, GRAY);
  doc.text('Bullion Electronics', L_SIG_X + SIG_W / 2, SIG_Y + 8.5, { align: 'center' });

  // ── 10. FOOTER BAR ────────────────────────────────────────────────
  // Gold top line
  sf(doc, GOLD); doc.setLineWidth(0); doc.rect(0, PH - 13, PW, 0.8, 'F');
  // Black footer band
  sf(doc, BLACK); doc.rect(0, PH - 12.2, PW, 12.2, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); st(doc, LIGHT_GRAY);
  doc.text(
    'Bullion Electronics  ·  C108 Building 936 M-04, Plot- Mohammed Bin Zayed City, ME9, Abu Dhabi, United Arab Emirates  ·  +971 56 985 2213',
    PW / 2, PH - 4.5, { align: 'center' }
  );

  return doc.output('blob');
}

export async function generateInvoicePdf(invoice: Invoice): Promise<Blob> {
  return buildPdf(invoice);
}

/**
 * downloadInvoicePdf — generates and triggers a browser download.
 */
export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await buildPdf(invoice);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  a.style.display = 'none';
  document.body.appendChild(a);

  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}