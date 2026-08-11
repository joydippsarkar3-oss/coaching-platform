import React, { useState } from 'react';
import {
  Card, Button, Tabs, Space, Tag, message, Modal, Form, Input, Select,
  Switch, Row, Col, Typography, Divider, Statistic
} from 'antd';
import { PlusOutlined, SendOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { commsApi } from '@/api/endpoints/comms';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { WhatsAppTemplate, Broadcast, MetaApprovalStatus, WhatsAppChannel } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';
import { formatDateTime } from '@/utils/dates';

const { TabPane } = Tabs;
const { Option } = Select;

export default function CommsCenter() {
  const { t } = useTranslation();
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [broadcastDrawerOpen, setBroadcastDrawerOpen] = useState(false);
  const [broadcastScope, setBroadcastScope] = useState<'NETWORK' | 'SEGMENT' | 'CENTER'>('NETWORK');
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [form] = Form.useForm();
  const [broadcastForm] = Form.useForm();

  const { data: templatesData, mutate: mutateTemplates } = usePollingApi<PaginatedResponse<WhatsAppTemplate>>(
    '/api/v1/comms/templates', 30_000
  );
  const { data: broadcastsData, mutate: mutateBroadcasts } = usePollingApi<PaginatedResponse<Broadcast>>(
    '/api/v1/comms/broadcasts', 30_000
  );

  const templates = templatesData?.data ?? [];
  const broadcasts = broadcastsData?.data ?? [];

  const handleSaveTemplate = async (values: Record<string, unknown>) => {
    try {
      await commsApi.createTemplate(values as Partial<WhatsAppTemplate>);
      message.success('Template created');
      mutateTemplates();
      setTemplateDrawerOpen(false);
    } catch {
      message.error('Save failed');
    }
  };

  const handleSubmitToMeta = async (id: string) => {
    try {
      await commsApi.submitToMeta(id);
      message.success('Submitted to Meta for approval');
      mutateTemplates();
    } catch {
      message.error('Submit failed');
    }
  };

  const handleCreateBroadcast = async (values: Record<string, unknown>) => {
    try {
      const res = await commsApi.createBroadcast(values as Partial<Broadcast>);
      message.success('Broadcast created');
      if (!values.scheduledAt) {
        // immediate send
        await commsApi.sendBroadcast((res as { id: string }).id);
        message.success('Broadcast sent');
      }
      mutateBroadcasts();
      setBroadcastDrawerOpen(false);
      broadcastForm.resetFields();
    } catch {
      message.error('Failed');
    }
  };

  const templateColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Channel',
      dataIndex: 'category',
      key: 'category',
      render: (v: WhatsAppChannel) => (
        <Tag color={v === 'MARKETING' ? 'purple' : 'blue'}>{t(`comms.channel.${v}`)}</Tag>
      ),
    },
    { title: 'Language', dataIndex: 'language', key: 'language', render: (v: string) => v.toUpperCase() },
    {
      title: 'Meta Status',
      dataIndex: 'metaStatus',
      key: 'metaStatus',
      render: (v: MetaApprovalStatus) => <StatusBadge status={v} label={t(`comms.metaStatus.${v}`)} />,
    },
    {
      title: `Cost (${t('comms.perMsg')})`,
      dataIndex: 'costPerMsg',
      key: 'costPerMsg',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: WhatsAppTemplate) => (
        <Space>
          {r.metaStatus === 'PENDING' && (
            <Button size="small" onClick={() => handleSubmitToMeta(r.id)}>Submit to Meta</Button>
          )}
        </Space>
      ),
    },
  ];

  const broadcastColumns = [
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      render: (v: string) => <Tag>{t(`comms.scope.${v}`)}</Tag>,
    },
    { title: 'Sent', dataIndex: 'sent', key: 'sent' },
    { title: 'Delivered', dataIndex: 'delivered', key: 'delivered' },
    { title: 'Read', dataIndex: 'read', key: 'read' },
    { title: 'Failed', dataIndex: 'failed', key: 'failed', render: (v: number) => v > 0 ? <span style={{ color: '#ef4444' }}>{v}</span> : 0 },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('comms.title')}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setTemplateDrawerOpen(true)}>
              {t('comms.newTemplate')}
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={() => setBroadcastDrawerOpen(true)}>
              New Broadcast
            </Button>
          </Space>
        }
      />

      <Tabs defaultActiveKey="templates">
        <TabPane tab={t('comms.templates')} key="templates">
          <DataTable<WhatsAppTemplate>
            dataSource={templates}
            columns={templateColumns}
            rowKey="id"
            exportFilename="whatsapp-templates"
            exportColumns={[
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Channel' },
              { key: 'language', label: 'Language' },
              { key: 'metaStatus', label: 'Meta Status' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('comms.broadcasts')} key="broadcasts">
          <DataTable<Broadcast>
            dataSource={broadcasts}
            columns={broadcastColumns}
            rowKey="id"
            exportFilename="broadcasts"
            exportColumns={[
              { key: 'scope', label: 'Scope' },
              { key: 'sent', label: 'Sent' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'read', label: 'Read' },
              { key: 'failed', label: 'Failed' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('comms.analytics')} key="analytics">
          <Row gutter={16}>
            {templates.map((tpl) => (
              <Col key={tpl.id} xs={24} sm={12} lg={6}>
                <Card size="small" title={tpl.name} extra={<StatusBadge status={tpl.metaStatus} />}>
                  <Row gutter={8}>
                    <Col span={12}><Statistic title="Sent" value={0} valueStyle={{ fontSize: 16 }} /></Col>
                    <Col span={12}><Statistic title="Read" value={0} valueStyle={{ fontSize: 16 }} /></Col>
                  </Row>
                  <div className="mt-2">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Cost: <MoneyDisplay paise={tpl.costPerMsg} /> / msg
                    </Typography.Text>
                  </div>
                </Card>
              </Col>
            ))}
            {templates.length === 0 && (
              <Col span={24}>
                <div className="text-center py-8 text-gray-400">No templates yet</div>
              </Col>
            )}
          </Row>
        </TabPane>
      </Tabs>

      {/* Template Drawer */}
      <Modal
        title={t('comms.newTemplate')}
        open={templateDrawerOpen}
        onCancel={() => setTemplateDrawerOpen(false)}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTemplate}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Channel" rules={[{ required: true }]} initialValue="UTILITY">
                <Select>
                  <Option value="UTILITY">{t('comms.channel.UTILITY')}</Option>
                  <Option value="MARKETING">{t('comms.channel.MARKETING')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="language" label="Language" initialValue="en">
                <Select>
                  <Option value="en">English</Option>
                  <Option value="hi">Hindi</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="body" label="Body" rules={[{ required: true }]} extra='Use {{variable}} syntax for variables'>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="submitToMeta" label="Submit to Meta" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Broadcast Drawer */}
      <Modal
        title="New Broadcast"
        open={broadcastDrawerOpen}
        onCancel={() => { setBroadcastDrawerOpen(false); broadcastForm.resetFields(); }}
        onOk={() => broadcastForm.submit()}
        width={560}
      >
        {weeklyCount >= 2 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-2 items-start">
            <WarningOutlined style={{ color: '#f59e0b', marginTop: 2 }} />
            <Typography.Text style={{ color: '#92400e' }}>{t('comms.frequencyWarning')}</Typography.Text>
          </div>
        )}
        <Form form={broadcastForm} layout="vertical" onFinish={handleCreateBroadcast}>
          <Form.Item name="templateId" label="Template" rules={[{ required: true }]}>
            <Select>
              {templates.filter((t) => t.metaStatus === 'APPROVED').map((tpl) => (
                <Option key={tpl.id} value={tpl.id}>{tpl.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="scope" label="Recipient Scope" rules={[{ required: true }]} initialValue="NETWORK">
            <Select onChange={(v) => setBroadcastScope(v)}>
              <Option value="NETWORK">{t('comms.scope.NETWORK')}</Option>
              <Option value="SEGMENT">{t('comms.scope.SEGMENT')}</Option>
              <Option value="CENTER">{t('comms.scope.CENTER')}</Option>
            </Select>
          </Form.Item>
          {broadcastScope === 'SEGMENT' && (
            <Form.Item name="packageTiers" label="Package Tiers">
              <Select mode="multiple">
                {['BASIC', 'STANDARD', 'PREMIUM', 'ELITE'].map((t) => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="scheduledAt" label="Schedule (leave empty for immediate)">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
