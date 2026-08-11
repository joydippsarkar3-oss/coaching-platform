import React, { useState } from 'react';
import {
  Tabs, Card, Button, Drawer, Tag, Row, Col, Descriptions, Checkbox,
  Modal, Form, Input, Select, Upload, message, Space, Spin, Typography, Steps, Divider
} from 'antd';
import {
  PlusOutlined, UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { centersApi } from '@/api/endpoints/centers';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { Center, CenterStatus, CenterKycChecklist } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/utils/dates';

const { TabPane } = Tabs;
const { confirm } = Modal;

type Pipeline = CenterStatus;

const PIPELINE_TABS: { key: Pipeline; label: string }[] = [
  { key: 'PROSPECT', label: 'Prospect' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'FROZEN', label: 'Frozen' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function CenterLifecycle() {
  const { t } = useTranslation();
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'freeze' | 'unfreeze' | 'close'; open: boolean } | null>(null);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ loginUrl: string; username: string; tempPassword: string } | null>(null);
  const [reasonForm] = Form.useForm();
  const [kyc, setKyc] = useState<CenterKycChecklist | null>(null);

  const { data: centersData, mutate } = usePollingApi<PaginatedResponse<Center>>(
    '/api/v1/centers', 30_000
  );
  const centers = centersData?.data ?? [];

  const openDetail = async (center: Center) => {
    setSelectedCenter(center);
    setDrawerOpen(true);
    setProvisionResult(null);
    try {
      const res = await centersApi.getKyc(center.id);
      setKyc(res.data);
    } catch {
      setKyc(null);
    }
  };

  const handleProvision = async () => {
    if (!selectedCenter) return;
    setProvisionLoading(true);
    try {
      const res = await centersApi.provision(selectedCenter.id);
      setProvisionResult(res.data);
      message.success(t('centers.provisionSuccess'));
      mutate();
    } catch (err: unknown) {
      message.error('Provisioning failed');
    } finally {
      setProvisionLoading(false);
    }
  };

  const handleAction = async (values: { reason: string }) => {
    if (!selectedCenter || !actionModal) return;
    try {
      if (actionModal.type === 'freeze') await centersApi.freeze(selectedCenter.id, values.reason);
      if (actionModal.type === 'unfreeze') await centersApi.unfreeze(selectedCenter.id, values.reason);
      if (actionModal.type === 'close') await centersApi.close(selectedCenter.id, values.reason);
      message.success('Action completed');
      mutate();
      setActionModal(null);
      reasonForm.resetFields();
      setDrawerOpen(false);
    } catch {
      message.error('Action failed');
    }
  };

  const kycAllGreen = kyc
    ? Object.values(kyc).every((v) => v === true || typeof v !== 'boolean' || v)
    : false;

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Center) => (
        <Button type="link" onClick={() => openDetail(r)}>{v}</Button>
      ),
    },
    { title: t('dashboard.leaderboard.city'), dataIndex: 'city', key: 'city' },
    { title: 'Owner', dataIndex: 'ownerName', key: 'ownerName' },
    { title: 'Package', dataIndex: 'packageTier', key: 'packageTier' },
    { title: 'Admissions', dataIndex: 'admissionsThisMonth', key: 'admissions' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: CenterStatus) => <StatusBadge status={v} />,
    },
    {
      title: 'Agreement Expiry',
      dataIndex: 'agreementExpiryDate',
      key: 'agExpiry',
      render: (v: string) => {
        const daysLeft = Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
        return (
          <Space>
            {formatDate(v)}
            {daysLeft < 30 && <Tag color="red">P1 Expiring in {daysLeft}d</Tag>}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('centers.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('centers.newApplication')}
          </Button>
        }
      />

      <Tabs defaultActiveKey="ACTIVE">
        {PIPELINE_TABS.map(({ key, label }) => {
          const filtered = centers.filter((c) => c.status === key);
          return (
            <TabPane tab={`${label} (${filtered.length})`} key={key}>
              <DataTable<Center>
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                exportFilename={`centers-${key.toLowerCase()}`}
                exportColumns={[
                  { key: 'code', label: 'Code' },
                  { key: 'name', label: 'Name' },
                  { key: 'city', label: 'City' },
                  { key: 'ownerName', label: 'Owner' },
                  { key: 'packageTier', label: 'Package' },
                  { key: 'status', label: 'Status' },
                ]}
              />
            </TabPane>
          );
        })}
      </Tabs>

      {/* Center Detail Drawer */}
      <Drawer
        title={selectedCenter ? `${selectedCenter.name} — ${selectedCenter.code}` : 'Center Detail'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        extra={
          selectedCenter && (
            <Space>
              {selectedCenter.status === 'ACTIVE' && (
                <Button danger onClick={() => setActionModal({ type: 'freeze', open: true })}>
                  {t('centers.freeze')}
                </Button>
              )}
              {selectedCenter.status === 'FROZEN' && (
                <Button
                  type="primary"
                  onClick={() => setActionModal({ type: 'unfreeze', open: true })}
                >
                  {t('centers.unfreeze')}
                </Button>
              )}
              {selectedCenter.status !== 'CLOSED' && (
                <Button danger onClick={() => setActionModal({ type: 'close', open: true })}>
                  {t('centers.close')}
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedCenter && (
          <Tabs defaultActiveKey="profile">
            <TabPane tab={t('centers.tabs.profile')} key="profile">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Name">{selectedCenter.name}</Descriptions.Item>
                <Descriptions.Item label="Code">{selectedCenter.code}</Descriptions.Item>
                <Descriptions.Item label="City">{selectedCenter.city}</Descriptions.Item>
                <Descriptions.Item label="State">{selectedCenter.state}</Descriptions.Item>
                <Descriptions.Item label="Owner">{selectedCenter.ownerName}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCenter.ownerEmail}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCenter.ownerPhone}</Descriptions.Item>
                <Descriptions.Item label="Package">{selectedCenter.packageTier}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <StatusBadge status={selectedCenter.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Enrolled">{formatDate(selectedCenter.enrollmentDate)}</Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab={t('centers.tabs.agreement')} key="agreement">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Agreement Expiry">
                    {formatDate(selectedCenter.agreementExpiryDate)}
                  </Descriptions.Item>
                </Descriptions>
                <Upload
                  accept=".pdf"
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      await centersApi.uploadAgreement(selectedCenter.id, file as File);
                      message.success('Agreement uploaded');
                      onSuccess?.({});
                    } catch {
                      onError?.(new Error('Upload failed'));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Agreement PDF</Button>
                </Upload>
              </Space>
            </TabPane>

            <TabPane tab={t('centers.tabs.package')} key="package">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Package Tier">{selectedCenter.packageTier}</Descriptions.Item>
                <Descriptions.Item label="Territory">{selectedCenter.territory}</Descriptions.Item>
                <Descriptions.Item label="Revenue MTD">
                  <MoneyDisplay paise={selectedCenter.revenueThisMonth} />
                </Descriptions.Item>
                <Descriptions.Item label="Collection %">
                  <Tag color={selectedCenter.collectionPct >= 80 ? 'green' : 'orange'}>
                    {selectedCenter.collectionPct}%
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab={t('centers.tabs.kyc')} key="kyc">
              {kyc ? (
                <div>
                  {(Object.keys(kyc) as (keyof CenterKycChecklist)[])
                    .filter((k) => k !== 'centerId')
                    .map((key) => (
                      <div key={key} className="flex items-center gap-2 mb-2">
                        {kyc[key] ? (
                          <CheckCircleOutlined style={{ color: '#22c55e' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ef4444' }} />
                        )}
                        <span>{t(`centers.kyc.${key}`)}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <Spin />
              )}
            </TabPane>

            <TabPane tab={t('centers.tabs.provision')} key="provision">
              <Space direction="vertical" style={{ width: '100%' }}>
                {!kycAllGreen && (
                  <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                    Complete all KYC items before provisioning
                  </Tag>
                )}
                {provisionResult ? (
                  <Card style={{ background: '#f0fdf4' }}>
                    <Typography.Text strong>Provision Successful!</Typography.Text>
                    <Descriptions column={1} size="small" className="mt-2">
                      <Descriptions.Item label="Login URL">{provisionResult.loginUrl}</Descriptions.Item>
                      <Descriptions.Item label="Username">{provisionResult.username}</Descriptions.Item>
                      <Descriptions.Item label="Temp Password">{provisionResult.tempPassword}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    disabled={!kycAllGreen || selectedCenter.provisioned}
                    loading={provisionLoading}
                    onClick={handleProvision}
                  >
                    {selectedCenter.provisioned ? 'Already Provisioned' : t('centers.provision')}
                  </Button>
                )}
              </Space>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Action Modal */}
      <Modal
        title={actionModal ? `Confirm: ${actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1)} Center` : ''}
        open={!!actionModal?.open}
        onCancel={() => { setActionModal(null); reasonForm.resetFields(); }}
        onOk={() => reasonForm.submit()}
        okButtonProps={{ danger: actionModal?.type !== 'unfreeze' }}
        okText="Confirm"
      >
        <Form form={reasonForm} layout="vertical" onFinish={handleAction}>
          <Form.Item
            name="reason"
            label={t('common.reason')}
            rules={[{ required: true, message: 'Reason is required' }, { min: 10, message: 'Reason must be at least 10 characters' }]}
          >
            <Input.TextArea rows={3} placeholder="Provide a detailed reason..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
