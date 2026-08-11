import { UserOutlined } from '@ant-design/icons'
import { Button, Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExportButton } from '@/components/shared/ExportButton'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { Student } from '@/types/models'

interface StudentRow extends Student {
  enrollmentStatus?: string
  dueAmount?: number
  batchName?: string
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

export function StudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)

  const { data, isLoading } = useApi<{ data: StudentRow[]; total: number }>(
    `/students?${params.toString()}`,
  )

  const students = data?.data ?? []

  const columns: ColumnsType<StudentRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, rec) => (
        <Button
          type="link"
          className="p-0 flex items-center gap-2"
          onClick={() => navigate(`/students/${rec.id}`)}
        >
          <UserOutlined />
          {name}
        </Button>
      ),
    },
    { title: 'Phone', dataIndex: 'phone' },
    {
      title: 'Status',
      dataIndex: 'enrollmentStatus',
      render: (s?: string) => s ? <StatusBadge status={s} /> : '—',
    },
    { title: 'Batch', dataIndex: 'batchName', render: (v?: string) => v ?? '—' },
    {
      title: 'Dues',
      dataIndex: 'dueAmount',
      render: (v?: number) =>
        v && v > 0 ? <MoneyDisplay paise={v} variant="danger" /> : <span className="text-green-600">Clear</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${data?.total ?? 0} total students`}
        actions={
          <ExportButton
            onExport={() => Promise.resolve(new Blob(['name,phone\n'], { type: 'text/csv' }))}
            filename="students.csv"
          />
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <Input.Search
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v as string | undefined); setPage(1) }}
          style={{ width: 180 }}
          options={STATUS_OPTIONS}
        />
      </div>

      <Table
        dataSource={students}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        size="middle"
        className="bg-white rounded-lg"
        onRow={(rec) => ({ onClick: () => navigate(`/students/${rec.id}`) })}
      />
    </div>
  )
}
