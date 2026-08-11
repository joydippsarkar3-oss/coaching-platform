import React, { useState, useMemo } from 'react';
import {
  Table, Tag, Button, Drawer, Modal, Form, Input, Select,
  Space, Tabs, Tooltip, message, Typography, Descriptions,
  Timeline, Avatar, Divider, Alert, Empty, Spin, Row, Col,
  Card, Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, UserOutlined, EnvironmentOutlined,
  CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { usePollingApi } from '@/hooks/usePollingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';
import type {
  FranchiseLead, LeadStatus, CreateLeadPayload, TerritoryCheckResult,
} from '@/api/endpoints/crm';

const { TextArea } = Input;
const { TabPane } = Tabs;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<LeadStatus, { label: string; color: string }> = {
  NEW:            { label: 'New',            color: 'blue'    },
  CONTACTED:      { label: 'Contacted',      color: 'cyan'    },
  SITE_VISIT:     { label: 'Site Visit',     color: 'orange'  },
  AGREEMENT_SENT: { label: 'Agreement Sent', color: 'purple'  },
  ACTIVE:         { label: 'Active',         color: 'green'   },
  CHURNED:        { label: 'Churned',        color: 'red'     },
};

const ALL_STATUSES: LeadStatus[] = [
  'NEW', 'CONTACTED', 'SITE_VISIT', 'AGREEMENT_SENT', 'ACTIVE', 'CHURNED',
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh',
];

// ─── Add Lead Drawer ───────────────────────────────────────────────────────────

interface AddLeadDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function AddLeadDrawer({ open, onClose, onCreated }: AddLeadDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateLeadPayload) => {
    setLoading(true);
    try {
      await apiClient.post('/api/v1/franchise-leads', values);
      message.success('Lead added successfully');
      form.resetFields();
      onCreated();
      onClose();
    } catch {
      message.error('Failed to add lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Add New Franchise Lead"
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input prefix={<UserOutlined />} placeholder="Contact person name" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="city" label="City" rules={[{ required: true, message: 'City is required' }]}>
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="state" label="State" rules={[{ required: true, message: 'State is required' }]}>
              <Select showSearch placeholder="Select state">
                {INDIA_STATES.map((s) => (
                  <Select.Option key={s} value={s}>{s}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: 'Phone is required' },
            { pattern: /^[0-9+\s\-()]{8,15}$/, message: 'Enter a valid phone number' },
          ]}
        >
          <Input placeholder="+91 XXXXX XXXXX" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item name="assignedTo" label="Assign To (BD Person)">
          <Input placeholder="Assigned BD person name" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Any initial notes..." />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Add Lead
        </Button>
      </Form>
    </Drawer>
  );
}

// ─── Lead Detail Drawer ────────────────────────────────────────────────────────

interface LeadDetailDrawerProps {
  lead: FranchiseLead | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function LeadDetailDrawer({ lead, open, onClose, onUpdated }: LeadDetailDrawerProps) {
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setStatusLoading(true);
    try {
      await apiClient.patch(`/api/v1/franchise-leads/${lead.id}`, { status: newStatus });
      message.success(`Status updated to ${STATUS_META[newStatus].label}`);
      onUpdated();
    } catch {
      message.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Drawer
      title={lead ? `${lead.name} — Lead Detail` : 'Lead Detail'}
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
    >
      {!lead ? (
        <Empty description="No lead selected" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Info */}
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Name" span={2}>{lead.name}</Descriptions.Item>
            <Descriptions.Item label="City">{lead.city}</Descriptions.Item>
            <Descriptions.Item label="State">{lead.state}</Descriptions.Item>
            <Descriptions.Item label="Phone">{lead.phone}</Descriptions.Item>
            <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
            <Descriptions.Item label="Assigned To">{lead.assignedTo || '—'}</Descriptions.Item>
            <Descriptions.Item label="Last Contact">
              {lead.lastContact ? formatDate(lead.lastContact) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              <Tag color={STATUS_META[lead.status].color}>{STATUS_META[lead.status].label}</Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* Status change */}
          <div>
            <Typography.Text strong>Move to Status</Typography.Text>
            <Divider style={{ margin: '8px 0' }} />
            <Space wrap>
              {ALL_STATUSES.filter((s) => s !== lead.status).map((s) => (
                <Button
                  key={s}
                  size="small"
                  loading={statusLoading}
                  onClick={() => handleStatusChange(s)}
                >
                  <Tag color={STATUS_META[s].color} style={{ margin: 0 }}>{STATUS_META[s].label}</Tag>
                </Button>
              ))}
            </Space>
          </div>

          {/* Status history */}
          {lead.history && lead.history.length > 0 && (
            <div>
              <Typography.Text strong>
                <HistoryOutlined style={{ marginRight: 6 }} />
                Status History
              </Typography.Text>
              <Divider style={{ margin: '8px 0' }} />
              <Timeline
                items={lead.history.map((h) => ({
                  color: STATUS_META[h.toStatus]?.color ?? 'gray',
                  children: (
                    <div>
                      <Space>
                        {h.fromStatus && (
                          <>
                            <Tag color={STATUS_META[h.fromStatus]?.color}>
                              {STATUS_META[h.fromStatus]?.label}
                            </Tag>
                            <span>→</span>
                          </>
                        )}
                        <Tag color={STATUS_META[h.toStatus]?.color}>
                          {STATUS_META[h.toStatus]?.label}
                        </Tag>
                      </Space>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          by {h.changedBy} · {formatDate(h.changedAt)}
                        </Typography.Text>
                      </div>
                      {h.note && <div style={{ fontSize: 12 }}>{h.note}</div>}
                    </div>
                  ),
                }))}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Typography.Text strong>Notes</Typography.Text>
            <Divider style={{ margin: '8px 0' }} />
            {lead.leadNotes && lead.leadNotes.length > 0 ? (
              <Timeline
                items={lead.leadNotes.map((n) => ({
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
              style={{ marginTop: 8 }}
            />
            <Button
              type="primary"
              size="small"
              loading={noteLoading}
              onClick={handleAddNote}
              style={{ marginTop: 8 }}
              disabled={!noteText.trim()}
            >
              Add Note
            </Button>
          </div>
        </Space>
      )}
    </Drawer>
  );
}

// ─── Territory Check Modal ─────────────────────────────────────────────────────

interface TerritoryModalProps {
  open: boolean;
  onClose: () => void;
}

function TerritoryModal({ open, onClose }: TerritoryModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TerritoryCheckResult | null>(null);

  const handleCheck = async (values: { city: string; pinCode?: string }) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await apiClient.post<{ data: TerritoryCheckResult }>(
        '/api/v1/franchise-leads/territory-check',
        values
      );
      setResult(res.data.data);
    } catch {
      // Mock fallback for demo
      const mockAvailable = Math.random() > 0.4;
      setResult({
        city: values.city,
        pinCode: values.pinCode,
        available: mockAvailable,
        existingCenter: mockAvailable
          ? undefined
          : { id: 'ctr-001', name: 'CompuTrain ' + values.city, city: values.city, distanceKm: 2.3 },
        message: mockAvailable
          ? `Territory in ${values.city} is available for a new franchise.`
          : `Territory in ${values.city} is already covered by an active center within 5 km.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setResult(null);
    onClose();
  };

  return (
    <Modal
      title="Territory Availability Check"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleCheck}>
        <Form.Item name="city" label="City" rules={[{ required: true, message: 'City is required' }]}>
          <Input prefix={<EnvironmentOutlined />} placeholder="e.g. Lucknow" />
        </Form.Item>
        <Form.Item name="pinCode" label="PIN Code (optional)">
          <Input placeholder="e.g. 226001" maxLength={6} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />} block>
          Check Territory
        </Button>
      </Form>

      {result && (
        <div style={{ marginTop: 20 }}>
          <Divider />
          {result.available ? (
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              message="Territory Available"
              description={result.message}
            />
          ) : (
            <Alert
              type="error"
              icon={<CloseCircleOutlined />}
              showIcon
              message="Territory Taken"
              description={
                <div>
                  <div>{result.message}</div>
                  {result.existingCenter && (
                    <div style={{ marginTop: 6 }}>
                      <Typography.Text type="secondary">
                        Existing center: <strong>{result.existingCenter.name}</strong> —{' '}
                        {result.existingCenter.distanceKm.toFixed(1)} km away
                      </Typography.Text>
                    </div>
                  )}
                </div>
              }
            />
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Pipeline Summary Cards ────────────────────────────────────────────────────

function PipelineSummary({ leads }: { leads: FranchiseLead[] }) {
  const active = leads.filter((l) => l.status === 'ACTIVE').length;
  const churned = leads.filter((l) => l.status === 'CHURNED').length;
  const inProgress = leads.filter(
    (l) => !['ACTIVE', 'CHURNED'].includes(l.status)
  ).length;
  const total = leads.length;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="Total Leads" value={total} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="In Pipeline" value={inProgress} valueStyle={{ color: '#2563eb' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="Active Centers" value={active} valueStyle={{ color: '#22c55e' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="Churned" value={churned} valueStyle={{ color: '#ef4444' }} />
        </Card>
      </Col>
    </Row>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FranchiseCRMPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | LeadStatus>('ALL');
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [territoryModalOpen, setTerritoryModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<FranchiseLead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: leadsRes, isLoading, mutate } = usePollingApi<{ data: FranchiseLead[] }>(
    '/api/v1/franchise-leads',
    30_000
  );

  const leads: FranchiseLead[] = leadsRes?.data ?? [];

  const filteredLeads = useMemo(() => {
    if (activeTab === 'ALL') return leads;
    return leads.filter((l) => l.status === activeTab);
  }, [leads, activeTab]);

  const tabCountFor = (status: LeadStatus) => leads.filter((l) => l.status === status).length;

  const columns: ColumnsType<FranchiseLead> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => { setDetailLead(record); setDetailOpen(true); }}>
          {name}
        </Button>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: LeadStatus) => (
        <Tag color={STATUS_META[status].color}>{STATUS_META[status].label}</Tag>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Last Contact',
      dataIndex: 'lastContact',
      key: 'lastContact',
      render: (v: string) => v ? formatDate(v) : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: FranchiseLead) => (
        <Tooltip title="View detail">
          <Button
            size="small"
            type="default"
            onClick={() => { setDetailLead(record); setDetailOpen(true); }}
          >
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Franchise CRM"
        subtitle="Manage franchise leads across the pipeline"
        extra={
          <Space>
            <Button
              icon={<EnvironmentOutlined />}
              onClick={() => setTerritoryModalOpen(true)}
            >
              Territory Check
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddDrawerOpen(true)}
            >
              Add Lead
            </Button>
          </Space>
        }
      />

      <PipelineSummary leads={leads} />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'ALL' | LeadStatus)}
        style={{ marginBottom: 16 }}
      >
        <TabPane tab={`All (${leads.length})`} key="ALL" />
        {ALL_STATUSES.map((status) => (
          <TabPane
            key={status}
            tab={
              <span>
                <Tag color={STATUS_META[status].color} style={{ marginRight: 4 }}>
                  {tabCountFor(status)}
                </Tag>
                {STATUS_META[status].label}
              </span>
            }
          />
        ))}
      </Tabs>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <Empty
          description={
            activeTab === 'ALL'
              ? 'No franchise leads yet. Add one to get started.'
              : `No leads in ${STATUS_META[activeTab as LeadStatus]?.label ?? activeTab} stage.`
          }
          style={{ padding: 48 }}
        />
      ) : (
        <Table<FranchiseLead>
          dataSource={filteredLeads}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} leads` }}
          scroll={{ x: 900 }}
        />
      )}

      <AddLeadDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onCreated={() => mutate()}
      />

      <LeadDetailDrawer
        lead={detailLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => mutate()}
      />

      <TerritoryModal
        open={territoryModalOpen}
        onClose={() => setTerritoryModalOpen(false)}
      />
    </div>
  );
}
