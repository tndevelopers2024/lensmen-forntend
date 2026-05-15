import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const GlobalContext = createContext()

export const API_URL = import.meta.env.VITE_API_URL || 'https://lensmen-backend.onrender.com/api'

export const GlobalProvider = ({ children }) => {
  const [products, setProducts] = useState([])
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

  useEffect(() => {
    if (user) localStorage.setItem('rental_user', JSON.stringify(user))
    else localStorage.removeItem('rental_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('rental_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    fetchProducts()
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
      }
    } catch (error) {
      console.error('Fetch admin data error:', error)
    }
  }

  const fetchUserOrders = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_URL}/user/bookings/${user.email}`)
      const data = await res.json()
      setUserOrders(data)
    } catch (error) {
      console.error('Fetch user orders error:', error)
    }
  }

  const addToCart = (product) => {
    if (cart.find(item => item._id === product._id)) {
      toast.error('Item already in cart')
      return
    }
    setCart([...cart, product])
    toast.success('Added to cart!')
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id))
    toast.success('Removed from cart')
  }

  const logout = () => {
    setUser(null)
    window.location.href = '/'
  }

  return (
    <GlobalContext.Provider value={{
      products, setProducts,
      user, setUser,
      cart, setCart,
      rentalDates, setRentalDates,
      adminStats, setAdminStats,
      allOrders, setAllOrders,
      adminProductList, setAdminProductList,
      userOrders, setUserOrders,
      fetchProducts,
      fetchAdminData,
      fetchUserOrders,
      addToCart,
      removeFromCart,
      logout,
      API_URL
    }}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = () => useContext(GlobalContext)
