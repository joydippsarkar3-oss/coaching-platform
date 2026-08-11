import {
  CheckCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth.store'
import { formatMoney, rupeesToPaise } from '@/utils/money'
import { formatDate } from '@/utils/dates'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type {
  WalletSummary,
  WalletTransaction,
  PromoCampaign,
  CreateCampaignPayload,
  ManualCreditPayload,
} from '@/api/endpoints/wallet'

// ── helpers ──────────────────────────────────────────────────────────────────

function txnTypeLabel(type: WalletTransaction['type']): string {
  const map: Record<WalletTransaction['type'], string> = {
    welcome: 'Welcome Bonus',
    referral: 'Referral Reward',
    refund: 'Refund',
    fee_redemption: 'Fee Redemption',
    manual_credit: 'Manual Credit',
  }
  return map[type]
}

function txnTypeColor(type: WalletTransaction['type']): string {
  const map: Record<WalletTransaction['type'], string> = {
    welcome: 'blue',
    referral: 'purple',
    refund: 'cyan',
    fee_redemption: 'volcano',
    manual_credit: 'gold',
  }
  return map[type]
}

// ── WalletDetailDrawer ────────────────────────────────────────────────────────

interface WalletDetailDrawerProps {
  wallet: WalletSummary | null
  onClose: () => void
  canManualCredit: boolean
}

function WalletDetailDrawer({ wallet, onClose, canManualCredit }: WalletDetailDrawerProps) {
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { data: transactions, isLoading, mutate } = useApi<WalletTransaction[]>(
    wallet ? `/wallet/${wallet.studentId}/transactions` : null,
  )

  const txnColumns: ColumnsType<WalletTransaction> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 110,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (t: WalletTransaction['type']) => (
        <Tag color={txnTypeColor(t)}>{txnTypeLabel(t)}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amountPaise',
      align: 'right',
      render: (v: number, rec) => (
        <span className={rec.direction === 'credit' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
          {rec.direction === 'credit' ? '+' : '-'}{formatMoney(v)}
        </span>
      ),
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceAfterPaise',
      align: 'right',
      render: (v: number) => <span className="text-gray-600">{formatMoney(v)}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
  ]

  const handleManualCredit = async () => {
    const values = await creditForm.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post<ApiResponse<WalletTransaction>>('/wallet/manual-credit', {
        studentId: wallet!.studentId,
        amountPaise: rupeesToPaise(values.amountRupees as number),
        reason: values.reason as string,
      } satisfies ManualCreditPayload)
      message.success('Credit applied successfully')
      setCreditModalOpen(false)
      creditForm.resetFields()
      void mutate()
    } catch {
      message.error('Failed to apply credit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Drawer
        open={!!wallet}
        onClose={onClose}
        title={wallet ? `Wallet — ${wallet.studentName}` : ''}
        width={700}
        extra={
          canManualCredit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreditModalOpen(true)}
            >
              Manual Credit
            </Button>
          )
        }
      >
        {wallet && (
          <Row gutter={[16, 16]} className="mb-4">
            {[
              { label: 'Balance', value: formatMoney(wallet.balancePaise), cls: 'text-blue-600' },
              { label: 'Total Earned', value: formatMoney(wallet.totalEarnedPaise), cls: 'text-green-600' },
              { label: 'Total Redeemed', value: formatMoney(wallet.totalRedeemedPaise), cls: 'text-orange-500' },
              { label: 'Expires', value: formatDate(wallet.expiryDate), cls: 'text-gray-700' },
            ].map((s) => (
              <Col xs={12} sm={6} key={s.label}>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                  <div className={`font-bold text-sm ${s.cls}`}>{s.value}</div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        <Table
          dataSource={transactions ?? []}
          columns={txnColumns}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Drawer>

      <Modal
        open={creditModalOpen}
        title="Manual Credit"
        onCancel={() => {
          setCreditModalOpen(false)
          creditForm.resetFields()
        }}
        onOk={handleManualCredit}
        confirmLoading={submitting}
        okText="Apply Credit"
      >
        <Form form={creditForm} layout="vertical" className="mt-4">
          <Form.Item
            name="amountRupees"
            label="Amount (₹)"
            rules={[
              { required: true, message: 'Amount is required' },
              { type: 'number', min: 1, message: 'Amount must be at least ₹1' },
            ]}
          >
            <InputNumber
              prefix="₹"
              min={1}
              precision={0}
              style={{ width: '100%' }}
              placeholder="Enter amount in rupees"
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Reason is required' }]}
          >
            <Input.TextArea rows={3} placeholder="Why is this credit being applied?" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ── StudentWalletsTab ─────────────────────────────────────────────────────────

function StudentWalletsTab() {
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null)
  const [exporting, setExporting] = useState(false)
  const user = useAuthStore((s) => s.user)
  const canManualCredit = user?.role === 'center_admin'

  const { data: wallets, isLoading } = useApi<WalletSummary[]>(
    `/wallet/list${activeSearch ? `?search=${encodeURIComponent(activeSearch)}` : ''}`,
  )

  const handleSearch = () => setActiveSearch(search)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await apiClient.get<Blob>('/wallet/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wallets.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnsType<WalletSummary> = [
    { title: 'Student', dataIndex: 'studentName', sorter: (a, b) => a.studentName.localeCompare(b.studentName) },
    { title: 'Enrollment No.', dataIndex: 'enrollmentNumber' },
    {
      title: 'Balance',
      dataIndex: 'balancePaise',
      align: 'right',
      render: (v: number) => <span className="font-medium text-blue-600">{formatMoney(v)}</span>,
      sorter: (a, b) => a.balancePaise - b.balancePaise,
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Total Earned',
      dataIndex: 'totalEarnedPaise',
      align: 'right',
      render: (v: number) => <span className="text-green-600">{formatMoney(v)}</span>,
    },
    {
      title: 'Total Redeemed',
      dataIndex: 'totalRedeemedPaise',
      align: 'right',
      render: (v: number) => <span className="text-orange-500">{formatMoney(v)}</span>,
    },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search by name or enrollment no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            suffix={<SearchOutlined className="text-gray-400 cursor-pointer" onClick={handleSearch} />}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <Table
        dataSource={wallets ?? []}
        columns={columns}
        rowKey="studentId"
        loading={isLoading}
        size="middle"
        className="bg-white rounded-lg"
        onRow={(rec) => ({ onClick: () => setSelectedWallet(rec), className: 'cursor-pointer hover:bg-blue-50' })}
        pagination={{ pageSize: 20 }}
      />

      <WalletDetailDrawer
        wallet={selectedWallet}
        onClose={() => setSelectedWallet(null)}
        canManualCredit={canManualCredit}
      />
    </div>
  )
}

// ── PromoCampaignsTab ─────────────────────────────────────────────────────────

function PromoCampaignsTab() {
  const [newCampaignOpen, setNewCampaignOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { data: campaigns, isLoading, mutate } = useApi<PromoCampaign[]>('/wallet/campaigns')

  const handleToggle = async (campaign: PromoCampaign, isActive: boolean) => {
    try {
      await apiClient.patch(`/wallet/campaigns/${campaign.id}`, { isActive })
      void mutate()
    } catch {
      message.error('Failed to update campaign')
    }
  }

  const handleCreateCampaign = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post('/api/v1/wallet/campaigns', {
        name: values.name,
        bonusType: values.bonusType,
        bonusAmountPaise: rupeesToPaise(values.bonusAmountRupees as number),
        maxPerStudent: values.maxPerStudent,
        validFrom: (values.validRange[0] as dayjs.Dayjs).format('YYYY-MM-DD'),
        validTo: (values.validRange[1] as dayjs.Dayjs).format('YYYY-MM-DD'),
        redemptionCap: values.redemptionCap,
      } satisfies CreateCampaignPayload)
      message.success('Campaign created')
      setNewCampaignOpen(false)
      form.resetFields()
      void mutate()
    } catch {
      message.error('Failed to create campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<PromoCampaign> = [
    { title: 'Campaign Name', dataIndex: 'name', render: (n: string) => <span className="font-medium">{n}</span> },
    {
      title: 'Type',
      dataIndex: 'bonusType',
      render: (t: PromoCampaign['bonusType']) => {
        const map: Record<PromoCampaign['bonusType'], string> = {
          welcome: 'Welcome',
          referral: 'Referral',
          manual: 'Manual',
        }
        const colors: Record<PromoCampaign['bonusType'], string> = {
          welcome: 'green',
          referral: 'blue',
          manual: 'gold',
        }
        return <Tag color={colors[t]}>{map[t]}</Tag>
      },
    },
    {
      title: 'Bonus Amount',
      dataIndex: 'bonusAmountPaise',
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Validity',
      render: (_: unknown, rec: PromoCampaign) => `${formatDate(rec.validFrom)} – ${formatDate(rec.validTo)}`,
    },
    {
      title: 'Redemptions',
      render: (_: unknown, rec: PromoCampaign) => `${rec.redeemedCount} / ${rec.redemptionCap}`,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      render: (v: boolean, rec: PromoCampaign) => (
        <Switch checked={v} onChange={(checked) => handleToggle(rec, checked)} />
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewCampaignOpen(true)}>
          New Campaign
        </Button>
      </div>

      <Table
        dataSource={campaigns ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        className="bg-white rounded-lg"
        pagination={false}
      />

      <Modal
        open={newCampaignOpen}
        title="New Promo Campaign"
        onCancel={() => {
          setNewCampaignOpen(false)
          form.resetFields()
        }}
        onOk={handleCreateCampaign}
        confirmLoading={submitting}
        okText="Create Campaign"
        width={520}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Campaign Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Summer Welcome Bonus" />
          </Form.Item>
          <Form.Item name="bonusType" label="Bonus Type" rules={[{ required: true, message: 'Select a type' }]}>
            <Select
              placeholder="Select bonus type"
              options={[
                { value: 'welcome', label: 'Welcome (auto on enrollment)' },
                { value: 'referral', label: 'Referral Reward' },
                { value: 'manual', label: 'Manual' },
              ]}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bonusAmountRupees"
                label="Bonus Amount (₹)"
                rules={[{ required: true, message: 'Amount required' }, { type: 'number', min: 1 }]}
              >
                <InputNumber prefix="₹" min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxPerStudent"
                label="Max Per Student"
                rules={[{ required: true, message: 'Required' }, { type: 'number', min: 1 }]}
              >
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="redemptionCap"
            label="Total Redemption Cap"
            rules={[{ required: true, message: 'Required' }, { type: 'number', min: 1 }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Max total redemptions" />
          </Form.Item>
          <Form.Item
            name="validRange"
            label="Valid From / To"
            rules={[{ required: true, message: 'Select date range' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ── Main WalletPage ───────────────────────────────────────────────────────────

export function WalletPage() {
  return (
    <div>
      <PageHeader title="Wallet & Promos" subtitle="Student wallet balances and promotional campaigns" />
      <Card className="mt-0">
        <Tabs
          defaultActiveKey="wallets"
          items={[
            {
              key: 'wallets',
              label: (
                <span>
                  <CheckCircleOutlined /> Student Wallets
                </span>
              ),
              children: <StudentWalletsTab />,
            },
            {
              key: 'campaigns',
              label: (
                <span>
                  <Badge dot offset={[4, 0]}>
                    Promo Campaigns
                  </Badge>
                </span>
              ),
              children: <PromoCampaignsTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
