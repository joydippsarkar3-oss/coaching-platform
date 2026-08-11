import { BellOutlined, GlobalOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTenantStore } from '@/store'
import i18n from '@/i18n'

export function Header() {
  const { user, logout } = useAuth()
  const { center } = useTenantStore()
  const { t } = useTranslation()

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'hi' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const profileItems = [
    {
      key: 'role',
      label: <span className="text-gray-500 text-xs">{user?.role?.replace('_', ' ').toUpperCase()}</span>,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: logout,
      danger: true,
    },
  ]

  return (
    <div className="flex items-center justify-between w-full px-4">
      <div className="flex items-center gap-3">
        {center?.logo && (
          <img src={center.logo} alt="center logo" className="h-8 w-8 rounded object-cover" />
        )}
        <span className="font-semibold text-gray-800">{center?.name ?? ''}</span>
      </div>

      <Space size="middle">
        <Button
          type="text"
          size="small"
          icon={<GlobalOutlined />}
          onClick={toggleLanguage}
          className="text-gray-600"
        >
          {i18n.language === 'en' ? 'हि' : 'EN'}
        </Button>

        <Badge count={3} size="small">
          <Button type="text" icon={<BellOutlined />} className="text-gray-600" />
        </Badge>

        <Dropdown menu={{ items: profileItems }} placement="bottomRight" trigger={['click']}>
          <Button type="text" className="flex items-center gap-2 px-2">
            <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
            <span className="text-sm text-gray-700 hidden sm:inline">{user?.name}</span>
          </Button>
        </Dropdown>
      </Space>
    </div>
  )
}
