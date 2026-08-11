import {
  CheckCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Result,
  Select,
  Steps,
  Upload,
} from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { admissionsApi } from '@/api/endpoints/admissions'
import { studentsApi } from '@/api/endpoints/students'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { useApi } from '@/hooks/useApi'
import type { Batch, Course, FeePlan } from '@/types/models'
import type { AdmissionWizardPayload } from '@/types/api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const STEP_TITLES = ['Find Student', 'Student Details', 'Consent', 'Course & Batch', 'Payment']

export function NewAdmissionWizard({ open, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studentId, setStudentId] = useState<string | undefined>()
  const [enrollmentId, setEnrollmentId] = useState<string | undefined>()
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>()
  const [selectedFeePlan, setSelectedFeePlan] = useState<FeePlan | undefined>()
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cash'>('upi')
  const [upiQrData, setUpiQrData] = useState<string | undefined>()
  const [isMinor, setIsMinor] = useState(false)
  const [consentSent, setConsentSent] = useState(false)
  const [consentVerified, setConsentVerified] = useState(false)
  const [consentOtp, setConsentOtp] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [foundStudent, setFoundStudent] = useState<{ id: string; name: string; phone: string } | null | undefined>(
    undefined,
  )

  const [step2Form] = Form.useForm()
  const [step4Form] = Form.useForm()
  const [payForm] = Form.useForm()

  const { data: courses } = useApi<Course[]>('/courses')
  const { data: batches } = useApi<Batch[]>(
    selectedCourse ? `/batches?courseId=${selectedCourse}` : null,
  )
  const { data: feePlans } = useApi<FeePlan[]>(
    selectedCourse ? `/fee-plans?courseId=${selectedCourse}` : null,
  )

  const searchStudent = async () => {
    if (!/^[6-9]\d{9}$/.test(phoneSearch)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await studentsApi.searchByPhone(phoneSearch)
      const s = res.data.data
      setFoundStudent(s ? { id: s.id, name: s.name, phone: s.phone } : null)
      if (s) setStudentId(s.id)
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDobChange = (date: dayjs.Dayjs | null) => {
    if (date) setIsMinor(dayjs().diff(date, 'year') < 18)
  }

  const sendConsentOtp = async () => {
    if (!studentId) return
    setLoading(true)
    try {
      await admissionsApi.sendConsentOtp(studentId)
      setConsentSent(true)
    } catch {
      setError('Failed to send consent OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyConsent = async () => {
    if (!studentId || consentOtp.length !== 6) return
    setLoading(true)
    try {
      const res = await admissionsApi.verifyConsentOtp(studentId, consentOtp)
      if (res.data.data.verified) setConsentVerified(true)
      else setError('Invalid OTP')
    } catch {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (values: { amount: number }) => {
    setLoading(true)
    setError('')
    try {
      const s2 = step2Form.getFieldsValue() as {
        name?: string
        email?: string
        dob?: dayjs.Dayjs
        gender?: string
        address?: string
        guardianName?: string
        guardianPhone?: string
        guardianRelation?: string
      }
      const s4 = step4Form.getFieldsValue() as {
        courseId: string
        batchId: string
        feePlanId: string
        discount?: number
      }
      const payload: AdmissionWizardPayload = {
        studentId,
        studentDetails:
          studentId || !s2.name
            ? undefined
            : {
                name: s2.name,
                phone: phoneSearch,
                email: s2.email,
                dob: s2.dob ? s2.dob.format('YYYY-MM-DD') : '',
                gender: s2.gender ?? 'male',
                address: s2.address ?? '',
                guardianName: s2.guardianName,
                guardianPhone: s2.guardianPhone,
                guardianRelation: s2.guardianRelation,
              },
        consentOtp: consentOtp || undefined,
        courseId: s4.courseId,
        batchId: s4.batchId,
        feePlanId: s4.feePlanId,
        discountAmount: s4.discount ? s4.discount * 100 : 0,
        paymentMode,
        firstPaymentAmount: values.amount * 100,
      }
      const res = await admissionsApi.createAdmission(payload)
      setEnrollmentId(res.data.data.id)
      if (paymentMode === 'upi') {
        const qrRes = await admissionsApi.getUpiQr(values.amount * 100, res.data.data.id)
        setUpiQrData(qrRes.data.data.qrData)
      }
      setCurrent(5)
    } catch {
      setError('Admission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadLetter = async () => {
    if (!enrollmentId) return
    const blob = await admissionsApi.getAdmissionLetter(enrollmentId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'admission-letter.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setCurrent(0)
    setStudentId(undefined)
    setEnrollmentId(undefined)
    setSelectedCourse(undefined)
    setSelectedFeePlan(undefined)
    setPaymentMode('upi')
    setUpiQrData(undefined)
    setIsMinor(false)
    setConsentSent(false)
    setConsentVerified(false)
    setConsentOtp('')
    setPhoneSearch('')
    setFoundStudent(undefined)
    setError('')
    step2Form.resetFields()
    step4Form.resetFields()
    payForm.resetFields()
  }

  const handleClose = () => { reset(); onClose() }
  const handleSuccess = () => { reset(); onSuccess() }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="New Admission"
      width={720}
      footer={null}
      destroyOnClose
    >
      {current < 5 && (
        <Steps
          current={current}
          items={STEP_TITLES.map((t) => ({ title: t }))}
          size="small"
          className="mb-6"
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          className="mb-4"
          closable
          onClose={() => setError('')}
        />
      )}

      {/* Step 0 — Find student */}
      {current === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              addonBefore="+91"
              placeholder="Search by phone number"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              inputMode="numeric"
            />
            <Button onClick={searchStudent} loading={loading}>
              Search
            </Button>
          </div>
          {foundStudent !== undefined && (
            <Alert
              type={foundStudent ? 'info' : 'warning'}
              showIcon
              message={
                foundStudent
                  ? `Found: ${foundStudent.name} (${foundStudent.phone}) — existing student will be linked.`
                  : 'No existing student — a new profile will be created.'
              }
            />
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="primary"
              disabled={phoneSearch.length !== 10}
              onClick={() => setCurrent(1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 1 — Student details */}
      {current === 1 && (
        <Form form={step2Form} layout="vertical">
          {foundStudent ? (
            <Alert
              type="success"
              showIcon
              message={`Using existing student: ${foundStudent.name}`}
              className="mb-4"
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item name="email" label="Email (optional)">
                <Input type="email" />
              </Form.Item>
              <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}>
                <DatePicker
                  className="w-full"
                  disabledDate={(d) => d && d.isAfter(dayjs())}
                  onChange={handleDobChange}
                />
              </Form.Item>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true }]}
                className="col-span-2"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="photo" label="Photo (optional)" className="col-span-2">
                <Upload listType="picture" maxCount={1} beforeUpload={() => false}>
                  <Button>Upload Photo</Button>
                </Upload>
              </Form.Item>
              {isMinor && (
                <>
                  <Form.Item
                    name="guardianName"
                    label="Guardian Name"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="guardianPhone"
                    label="Guardian Phone"
                    rules={[{ required: true }]}
                  >
                    <Input addonBefore="+91" maxLength={10} />
                  </Form.Item>
                  <Form.Item name="guardianRelation" label="Relation">
                    <Input placeholder="e.g. Father, Mother" />
                  </Form.Item>
                </>
              )}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button onClick={() => setCurrent(0)}>Back</Button>
            <Button
              type="primary"
              onClick={() =>
                step2Form
                  .validateFields()
                  .then(() => setCurrent(2))
                  .catch(() => undefined)
              }
            >
              Next
            </Button>
          </div>
        </Form>
      )}

      {/* Step 2 — Consent */}
      {current === 2 && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
            <strong>Consent Notice:</strong> By enrolling, the student agrees to the use of
            personal data for academic records, examination management, and government reporting
            as required by applicable regulations. A copy will be provided upon request.
          </div>
          {!consentSent ? (
            <Button type="default" onClick={sendConsentOtp} loading={loading}>
              Send OTP to +91 {phoneSearch} for Consent
            </Button>
          ) : !consentVerified ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={consentOtp}
                onChange={(e) =>
                  setConsentOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                style={{ width: 200 }}
                inputMode="numeric"
              />
              <Button type="primary" onClick={verifyConsent} loading={loading}>
                Verify
              </Button>
            </div>
          ) : (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Consent confirmed via OTP"
            />
          )}
          <div className="flex justify-between pt-2">
            <Button onClick={() => setCurrent(1)}>Back</Button>
            <Button type="primary" onClick={() => setCurrent(3)} disabled={!consentVerified}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Course + Batch + Fee Plan */}
      {current === 3 && (
        <Form form={step4Form} layout="vertical">
          <Form.Item
            name="courseId"
            label="Course"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select course"
              onChange={(v) => setSelectedCourse(v as string)}
            >
              {(courses ?? []).map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="batchId" label="Batch" rules={[{ required: true }]}>
              <Select placeholder="Select batch" disabled={!selectedCourse}>
                {(batches ?? []).map((b) => (
                  <Select.Option key={b.id} value={b.id}>
                    {b.name} ({b.totalSeats - b.filledSeats} seats left)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="feePlanId" label="Fee Plan" rules={[{ required: true }]}>
              <Select
                placeholder="Select fee plan"
                disabled={!selectedCourse}
                onChange={(id) =>
                  setSelectedFeePlan((feePlans ?? []).find((f) => f.id === id))
                }
              >
                {(feePlans ?? []).map((f) => (
                  <Select.Option key={f.id} value={f.id}>
                    {f.name} — <MoneyDisplay paise={f.totalAmount} />
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {selectedFeePlan && (
              <Form.Item
                name="discount"
                label={`Discount (₹) — HO cap ${selectedFeePlan.maxDiscountPercent}%`}
              >
                <InputNumber
                  min={0}
                  max={
                    (selectedFeePlan.totalAmount / 100) *
                    (selectedFeePlan.maxDiscountPercent / 100)
                  }
                  addonBefore="₹"
                  className="w-full"
                />
              </Form.Item>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button onClick={() => setCurrent(2)}>Back</Button>
            <Button
              type="primary"
              onClick={() =>
                step4Form
                  .validateFields()
                  .then(() => setCurrent(4))
                  .catch(() => undefined)
              }
            >
              Next
            </Button>
          </div>
        </Form>
      )}

      {/* Step 4 — Payment */}
      {current === 4 && (
        <Form form={payForm} layout="vertical" onFinish={handlePaymentSubmit}>
          <Form.Item label="Payment Mode">
            <Radio.Group
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as 'upi' | 'cash')}
            >
              <Radio.Button value="upi">UPI / QR</Radio.Button>
              <Radio.Button value="cash">Cash</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="amount"
            label="First Payment Amount (₹)"
            rules={[{ required: true, type: 'number', min: 1 }]}
            initialValue={
              selectedFeePlan ? selectedFeePlan.installments[0]?.amount / 100 : undefined
            }
          >
            <InputNumber min={1} addonBefore="₹" className="w-full" />
          </Form.Item>
          {paymentMode === 'upi' && (
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded mb-4">
              A UPI QR code will be generated after confirmation.
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button onClick={() => setCurrent(3)}>Back</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Confirm & Admit
            </Button>
          </div>
        </Form>
      )}

      {/* Step 5 — Success */}
      {current === 5 && (
        <Result
          status="success"
          title="Admission Successful!"
          subTitle="Download the admission letter or share via WhatsApp."
          extra={[
            <Button
              key="letter"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadLetter}
            >
              Download Admission Letter
            </Button>,
            <Button
              key="whatsapp"
              icon={<ShareAltOutlined />}
              onClick={() =>
                window.open(
                  `https://wa.me/?text=Admission confirmed! Enrollment ID: ${enrollmentId}`,
                )
              }
            >
              Share on WhatsApp
            </Button>,
            <Button key="done" onClick={handleSuccess}>
              Done
            </Button>,
          ]}
        >
          {upiQrData && paymentMode === 'upi' && (
            <div className="text-center mt-2">
              <p className="text-sm text-gray-600 mb-2">Scan to pay first installment</p>
              <img
                src={upiQrData}
                alt="UPI QR Code"
                className="w-40 h-40 mx-auto border rounded"
              />
            </div>
          )}
        </Result>
      )}
    </Modal>
  )
}
