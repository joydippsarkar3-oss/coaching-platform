import React, { useState } from 'react';
import {
  Tabs, Tree, Table, Tag, Button, Drawer, Form, Input, Select, Upload,
  message, Space, Typography, Card, Row, Col, Badge,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, ReloadOutlined, FolderOutlined, FileOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { usePollingApi } from '@/hooks/usePollingApi';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';

const { TabPane } = Tabs;

// ─── Types ────────────────────────────────────────────────────────────────────

type MaterialType = 'PDF' | 'VIDEO' | 'QUIZ';
type DistJobStatus = 'QUEUED' | 'DISTRIBUTING' | 'DONE' | 'FAILED';
type AssetTag = string;

interface CourseUnit {
  id: string;
  title: string;
  order: number;
}

interface CourseTree {
  id: string;
  name: string;
  units: CourseUnit[];
}

interface ContentMaterial {
  id: string;
  title: string;
  type: MaterialType;
  unitId: string;
  uploadedAt: string;
  centersReceiving: number;
  version: number;
  url?: string;
}

interface DistributionJob {
  id: string;
  courseName: string;
  materialCount: number;
  centerCount: number;
  status: DistJobStatus;
  createdAt: string;
}

interface MarketingAsset {
  id: string;
  title: string;
  type: 'IMAGE' | 'PDF';
  tags: AssetTag[];
  uploadedAt: string;
  url: string;
  thumbnailUrl?: string;
}

interface CenterBasic {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MATERIAL_TYPE_COLOR: Record<MaterialType, string> = {
  PDF: 'blue',
  VIDEO: 'purple',
  QUIZ: 'orange',
};

const JOB_STATUS_COLOR: Record<DistJobStatus, string> = {
  QUEUED: 'default',
  DISTRIBUTING: 'processing',
  DONE: 'success',
  FAILED: 'error',
};

// ─── Upload Material Drawer ───────────────────────────────────────────────────

interface UploadDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  courses: CourseTree[];
  centers: CenterBasic[];
}

function UploadMaterialDrawer({ open, onClose, onCreated, courses, centers }: UploadDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [materialType, setMaterialType] = useState<MaterialType>('PDF');

  const selectedUnits = courses.find((c) => c.id === selectedCourse)?.units ?? [];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'file') {
          const fileList = v as { file: File }[];
          if (fileList?.[0]?.file) formData.append('file', fileList[0].file);
        } else if (Array.isArray(v)) {
          formData.append(k, JSON.stringify(v));
        } else if (v != null) {
          formData.append(k, String(v));
        }
      });
      await apiClient.post('/api/v1/content-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Material uploaded and queued for distribution');
      form.resetFields();
      onCreated();
      onClose();
    } catch {
      message.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer title="Upload Material" open={open} onClose={onClose} width={520}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="PDF">
              <Select onChange={(v) => setMaterialType(v as MaterialType)}>
                <Select.Option value="PDF">PDF</Select.Option>
                <Select.Option value="VIDEO">Video</Select.Option>
                <Select.Option value="QUIZ">Quiz</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="courseId" label="Course" rules={[{ required: true }]}>
              <Select onChange={(v) => setSelectedCourse(String(v))}>
                {courses.map((c) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="unitId" label="Unit" rules={[{ required: true }]}>
          <Select disabled={!selectedCourse}>
            {selectedUnits.map((u) => (
              <Select.Option key={u.id} value={u.id}>{u.title}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        {materialType === 'PDF' ? (
          <Form.Item name="file" label="PDF File" rules={[{ required: true }]}>
            <Upload accept=".pdf" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select PDF</Button>
            </Upload>
          </Form.Item>
        ) : (
          <Form.Item name="url" label="Video URL" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
        )}
        <Form.Item name="changelog" label="Changelog Note">
          <Input.TextArea rows={2} placeholder="What changed from the previous version?" />
        </Form.Item>
        <Form.Item name="centerIds" label="Push to Centers">
          <Select
            mode="multiple"
            placeholder="Default: all centers offering this course"
            allowClear
          >
            {centers.map((c) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Upload &amp; Push to Centers
        </Button>
      </Form>
    </Drawer>
  );
}

// ─── Material Library Tab ─────────────────────────────────────────────────────

function MaterialLibraryTab() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: courses = [], mutate: mutateCourses } = usePollingApi<CourseTree[]>(
    '/api/v1/courses?withUnits=true', 60_000
  );
  const { data: centers = [] } = useApi<CenterBasic[]>('/api/v1/centers?minimal=true');
  const { data: materials = [], mutate: mutateMaterials } = useApi<ContentMaterial[]>(
    selectedUnitId ? `/api/v1/content-items?unitId=${selectedUnitId}` : null
  );

  const treeData: DataNode[] = courses.map((course) => ({
    key: `course-${course.id}`,
    title: <Typography.Text strong>{course.name}</Typography.Text>,
    icon: <FolderOutlined />,
    selectable: false,
    children: course.units.map((unit) => ({
      key: unit.id,
      title: unit.title,
      icon: <FileOutlined />,
      isLeaf: true,
    })),
  }));

  const columns: ColumnsType<ContentMaterial> = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v: MaterialType) => <Tag color={MATERIAL_TYPE_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Centers',
      dataIndex: 'centersReceiving',
      key: 'centersReceiving',
      width: 90,
      render: (v: number) => <Badge count={v} showZero color="blue" />,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => <Tag>v{v}</Tag>,
    },
  ];

  return (
    <Row gutter={16} style={{ minHeight: 400 }}>
      <Col xs={24} md={6}>
        <Card size="small" title="Courses" style={{ minHeight: 400 }}>
          {courses.length > 0 ? (
            <Tree
              treeData={treeData}
              defaultExpandAll
              showIcon
              onSelect={(keys) => {
                const key = keys[0] as string;
                if (key && !key.startsWith('course-')) setSelectedUnitId(key);
              }}
            />
          ) : (
            <Typography.Text type="secondary">No courses.</Typography.Text>
          )}
        </Card>
      </Col>
      <Col xs={24} md={18}>
        <Card
          size="small"
          title={selectedUnitId ? 'Materials' : 'Select a unit'}
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Material
            </Button>
          }
        >
          <Table<ContentMaterial>
            dataSource={materials}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: selectedUnitId ? 'No materials for this unit.' : 'Select a unit from the left.' }}
          />
        </Card>
      </Col>

      <UploadMaterialDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={() => { mutateMaterials(); mutateCourses(); }}
        courses={courses}
        centers={centers}
      />
    </Row>
  );
}

