import React, { useState } from 'react';
import {
  Tabs, Table, Tag, Badge, Button, Drawer, Select, Space, Typography,
  Input, Divider, Card, Row, Col, Progress, Tooltip, Avatar, message,
  Spin,
} from 'antd';
import {
  ClockCircleOutlined, UserOutlined, SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePollingApi } from '@/hooks/usePollingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';

const { TabPane } = Tabs;
const { TextArea } = Input;

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

interface TicketMessage {
  id: string;
  author: string;
  authorType: 'STAFF' | 'CENTER';
  text: string;
  sentAt: string;
}

interface Ticket {
  id: string;
  ticketNo: string;
  centerId: string;
  centerName: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

interface CenterHealth {
  centerId: string;
  centerName: string;
  loginsLast30Days: number;
  admissionsTrend: 'POSITIVE' | 'FLAT' | 'DECLINING';
  duesRatioPct: number;
  openTickets: number;
  churnRisk: boolean;
}

interface HoStaffBasic {
  id: string;
  name: string;
}

// ─── SLA helpers ──────────────────────────────────────────────────────────────

const SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  URGENT: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'default',
};

function slaStatus(ticket: Ticket) {
  const slaMs = SLA_HOURS[ticket.priority] * 3_600_000;
  const created = new Date(ticket.createdAt).getTime();
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : Date.now();
    const withinSla = resolved - created <= slaMs;
    return { breached: !withinSla, label: withinSla ? 'Within SLA' : 'Breached', remaining: '' };
  }
  const remaining = slaMs - (Date.now() - created);
  if (remaining <= 0) {
    const over = Math.abs(remaining);
    const h = Math.floor(over / 3_600_000);
    const m = Math.floor((over % 3_600_000) / 60_000);
    return { breached: true, label: 'SLA Breached', remaining: `${h}h ${m}m over` };
  }
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  return { breached: false, label: 'Within SLA', remaining: `${h}h ${m}m left` };
}

// ─── Health helpers ───────────────────────────────────────────────────────────

function computeHealthScore(h: CenterHealth): number {
  let score = 0;
  score += Math.min(25, Math.round((h.loginsLast30Days / 30) * 25));
  score += h.admissionsTrend === 'POSITIVE' ? 25 : h.admissionsTrend === 'FLAT' ? 15 : 0;
  score += h.duesRatioPct < 10 ? 25 : h.duesRatioPct <= 30 ? 15 : 0;
  score += h.openTickets === 0 ? 25 : h.openTickets <= 2 ? 15 : 0;
  return score;
}

function healthColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

// ─── Center Health Panel ──────────────────────────────────────────────────────

