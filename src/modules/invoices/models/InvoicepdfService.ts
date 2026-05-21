// Invoice Module - PDF Generation Service
// Theme: Yellow · Black · Gold (Bullion Electronics brand palette)

import jsPDF from 'jspdf';
import { Invoice } from './types';
import {
  InvoiceCurrency,
  fetchCurrencyRates,
  convertCurrency,
} from './invoiceService';

const logoAsset = '/BullionLogo.jpeg';

const PW = 210,
  PH = 297,
  ML = 14,
  MR = 14,
  CW = PW - ML - MR;

type RGB = [number, number, number];

// ── Brand palette ─────────────────────────────────────────────────────────────
const BLACK: RGB = [17, 17, 17];
const GOLD: RGB = [180, 140, 60];
const GOLD_RICH: RGB = [212, 160, 23];
const YELLOW: RGB = [255, 193, 7];
const YELLOW_BG: RGB = [255, 248, 220];
const WHITE: RGB = [255, 255, 255];
const GRAY: RGB = [110, 110, 110];
const LIGHT_GRAY: RGB = [200, 200, 200];

const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const st = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

const currencyMeta: Record<
  InvoiceCurrency,
  { locale: string; fractionDigits: number; code: string }
> = {
  PKR: { locale: 'en-PK', fractionDigits: 0, code: 'PKR' },
  CAD: { locale: 'en-CA', fractionDigits: 2, code: 'CAD' },
  SAR: { locale: 'en-US', fractionDigits: 2, code: 'SAR' },
  AED: { locale: 'en-AE', fractionDigits: 2, code: 'AED' },
};

function formatCurrency(
  amount: number,
  currency: InvoiceCurrency = 'PKR'
): string {
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
  d
    ? new Date(d).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

interface ImageData {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
}

// ── Image validation ──────────────────────────────────────────────────────────
function isPngValid(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;

  const b = new Uint8Array(buffer);

  return (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  );
}

function isJpegValid(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;

  const b = new Uint8Array(buffer);

  return b[0] === 0xff && b[1] === 0xd8;
}

async function loadImage(src: string): Promise<ImageData | null> {
  if (!src) return null;

  try {
    const resp = await fetch(src, { cache: 'force-cache' });

    if (!resp.ok) return null;

    const blob = await resp.blob();

    if (blob.size === 0) return null;

    const buffer = await blob.arrayBuffer();

    const mime = blob.type.toLowerCase();

    let format: 'PNG' | 'JPEG';

    if (mime.includes('jpeg') || mime.includes('jpg')) {
      if (!isJpegValid(buffer)) return null;

      format = 'JPEG';
    } else {
      if (!isPngValid(buffer)) return null;

      format = 'PNG';
    }

    const dataUrl = await new Promise<string | null>((resolve) => {
      const r = new FileReader();

      r.onload = () => resolve(r.result as string);

      r.onerror = () => resolve(null);

      r.readAsDataURL(blob);
    });

    return dataUrl ? { dataUrl, format } : null;
  } catch {
    return null;
  }
}

// ── Table columns ─────────────────────────────────────────────────────────────
const C = {
  sr: { x: ML, w: 10 },
  pn: { x: ML + 10, w: 55 },
  pd: { x: ML + 65, w: 57 },
  bn: { x: ML + 122, w: 35 },
  am: { x: ML + 157, w: 25 },
} as const;

const ROW_H = 7.5;

function thCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  align: 'left' | 'center' | 'right' = 'left'
) {
  sf(doc, BLACK);

  doc.setLineWidth(0);

  doc.rect(x, y, w, ROW_H, 'F');

  if (x === ML) {
    sf(doc, GOLD);

    doc.rect(x, y, 1.2, ROW_H, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  st(doc, GOLD_RICH);

  const tx =
    align === 'center'
      ? x + w / 2
      : align === 'right'
      ? x + w - 2
      : x + 2.5;

  doc.text(label, tx, y + ROW_H / 2 + 1.5, { align });
}

function tdCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  minH: number,
  lines: string[],
  opts: {
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    fs?: number;
    alt?: boolean;
  } = {}
): number {
  const {
    bold = false,
    align = 'left',
    fs = 8,
    alt = false,
  } = opts;

  const LH = fs * 0.42;
  const PAD = 2;

  const h = Math.max(minH, lines.length * LH + PAD * 2);

  if (alt) {
    sf(doc, YELLOW_BG);

    doc.setLineWidth(0);

    doc.rect(x, y, w, h, 'F');
  }

  sd(doc, GOLD);

  doc.setLineWidth(0.12);

  doc.rect(x, y, w, h, 'S');

  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fs);
  st(doc, BLACK);

  const baseY =
    lines.length === 1
      ? y + h / 2 + LH * 0.35
      : y + PAD + LH;

  lines.forEach((ln, i) => {
    const ty = baseY + i * (LH + 0.5);

    if (align === 'center') {
      doc.text(ln, x + w / 2, ty, { align: 'center' });
    } else if (align === 'right') {
      doc.text(ln, x + w - PAD, ty, { align: 'right' });
    } else {
      doc.text(ln, x + PAD, ty);
    }
  });

  return h;
}

