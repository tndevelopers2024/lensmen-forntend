import { useState } from 'react'
import { Tag } from 'antd'
import {
  QuestionCircleOutlined, RightOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

// ── Order status flow ────────────────────────────────────────────────
const STATUS_FLOW = [
  { status: 'Request Submitted', color: '#94a3b8', bg: '#f8fafc', desc: 'Customer submits a rental request. Awaiting admin review.' },
  { status: 'KYC Pending',       color: '#f59e0b', bg: '#fffbeb', desc: 'KYC documents uploaded. Admin must verify identity before approving.' },
  { status: 'KYC Approved',      color: '#10b981', bg: '#f0fdf4', desc: 'Identity verified. Order moves to approval queue.' },
  { status: 'Approved',          color: '#10b981', bg: '#f0fdf4', desc: 'Rental confirmed. Prepare equipment for pickup.' },
  { status: 'Ready for Pickup',  color: '#6366f1', bg: '#eef2ff', desc: 'Equipment packed and ready. Customer notified.' },
  { status: 'During Rental',     color: '#3b82f6', bg: '#eff6ff', desc: 'Equipment is out with the customer.' },
  { status: 'Return Pending',    color: '#f97316', bg: '#fff7ed', desc: 'Return date reached. Awaiting physical return.' },
  { status: 'Returned',          color: '#22c55e', bg: '#f0fdf4', desc: 'Equipment received. Log condition and close the order.' },
  { status: 'Closed',            color: '#22c55e', bg: '#f0fdf4', desc: 'Order fully completed and archived.' },
  { status: 'Rejected',          color: '#ef4444', bg: '#fef2f2', desc: 'Request declined. Customer notified with reason.' },
]

// ── FAQ data ─────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How do I approve a rental request?',
    a: 'Go to Orders → find the request with status "Request Submitted" or "KYC Pending". Click the row to open details, then click "Approve Rental" in the Revenue & Actions panel. You can also use the inline Approve button in the table row.',
  },
  {
    q: 'How do I reject an order and notify the customer?',
    a: 'Open the order detail modal and click "Reject". A dialog will prompt you to enter a rejection reason — this message is shown to the customer in their dashboard and My Orders page.',
  },
  {
    q: 'What does KYC Pending mean?',
    a: 'The customer uploaded identity documents (Aadhaar + PAN) but they have not been reviewed yet. Click the KYC shield icon on the row to preview the documents, then approve or reject them.',
  },
  {
    q: 'How do I record a payment?',
    a: 'On any financially active order (Approved → Closed), click the ₹ button on the row or "Record Payment" inside the order modal. Enter the amount, payment mode (UPI, Cash, etc.) and type (Advance or Final).',
  },
  {
    q: 'Why is a product still showing as Sold Out after return?',
    a: 'Go to Inventory → Products and click "Sync Stock". This recalculates available quantities from active bookings and restores stock for returned/closed orders.',
  },
  {
    q: 'How do I add a new product?',
    a: 'Go to Inventory → Products and click "Add Product". Fill in the name, daily rate, category, description, upload a cover image, set total and available quantity, then click "Add to Inventory".',
  },
  {
    q: 'Can a customer cancel their own order?',
    a: 'Yes. Customers can cancel their order from the My Orders section in their dashboard, as long as the order has not yet been marked as Returned or Closed.',
  },
  {
    q: 'How do I filter orders by date or customer?',
    a: 'On the Orders Monitor page, use the search bar (top-right) to search by customer name, mobile, or email. Use the date picker to filter by rental start date. Tabs let you filter by All / Rented Out / Returned / Returning Soon.',
  },
  {
    q: 'What is the Quotes section for?',
    a: 'Quotes allow you to generate a professional PDF quote for a customer listing selected products and rental terms. Useful for corporate or bulk enquiries before a formal booking.',
  },
  {
    q: 'How does real-time updating work?',
    a: 'The admin panel uses WebSockets (Socket.IO). When a customer places or cancels a booking, or when you update an order status, the relevant pages refresh automatically — no manual page reload needed.',
  },
]

// ── Quick tips ────────────────────────────────────────────────────────
const TIPS = [
  { icon: '🖱️', tip: 'Click any order row to open the full detail modal — you don\'t have to use the eye icon.' },
  { icon: '🔄', tip: 'Hit "Sync Stock" in Inventory if product availability looks incorrect after a return.' },
  { icon: '📋', tip: 'Use the Quotes page to create professional PDF proposals for corporate clients.' },
  { icon: '🔍', tip: 'The Orders search matches name, mobile number, and email simultaneously.' },
  { icon: '⚡', tip: 'Order changes reflect instantly across all admin tabs — no refresh needed.' },
  { icon: '📊', tip: 'The Accounts page shows revenue charts, top products, and outstanding payments at a glance.' },
]

// ── Accordion item ────────────────────────────────────────────────────
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        gap: 16,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: open ? NAVY : '#374151', flex: 1 }}>{q}</span>
        <RightOutlined style={{
          fontSize: 11, color: '#9ca3af', flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }} />
      </div>
      {open && (
        <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
const AdminHelp = () => (
  <div>
    <PageHeader
      eyebrow="Admin Panel"
      title="Help & Documentation"
      subtitle="Everything you need to manage Lensmen Rentals"
    />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Order Status Flow */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClockCircleOutlined style={{ color: NAVY, fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Order Status Flow</span>
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>— what each status means and what to do next</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STATUS_FLOW.map((s, i) => (
              <div key={s.status} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: i < STATUS_FLOW.length - 1 ? 0 : 0 }}>
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: s.color, marginTop: 14, flexShrink: 0,
                    boxShadow: `0 0 0 3px ${s.bg}`,
                  }} />
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: '#e5e7eb', minHeight: 20, marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 20, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 6, background: s.bg, color: s.color,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {s.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <QuestionCircleOutlined style={{ color: NAVY, fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Frequently Asked Questions</span>
          </div>
          <div>
            {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Quick Tips */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircleOutlined style={{ color: BRAND, fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Quick Tips</span>
          </div>
          <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TIPS.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact / Support card */}
        <div style={{
          background: NAVY, borderRadius: 16, padding: '22px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <ExclamationCircleOutlined style={{ color: BRAND, fontSize: 24 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Need more help?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Contact the development team or refer to the internal admin runbook for advanced configuration.
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Support Email', value: 'support@lensmenrentals.com' },
              { label: 'Version',       value: 'v1.0.0' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default AdminHelp
