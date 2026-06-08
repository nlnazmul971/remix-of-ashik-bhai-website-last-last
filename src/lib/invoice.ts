// Clean minimalist invoice — single A4 page, order-id barcode only.

export type InvoiceOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address: string;
  customer_city: string;
  courier_provider?: string | null;
  tracking_code?: string | null;
  consignment_id?: string | null;
  payment_method: string;
  payment_sender_number?: string | null;
  transaction_id?: string | null;
  delivery_method: string;
  customer_note?: string | null;
  items: any[] | any;
  discount?: number;
  delivery_charge?: number;
  advance_payment?: number;
  total: number;
};

export type InvoiceOverrides = {
  brandName?: string;
  brandSub?: string;
  brandWebsite?: string;
  brandAddress?: string;
  brandPhone?: string;
  brandEmail?: string;
  brandCopyright?: string;
  customerAddressFull?: string;
  courierProviderLabel?: string;
  extraLines?: string[];
};

const BRAND_NAME = 'TWINKLE';
const BRAND_WEBSITE = 'www.highlightsbd.shop';
const BRAND_ADDRESS = 'Mirpur Section - 6, Block - A, Lane - 2, Dhaka 1216';
const BRAND_PHONE = '+8801338918891';
const BRAND_EMAIL = 'highlightsbdofficial@gmail.com';

const courierLabel = (p?: string | null) => {
  if (!p) return '';
  if (p === 'steadfast') return 'Steadfast Courier';
  if (p === 'pathao') return 'Pathao Courier';
  return p;
};

const escapeHtml = (s: any) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const fmt = (n: number) => `৳${Math.round(n).toLocaleString()}`;

