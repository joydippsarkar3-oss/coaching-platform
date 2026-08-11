import React, { useState } from 'react';
import {
  Tabs, Table, Tag, Button, Modal, Form, Input, Select, Upload, Radio,
  message, Space, Typography, Card, Row, Col, Badge, Spin,
} from 'antd';
import {
  PlusOutlined, FilePdfOutlined, VideoCameraOutlined, LinkOutlined,
  InboxOutlined, SendOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { useApi } from '@/hooks/useApi';
import { usePollingApi } from '@/hooks/usePollingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';

const { TabPane } = Tabs;
const { Dragger } = Upload;
const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

type MaterialType = 'PDF' | 'VIDEO' | 'LINK';
type DistStatus = 'Delivered' | 'Pending' | 'Failed';

interface Course {
  id: string;
  name: string;
}

interface ContentItem {
  id: string;
  name: string;
  type: MaterialType;
  courseId: string;
  courseName: string;
  uploadedAt: string;
  size?: number;
  url?: string;
}

interface CenterDistribution {
  centerId: string;
  centerName: string;
  city?: string;
  status: DistStatus;
  distributedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<MaterialType, React.ReactNode> = {
  PDF: <FilePdfOutlined style={{ color: '#ef4444' }} />,
  VIDEO: <VideoCameraOutlined style={{ color: '#8b5cf6' }} />,
  LINK: <LinkOutlined style={{ color: '#2563eb' }} />,
};

const TYPE_COLOR: Record<MaterialType, string> = {
  PDF: 'red',
  VIDEO: 'purple',
  LINK: 'blue',
};

const DIST_STATUS_COLOR: Record<DistStatus, Parameters<typeof Badge>[0]['status']> = {
  Delivered: 'success',
  Pending: 'processing',
  Failed: 'error',
};

const DIST_STATUS_ICON: Record<DistStatus, React.ReactNode> = {
  Delivered: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
  Pending: <ClockCircleOutlined style={{ color: '#3b82f6' }} />,
  Failed: <CloseCircleOutlined style={{ color: '#ef4444' }} />,
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Content Library Tab ─────────────────────────────────────────────────────

function ContentLibraryTab({ onSelectForDistribution }: { onSelectForDistribution: (item: ContentItem) => void }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: courses = [] } = useApi<Course[]>('/api/v1/courses');
  const { data: items = [], loading, mutate } = usePollingApi<ContentItem[]>(
    '/api/v1/content-items', 60_000
  );

  const columns: ColumnsType<ContentItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: ContentItem) => (
        <Space>
          {TYPE_ICON[r.type]}
          <Text>{v}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v: MaterialType) => <Tag color={TYPE_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 90,
      render: (v?: number) => <Text type="secondary">{formatFileSize(v)}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 140,
      render: (_v, r) => (
        <Button
          size="small"
          type="link"
          icon={<SendOutlined />}
          onClick={() => onSelectForDistribution(r)}
        >
          Distribute
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Content Library"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
          Upload Material
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table<ContentItem>
          dataSource={items}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No materials yet. Upload your first one.' }}
        />
      </Spin>

      <UploadMaterialModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={mutate}
        courses={courses}
      />
    </Card>
  );
}

// ─── Distribution Tab ─────────────────────────────────────────────────────────

function DistributionTab({ preselected }: { preselected: ContentItem | null }) {
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(preselected);
  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([]);
  const [pushing, setPushing] = useState(false);

  // Sync when parent passes a preselected item (from "Distribute" click in library)
  React.useEffect(() => {
    if (preselected) {
      setSelectedItem(preselected);
      setSelectedCenterIds([]);
    }
  }, [preselected]);

  const { data: items = [] } = useApi<ContentItem[]>('/api/v1/content-items');
  const { data: centerDist = [], loading: distLoading, mutate: mutateDistribution } =
    useApi<CenterDistribution[]>(
      selectedItem ? `/api/v1/content-items/${selectedItem.id}/distribution` : null
    );

  const handlePush = async () => {
    if (!selectedItem || selectedCenterIds.length === 0) return;
    setPushing(true);
    try {
      await apiClient.post(`/api/v1/content-items/${selectedItem.id}/push`, {
        centerIds: selectedCenterIds,
      });
      message.success(`Pushed to ${selectedCenterIds.length} center(s)`);
      setSelectedCenterIds([]);
      mutateDistribution();
    } catch {
      message.error('Push failed. Please try again.');
    } finally {
      setPushing(false);
    }
  };

  const distColumns: ColumnsType<CenterDistribution> = [
    {
      title: 'Center',
      dataIndex: 'centerName',
      key: 'centerName',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (v?: string) => v ?? '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: DistStatus) => (
        <Space>
          {DIST_STATUS_ICON[v]}
          <Badge status={DIST_STATUS_COLOR[v]} text={v} />
        </Space>
      ),
    },
    {
      title: 'Distributed At',
      dataIndex: 'distributedAt',
      key: 'distributedAt',
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : '-'),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedCenterIds,
    onChange: (keys: React.Key[]) => setSelectedCenterIds(keys as string[]),
    getCheckboxProps: (record: CenterDistribution) => ({
      disabled: record.status === 'Delivered',
    }),
  };

  return (
    <div>
      <Card title="Select Content Item" style={{ marginBottom: 16 }}>
        <Select
          placeholder="Choose a content item to distribute..."
          style={{ width: '100%' }}
          value={selectedItem?.id ?? undefined}
          onChange={(id) => {
            const found = items.find((i) => i.id === id) ?? null;
            setSelectedItem(found);
            setSelectedCenterIds([]);
          }}
          showSearch
          optionFilterProp="children"
          allowClear
          onClear={() => { setSelectedItem(null); setSelectedCenterIds([]); }}
        >
          {items.map((item) => (
            <Select.Option key={item.id} value={item.id}>
              <Space>
                {TYPE_ICON[item.type]}
                {item.name}
                <Text type="secondary" style={{ fontSize: 12 }}>({item.courseName})</Text>
              </Space>
            </Select.Option>
          ))}
        </Select>
      </Card>

      {selectedItem && (
        <Card
          title={
            <Space>
              <Text strong>Distribution Status</Text>
              <Tag color={TYPE_COLOR[selectedItem.type]}>{selectedItem.type}</Tag>
              <Text type="secondary">{selectedItem.name}</Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={selectedCenterIds.length === 0}
              loading={pushing}
              onClick={handlePush}
            >
              Push to Selected ({selectedCenterIds.length})
            </Button>
          }
        >
          <Spin spinning={distLoading}>
            <Table<CenterDistribution>
              dataSource={centerDist}
              columns={distColumns}
              rowKey="centerId"
              rowSelection={rowSelection}
              size="small"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'No centers with this course found.' }}
            />
          </Spin>
        </Card>
      )}
    </div>
  );
}

