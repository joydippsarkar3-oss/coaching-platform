import React, { useMemo, useState } from 'react';
import {
  Card, Col, DatePicker, Row, Select, Space, Spin, Statistic, Table, Tag, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined,
  RiseOutlined, TrophyOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatMoney } from '@/utils/money';
import type {
  AnalyticsSummary,
  CoursePerformance,
  CenterLeaderboardRow,
} from '@/api/endpoints/analytics';
import type { ApiResponse } from '@/types/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ─── Colour palette ───────────────────────────────────────────────────────────

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8'];
const BAR_COLORS: Record<string, string> = {
  franchise: '#6366f1',
  premium:   '#f59e0b',
  standard:  '#22c55e',
  basic:     '#94a3b8',
};

// ─── Preset date ranges ───────────────────────────────────────────────────────

type Preset = '30d' | '90d' | '12m' | 'custom';

function presetToDates(preset: Preset): [Dayjs, Dayjs] {
  const now = dayjs();
  if (preset === '30d')  return [now.subtract(30,  'day'),   now];
  if (preset === '90d')  return [now.subtract(90,  'day'),   now];
  if (preset === '12m')  return [now.subtract(12,  'month'), now];
  return [now.subtract(30, 'day'), now]; // fallback for custom
}

// ─── Section 1: Enrollment Funnel ────────────────────────────────────────────

interface FunnelSectionProps {
  stages: Array<{ stage: string; count: number }>;
  loading: boolean;
}

function FunnelSection({ stages, loading }: FunnelSectionProps) {
  if (loading) return <Spin />;

  const enriched = stages.map((s, i) => {
    const prev = stages[i - 1];
    const convPct = prev && prev.count > 0
      ? Math.round((s.count / prev.count) * 100)
      : null;
    return { ...s, convPct };
  });

  return (
    <Row gutter={[8, 8]} align="middle" wrap>
      {enriched.map((s, i) => (
        <React.Fragment key={s.stage}>
          <Col>
            <Card
              size="small"
              style={{
                borderTop: `3px solid ${FUNNEL_COLORS[i % FUNNEL_COLORS.length]}`,
                minWidth: 120,
                textAlign: 'center',
              }}
            >
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{s.stage}</Text>}
                value={s.count}
                valueStyle={{
                  fontSize: 22,
                  color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                }}
              />
              {s.convPct !== null && (
                <Tag
                  color={s.convPct >= 60 ? 'green' : s.convPct >= 30 ? 'orange' : 'red'}
                  style={{ marginTop: 4, fontSize: 11 }}
                >
                  {s.convPct}% from prev
                </Tag>
              )}
            </Card>
          </Col>
          {i < enriched.length - 1 && (
            <Col>
              <ArrowRightOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
            </Col>
          )}
        </React.Fragment>
      ))}
    </Row>
  );
}

// ─── Section 2: Revenue Bar Chart ────────────────────────────────────────────

interface RevenueChartProps {
  data: Array<{
    month: string;
    franchise: number;
    premium: number;
    standard: number;
    basic: number;
  }>;
  loading: boolean;
}

