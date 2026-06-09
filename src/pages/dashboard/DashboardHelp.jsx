import { useState } from 'react'
import useWindowWidth from '../../utils/useWindowWidth'
import {
  HiOutlineQuestionMarkCircle, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlineChevronRight, HiOutlineExclamationCircle,
} from 'react-icons/hi'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const STATUS_FLOW = [
  { status: 'Request Submitted', color: '#94a3b8', bg: '#f8fafc', desc: 'Your rental request has been received. Our team will review it shortly.' },
  { status: 'KYC Pending',       color: '#f59e0b', bg: '#fffbeb', desc: 'Your ID documents are under review. We\'ll notify you once verified.' },
  { status: 'KYC Approved',      color: '#10b981', bg: '#f0fdf4', desc: 'Identity verified! Your order is moving to the approval stage.' },
  { status: 'Approved',          color: '#10b981', bg: '#f0fdf4', desc: 'Your rental is confirmed. Get ready to pick up your equipment.' },
  { status: 'Ready for Pickup',  color: '#6366f1', bg: '#eef2ff', desc: 'Equipment is packed and waiting for you. Come pick it up!' },
  { status: 'During Rental',     color: '#3b82f6', bg: '#eff6ff', desc: 'Equipment is with you. Enjoy your shoot!' },
  { status: 'Return Pending',    color: '#f97316', bg: '#fff7ed', desc: 'Your rental period has ended. Please return the equipment.' },
  { status: 'Returned',          color: '#22c55e', bg: '#f0fdf4', desc: 'Equipment received. We\'re checking the condition.' },
  { status: 'Closed',            color: '#22c55e', bg: '#f0fdf4', desc: 'Rental complete! Thank you for using Lensmen Rentals.' },
  { status: 'Rejected',          color: '#ef4444', bg: '#fef2f2', desc: 'Your request was declined. Check the reason in My Orders.' },
]

const FAQS = [
  { q: 'How do I place a rental request?',
    a: 'Browse the inventory on the home screen, select your rental dates at the top, then click the "+ Add to Cart" button on any product. You can book a single item directly, or add multiple items to your cart.' },
  { q: 'What is KYC and why do I need it?',
    a: 'KYC (Know Your Customer) is an identity verification step. Upload photos of your Aadhaar card (front & back) and PAN card (front & back) from the KYC section. Verified accounts get approvals faster.' },
  { q: 'How do I upload my KYC documents?',
    a: 'Go to dashboard → KYC Documents. Upload clear photos of all 4 documents. Our team reviews within 24 hours.' },
  { q: 'Can I cancel a rental order?',
    a: 'Yes. Go to My Orders, find the order and click "Cancel Order". Cancellation is only available before the order reaches Ready for Pickup status.' },
  { q: 'How do I apply an offer or promo code?',
    a: 'When you open the booking form, there\'s an "Offer / Promo Code" field. Enter your code and click Apply. The discount will reflect immediately.' },
  { q: 'What happens if my request is rejected?',
    a: 'You\'ll receive a notification and the order will show a rejection reason in My Orders. You can re-submit a new request.' },
  { q: 'How are rental charges calculated?',
    a: 'Charges are based on number of days × daily rate per item. Minimum 1 day is always charged.' },
  { q: 'What should I do if equipment is damaged?',
    a: 'Inform us immediately. Minor accidental damage may be covered under our policy. Contact support@lensmenrentals.com with photos.' },
  { q: 'How do I track my order status?',
    a: 'All orders are in My Orders with real-time status. You\'ll also get notifications when the status changes.' },
  { q: 'Can I extend my rental period?',
    a: 'Contact us before your return date. Extensions are subject to availability.' },
]

const TIPS = [
  { icon: '📅', tip: 'Set your rental dates in the header before browsing — prices update instantly.' },
  { icon: '🛒', tip: 'Add multiple items to cart and book them together to save time.' },
  { icon: '🪪', tip: 'Complete your KYC early — verified accounts get faster approvals.' },
  { icon: '🔔', tip: 'Enable notifications to get instant updates when your order status changes.' },
  { icon: '🏷️', tip: 'Check the Offers section on product pages for active promo codes.' },
  { icon: '📦', tip: 'Return equipment on time to avoid late fees.' },
]

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(o => !o)} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', gap: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: open ? NAVY : '#374151', flex: 1 }}>{q}</span>
        <HiOutlineChevronRight style={{
          fontSize: 14, color: '#9ca3af', flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }} />
      </div>
      {open && (
        <div style={{ padding: '0 20px 15px', fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  )
}

const Card = ({ title, subtitle, icon, children }) => (
  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: NAVY, fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    {children}
  </div>
)

const DashboardHelp = () => {
  const width    = useWindowWidth()
  const isMobile = width < 768

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Help Center</p>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>Help & Support</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Everything you need to know about renting with Lensmen</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 18, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card title="Order Status Flow" subtitle="What each status means for your rental" icon={<HiOutlineClock />}>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column' }}>
              {STATUS_FLOW.map((s, i) => (
                <div key={s.status} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: s.color, marginTop: 12, flexShrink: 0,
                      boxShadow: `0 0 0 3px ${s.bg}`,
                    }} />
                    {i < STATUS_FLOW.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: '#e5e7eb', minHeight: 18, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 18, flex: 1 }}>
                    <div style={{ marginTop: 8 }}>
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
          </Card>

          <Card title="Frequently Asked Questions" icon={<HiOutlineQuestionMarkCircle />}>
            <div>
              {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card title="Quick Tips" icon={<HiOutlineCheckCircle style={{ color: BRAND }} />}>
            <div style={{ padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TIPS.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t.tip}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ background: NAVY, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <HiOutlineExclamationCircle style={{ color: BRAND, fontSize: 24 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Need more help?</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Reach out and we'll get back to you as soon as possible.
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Support Email', value: 'support@lensmenrentals.com' },
                { label: 'Hours',         value: 'Mon–Sat, 9am – 7pm' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, flexWrap: 'wrap', gap: 4 }}>
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
}

export default DashboardHelp
