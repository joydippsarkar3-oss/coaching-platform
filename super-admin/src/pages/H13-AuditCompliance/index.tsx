import React, { useState } from 'react';
import {
  Card, Button, Tabs, Space, Tag, Row, Col, Typography, Checkbox,
  Select, DatePicker, Form, Input
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { auditApi } from '@/api/endpoints/audit';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { AuditLog, RetentionJob } from '@/types/models';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import { formatDateTime } from '@/utils/dates';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BREACH_CHECKLIST = [
  { key: 'identify', label: 'Identify and contain the breach', severity: 'P1' },
  { key: 'assess', label: 'Assess scope and affected data subjects', severity: 'P1' },
  { key: 'notify_dpo', label: 'Notify Data Protection Officer (DPO)', severity: 'P1' },
  { key: 'dpb_72hr', label: 'Notify Data Protection Board (DPB) within 72-hour window', severity: 'P1' },
  { key: 'document', label: 'Document the breach in breach register', severity: 'P2' },
  { key: 'notify_users', label: 'Notify affected data subjects if high risk', severity: 'P2' },
  { key: 'remediation', label: 'Implement remediation steps', severity: 'P2' },
  { key: 'review', label: 'Conduct post-breach review', severity: 'P3' },
  { key: 'policy_update', label: 'Update policies if needed', severity: 'P3' },
];

export default function AuditCompliance() {
  const { t } = useTranslation();
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [logFilters, setLogFilters] = useState<{
    actorId?: string; entityType?: string; action?: string; from?: string; to?: string;
  }>({});

  const { data: logsData } = usePollingApi<PaginatedResponse<AuditLog>>(
    '/api/v1/audit/logs', 30_000
  );
  const { data: retentionData } = usePollingApi<ApiResponse<RetentionJob[]>>(
    '/api/v1/audit/retention-jobs', 60_000
  );
  const { data: consentData } = usePollingApi<ApiResponse<{
    byPurpose: { purpose: string; granted: number; withdrawn: number }[];
    totalGrantedMtd: number;
    totalWithdrawnMtd: number;
  }>>(
    '/api/v1/audit/consent-stats', 60_000
  );

  const logs = logsData?.data ?? [];
  const retentionJobs = retentionData?.data ?? [];
  const consentStats = consentData?.data;

  const logColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    { title: t('audit.actor'), dataIndex: 'actor', key: 'actor' },
    { title: t('audit.action'), dataIndex: 'action', key: 'action', render: (v: string) => <Tag>{v}</Tag> },
    { title: t('audit.entityType'), dataIndex: 'entityType', key: 'entityType' },
    { title: 'Entity ID', dataIndex: 'entityId', key: 'entityId', width: 120,
      render: (v: string) => <Typography.Text copyable style={{ fontSize: 11 }}>{v.slice(0, 8)}…</Typography.Text> },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120 },
  ];

  const retentionColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: t('audit.retentionYears'),
      dataIndex: 'retentionYears',
      key: 'retentionYears',
      render: (v: number) => `${v} years`,
    },
    {
      title: t('audit.lastRun'),
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('audit.nextRun'),
      dataIndex: 'nextRunAt',
      key: 'nextRunAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div>
      <PageHeader title={t('audit.title')} />

      <Tabs defaultActiveKey="logs">
        <TabPane tab={t('audit.logs')} key="logs">
          <Card className="mb-4">
            <Row gutter={16}>
              <Col xs={24} sm={6}>
                <Select
                  placeholder="Entity Type"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(v) => setLogFilters((f) => ({ ...f, entityType: v }))}
                >
                  {['CENTER', 'COURSE', 'EXAM', 'CERTIFICATE', 'USER', 'SETTING'].map((e) => (
                    <Option key={e} value={e}>{e}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  placeholder="Action"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(v) => setLogFilters((f) => ({ ...f, action: v }))}
                >
                  {['CREATE', 'UPDATE', 'DELETE', 'FREEZE', 'PROVISION', 'REVOKE'].map((a) => (
                    <Option key={a} value={a}>{a}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12}>
                <RangePicker style={{ width: '100%' }} />
              </Col>
            </Row>
          </Card>

          <DataTable<AuditLog>
            dataSource={logs}
            columns={logColumns}
            rowKey="id"
            exportFilename="audit-logs"
            exportColumns={[
              { key: 'timestamp', label: 'Timestamp' },
              { key: 'actor', label: 'Actor' },
              { key: 'action', label: 'Action' },
              { key: 'entityType', label: 'Entity Type' },
              { key: 'entityId', label: 'Entity ID' },
              { key: 'ip', label: 'IP' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('audit.consentRegistry')} key="consent">
          {consentStats ? (
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Card>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={consentStats.byPurpose}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="purpose" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="granted" name="Granted" fill="#22c55e" />
                      <Bar dataKey="withdrawn" name="Withdrawn" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Card size="small" style={{ background: '#f0fdf4' }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Granted MTD</Typography.Text>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
                          {consentStats.totalGrantedMtd}
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ background: '#fef2f2' }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Withdrawn MTD</Typography.Text>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                          {consentStats.totalWithdrawnMtd}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          ) : (
            <Card><div className="text-center py-8 text-gray-400">No consent data available</div></Card>
          )}
        </TabPane>

        <TabPane tab={t('audit.dataRetention')} key="retention">
          <DataTable<RetentionJob>
            dataSource={retentionJobs.length ? retentionJobs : [
              { id: '1', name: 'Certificate Records', category: 'Certificates', retentionYears: 7, lastRunAt: new Date().toISOString(), nextRunAt: new Date().toISOString(), status: 'OK' },
              { id: '2', name: 'Financial Records', category: 'Finance', retentionYears: 7, lastRunAt: new Date().toISOString(), nextRunAt: new Date().toISOString(), status: 'OK' },
              { id: '3', name: 'Audit Logs', category: 'Audit', retentionYears: 1, lastRunAt: new Date().toISOString(), nextRunAt: new Date().toISOString(), status: 'OK' },
            ]}
            columns={retentionColumns}
            rowKey="id"
            pagination={false}
          />
        </TabPane>

        <TabPane tab={t('audit.breachRunbook')} key="runbook">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Card title={t('audit.breachRunbook')}>
                <div className="mb-4">
                  <Tag color="red">P1 — Critical</Tag>{' '}
                  <Tag color="orange">P2 — High</Tag>{' '}
                  <Tag color="gold">P3 — Medium</Tag>
                </div>

                {BREACH_CHECKLIST.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-3 p-3 mb-2 rounded border"
                    style={{ background: checkedItems.includes(item.key) ? '#f0fdf4' : '#fff' }}
                  >
                    <Checkbox
                      checked={checkedItems.includes(item.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedItems((prev) => [...prev, item.key]);
                        } else {
                          setCheckedItems((prev) => prev.filter((k) => k !== item.key));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Space>
                        {checkedItems.includes(item.key) ? (
                          <CheckCircleOutlined style={{ color: '#16a34a' }} />
                        ) : (
                          <ExclamationCircleOutlined style={{ color: item.severity === 'P1' ? '#dc2626' : '#f59e0b' }} />
                        )}
                        <Typography.Text
                          style={{ textDecoration: checkedItems.includes(item.key) ? 'line-through' : 'none' }}
                        >
                          {item.label}
                        </Typography.Text>
                      </Space>
                      <Tag
                        style={{ marginLeft: 8 }}
                        color={item.severity === 'P1' ? 'red' : item.severity === 'P2' ? 'orange' : 'gold'}
                      >
                        {item.severity}
                      </Tag>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 16, padding: 12, background: '#fef9c3', borderRadius: 6 }}>
                  <WarningOutlined style={{ color: '#d97706', marginRight: 8 }} />
                  <Typography.Text strong>{t('audit.dpbNotice')}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Per Digital Personal Data Protection Act (DPDP Act), notify the Data Protection Board
                    within 72 hours of becoming aware of a personal data breach.
                  </Typography.Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Quick Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button block>Draft User Notice</Button>
                  <Button block>DPB Notification Template</Button>
                  <Button block>Internal Incident Report</Button>
                  <Button block danger>Escalate to SUPER_ADMIN</Button>
                </Space>
                <div className="mt-4">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Progress: {checkedItems.length}/{BREACH_CHECKLIST.length} steps completed
                  </Typography.Text>
                  <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 4 }}>
                    <div
                      style={{
                        width: `${(checkedItems.length / BREACH_CHECKLIST.length) * 100}%`,
                        height: '100%',
                        background: '#22c55e',
                        borderRadius: 3,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
