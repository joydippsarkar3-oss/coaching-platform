import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Form, Input, Select, Skeleton } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { enquiriesApi } from '@/api/endpoints/enquiries'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useApi } from '@/hooks/useApi'
import type { Enquiry, EnquiryStage } from '@/types/models'
import { formatDate } from '@/utils/dates'

const STAGES: EnquiryStage[] = ['new', 'contacted', 'visited', 'admitted', 'lost']

export function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: enquiry, isLoading, mutate } = useApi<Enquiry>(id ? `/enquiries/${id}` : null)
  const [form] = Form.useForm()

  const handleUpdateStage = async (stage: string) => {
    if (!id) return
    await enquiriesApi.update(id, { stage: stage as EnquiryStage })
    void mutate()
  }

  if (isLoading) return <Skeleton active />
  if (!enquiry) return <div>Enquiry not found</div>

  return (
    <div className="max-w-2xl">
      <Button icon={<ArrowLeftOutlined />} type="link" onClick={() => navigate(-1)} className="mb-4 pl-0">
        Back to Enquiries
      </Button>

      <Card title={enquiry.name} className="mb-4">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Phone">{enquiry.phone}</Descriptions.Item>
          <Descriptions.Item label="Course">{enquiry.courseInterest}</Descriptions.Item>
          <Descriptions.Item label="Source">{enquiry.source?.replace('_', ' ')}</Descriptions.Item>
          <Descriptions.Item label="Stage">
            <StatusBadge status={enquiry.stage} />
          </Descriptions.Item>
          <Descriptions.Item label="Follow-up">
            {enquiry.followUpDate ? formatDate(enquiry.followUpDate) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Added">{formatDate(enquiry.createdAt)}</Descriptions.Item>
          {enquiry.notes && (
            <Descriptions.Item label="Notes" span={2}>{enquiry.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Update Stage" size="small">
        <Form form={form} layout="inline" onFinish={(v) => handleUpdateStage(v.stage as string)}>
          <Form.Item name="stage" initialValue={enquiry.stage}>
            <Select style={{ width: 160 }}>
              {STAGES.map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes">
            <Input placeholder="Add a note (optional)" style={{ width: 220 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">Update</Button>
        </Form>
      </Card>
    </div>
  )
}
