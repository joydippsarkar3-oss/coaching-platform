import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Drawer, Table, Tabs, Tag } from 'antd'
import { examsApi } from '@/api/endpoints/exams'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { usePollingApi } from '@/hooks/useApi'
import type { Exam, ExamAttempt } from '@/types/models'
import { formatDateTime } from '@/utils/dates'

interface Props {
  exam: Exam
  open: boolean
  onClose: () => void
}

export function LiveExamMonitor({ exam, open, onClose }: Props) {
  const { data: attempts, isLoading: attemptsLoading } = usePollingApi<ExamAttempt[]>(
    open ? `/exams/${exam.id}/attempts` : null,
    10_000,
  )
  const { data: live, isLoading: liveLoading } = usePollingApi<{
    inProgress: number
    flagged: ExamAttempt[]
  }>(open ? `/exams/${exam.id}/live` : null, 5_000)

  const downloadSlips = async () => {
    const blob = await examsApi.generateLoginSlips(exam.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-slips-${exam.name}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loginSlipColumns = [
    { title: 'Student', dataIndex: 'studentName' },
    { title: 'Start Code', dataIndex: 'startCode', render: (v: string) => <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm">{v}</code> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusBadge status={s} /> },
  ]

  const liveColumns = [
    { title: 'Student', dataIndex: 'studentName' },
    { title: 'Started', dataIndex: 'startedAt', render: (d?: string) => d ? formatDateTime(d) : '—' },
    {
      title: 'Flagged',
      dataIndex: 'isFlagged',
      render: (v: boolean, rec: ExamAttempt) =>
        v ? <Tag color="red">{rec.flagReason ?? 'Flagged'}</Tag> : <Tag color="green">OK</Tag>,
    },
  ]

  const tabItems = [
    {
      key: 'login-slips',
      label: 'Login Slips',
      children: (
        <div>
          <div className="flex justify-end mb-3">
            <Button icon={<DownloadOutlined />} onClick={downloadSlips}>
              Download All Slips (PDF)
            </Button>
          </div>
          <Table
            dataSource={attempts ?? []}
            columns={loginSlipColumns}
            rowKey="id"
            loading={attemptsLoading}
            size="small"
            pagination={{ pageSize: 30 }}
          />
        </div>
      ),
    },
    {
      key: 'live',
      label: (
        <span className="flex items-center gap-2">
          Live Monitor
          {live && (
            <Tag color={live.inProgress > 0 ? 'processing' : 'default'}>
              {live.inProgress} in progress
            </Tag>
          )}
        </span>
      ),
      children: (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4 text-sm">
              <span>
                In Progress: <strong className="text-blue-600">{live?.inProgress ?? 0}</strong>
              </span>
              <span>
                Flagged:{' '}
                <strong className="text-red-500">{live?.flagged?.length ?? 0}</strong>
              </span>
            </div>
            <Tag color="processing" className="flex items-center gap-1">
              <ReloadOutlined spin />
              Auto-refreshing
            </Tag>
          </div>
          {(live?.flagged?.length ?? 0) > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-red-600 mb-2">Flagged Attempts</div>
              <Table
                dataSource={live?.flagged ?? []}
                columns={liveColumns}
                rowKey="id"
                loading={liveLoading}
                size="small"
                pagination={false}
              />
            </div>
          )}
          <div className="text-sm font-medium text-gray-600 mb-2">All Active Attempts</div>
          <Table
            dataSource={(attempts ?? []).filter((a) => a.status === 'in_progress')}
            columns={liveColumns}
            rowKey="id"
            loading={liveLoading}
            size="small"
            pagination={false}
          />
        </div>
      ),
    },
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Lab Mode — ${exam.name}`}
      width="80vw"
      extra={
        <Button icon={<DownloadOutlined />} onClick={downloadSlips}>
          Print Slips
        </Button>
      }
    >
      <Tabs items={tabItems} />
    </Drawer>
  )
}
