import { CheckCircleOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Descriptions, Form, Input, Tag, Upload } from 'antd'
import { useState } from 'react'
import { settingsApi } from '@/api/endpoints/settings'
import { PageHeader } from '@/components/shared/PageHeader'
import { useTenant } from '@/hooks/useTenant'
import { useTenantStore } from '@/store'

export function SettingsPage() {
  const { center } = useTenant()
  const { setCenter } = useTenantStore()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async (values: { name: string; address: string; phone: string; email: string }) => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await settingsApi.updateCenter(values)
      setCenter(res.data.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    try {
      const res = await settingsApi.uploadLogo(file)
      if (center) setCenter({ ...center, logo: res.data.data.logoUrl })
    } catch {
      // ignore
    }
    return false
  }

  const kycColor: Record<string, string> = {
    pending: 'default',
    submitted: 'gold',
    approved: 'green',
    rejected: 'red',
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Center profile and KYC status" />

      {success && (
        <Alert
          type="success"
          message="Settings saved successfully."
          showIcon
          icon={<CheckCircleOutlined />}
          className="mb-4"
          closable
        />
      )}

      {center && (
        <Card title="KYC Status" size="small" className="mb-4">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Center Code">{center.code}</Descriptions.Item>
            <Descriptions.Item label="KYC Status">
              <Tag color={kycColor[center.kycStatus]}>{center.kycStatus.toUpperCase()}</Tag>
            </Descriptions.Item>
          </Descriptions>
          {center.kycStatus === 'rejected' && (
            <Alert
              type="error"
              message="KYC was rejected. Please resubmit your documents."
              className="mt-3"
              showIcon
            />
          )}
          {center.kycStatus === 'pending' && (
            <Button
              type="default"
              className="mt-3"
              onClick={() => settingsApi.submitKyc({ centerCode: center.code })}
            >
              Submit KYC Documents
            </Button>
          )}
        </Card>
      )}

      <Card title="Center Profile" size="small">
        <Form
          form={form}
          layout="vertical"
          initialValues={center ?? {}}
          onFinish={handleSave}
        >
          <Form.Item label="Center Logo">
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={handleLogoUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload Logo</Button>
            </Upload>
            {center?.logo && (
              <img
                src={center.logo}
                alt="logo"
                className="mt-2 h-12 w-12 object-cover rounded border"
              />
            )}
          </Form.Item>

          <Form.Item name="name" label="Center Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input addonBefore="+91" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true }, { type: 'email' }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
          >
            Save Changes
          </Button>
        </Form>
      </Card>
    </div>
  )
}
