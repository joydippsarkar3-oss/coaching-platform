import { AlertOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Skeleton, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { usePollingApi } from '@/hooks/useApi'
import type { DashboardStats } from '@/types/api'
import { formatMonth } from '@/utils/dates'
import dayjs from 'dayjs'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = usePollingApi<DashboardStats>('/dashboard/stats', 30_000)

  if (error) {
    return <Alert type="error" message="Failed to load dashboard data" showIcon />
  }

  const now = dayjs()
  const months = [
    now.subtract(1, 'month').format('YYYY-MM'),
    now.format('YYYY-MM'),
  ]

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={formatMonth(now.toString())}
      />

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          {isLoading ? (
            <Card><Skeleton active /></Card>
          ) : (
            <StatCard
              title={t('dashboard.todayCollections')}
              value={data ? (data.todayCollections / 100).toFixed(0) : 0}
              prefix="₹"
              valueStyle={{ color: '#3f8600', fontSize: 24 }}
            />
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {isLoading ? (
            <Card><Skeleton active /></Card>
          ) : (
            <StatCard
              title={t('dashboard.newAdmissions')}
              value={data?.newAdmissionsToday ?? 0}
              valueStyle={{ fontSize: 24 }}
            />
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {isLoading ? (
            <Card><Skeleton active /></Card>
          ) : (
            <StatCard
              title={t('dashboard.enquiriesOverdue')}
              value={data?.enquiriesOverdue ?? 0}
              valueStyle={{
                color: data && data.enquiriesOverdue > 0 ? '#cf1322' : '#3f8600',
                fontSize: 24,
              }}
            />
          )}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {isLoading ? (
            <Card><Skeleton active /></Card>
          ) : (
            <StatCard
              title={t('dashboard.attendancePercent')}
              value={data?.attendancePercent ?? 0}
              suffix="%"
              valueStyle={{ fontSize: 24 }}
            />
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        {/* Admissions — 2 month tiles */}
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.admissionsTitle')} size="small">
            <Row gutter={[12, 12]}>
              {isLoading
                ? months.map((m) => (
                    <Col span={12} key={m}>
                      <Skeleton active />
                    </Col>
                  ))
                : (data?.admissionsLast2Months ?? []).map((tile) => (
                    <Col span={12} key={tile.month}>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{tile.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{tile.month}</div>
                      </div>
                    </Col>
                  ))}
            </Row>
          </Card>
        </Col>

        {/* Revenue — 2 month tiles */}
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.revenueTitle')} size="small">
            <Row gutter={[12, 12]}>
              {isLoading
                ? months.map((m) => (
                    <Col span={12} key={m}>
                      <Skeleton active />
                    </Col>
                  ))
                : (data?.revenueLast2Months ?? []).map((tile) => (
                    <Col span={12} key={tile.month}>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <MoneyDisplay
                          paise={tile.value}
                          className="text-xl font-bold text-green-600"
                        />
                        <div className="text-xs text-gray-500 mt-1">{tile.month}</div>
                      </div>
                    </Col>
                  ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Action Feed */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <AlertOutlined className="text-orange-500" />
            {t('dashboard.actionFeed')}
          </span>
        }
        size="small"
      >
        {isLoading ? (
          <Skeleton active />
        ) : (data?.actionFeedItems ?? []).length === 0 ? (
          <div className="text-gray-400 py-4 text-center text-sm">All clear — no pending actions</div>
        ) : (
          <ul className="list-none m-0 p-0 divide-y divide-gray-100">
            {(data?.actionFeedItems ?? []).map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag
                    color={
                      item.severity === 'error'
                        ? 'red'
                        : item.severity === 'warning'
                          ? 'orange'
                          : 'blue'
                    }
                  >
                    {item.count}
                  </Tag>
                  <span className="text-sm text-gray-700">{item.message}</span>
                </div>
                <Button type="link" size="small" icon={<ArrowRightOutlined />} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