function pb(doc: jsPDF, y: number, need: number): number {
  if (y + need > PH - 18) {
    doc.addPage();

    return 14;
  }

  return y;
}

function goldRule(doc: jsPDF, x: number, y: number, w: number) {
  sd(doc, GOLD);

  doc.setLineWidth(0.5);

  doc.line(x, y, x + w, y);
}

const TERMS = [
  'Bullion Electronics guarantees that this device is a 100% genuine branded product with an official warranty.',
  'We are not responsible for the performance, accuracy, and results of any device as per the claims of the manufacturer.',
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

async function buildPdf(invoice: Invoice): Promise<Blob> {
  const logoImg = await loadImage(logoAsset);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // ── HEADER ─────────────────────────────────────────
  const HEADER_H = 42;

  // Pure black background — no gold top stripe so nothing taints the black
  sf(doc, [0, 0, 0] as RGB);
  doc.setLineWidth(0);
  doc.rect(0, 0, PW, HEADER_H, 'F');

  // Yellow bottom accent stripe only
  sf(doc, YELLOW);
  doc.rect(0, HEADER_H - 1.8, PW, 1.8, 'F');

  // Logo: clean, no border rings
  const LOGO_D = 36;
  const LOGO_R = LOGO_D / 2;
  const LOGO_CX = ML + LOGO_R;
  const LOGO_CY = HEADER_H / 2;
  const LOGO_Y = LOGO_CY - LOGO_R;

  if (logoImg) {
    // Draw the logo image
    doc.addImage(
      logoImg.dataUrl,
      logoImg.format,
      ML,
      LOGO_Y,
      LOGO_D,
      LOGO_D
    );

    // Paint black corner masks over the 4 square corners of the JPEG
    // so the logo appears as a clean circle on the black header — no ring needed
    const cr = LOGO_R * 0.29;
    sf(doc, [0, 0, 0] as RGB);
    doc.setLineWidth(0);
    // top-left
    doc.rect(ML, LOGO_Y, cr, cr, 'F');
    // top-right
    doc.rect(ML + LOGO_D - cr, LOGO_Y, cr, cr, 'F');
    // bottom-left
    doc.rect(ML, LOGO_Y + LOGO_D - cr, cr, cr, 'F');
    // bottom-right
    doc.rect(ML + LOGO_D - cr, LOGO_Y + LOGO_D - cr, cr, cr, 'F');
  }

  const TEXT_X = logoImg ? ML + LOGO_D + 6 : ML;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  st(doc, WHITE);

  doc.text('Bullion Electronics', TEXT_X, HEADER_H / 2 - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  st(doc, GOLD_RICH);

  const branchName = (invoice as any).branch || 'Islamabad';

  doc.text(branchName, TEXT_X, HEADER_H / 2 + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  st(doc, LIGHT_GRAY);

  doc.text('+971 56 985 2213', PW - MR, 13, {
    align: 'right',
  });

  doc.text(
    'C108 Building 936 - M-04, Plot - Mohamed Bin Zayed City - ME9',
    PW - MR,
    19,
    { align: 'right' }
  );

  doc.text(
    'Abu Dhabi, United Arab Emirates',
    PW - MR,
    25,
    { align: 'right' }
  );

  sf(doc, GOLD);

  doc.roundedRect(
    PW - MR - 26,
    HEADER_H - 11,
    26,
    8,
    1,
    1,
    'F'
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  st(doc, BLACK);

  doc.text('INVOICE', PW - MR - 13, HEADER_H - 5.5, {
    align: 'center',
  });

  let y = HEADER_H + 8;

  // ── BILL TO + META ─────────────────────────────────
  const COL_MID = ML + CW / 2 + 4;
  const LEFT_W = COL_MID - ML - 4;
  const RIGHT_W = PW - MR - COL_MID;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  st(doc, GRAY);

  doc.text('BILL TO', ML, y);

  goldRule(doc, ML, y + 1.5, LEFT_W);

  doc.text('INVOICE DETAILS', COL_MID, y);

  goldRule(doc, COL_MID, y + 1.5, RIGHT_W);

  y += 5;

  let lY = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  st(doc, BLACK);

  doc.text(invoice.customerName || '', ML, lY);

  lY += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  st(doc, GRAY);

  const locationStr = [
    invoice.customerCity,
    invoice.customerProvince,
  ]
    .filter(Boolean)
    .join(', ');

  if (locationStr) {
    doc.text(locationStr, ML, lY);

    lY += 4.5;
  }

  if (invoice.customerAddress?.trim()) {
    doc.text(invoice.customerAddress.trim(), ML, lY);

    lY += 4.5;
  }

  const infoRows: [string, string][] = [];

  if (invoice.customerCNIC?.trim()) {
    infoRows.push([
      'Identity:',
      invoice.customerCNIC.trim(),
    ]);
  }

  infoRows.push([
    'Mobile:',
    invoice.customerPhone2
      ? `${invoice.customerPhone} / ${invoice.customerPhone2}`
      : invoice.customerPhone || '',
  ]);

  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    st(doc, BLACK);

    doc.text(label, ML, lY);

    doc.setFont('helvetica', 'normal');
    st(doc, GRAY);

    doc.text(value, ML + 16, lY);

    lY += 4.5;
  });

  const metaRows: [string, string][] = [
    ['Invoice No', invoice.invoiceNumber || ''],
    ['Date', fmtDate(invoice.date)],
    ['Status', invoice.status || 'Unpaid'],
    ['Delivery', invoice.deliveryStatus || ''],
  ];

  let rY = y;

  metaRows.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      sf(doc, YELLOW_BG);

      doc.rect(COL_MID - 1, rY - 3.5, RIGHT_W + 1, 5, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    st(doc, GRAY);

    doc.text(label, COL_MID, rY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    st(doc, BLACK);

    doc.text(value, PW - MR, rY, {
      align: 'right',
    });

    rY += 5.5;
  });

  y = Math.max(lY, rY) + 5;

  // ── PRODUCTS TABLE ─────────────────────────────────
  y = pb(doc, y, ROW_H + 10);

  thCell(doc, C.sr.x, y, C.sr.w, '#', 'center');
  thCell(doc, C.pn.x, y, C.pn.w, 'Product Name');
  thCell(doc, C.pd.x, y, C.pd.w, 'Details');
  thCell(doc, C.bn.x, y, C.bn.w, 'Serial / Batch');
  thCell(doc, C.am.x, y, C.am.w, 'Amount', 'right');

  y += ROW_H;

  const selectedCurrencies =
    Array.isArray((invoice as any).selectedCurrencies) &&
    (invoice as any).selectedCurrencies.length
      ? ((invoice as any)
          .selectedCurrencies as InvoiceCurrency[])
      : ['PKR'];

  const primaryCurrency = selectedCurrencies[0] || 'PKR';

  const rates = await fetchCurrencyRates();

  invoice.products.forEach((p, idx) => {
    const alt = idx % 2 === 1;

    const convertedTotal = convertCurrency(
      p.total,
      'PKR',
      primaryCurrency,
      rates
    );

    const rH = ROW_H;

    y = pb(doc, y, rH);

    tdCell(
      doc,
      C.sr.x,
      y,
      C.sr.w,
      rH,
      [String(idx + 1)],
      {
        align: 'center',
        alt,
      }
    );

    tdCell(
      doc,
      C.pn.x,
      y,
      C.pn.w,
      rH,
      [p.productName || ''],
      {
        bold: true,
        alt,
      }
    );

    tdCell(
      doc,
      C.pd.x,
      y,
      C.pd.w,
      rH,
      [p.description || '—'],
      {
        alt,
      }
    );

    tdCell(
      doc,
      C.bn.x,
      y,
      C.bn.w,
      rH,
      [(p.serialNumbers || []).join(', ') || '—'],
      {
        alt,
      }
    );

    tdCell(
      doc,
      C.am.x,
      y,
      C.am.w,
      rH,
      [formatCurrency(convertedTotal, primaryCurrency)],
      {
        bold: true,
        align: 'right',
        alt,
      }
    );

    y += rH;
  });

  y += 4;

  // ── TOTAL BOX ──────────────────────────────────────
  y = pb(doc, y, 18);

  const TOT_W = 75;
  const TOT_X = PW - MR - TOT_W;

  const totalLines = selectedCurrencies.map((currency) =>
    formatCurrency(
      convertCurrency(
        invoice.totalAmount,
        'PKR',
        currency,
        rates
      ),
      currency
    )
  );

  const totalBoxH = Math.max(
    11,
    totalLines.length * 5.5 + 5
  );

  sd(doc, GOLD);

  doc.rect(
    TOT_X - 0.5,
    y - 0.5,
    TOT_W + 1,
    totalBoxH + 1,
    'S'
  );

  sf(doc, BLACK);

  doc.rect(TOT_X, y, TOT_W, totalBoxH, 'F');

  sf(doc, YELLOW);

  doc.rect(TOT_X, y, 3, totalBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  st(doc, GOLD_RICH);

  doc.text('TOTAL', TOT_X + 6, y + 7);

  st(doc, WHITE);

  doc.text(totalLines, PW - MR - 2, y + 6, {
    align: 'right',
  });

  y += totalBoxH + 5;

  // ── TERMS ──────────────────────────────────────────
  y = pb(doc, y, 18);

  sf(doc, BLACK);

  doc.rect(ML, y - 2, CW, 7.5, 'F');

  sf(doc, GOLD);

  doc.rect(ML, y - 2, 2.5, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  st(doc, GOLD_RICH);

  doc.text('Terms & Conditions', ML + 5, y + 3);

  y += 8;

  const TX = ML + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  st(doc, GRAY);

  for (const term of TERMS) {
    const lines = doc.splitTextToSize(
      term,
      CW - 5
    ) as string[];

    const termH = lines.length * 3 + 2;

    y = pb(doc, y, termH + 1.5);

    sf(doc, GOLD_RICH);

    doc.ellipse(ML + 1.2, y - 0.4, 0.8, 0.8, 'F');

    lines.forEach((ln, i) =>
      doc.text(ln, TX, y + i * 3)
    );

    y += termH;
  }

  y += 5;

  // ── THANK YOU ──────────────────────────────────────
  sf(doc, YELLOW_BG);

  sd(doc, GOLD);

  doc.rect(ML, y - 2, CW, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);

  st(doc, BLACK);

  doc.text(
    'Thank you for your purchase!',
    PW / 2,
    y + 4,
    {
      align: 'center',
    }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  st(doc, GOLD);

  doc.text(
    'We value your trust in Bullion Electronics.',
    PW / 2,
    y + 9.5,
    {
      align: 'center',
    }
  );

  // ── SIGNATURE ──────────────────────────────────────
  const SIG_W = 60;
  const L_SIG_X = ML;
  const SIG_Y = PH - 28;

  sd(doc, GOLD);

  doc.setLineWidth(0.5);

  // LEFT SIGNATURE ONLY
  doc.line(
    L_SIG_X,
    SIG_Y,
    L_SIG_X + SIG_W,
    SIG_Y
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  st(doc, BLACK);

  doc.text(
    'Authorized Signature',
    L_SIG_X + SIG_W / 2,
    SIG_Y + 4.5,
    {
      align: 'center',
    }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  st(doc, GRAY);

  doc.text(
    'Bullion Electronics',
    L_SIG_X + SIG_W / 2,
    SIG_Y + 8.5,
    {
      align: 'center',
    }
  );

  // ── FOOTER ─────────────────────────────────────────
  sf(doc, GOLD);

  doc.rect(0, PH - 13, PW, 0.8, 'F');

  sf(doc, BLACK);

  doc.rect(0, PH - 12.2, PW, 12.2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  st(doc, LIGHT_GRAY);

  doc.text(
    'Bullion Electronics  ·  C108 Building 936 M-04, Plot- Mohammed Bin Zayed City, ME9, Abu Dhabi, United Arab Emirates  ·  +971 56 985 2213',
    PW / 2,
    PH - 4.5,
    {
      align: 'center',
    }
  );

  return doc.output('blob');
}

export async function generateInvoicePdf(
  invoice: Invoice
): Promise<Blob> {
  return buildPdf(invoice);
}

export async function downloadInvoicePdf(
  invoice: Invoice
): Promise<void> {
  const blob = await buildPdf(invoice);

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;

  a.download = `${
    invoice.invoiceNumber || 'invoice'
  }.pdf`;

  a.style.display = 'none';

  document.body.appendChild(a);

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => resolve())
  );

  a.click();

  setTimeout(() => {
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, 5000);
}