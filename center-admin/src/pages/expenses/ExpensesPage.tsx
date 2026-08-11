import {
  ExclamationCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
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
  Select,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import { formatMoney, rupeesToPaise, paiseToRupees } from '@/utils/money'
import { formatDate } from '@/utils/dates'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type {
  Expense,
  ExpenseCategory,
  CreateExpensePayload,
  InventoryItem,
  CreateInventoryItemPayload,
  ReceiveStockPayload,
  IssueStockPayload,
} from '@/api/endpoints/expenses'

// ── constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Rent',
  salary: 'Salary',
  utilities: 'Utilities',
  marketing: 'Marketing',
  supplies: 'Supplies',
  other: 'Other',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'blue',
  salary: 'purple',
  utilities: 'cyan',
  marketing: 'orange',
  supplies: 'green',
  other: 'default',
}

// ── ExpensesTab ───────────────────────────────────────────────────────────────

function ExpensesTab() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [addOpen, setAddOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const from = dateRange[0].format('YYYY-MM-DD')
  const to = dateRange[1].format('YYYY-MM-DD')

  const { data: expenses, isLoading, mutate } = useApi<Expense[]>(
    `/expenses?from=${from}&to=${to}`,
  )

  // Build category totals for chart
  const categoryTotals = Object.keys(CATEGORY_LABELS).map((cat) => {
    const total = (expenses ?? [])
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amountPaise, 0)
    return { category: CATEGORY_LABELS[cat as ExpenseCategory], total: paiseToRupees(total) }
  })

  const monthTotal = (expenses ?? []).reduce((s, e) => s + e.amountPaise, 0)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await apiClient.get<Blob>('/expenses/export', {
        params: { from, to },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnsType<Expense> = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => formatDate(d), width: 110 },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (c: ExpenseCategory) => (
        <Tag color={CATEGORY_COLORS[c]}>{CATEGORY_LABELS[c]}</Tag>
      ),
    },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    {
      title: 'Amount',
      dataIndex: 'amountPaise',
      align: 'right',
      render: (v: number) => <span className="font-medium">{formatMoney(v)}</span>,
      sorter: (a, b) => a.amountPaise - b.amountPaise,
    },
    { title: 'Recorded By', dataIndex: 'recordedBy', width: 130 },
    {
      title: 'Receipt',
      dataIndex: 'receiptUrl',
      width: 80,
      render: (url?: string) =>
        url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">
            View
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(v) => { if (v?.[0] && v?.[1]) setDateRange([v[0], v[1]]) }}
        />
        <div className="flex gap-2">
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Category chart */}
      {(expenses ?? []).length > 0 && (
        <Card className="mb-4" bodyStyle={{ paddingTop: 12 }}>
          <div className="text-xs text-gray-500 mb-2">Spend by Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryTotals} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `₹${v}`} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`, 'Amount']} />
              <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Table
        dataSource={expenses ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        className="bg-white rounded-lg"
        pagination={{ pageSize: 25 }}
        summary={() => (
          <Table.Summary.Row className="bg-gray-50 font-medium">
            <Table.Summary.Cell index={0} colSpan={3}>
              Total this period
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <span className="font-bold text-gray-800">{formatMoney(monthTotal)}</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} colSpan={2} />
          </Table.Summary.Row>
        )}
      />

      <AddExpenseDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); void mutate() }}
      />
    </div>
  )
}

// ── ReceiveStockModal ─────────────────────────────────────────────────────────

interface ReceiveStockModalProps {
  item: InventoryItem | null
  onClose: () => void
  onSuccess: () => void
}

function ReceiveStockModal({ item, onClose, onSuccess }: ReceiveStockModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post('/inventory/receive', {
        itemId: item!.id,
        quantity: values.quantity as number,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        note: values.note as string | undefined,
      } satisfies ReceiveStockPayload)
      message.success('Stock received')
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Failed to receive stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={!!item}
      title={`Receive Stock — ${item?.name ?? ''}`}
      onCancel={() => { onClose(); form.resetFields() }}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Receive"
    >
      <Form form={form} layout="vertical" className="mt-4" initialValues={{ date: dayjs() }}>
        <Form.Item
          name="quantity"
          label="Quantity Received"
          rules={[{ required: true, message: 'Required' }, { type: 'number', min: 1 }]}
        >
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label="Note (optional)">
          <Input placeholder="e.g. Purchase from supplier" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── IssueStockModal ───────────────────────────────────────────────────────────

interface IssueStockModalProps {
  item: InventoryItem | null
  onClose: () => void
  onSuccess: () => void
}

function IssueStockModal({ item, onClose, onSuccess }: IssueStockModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { data: students } = useApi<{ id: string; name: string }[]>('/students/simple')

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post('/inventory/issue', {
        itemId: item!.id,
        studentId: values.studentId as string,
        quantity: values.quantity as number,
        note: values.note as string | undefined,
      } satisfies IssueStockPayload)
      message.success('Stock issued')
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Failed to issue stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={!!item}
      title={`Issue to Student — ${item?.name ?? ''}`}
      onCancel={() => { onClose(); form.resetFields() }}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Issue"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="studentId" label="Student" rules={[{ required: true, message: 'Select a student' }]}>
          <Select
            showSearch
            placeholder="Search student"
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={students?.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Required' }, { type: 'number', min: 1, max: item?.quantity }]}
        >
          <InputNumber min={1} max={item?.quantity} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label="Note (optional)">
          <Input placeholder="e.g. Study kit" />
        </Form.Item>
        {item && item.costPerUnitPaise > 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 rounded p-2">
            Cost per unit: {formatMoney(item.costPerUnitPaise)} — student will be charged automatically.
          </div>
        )}
      </Form>
    </Modal>
  )
}

// ── AddItemModal ──────────────────────────────────────────────────────────────

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddItemModal({ open, onClose, onSuccess }: AddItemModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await apiClient.post('/inventory', {
        name: values.name as string,
        sku: values.sku as string,
        unit: values.unit as string,
        openingStock: values.openingStock as number,
        costPerUnitPaise: rupeesToPaise(values.costPerUnitRupees as number),
        reorderAt: values.reorderAt as number,
      } satisfies CreateInventoryItemPayload)
      message.success('Item added')
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Add Inventory Item"
      onCancel={() => { onClose(); form.resetFields() }}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Add Item"
      width={500}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item name="name" label="Item Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. Answer Sheet" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="ANS-001" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
              <Input placeholder="pcs / kg / lt" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="openingStock" label="Opening Stock" rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="reorderAt" label="Reorder At" rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="costPerUnitRupees" label="Cost per Unit (₹)" rules={[{ required: true }, { type: 'number', min: 0 }]}>
          <InputNumber prefix="₹" min={0} precision={2} style={{ width: '100%' }} placeholder="0 if free" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── InventoryTab ──────────────────────────────────────────────────────────────

function InventoryTab() {
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [receiveItem, setReceiveItem] = useState<InventoryItem | null>(null)
  const [issueItem, setIssueItem] = useState<InventoryItem | null>(null)
  const { data: items, isLoading, mutate } = useApi<InventoryItem[]>('/inventory')

  const lowStockItems = (items ?? []).filter((i) => i.quantity <= i.reorderAt)

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Item',
      dataIndex: 'name',
      render: (n: string, rec) => (
        <div>
          <span className="font-medium">{n}</span>
          {rec.quantity <= rec.reorderAt && (
            <Badge count="Low" style={{ background: '#ef4444', marginLeft: 6, fontSize: 10 }} />
          )}
        </div>
      ),
    },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: 'Unit', dataIndex: 'unit', width: 70 },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      width: 70,
      align: 'right',
      render: (v: number, rec) => (
        <span className={v <= rec.reorderAt ? 'text-red-500 font-bold' : 'font-medium'}>{v}</span>
      ),
    },
    {
      title: 'Cost/Unit',
      dataIndex: 'costPerUnitPaise',
      align: 'right',
      render: (v: number) => (v > 0 ? formatMoney(v) : <span className="text-gray-300">—</span>),
    },
    {
      title: 'Reorder At',
      dataIndex: 'reorderAt',
      width: 90,
      align: 'right',
    },
    {
      title: 'Actions',
      width: 200,
      render: (_: unknown, rec: InventoryItem) => (
        <div className="flex gap-1">
          <Button size="small" onClick={() => setReceiveItem(rec)}>Receive</Button>
          <Button size="small" onClick={() => setIssueItem(rec)}>Issue</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {lowStockItems.length > 0 && (
        <Alert
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          className="mb-4"
          message={`Low stock alert: ${lowStockItems.map((i) => i.name).join(', ')} — reorder required`}
        />
      )}

      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddItemOpen(true)}>
          Add Item
        </Button>
      </div>

      <Table
        dataSource={items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        className="bg-white rounded-lg"
        pagination={false}
      />

      <AddItemModal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={() => { setAddItemOpen(false); void mutate() }}
      />
      <ReceiveStockModal
        item={receiveItem}
        onClose={() => setReceiveItem(null)}
        onSuccess={() => { setReceiveItem(null); void mutate() }}
      />
      <IssueStockModal
        item={issueItem}
        onClose={() => setIssueItem(null)}
        onSuccess={() => { setIssueItem(null); void mutate() }}
      />
    </div>
  )
}

// ── Main ExpensesPage ─────────────────────────────────────────────────────────

export function ExpensesPage() {
  return (
    <div>
      <PageHeader title="Expenses & Inventory" subtitle="Track spending and manage stock" />
      <Card className="mt-0">
        <Tabs
          defaultActiveKey="expenses"
          items={[
            {
              key: 'expenses',
              label: 'Expenses',
              children: <ExpensesTab />,
            },
            {
              key: 'inventory',
              label: 'Inventory',
              children: <InventoryTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}


interface AddExpenseDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddExpenseDrawer({ open, onClose, onSuccess }: AddExpenseDrawerProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      let receiptBase64: string | undefined
      const fileList = values.receipt?.fileList
      if (fileList?.length) {
        const file = fileList[0].originFileObj as File
        receiptBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.readAsDataURL(file)
        })
      }

      await apiClient.post<ApiResponse<Expense>>('/api/v1/expenses', {
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        category: values.category as ExpenseCategory,
        description: values.description as string,
        amountPaise: rupeesToPaise(values.amountRupees as number),
        receiptBase64,
      } satisfies CreateExpensePayload)

      message.success('Expense recorded')
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Failed to record expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => { onClose(); form.resetFields() }}
      title="Add Expense"
      width={480}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => { onClose(); form.resetFields() }}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            Save Expense
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
        <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Select a category' }]}>
          <Select
            options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            placeholder="Select category"
          />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required' }]}>
          <Input placeholder="e.g. Monthly office rent" />
        </Form.Item>
        <Form.Item
          name="amountRupees"
          label="Amount (₹)"
          rules={[{ required: true, message: 'Amount is required' }, { type: 'number', min: 1 }]}
        >
          <InputNumber prefix="₹" min={1} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Date is required' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="receipt" label="Receipt Photo (optional)">
          <Upload
            maxCount={1}
            accept="image/*"
            beforeUpload={() => false}
            listType="picture"
          >
            <Button>Upload Receipt</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
