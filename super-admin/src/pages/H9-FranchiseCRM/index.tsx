import React, { useState } from 'react';
import {
  Tabs, Card, Button, Drawer, Tag, Row, Col, Descriptions, Form, Input,
  Select, Modal, message, Space, Typography, Divider, Alert, Badge, Statistic,
  Table, Avatar, Timeline,
} from 'antd';
import {
  PlusOutlined, UserOutlined, EnvironmentOutlined, PhoneOutlined,
  ExclamationCircleOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { usePollingApi } from '@/hooks/usePollingApi';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';

const { TabPane } = Tabs;
const { TextArea } = Input;

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStage = 'NEW_APPLICATION' | 'CONTACTED' | 'SITE_VISIT_DONE' | 'AGREEMENT_SENT' | 'ACTIVE';
type InvestmentBand = '3-5L' | '5-10L' | '10L+';

interface FranchiseLead {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  investmentBand: InvestmentBand;
  spaceAvailableSqft: number;
  stage: LeadStage;
  appliedDate: string;
  stageEnteredAt: string;
  notes: LeadNote[];
}

interface LeadNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

interface NearbyCenter {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
}

interface HoChargePackage {
  courseId: string;
  courseName: string;
  admissionCharge: number;
  certificateCharge: number;
  royaltyPct: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'NEW_APPLICATION', label: 'New Application', color: 'blue' },
  { key: 'CONTACTED', label: 'Contacted', color: 'cyan' },
  { key: 'SITE_VISIT_DONE', label: 'Site Visit Done', color: 'orange' },
  { key: 'AGREEMENT_SENT', label: 'Agreement Sent', color: 'purple' },
  { key: 'ACTIVE', label: 'Active', color: 'green' },
];

const STAGE_ORDER: LeadStage[] = [
  'NEW_APPLICATION', 'CONTACTED', 'SITE_VISIT_DONE', 'AGREEMENT_SENT', 'ACTIVE',
];

const INVESTMENT_LABELS: Record<InvestmentBand, string> = {
  '3-5L': '₹3–5 L',
  '5-10L': '₹5–10 L',
  '10L+': '₹10 L+',
};

function daysInStage(stageEnteredAt: string): number {
  return Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / 86_400_000);
}

// ─── Conversion Summary ───────────────────────────────────────────────────────

