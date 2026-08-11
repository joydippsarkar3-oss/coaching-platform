import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Descriptions, Skeleton, Table, Tabs, Tag } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studentsApi } from '@/api/endpoints/students'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { Student, Enrollment, AttendanceRecord, Certificate } from '@/types/models'
import { formatDate } from '@/utils/dates'

interface NoteRecord { id: string; note: string; createdAt: string }
interface ExamRecord { examId: string; examName: string; status: string; score?: number; completedAt?: string }
interface ConsentRecord { type: string; consentedAt: string; method: string }

function OverviewTab({ student }: { student: Student }) {
  return (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="Phone">{student.phone}</Descriptions.Item>
      <Descriptions.Item label="Email">{student.email ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Date of Birth">{formatDate(student.dob)}</Descriptions.Item>
      <Descriptions.Item label="Gender" className="capitalize">{student.gender}</Descriptions.Item>
      <Descriptions.Item label="Address" span={2}>{student.address}</Descriptions.Item>
      {student.guardianName && (
        <Descriptions.Item label="Guardian" span={2}>
          {student.guardianName} ({student.guardianRelation ?? '—'}) — {student.guardianPhone}
        </Descriptions.Item>
      )}
      <Descriptions.Item label="Added">{formatDate(student.createdAt)}</Descriptions.Item>
    </Descriptions>
  )
}

function EnrollmentsTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useApi<Enrollment[]>(`/students/${studentId}/enrollments`)
  return (
    <Table
      dataSource={data ?? []}
      loading={isLoading}
      rowKey="id"
      size="small"
      pagination={false}
      columns={[
        { title: 'Course', dataIndex: 'courseName' },
        { title: 'Batch', dataIndex: 'batchName' },
        { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
        { title: 'Admitted', dataIndex: 'admittedAt', render: (d: string) => formatDate(d) },
        { title: 'Total', dataIndex: 'totalFees', render: (v: number) => <MoneyDisplay paise={v} /> },
        { title: 'Paid', dataIndex: 'paidAmount', render: (v: number) => <MoneyDisplay paise={v} variant="success" /> },
        { title: 'Due', dataIndex: 'dueAmount', render: (v: number) => v > 0 ? <MoneyDisplay paise={v} variant="danger" /> : '—' },
      ]}
    />
  )
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useApi<AttendanceRecord[]>(`/students/${studentId}/attendance`)
  const statusColors: Record<string, string> = { present: 'green', absent: 'red', late: 'orange', holiday: 'blue' }
  return (
    <Table
      dataSource={data ?? []}
      loading={isLoading}
      rowKey={(r) => `${r.date}-${r.enrollmentId}`}
      size="small"
      pagination={{ pageSize: 20 }}
      columns={[
        { title: 'Date', dataIndex: 'date', render: (d: string) => formatDate(d) },
        { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={statusColors[s] ?? 'default'}>{s}</Tag> },
        { title: 'Marked By', dataIndex: 'markedBy', render: (v?: string) => v ?? '—' },
      ]}
    />
  )
}

function ExamsTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useApi<ExamRecord[]>(`/students/${studentId}/exams`)
  return (
    <Table
      dataSource={data ?? []}
      loading={isLoading}
      rowKey="examId"
      size="small"
      pagination={false}
      columns={[
        { title: 'Exam', dataIndex: 'examName' },
        { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
        { title: 'Score', dataIndex: 'score', render: (v?: number) => v ?? '—' },
        { title: 'Completed', dataIndex: 'completedAt', render: (d?: string) => d ? formatDate(d) : '—' },
      ]}
    />
  )
}

function CertificatesTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useApi<Certificate[]>(`/students/${studentId}/certificates`)
  return (
    <Table
      dataSource={data ?? []}
      loading={isLoading}
      rowKey="enrollmentId"
      size="small"
      pagination={false}
      columns={[
        { title: 'Course', dataIndex: 'courseName' },
        { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
        { title: 'HO Fee', dataIndex: 'hoFee', render: (v: number) => <MoneyDisplay paise={v} /> },
        {
          title: 'Download',
          render: (_v: unknown, rec: Certificate) =>
            rec.status === 'issued' && rec.certificateUrl
              ? <Button size="small" type="link" onClick={() => window.open(rec.certificateUrl, '_blank')}>Download</Button>
              : '—',
        },
      ]}
    />
  )
}

function ConsentsTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useApi<ConsentRecord[]>(`/students/${studentId}/consents`)
  return (
    <Table
      dataSource={data ?? []}
      loading={isLoading}
      rowKey="type"
      size="small"
      pagination={false}
      columns={[
        { title: 'Type', dataIndex: 'type' },
        { title: 'Method', dataIndex: 'method' },
        { title: 'Date', dataIndex: 'consentedAt', render: (d: string) => formatDate(d) },
      ]}
    />
  )
}

function NotesTab({ studentId }: { studentId: string }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { data, isLoading, mutate } = useApi<NoteRecord[]>(`/students/${studentId}/notes`)

  const addNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    try {
      await studentsApi.addNote(studentId, note)
      setNote('')
      void mutate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void addNote() }}
        />
        <Button type="primary" size="small" onClick={addNote} loading={saving}>Add</Button>
      </div>
      <Table
        dataSource={data ?? []}
        loading={isLoading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Note', dataIndex: 'note' },
          { title: 'Date', dataIndex: 'createdAt', render: (d: string) => formatDate(d) },
        ]}
      />
    </div>
  )
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student, isLoading } = useApi<Student>(id ? `/students/${id}` : null)

  if (isLoading) return <Skeleton active />
  if (!student) return <div className="text-gray-500 p-8 text-center">Student not found.</div>

  const tabItems = [
    { key: 'overview', label: 'Overview', children: <OverviewTab student={student} /> },
    { key: 'enrollments', label: 'Enrollments', children: <EnrollmentsTab studentId={student.id} /> },
    { key: 'fees', label: 'Fees', children: <EnrollmentsTab studentId={student.id} /> },
    { key: 'attendance', label: 'Attendance', children: <AttendanceTab studentId={student.id} /> },
    { key: 'exams', label: 'Exams', children: <ExamsTab studentId={student.id} /> },
    { key: 'certificates', label: 'Certificates', children: <CertificatesTab studentId={student.id} /> },
    { key: 'consents', label: 'Consents', children: <ConsentsTab studentId={student.id} /> },
    { key: 'notes', label: 'Notes', children: <NotesTab studentId={student.id} /> },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} type="link" onClick={() => navigate(-1)} className="mb-4 pl-0">
        Back to Students
      </Button>
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          {student.photoUrl
            ? <Avatar size={64} src={student.photoUrl} />
            : <Avatar size={64} icon={<UserOutlined />} className="bg-blue-500" />}
          <div>
            <h2 className="text-xl font-semibold m-0">{student.name}</h2>
            <p className="text-gray-500 m-0">{student.phone}{student.email ? ` · ${student.email}` : ''}</p>
          </div>
        </div>
      </Card>
      <Card>
        <Tabs items={tabItems} destroyInactiveTabPane />
      </Card>
    </div>
  )
}