// ─── Upload Material Modal ────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  courses: Course[];
}

function UploadMaterialModal({ open, onClose, onCreated, courses }: UploadModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [materialType, setMaterialType] = useState<MaterialType>('PDF');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setMaterialType('PDF');
    onClose();
  };

  const handleSubmit = async () => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setLoading(true);
    try {
      if (materialType === 'LINK') {
        await apiClient.post('/api/v1/content-items', {
          name: values.name,
          type: 'LINK',
          courseId: values.courseId,
          url: values.url,
        });
      } else {
        const formData = new FormData();
        formData.append('name', String(values.name));
        formData.append('type', materialType);
        formData.append('courseId', String(values.courseId));
        if (fileList[0]?.originFileObj) {
          formData.append('file', fileList[0].originFileObj as File);
        }
        await apiClient.post('/api/v1/content-items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      message.success('Material uploaded successfully');
      onCreated();
      handleClose();
    } catch {
      message.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Upload Material"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Upload"
      confirmLoading={loading}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
          <Input placeholder="e.g. Introduction to Accounting - Chapter 1" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="courseId" label="Course" rules={[{ required: true, message: 'Select a course' }]}>
              <Select placeholder="Select course">
                {courses.map((c) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Type" initialValue="PDF">
              <Radio.Group onChange={(e) => setMaterialType(e.target.value as MaterialType)}>
                <Radio.Button value="PDF">PDF</Radio.Button>
                <Radio.Button value="VIDEO">Video</Radio.Button>
                <Radio.Button value="LINK">Link</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        {materialType === 'LINK' ? (
          <Form.Item name="url" label="URL" rules={[{ required: true, message: 'URL is required' }, { type: 'url', message: 'Enter a valid URL' }]}>
            <Input prefix={<LinkOutlined />} placeholder="https://..." />
          </Form.Item>
        ) : (
          <Form.Item label={materialType === 'PDF' ? 'PDF File' : 'Video File'} required>
            <Dragger
              accept={materialType === 'PDF' ? '.pdf' : 'video/*'}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                {materialType === 'PDF' ? 'Supports PDF files only' : 'Supports common video formats'}
              </p>
            </Dragger>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentDistributionPage() {
  const [activeTab, setActiveTab] = useState<string>('library');
  const [pendingDistribution, setPendingDistribution] = useState<ContentItem | null>(null);

  const handleDistribute = (item: ContentItem) => {
    setPendingDistribution(item);
    setActiveTab('distribution');
  };

  return (
    <div>
      <PageHeader
        title="Content Distribution"
        subtitle="Manage course materials and distribute them to centers"
      />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key !== 'distribution') setPendingDistribution(null);
        }}
      >
        <TabPane tab="Content Library" key="library">
          <ContentLibraryTab onSelectForDistribution={handleDistribute} />
        </TabPane>
        <TabPane tab="Distribution" key="distribution">
          <DistributionTab preselected={pendingDistribution} />
        </TabPane>
      </Tabs>
    </div>
  );
}
