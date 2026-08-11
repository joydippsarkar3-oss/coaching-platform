import React, { useState } from 'react';
import {
  Card, Button, Drawer, Form, Input, Select, InputNumber, Switch, Space,
  message, Tabs, Tag, Modal, Row, Col, Divider, Typography
} from 'antd';
import { PlusOutlined, DragOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { catalogApi } from '@/api/endpoints/catalog';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { Course, CourseGrant, CourseStatus, PackageTier } from '@/types/models';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import { rupeesToPaise, paiseToRupees } from '@/utils/money';

const { TabPane } = Tabs;
const { Option } = Select;

const TIERS: PackageTier[] = ['BASIC', 'STANDARD', 'PREMIUM', 'ELITE'];

export default function CatalogGovernance() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [grantsDrawerOpen, setGrantsDrawerOpen] = useState(false);
  const [selectedGrantCenter, setSelectedGrantCenter] = useState<string>('');
  const [grants, setGrants] = useState<CourseGrant[]>([]);
  const [form] = Form.useForm();

  const { data: coursesData, mutate } = usePollingApi<PaginatedResponse<Course>>(
    '/api/v1/catalog/courses', 30_000
  );
  const courses = coursesData?.data ?? [];

  const openCreate = () => {
    setEditingCourse(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      ...course,
      admissionChargeRs: paiseToRupees(course.admissionCharge),
      certificateChargeRs: paiseToRupees(course.certificateCharge),
    });
    setDrawerOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    const payload: Partial<Course> = {
      nameEn: values.nameEn as string,
      nameHi: values.nameHi as string,
      category: values.category as string,
      durationWeeks: values.durationWeeks as number,
      nsqfLevel: values.nsqfLevel as Course['nsqfLevel'],
      eligibility: values.eligibility as string,
      admissionCharge: rupeesToPaise(values.admissionChargeRs as number),
      certificateCharge: rupeesToPaise(values.certificateChargeRs as number),
      royaltyPct: values.royaltyPct as number,
      syllabusUnits: values.syllabusUnits as Course['syllabusUnits'] ?? [],
      status: (values.status as CourseStatus) ?? 'DRAFT',
    };
    try {
      if (editingCourse) {
        await catalogApi.updateCourse(editingCourse.id, payload);
      } else {
        await catalogApi.createCourse(payload);
      }
      message.success('Course saved');
      mutate();
      setDrawerOpen(false);
    } catch {
      message.error('Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete this course?',
      onOk: async () => {
        await catalogApi.deleteCourse(id);
        message.success('Course deleted');
        mutate();
      },
    });
  };

  const loadGrants = async (centerId: string) => {
    setSelectedGrantCenter(centerId);
    const res = await catalogApi.getCenterGrants(centerId) as ApiResponse<CourseGrant[]>;
    setGrants(res.data);
    setGrantsDrawerOpen(true);
  };

  const handleGrantToggle = async (courseId: string, granted: boolean) => {
    if (!selectedGrantCenter) return;
    const existing = grants.find((g) => g.courseId === courseId);
    const updated: CourseGrant = {
      centerId: selectedGrantCenter,
      courseId,
      granted,
      feeMin: existing?.feeMin ?? 0,
      feeMax: existing?.feeMax ?? 0,
      hoAdmissionCharge: existing?.hoAdmissionCharge ?? 0,
      hoCertificateCharge: existing?.hoCertificateCharge ?? 0,
    };
    await catalogApi.upsertGrant(updated);
    setGrants((prev) => prev.map((g) => g.courseId === courseId ? updated : g));
    message.success('Grant updated');
  };

  const columns = [
    { title: 'Name (EN)', dataIndex: 'nameEn', key: 'nameEn' },
    { title: 'Name (HI)', dataIndex: 'nameHi', key: 'nameHi' },
    { title: t('catalog.category'), dataIndex: 'category', key: 'category' },
    { title: 'Duration (wks)', dataIndex: 'durationWeeks', key: 'durationWeeks', width: 100 },
    { title: 'NSQF', dataIndex: 'nsqfLevel', key: 'nsqfLevel', width: 70 },
    {
      title: 'Admission',
      dataIndex: 'admissionCharge',
      key: 'admissionCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: 'Cert Charge',
      dataIndex: 'certificateCharge',
      key: 'certificateCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: CourseStatus) => <StatusBadge status={v} />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: Course) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="small" danger onClick={() => handleDelete(r.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  const grantColumns = [
    { title: 'Course', dataIndex: 'courseId', key: 'courseId' },
    {
      title: t('catalog.granted'),
      dataIndex: 'granted',
      key: 'granted',
      render: (v: boolean, r: CourseGrant) => (
        <Switch checked={v} onChange={(checked) => handleGrantToggle(r.courseId, checked)} />
      ),
    },
    {
      title: `${t('catalog.feeMin')} (₹)`,
      dataIndex: 'feeMin',
      key: 'feeMin',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: `${t('catalog.feeMax')} (₹)`,
      dataIndex: 'feeMax',
      key: 'feeMax',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('catalog.admissionCharge'),
      dataIndex: 'hoAdmissionCharge',
      key: 'hoAdmissionCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('catalog.certCharge'),
      dataIndex: 'hoCertificateCharge',
      key: 'hoCertificateCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('catalog.title')}
        extra={
          <Space>
            <Button onClick={() => setGrantsDrawerOpen(true)}>
              {t('catalog.centerGrants')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('catalog.newCourse')}
            </Button>
          </Space>
        }
      />

      <DataTable<Course>
        dataSource={courses}
        columns={columns}
        rowKey="id"
        exportFilename="courses"
        exportColumns={[
          { key: 'nameEn', label: 'Name EN' },
          { key: 'nameHi', label: 'Name HI' },
          { key: 'category', label: 'Category' },
          { key: 'durationWeeks', label: 'Duration (wks)' },
          { key: 'nsqfLevel', label: 'NSQF Level' },
          { key: 'status', label: 'Status' },
        ]}
      />

      {/* Course Drawer */}
      <Drawer
        title={editingCourse ? `Edit: ${editingCourse.nameEn}` : t('catalog.newCourse')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={600}
        extra={<Button type="primary" onClick={() => form.submit()}>Save</Button>}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nameEn" label={t('catalog.courseNameEn')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nameHi" label={t('catalog.courseNameHi')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label={t('catalog.category')} rules={[{ required: true }]}>
                <Select>
                  {['Computer', 'Vocational', 'Typing', 'Accounting', 'DTP'].map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="durationWeeks" label={t('catalog.duration')} rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="nsqfLevel" label={t('catalog.nsqfLevel')} rules={[{ required: true }]}>
                <Select>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((l) => (
                    <Option key={l} value={l}>Level {l}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="eligibility" label={t('catalog.eligibility')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="admissionChargeRs" label="Admission Charge (₹)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="certificateChargeRs" label="Cert Charge (₹)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="royaltyPct" label="Royalty %">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label={t('common.status')} initialValue="DRAFT">
            <Select>
              {['DRAFT', 'ACTIVE', 'ARCHIVED'].map((s) => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">{t('catalog.syllabusUnits')}</Divider>
          <Form.List name="syllabusUnits">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" className="mb-2">
                    <Col span={20}>
                      <Form.Item {...restField} name={[name, 'title']} noStyle>
                        <Input placeholder={`Unit ${name + 1} title`} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button icon={<DeleteOutlined />} danger size="small" onClick={() => remove(name)} />
                    </Col>
                  </Row>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ title: '', order: fields.length, topics: [] })}>
                  {t('catalog.addUnit')}
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>

      {/* Center Grants Drawer */}
      <Drawer
        title={t('catalog.centerGrants')}
        open={grantsDrawerOpen}
        onClose={() => setGrantsDrawerOpen(false)}
        width={780}
        extra={
          <Button onClick={async () => {
            if (selectedGrantCenter) {
              await catalogApi.bulkApplyByTier('STANDARD', courses.map((c) => c.id));
              message.success('Bulk applied');
            }
          }}>
            {t('catalog.bulkApply')}
          </Button>
        }
      >
        <Form.Item label="Select Center">
          <Select
            showSearch
            style={{ width: 300 }}
            placeholder="Search center..."
            onSelect={(v: string) => loadGrants(v)}
            filterOption={(input, option) =>
              String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="demo-center-1">Demo Center 1 — Mumbai</Option>
            <Option value="demo-center-2">Demo Center 2 — Delhi</Option>
          </Select>
        </Form.Item>
        {grants.length > 0 && (
          <DataTable<CourseGrant>
            dataSource={grants}
            columns={grantColumns}
            rowKey="courseId"
            pagination={false}
          />
        )}
      </Drawer>
    </div>
  );
}
