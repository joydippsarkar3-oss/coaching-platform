import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Table,
  Tabs,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { enquiriesApi } from '@/api/endpoints/enquiries'
import { ExportButton } from '@/components/shared/ExportButton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { Enquiry, EnquiryStage } from '@/types/models'
import { formatDate, isOverdue } from '@/utils/dates'

const STAGES: EnquiryStage[] = ['new', 'contacted', 'visited', 'admitted', 'lost']
const SOURCES = ['walk_in', 'referral', 'social_media', 'website', 'other']

export function EnquiriesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeStage, setActiveStage] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const [duplicatePhone, setDuplicatePhone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const params = activeStage === 'all' ? { search } : { stage: activeStage, search }
  const { data, isLoading, mutate } = useApi<{ data: Enquiry[]; total: number }>(
    `/enquiries?${new URLSearchParams(params as Record<string, string>).toString()}`,
  )
  const enquiries = data?.data ?? []

  const handlePhoneBlur = async (phone: string) => {
    if (phone.length === 10) {
      try {
        const res = await enquiriesApi.checkDuplicate(phone)
        setDuplicatePhone(res.data.data.isDuplicate)
      } catch {
        setDuplicatePhone(false)
      }
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true)
    try {
      await enquiriesApi.create({
        name: values.name as string,
        phone: values.phone as string,
        courseInterest: values.courseInterest as string,
        source: values.source as string,
        followUpDate: values.followUpDate
          ? (values.followUpDate as { format: (f: string) => string }).format('YYYY-MM-DD')
          : undefined,
        notes: values.notes as string | undefined,
      })
      form.resetFields()
      setDrawerOpen(false)
      setDuplicatePhone(false)
      void mutate()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<Enquiry> = [
    {
      title: t('enquiries.name'),
      dataIndex: 'name',
      render: (name: string, rec) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/enquiries/${rec.id}`)}>
          {name}
        </Button>
      ),
    },
    { title: t('enquiries.phone'), dataIndex: 'phone' },
    {
      title: t('enquiries.course'),
      dataIndex: 'courseInterest',
    },
    {
      title: t('enquiries.source'),
      dataIndex: 'source',
      render: (s: string) => <Tag>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: t('enquiries.stage'),
      dataIndex: 'stage',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('enquiries.followUpDate'),
      dataIndex: 'followUpDate',
      render: (d?: string) =>
        d ? (
          <span className={isOverdue(d) ? 'text-red-500 font-medium' : ''}>
            {formatDate(d)}
          </span>
        ) : (
          '—'
        ),
      sorter: (a, b) => (a.followUpDate ?? '').localeCompare(b.followUpDate ?? ''),
    },
  ]

  const tabItems = [
    { key: 'all', label: 'All' },
    ...STAGES.map((s) => ({
      key: s,
      label: t(`enquiries.stages.${s}`),
    })),
  ]

  return (
    <div>
      <PageHeader
        title={t('enquiries.title')}
        actions={
          <>
            <ExportButton
              onExport={() => enquiriesApi.list({ stage: activeStage !== 'all' ? activeStage : undefined }).then(() => new Blob())}
              filename="enquiries.csv"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setDrawerOpen(true)}
            >
              {t('enquiries.addNew')}
            </Button>
          </>
        }
      />

      <Tabs
        activeKey={activeStage}
        onChange={setActiveStage}
        items={tabItems}
        className="mb-4"
      />

      <div className="mb-4">
        <Input.Search
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
      </div>

      <Table
        dataSource={enquiries}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        size="middle"
        className="bg-white rounded-lg"
      />

      <Drawer
        title={t('enquiries.addNew')}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); setDuplicatePhone(false) }}
        width={440}
        footer={
          <Button type="primary" onClick={() => form.submit()} loading={saving} block>
            {t('common.save')}
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t('enquiries.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label={t('enquiries.phone')}
            rules={[{ required: true }, { pattern: /^[6-9]\d{9}$/, message: 'Invalid number' }]}
          >
            <Input
              addonBefore="+91"
              maxLength={10}
              onBlur={(e) => handlePhoneBlur(e.target.value)}
            />
          </Form.Item>
          {duplicatePhone && (
            <Alert
              message={t('enquiries.duplicateWarning')}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              className="mb-4"
            />
          )}
          <Form.Item name="courseInterest" label={t('enquiries.course')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="source" label={t('enquiries.source')} rules={[{ required: true }]}>
            <Select>
              {SOURCES.map((s) => (
                <Select.Option key={s} value={s}>
                  {t(`enquiries.sources.${s}`)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="followUpDate" label={t('enquiries.followUpDate')}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="notes" label={t('enquiries.notes')}>
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
