import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, Button, Tooltip } from 'antd'
import {
  BarChartOutlined, AppstoreOutlined, ShoppingCartOutlined, TeamOutlined,
  SettingOutlined, LogoutOutlined,
  LeftOutlined, RightOutlined, LineChartOutlined, FileTextOutlined,
  TagsOutlined, UnorderedListOutlined, BellOutlined, GiftOutlined, AuditOutlined,
  MenuOutlined, ShopOutlined,
} from '@ant-design/icons'
import { useGlobal } from '../context/GlobalContext'

const { Sider, Content } = Layout

const BRAND = '#E5550F'
const NAVY  = '#1e1b4b'

const SIDE_CSS = `
.lm-side .ant-menu{ background:transparent !important; border:none !important }
.lm-side .ant-menu-item-group-title{ font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; padding:16px 12px 6px !important }
.lm-side .ant-menu-inline-collapsed .ant-menu-item-group-title{ visibility:hidden; height:8px; padding:0 !important }
.lm-side .ant-menu-item, .lm-side .ant-menu-submenu-title{ margin-block:2px !important; width:100% !important; font-weight:500; transition:background .15s, color .15s }
.lm-side .ant-menu-item .anticon, .lm-side .ant-menu-submenu-title .anticon{ transition:color .15s }
.lm-side .ant-menu-item a{ color:inherit !important }
.lm-side .ant-menu-item-selected{
  background:linear-gradient(90deg, rgba(229,85,15,0.32), rgba(229,85,15,0.06)) !important;
  box-shadow: inset 3px 0 0 #E5550F; font-weight:600;
}
.lm-side .ant-menu-item-selected .anticon{ color:#ff8a4c !important }
.lm-side .ant-menu-submenu-selected > .ant-menu-submenu-title{ color:#fff !important }
.lm-side .ant-menu-submenu-selected > .ant-menu-submenu-title .anticon{ color:#ff8a4c !important }
.lm-side .ant-menu-sub.ant-menu-inline{ background:transparent !important }
.lm-scroll::-webkit-scrollbar{ width:6px }
.lm-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.14); border-radius:6px }
`

const AdminLayout = ({ children, location }) => {
  const { user, logout, notifications } = useGlobal()
  const unreadCount = notifications.filter(n => !n.read).length
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { key: '/admin', icon: <BarChartOutlined />, label: <Link to="/admin">Overview</Link> },
    {
      type: 'group', label: 'Operations',
      children: [
        { key: '/admin/orders',   icon: <ShoppingCartOutlined />, label: <Link to="/admin/orders">Orders</Link> },
        { key: '/admin/quotes',   icon: <FileTextOutlined />,     label: <Link to="/admin/quotes">Quotes</Link> },
        { key: '/admin/invoices', icon: <AuditOutlined />,        label: <Link to="/admin/invoices">Invoices</Link> },
        { key: '/admin/users',    icon: <TeamOutlined />,         label: <Link to="/admin/users">Users</Link> },
      ],
    },
    {
      type: 'group', label: 'Catalog',
      children: [
        {
          key: 'inventory',
          icon: <AppstoreOutlined />,
          label: 'Inventory',
          children: [
            { key: '/admin/all-products', icon: <UnorderedListOutlined />, label: <Link to="/admin/all-products">Products</Link> },
            { key: '/admin/categories',   icon: <TagsOutlined />,          label: <Link to="/admin/categories">Categories</Link> },
          ],
        },
        { key: '/admin/vendors', icon: <ShopOutlined />, label: <Link to="/admin/vendors">Vendors</Link> },
        { key: '/admin/offers',  icon: <GiftOutlined />, label: <Link to="/admin/offers">Offers</Link> },
        { key: '/admin/menus',   icon: <MenuOutlined />, label: <Link to="/admin/menus">Menus</Link> },
      ],
    },
    {
      type: 'group', label: 'Insights',
      children: [
        { key: '/admin/accounts', icon: <LineChartOutlined />, label: <Link to="/admin/accounts">Reports</Link> },
      ],
    },
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
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'rgba(0,0,0,0.18)',
            darkItemColor: 'rgba(255,255,255,0.68)',
            darkItemHoverColor: '#ffffff',
            darkItemHoverBg: 'rgba(255,255,255,0.07)',
            darkItemSelectedBg: 'transparent',
            darkItemSelectedColor: '#ffffff',
            darkGroupTitleColor: 'rgba(255,255,255,0.38)',
            itemBorderRadius: 10,
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
          theme="dark"
          className="lm-side"
          style={{
            background: 'linear-gradient(180deg, #1e1b4b 0%, #17143c 55%, #100e2e 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <style>{SIDE_CSS}</style>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -90, left: -70, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,85,15,0.28), transparent 70%)', pointerEvents: 'none' }} />

            {/* Logo + collapse */}
            <div style={{
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: '0 10px 0 14px',
              flexShrink: 0,
              position: 'relative',
            }}>
              {!collapsed && (
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <img
                    src="/logo.jpg" alt="Lens Men"
                    style={{ height: 68, width: 'auto', maxWidth: 150, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: '3px 10px', boxShadow: '0 2px 10px rgba(0,0,0,0.35)' }}
                  />
                </Link>
              )}
              <Button
                type="text" size="small"
                icon={collapsed
                  ? <RightOutlined style={{ fontSize: 11 }} />
                  : <LeftOutlined  style={{ fontSize: 11 }} />
                }
                onClick={() => setCollapsed(c => !c)}
                style={{ color: 'rgba(255,255,255,0.5)', width: 28, height: 28 }}
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
            <div className="lm-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 10px 0', position: 'relative' }}>
              <Menu
                mode="inline" theme="dark"
                selectedKeys={[location.pathname]}
                defaultOpenKeys={['/admin/all-products', '/admin/categories'].includes(location.pathname) ? ['inventory'] : []}
                inlineCollapsed={collapsed}
                items={navItems}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>

            {/* Util Nav */}
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 10px 4px', margin: '0 4px', position: 'relative' }}>
              <Menu
                mode="inline" theme="dark"
                selectedKeys={[location.pathname]}
                inlineCollapsed={collapsed}
                items={utilItems}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>

            {/* User Profile */}
            <div style={{ flexShrink: 0, padding: 12, position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? 6 : '10px 10px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14,
              }}>
                <Tooltip title={collapsed ? user?.fullName : ''} placement="right">
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: 'default',
                    background: `linear-gradient(135deg, ${BRAND}, #f97316)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 10px rgba(229,85,15,0.4)',
                  }}>
                    {initials}
                  </div>
                </Tooltip>
                {!collapsed && (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.fullName}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Administrator</div>
                    </div>
                    <Button
                      type="text" size="small"
                      icon={<LogoutOutlined style={{ fontSize: 14 }} />}
                      onClick={logout} title="Sign out"
                      style={{ color: 'rgba(255,255,255,0.55)', width: 30, height: 30, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(239,68,68,0.35)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent' }}
                    />
                  </>
                )}
              </div>
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
