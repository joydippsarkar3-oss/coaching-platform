import { Layout, Menu } from 'antd'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { SidebarFooter, useSidebarMenu, useSidebarNavigation } from './Sidebar'
import { useState } from 'react'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'

const { Sider, Content } = Layout

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const menuItems = useSidebarMenu()
  const { selectedKey, onMenuClick } = useSidebarNavigation()

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={collapsed ? 80 : 0}
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true)
        }}
        className="overflow-y-auto overflow-x-hidden"
        style={{ position: 'sticky', top: 0, height: '100vh' }}
        width={220}
        theme="light"
      >
        <div className="flex items-center justify-center py-4 px-3 border-b border-gray-100">
          {!collapsed && (
            <span className="font-bold text-blue-600 text-base truncate">Center Admin</span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={onMenuClick}
          className="border-r-0 mt-1"
          theme="light"
        />

        <div className="absolute bottom-0 left-0 right-0">
          {!collapsed && <SidebarFooter />}
        </div>
      </Sider>

      <Layout>
        <Layout.Header
          className="bg-white border-b border-gray-100 px-0 flex items-center"
          style={{ height: 56, lineHeight: '56px', position: 'sticky', top: 0, zIndex: 100 }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-14 h-14 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Header />
        </Layout.Header>

        <Content className="p-6 bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
