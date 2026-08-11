import React, { useState } from 'react';
import {
  Card, Row, Col, DatePicker, Select, Table, Typography, Tag, Space, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, FunnelChart, Funnel, LabelList,
  Cell,
} from 'recharts';
import { usePollingApi } from '@/hooks/usePollingApi';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/utils/dates';

const { RangePicker } = DatePicker;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunnelStage {
  name: string;
  value: number;
}

interface CoursePerf {
  courseId: string;
  courseName: string;
  enrolled: number;
  completionRate: number;
  avgExamScore: number;
  certificatesIssued: number;
  trend7d: { date: string; count: number }[];
}

interface VerificationDay {
  date: string;
  web: number;
  qr: number;
  api: number;
}

interface TopOrg {
  label: string;
  count: number;
}

interface TopState {
  state: string;
  count: number;
}

interface VerificationAnalytics {
  byDay: VerificationDay[];
  topOrgs: TopOrg[];
  topStates: TopState[];
}

interface NetworkEvent {
  id: string;
  type: 'CERTIFICATES' | 'FRANCHISE' | 'EXAM' | 'VERIFICATION';
  message: string;
  timestamp: string;
}

interface CenterBasic {
  id: string;
  name: string;
}

// ─── Sparkline cell ───────────────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="count" dot={false} stroke="#6366f1" strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── 1. Enrollment Funnel ─────────────────────────────────────────────────────

interface EnrollmentFunnelProps {
  centerId: string;
  courseId: string;
  dateRange: [Dayjs, Dayjs];
}