function ConversionSummary({ leads }: { leads: FranchiseLead[] }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = leads.filter((l) => new Date(l.appliedDate) >= monthStart);
  const converted = thisMonth.filter((l) => l.stage === 'ACTIVE');
  const convRate = thisMonth.length > 0
    ? Math.round((converted.length / thisMonth.length) * 100)
    : 0;

  // avg days from appliedDate to ACTIVE for converted leads
  const avgDays = converted.length > 0
    ? Math.round(
        converted.reduce((sum, l) => sum + daysInStage(l.appliedDate), 0) / converted.length
      )
    : 0;

  return (
    <Row gutter={16} className="mb-6">
      <Col span={6}>
        <Card size="small">
          <Statistic title="Total Leads (This Month)" value={thisMonth.length} />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Converted" value={converted.length} valueStyle={{ color: '#22c55e' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Conversion Rate" value={convRate} suffix="%" />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Avg Days to Close" value={avgDays} suffix="d" />
        </Card>
      </Col>
    </Row>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: FranchiseLead;
  onView: (lead: FranchiseLead) => void;
  onMoveNext: (lead: FranchiseLead) => void;
}

function LeadCard({ lead, onView, onMoveNext }: LeadCardProps) {
  const days = daysInStage(lead.stageEnteredAt);
  const isLastStage = lead.stage === 'ACTIVE';

  return (
    <Card
      size="small"
      className="mb-3"
      hoverable
      style={{ borderLeft: `3px solid ${days > 7 ? '#ef4444' : '#d9d9d9'}` }}
      onClick={() => onView(lead)}
    >
      <div className="flex items-start justify-between">
        <div>
          <Typography.Text strong>{lead.name}</Typography.Text>
          <div className="flex items-center gap-1 mt-1">
            <EnvironmentOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {lead.city}, {lead.state}
            </Typography.Text>
          </div>
        </div>
        <Tag color="blue" style={{ fontSize: 11 }}>
          {INVESTMENT_LABELS[lead.investmentBand]}
        </Tag>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Applied {formatDate(lead.appliedDate)} · {days}d in stage
          {days > 7 && (
            <ExclamationCircleOutlined style={{ color: '#ef4444', marginLeft: 4 }} />
          )}
        </Typography.Text>
        {!isLastStage && (
          <Button
            size="small"
            type="link"
            icon={<ArrowRightOutlined />}
            onClick={(e) => { e.stopPropagation(); onMoveNext(lead); }}
          >
            Move
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Log Lead Drawer ──────────────────────────────────────────────────────────

interface LogLeadDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function LogLeadDrawer({ open, onClose, onCreated }: LogLeadDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: unknown) => {
    setLoading(true);
    try {
      await apiClient.post('/api/v1/franchise-leads', values);
      message.success('Lead logged successfully');
      form.resetFields();
      onCreated();
      onClose();
    } catch {
      message.error('Failed to log lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer title="Log New Lead" open={open} onClose={onClose} width={480}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
          <Input prefix={<UserOutlined />} placeholder="Applicant name" />
        </Form.Item>
        <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
          <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="city" label="City" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="state" label="State" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="investmentBand" label="Investment Band" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="3-5L">₹3–5 L</Select.Option>
            <Select.Option value="5-10L">₹5–10 L</Select.Option>
            <Select.Option value="10L+">₹10 L+</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="spaceAvailableSqft" label="Space Available (sq ft)" rules={[{ required: true }]}>
          <Input type="number" suffix="sq ft" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Save Lead
        </Button>
      </Form>
    </Drawer>
  );
}

// ─── Lead Detail Drawer ───────────────────────────────────────────────────────

interface LeadDetailDrawerProps {
  lead: FranchiseLead | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function LeadDetailDrawer({ lead, open, onClose, onUpdated }: LeadDetailDrawerProps) {
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [quoteModal, setQuoteModal] = useState(false);

  const { data: nearbyCenters } = useApi<NearbyCenter[]>(
    lead ? `/api/v1/centers?near=${encodeURIComponent(lead.city)}&radius=30km` : null
  );
  const { data: packages } = useApi<HoChargePackage[]>('/api/v1/finance/ho-charges');

  const conflict = nearbyCenters?.find((c) => c.distanceKm <= 5);

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return;
    setNoteLoading(true);
    try {
      await apiClient.post(`/api/v1/franchise-leads/${lead.id}/notes`, { text: noteText });
      message.success('Note added');
      setNoteText('');
      onUpdated();
    } catch {
      message.error('Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  const packageColumns = [
    { title: 'Course', dataIndex: 'courseName', key: 'courseName' },
    {
      title: 'Admission Charge',
      dataIndex: 'admissionCharge',
      key: 'admissionCharge',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Certificate Charge',
      dataIndex: 'certificateCharge',
      key: 'certificateCharge',
      render: (v: number) => formatMoney(v),
    },
    { title: 'Royalty %', dataIndex: 'royaltyPct', key: 'royaltyPct', render: (v: number) => `${v}%` },
  ];

  return (
    <Drawer
      title={lead ? `${lead.name} — Franchise Lead` : 'Lead Detail'}
      open={open}
      onClose={onClose}
      width={640}
      extra={
        <Button type="primary" onClick={() => setQuoteModal(true)}>
          Quote Package
        </Button>
      }
    >
      {lead && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Name">{lead.name}</Descriptions.Item>
            <Descriptions.Item label="Phone">{lead.phone}</Descriptions.Item>
            <Descriptions.Item label="City">{lead.city}</Descriptions.Item>
            <Descriptions.Item label="State">{lead.state}</Descriptions.Item>
            <Descriptions.Item label="Investment">{INVESTMENT_LABELS[lead.investmentBand]}</Descriptions.Item>
            <Descriptions.Item label="Space">{lead.spaceAvailableSqft} sq ft</Descriptions.Item>
            <Descriptions.Item label="Stage">
              <Tag color={STAGES.find((s) => s.key === lead.stage)?.color}>
                {STAGES.find((s) => s.key === lead.stage)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Applied">{formatDate(lead.appliedDate)}</Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Text strong>Territory Check</Typography.Text>
            <Divider style={{ margin: '8px 0' }} />
            {conflict && (
              <Alert
                type="error"
                icon={<ExclamationCircleOutlined />}
                message={`Conflict: ${conflict.name} is ${conflict.distanceKm.toFixed(1)} km away`}
                showIcon
                className="mb-2"
              />
            )}
            {nearbyCenters && nearbyCenters.length > 0 ? (
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {nearbyCenters.map((c) => (
                  <li key={c.id}>
                    <Typography.Text>
                      {c.name} ({c.city}) —{' '}
                      <Typography.Text type={c.distanceKm <= 5 ? 'danger' : 'secondary'}>
                        {c.distanceKm.toFixed(1)} km
                      </Typography.Text>
                    </Typography.Text>
                  </li>
                ))}
              </ul>
            ) : (
              <Typography.Text type="secondary">No active centers within 30 km.</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Text strong>Notes</Typography.Text>
            <Divider style={{ margin: '8px 0' }} />
            {lead.notes.length > 0 ? (
              <Timeline
                items={lead.notes.map((n) => ({
                  dot: <Avatar size={20} icon={<UserOutlined />} />,
                  children: (
                    <div>
                      <Typography.Text strong style={{ fontSize: 12 }}>{n.author}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        {formatDate(n.timestamp)}
                      </Typography.Text>
                      <div>{n.text}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Typography.Text type="secondary">No notes yet.</Typography.Text>
            )}
            <TextArea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="mt-2"
            />
            <Button
              type="primary"
              size="small"
              loading={noteLoading}
              onClick={handleAddNote}
              className="mt-2"
              disabled={!noteText.trim()}
            >
              Add Note
            </Button>
          </div>
        </Space>
      )}

      <Modal
        title="Package Options"
        open={quoteModal}
        onCancel={() => setQuoteModal(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={packages ?? []}
          columns={packageColumns}
          rowKey="courseId"
          size="small"
          pagination={false}
        />
      </Modal>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FranchiseCRMPage() {
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<FranchiseLead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: leads = [], mutate } = usePollingApi<FranchiseLead[]>(
    '/api/v1/franchise-leads', 30_000
  );

  const handleMoveNext = async (lead: FranchiseLead) => {
    const currentIdx = STAGE_ORDER.indexOf(lead.stage);
    if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) return;
    const nextStage = STAGE_ORDER[currentIdx + 1];
    try {
      await apiClient.patch(`/api/v1/franchise-leads/${lead.id}`, { stage: nextStage });
      message.success(`Moved to ${STAGES.find((s) => s.key === nextStage)?.label}`);
      mutate();
    } catch {
      message.error('Failed to move stage');
    }
  };

  const openDetail = (lead: FranchiseLead) => {
    setDetailLead(lead);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Franchise CRM"
        subtitle="Lead pipeline for franchise applicants"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setLogDrawerOpen(true)}>
            Log New Lead
          </Button>
        }
      />

      <ConversionSummary leads={leads} />

      <Tabs defaultActiveKey="NEW_APPLICATION">
        {STAGES.map(({ key, label, color }) => {
          const stageLeads = leads.filter((l) => l.stage === key);
          return (
            <TabPane
              tab={
                <span>
                  <Badge count={stageLeads.length} showZero color={color} offset={[6, 0]}>
                    <span style={{ paddingRight: 8 }}>{label}</span>
                  </Badge>
                </span>
              }
              key={key}
            >
              <div style={{ minHeight: 200 }}>
                {stageLeads.length === 0 ? (
                  <Typography.Text type="secondary">No leads in this stage.</Typography.Text>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onView={openDetail}
                      onMoveNext={handleMoveNext}
                    />
                  ))
                )}
              </div>
            </TabPane>
          );
        })}
      </Tabs>

      <LogLeadDrawer
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        onCreated={() => mutate()}
      />

      <LeadDetailDrawer
        lead={detailLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => mutate()}
      />
    </div>
  );
}