// ─── Distribution Jobs Panel ──────────────────────────────────────────────────

function DistributionJobsPanel() {
  const { data: jobs = [], mutate } = usePollingApi<DistributionJob[]>(
    '/api/v1/content-distribution-jobs', 30_000
  );

  const handleRepush = async (jobId: string) => {
    try {
      await apiClient.post(`/api/v1/content-distribution-jobs/${jobId}/repush`);
      message.success('Re-push queued');
      mutate();
    } catch {
      message.error('Re-push failed');
    }
  };

  const columns: ColumnsType<DistributionJob> = [
    { title: 'Course', dataIndex: 'courseName', key: 'courseName' },
    {
      title: 'Materials',
      dataIndex: 'materialCount',
      key: 'materialCount',
      width: 90,
    },
    {
      title: 'Centers',
      dataIndex: 'centerCount',
      key: 'centerCount',
      width: 80,
      render: (v: number) => `${v} centers`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: DistJobStatus) => <Badge status={JOB_STATUS_COLOR[v] as Parameters<typeof Badge>[0]['status']} text={v} />,
    },
    {
      title: 'Queued',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: (_v, r) =>
        r.status === 'FAILED' ? (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRepush(r.id)}
          >
            Re-push
          </Button>
        ) : null,
    },
  ];

  return (
    <Card size="small" title="Distribution Jobs" className="mt-4">
      <Table<DistributionJob>
        dataSource={jobs}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
}

// ─── Marketing Assets Tab ─────────────────────────────────────────────────────

function MarketingAssetsTab() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const { data: assets = [], mutate } = usePollingApi<MarketingAsset[]>(
    '/api/v1/marketing-assets', 60_000
  );

  const handleUpload = async (values: Record<string, unknown>) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileList = values.file as { file: File }[];
      if (fileList?.[0]?.file) formData.append('file', fileList[0].file);
      formData.append('title', String(values.title));
      if (Array.isArray(values.tags)) {
        formData.append('tags', JSON.stringify(values.tags));
      }
      await apiClient.post('/api/v1/marketing-assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Asset uploaded');
      form.resetFields();
      setUploadOpen(false);
      mutate();
    } catch {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
          Upload Asset
        </Button>
      </div>
      <Row gutter={[16, 16]}>
        {assets.map((asset) => (
          <Col key={asset.id} xs={12} sm={8} md={6} lg={4}>
            <Card
              size="small"
              cover={
                asset.type === 'IMAGE' && asset.thumbnailUrl ? (
                  <img src={asset.thumbnailUrl} alt={asset.title} style={{ height: 100, objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      height: 100,
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography.Text type="secondary">{asset.type}</Typography.Text>
                  </div>
                )
              }
            >
              <Card.Meta
                title={<Typography.Text style={{ fontSize: 12 }}>{asset.title}</Typography.Text>}
                description={
                  <Space wrap size={2}>
                    {asset.tags.map((tag) => (
                      <Tag key={tag} style={{ fontSize: 10, padding: '0 4px' }}>{tag}</Tag>
                    ))}
                  </Space>
                }
              />
              <Button
                size="small"
                href={asset.url}
                target="_blank"
                block
                className="mt-2"
              >
                Download
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer title="Upload Marketing Asset" open={uploadOpen} onClose={() => setUploadOpen(false)} width={420}>
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="e.g. poster, brochure, logo" />
          </Form.Item>
          <Form.Item name="file" label="File (Image / PDF)" rules={[{ required: true }]}>
            <Upload accept="image/*,.pdf" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={uploading} block>
            Upload
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentDistributionPage() {
  return (
    <div>
      <PageHeader title="Content Distribution" subtitle="Course materials and marketing assets" />
      <Tabs defaultActiveKey="library">
        <TabPane tab="Material Library" key="library">
          <MaterialLibraryTab />
          <DistributionJobsPanel />
        </TabPane>
        <TabPane tab="Marketing Assets" key="marketing">
          <MarketingAssetsTab />
        </TabPane>
      </Tabs>
    </div>
  );
}