function RevenueBarChart({ data, loading }: RevenueChartProps) {
  if (loading) return <Spin />;

  const formatted = data.map((d) => ({
    ...d,
    month: d.month.slice(0, 7), // "YYYY-MM"
    franchise: Math.round(d.franchise / 100),
    premium:   Math.round(d.premium   / 100),
    standard:  Math.round(d.standard  / 100),
    basic:     Math.round(d.basic     / 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v: number) =>
            v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`
          }
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            `₹${v.toLocaleString('en-IN')}`,
            name.charAt(0).toUpperCase() + name.slice(1),
          ]}
        />
        <Legend />
        <Bar dataKey="franchise" stackId="rev" fill={BAR_COLORS.franchise} name="Franchise" radius={[0,0,0,0]} />
        <Bar dataKey="premium"   stackId="rev" fill={BAR_COLORS.premium}   name="Premium" />
        <Bar dataKey="standard"  stackId="rev" fill={BAR_COLORS.standard}  name="Standard" />
        <Bar dataKey="basic"     stackId="rev" fill={BAR_COLORS.basic}     name="Basic" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Section 3: Course Performance Table ─────────────────────────────────────

interface CourseTableProps {
  data: CoursePerformance[];
  loading: boolean;
}

function CoursePerformanceTable({ data, loading }: CourseTableProps) {
  const columns: ColumnsType<CoursePerformance> = [
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      sorter: (a, b) => a.courseName.localeCompare(b.courseName),
    },
    {
      title: 'Enrollments',
      dataIndex: 'enrollments',
      key: 'enrollments',
      width: 110,
      sorter: (a, b) => a.enrollments - b.enrollments,
      align: 'right',
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 110,
      sorter: (a, b) => a.passRate - b.passRate,
      render: (v: number) => (
        <Tag color={v >= 70 ? 'green' : v >= 40 ? 'orange' : 'red'}>{v.toFixed(1)}%</Tag>
      ),
    },
    {
      title: 'Avg Score',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 100,
      sorter: (a, b) => a.avgScore - b.avgScore,
      render: (v: number) => v.toFixed(1),
      align: 'right',
    },
    {
      title: 'Avg WPM',
      dataIndex: 'avgWpm',
      key: 'avgWpm',
      width: 100,
      sorter: (a, b) => (a.avgWpm ?? 0) - (b.avgWpm ?? 0),
      render: (v: number | null) =>
        v !== null ? v.toFixed(0) : <Text type="secondary">—</Text>,
      align: 'right',
    },
  ];

  return (
    <Table<CoursePerformance>
      dataSource={data}
      columns={columns}
      rowKey="courseId"
      size="small"
      loading={loading}
      pagination={{ pageSize: 8 }}
    />
  );
}

// ─── Section 4: Center Leaderboard ───────────────────────────────────────────

interface LeaderboardProps {
  data: CenterLeaderboardRow[];
  loading: boolean;
}

function CenterLeaderboard({ data, loading }: LeaderboardProps) {
  const columns: ColumnsType<CenterLeaderboardRow> = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
      render: (v: number) =>
        v <= 3 ? (
          <TrophyOutlined style={{ color: ['#FFD700', '#C0C0C0', '#CD7F32'][v - 1] }} />
        ) : (
          v
        ),
    },
    {
      title: 'Center',
      dataIndex: 'centerName',
      key: 'centerName',
      sorter: (a, b) => a.centerName.localeCompare(b.centerName),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 130,
      sorter: (a, b) => a.revenue - b.revenue,
      defaultSortOrder: 'descend',
      render: (v: number) => formatMoney(v),
      align: 'right',
    },
    {
      title: 'Enrollments',
      dataIndex: 'enrollments',
      key: 'enrollments',
      width: 110,
      sorter: (a, b) => a.enrollments - b.enrollments,
      align: 'right',
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 110,
      sorter: (a, b) => a.passRate - b.passRate,
      render: (v: number) => (
        <Tag color={v >= 70 ? 'green' : v >= 40 ? 'orange' : 'red'}>{v.toFixed(1)}%</Tag>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 90,
      sorter: (a, b) => a.healthScore - b.healthScore,
      render: (v: number) => {
        const color = v >= 70 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444';
        return <Text strong style={{ color }}>{v}</Text>;
      },
      align: 'right',
    },
  ];

  return (
    <Table<CenterLeaderboardRow>
      dataSource={data}
      columns={columns}
      rowKey="centerId"
      size="small"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const dateRange: [Dayjs, Dayjs] = useMemo(
    () => (preset === 'custom' && customRange ? customRange : presetToDates(preset)),
    [preset, customRange]
  );

  const from = dateRange[0].toISOString();
  const to   = dateRange[1].toISOString();

  const { data: summaryRes, isLoading: summaryLoading } =
    useApi<ApiResponse<AnalyticsSummary>>(
      `/api/v1/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

  const { data: courseRes, isLoading: courseLoading } =
    useApi<ApiResponse<CoursePerformance[]>>(
      `/api/v1/analytics/course-performance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

  const { data: leaderboardRes, isLoading: leaderboardLoading } =
    useApi<ApiResponse<CenterLeaderboardRow[]>>(
      `/api/v1/analytics/center-leaderboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

  const funnel        = summaryRes?.data?.funnel        ?? [];
  const revenueByMonth = summaryRes?.data?.revenueByMonth ?? [];
  const courses        = courseRes?.data                 ?? [];
  const leaderboard    = leaderboardRes?.data             ?? [];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Platform-wide performance insights" />

      {/* Date range filter */}
      <Card size="small" className="mb-4">
        <Space wrap>
          <Select
            value={preset}
            onChange={(v: Preset) => setPreset(v)}
            style={{ width: 130 }}
            options={[
              { label: 'Last 30 days', value: '30d' },
              { label: 'Last 90 days', value: '90d' },
              { label: 'Last 12 months', value: '12m' },
              { label: 'Custom range', value: 'custom' },
            ]}
          />
          {preset === 'custom' && (
            <RangePicker
              value={customRange}
              onChange={(v) => {
                if (v?.[0] && v?.[1]) setCustomRange([v[0], v[1]]);
              }}
              format="DD MMM YYYY"
              allowClear={false}
            />
          )}
          {preset !== 'custom' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dateRange[0].format('DD MMM YYYY')} — {dateRange[1].format('DD MMM YYYY')}
            </Text>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 1. Enrollment Funnel */}
        <Col xs={24}>
          <Card
            size="small"
            title={
              <Space>
                <ArrowUpOutlined style={{ color: '#6366f1' }} />
                Enrollment Funnel
              </Space>
            }
          >
            <FunnelSection stages={funnel} loading={summaryLoading} />
          </Card>
        </Col>

        {/* 2. Revenue bar chart */}
        <Col xs={24}>
          <Card
            size="small"
            title={
              <Space>
                <RiseOutlined style={{ color: '#22c55e' }} />
                Revenue by Month (stacked by centre tier)
              </Space>
            }
          >
            <RevenueBarChart data={revenueByMonth} loading={summaryLoading} />
          </Card>
        </Col>

        {/* 3. Course performance */}
        <Col xs={24}>
          <Card
            size="small"
            title={
              <Space>
                <ArrowDownOutlined style={{ color: '#f59e0b' }} />
                Course Performance
              </Space>
            }
          >
            <CoursePerformanceTable data={courses} loading={courseLoading} />
          </Card>
        </Col>

        {/* 4. Center leaderboard */}
        <Col xs={24}>
          <Card
            size="small"
            title={
              <Space>
                <TrophyOutlined style={{ color: '#FFD700' }} />
                Centre Leaderboard
              </Space>
            }
          >
            <CenterLeaderboard data={leaderboard} loading={leaderboardLoading} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
