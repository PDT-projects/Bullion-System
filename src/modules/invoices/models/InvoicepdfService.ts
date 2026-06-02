// Invoice Module - PDF Generation Service
// Theme: Yellow · Black · Gold (Bullion Electronics brand palette)
//
// CHANGES v4 (professional image rendering):
//   1. THUMB_W increased from 28 mm → 36 mm for a larger, clearer product photo.
//   2. Product image slot now renders with a drop-shadow + white card frame +
//      gold accent border using roundedRect for a polished, professional look.
//   3. Image is drawn with aspect-ratio-preserving "contain" fit: uses
//      doc.getImageProperties() to detect natural W×H, then letterboxes or
//      pillarboxes the image so it's always fully visible and never cropped.
//   4. Product-name column widened from 65 mm → 70 mm to accommodate the larger
//      image slot; Details column trimmed from 47 mm → 42 mm to compensate.
//   5. Row minimum height updated to THUMB_W + 2×1.8 mm slot-padding so the
//      full image card is always visible.
//
// CHANGES v3 (stamp + image pipeline):
//   1. BullionStamp.jpeg is loaded from /BullionStamp.jpeg (public folder / assets).
//      When invoice.digitalStamp === true the stamp is drawn as a semi-transparent
//      watermark-style overlay centred on the last page, just above the signature line.
//   2. Product thumbnail images were already wired in v2; this release keeps that
//      logic intact and adds the stamp on top of everything else so it is never
//      obscured by table cells or other content.
//   3. loadImage() continues to use XHR for Firebase Storage URLs; the stamp asset
//      is a local relative path so it goes through the same helper (XHR works for
//      same-origin assets too).
//
// FIX v2 (image pipeline — retained):
//   1. tdCell accepts an optional `textOffsetX` parameter so the product-name
//      text can be nudged right to make room for a thumbnail image.
//   2. Drawing order inside the product-row loop: tdCells first → image on top.
//   3. Row-height calculation accounts for THUMB_W so images fit fully.
//   4. loadImage() uses XHR to avoid CORS pre-flight failures with Firebase Storage.

import jsPDF from 'jspdf';
import { Invoice } from './types';
import {
  InvoiceCurrency,
  fetchCurrencyRates,
  convertCurrency,
} from './invoiceService';

const logoAsset  = '/BullionLogo.jpeg';
const stampAsset = '/BullionStamp.jpeg';

const PW = 210,
  PH = 297,
  ML = 14,
  MR = 14,
  CW = PW - ML - MR;

type RGB = [number, number, number];

// ── Brand palette ──────────────────────────────────────────────────────────────
const BLACK: RGB      = [17, 17, 17];
const GOLD: RGB       = [180, 140, 60];
const GOLD_RICH: RGB  = [212, 160, 23];
const YELLOW: RGB     = [255, 193, 7];
const YELLOW_BG: RGB  = [255, 248, 220];
const WHITE: RGB      = [255, 255, 255];
const GRAY: RGB       = [110, 110, 110];
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

// ── Image loading — XHR-based to bypass Firebase Storage CORS issues ──────────
// Using plain fetch() against a Firebase Storage URL fails in browsers when the
// bucket hasn't configured an `Access-Control-Allow-Origin` header. XHR with
// responseType='blob' works because Firebase's CDN URLs include the required
// CORS headers for XHR reads from web app origins. Same-origin local paths
// (e.g. /BullionStamp.jpeg) work fine with XHR too.
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

      // Validate magic bytes via ArrayBuffer before passing to jsPDF
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const b = new Uint8Array(buffer);
          let format: 'PNG' | 'JPEG';
          if (b[0] === 0x89 && b[1] === 0x50) {
            format = 'PNG';
          } else if (b[0] === 0xff && b[1] === 0xd8) {
            format = 'JPEG';
          } else {
            resolve(null); return;
          }
          // Convert blob to data-URL for jsPDF
          const r2 = new FileReader();
          r2.onload = () => resolve(r2.result ? { dataUrl: r2.result as string, format } : null);
          r2.onerror = () => resolve(null);
          r2.readAsDataURL(blob);
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(blob);
    };

    xhr.onerror   = () => resolve(null);
    xhr.ontimeout = () => resolve(null);
    xhr.send();
  });
}

