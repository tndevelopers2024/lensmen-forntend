const BRAND = '#E5550F'
const NAVY  = '#1e1b4b'

const fmt = (n) => (n || 0).toLocaleString('en-IN')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''

export const downloadQuotePDF = (quote) => {
  const items    = quote.items || []
  const hasDisc  = (quote.discountAmount || 0) > 0
  const hasGst   = !!quote.gstEnabled

  const rows = items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:9px 12px;text-align:center;color:#6b7280;font-size:12px">${i + 1}</td>
      <td style="padding:9px 12px;font-weight:600;color:${NAVY};font-size:13px">${item.name}</td>
      <td style="padding:9px 12px;text-align:right;color:#6b7280;font-size:13px">₹${fmt(item.pricePerDay)}</td>
      <td style="padding:9px 12px;text-align:center;color:#6b7280;font-size:13px">${item.quantity || 1}</td>
      <td style="padding:9px 12px;text-align:center;color:#6b7280;font-size:13px">${quote.totalDays || 1}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;color:${NAVY};font-size:13px">
        ₹${fmt((item.pricePerDay || 0) * (item.quantity || 1) * (quote.totalDays || 1))}
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Quote ${quote.quoteCode} — Lensmen Rentals</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: ${NAVY}; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 14mm; size: A4; }
    }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }

    /* Header */
    .header { background: ${NAVY}; color: #fff; padding: 24px 28px; border-radius: 14px 14px 0 0; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0; }
    .header-brand { }
    .header-brand h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
    .header-brand p { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; }
    .header-meta { text-align: right; }
    .header-meta .label { font-size: 10px; color: rgba(255,255,255,0.5); font-weight:700; letter-spacing:0.1em; text-transform:uppercase }
    .header-meta .code  { font-size: 18px; font-weight: 900; color: #fff; }
    .header-meta .date  { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; }
    .accent-bar { height: 4px; background: ${BRAND}; margin-bottom: 24px; border-radius: 0 0 4px 4px; }

    /* Info row */
    .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 12px; padding: 16px; }
    .info-box .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.12em; display: block; margin-bottom: 8px; }
    .info-box .name  { font-size: 15px; font-weight: 800; color: ${NAVY}; }
    .info-box .phone { font-size: 13px; color: ${BRAND}; font-weight: 600; margin-top: 3px; }
    .info-box .email { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .info-box .dates { font-size: 13px; font-weight: 700; color: ${NAVY}; }
    .info-box .days  { font-size: 13px; color: ${BRAND}; font-weight: 700; margin-top: 4px; }

    /* Table */
    .section-label-outer { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; display: block; }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0; margin-bottom: 16px; }
    thead tr { background: ${NAVY}; }
    thead th { padding: 10px 12px; color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    tbody tr { border-top: 1px solid #f3f4f6; }

    /* Totals */
    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-bottom: 20px; }
    .total-row { display: flex; gap: 48px; }
    .total-row span:first-child { font-size: 13px; color: #9ca3af; min-width: 80px; text-align: right; }
    .total-row span:last-child  { font-size: 13px; font-weight: 700; color: ${NAVY}; min-width: 90px; text-align: right; }
    .total-final { background: ${NAVY}; color: #fff; padding: 10px 18px; border-radius: 10px; display: flex; gap: 48px; }
    .total-final span:first-child { font-size: 14px; font-weight: 800; }
    .total-final span:last-child  { font-size: 14px; font-weight: 900; min-width: 90px; text-align: right; }

    /* Notes */
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; }
    .notes-box .notes-label { font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
    .notes-box p { font-size: 13px; color: #78350f; }

    /* Footer */
    .footer { border-top: 2px solid ${BRAND}; padding-top: 14px; text-align: center; }
    .footer p { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
    .footer strong { font-size: 12px; color: ${BRAND}; }

    /* Print button */
    .print-btn { position: fixed; top: 20px; right: 20px; background: ${BRAND}; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .print-btn:hover { background: #c2410c; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>

  <div class="page">
    <div class="header">
      <div class="header-brand">
        <h1>LENSMEN RENTALS</h1>
        <p>Camera &amp; Equipment Rental — Professional Grade Gear</p>
      </div>
      <div class="header-meta">
        <div class="label">Quotation</div>
        <div class="code">#${quote.quoteCode}</div>
        <div class="date">Date: ${fmtDate(quote.createdAt || new Date())}</div>
      </div>
    </div>
    <div class="accent-bar"></div>

    <div class="info-row">
      <div class="info-box">
        <span class="section-label">Quotation For</span>
        <div class="name">${quote.customerName || '—'}</div>
        ${quote.customerMobile ? `<div class="phone">${quote.customerMobile}</div>` : ''}
        ${quote.customerEmail  ? `<div class="email">${quote.customerEmail}</div>`  : ''}
        ${quote.raisedBy ? `<div style="margin-top:8px;font-size:11px;color:#9ca3af">Raised by: <strong style="color:${NAVY}">${quote.raisedBy}</strong></div>` : ''}
      </div>
      <div class="info-box">
        <span class="section-label">Rental Period</span>
        <div class="dates">${fmtDate(quote.startDate)} ${fmtTime(quote.startDate)} → ${fmtDate(quote.endDate)} ${fmtTime(quote.endDate)}</div>
        <div class="days">${quote.totalDays || 1} Day${(quote.totalDays || 1) !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <span class="section-label-outer">Equipment &amp; Pricing</span>
    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">#</th>
          <th style="text-align:left">Equipment</th>
          <th style="text-align:right">Rate / Day</th>
          <th style="text-align:center;width:48px">Qty</th>
          <th style="text-align:center;width:48px">Days</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${fmt(quote.subtotal)}</span>
      </div>
      ${hasDisc ? `<div class="total-row"><span>Discount</span><span style="color:#10b981">-₹${fmt(quote.discountAmount)}</span></div>` : ''}
      ${hasGst ? `<div class="total-row"><span>GST (${quote.gstPercent || 18}%)</span><span style="color:#6b7280">+₹${fmt(quote.gstAmount)}</span></div>` : ''}
      <div class="total-final">
        <span>TOTAL PAYABLE${hasGst ? ' (Incl. GST)' : ''}</span>
        <span>₹${fmt(quote.totalPrice)}</span>
      </div>
    </div>

    ${quote.notes ? `
    <div class="notes-box">
      <span class="notes-label">Note</span>
      <p>${quote.notes}</p>
    </div>` : ''}

    <div class="footer">
      <p>This quotation is valid for 7 days from the date of issue.</p>
      <strong>Lensmen Rentals — Professional Camera &amp; Equipment Rental</strong>
    </div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  win.focus()
}
