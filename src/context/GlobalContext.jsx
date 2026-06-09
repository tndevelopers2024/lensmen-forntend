import { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const GlobalContext = createContext()

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.lensmenrentals.in/api'
export const BACKEND_URL = API_URL.replace(/\/api$/, '')
export const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path  // legacy absolute URLs still work
  return `${BACKEND_URL}${path}`
}
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.lensmenrentals.in'

export const GlobalProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [offers, setOffers] = useState([])
  const [authMode, setAuthMode] = useState('none')
  const [cartOpen, setCartOpen] = useState(false)
  const [rentalQty, setRentalQty] = useState(1)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rental_user')
    return saved ? JSON.parse(saved) : null
  })
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('rental_cart')
    return saved ? JSON.parse(saved) : []
  })
  const [rentalDates, setRentalDates] = useState(() => {
    const today = new Date()
    today.setMinutes(0, 0, 0)
    const tomorrow = new Date(Date.now() + 86400000)
    tomorrow.setMinutes(0, 0, 0)
    return { from: today, to: tomorrow }
  })

  // Admin specific states
  const [adminStats, setAdminStats] = useState({ productCount: 0, bookingCount: 0, totalRevenue: 0 })
  const [allOrders, setAllOrders] = useState([])
  const [adminProductList, setAdminProductList] = useState([])
  const [userOrders, setUserOrders] = useState([])
  const [allUsers, setAllUsers]               = useState([])
  const [accountsSummary, setAccountsSummary] = useState(null)
  const [revenueData, setRevenueData]         = useState([])
  const [notifications, setNotifications]     = useState([])

  // ── Socket.IO real-time connection ─────────────────────────────────
  const socketRef = useRef(null)

  const fetchNotifications = async (recipient) => {
    if (!recipient) return
    try {
      const res  = await fetch(`${API_URL}/notifications/${encodeURIComponent(recipient)}`)
      const data = await res.json()
      if (Array.isArray(data)) setNotifications(data)
    } catch {}
  }

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    if (user) {
      // Join personal room (email or 'admin')
      const room = user.role === 'admin' ? 'admin' : user.email
      socket.emit('join', { room })
      fetchNotifications(room)
    }

    // New notification pushed from server
    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    // booking:new → refresh order lists
    socket.on('booking:new', ({ userEmail }) => {
      fetchProducts()
      if (user?.role === 'admin') {
        fetch(`${API_URL}/admin/bookings`)
          .then(r => r.json()).then(data => setAllOrders(data)).catch(() => {})
      }
      if (user && user.email === userEmail) fetchUserOrders()
    })

    // booking:updated → refresh order lists
    socket.on('booking:updated', ({ userEmail }) => {
      if (user?.role === 'admin') {
        fetch(`${API_URL}/admin/bookings`)
          .then(r => r.json()).then(data => setAllOrders(data)).catch(() => {})
      }
      if (user && user.email === userEmail) fetchUserOrders()
    })

    // booking:cancelled
    socket.on('booking:cancelled', ({ userEmail }) => {
      fetchProducts()
      if (user?.role === 'admin') {
        fetch(`${API_URL}/admin/bookings`)
          .then(r => r.json()).then(data => setAllOrders(data)).catch(() => {})
      }
      if (user && user.email === userEmail) fetchUserOrders()
    })

    // product:updated
    socket.on('product:updated', () => fetchProducts())

    return () => socket.disconnect()
  }, [user])

  useEffect(() => {
    if (user) localStorage.setItem('rental_user', JSON.stringify(user))
    else localStorage.removeItem('rental_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('rental_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchOffers()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`)
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Fetch products error:', error)
    }
  }

  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_URL}/offers/active`)
      const data = await res.json()
      if (Array.isArray(data)) setOffers(data)
    } catch {}
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/products/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const fetchAdminData = async (path) => {
    try {
      if (path === '/admin') {
        const statsRes = await fetch(`${API_URL}/admin/stats`)
        const statsData = await statsRes.json()
        setAdminStats(statsData)

        const ordersRes = await fetch(`${API_URL}/admin/bookings`)
        const ordersData = await ordersRes.json()
        setAllOrders(ordersData)
      } else if (path === '/admin/orders') {
        const res = await fetch(`${API_URL}/admin/bookings`)
        const data = await res.json()
        setAllOrders(data)
      } else if (path === '/admin/all-products') {
        const res = await fetch(`${API_URL}/admin/products`)
        const data = await res.json()
        setAdminProductList(data)
      } else if (path === '/admin/users') {
        const res = await fetch(`${API_URL}/admin/users`)
        const data = await res.json()
        setAllUsers(data)
      } else if (path === '/admin/accounts') {
        await fetchAccounts()
      }
    } catch (error) {
      console.error('Fetch admin data error:', error)
    }
  }

  const fetchAccounts = async (period = 'daily') => {
    try {
      const [summaryRes, revenueRes] = await Promise.all([
        fetch(`${API_URL}/payments/accounts/summary`),
        fetch(`${API_URL}/payments/accounts/revenue?period=${period}`),
      ])
      const summary = await summaryRes.json()
      const revenue = await revenueRes.json()
      setAccountsSummary(summary)
      setRevenueData(revenue)
    } catch (err) {
      console.error('fetchAccounts error:', err)
    }
  }

  const fetchUserOrders = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_URL}/bookings/user/${user.email}`)
      const data = await res.json()
      setUserOrders(data)
    } catch (error) {
      console.error('Fetch user orders error:', error)
    }
  }

  const addToCart = (product) => {
    if (!user) {
      setAuthMode('login')
      return
    }
    if (cart.find(item => item._id === product._id)) {
      toast.error('Item already in cart')
      setCartOpen(true)
      return
    }
    setCart([...cart, { ...product, cartQty: 1 }])
    setCartOpen(true)
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id))
    toast.success('Removed from cart')
  }

  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    try { await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' }) } catch {}
  }

  const markAllNotificationsRead = async () => {
    if (!user) return
    const recipient = user.role === 'admin' ? 'admin' : user.email
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try { await fetch(`${API_URL}/notifications/read-all/${encodeURIComponent(recipient)}`, { method: 'PUT' }) } catch {}
  }

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id))
    try { await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' }) } catch {}
  }

  const clearAllNotifications = async () => {
    if (!user) return
    const recipient = user.role === 'admin' ? 'admin' : user.email
    setNotifications([])
    try { await fetch(`${API_URL}/notifications/clear/${encodeURIComponent(recipient)}`, { method: 'DELETE' }) } catch {}
  }

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id !== id) return item
      const max = item.availableQuantity ?? 1
      const next = Math.min(max, Math.max(1, (item.cartQty || 1) + delta))
      return { ...item, cartQty: next }
    }))
  }

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, ...profileData })
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, message: 'Server error' }
    }
  }

  const refreshUser = async () => {
    if (!user?.email) return
    try {
      const res = await fetch(`${API_URL}/user/me?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setUser(prev => ({ ...prev, ...data }))
      }
    } catch {}
  }

  const logout = () => {
    setUser(null)
    setCart([])
    localStorage.removeItem('rental_cart')
    window.location.href = '/'
  }

  return (
    <GlobalContext.Provider value={{
      products, setProducts,
      categories, setCategories,
      offers, setOffers, fetchOffers,
      authMode, setAuthMode,
      cartOpen, setCartOpen,
      rentalQty, setRentalQty,
      user, setUser,
      cart, setCart,
      rentalDates, setRentalDates,
      adminStats, setAdminStats,
      allOrders, setAllOrders,
      adminProductList, setAdminProductList,
      userOrders, setUserOrders,
      allUsers, setAllUsers,
      accountsSummary, setAccountsSummary,
      revenueData, setRevenueData,
      fetchAccounts,
      fetchProducts,
      fetchAdminData,
      fetchUserOrders,
      notifications, setNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      clearAllNotifications,
      addToCart,
      removeFromCart,
      updateCartQty,
      updateProfile,
      refreshUser,
      logout,
      API_URL
    }}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = () => useContext(GlobalContext)