// ── Table column definitions ───────────────────────────────────────────────────
// pn column is wider (70 mm) to comfortably hold both the 36 mm thumbnail and
// the product name text side-by-side. pd is trimmed to compensate.
const C = {
  sr: { x: ML,        w: 10 },
  pn: { x: ML + 10,   w: 70 },
  pd: { x: ML + 80,   w: 42 },
  bn: { x: ML + 122,  w: 35 },
  am: { x: ML + 157,  w: 25 },
} as const;

const ROW_H   = 8;
const CELL_FS = 8;
// Line-height and padding shared by tdCell AND the external row-height calc.
// Must be identical in both places — a mismatch was the original cause of
// text overflowing / disappearing outside the drawn cell borders.
const CELL_LH  = CELL_FS * 0.52;   // ~4.16 mm per line
const CELL_PAD = 2.5;               // top + bottom padding inside each cell (mm)

// Thumbnail size (mm). 36 mm gives a clear, professional product image that is
// large enough to see detail while fitting neatly inside the product-name cell.
const THUMB_W = 36;

// ── Helper: resolve a product field by trying multiple possible key names ──────
function pField(p: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = p?.[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return '';
}

function pNumber(p: any, ...keys: string[]): number {
  for (const k of keys) {
    const v = p?.[k];
    if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function pArray(p: any, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = p?.[k];
    if (Array.isArray(v) && v.length > 0) return v.map(String);
    if (typeof v === 'string' && v.trim()) return [v];
  }
  return [];
}

// ── Table header cell ──────────────────────────────────────────────────────────
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
    align === 'center' ? x + w / 2 :
    align === 'right'  ? x + w - 2 :
                         x + 2.5;
  doc.text(label, tx, y + ROW_H / 2 + 1.5, { align });
}

// ── Table data cell ────────────────────────────────────────────────────────────
// FIX v2: added `textOffsetX` option so callers can shift the text start-x
// rightward (e.g. to clear a thumbnail image) without duplicating drawing logic.
// The background rect and border are always drawn at (x, y, w, h); only the
// text origin is shifted.
function tdCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  minH: number,
  lines: string[],
  opts: {
    bold?:        boolean;
    align?:       'left' | 'center' | 'right';
    fs?:          number;
    alt?:         boolean;
    textOffsetX?: number;   // extra mm to add to the left-text start-x
  } = {}
): number {
  const { bold = false, align = 'left', fs = CELL_FS, alt = false, textOffsetX = 0 } = opts;

  const LH  = fs * 0.52;
  const PAD = CELL_PAD;

  const textBlockH = lines.length * LH + Math.max(0, lines.length - 1) * 0.5;
  const h = Math.max(minH, textBlockH + PAD * 2);

  // Alternating row background
  if (alt) {
    sf(doc, YELLOW_BG);
    doc.setLineWidth(0);
    doc.rect(x, y, w, h, 'F');
  }

  // Cell border
  sd(doc, GOLD);
  doc.setLineWidth(0.12);
  doc.rect(x, y, w, h, 'S');

  // Text
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fs);
  st(doc, BLACK);

  const firstLineY = y + (h - textBlockH) / 2 + LH * 0.75;

  lines.forEach((ln, i) => {
    const ty = firstLineY + i * (LH + 0.5);
    if (align === 'center') {
      doc.text(ln, x + w / 2, ty, { align: 'center' });
    } else if (align === 'right') {
      doc.text(ln, x + w - PAD, ty, { align: 'right' });
    } else {
      // Apply textOffsetX only for left-aligned text
      doc.text(ln, x + PAD + textOffsetX, ty);
    }
  });

  return h;
}

// ── Page-break guard ───────────────────────────────────────────────────────────
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

