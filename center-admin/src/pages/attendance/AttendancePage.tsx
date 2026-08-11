import { CheckOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, DatePicker, Radio, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { attendanceApi } from '@/api/endpoints/attendance'
import { ExportButton } from '@/components/shared/ExportButton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import type { Batch, Course } from '@/types/models'
import type { AttendanceRecord } from '@/types/models'
import { nowIST } from '@/utils/dates'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'holiday'

interface EditableRecord extends AttendanceRecord {
  markedStatus?: AttendanceStatus
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'holiday']
const STATUS_COLORS: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'orange',
  holiday: 'blue',
}

export function AttendancePage() {
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>()
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>()
  const [date, setDate] = useState<dayjs.Dayjs>(nowIST())
  const [localRecords, setLocalRecords] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  const { data: courses } = useApi<Course[]>('/courses')
  const { data: batches } = useApi<Batch[]>(
    selectedCourse ? `/batches?courseId=${selectedCourse}&status=active` : null,
  )
  const { data: register, isLoading, mutate } = useApi<AttendanceRecord[]>(
    selectedBatch ? `/attendance?batchId=${selectedBatch}&date=${date.format('YYYY-MM-DD')}` : null,
  )

  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    ;(register ?? []).forEach((r) => { next[r.studentId] = status })
    setLocalRecords(next)
  }

  const handleSave = async () => {
    if (!selectedBatch) return
    setSaving(true)
    try {
      const records = (register ?? []).map((r) => ({
        studentId: r.studentId,
        enrollmentId: r.enrollmentId,
        date: date.format('YYYY-MM-DD'),
        status: localRecords[r.studentId] ?? r.status,
      }))
      await attendanceApi.markBulk(records)
      void mutate()
      setLocalRecords({})
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<EditableRecord> = [
    { title: 'Student', dataIndex: 'studentName' },
    {
      title: 'Status',
      render: (_v: unknown, rec: EditableRecord) => {
        const current = (localRecords[rec.studentId] ?? rec.status) as AttendanceStatus
        return (
          <Radio.Group
            value={current}
            size="small"
            onChange={(e) =>
              setLocalRecords((prev) => ({ ...prev, [rec.studentId]: e.target.value as AttendanceStatus }))
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <Radio.Button key={s} value={s}>
                <Tag
                  color={STATUS_COLORS[s]}
                  style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Tag>
              </Radio.Button>
            ))}
          </Radio.Group>
        )
      },
    },
  ]

  const hasChanges = Object.keys(localRecords).length > 0

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance for a batch"
        actions={
          <>
            <ExportButton
              onExport={() => Promise.resolve(new Blob(['student,status\n'], { type: 'text/csv' }))}
              filename={`attendance-${date.format('YYYY-MM-DD')}.csv`}
            />
            {hasChanges && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Save Attendance
              </Button>
            )}
          </>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap items-end bg-white rounded-lg p-4 border border-gray-100">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Course</label>
          <Select
            placeholder="Select course"
            style={{ width: 200 }}
            onChange={(v) => { setSelectedCourse(v as string); setSelectedBatch(undefined) }}
            allowClear
          >
            {(courses ?? []).map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Batch</label>
          <Select
            placeholder="Select batch"
            style={{ width: 200 }}
            disabled={!selectedCourse}
            value={selectedBatch}
            onChange={(v) => setSelectedBatch(v as string)}
            allowClear
          >
            {(batches ?? []).map((b) => (
              <Select.Option key={b.id} value={b.id}>
                {b.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <DatePicker
            value={date}
            onChange={(d) => { if (d) setDate(d) }}
            disabledDate={(d) => d && d.isAfter(dayjs())}
            format="DD MMM YYYY"
          />
        </div>
        {selectedBatch && (register ?? []).length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAll('present')}
            >
              Mark All Present
            </Button>
            <Button size="small" onClick={() => handleMarkAll('absent')}>
              Mark All Absent
            </Button>
          </div>
        )}
      </div>

      {selectedBatch ? (
        <Table
          dataSource={register ?? []}
          columns={columns}
          rowKey="studentId"
          loading={isLoading}
          pagination={false}
          size="middle"
          className="bg-white rounded-lg"
        />
      ) : (
        <div className="bg-white rounded-lg p-12 text-center text-gray-400">
          Select a course and batch to mark attendance.
        </div>
      )}
    </div>
  )
}
