import { CheckCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Form, InputNumber, Modal, Radio, Result } from 'antd'
import { useState } from 'react'
import { feesApi } from '@/api/endpoints/fees'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import type { FeeInstallment } from '@/types/api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  studentId: string
  installment: FeeInstallment
}

export function CollectPaymentModal({ open, onClose, onSuccess, studentId, installment }: Props) {
  const [mode, setMode] = useState<'upi' | 'cash'>('upi')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()
  const [upiQr, setUpiQr] = useState<string | undefined>()
  const [form] = Form.useForm()

  const totalAmount = installment.amount + installment.lateFee

  const handleSubmit = async (values: { amount: number; mode: 'upi' | 'cash' }) => {
    setLoading(true)
    setError('')
    try {
      const res = await feesApi.collectPayment({
        studentId,
        installmentId: installment.id,
        amount: values.amount * 100,
        mode,
      })
      setReceiptUrl(res.data.data.receiptUrl)
      if (mode === 'upi' && res.data.data.upiQrData) setUpiQr(res.data.data.upiQrData)
    } catch {
      setError('Payment collection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReceiptUrl(undefined)
    setUpiQr(undefined)
    setError('')
    form.resetFields()
    if (receiptUrl) onSuccess()
    else onClose()
  }

  const downloadReceipt = () => {
    if (receiptUrl) window.open(receiptUrl, '_blank')
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Collect Payment"
      footer={null}
      width={480}
      destroyOnClose
    >
      {!receiptUrl ? (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-between text-sm">
            <span className="text-gray-600">Amount Due</span>
            <MoneyDisplay paise={totalAmount} variant="danger" />
          </div>
          {installment.lateFee > 0 && (
            <div className="flex justify-between text-xs text-gray-500 mb-4 px-1">
              <span>Principal</span>
              <MoneyDisplay paise={installment.amount} />
              <span className="ml-4">Late fee</span>
              <MoneyDisplay paise={installment.lateFee} variant="danger" />
            </div>
          )}

          <Form.Item label="Payment Mode">
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value as 'upi' | 'cash')}>
              <Radio.Button value="upi">UPI / QR</Radio.Button>
              <Radio.Button value="cash">Cash</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (₹)"
            initialValue={totalAmount / 100}
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber min={1} className="w-full" addonBefore="₹" />
          </Form.Item>

          {error && <Alert type="error" message={error} showIcon className="mb-4" />}

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />}>
              Confirm Payment
            </Button>
          </div>
        </Form>
      ) : (
        <Result
          status="success"
          title="Payment Collected"
          subTitle="Receipt generated successfully."
          extra={[
            upiQr && (
              <div key="qr" className="text-center mb-4">
                <p className="text-sm text-gray-600">Scan QR to pay</p>
                <img src={upiQr} alt="UPI QR" className="w-36 h-36 mx-auto border rounded" />
              </div>
            ),
            <Button key="receipt" type="primary" onClick={downloadReceipt}>
              Download Receipt
            </Button>,
            <Button key="close" onClick={handleClose}>Done</Button>,
          ].filter(Boolean)}
        />
      )}
    </Modal>
  )
}