function EnrollmentFunnel({ centerId, courseId, dateRange }: EnrollmentFunnelProps) {
  const params = new URLSearchParams({
    from: dateRange[0].toISOString(),
    to: dateRange[1].toISOString(),
    ...(centerId !== 'ALL' && { centerId }),
    ...(courseId !== 'ALL' && { courseId }),
  });

  const { data: funnelData } = useApi<FunnelStage[]>(
    `/api/v1/analytics/enrollment-funnel?${params}`
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  if (!funnelData) return <Spin />;

  // Compute drop-off %
  const withDropoff = funnelData.map((stage, i) => ({
    ...stage,
    dropoff: i === 0 ? null : funnelData[i - 1].value > 0
      ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100)
      : 0,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={withDropoff} layout="vertical">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {withDropoff.map((_entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-2 flex-wrap mt-2">
        {withDropoff.slice(1).map((s) => (
          <Tag key={s.name} color="orange" style={{ fontSize: 11 }}>
            {s.name}: -{s.dropoff}% drop
          </Tag>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Course Performance ────────────────────────────────────────────────────

function CoursePerformanceTable() {
  const { data: courses = [] } = useApi<CoursePerf[]>('/api/v1/analytics/course-performance');

  const columns: ColumnsType<CoursePerf> = [
    { title: 'Course', dataIndex: 'courseName', key: 'courseName', sorter: (a, b) => a.courseName.localeCompare(b.courseName) },
    { title: 'Enrolled', dataIndex: 'enrolled', key: 'enrolled', sorter: (a, b) => a.enrolled - b.enrolled, width: 90 },
    {
      title: 'Completion %',
      dataIndex: 'completionRate',
      key: 'completionRate',
      sorter: (a, b) => a.completionRate - b.completionRate,
      width: 120,
      render: (v: number) => (
        <Tag color={v >= 70 ? 'green' : v >= 40 ? 'orange' : 'red'}>{v}%</Tag>
      ),
    },
    {
      title: 'Avg Score',
      dataIndex: 'avgExamScore',
      key: 'avgExamScore',
      sorter: (a, b) => a.avgExamScore - b.avgExamScore,
      width: 100,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: 'Certs Issued',
      dataIndex: 'certificatesIssued',
      key: 'certificatesIssued',
      sorter: (a, b) => a.certificatesIssued - b.certificatesIssued,
      width: 110,
    },
    {
      title: '7d Trend',
      key: 'trend',
      width: 100,
      render: (_v, r) => <Sparkline data={r.trend7d} />,
    },
  ];

  return (
    <Table<CoursePerf>
      dataSource={courses}
      columns={columns}
      rowKey="courseId"
      size="small"
      pagination={{ pageSize: 8 }}
    />
  );
}

// ─── 3. Verification Analytics ───────────────────────────────────────────────

function VerificationAnalyticsSection() {
  const { data } = useApi<VerificationAnalytics>('/api/v1/analytics/verification');

  if (!data) return <Spin />;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        <Typography.Text strong className="block mb-2">Verification Hits — Last 30 Days</Typography.Text>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.byDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="web" stroke="#6366f1" dot={false} name="Web" />
            <Line type="monotone" dataKey="qr" stroke="#f59e0b" dot={false} name="QR Scan" />
            <Line type="monotone" dataKey="api" stroke="#22c55e" dot={false} name="API" />
          </LineChart>
        </ResponsiveContainer>
      </Col>
      <Col xs={24} lg={10}>
        <Row gutter={8}>
          <Col span={24}>
            <Typography.Text strong className="block mb-2">Top Verifying Organizations</Typography.Text>
            {data.topOrgs.map((o, i) => (
              <div key={i} className="flex justify-between py-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <Typography.Text style={{ fontSize: 13 }}>{o.label}</Typography.Text>
                <Typography.Text strong>{o.count}</Typography.Text>
              </div>
            ))}
          </Col>
          <Col span={24} className="mt-4">
            <Typography.Text strong className="block mb-2">Top States by Verification</Typography.Text>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data.topStates.slice(0, 5)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="state" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

// ─── 4. Network Activity Feed ─────────────────────────────────────────────────

const EVENT_COLOR: Record<NetworkEvent['type'], string> = {
  CERTIFICATES: 'green',
  FRANCHISE: 'blue',
  EXAM: 'purple',
  VERIFICATION: 'orange',
};

function NetworkActivityFeed() {
  const { data: events = [] } = usePollingApi<NetworkEvent[]>(
    '/api/v1/analytics/network-events', 30_000
  );

  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {events.length === 0 ? (
        <Typography.Text type="secondary">No recent events.</Typography.Text>
      ) : (
        events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-start gap-2 py-2"
            style={{ borderBottom: '1px solid #f5f5f5' }}
          >
            <Tag color={EVENT_COLOR[ev.type]} style={{ minWidth: 90, textAlign: 'center' }}>
              {ev.type}
            </Tag>
            <div>
              <Typography.Text style={{ fontSize: 13 }}>{ev.message}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {formatDate(ev.timestamp)}
              </Typography.Text>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(90, 'day'),
    dayjs(),
  ]);
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  const { data: centers = [] } = useApi<CenterBasic[]>('/api/v1/centers?minimal=true');

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Network-wide performance insights" />

      <Card size="small" className="mb-4">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => { if (v?.[0] && v?.[1]) setDateRange([v[0], v[1]]); }}
            format="DD MMM YYYY"
          />
          <Select value={centerFilter} onChange={setCenterFilter} style={{ width: 180 }}>
            <Select.Option value="ALL">All Centers</Select.Option>
            {centers.map((c) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <Select value={courseFilter} onChange={setCourseFilter} style={{ width: 180 }}>
            <Select.Option value="ALL">All Courses</Select.Option>
          </Select>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Enrollment Funnel">
            <EnrollmentFunnel
              centerId={centerFilter}
              courseId={courseFilter}
              dateRange={dateRange}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            size="small"
            title="Network Activity"
            extra={<Tag color="green">Live · 30s</Tag>}
          >
            <NetworkActivityFeed />
          </Card>
        </Col>

        <Col xs={24}>
          <Card size="small" title="Course Performance">
            <CoursePerformanceTable />
          </Card>
        </Col>

        <Col xs={24}>
          <Card size="small" title="Verification Analytics">
            <VerificationAnalyticsSection />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
