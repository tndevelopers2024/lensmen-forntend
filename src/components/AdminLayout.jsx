import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, Button, Tooltip } from 'antd'
import {
  BarChartOutlined, AppstoreOutlined, ShoppingCartOutlined, TeamOutlined,
  PlusOutlined, SettingOutlined, LogoutOutlined,
  LeftOutlined, RightOutlined, AccountBookOutlined, FileTextOutlined,
  TagsOutlined, UnorderedListOutlined, BellOutlined, GiftOutlined, AuditOutlined,
} from '@ant-design/icons'
import { useGlobal } from '../context/GlobalContext'

const { Sider, Content } = Layout

const BRAND = '#E5550F'
const NAVY  = '#1e1b4b'

const AdminLayout = ({ children, location }) => {
  const { user, logout, notifications } = useGlobal()
  const unreadCount = notifications.filter(n => !n.read).length
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { key: '/admin',          icon: <BarChartOutlined />,     label: <Link to="/admin">Overview</Link> },
    {
      key: 'inventory',
      icon: <AppstoreOutlined />,
      label: 'Inventory',
      children: [
        { key: '/admin/all-products', icon: <UnorderedListOutlined />, label: <Link to="/admin/all-products">Products</Link> },
        { key: '/admin/categories',   icon: <TagsOutlined />,          label: <Link to="/admin/categories">Categories</Link> },
      ],
    },
    { key: '/admin/orders',   icon: <ShoppingCartOutlined />, label: <Link to="/admin/orders">Orders</Link> },
    { key: '/admin/users',    icon: <TeamOutlined />,         label: <Link to="/admin/users">Users</Link> },
    { key: '/admin/accounts',  icon: <AccountBookOutlined />,  label: <Link to="/admin/accounts">Accounts</Link> },
    { key: '/admin/invoices',  icon: <AuditOutlined />,        label: <Link to="/admin/invoices">Invoices</Link> },
    { key: '/admin/quotes',    icon: <FileTextOutlined />,     label: <Link to="/admin/quotes">Quotes</Link> },
    { key: '/admin/offers',    icon: <GiftOutlined />,         label: <Link to="/admin/offers">Offers</Link> },
  ]

  const utilItems = [
    {
      key: '/admin/notifications',
      icon: (
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <BellOutlined />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              background: '#E5550F', color: '#fff',
              fontSize: 8, fontWeight: 800,
              width: 14, height: 14, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      ),
      label: (
        <Link to="/admin/notifications" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#E5550F', color: '#fff',
              fontSize: 10, fontWeight: 700,
              padding: '1px 7px', borderRadius: 10,
            }}>
              {unreadCount}
            </span>
          )}
        </Link>
      ),
    },
    { key: '/admin/settings', icon: <SettingOutlined />, label: <Link to="/admin/settings">Settings</Link> },
  ]

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: NAVY,
          borderRadius: 8,
          fontFamily: 'inherit',
          colorBgContainer: '#ffffff',
        },
        components: {
          Menu: {
            itemSelectedBg: '#f0f1f7',
            itemSelectedColor: NAVY,
            itemHoverBg: '#f9fafb',
            itemHeight: 40,
            iconSize: 16,
            itemPaddingInline: 12,
            collapsedIconSize: 17,
            itemColor: '#4b5563',
            iconMarginInlineEnd: 10,
          },
          Table: {
            borderRadius: 0,
            headerBg: '#fafafa',
            headerSortActiveBg: '#fafafa',
            rowHoverBg: '#fafafa',
          },
          Modal: { borderRadius: 12 },
          Button: { borderRadius: 8 },
          Card: { borderRadius: 16 },
          Tabs: { inkBarColor: NAVY, itemSelectedColor: NAVY, itemHoverColor: NAVY },
          Input: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          DatePicker: { borderRadius: 8 },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f4f6f8' }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <Sider
          collapsed={collapsed}
          collapsedWidth={64}
          width={220}
          trigger={null}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Logo + collapse */}
            <div style={{
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: '0 16px',
              borderBottom: '1px solid #f0f0f0',
              flexShrink: 0,
            }}>
              {!collapsed && (
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <img
                    src="/logo.jpg" alt="Logo"
                    style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '1px solid #f0f0f0' }}
                  />
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>Lensmen</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Rentals</div>
                  </div>
                </Link>
              )}
              <Button
                type="text" size="small"
                icon={collapsed
                  ? <RightOutlined style={{ fontSize: 11 }} />
                  : <LeftOutlined  style={{ fontSize: 11 }} />
                }
                onClick={() => setCollapsed(c => !c)}
                style={{ color: '#9ca3af', width: 28, height: 28 }}
              />
            </div>

            {/* Add Product CTA */}
            {/* <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <Tooltip title={collapsed ? 'Add Product' : ''} placement="right">
                <Link to="/admin/all-products" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 8px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff7ed')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 26, height: 26,
                      borderRadius: '50%',
                      background: BRAND,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <PlusOutlined style={{ color: '#fff', fontSize: 12 }} />
                    </div>
                    {!collapsed && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: BRAND }}>Add Product</span>
                    )}
                  </div>
                </Link>
              </Tooltip>
            </div> */}

            {/* Main Nav */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 6 }}>
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                defaultOpenKeys={['/admin/all-products', '/admin/categories'].includes(location.pathname) ? ['inventory'] : []}
                inlineCollapsed={collapsed}
                items={navItems}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>

            {/* Util Nav */}
            <div style={{ flexShrink: 0, borderTop: '1px solid #f0f0f0', paddingBlock: 4 }}>
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                inlineCollapsed={collapsed}
                items={utilItems}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>

            {/* User Profile */}
            <div style={{
              flexShrink: 0,
              borderTop: '1px solid #f0f0f0',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}>
              <Tooltip title={collapsed ? user?.fullName : ''} placement="right">
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: BRAND,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  flexShrink: 0, cursor: 'default',
                }}>
                  {initials}
                </div>
              </Tooltip>

              {!collapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.fullName}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Admin</div>
                  </div>
                  <Button
                    type="text" size="small"
                    icon={<LogoutOutlined style={{ fontSize: 13 }} />}
                    onClick={logout}
                    title="Sign out"
                    style={{ color: '#9ca3af', width: 28, height: 28, flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent' }}
                  />
                </>
              )}
            </div>

          </div>
        </Sider>

        {/* ── Content ─────────────────────────────────────────── */}
        <Content style={{ background: '#f4f6f8', overflowY: 'auto', minHeight: '100vh', padding: 32 }}>
          {children}
        </Content>

      </Layout>
    </ConfigProvider>
  )
}

export default AdminLayout
