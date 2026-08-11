import { DeleteOutlined, PlusOutlined, TagsOutlined, WalletOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { useApi } from '@/hooks/useApi'
import { formatMoney } from '@/utils/money'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type {
  CenterWalletBalance,
  CenterTransaction,
  PromoCode,
  CreatePromoCodePayload,
} from '@/api/endpoints/wallet'

// ── Wallet Tab ──────────────────────────────────────────────────────────────

function WalletTab() {
  const { data: balance, isLoading: balanceLoading } =
    useApi<CenterWalletBalance>('/center/wallet/balance')
  const { data: transactions, isLoading: txLoading } =
    useApi<CenterTransaction[]>('/center/wallet/transactions?page=1&pageSize=50')

  const txColumns: ColumnsType<CenterTransaction> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 90,
      render: (t: 'credit' | 'debit') =>
        t === 'credit' ? <Tag color="green">Credit</Tag> : <Tag color="red">Debit</Tag>,
      filters: [
        { text: 'Credit', value: 'credit' },
        { text: 'Debit', value: 'debit' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Amount',
      dataIndex: 'amountPaise',
      width: 140,
      align: 'right',
      render: (v: number, rec) => (
        <MoneyDisplay paise={v} variant={rec.type === 'credit' ? 'success' : 'danger'} />
      ),
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceAfterPaise',
      width: 140,
      align: 'right',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
  ]

  return (
    <>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card loading={balanceLoading} className="bg-blue-50 border-blue-200">
            <div className="text-xs text-gray-500 mb-1">Total Balance</div>
            <div className="text-3xl font-bold text-blue-700">
              {balance ? formatMoney(balance.totalBalancePaise) : '—'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={balanceLoading} className="bg-green-50 border-green-200">
            <div className="text-xs text-gray-500 mb-1">Commission Earned</div>
            <div className="text-2xl font-semibold text-green-700">
              {balance ? formatMoney(balance.commissionEarnedPaise) : '—'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={balanceLoading} className="bg-orange-50 border-orange-200">
            <div className="text-xs text-gray-500 mb-1">Pending Settlement</div>
            <div className="text-2xl font-semibold text-orange-600">
              {balance ? formatMoney(balance.pendingSettlementPaise) : '—'}
            </div>
            {balance?.lastSettledAt && (
              <div className="text-xs text-gray-400 mt-1">
                Last settled {dayjs(balance.lastSettledAt).format('DD MMM YYYY')}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Table<CenterTransaction>
        dataSource={transactions ?? []}
        columns={txColumns}
        rowKey="id"
        loading={txLoading}
        size="middle"
        className="bg-white rounded-lg"
        locale={{ emptyText: 'No transactions yet.' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
    </>
  )
}

// ── Promo Codes Tab ─────────────────────────────────────────────────────────

function PromoCodesTab() {
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { data: promoCodes, isLoading, mutate } = useApi<PromoCode[]>('/center/promo-codes')

  const handleCreate = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post<ApiResponse<PromoCode>>('/center/promo-codes', {
        code: (values.code as string).toUpperCase().trim(),
        discountPercent: values.discountPercent as number,
        validFrom: (values.validFrom as dayjs.Dayjs).format('YYYY-MM-DD'),
        validTo: (values.validTo as dayjs.Dayjs).format('YYYY-MM-DD'),
        maxUses: values.maxUses as number,
      } satisfies CreatePromoCodePayload)
      message.success('Promo code created')
      setModalOpen(false)
      form.resetFields()
      void mutate()
    } catch {
      message.error('Failed to create promo code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/center/promo-codes/${id}`)
      message.success('Promo code deleted')
      void mutate()
    } catch {
      message.error('Failed to delete promo code')
    }
  }

  const columns: ColumnsType<PromoCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      render: (c: string) => (
        <span className="font-mono font-semibold tracking-wider">{c}</span>
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discountPercent',
      width: 100,
      render: (v: number) => <Tag color="blue">{v}%</Tag>,
    },
    {
      title: 'Valid From',
      dataIndex: 'validFrom',
      width: 130,
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    {
      title: 'Valid To',
      dataIndex: 'validTo',
      width: 130,
      render: (v: string) => {
        const expired = dayjs(v).isBefore(dayjs(), 'day')
        return (
          <span className={expired ? 'text-red-500' : ''}>
            {dayjs(v).format('DD MMM YYYY')}
          </span>
        )
      },
    },
    {
      title: 'Uses',
      width: 110,
      render: (_: unknown, rec: PromoCode) => (
        <span>
          {rec.useCount}
          <span className="text-gray-400"> / {rec.maxUses}</span>
        </span>
      ),
    },
    {
      title: 'Status',
      width: 100,
      render: (_: unknown, rec: PromoCode) => {
        const expired = dayjs(rec.validTo).isBefore(dayjs(), 'day')
        const exhausted = rec.useCount >= rec.maxUses
        if (!rec.isActive || expired) return <Tag color="default">Inactive</Tag>
        if (exhausted) return <Tag color="orange">Exhausted</Tag>
        return <Tag color="green">Active</Tag>
      },
    },
    {
      title: '',
      width: 60,
      align: 'center',
      render: (_: unknown, rec: PromoCode) => (
        <Popconfirm
          title="Delete promo code?"
          description="This action cannot be undone."
          onConfirm={() => handleDelete(rec.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Create Promo Code
        </Button>
      </div>

      <Table<PromoCode>
        dataSource={promoCodes ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        className="bg-white rounded-lg"
        locale={{ emptyText: 'No promo codes yet. Create one above.' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <Modal
        open={modalOpen}
        title="Create Promo Code"
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Create"
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Code is required' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: 'Letters, numbers, - and _ only' },
              { min: 3, message: 'At least 3 characters' },
              { max: 20, message: 'At most 20 characters' },
            ]}
          >
            <Input
              placeholder="e.g. SUMMER25"
              style={{ textTransform: 'uppercase' }}
              maxLength={20}
            />
          </Form.Item>

          <Form.Item
            name="discountPercent"
            label="Discount (%)"
            rules={[
              { required: true, message: 'Discount is required' },
              { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100' },
            ]}
          >
            <InputNumber
              min={1}
              max={100}
              precision={0}
              suffix="%"
              style={{ width: '100%' }}
              placeholder="e.g. 10"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="validFrom"
                label="Valid From"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(form.getFieldValue('validTo'))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="validTo"
                label="Valid To"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(form.getFieldValue('validFrom'))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxUses"
            label="Max Uses"
            rules={[
              { required: true, message: 'Max uses is required' },
              { type: 'number', min: 1, message: 'At least 1' },
            ]}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: '100%' }}
              placeholder="e.g. 100"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ── Main WalletPage ─────────────────────────────────────────────────────────

export function WalletPage() {
  return (
    <div>
      <PageHeader
        title="Wallet & Promos"
        subtitle="Center commission balance and promotional discount codes"
      />
      <Card>
        <Tabs
          defaultActiveKey="wallet"
          items={[
            {
              key: 'wallet',
              label: (
                <span>
                  <WalletOutlined /> Wallet
                </span>
              ),
              children: <WalletTab />,
            },
            {
              key: 'promo-codes',
              label: (
                <span>
                  <TagsOutlined /> Promo Codes
                </span>
              ),
              children: <PromoCodesTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
