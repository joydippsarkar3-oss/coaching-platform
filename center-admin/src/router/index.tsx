import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrivateRoute } from './PrivateRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { EnquiriesPage } from '@/pages/enquiries/EnquiriesPage'
import { EnquiryDetailPage } from '@/pages/enquiries/EnquiryDetailPage'
import { AdmissionsPage } from '@/pages/admissions/AdmissionsPage'
import { StudentsPage } from '@/pages/students/StudentsPage'
import { StudentDetailPage } from '@/pages/students/StudentDetailPage'
import { BatchesPage } from '@/pages/batches/BatchesPage'
import { AttendancePage } from '@/pages/attendance/AttendancePage'
import { FeesPage } from '@/pages/fees/FeesPage'
import { ExamsPage } from '@/pages/exams/ExamsPage'
import { CertificatesPage } from '@/pages/certificates/CertificatesPage'
import { StaffPage } from '@/pages/staff/StaffPage'
import { MicrositeCMSPage } from '@/pages/microsite/MicrositeCMSPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

const WalletPage = lazy(() =>
  import('@/pages/wallet/WalletPage').then((m) => ({ default: m.WalletPage })),
)
const MarketingStudioPage = lazy(() =>
  import('@/pages/marketing/MarketingStudioPage').then((m) => ({ default: m.MarketingStudioPage })),
)
const ExpensesPage = lazy(() =>
  import('@/pages/expenses/ExpensesPage').then((m) => ({ default: m.ExpensesPage })),
)

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Spin size="large" /></div>}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/enquiries', element: <EnquiriesPage /> },
          { path: '/enquiries/:id', element: <EnquiryDetailPage /> },
          { path: '/admissions', element: <AdmissionsPage /> },
          { path: '/students', element: <StudentsPage /> },
          { path: '/students/:id', element: <StudentDetailPage /> },
          { path: '/batches', element: <BatchesPage /> },
          { path: '/attendance', element: <AttendancePage /> },
          { path: '/fees', element: <FeesPage /> },
          { path: '/exams', element: <ExamsPage /> },
          { path: '/certificates', element: <CertificatesPage /> },
          { path: '/staff', element: <StaffPage /> },
          { path: '/microsite', element: <MicrositeCMSPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/wallet', element: <LazyPage><WalletPage /></LazyPage> },
          { path: '/marketing', element: <LazyPage><MarketingStudioPage /></LazyPage> },
          { path: '/expenses', element: <LazyPage><ExpensesPage /></LazyPage> },
        ],
      },
    ],
  },
])
