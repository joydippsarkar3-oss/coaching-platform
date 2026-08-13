import { CalendarOutlined, DesktopOutlined } from '@ant-design/icons'
import { Button, Form, Modal, Table, TimePicker, Tag, InputNumber, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { examsApi } from '@/api/endpoints/exams'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import type { Exam } from '@/types/models'
import { formatDate } from '@/utils/dates'
import { LiveExamMonitor } from './LiveExamMonitor'
import dayjs from 'dayjs'

export function ExamsPage() {
  const [scheduleExam, setScheduleExam] = useState<Exam | undefined>()
  const [liveExam, setLiveExam] = useState<Exam | undefined>()
  const [scheduling, setScheduling] = useState(false)
  const [form] = Form.useForm()
  const { data: exams, isLoading, mutate } = useApi<Exam[]>('/exams')

  const handleSchedule = async (values: { date: dayjs.Dayjs; time: dayjs.Dayjs; labSeats: number }) => {
    if (!scheduleExam) return
    setScheduling(true)
    try {
      await examsApi.schedule({
        examId: scheduleExam.id,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        labSeats: values.labSeats,
      })
      form.resetFields()
      setScheduleExam(undefined)
      void mutate()
    } finally {
      setScheduling(false)
    }
  }

  const columns: ColumnsType<Exam> = [
    { title: 'Exam Name', dataIndex: 'name' },
    { title: 'Course', dataIndex: 'courseName' },
    { title: 'Duration', dataIndex: 'duration', render: (v: number) => `${v} min` },
    { title: 'Marks', dataIndex: 'totalMarks', render: (v: number, rec) => `${rec.passingMarks}/${v}` },
    {
      title: 'Status',
      render: (_v: unknown, rec: Exam) =>
        rec.isScheduled ? (
          <Tag color="green">
            {formatDate(rec.scheduledDate ?? '')} {rec.scheduledTime}
          </Tag>
        ) : (
          <Tag color="default">Not Scheduled</Tag>
        ),
    },
    {
      title: 'Lab Seats',
      dataIndex: 'labSeats',
      render: (v?: number) => v ?? '—',
    },
    {
      title: 'Actions',
      render: (_v: unknown, rec: Exam) => (
        <div className="flex gap-2">
          {!rec.isScheduled ? (
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => setScheduleExam(rec)}
            >
              Schedule
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<DesktopOutlined />}
              onClick={() => setLiveExam(rec)}
            >
              Lab Mode
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Exams" subtitle="Schedule exams and monitor live sessions" />

      <Table
        dataSource={exams ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        size="middle"
        className="bg-white rounded-lg"
      />

      {/* Schedule modal */}
      <Modal
        open={!!scheduleExam}
        onCancel={() => { setScheduleExam(undefined); form.resetFields() }}
        title={`Schedule: ${scheduleExam?.name}`}
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleSchedule}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" disabledDate={(d) => d && d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="time" label="Start Time" rules={[{ required: true }]}>
            <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item name="labSeats" label="Lab Seats" rules={[{ required: true }]} initialValue={20}>
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setScheduleExam(undefined)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={scheduling}>
              Confirm Schedule
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Lab Mode / Live Monitor drawer */}
      {liveExam && (
        <LiveExamMonitor
          exam={liveExam}
          open={!!liveExam}
          onClose={() => setLiveExam(undefined)}
        />
      )}
    </div>
  )
}
