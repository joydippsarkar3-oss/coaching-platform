import React, { useState } from 'react';
import {
  Card, Button, Tabs, Space, Tag, message, Modal, Form, Input, Select,
  Progress, Steps, Upload, Row, Col, Divider, Typography
} from 'antd';
import { CheckOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { certificatesApi } from '@/api/endpoints/certificates';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { Certificate, CertificateTemplate, CertificateStatus, DocType } from '@/types/models';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import { formatDateTime } from '@/utils/dates';

const { TabPane } = Tabs;
const { Option } = Select;
const { Step } = Steps;

export default function CertificateAuthority() {
  const { t } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ issued: number; failed: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Certificate[]>([]);
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; cert: Certificate | null }>({ open: false, cert: null });
  const [importStep, setImportStep] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileId, setImportFileId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<unknown[]>([]);
  const [revokeForm] = Form.useForm();

  const { data: queueData, mutate } = usePollingApi<PaginatedResponse<Certificate>>(
    '/api/v1/certificates/queue', 30_000
  );
  const { data: templatesData } = usePollingApi<ApiResponse<CertificateTemplate[]>>(
    '/api/v1/certificate-templates', 60_000
  );

  const queue = queueData?.data ?? [];
  const templates = templatesData?.data ?? [];

  const handleBulkApprove = async () => {
    if (!selectedRowKeys.length) return;
    setBulkRunning(true);
    setBulkProgress(0);
    setBulkResult(null);

    // Simulate progress
    const interval = setInterval(() => {
      setBulkProgress((p) => Math.min(p + 15, 90));
    }, 400);

    try {
      const res = await certificatesApi.bulkApprove(selectedRowKeys as string[]) as ApiResponse<{ issued: number; failed: number }>;
      clearInterval(interval);
      setBulkProgress(100);
      setBulkResult(res.data);
      mutate();
      setSelectedRowKeys([]);
    } catch {
      clearInterval(interval);
      message.error('Bulk approve failed');
    } finally {
      setBulkRunning(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await certificatesApi.search(searchQuery) as ApiResponse<Certificate[]>;
    setSearchResults(res.data);
  };

  const handleRevoke = async (values: { reason: string }) => {
    if (!revokeModal.cert) return;
    try {
      await certificatesApi.revoke(revokeModal.cert.id, values.reason);
      message.success('Certificate revoked. Verify page updated immediately.');
      mutate();
      setRevokeModal({ open: false, cert: null });
      revokeForm.resetFields();
      setSearchResults((prev) =>
        prev.map((c) => c.id === revokeModal.cert?.id ? { ...c, status: 'REVOKED' } : c)
      );
    } catch {
      message.error('Revoke failed');
    }
  };

  const handleImportUpload = async () => {
    if (!importFile) return;
    try {
      const res = await certificatesApi.importPreview(importFile) as { fileId: string; preview: unknown[] };
      setImportFileId(res.fileId);
      setImportPreview(res.preview ?? []);
      setImportStep(2);
    } catch {
      message.error('Preview failed');
    }
  };

  const handleImportConfirm = async () => {
    if (!importFileId) return;
    try {
      await certificatesApi.importConfirm({
        cert_no: 'cert_no', student_name: 'student_name', course: 'course',
        center_code: 'center_code', issue_date: 'issue_date', grade: 'grade',
      }, importFileId);
      message.success('Legacy import completed');
      mutate();
      setImportStep(0);
      setImportFile(null);
    } catch {
      message.error('Import failed');
    }
  };

  const queueColumns = [
    { title: 'Student', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Course', dataIndex: 'courseName', key: 'courseName' },
    { title: 'Center', dataIndex: 'centerName', key: 'centerName' },
    {
      title: 'Requested',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Rule',
      dataIndex: 'autoRule',
      key: 'autoRule',
      render: (v: boolean) => (
        v ? <Tag color="green">Auto Rule</Tag> : <Tag color="orange">Manual Approval</Tag>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: CertificateStatus) => <StatusBadge status={v} />,
    },
  ];

  const registryColumns = [
    { title: t('certificates.certNo'), dataIndex: 'certNo', key: 'certNo' },
    { title: 'Student', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Course', dataIndex: 'courseName', key: 'courseName' },
    { title: 'Center', dataIndex: 'centerName', key: 'centerName' },
    { title: 'Grade', dataIndex: 'grade', key: 'grade' },
    { title: 'Issued', dataIndex: 'issuedAt', key: 'issuedAt', render: (v: string) => v ? formatDateTime(v) : '—' },
    { title: t('common.status'), dataIndex: 'status', key: 'status', render: (v: CertificateStatus) => <StatusBadge status={v} /> },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: Certificate) => (
        <Space>
          <a href={r.verifyUrl} target="_blank" rel="noreferrer">Verify URL</a>
          {r.status !== 'REVOKED' && (
            <Button size="small" danger icon={<StopOutlined />}
              onClick={() => setRevokeModal({ open: true, cert: r })}>
              {t('certificates.revoke')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('certificates.title')} />

      <Tabs defaultActiveKey="queue">
        <TabPane tab={t('certificates.issuanceQueue')} key="queue">
          <Space className="mb-4">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={!selectedRowKeys.length || bulkRunning}
              onClick={handleBulkApprove}
              loading={bulkRunning}
            >
              {t('certificates.bulkApprove')} ({selectedRowKeys.length})
            </Button>
          </Space>

          {bulkRunning && (
            <div className="mb-4">
              <Progress percent={bulkProgress} status={bulkProgress < 100 ? 'active' : 'success'} />
              <Typography.Text type="secondary">{t('certificates.issuing')}</Typography.Text>
            </div>
          )}

          {bulkResult && (
            <Card style={{ background: '#f0fdf4', marginBottom: 16 }}>
              <Typography.Text strong>
                {t('certificates.issued', { count: bulkResult.issued })}
                {bulkResult.failed > 0 && ` (${bulkResult.failed} failed)`}
              </Typography.Text>
            </Card>
          )}

          <DataTable<Certificate>
            dataSource={queue}
            columns={queueColumns}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (r) => ({ disabled: r.status !== 'PENDING' }),
            }}
            exportFilename="certificate-queue"
            exportColumns={[
              { key: 'studentName', label: 'Student' },
              { key: 'courseName', label: 'Course' },
              { key: 'centerName', label: 'Center' },
              { key: 'status', label: 'Status' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('certificates.registry')} key="registry">
          <Space.Compact className="mb-4">
            <Input
              placeholder="Search by cert no. or student name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 320 }}
            />
            <Button type="primary" onClick={handleSearch}>Search</Button>
          </Space.Compact>

          <DataTable<Certificate>
            dataSource={searchResults}
            columns={registryColumns}
            rowKey="id"
            exportFilename="certificate-registry"
            exportColumns={[
              { key: 'certNo', label: 'Cert No' },
              { key: 'studentName', label: 'Student' },
              { key: 'courseName', label: 'Course' },
              { key: 'grade', label: 'Grade' },
              { key: 'status', label: 'Status' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('certificates.legacyImport')} key="import">
          <Card style={{ maxWidth: 700 }}>
            <Steps current={importStep} className="mb-6">
              <Step title="Upload CSV/Excel" />
              <Step title="Column Mapping" />
              <Step title="Preview (10 rows)" />
              <Step title="Import" />
            </Steps>

            {importStep === 0 && (
              <div>
                <Upload.Dragger
                  accept=".csv,.xlsx,.xls"
                  beforeUpload={(f) => { setImportFile(f); return false; }}
                  maxCount={1}
                >
                  <p>Upload CSV or Excel file</p>
                  <p className="text-gray-400 text-sm">cert_no, student_name, course, center_code, issue_date, grade</p>
                </Upload.Dragger>
                <Button
                  type="primary"
                  className="mt-4"
                  disabled={!importFile}
                  onClick={() => setImportStep(1)}
                >
                  Next
                </Button>
              </div>
            )}

            {importStep === 1 && (
              <div>
                <p>Map columns from your file to required fields:</p>
                {['cert_no', 'student_name', 'course', 'center_code', 'issue_date', 'grade'].map((col) => (
                  <Row key={col} gutter={16} className="mb-2" align="middle">
                    <Col span={10}>
                      <Tag>{col}</Tag>
                    </Col>
                    <Col span={14}>
                      <Select defaultValue={col} style={{ width: '100%' }}>
                        <Option value={col}>{col}</Option>
                      </Select>
                    </Col>
                  </Row>
                ))}
                <Space className="mt-4">
                  <Button onClick={() => setImportStep(0)}>Back</Button>
                  <Button type="primary" onClick={handleImportUpload}>Generate Preview</Button>
                </Space>
              </div>
            )}

            {importStep === 2 && (
              <div>
                <Typography.Text>First 10 rows preview:</Typography.Text>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginTop: 8, fontSize: 12 }}>
                  {JSON.stringify(importPreview.slice(0, 10), null, 2)}
                </pre>
                <Space className="mt-4">
                  <Button onClick={() => setImportStep(1)}>Back</Button>
                  <Button type="primary" onClick={() => setImportStep(3)}>Looks Good</Button>
                </Space>
              </div>
            )}

            {importStep === 3 && (
              <div>
                <Typography.Text>Ready to import. This action cannot be undone.</Typography.Text>
                <Space className="mt-4">
                  <Button onClick={() => setImportStep(2)}>Back</Button>
                  <Button type="primary" onClick={handleImportConfirm}>Confirm Import</Button>
                </Space>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab={t('certificates.templateDesigner')} key="templates">
          <Row gutter={16}>
            <Col span={8}>
              <Card title="Templates" size="small">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-2 border-b hover:bg-blue-50 cursor-pointer">
                    <div className="font-medium">{tpl.name}</div>
                    <Tag>{tpl.docType}</Tag>
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={16}>
              <Card title="HTML Preview">
                <div
                  style={{ minHeight: 400, background: '#fafafa', padding: 16, borderRadius: 6, border: '1px dashed #d9d9d9' }}
                >
                  <Typography.Text type="secondary">
                    Select a template to preview. Variable placeholders like{' '}
                    <Tag color="blue">{'{{student_name}}'}</Tag>{' '}
                    <Tag color="blue">{'{{cert_no}}'}</Tag>{' '}
                    <Tag color="blue">{'{{course_name}}'}</Tag>{' '}
                    will be highlighted.
                  </Typography.Text>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Revoke Modal */}
      <Modal
        title={t('certificates.revoke')}
        open={revokeModal.open}
        onCancel={() => { setRevokeModal({ open: false, cert: null }); revokeForm.resetFields(); }}
        onOk={() => revokeForm.submit()}
        okButtonProps={{ danger: true }}
        okText="Confirm Revoke"
      >
        <Tag color="orange" className="mb-3">{t('certificates.revokeWarning')}</Tag>
        <Form form={revokeForm} layout="vertical" onFinish={handleRevoke}>
          <Form.Item
            name="reason"
            label={t('common.reason')}
            rules={[{ required: true }, { min: 10 }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
