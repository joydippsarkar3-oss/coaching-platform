import React, { useState } from 'react';
import {
  Card, Button, Space, Tag, message, Modal, Form, Input, Select,
  Switch, Row, Col, Typography, Divider, Checkbox, Table
} from 'antd';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { usersApi } from '@/api/endpoints/users';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { HoStaff, ActiveSession } from '@/types/models';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import { PERMISSION_MODULES, type PermissionModule } from '@/types/models';
import { formatDateTime } from '@/utils/dates';

const { Option } = Select;

export default function UsersRoles() {
  const { t } = useTranslation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [require2Fa, setRequire2Fa] = useState(false);
  const [inviteForm] = Form.useForm();

  const { data: staffData, mutate: mutateStaff } = usePollingApi<PaginatedResponse<HoStaff>>(
    '/api/v1/users/staff', 30_000
  );
  const { data: sessionsData, mutate: mutateSessions } = usePollingApi<ApiResponse<ActiveSession[]>>(
    '/api/v1/users/sessions', 30_000
  );

  const staff = staffData?.data ?? [];
  const sessions = sessionsData?.data ?? [];

  const handleInvite = async (values: { email: string; role: string; permissions: string[] }) => {
    try {
      await usersApi.inviteStaff(values);
      message.success('Invitation sent');
      mutateStaff();
      setInviteOpen(false);
      inviteForm.resetFields();
    } catch {
      message.error('Invite failed');
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    Modal.confirm({
      title: 'Revoke this session?',
      onOk: async () => {
        await usersApi.revokeSession(sessionId);
        message.success('Session revoked');
        mutateSessions();
      },
    });
  };

  const handleToggle2Fa = async (enabled: boolean) => {
    try {
      await usersApi.require2Fa(enabled);
      setRequire2Fa(enabled);
      message.success(enabled ? '2FA required for all HO staff' : '2FA requirement removed');
    } catch {
      message.error('Update failed');
    }
  };

  const staffColumns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.email'), dataIndex: 'email', key: 'email' },
    { title: t('users.role'), dataIndex: 'role', key: 'role', render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: t('users.lastLogin'),
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (v?: string) => v ? formatDateTime(v) : '—',
    },
    {
      title: t('users.twoFa'),
      dataIndex: 'twoFaEnabled',
      key: 'twoFa',
      render: (v: boolean) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} label={v ? 'Enabled' : 'Disabled'} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'active',
      key: 'active',
      render: (v: boolean) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: HoStaff) => (
        <Button
          size="small"
          danger
          disabled={r.role === 'SUPER_ADMIN'}
          onClick={async () => {
            Modal.confirm({
              title: 'Deactivate this staff member?',
              onOk: async () => {
                await usersApi.deactivateStaff(r.id);
                message.success('Staff deactivated');
                mutateStaff();
              },
            });
          }}
        >
          Deactivate
        </Button>
      ),
    },
  ];

  const sessionColumns = [
    { title: t('users.device'), dataIndex: 'device', key: 'device' },
    { title: t('users.ip'), dataIndex: 'ip', key: 'ip' },
    {
      title: t('users.lastSeen'),
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: ActiveSession) => (
        <Button
          size="small"
          danger
          disabled={r.current}
          icon={<StopOutlined />}
          onClick={() => handleRevokeSession(r.id)}
        >
          {r.current ? 'Current' : t('users.revokeSession')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
            {t('users.inviteStaff')}
          </Button>
        }
      />

      {/* 2FA Settings Card */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography.Text strong>{t('users.require2Fa')}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              All HO staff must set up 2FA before accessing the panel.
            </Typography.Text>
          </div>
          <Switch
            checked={require2Fa}
            onChange={handleToggle2Fa}
            checkedChildren="Required"
            unCheckedChildren="Optional"
          />
        </div>
      </Card>

      {/* Staff Table */}
      <Card title="HO Staff Accounts" className="mb-4">
        <DataTable<HoStaff>
          dataSource={staff}
          columns={staffColumns}
          rowKey="id"
          exportFilename="ho-staff"
          exportColumns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'twoFaEnabled', label: '2FA Enabled' },
            { key: 'active', label: 'Active' },
          ]}
        />
      </Card>

      {/* Active Sessions */}
      <Card title={t('users.activeSessions')}>
        <Table<ActiveSession>
          dataSource={sessions}
          columns={sessionColumns}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Permission Presets */}
      <Card title={t('users.permissionPresets')} className="mt-4">
        <Row gutter={16}>
          {['Catalog Manager', 'Finance Officer', 'Support Staff', 'Comms Manager'].map((preset) => (
            <Col key={preset} xs={24} sm={12} md={6}>
              <Card size="small" title={preset}>
                {PERMISSION_MODULES.map((mod) => (
                  <div key={mod} className="flex items-center gap-2 mb-1">
                    <Checkbox
                      defaultChecked={['Catalog Manager'].includes(preset) && mod === 'CATALOG'}
                    />
                    <span className="text-sm">{mod}</span>
                  </div>
                ))}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Invite Modal */}
      <Modal
        title={t('users.inviteStaff')}
        open={inviteOpen}
        onCancel={() => { setInviteOpen(false); inviteForm.resetFields(); }}
        onOk={() => inviteForm.submit()}
        width={560}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInvite}>
          <Form.Item name="email" label={t('common.email')} rules={[{ required: true }, { type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label={t('users.role')} rules={[{ required: true }]} initialValue="HO_STAFF">
            <Select>
              <Option value="SUPER_ADMIN">SUPER_ADMIN</Option>
              <Option value="HO_STAFF">HO_STAFF</Option>
            </Select>
          </Form.Item>
          <Form.Item name="permissions" label={t('users.permissionPresets')}>
            <Checkbox.Group>
              <Row gutter={[8, 8]}>
                {PERMISSION_MODULES.map((mod) => (
                  <Col key={mod} span={12}>
                    <Checkbox value={mod}>{mod}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
