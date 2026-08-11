import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Drawer, Form, Input, Row, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { batchesApi } from '@/api/endpoints/batches'
import { ExportButton } from '@/components/shared/ExportButton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { confirmAction } from '@/components/shared/ConfirmModal'
import { useApi } from '@/hooks/useApi'
import type { Batch, Course } from '@/types/models'
import { formatDate } from '@/utils/dates'

export function BatchesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const { data, isLoading, mutate } = useApi<{ data: Batch[]; total: number }>('/batches')
  const { data: courses } = useApi<Course[]>('/courses')
  const batches = data?.data ?? []

  const handleCreate = async (values: Omit<Batch, 'id' | 'filledSeats'>) => {
    setSaving(true)
    try {
      await batchesApi.create(values)
      form.resetFields()
      setDrawerOpen(false)
      void mutate()
    } finally {
      setSaving(false)
    }
  }

  const handleClose = (batch: Batch) => {
    confirmAction({
      title: `Close batch "${batch.name}"?`,
      content: 'Closing a batch will prevent new enrollments. This cannot be undone.',
      okType: 'danger',
      okText: 'Close Batch',
      onOk: async () => {
        await batchesApi.close(batch.id)
        void mutate()
      },
    })
  }

  const columns: ColumnsType<Batch> = [
    { title: 'Batch Name', dataIndex: 'name' },
    { title: 'Course', dataIndex: 'courseName' },
    {
      title: 'Schedule',
      dataIndex: 'schedule',
      render: (s: string) => (
        <span className="flex items-center gap-1">
          <CalendarOutlined className="text-gray-400" />
          {s}
        </span>
      ),
    },
    { title: 'Start Date', dataIndex: 'startDate', render: (d: string) => formatDate(d) },
    {
      title: 'Seats',
      render: (_v: unknown, rec: Batch) => (
        <span>
          {rec.filledSeats}/{rec.totalSeats}{' '}
          {rec.filledSeats >= rec.totalSeats && <Tag color="red">Full</Tag>}
        </span>
      ),
    },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
    { title: 'Instructor', dataIndex: 'instructorName', render: (v?: string) => v ?? '—' },
    {
      title: 'Actions',
      render: (_v: unknown, rec: Batch) =>
        rec.status === 'active' ? (
          <Button danger size="small" onClick={() => handleClose(rec)}>
            Close
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle="Manage batch schedules and timetable"
        actions={
          <>
            <ExportButton
              onExport={() => Promise.resolve(new Blob(['name,course\n'], { type: 'text/csv' }))}
              filename="batches.csv"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              New Batch
            </Button>
          </>
        }
      />

      <Table
        dataSource={batches}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        size="middle"
        className="bg-white rounded-lg"
      />

      <Drawer
        title="Create New Batch"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields() }}
        width={440}
        footer={
          <Button type="primary" onClick={() => form.submit()} loading={saving} block>
            Create Batch
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Batch Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="courseId" label="Course" rules={[{ required: true }]}>
            <Select placeholder="Select course">
              {(courses ?? []).map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalSeats" label="Total Seats" rules={[{ required: true }]}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="schedule" label="Schedule" rules={[{ required: true }]}>
            <Input placeholder="e.g. Mon-Fri 10:00–12:00" />
          </Form.Item>
          <Form.Item name="instructorName" label="Instructor Name">
            <Input />
          </Form.Item>
          <Form.Item name="status" initialValue="upcoming" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="courseName" label="Course Name (display)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