const fmtDateShort = (d: string | Date) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const fmtDateTime = (d: string | Date) => {
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${fmtDateShort(dt)}, ${hh}:${mi}`;
};

export const invoiceStyles = `
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111; background: #eeeeee; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 190mm; min-height: 273mm; margin: 10mm auto; background: #fff; padding: 14mm 16mm 12mm; position: relative; display: flex; flex-direction: column; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .topbar { display: flex; justify-content: space-between; font-size: 9.5px; color: #666; margin-bottom: 18px; }
  .topbar .center { position: absolute; left: 50%; transform: translateX(-50%); }
  .header { text-align: center; padding-bottom: 14px; border-bottom: 1px solid #d4d4d4; margin-bottom: 22px; position: relative; }
  .brand-name { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-size: 38px; font-weight: 500; letter-spacing: 0.5em; color: #111; line-height: 1; padding-right: 0.5em; }
  .brand-website { font-size: 10px; color: #555; margin-top: 10px; letter-spacing: 0.32em; text-transform: lowercase; }
  .invoice-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .invoice-title { font-size: 18px; letter-spacing: 0.18em; color: #111; text-transform: uppercase; font-weight: 400; }
  .invoice-row .order-no { font-size: 11.5px; color: #444; }
  .invoice-row .date { font-size: 11.5px; color: #555; }
  .section { margin-top: 18px; }
  .sec-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; color: #888; font-weight: 600; margin-bottom: 6px; }
  .cust-name { font-size: 13px; font-weight: 700; color: #111; }
  .cust-line { font-size: 12px; color: #222; line-height: 1.55; }
  .courier-block { margin-top: 18px; padding-left: 16px; }
  .courier-block .sec-title { margin-bottom: 7px; }
  .courier-block .crow { font-size: 12.5px; color: #111; line-height: 1.7; }
  .courier-block .crow b { font-weight: 700; color: #111; }
  .pay-block { margin-top: 18px; }
  .pay-block .pline { font-size: 12px; color: #222; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  thead tr { border-top: 1px solid #d4d4d4; border-bottom: 1px solid #d4d4d4; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #444; text-align: left; padding: 9px 6px; font-weight: 600; }
  th:nth-child(2), th:nth-child(3) { text-align: center; }
  th:last-child { text-align: right; }
  td { padding: 11px 6px; font-size: 12.5px; border-bottom: 1px solid #f0f0f0; color: #222; line-height: 1.4; }
  td:nth-child(2), td:nth-child(3) { text-align: center; }
  td:last-child { text-align: right; }
  .totals-wrap { display: flex; justify-content: flex-end; margin-top: 14px; }
  .totals { min-width: 280px; font-size: 12.5px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
  .totals .row b { color: #111; font-weight: 600; }
  .totals .grand { border-top: 1px solid #111; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 700; color: #111; }
  .totals .due { border-top: 1px dashed #999; padding-top: 8px; margin-top: 6px; font-size: 14px; font-weight: 700; color: #111; display: flex; justify-content: space-between; }
  .note { margin-top: 14px; padding: 8px 12px; border-left: 2px solid #d4d4d4; font-size: 11.5px; color: #444; background: #fafafa; }
  .extra { margin-top: 4px; font-size: 11px; color: #666; }
  .bottom { margin-top: auto; padding-top: 18px; }
  .barcode-wrap { padding-top: 16px; border-top: 1px solid #eee; text-align: center; }
  .barcode-wrap svg { display: block; margin: 0 auto; }
  .barcode-label { font-size: 10px; letter-spacing: 0.16em; color: #555; text-transform: uppercase; margin-top: 4px; }
  .barcode-label b { color: #111; font-weight: 700; letter-spacing: 0.06em; font-size: 11px; }
  .footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; font-size: 9.5px; color: #888; line-height: 1.6; }
  .footer .thanks { font-size: 10.5px; font-weight: 700; color: #111; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 3px; }
  @media print {
    body { background: #fff; }
    .sheet { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
  }
`;

export function renderInvoiceSheet(order: InvoiceOrder, ov: InvoiceOverrides = {}): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const brand = ov.brandName || BRAND_NAME;
  const subtotal = items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
  const discount = order.discount || 0;
  const dCharge = order.delivery_charge || 0;
  const adv = order.advance_payment || 0;
  const due = order.total - adv;
  const orderShort = order.id.slice(0, 8);
  const courier = ov.courierProviderLabel ?? courierLabel(order.courier_provider);
  const address = ov.customerAddressFull || `${order.customer_address}, ${order.customer_city}`;

  const hasCourier = !!(courier || order.tracking_code || order.consignment_id);

  const courierBlock = hasCourier ? `
    <div class="courier-block">
      <div class="sec-title">Courier Information</div>
      ${courier ? `<div class="crow"><b>Courier:</b> ${escapeHtml(courier)}</div>` : ''}
      ${order.tracking_code ? `<div class="crow"><b>Tracking ID:</b> ${escapeHtml(order.tracking_code)}</div>` : ''}
      ${order.consignment_id && order.consignment_id !== order.tracking_code ? `<div class="crow"><b>Consignment ID:</b> ${escapeHtml(order.consignment_id)}</div>` : ''}
    </div>` : '';

  return `
<div class="sheet">

  <div class="header">
    <div class="brand-name">${escapeHtml(brand)}</div>
    <div class="brand-website">${escapeHtml(BRAND_WEBSITE)}</div>
  </div>

  <div class="invoice-title">Invoice</div>

  <div class="section">
    <div class="sec-title">Customer</div>
    <div class="cust-name">${escapeHtml(order.customer_name)}</div>
    <div class="cust-line">${escapeHtml(order.customer_phone)}</div>
    ${order.customer_email ? `<div class="cust-line">${escapeHtml(order.customer_email)}</div>` : ''}
    <div class="cust-line">${escapeHtml(address)}</div>
  </div>

  ${courierBlock}

  <div class="pay-block">
    <div class="sec-title">Payment &amp; Delivery</div>
    <div class="pline">Payment: ${escapeHtml(order.payment_method)}${order.transaction_id ? ` &middot; TxID: ${escapeHtml(order.transaction_id)}` : ''}</div>
    <div class="pline">Delivery: ${escapeHtml(order.delivery_method)}</div>
  </div>

  ${order.customer_note ? `<div class="note"><b>Note:</b> ${escapeHtml(order.customer_note)}</div>` : ''}

  <table>
    <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>
      ${items.map((i: any) => `<tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.size || '-')}</td>
        <td>${i.quantity}</td>
        <td>${fmt((i.price || 0) * (i.quantity || 1))}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="row"><span>Subtotal</span><b>${fmt(subtotal)}</b></div>
      ${discount > 0 ? `<div class="row"><span>Discount</span><b>- ${fmt(discount)}</b></div>` : ''}
      ${dCharge > 0 ? `<div class="row"><span>Delivery Charge</span><b>${fmt(dCharge)}</b></div>` : ''}
      <div class="row grand"><span>Total</span><span>${fmt(order.total)}</span></div>
      ${adv > 0 ? `<div class="row"><span>Advance Paid</span><b>- ${fmt(adv)}</b></div>` : ''}
      ${adv > 0 ? `<div class="due"><span>Amount Due</span><span>${fmt(due)}</span></div>` : ''}
    </div>
  </div>

  ${(ov.extraLines || []).filter(l => l && l.trim()).map(l => `<div class="extra">${escapeHtml(l)}</div>`).join('')}

  <div class="bottom">
    <div class="barcode-wrap">
      <svg class="barcode" data-value="${escapeHtml(orderShort)}"></svg>
      <div class="barcode-label">Order ID: <b>${escapeHtml(orderShort)}</b></div>
    </div>
    <div class="footer">
      <div class="thanks">Thank you for shopping</div>
      <div>${escapeHtml(BRAND_ADDRESS)}</div>
      <div>${escapeHtml(BRAND_PHONE)} &middot; ${escapeHtml(BRAND_EMAIL)}</div>
    </div>
  </div>
</div>`;
}

const CODES_SCRIPT = `
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
<script>
  window.addEventListener('load', function() {
    document.querySelectorAll('svg.barcode').forEach(function(svg) {
      try {
        JsBarcode(svg, svg.getAttribute('data-value') || '', {
          format: 'CODE128', displayValue: false, height: 46, width: 1.6, margin: 0, background: '#ffffff', lineColor: '#111111'
        });
      } catch(e) {}
    });
    setTimeout(function(){ window.print(); }, 350);
  });
</script>`;

export function buildInvoiceDocument(orders: InvoiceOrder[] | InvoiceOrder, overrides: InvoiceOverrides = {}): string {
  const list = Array.isArray(orders) ? orders : [orders];
  const title = list.length === 1 ? `Invoice #${list[0].id.slice(0, 8)}` : `Invoices (${list.length})`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${invoiceStyles}</style>
</head><body>
${list.map(o => renderInvoiceSheet(o, overrides)).join('\n')}
${CODES_SCRIPT}
</body></html>`;
}

export function openAndPrintInvoice(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
