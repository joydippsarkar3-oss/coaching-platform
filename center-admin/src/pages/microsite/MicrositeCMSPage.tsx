import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Row, Switch, Tag } from 'antd'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'

interface CMSData {
  centerTagline: string
  aboutText: string
  highlightBullets: string
  whatsappNumber: string
  googleMapsUrl: string
  showAdmissionCta: boolean
  showCourseList: boolean
  heroImageUrl: string
}

export function MicrositeCMSPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form] = Form.useForm<CMSData>()

  const handleSave = async (values: CMSData) => {
    setSaving(true)
    try {
      // POST /microsite/cms
      await fetch('/api/microsite/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify(values),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Microsite CMS"
        subtitle="Edit your center's public-facing microsite content"
        actions={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
          >
            Publish Changes
          </Button>
        }
      />

      {saved && (
        <Alert
          type="success"
          message="Microsite content published successfully."
          showIcon
          closable
          className="mb-4"
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span><EditOutlined className="mr-2" />Content Editor</span>} size="small">
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Form.Item name="centerTagline" label="Center Tagline">
                <Input placeholder="e.g. Empowering careers through quality training" maxLength={100} showCount />
              </Form.Item>
              <Form.Item name="aboutText" label="About Us Text">
                <Input.TextArea
                  rows={4}
                  placeholder="Describe your center..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              <Form.Item name="highlightBullets" label="Key Highlights (one per line)">
                <Input.TextArea
                  rows={4}
                  placeholder="Government certified courses&#10;Job placement assistance&#10;Experienced faculty"
                />
              </Form.Item>
              <Form.Item name="heroImageUrl" label="Hero Image URL">
                <Input placeholder="https://..." type="url" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="whatsappNumber" label="WhatsApp Number">
                    <Input addonBefore="+91" maxLength={10} placeholder="9876543210" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="googleMapsUrl" label="Google Maps URL">
                    <Input placeholder="https://maps.google.com/..." type="url" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="showAdmissionCta" label="Show Admission CTA" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="showCourseList" label="Show Course List" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Microsite Preview" size="small">
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 border-2 border-dashed border-gray-200 min-h-48 flex flex-col items-center justify-center">
              <Tag color="blue" className="mb-2">Preview</Tag>
              <p className="text-sm m-0">Save changes to see your live microsite.</p>
              <Button
                type="link"
                size="small"
                onClick={() => window.open('/microsite', '_blank')}
                className="mt-2"
              >
                Open live microsite →
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Microsite URL</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded">/microsite/{'{center-code}'}</code>
              </div>
              <div className="flex justify-between">
                <span>Last published</span>
                <span>—</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
