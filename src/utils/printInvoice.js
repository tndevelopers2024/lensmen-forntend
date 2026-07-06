const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const gstAmount  = (order) => order.gstEnabled ? +((order.totalPrice || 0) * (order.gstRate || 18) / 100).toFixed(2) : 0
const gstTotal   = (order) => +((order.totalPrice || 0) + gstAmount(order)).toFixed(2)
const gstBalance = (order) => Math.max(0, +(gstTotal(order) - (order.totalPaid || 0)).toFixed(2))

export const printInvoice = (order, mode = 'invoice') => {
  if (!order) return
  const isDC = mode === 'dc'
  const items   = order.items?.length ? order.items : [order.productId].filter(Boolean)
  const days    = order.totalDays || 1
  const discount= order.discountAmount || 0
  const subTotal= items.reduce((s, it) => s + (it?.pricePerDay || 0) * days * (it?.quantity || 1), 0)
  const baseTotal = order.totalPrice || (subTotal - discount)
  const gstEnabled  = order.gstEnabled || false
  const gstRate     = order.gstRate || 18
  const halfGstRate = gstRate / 2
  const cgstAmt     = gstEnabled ? +(baseTotal * halfGstRate / 100).toFixed(2) : 0
  const sgstAmt     = gstEnabled ? +(baseTotal * halfGstRate / 100).toFixed(2) : 0
  const total   = gstTotal(order)
  const balDue  = gstBalance(order)
  const invNo   = order.bookingCode || ('#' + order._id?.slice(-8).toUpperCase())
  const invDate = fmtDate(order.createdAt)
  const logoUrl = `${window.location.origin}/logo.jpg`
  const qrUrl   = `${window.location.origin}/upi-qr.png`
  const signatureUrl = `${window.location.origin}/signature.png`

  const amountInWords = (n) => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
    const inW = (num) => {
      if (num === 0) return ''
      if (num < 20) return a[num] + ' '
      if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '') + ' '
      if (num < 1000) return a[Math.floor(num/100)] + ' Hundred ' + inW(num%100)
      if (num < 100000) return inW(Math.floor(num/1000)) + 'Thousand ' + inW(num%1000)
      if (num < 10000000) return inW(Math.floor(num/100000)) + 'Lakh ' + inW(num%100000)
      return inW(Math.floor(num/10000000)) + 'Crore ' + inW(num%10000000)
    }
    const rupees = Math.floor(n)
    const paise  = Math.round((n - rupees) * 100)
    let words = 'Indian Rupee ' + inW(rupees).trim()
    if (paise) words += ' and ' + inW(paise).trim() + ' Paise'
    return words + ' Only'
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 24px 28px; border: 1px solid #ccc; min-height: 1040px; position: relative; }
  .inv-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 0; }
  .inv-header img { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
  .company-block { flex: 1; }
  .company-name { font-size: 14px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 2px; }
  .company-addr { font-size: 10px; line-height: 1.4; color: #444; }
  .invoice-ref { text-align: right; }
  .invoice-ref .inv-num { font-size: 16px; font-weight: 800; color: #111; }
  .invoice-ref .inv-meta { font-size: 10px; color: #555; margin-top: 3px; line-height: 1.6; }
  .info-row { display: flex; border: 1px solid #ccc; border-top: none; }
  .bill-to { flex: 1; padding: 8px 12px; border-right: 1px solid #ccc; }
  .bill-to-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .bill-to-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .bill-to-detail { font-size: 10px; color: #555; line-height: 1.5; }
  .inv-meta-box { width: 260px; padding: 8px 12px; }
  .inv-meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
  .inv-meta-row .lbl { color: #666; }
  .inv-meta-row .val { font-weight: 600; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #e8e8e8; font-size: 11px; font-weight: 700; padding: 6px 8px; border: 1px solid #ccc; text-align: left; }
  .items-table th.r, .items-table td.r { text-align: right; }
  .items-table th.c, .items-table td.c { text-align: center; width: 28px; }
  .items-table td { padding: 5px 8px; border: 1px solid #ccc; font-size: 11px; vertical-align: top; }
  .items-table td .sub { font-size: 10px; color: #777; }
  .footer-split { display: flex; border: 1px solid #ccc; border-top: none; }
  .footer-left { flex: 1; padding: 10px; border-right: 1px solid #ccc; font-size: 11px; }
  .footer-right { width: 260px; font-size: 11px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 10px; border-bottom: 1px solid #ccc; }
  .totals-row.bold { font-weight: 700; font-size: 12px; }
  .sig-box { padding: 10px; text-align: center; min-height: 60px; display: flex; flex-direction: column; justify-content: space-between; border-top: 1px solid #ccc; }
  @media print { body { margin: 0; } .page { border: 1px solid #ccc; padding: 16px; max-width: 100%; min-height: 98vh; position: relative; } }
</style></head><body><div class="page">
  <div class="inv-header">
    <img src="${logoUrl}" alt="Lensmen Logo" />
    <div class="company-block">
      <div class="company-name">LENSMEN RENTALS</div>
      <div class="company-addr">Flat S3, 2nd floor, Sri Niketan Apt, Sasi Nagar Main Rd, Sasinagar (Old No.7, New No.16), near Anbu Hospital, Velachery, Chennai – 600042 &nbsp;|&nbsp; +91 90800 88600 &nbsp;|&nbsp; lensmen@live.com <br/> GSTIN : 33AALPI0642M1ZQ</div>
    </div>
    <div class="invoice-ref">
      <div class="inv-num">${isDC ? 'DC Copy' : 'INVOICE'}</div>
    </div>
  </div>
  <div class="info-row">
    <div class="bill-to">
      <div class="bill-to-label">Bill To</div>
      <div class="bill-to-name">${order.userName || '—'}</div>
      ${order.userCompanyName ? `<div style="font-size:11px;color:#555;margin-bottom:2px;">${order.userCompanyName}</div>` : ''}
      <div class="bill-to-detail">
        ${order.userMobile  ? order.userMobile  + '<br>' : ''}
        ${order.userSecondMobile ? order.userSecondMobile + ' (alt)<br>' : ''}
        ${order.userEmail   ? order.userEmail   + '<br>' : ''}
        ${order.userAddress ? order.userAddress + '<br>' : ''}
        ${order.userGstNumber ? `<span style="font-weight:700;color:#111;">GSTIN: ${order.userGstNumber}</span><br>` : ''}
        ${order.userGstBusinessName ? order.userGstBusinessName : ''}
      </div>
    </div>
    <div class="inv-meta-box">
      <div class="inv-meta-row"><span class="lbl">${isDC ? 'Challan #' : 'Invoice #'}</span><span class="val">${invNo}</span></div>
      <div class="inv-meta-row"><span class="lbl">${isDC ? 'Challan Date' : 'Invoice Date'}</span><span class="val">${invDate}</span></div>
      ${!isDC ? `<div class="inv-meta-row"><span class="lbl">Due Date</span><span class="val">${invDate}</span></div>` : ''}
      ${!isDC ? `<div class="inv-meta-row"><span class="lbl">Terms</span><span class="val">Due on Receipt</span></div>` : ''}
      ${order.placeOfSupply ? `<div class="inv-meta-row"><span class="lbl">Place of Supply</span><span class="val">${order.placeOfSupply}</span></div>` : ''}
    </div>
  </div>
  <table class="items-table">
    <thead><tr><th class="c">#</th><th>Item &amp; Description</th><th class="r" style="width:50px">Qty</th><th class="r" style="width:50px">Days</th><th class="r" style="width:80px">Rate</th><th class="r" style="width:85px">Amount</th></tr></thead>
    <tbody>
      ${items.map((item, i) => {
        const qty  = item?.quantity || 1
        const rate = (item?.pricePerDay || 0) * days
        const amt  = qty * rate
        return `<tr><td class="c">${i+1}</td><td>${item?.name || 'Unknown'}</td><td class="r">${qty}</td><td class="r">${days}</td><td class="r">${rate.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td class="r">${amt.toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="footer-split">
    <div class="footer-left">
      <div style="margin-bottom:6px;"><div style="font-size:10px;color:#555;margin-bottom:2px;">Total In Words</div><div style="font-weight:700;font-style:italic;">${amountInWords(total)}</div></div>
      <div style="margin-bottom:14px;"><div style="font-size:10px;color:#555;margin-bottom:2px;">Notes</div><div>${order.notes || 'Thanks for your business.'}</div></div>
      <div style="padding-top:8px;border-top:1px solid #ccc;">
        <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:6px;">Bank Details</div>
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <img src="${qrUrl}" alt="UPI QR" style="width:64px;height:auto;border:1px solid #ddd;border-radius:4px;flex-shrink:0;" />
          <div style="font-size:9.5px;line-height:1.65;color:#333;">
            <div>Account Name: <b>Lens Men</b></div>
            <div>Account Type: <b>Current Account</b></div>
            <div>Account No.: <b>234605500007</b></div>
            <div>IFSC Code: <b>ICIC0002346</b></div>
            <div>Branch: <b>Vadapalani</b></div>
            <div>UPI ID: <b>lensmen@icici</b></div>
          </div>
        </div>
      </div>
      ${isDC ? `<div style="margin-top: 50px; text-align: center;"><div style="font-size:11px;color:#555;font-weight:700;">Customer Signature</div></div>` : ''}
    </div>
    <div class="footer-right">
      <div class="totals-row"><span>Sub Total</span><span>${baseTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>(-) ${discount.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>` : ''}
      ${gstEnabled ? `
      <div class="totals-row"><span>CGST (${halfGstRate}%)</span><span>${cgstAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="totals-row"><span>SGST (${halfGstRate}%)</span><span>${sgstAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>` : ''}
      <div class="totals-row bold"><span>Total${gstEnabled ? ' (Incl. GST)' : ''}</span><span>₹${total.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="totals-row bold" style="border-bottom:none;"><span>Balance Due</span><span>₹${balDue.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="sig-box" style="border-top:1px solid #ccc;">
        <img src="${signatureUrl}" alt="Authorized Signature" style="height:48px;object-fit:contain;margin:0 auto 4px;" />
        <div style="font-size:11px;color:#555;">Authorized Signature</div>
      </div>
    </div>
  </div>
</div></body></html>`

  const win = window.open('', '_blank', 'width=820,height=960')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}
