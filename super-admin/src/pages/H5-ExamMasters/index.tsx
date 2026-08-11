import React, { useState } from 'react';
import {
  Card, Button, Drawer, Form, Input, Select, InputNumber, Switch, Space, Tag,
  message, Modal, Row, Col, Divider, DatePicker, Table
} from 'antd';
import { PlusOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { examsApi } from '@/api/endpoints/exams';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { Exam, ExamType, ExamStatus, AntiCheatLevel, ResultPolicy, ExamBlueprint } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/utils/dates';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ExamMasters() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form] = Form.useForm();

  const { data: examsData, mutate } = usePollingApi<PaginatedResponse<Exam>>(
    '/api/v1/exams', 30_000
  );
  const exams = examsData?.data ?? [];

  const openCreate = () => {
    setEditingExam(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    form.setFieldsValue(exam);
    setDrawerOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      if (editingExam) {
        await examsApi.update(editingExam.id, values as Partial<Exam>);
      } else {
        await examsApi.create(values as Partial<Exam>);
      }
      message.success('Exam saved');
      mutate();
      setDrawerOpen(false);
    } catch {
      message.error('Save failed');
    }
  };

  const handleToggleLock = async (exam: Exam) => {
    if (!exam.bankLocked) {
      Modal.confirm({
        title: 'Lock Question Bank?',
        content: 'Once locked, the question bank for this final exam cannot be modified. This is irreversible.',
        icon: <WarningOutlined style={{ color: '#f59e0b' }} />,
        okButtonProps: { danger: true },
        onOk: async () => {
          await examsApi.toggleBankLock(exam.id, true);
          message.success('Bank locked');
          mutate();
        },
      });
    } else {
      message.info('Bank is already locked');
    }
  };

  const columns = [
    { title: 'Exam Name', dataIndex: 'name', key: 'name',
      render: (v: string, r: Exam) => (
        <Space>
          <Button type="link" onClick={() => openEdit(r)}>{v}</Button>
          {r.bankLocked && <Tag icon={<LockOutlined />} color="red">Bank Locked</Tag>}
          {r.type === 'SCHOLARSHIP' && <Tag color="gold">Scholarship</Tag>}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: ExamType) => (
        <Tag color={v === 'FINAL' ? 'red' : v === 'SCHOLARSHIP' ? 'gold' : 'blue'}>
          {t(`exams.type.${v}`)}
        </Tag>
      ),
    },
    { title: 'Duration (min)', dataIndex: 'durationMinutes', key: 'duration' },
    {
      title: 'Window',
      key: 'window',
      render: (_: unknown, r: Exam) => `${formatDate(r.windowStart)} – ${formatDate(r.windowEnd)}`,
    },
    {
      title: 'Anti-Cheat',
      dataIndex: 'antiCheatLevel',
      key: 'antiCheat',
      render: (v: AntiCheatLevel) => <Tag>{t(`exams.antiCheatLevels.${v}`)}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: ExamStatus) => <StatusBadge status={v} />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: Exam) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
          {r.type === 'FINAL' && !r.bankLocked && (
            <Button size="small" icon={<LockOutlined />} danger onClick={() => handleToggleLock(r)}>
              Lock Bank
            </Button>
          )}
          <Button size="small" danger onClick={async () => {
            Modal.confirm({
              title: 'Delete exam?',
              onOk: async () => { await examsApi.delete(r.id); mutate(); }
            });
          }}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('exams.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('exams.newExam')}
          </Button>
        }
      />

      <DataTable<Exam>
        dataSource={exams}
        columns={columns}
        rowKey="id"
        exportFilename="exams"
        exportColumns={[
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'durationMinutes', label: 'Duration (min)' },
          { key: 'status', label: 'Status' },
          { key: 'antiCheatLevel', label: 'Anti-Cheat' },
        ]}
      />

      <Drawer
        title={editingExam ? `Edit: ${editingExam.name}` : t('exams.newExam')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        extra={<Button type="primary" onClick={() => form.submit()}>Save</Button>}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Exam Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="PRACTICE">
                <Select>
                  {(['PRACTICE', 'MOCK', 'FINAL', 'SCHOLARSHIP'] as ExamType[]).map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationMinutes" label="Duration (min)" rules={[{ required: true }]} initialValue={60}>
                <InputNumber min={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="marksPerQuestion" label="Marks/Q" initialValue={1}>
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="antiCheatLevel" label="Anti-Cheat Level" initialValue="BASIC">
                <Select>
                  {(['NONE', 'BASIC', 'STRICT'] as AntiCheatLevel[]).map((v) => (
                    <Option key={v} value={v}>{t(`exams.antiCheatLevels.${v}`)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="resultPolicy" label="Result Policy" initialValue="INSTANT">
                <Select>
                  {(['INSTANT', 'MODERATED'] as ResultPolicy[]).map((v) => (
                    <Option key={v} value={v}>{t(`exams.resultPolicies.${v}`)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="negativeMarking" label="Negative Marking" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="publicRegistration" label="Public Registration (Scholarship)" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider orientation="left">{t('exams.blueprint')} (Topic × Difficulty × Count)</Divider>
          <Form.List name="blueprint">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={8} className="mb-2">
                    <Col span={8}>
                      <Form.Item name={[name, 'topic']} noStyle>
                        <Input placeholder={t('exams.topic')} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'easy']} noStyle>
                        <InputNumber placeholder="Easy" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'medium']} noStyle>
                        <InputNumber placeholder="Med" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'hard']} noStyle>
                        <InputNumber placeholder="Hard" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button danger size="small" onClick={() => remove(name)}>Remove</Button>
                    </Col>
                  </Row>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ topic: '', easy: 0, medium: 0, hard: 0 })}>
                  Add Topic Row
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </div>
  );
}
