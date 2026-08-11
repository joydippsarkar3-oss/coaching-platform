import {
  AccountBookOutlined,
  AuditOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { OnboardingChecklist } from '@/components/shared/OnboardingChecklist'

export function useSidebarMenu(): MenuProps['items'] {
  const { t } = useTranslation()

  return [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/enquiries', icon: <SolutionOutlined />, label: t('nav.enquiries') },
    { key: '/admissions', icon: <FileTextOutlined />, label: t('nav.admissions') },
    { key: '/students', icon: <UserOutlined />, label: t('nav.students') },
    { key: '/batches', icon: <TeamOutlined />, label: t('nav.batches') },
    { key: '/attendance', icon: <CalendarOutlined />, label: t('nav.attendance') },
    { key: '/fees', icon: <AuditOutlined />, label: t('nav.fees') },
    { key: '/exams', icon: <IdcardOutlined />, label: t('nav.exams') },
    { key: '/certificates', icon: <SafetyCertificateOutlined />, label: t('nav.certificates') },
    { key: '/staff', icon: <TeamOutlined />, label: t('nav.staff') },
    { key: '/wallet', icon: <WalletOutlined />, label: t('nav.wallet') },
    { key: '/marketing', icon: <BgColorsOutlined />, label: t('nav.marketing') },
    { key: '/expenses', icon: <AccountBookOutlined />, label: t('nav.expenses') },
    { key: '/reports', icon: <BarChartOutlined />, label: t('nav.reports') },
    { key: '/settings', icon: <SettingOutlined />, label: t('nav.settings') },
  ]
}

export function SidebarFooter() {
  return <OnboardingChecklist />
}

export function useSidebarNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = '/' + location.pathname.split('/')[1]

  const onMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return { selectedKey, onMenuClick }
}
