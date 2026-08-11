import { SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { FeeInstallment, DuesAgingBuckets } from '@/types/api'
import { formatDate, isOverdue } from '@/utils/dates'
import { CollectPaymentModal } from './CollectPaymentModal'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types/api'

export function FeesPage() {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()
  const [selectedStudentName, setSelectedStudentName] = useState('')
  const [collectInstallment, setCollectInstallment] = useState<FeeInstallment | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [searching, setSearching] = useState(false)

  const { data: aging } = useApi<DuesAgingBuckets>('/fees/dues-aging')
  const { data: installments, isLoading, mutate } = useApi<FeeInstallment[]>(
    selectedStudentId ? `/fees/installments?studentId=${selectedStudentId}` : null,
  )

  const searchStudent = async () => {
    if (!studentSearch.trim()) return
    setSearching(true)
    try {
      const res = await apiClient.get<ApiResponse<{ id: string; name: string } | null>>(
        '/students/search',
        { params: { phone: studentSearch } },
      )
      if (res.data.data) {
        setSelectedStudentId(res.data.data.id)
        setSelectedStudentName(res.data.data.name)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleCollect = (installment: FeeInstallment) => {
    setCollectInstallment(installment)
    setModalOpen(true)
  }

  const columns: ColumnsType<FeeInstallment> = [
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      render: (d: string, rec) => (
        <span className={(rec.status === 'pending' || rec.status === 'overdue') && isOverdue(d) ? 'text-red-500 font-medium' : ''}>
          {formatDate(d)}
        </span>
      ),
    },
    { title: 'Amount', dataIndex: 'amount', render: (v: number) => <MoneyDisplay paise={v} /> },
    {
      title: 'Late Fee',
      dataIndex: 'lateFee',
      render: (v: number) => (v > 0 ? <MoneyDisplay paise={v} variant="danger" /> : '—'),
    },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      render: (v?: number) => (v ? <MoneyDisplay paise={v} variant="success" /> : '—'),
    },
    {
      title: 'Action',
      render: (_v: unknown, rec: FeeInstallment) =>
        rec.status === 'pending' || rec.status === 'overdue' ? (
          <Button type="primary" size="small" onClick={() => handleCollect(rec)}>
            Collect
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Fees" subtitle="Collect payments and track dues" />

      {aging && (
        <Row gutter={[16, 16]} className="mb-6">
          {[
            { label: '0–7 Days', total: aging.bucket0to7Days, count: aging.studentCount0to7, cls: 'bg-yellow-50 border-yellow-200' },
            { label: '8–30 Days', total: aging.bucket8to30Days, count: aging.studentCount8to30, cls: 'bg-orange-50 border-orange-200' },
            { label: '31+ Days', total: aging.bucket31PlusDays, count: aging.studentCount31Plus, cls: 'bg-red-50 border-red-200' },
          ].map((b) => (
            <Col xs={24} sm={8} key={b.label}>
              <div className={`rounded-lg border p-4 ${b.cls}`}>
                <div className="text-xs text-gray-500 mb-1">{b.label} overdue</div>
                <div className="text-xl font-bold">
                  <MoneyDisplay paise={b.total} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{b.count} students</div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Card className="mb-4">
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search Student</label>
            <Input
              placeholder="Phone number or name"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              onPressEnter={searchStudent}
              style={{ width: 260 }}
              suffix={<SearchOutlined className="text-gray-400 cursor-pointer" onClick={searchStudent} />}
            />
          </div>
          <Button onClick={searchStudent} loading={searching}>
            Search
          </Button>
          {selectedStudentName && (
            <span className="text-sm font-medium text-gray-700">
              Showing: <strong>{selectedStudentName}</strong>
            </span>
          )}
        </div>
      </Card>

      {selectedStudentId ? (
        <Table
          dataSource={installments ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
          className="bg-white rounded-lg"
          summary={(rows) => {
            const totalDue = rows.reduce(
              (s, r) => s + (r.status !== 'paid' && r.status !== 'waived' ? r.amount + r.lateFee : 0),
              0,
            )
            return (
              <Table.Summary.Row className="bg-gray-50 font-medium">
                <Table.Summary.Cell index={0} colSpan={2}>
                  Total Outstanding
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <MoneyDisplay paise={totalDue} variant="danger" />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={3} />
              </Table.Summary.Row>
            )
          }}
        />
      ) : (
        <div className="bg-white rounded-lg p-12 text-center text-gray-400">
          Search for a student above to view their fee installments.
        </div>
      )}

      {collectInstallment && selectedStudentId && (
        <CollectPaymentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            void mutate()
          }}
          studentId={selectedStudentId}
          installment={collectInstallment}
        />
      )}
    </div>
  )
}
