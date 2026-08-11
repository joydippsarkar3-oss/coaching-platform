import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Form, Row, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import { useState } from 'react'
import { reportsApi } from '@/api/endpoints/reports'
import { useApi } from '@/hooks/useApi'
import type { Batch } from '@/types/models'
import { PageHeader } from '@/components/shared/PageHeader'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export function ReportsPage() {
  const [admissionsRange, setAdmissionsRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [feesRange, setFeesRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [attendanceBatch, setAttendanceBatch] = useState<string | undefined>()
  const [attendanceMonth, setAttendanceMonth] = useState<dayjs.Dayjs | null>(null)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})

  const { data: batches } = useApi<{ data: Batch[]; total: number }>('/batches')

  const download = async (key: string, fn: () => Promise<Blob>, filename: string) => {
    setDownloading((d) => ({ ...d, [key]: true }))
    try {
      const blob = await fn()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading((d) => ({ ...d, [key]: false }))
    }
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Download data exports" />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Admissions Report" size="small">
            <Form layout="vertical">
              <Form.Item label="Date Range">
                <RangePicker
                  className="w-full"
                  onChange={(dates) =>
                    setAdmissionsRange(
                      dates ? [dates[0] as dayjs.Dayjs, dates[1] as dayjs.Dayjs] : null,
                    )
                  }
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!admissionsRange}
                loading={downloading['admissions']}
                block
                onClick={() =>
                  download(
                    'admissions',
                    () =>
                      reportsApi.exportAdmissions({
                        startDate: admissionsRange![0].format('YYYY-MM-DD'),
                        endDate: admissionsRange![1].format('YYYY-MM-DD'),
                      }),
                    `admissions-${admissionsRange![0].format('YYYY-MM-DD')}.csv`,
                  )
                }
              >
                Download CSV
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Fees Collection Report" size="small">
            <Form layout="vertical">
              <Form.Item label="Date Range">
                <RangePicker
                  className="w-full"
                  onChange={(dates) =>
                    setFeesRange(
                      dates ? [dates[0] as dayjs.Dayjs, dates[1] as dayjs.Dayjs] : null,
                    )
                  }
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!feesRange}
                loading={downloading['fees']}
                block
                onClick={() =>
                  download(
                    'fees',
                    () =>
                      reportsApi.exportFees({
                        startDate: feesRange![0].format('YYYY-MM-DD'),
                        endDate: feesRange![1].format('YYYY-MM-DD'),
                      }),
                    `fees-${feesRange![0].format('YYYY-MM-DD')}.csv`,
                  )
                }
              >
                Download CSV
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Attendance Report" size="small">
            <Form layout="vertical">
              <Form.Item label="Batch (optional)">
                <Select
                  placeholder="All batches"
                  allowClear
                  value={attendanceBatch}
                  onChange={(v) => setAttendanceBatch(v as string | undefined)}
                >
                  {(batches?.data ?? []).map((b) => (
                    <Select.Option key={b.id} value={b.id}>
                      {b.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Month">
                <DatePicker
                  picker="month"
                  className="w-full"
                  onChange={(d) => setAttendanceMonth(d)}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!attendanceMonth}
                loading={downloading['attendance']}
                block
                onClick={() =>
                  download(
                    'attendance',
                    () =>
                      reportsApi.exportAttendance({
                        batchId: attendanceBatch,
                        month: attendanceMonth!.format('YYYY-MM'),
                      }),
                    `attendance-${attendanceMonth!.format('YYYY-MM')}.csv`,
                  )
                }
              >
                Download CSV
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