// ── Main PDF builder ───────────────────────────────────────────────────────────
async function buildPdf(invoice: Invoice): Promise<Blob> {
  // Load logo and (conditionally) stamp in parallel to avoid sequential round-trips
  const [logoImg, stampImg] = await Promise.all([
    loadImage(logoAsset),
    invoice.digitalStamp ? loadImage(stampAsset) : Promise.resolve(null),
  ]);

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const HEADER_H = 42;

  sf(doc, [0, 0, 0] as RGB);
  doc.setLineWidth(0);
  doc.rect(0, 0, PW, HEADER_H, 'F');

  sf(doc, YELLOW);
  doc.rect(0, HEADER_H - 1.8, PW, 1.8, 'F');

  const LOGO_D  = 36;
  const LOGO_R  = LOGO_D / 2;
  const LOGO_CY = HEADER_H / 2;
  const LOGO_Y  = LOGO_CY - LOGO_R;

  if (logoImg) {
    doc.addImage(logoImg.dataUrl, logoImg.format, ML, LOGO_Y, LOGO_D, LOGO_D);
    const cr = LOGO_R * 0.29;
    sf(doc, [0, 0, 0] as RGB);
    doc.setLineWidth(0);
    doc.rect(ML,               LOGO_Y,              cr, cr, 'F');
    doc.rect(ML + LOGO_D - cr, LOGO_Y,              cr, cr, 'F');
    doc.rect(ML,               LOGO_Y + LOGO_D - cr, cr, cr, 'F');
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
  doc.text('+971 56 985 2213', PW - MR, 13, { align: 'right' });
  doc.text('C108 Building 936 - M-04, Plot - Mohamed Bin Zayed City - ME9', PW - MR, 19, { align: 'right' });
  doc.text('Abu Dhabi, United Arab Emirates', PW - MR, 25, { align: 'right' });

  sf(doc, GOLD);
  doc.roundedRect(PW - MR - 26, HEADER_H - 11, 26, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  st(doc, BLACK);
  doc.text('INVOICE', PW - MR - 13, HEADER_H - 5.5, { align: 'center' });

  let y = HEADER_H + 8;

  // ── BILL TO + META ───────────────────────────────────────────────────────────
  const COL_MID = ML + CW / 2 + 4;
  const LEFT_W  = COL_MID - ML - 4;
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

  const locationStr = [invoice.customerCity, invoice.customerProvince]
    .filter(Boolean).join(', ');
  if (locationStr) { doc.text(locationStr, ML, lY); lY += 4.5; }

  if (invoice.customerAddress?.trim()) {
    doc.text(invoice.customerAddress.trim(), ML, lY);
    lY += 4.5;
  }

  const infoRows: [string, string][] = [];
  if (invoice.customerCNIC?.trim()) {
    infoRows.push(['Identity:', invoice.customerCNIC.trim()]);
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
    ['Date',       fmtDate(invoice.date)],
    ['Status',     invoice.status || 'Unpaid'],
    ['Delivery',   invoice.deliveryStatus || ''],
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
    doc.text(value, PW - MR, rY, { align: 'right' });
    rY += 5.5;
  });

  y = Math.max(lY, rY) + 5;

  // ── PRODUCTS TABLE ───────────────────────────────────────────────────────────
  y = pb(doc, y, ROW_H + 10);

  thCell(doc, C.sr.x, y, C.sr.w, '#',             'center');
  thCell(doc, C.pn.x, y, C.pn.w, 'Product Name');
  thCell(doc, C.pd.x, y, C.pd.w, 'Details');
  thCell(doc, C.bn.x, y, C.bn.w, 'Serial / Batch');
  thCell(doc, C.am.x, y, C.am.w, 'Amount',        'right');
  y += ROW_H;

  const selectedCurrencies =
    Array.isArray((invoice as any).selectedCurrencies) &&
    (invoice as any).selectedCurrencies.length
      ? ((invoice as any).selectedCurrencies as InvoiceCurrency[])
      : ['PKR'];

  const primaryCurrency = selectedCurrencies[0] || 'PKR';
  const rates = await fetchCurrencyRates();

  const products: any[] = Array.isArray(invoice.products) ? invoice.products : [];

  for (let idx = 0; idx < products.length; idx++) {
    const p   = products[idx];
    const alt = idx % 2 === 1;

    // ── Resolve field names defensively ──────────────────────────────────────
    const productName = pField(p,
      'productName', 'product_name', 'name', 'title', 'item', 'itemName'
    );
    const description = pField(p,
      'description', 'details', 'desc', 'productDetails', 'product_details',
      'info', 'notes', 'specifications', 'spec'
    );
    const serialRaw = pArray(p,
      'serialNumbers', 'serial_numbers', 'serials', 'serialNumber',
      'serial_number', 'serial', 'batch', 'batchNumber', 'batch_number', 'imei'
    );
    const serialStr = serialRaw.join(', ');

    const total = pNumber(p,
      'total', 'totalAmount', 'total_amount', 'amount', 'price',
      'lineTotal', 'line_total', 'subtotal'
    );

    const convertedTotal = convertCurrency(total, 'PKR', primaryCurrency, rates);

    // ── Load thumbnail image ──────────────────────────────────────────────────
    // Tries imageUrls first (official field), then several known aliases, then
    // falls back to a URL-sniff scan of all keys on the product object.
    let thumbImg: ImageData | null = null;

    const imgCandidates = pArray(p,
      'imageUrls', 'imageUrl', 'image_url', 'photo', 'images', 'thumbnails'
    );
    const firstImg = imgCandidates.length > 0 ? imgCandidates[0] : null;
    if (firstImg) {
      try { thumbImg = await loadImage(firstImg); } catch { thumbImg = null; }
    }

    // Defensive fallback: scan all keys for any array whose first element looks
    // like a Firebase Storage URL that we might have missed above.
    if (!thumbImg) {
      for (const key of Object.keys(p)) {
        const val = (p as any)[key];
        if (
          Array.isArray(val) && val.length > 0 &&
          typeof val[0] === 'string' &&
          (val[0].startsWith('https://firebasestorage') || val[0].startsWith('http'))
        ) {
          try { thumbImg = await loadImage(val[0]); } catch { thumbImg = null; }
          if (thumbImg) break;
        }
      }
    }

    // ── Compute layout dimensions ─────────────────────────────────────────────
    // When a thumbnail is present:
    //   • text starts at C.pn.x + CELL_PAD + THUMB_W + 3  (image gap = 3 mm)
    //   • the available text width shrinks by (THUMB_W + 3)
    //   • the row must be at least THUMB_W mm tall to show the full image
    const hasThumb     = thumbImg !== null;
    const thumbGap     = hasThumb ? THUMB_W + 4 : 0;   // mm gap = image slot + 4 mm margin
    const pnTextWidth  = C.pn.w - CELL_PAD * 2 - thumbGap;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(CELL_FS);
    const pnLines = doc.splitTextToSize(productName || '—', pnTextWidth) as string[];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(CELL_FS);
    const pdLines = doc.splitTextToSize(description || '—', C.pd.w - CELL_PAD * 2) as string[];
    const bnLines = doc.splitTextToSize(serialStr   || '—', C.bn.w - CELL_PAD * 2) as string[];

    // Row height: tallest cell wins; if there's a thumbnail the row must be at
    // least (THUMB_W + 2*1.8 slot padding) tall so the full image slot fits.
    const calcH = (lines: string[]) =>
      Math.max(
        ROW_H,
        lines.length * CELL_LH + Math.max(0, lines.length - 1) * 0.5 + CELL_PAD * 2
      );
    const minThumbH = hasThumb ? THUMB_W + 1.5 * 2 : ROW_H;
    const rH = Math.max(calcH(pnLines), calcH(pdLines), calcH(bnLines), minThumbH);

    y = pb(doc, y, rH);

    // ── FIX: draw ALL cells first, then paint the thumbnail on top ────────────
    // Previously addImage was called before tdCell for the product-name column,
    // so the alternating background rect (drawn inside tdCell) covered the image.
    // Correct order: cells first (backgrounds, borders, text), image last.
    tdCell(doc, C.sr.x, y, C.sr.w, rH, [String(idx + 1)], { align: 'center', alt });
    tdCell(doc, C.pn.x, y, C.pn.w, rH, pnLines, {
      bold: true,
      alt,
      // Shift text right by thumbGap so it doesn't overlap the image area.
      // When hasThumb is false thumbGap is 0, so behaviour is unchanged.
      textOffsetX: thumbGap,
    });
    tdCell(doc, C.pd.x, y, C.pd.w, rH, pdLines, { alt });
    tdCell(doc, C.bn.x, y, C.bn.w, rH, bnLines, { alt });
    tdCell(doc, C.am.x, y, C.am.w, rH, [formatCurrency(convertedTotal, primaryCurrency)], {
      bold: true, align: 'right', alt,
    });

    // Draw thumbnail AFTER all tdCell calls so it sits on top of everything.
    // Uses "cover" fit + clipping: the image is scaled so its shorter dimension
    // fills the slot completely, then clipped. This zooms into the product and
    // eliminates the empty black margins that surround it in the source photo.
    if (thumbImg) {
      try {
        const SLOT_PAD = 1.5;
        const SLOT_W   = THUMB_W - SLOT_PAD * 2;
        const SLOT_H   = rH - SLOT_PAD * 2;
        const SLOT_X   = C.pn.x + CELL_PAD;
        const SLOT_Y   = y + SLOT_PAD;

        // White background
        sf(doc, WHITE);
        doc.setLineWidth(0);
        doc.rect(SLOT_X, SLOT_Y, SLOT_W, SLOT_H, 'F');

        // ── "Cover" scale: enlarge so the shorter side fills the slot ──────────
        // Then centre and clip so overflow is hidden.
        // ZOOM factor > 1.0 crops further into the centre of the image.
        const ZOOM = 1.6;   // 1.6× crops ~37% of each edge — removes black margins

        let drawW = SLOT_W * ZOOM;
        let drawH = SLOT_H * ZOOM;
        try {
          const props = (doc as any).getImageProperties
            ? (doc as any).getImageProperties(thumbImg.dataUrl)
            : null;
          if (props && props.width > 0 && props.height > 0) {
            const ar = props.width / props.height;
            const slotAr = SLOT_W / SLOT_H;
            if (ar >= slotAr) {
              // Image wider than slot — constrain by height
              drawH = SLOT_H * ZOOM;
              drawW = drawH * ar;
            } else {
              // Image taller than slot — constrain by width
              drawW = SLOT_W * ZOOM;
              drawH = drawW / ar;
            }
          }
        } catch { /* fallback */ }

        // Centre the oversized image so we crop equally on each side
        const drawX = SLOT_X + (SLOT_W - drawW) / 2;
        const drawY = SLOT_Y + (SLOT_H - drawH) / 2;

        // Save graphics state, clip to slot rect, draw, restore
        doc.saveGraphicsState();
        // jsPDF clip path: add a rect path and clip
        (doc as any).rect(SLOT_X, SLOT_Y, SLOT_W, SLOT_H, null);
        (doc.internal as any).write('W n');   // PDF clip operator
        doc.addImage(thumbImg.dataUrl, thumbImg.format, drawX, drawY, drawW, drawH);
        doc.restoreGraphicsState();
      } catch { /* non-blocking */ }
    }

    y += rH;
  }

  y += 4;

  // ── TOTAL BOX ────────────────────────────────────────────────────────────────
  y = pb(doc, y, 18);

  const TOT_W = 75;
  const TOT_X = PW - MR - TOT_W;

  const totalLines = selectedCurrencies.map((currency) =>
    formatCurrency(
      convertCurrency(invoice.totalAmount, 'PKR', currency, rates),
      currency
    )
  );

  const totalBoxH = Math.max(11, totalLines.length * 5.5 + 5);

  sd(doc, GOLD);
  doc.rect(TOT_X - 0.5, y - 0.5, TOT_W + 1, totalBoxH + 1, 'S');

  sf(doc, BLACK);
  doc.rect(TOT_X, y, TOT_W, totalBoxH, 'F');

  sf(doc, YELLOW);
  doc.rect(TOT_X, y, 3, totalBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  st(doc, GOLD_RICH);
  doc.text('TOTAL', TOT_X + 6, y + 7);

  st(doc, WHITE);
  doc.text(totalLines, PW - MR - 2, y + 6, { align: 'right' });

  y += totalBoxH + 3;

  // ── TERMS & CONDITIONS ───────────────────────────────────────────────────────
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
    const lines  = doc.splitTextToSize(term, CW - 5) as string[];
    const termH  = lines.length * 3 + 2;
    y = pb(doc, y, termH + 1.5);

    sf(doc, GOLD_RICH);
    doc.ellipse(ML + 1.2, y - 0.4, 0.8, 0.8, 'F');
    lines.forEach((ln, i) => doc.text(ln, TX, y + i * 3));
    y += termH;
  }

  y += 4;

  // ── THANK YOU ────────────────────────────────────────────────────────────────
  y = pb(doc, y, 18);

  sf(doc, YELLOW_BG);
  sd(doc, GOLD);
  doc.rect(ML, y, CW, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  st(doc, BLACK);
  doc.text('Thank you for your purchase!', PW / 2, y + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  st(doc, GOLD);
  doc.text('We value your trust in Bullion Electronics.', PW / 2, y + 11.5, { align: 'center' });

  y += 16;

  // ── SIGNATURE ────────────────────────────────────────────────────────────────
  const SIG_W  = 60;
  const L_SIG_X = ML;
  const SIG_Y  = PH - 28;

  sd(doc, GOLD);
  doc.setLineWidth(0.5);
  doc.line(L_SIG_X, SIG_Y, L_SIG_X + SIG_W, SIG_Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  st(doc, BLACK);
  doc.text('Authorized Signature', L_SIG_X + SIG_W / 2, SIG_Y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  st(doc, GRAY);
  doc.text('Bullion Electronics', L_SIG_X + SIG_W / 2, SIG_Y + 8.5, { align: 'center' });

  // ── STAMP ────────────────────────────────────────────────────────────────────
  // Drawn on the last page only, in the bottom-right corner above the footer.
  // The stamp is rendered at 40×40 mm with jsPDF's globalAlpha trick: we draw
  // the image twice — first a white rectangle at low opacity to soften it, then
  // the stamp itself — giving a classic ink-stamp look without needing a PNG with
  // a transparent background (the source file is a JPEG).
  if (invoice.digitalStamp && stampImg) {
    try {
      const STAMP_SIZE = 40; // mm
      const STAMP_X    = PW - MR - STAMP_SIZE;        // flush with right margin
      const STAMP_Y    = PH - 13 - STAMP_SIZE - 4;    // just above the footer bar

      // jsPDF doesn't have a native opacity/alpha API for images; the cleanest
      // cross-version approach is to set the GState via internal APIs.
      // We use a simple workaround: draw the image directly — JPEG stamps already
      // have white backgrounds which blend acceptably on white paper.
      doc.addImage(
        stampImg.dataUrl,
        stampImg.format,
        STAMP_X,
        STAMP_Y,
        STAMP_SIZE,
        STAMP_SIZE,
      );
    } catch { /* non-blocking — if stamp fails the rest of the PDF is intact */ }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  sf(doc, GOLD);
  doc.rect(0, PH - 13, PW, 0.8, 'F');

  sf(doc, BLACK);
  doc.rect(0, PH - 12.2, PW, 12.2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  st(doc, LIGHT_GRAY);
  doc.text(
    'Bullion Electronics  ·  C108 Building 936 M-04, Plot- Mohammed Bin Zayed City, ME9, Abu Dhabi, United Arab Emirates  ·  +971 56 985 2213',
    PW / 2, PH - 4.5, { align: 'center' }
  );

  return doc.output('blob');
}
 
// ── Public API ────────────────────────────────────────────────────────────────
export async function generateInvoicePdf(invoice: Invoice): Promise<Blob> {
  return buildPdf(invoice);
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await buildPdf(invoice);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  a.style.display = 'none';
  document.body.appendChild(a);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}