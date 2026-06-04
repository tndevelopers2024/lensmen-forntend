import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GlobalProvider, useGlobal } from './context/GlobalContext'

// Components
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import AuthModal from './components/AuthModal'
import BookingModal from './components/BookingModal'
import CartSidebar from './components/CartSidebar'

// Pages
import LandingPage from './pages/LandingPage'
import ProductDetails from './pages/ProductDetails'
import CartPage from './pages/CartPage'
import MyOrdersPage from './pages/MyOrdersPage'
import ProfilePage from './pages/ProfilePage'

// User Dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import DashboardOrders from './pages/dashboard/DashboardOrders'
import DashboardAccount from './pages/dashboard/DashboardAccount'
import DashboardKYC from './pages/dashboard/DashboardKYC'

// Admin Pages
import AdminOverview from './pages/admin/Overview'
import AdminInventory from './pages/admin/Inventory'
import AddGear from './pages/admin/AddGear'
import OrdersMonitor from './pages/admin/Orders'
import UsersPage from './pages/admin/Users'
import AccountsPage from './pages/admin/Accounts'
import QuotesPage from './pages/admin/Quotes'
import CategoriesPage from './pages/admin/Categories'
import AdminHelp from './pages/admin/Help'
import AdminSettings from './pages/admin/Settings'
import AdminNotifications from './pages/admin/Notifications'
import DashboardNotifications from './pages/dashboard/DashboardNotifications'

function AppContent() {
  const location = useLocation()
  const { user, fetchAdminData, fetchUserOrders, authMode, setAuthMode } = useGlobal()
  const [showBookingModal, setShowBookingModal] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (user?.role === 'admin' && location.pathname.startsWith('/admin')) {
      fetchAdminData(location.pathname === '/admin/accounts' ? '/admin/accounts' : location.pathname)
    }
  }, [user, location.pathname])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage setShowBookingModal={setShowBookingModal} />} />
        <Route path="/product/:id" element={<ProductDetails setShowBookingModal={setShowBookingModal} />} />
        <Route path="/cart" element={<CartPage setShowBookingModal={setShowBookingModal} />} />
        <Route path="/my-orders" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={user ? (
          <DashboardLayout><DashboardHome /></DashboardLayout>
        ) : <Navigate to="/" />} />
        <Route path="/dashboard/orders" element={user ? (
          <DashboardLayout><DashboardOrders /></DashboardLayout>
        ) : <Navigate to="/" />} />
        <Route path="/dashboard/account" element={user ? (
          <DashboardLayout><DashboardAccount /></DashboardLayout>
        ) : <Navigate to="/" />} />
        <Route path="/dashboard/kyc" element={user ? (
          <DashboardLayout><DashboardKYC /></DashboardLayout>
        ) : <Navigate to="/" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AdminOverview />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/all-products" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AdminInventory />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/products" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AddGear />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/orders" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <OrdersMonitor />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/users" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <UsersPage />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/accounts" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AccountsPage />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/quotes" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <QuotesPage />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/categories" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <CategoriesPage />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/help" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AdminHelp />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/settings" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AdminSettings />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/admin/notifications" element={user?.role === 'admin' ? (
          <AdminLayout location={location}>
            <AdminNotifications />
          </AdminLayout>
        ) : <Navigate to="/" />} />

        <Route path="/dashboard/notifications" element={user ? (
          <DashboardLayout><DashboardNotifications /></DashboardLayout>
        ) : <Navigate to="/" />} />
      </Routes>

      {/* Shared Modals & Drawers */}
      {authMode !== 'none' && <AuthModal mode={authMode} setMode={setAuthMode} />}
      {showBookingModal && (
        <BookingModal
          product={showBookingModal}
          onClose={() => setShowBookingModal(null)}
          setAuthMode={setAuthMode}
        />
      )}
      <CartSidebar setShowBookingModal={setShowBookingModal} />
    </Layout>
  )
}

function App() {
  return (
    <GlobalProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GlobalProvider>
  )
}

export default App
