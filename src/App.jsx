import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GlobalProvider, useGlobal } from './context/GlobalContext'

// Components
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import AuthModal from './components/AuthModal'
import BookingModal from './components/BookingModal'

// Pages
import LandingPage from './pages/LandingPage'
import ProductDetails from './pages/ProductDetails'
import CartPage from './pages/CartPage'
import MyOrdersPage from './pages/MyOrdersPage'
import ProfilePage from './pages/ProfilePage'

// Admin Pages
import AdminOverview from './pages/admin/Overview'
import AdminInventory from './pages/admin/Inventory'
import AddGear from './pages/admin/AddGear'
import OrdersMonitor from './pages/admin/Orders'
import UsersPage from './pages/admin/Users'

function AppContent() {
  const location = useLocation()
  const { user, fetchAdminData, fetchUserOrders } = useGlobal()
  const [authMode, setAuthMode] = useState('none')
  const [showBookingModal, setShowBookingModal] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (user?.role === 'admin' && location.pathname.startsWith('/admin')) {
      fetchAdminData(location.pathname)
    } else if (user && location.pathname === '/my-orders') {
      fetchUserOrders()
    }
  }, [user, location.pathname])

  return (
    <Layout setAuthMode={setAuthMode}>
      <Routes>
        <Route path="/" element={<LandingPage setAuthMode={setAuthMode} setShowBookingModal={setShowBookingModal} />} />
        <Route path="/product/:id" element={<ProductDetails setShowBookingModal={setShowBookingModal} />} />
        <Route path="/cart" element={<CartPage setShowBookingModal={setShowBookingModal} />} />
        <Route path="/my-orders" element={user ? <MyOrdersPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />

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
      </Routes>

      {/* Shared Modals */}
      {authMode !== 'none' && <AuthModal mode={authMode} setMode={setAuthMode} />}
      {showBookingModal && (
        <BookingModal 
          product={showBookingModal} 
          onClose={() => setShowBookingModal(null)} 
          setAuthMode={setAuthMode} 
        />
      )}
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