function CenterHealthPanel() {
  const { data: healthData } = usePollingApi<CenterHealth[]>('/api/v1/centers/health', 60_000);
  return (
    <Card title="Center Health Scores" size="small" style={{ maxHeight: 520, overflowY: 'auto' }}>
      {!healthData ? (
        <Spin />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {healthData.map((h) => {
            const score = computeHealthScore(h);
            const color = healthColor(score);
            return (
              <div key={h.centerId} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div className="flex items-center justify-between">
                  <Typography.Text strong style={{ fontSize: 13 }}>{h.centerName}</Typography.Text>
                  <Space size={4}>
                    {h.churnRisk && (
                      <Tooltip title="Score below 40 for 2+ consecutive months">
                        <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>CHURN RISK</Tag>
                      </Tooltip>
                    )}
                    <Typography.Text strong style={{ color, fontSize: 15 }}>{score}</Typography.Text>
                  </Space>
                </div>
                <Progress
                  percent={score}
                  showInfo={false}
                  strokeColor={color}
                  size="small"
                  style={{ margin: '4px 0 2px' }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Logins: {h.loginsLast30Days} · Dues: {h.duesRatioPct}% overdue · Open tickets: {h.openTickets}
                </Typography.Text>
              </div>
            );
          })}
        </Space>
      )}
    </Card>
  );
}

// ─── Ticket Detail Content ────────────────────────────────────────────────────

function TicketDetailContent({
  ticket,
  staffList,
  onUpdated,
}: {
  ticket: Ticket | null;
  staffList: HoStaffBasic[];
  onUpdated: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <Typography.Text type="secondary">Select a ticket to view details</Typography.Text>
      </div>
    );
  }

  const sla = slaStatus(ticket);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await apiClient.post(`/api/v1/tickets/${ticket.id}/messages`, { text: replyText });
      message.success('Reply sent');
      setReplyText('');
      onUpdated();
    } catch {
      message.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    setStatusLoading(true);
    try {
      await apiClient.patch(`/api/v1/tickets/${ticket.id}`, { status });
      message.success('Status updated');
      onUpdated();
    } catch {
      message.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await apiClient.patch(`/api/v1/tickets/${ticket.id}`, { assignedTo: userId });
      message.success('Assigned');
      onUpdated();
    } catch {
      message.error('Failed to assign');
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Typography.Text strong style={{ fontSize: 15 }}>{ticket.subject}</Typography.Text>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Tag>{ticket.category}</Tag>
          <Tag color={PRIORITY_COLOR[ticket.priority]}>{ticket.priority}</Tag>
          <Tag color={sla.breached ? 'red' : 'green'} icon={<ClockCircleOutlined />}>
            {sla.remaining || sla.label}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {ticket.centerName} · #{ticket.ticketNo}
          </Typography.Text>
        </div>
      </div>
      <Row gutter={8}>
        <Col span={12}>
          <Select
            value={ticket.status}
            onChange={handleStatusChange}
            loading={statusLoading}
            style={{ width: '100%' }}
            size="small"
          >
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => (
              <Select.Option key={s} value={s}>{s.replace('_', ' ')}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <Select
            placeholder="Assign to..."
            value={ticket.assignedTo}
            onChange={handleAssign}
            style={{ width: '100%' }}
            size="small"
          >
            {staffList.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Divider style={{ margin: '4px 0' }} />
      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.authorType === 'STAFF' ? 'row-reverse' : 'row',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <Avatar size={28} icon={<UserOutlined />} />
            <div
              style={{
                background: msg.authorType === 'STAFF' ? '#eff6ff' : '#f5f5f5',
                borderRadius: 8,
                padding: '6px 10px',
                maxWidth: '80%',
              }}
            >
              <Typography.Text strong style={{ fontSize: 11 }}>{msg.author}</Typography.Text>
              <div style={{ fontSize: 13 }}>{msg.text}</div>
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {formatDate(msg.sentAt)}
              </Typography.Text>
            </div>
          </div>
        ))}
      </div>
      <div>
        <TextArea
          rows={2}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type a reply..."
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={replying}
          onClick={handleReply}
          disabled={!replyText.trim()}
          className="mt-2"
        >
          Send Reply
        </Button>
      </div>
    </Space>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportDeskPage() {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { data: tickets = [], mutate } = usePollingApi<Ticket[]>('/api/v1/tickets', 30_000);
  const { data: staffList = [] } = usePollingApi<HoStaffBasic[]>('/api/v1/users?role=HO_STAFF&minimal=true', 60_000);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Ticket',
      key: 'ticketNo',
      width: 90,
      render: (_v, r) => <Typography.Text style={{ fontSize: 12 }}>#{r.ticketNo}</Typography.Text>,
    },
    {
      title: 'Center',
      dataIndex: 'centerName',
      key: 'centerName',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (v, r) => (
        <Button type="link" style={{ padding: 0, textAlign: 'left', height: 'auto', whiteSpace: 'normal' }}
          onClick={() => { setSelectedTicket(r); setMobileDrawerOpen(true); }}
        >
          {v}
        </Button>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v: TicketPriority) => <Tag color={PRIORITY_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'SLA',
      key: 'sla',
      width: 130,
      render: (_v, r) => {
        const sla = slaStatus(r);
        return (
          <Space size={4}>
            {sla.breached && (
              <Badge
                status="error"
                style={{ animation: 'pulse 1s infinite' }}
              />
            )}
            <Typography.Text
              type={sla.breached ? 'danger' : undefined}
              style={{ fontSize: 12 }}
            >
              {sla.remaining || sla.label}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{formatDate(v)}</Typography.Text>,
    },
  ];

  return (
    <div>
      <PageHeader title="Support Desk" subtitle="Ticket queue and center health" />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            size="small"
            title={
              <Space wrap>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 130 }}
                  size="small"
                >
                  <Select.Option value="ALL">All Status</Select.Option>
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => (
                    <Select.Option key={s} value={s}>{s.replace('_', ' ')}</Select.Option>
                  ))}
                </Select>
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: 130 }}
                  size="small"
                >
                  <Select.Option value="ALL">All Priority</Select.Option>
                  {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as TicketPriority[]).map((p) => (
                    <Select.Option key={p} value={p}>{p}</Select.Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Table<Ticket>
              dataSource={filtered}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 15 }}
              rowClassName={(r) => slaStatus(r).breached ? 'ant-table-row-danger' : ''}
              onRow={(r) => ({ onClick: () => { setSelectedTicket(r); } })}
            />
          </Card>

          {/* Desktop detail panel */}
          <div className="mt-4" style={{ display: window.innerWidth >= 1024 ? 'block' : 'none' }}>
            <Card size="small" title={selectedTicket ? `Ticket #${selectedTicket.ticketNo}` : 'Ticket Detail'}>
              <TicketDetailContent
                ticket={selectedTicket}
                staffList={staffList}
                onUpdated={() => mutate()}
              />
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <CenterHealthPanel />
        </Col>
      </Row>

      {/* Mobile detail drawer */}
      <Drawer
        title={selectedTicket ? `#${selectedTicket.ticketNo} — ${selectedTicket.subject}` : 'Ticket Detail'}
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        placement="bottom"
        height="80vh"
      >
        <TicketDetailContent
          ticket={selectedTicket}
          staffList={staffList}
          onUpdated={() => { mutate(); }}
        />
      </Drawer>
    </div>
  );
}
