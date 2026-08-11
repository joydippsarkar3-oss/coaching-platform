import React from 'react';
import { Row, Col, Card, Alert, Tag, List, Typography, Spin } from 'antd';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { BankOutlined, UserOutlined, TrophyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePollingApi } from '@/hooks/usePollingApi';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatMoney } from '@/utils/money';
import type { DashboardKpis, MonthlyAdmission, CenterRevenue, CenterLeaderboard, NetworkAlert } from '@/types/models';
import type { ApiResponse } from '@/types/api';

export default function NetworkDashboard() {
  const { t } = useTranslation();

  const { data: kpisRes, isLoading: kpisLoading } = usePollingApi<ApiResponse<DashboardKpis>>(
    '/api/v1/dashboard/kpis', 60_000
  );
  const { data: admissionsRes } = usePollingApi<ApiResponse<MonthlyAdmission[]>>(
    '/api/v1/dashboard/monthly-admissions', 60_000
  );
  const { data: revenueRes } = usePollingApi<ApiResponse<CenterRevenue[]>>(
    '/api/v1/dashboard/revenue-by-center', 60_000
  );
  const { data: leaderboardRes } = usePollingApi<ApiResponse<CenterLeaderboard[]>>(
    '/api/v1/dashboard/leaderboard', 60_000
  );
  const { data: alertsRes } = usePollingApi<ApiResponse<NetworkAlert[]>>(
    '/api/v1/dashboard/alerts', 60_000
  );

  const kpis = kpisRes?.data;
  const admissions = admissionsRes?.data ?? [];
  const revenue = revenueRes?.data ?? [];
  const leaderboard = leaderboardRes?.data ?? [];
  const alerts = alertsRes?.data ?? [];

  const leaderboardColumns = [
    { title: t('dashboard.leaderboard.rank'), dataIndex: 'rank', key: 'rank', width: 60 },
    { title: t('dashboard.leaderboard.center'), dataIndex: 'centerName', key: 'centerName' },
    { title: t('dashboard.leaderboard.city'), dataIndex: 'city', key: 'city' },
    {
      title: t('dashboard.leaderboard.admissions'),
      dataIndex: 'admissionsThisMonth',
      key: 'admissions',
      sorter: (a: CenterLeaderboard, b: CenterLeaderboard) => a.admissionsThisMonth - b.admissionsThisMonth,
    },
    {
      title: t('dashboard.leaderboard.revenue'),
      dataIndex: 'revenueThisMonth',
      key: 'revenue',
      render: (v: number) => <MoneyDisplay paise={v} compact />,
      sorter: (a: CenterLeaderboard, b: CenterLeaderboard) => a.revenueThisMonth - b.revenueThisMonth,
    },
    {
      title: t('dashboard.leaderboard.collection'),
      dataIndex: 'collectionPct',
      key: 'collectionPct',
      render: (v: number) => (
        <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{v}%</Tag>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  const alertPriority: Record<string, string> = {
    P1: 'error',
    P2: 'warning',
    P3: 'info',
  };

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />

      {/* KPI Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('dashboard.kpi.activeCenters')}
            value={kpis?.activeCenters ?? '--'}
            prefix={<BankOutlined />}
            loading={kpisLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('dashboard.kpi.studentsEnrolled')}
            value={kpis?.studentsEnrolledMtd ?? '--'}
            prefix={<UserOutlined />}
            loading={kpisLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('dashboard.kpi.networkRevenue')}
            value={kpis ? formatMoney(kpis.networkRevenueMtd) : '--'}
            prefix={<TrophyOutlined />}
            loading={kpisLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('dashboard.kpi.certificatesIssued')}
            value={kpis?.certificatesIssuedMtd ?? '--'}
            prefix={<SafetyCertificateOutlined />}
            loading={kpisLoading}
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.charts.monthlyAdmissions')}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={admissions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="admissions"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.charts.revenueByCenter')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenue.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="centerName" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Leaderboard + Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={t('dashboard.leaderboard.title')}>
            <DataTable<CenterLeaderboard>
              dataSource={leaderboard}
              columns={leaderboardColumns}
              rowKey="centerId"
              exportFilename="center-leaderboard"
              exportColumns={[
                { key: 'rank', label: 'Rank' },
                { key: 'centerName', label: 'Center' },
                { key: 'city', label: 'City' },
                { key: 'admissionsThisMonth', label: 'Admissions' },
                { key: 'revenueThisMonth', label: 'Revenue (paise)' },
                { key: 'collectionPct', label: 'Collection %' },
                { key: 'status', label: 'Status' },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={t('dashboard.alerts.title')}
            extra={<Tag color="blue">{alerts.length}</Tag>}
            style={{ height: '100%' }}
          >
            <List
              dataSource={alerts}
              renderItem={(alert) => (
                <List.Item key={alert.id}>
                  <Alert
                    type={(alertPriority[alert.priority] ?? 'info') as 'error' | 'warning' | 'info'}
                    message={
                      <span>
                        {alert.priority === 'P1' && <Tag color="red">P1</Tag>}{' '}
                        {alert.centerName && (
                          <Typography.Text strong>{alert.centerName}: </Typography.Text>
                        )}
                        {alert.message}
                      </span>
                    }
                    style={{ width: '100%', marginBottom: 4 }}
                    showIcon
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No active alerts' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Map Placeholder */}
      <Row className="mt-4">
        <Col span={24}>
          <Card>
            <div
              style={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f4ff',
                borderRadius: 8,
                border: '2px dashed #93c5fd',
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                {t('dashboard.mapPlaceholder')}
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
