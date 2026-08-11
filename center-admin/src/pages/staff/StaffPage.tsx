import { PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Drawer, Form, Input, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { staffApi } from '@/api/endpoints/staff'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import type { StaffMember } from '@/types/models'
import { confirmAction } from '@/components/shared/ConfirmModal'
import { formatDate } from '@/utils/dates'

const ROLES = [
  { value: 'center_admin', label: 'Center Admin' },
  { value: 'center_staff', label: 'Staff' },
  { value: 'center_accountant', label: 'Accountant' },
]

export function StaffPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const { data, isLoading, mutate } = useApi<{ data: StaffMember[]; total: number }>('/staff')
  const members = data?.data ?? []

  const handleAdd = async (values: { name: string; phone: string; email?: string; role: string }) => {
    setSaving(true)
    try {
      await staffApi.create({ ...values, isActive: true, permissions: [] } as Parameters<typeof staffApi.create>[0])
      form.resetFields()
      setDrawerOpen(false)
      void mutate()
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = (member: StaffMember) => {
    confirmAction({
      title: `Deactivate ${member.name}?`,
      content: 'This will revoke their access to the center admin panel.',
      okType: 'danger',
      okText: 'Deactivate',
      onOk: async () => {
        await staffApi.deactivate(member.id)
        void mutate()
      },
    })
  }

  const columns: ColumnsType<StaffMember> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string) => (
        <span className="flex items-center gap-2">
          <TeamOutlined className="text-gray-400" />
          {name}
        </span>
      ),
    },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email', render: (v?: string) => v ?? '—' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (r: string) => ROLES.find((x) => x.value === r)?.label ?? r,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    { title: 'Joined', dataIndex: 'joinedAt', render: (d: string) => formatDate(d) },
    {
      title: 'Actions',
      render: (_v: unknown, rec: StaffMember) =>
        rec.isActive ? (
          <Button danger size="small" onClick={() => handleDeactivate(rec)}>
            Deactivate
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage team members and roles"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Add Staff
          </Button>
        }
      />

      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        size="middle"
        className="bg-white rounded-lg"
      />

      <Drawer
        title="Add Staff Member"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields() }}
        width={400}
        footer={
          <Button type="primary" onClick={() => form.submit()} loading={saving} block>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true }, { pattern: /^[6-9]\d{9}$/, message: 'Invalid number' }]}
          >
            <Input addonBefore="+91" maxLength={10} />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={ROLES} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
