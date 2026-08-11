import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Switch, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  MessageOutlined,
  TeamOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  TranslationOutlined,
  CustomerServiceOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n';

const { Header, Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'nav.dashboard' },
  { key: '/centers', icon: <BankOutlined />, label: 'nav.centers' },
  { key: '/catalog', icon: <BookOutlined />, label: 'nav.catalog' },
  { key: '/question-banks', icon: <QuestionCircleOutlined />, label: 'nav.questionBanks' },
  { key: '/exam-masters', icon: <FileTextOutlined />, label: 'nav.examMasters' },
  { key: '/certificates', icon: <SafetyCertificateOutlined />, label: 'nav.certificates' },
  { key: '/finance', icon: <DollarOutlined />, label: 'nav.finance' },
  { key: '/comms', icon: <MessageOutlined />, label: 'nav.comms' },
  { key: '/franchise-crm', icon: <TeamOutlined />, label: 'nav.franchiseCrm' },
  { key: '/support', icon: <CustomerServiceOutlined />, label: 'nav.support' },
  { key: '/content', icon: <FolderOpenOutlined />, label: 'nav.content' },
  { key: '/analytics', icon: <BarChartOutlined />, label: 'nav.analytics' },
  { key: '/users', icon: <TeamOutlined />, label: 'nav.users' },
  { key: '/audit', icon: <AuditOutlined />, label: 'nav.audit' },
  { key: '/settings', icon: <SettingOutlined />, label: 'nav.settings' },
];

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLangToggle = (checked: boolean) => {
    const lang = checked ? 'hi' : 'en';
    i18n.changeLanguage(lang);
    localStorage.setItem('bb_lang', lang);
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: t('nav.logout'),
        danger: true,
        onClick: async () => {
          await logout();
          navigate('/login');
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto' }}
      >
        <div className="flex items-center justify-center py-4 px-3">
          {!collapsed ? (
            <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
              Binary Brain HO
            </Typography.Text>
          ) : (
            <Typography.Text strong style={{ color: '#fff', fontSize: 16 }}>
              BB
            </Typography.Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: t(item.label),
            onClick: () => navigate(item.key),
          }))}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            gap: 16,
          }}
        >
          <Space>
            <span className="text-sm text-gray-500">हि</span>
            <Switch
              size="small"
              defaultChecked={i18n.language === 'hi'}
              onChange={handleLangToggle}
              checkedChildren="हि"
              unCheckedChildren="En"
            />
          </Space>
          <Badge count={3} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Typography.Text>{user?.name ?? 'Admin'}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
