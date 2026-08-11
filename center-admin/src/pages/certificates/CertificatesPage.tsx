import { CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { certificatesApi } from '@/api/endpoints/certificates'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { Certificate } from '@/types/models'
import { formatDate } from '@/utils/dates'

export function CertificatesPage() {
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const { data: eligible, isLoading, mutate } = useApi<Certificate[]>('/certificates/eligible')
  const { data: issued, isLoading: issuedLoading, mutate: mutateIssued } = useApi<Certificate[]>('/certificates')

  const selectedCerts = (eligible ?? []).filter((c) => selectedKeys.includes(c.studentId))
  const totalHoFee = selectedCerts.reduce((s, c) => s + c.hoFee, 0)

  const handleRequestConfirm = async () => {
    setRequesting(true)
    try {
      await certificatesApi.requestIssuance({ studentIds: selectedCerts.map((c) => c.studentId) })
      setSelectedKeys([])
      setConfirming(false)
      void mutate()
      void mutateIssued()
    } finally {
      setRequesting(false)
    }
  }

  const eligibleColumns: ColumnsType<Certificate> = [
    { title: 'Student', dataIndex: 'studentName' },
    { title: 'Course', dataIndex: 'courseName' },
    {
      title: 'Eligibility',
      dataIndex: 'eligibilityReasons',
      render: (reasons: string[]) => (
        <div className="flex gap-1 flex-wrap">
          {reasons.map((r) => (
            <Tag key={r} color="green" icon={<CheckCircleOutlined />} className="text-xs">
              {r}
            </Tag>
          ))}
        </div>
      ),
    },
    { title: 'HO Fee', dataIndex: 'hoFee', render: (v: number) => <MoneyDisplay paise={v} /> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
  ]

  const issuedColumns: ColumnsType<Certificate> = [
    { title: 'Student', dataIndex: 'studentName' },
    { title: 'Course', dataIndex: 'courseName' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
    {
      title: 'Issued On',
      dataIndex: 'issuedAt',
      render: (d?: string) => (d ? formatDate(d) : '—'),
    },
    {
      title: 'Download',
      render: (_v: unknown, rec: Certificate) =>
        rec.status === 'issued' && rec.id ? (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={async () => {
              if (!rec.id) return
              const blob = await certificatesApi.download(rec.id)
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `certificate-${rec.studentName}.pdf`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download PDF
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Certificates"
        subtitle="Request issuance for eligible students"
        actions={
          <Button
            type="primary"
            disabled={selectedKeys.length === 0}
            onClick={() => setConfirming(true)}
            icon={<CheckCircleOutlined />}
          >
            Request Issuance ({selectedKeys.length})
          </Button>
        }
      />

      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 text-gray-700">Eligible Students</h3>
        {(eligible ?? []).length === 0 && !isLoading && (
          <Alert
            type="info"
            showIcon
            message="No students are currently eligible for certificate issuance."
            className="mb-4"
          />
        )}
        <Table
          dataSource={eligible ?? []}
          columns={eligibleColumns}
          rowKey="studentId"
          loading={isLoading}
          pagination={false}
          size="middle"
          className="bg-white rounded-lg"
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
          }}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3 text-gray-700">All Certificate Requests</h3>
        <Table
          dataSource={issued ?? []}
          columns={issuedColumns}
          rowKey={(r) => r.id ?? r.studentId}
          loading={issuedLoading}
          pagination={{ pageSize: 20 }}
          size="middle"
          className="bg-white rounded-lg"
        />
      </div>

      <Modal
        open={confirming}
        onCancel={() => setConfirming(false)}
        title="Confirm Certificate Issuance Request"
        footer={[
          <Button key="cancel" onClick={() => setConfirming(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={requesting}
            onClick={handleRequestConfirm}
          >
            Confirm & Submit to HO
          </Button>,
        ]}
      >
        <p>
          You are requesting certificates for <strong>{selectedCerts.length} students</strong>.
        </p>
        <p>
          HO certificate fee total:{' '}
          <strong>
            <MoneyDisplay paise={totalHoFee} />
          </strong>
        </p>
        <ul className="mt-3 text-sm text-gray-600 list-disc pl-5">
          {selectedCerts.map((c) => (
            <li key={c.studentId}>
              {c.studentName} — {c.courseName}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
