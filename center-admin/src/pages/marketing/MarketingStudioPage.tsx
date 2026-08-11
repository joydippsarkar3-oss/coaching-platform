import {
  DownloadOutlined,
  QrcodeOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Row,
  Select,
  Spin,
  Input,
  Typography,
  message,
} from 'antd'
import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import { useTenantStore } from '@/store/tenant.store'
import apiClient from '@/api/client'
import type { PaginatedResponse } from '@/types/api'
import type { Student } from '@/types/models'

const { TextArea } = Input
const { Text } = Typography

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseOption {
  id: string
  name: string
  isActive: boolean
}

interface PosterTemplate {
  id: string
  label: string
  bg: string
  accent: string
  text: string
}

type BroadcastFilter = 'ALL_STUDENTS' | 'FEE_OVERDUE' | 'RECENT_ENROLLMENTS'

// ── Constants ─────────────────────────────────────────────────────────────────

const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'royal',
    label: 'Royal Blue',
    bg: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
    accent: 'gold',
    text: 'white',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    bg: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #e53935 100%)',
    accent: '#FFD54F',
    text: 'white',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)',
    accent: '#FFF176',
    text: 'white',
  },
]

// ── helpers ───────────────────────────────────────────────────────────────────

async function downloadDiv(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, { useCORS: true, scale: 2 })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

// ── TopperPosterSection ───────────────────────────────────────────────────────

function TopperPosterSection() {
  const center = useTenantStore((s) => s.center)
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate>(POSTER_TEMPLATES[0])
  const posterRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const { data: studentsPage, isLoading: studentsLoading, error: studentsError } =
    useApi<PaginatedResponse<Student>>('/students?pageSize=200')

  const { data: courses, isLoading: coursesLoading, error: coursesError } =
    useApi<CourseOption[]>('/courses?isActive=true')

  const students = studentsPage?.data ?? []
  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const selectedCourse = courses?.find((c) => c.id === selectedCourseId)

  const handleDownload = async () => {
    if (!posterRef.current) return
    setDownloading(true)
    try {
      await downloadDiv(
        posterRef.current,
        `topper-${selectedStudent?.name ?? 'poster'}.png`,
      )
      void message.success('Poster downloaded!')
    } catch {
      void message.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const anyError = studentsError || coursesError

  return (
    <Card title="🏆 Topper Poster Generator" className="mb-4">
      {anyError && (
        <Alert type="error" message="Failed to load data. Please refresh." className="mb-4" />
      )}

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <label className="block text-xs text-gray-500 mb-1">Student</label>
          {studentsLoading ? <Spin size="small" /> : (
            <Select
              placeholder="Select student"
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              options={students.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
        </Col>
        <Col xs={24} sm={12} md={8}>
          <label className="block text-xs text-gray-500 mb-1">Course</label>
          {coursesLoading ? <Spin size="small" /> : (
            <Select
              placeholder="Select course"
              style={{ width: '100%' }}
              value={selectedCourseId}
              onChange={setSelectedCourseId}
              options={courses?.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
        </Col>
      </Row>

      {/* Template picker */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-2">Template</label>
        <div className="flex gap-3 flex-wrap">
          {POSTER_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              style={{
                width: 80,
                height: 48,
                background: tpl.bg,
                borderRadius: 8,
                cursor: 'pointer',
                border: selectedTemplate.id === tpl.id ? '3px solid #1677ff' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: tpl.accent, fontSize: 10, fontWeight: 700 }}>{tpl.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Poster preview — always visible, updates live */}
      <div
        ref={posterRef}
        className="border border-gray-200 rounded-xl overflow-hidden mx-auto mb-4"
        style={{
          width: 420,
          background: selectedTemplate.bg,
          padding: 32,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', color: selectedTemplate.accent, fontSize: 13, letterSpacing: 2, marginBottom: 4 }}>
          ★ CONGRATULATIONS ★
        </div>
        <div style={{ textAlign: 'center', color: selectedTemplate.text, fontSize: 11, opacity: 0.85, marginBottom: 16 }}>
          बधाई हो / Congratulations!
        </div>
        <div style={{ textAlign: 'center', color: selectedTemplate.text, fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
          {selectedStudent?.name ?? 'Student Name'}
        </div>
        <div style={{ textAlign: 'center', color: selectedTemplate.text, fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
          {selectedCourse?.name ?? 'Course Name'}
        </div>
        <div style={{ textAlign: 'center', color: selectedTemplate.accent, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          Topper 🏆
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ color: selectedTemplate.text, fontWeight: 700, fontSize: 15 }}>
            {center?.name ?? 'Center Name'}
          </div>
          <div style={{ color: selectedTemplate.text, fontSize: 12, opacity: 0.8 }}>
            computrain.in/c/{center?.code ?? 'center'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={downloading}
          disabled={!selectedStudentId || !selectedCourseId}
          onClick={handleDownload}
        >
          Download PNG
        </Button>
      </div>
    </Card>
  )
}

// ── QRCodeSection ─────────────────────────────────────────────────────────────

function QRCodeSection() {
  const center = useTenantStore((s) => s.center)
  const qrRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const centerSlug = center?.code ?? 'center'
  const publicUrl = `https://computrain.in/c/${centerSlug}`

  const handleDownload = async () => {
    if (!qrRef.current) return
    setDownloading(true)
    try {
      await downloadDiv(qrRef.current, `qr-${centerSlug}.png`)
      void message.success('QR code downloaded!')
    } catch {
      void message.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card title={<span><QrcodeOutlined className="mr-2" />Center QR Code</span>} className="mb-4">
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} md={14}>
          <div
            ref={qrRef}
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              padding: 28,
              fontFamily: 'sans-serif',
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
              {center?.name ?? 'Center Name'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
              Scan to visit our page
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <QRCodeCanvas
                value={publicUrl}
                size={180}
                includeMargin
                level="M"
              />
            </div>
            <div style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>
              {publicUrl}
            </div>
          </div>
        </Col>

        <Col xs={24} md={10}>
          <div className="mb-3">
            <Text type="secondary" className="text-xs">Public URL</Text>
            <div className="mt-1">
              <Text
                copyable
                style={{ fontSize: 13, wordBreak: 'break-all', color: '#1677ff' }}
              >
                {publicUrl}
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
            block
          >
            Download QR
          </Button>
        </Col>
      </Row>
    </Card>
  )
}

// ── WhatsAppBroadcastSection ──────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: BroadcastFilter; reach: string }[] = [
  { label: 'All Students', value: 'ALL_STUDENTS', reach: '~all enrolled' },
  { label: 'Fee Overdue', value: 'FEE_OVERDUE', reach: 'students with dues' },
  { label: 'Recent Enrollments (30 days)', value: 'RECENT_ENROLLMENTS', reach: 'new joiners' },
]

function WhatsAppBroadcastSection() {
  const [messageText, setMessageText] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<BroadcastFilter[]>(['ALL_STUDENTS'])
  const [sending, setSending] = useState(false)

  const activeFilter = selectedFilters[0] ?? 'ALL_STUDENTS'

  const toggleFilter = (filter: BroadcastFilter) => {
    setSelectedFilters([filter])
  }

  const handleSend = async () => {
    if (!messageText.trim()) {
      void message.warning('Please enter a message before sending.')
      return
    }
    setSending(true)
    try {
      await apiClient.post('/notifications/broadcast', {
        channel: 'WHATSAPP',
        filter: activeFilter,
        message: messageText.trim(),
      })
      void message.success('Broadcast queued successfully!')
      setMessageText('')
    } catch {
      void message.error('Failed to send broadcast. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const selectedOption = FILTER_OPTIONS.find((o) => o.value === activeFilter)

  return (
    <Card title={<span><WhatsAppOutlined className="mr-2" style={{ color: '#25D366' }} />WhatsApp Broadcast</span>}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <TextArea
              rows={5}
              placeholder="Type your broadcast message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              maxLength={1024}
              showCount
            />
          </div>
          <Button
            icon={<WhatsAppOutlined />}
            style={{ background: '#25D366', color: 'white', border: 'none' }}
            loading={sending}
            onClick={handleSend}
            size="large"
          >
            Send via WhatsApp
          </Button>
        </Col>

        <Col xs={24} md={10}>
          <div className="mb-2">
            <label className="block text-xs text-gray-500 mb-2">Send to</label>
            {FILTER_OPTIONS.map((opt) => (
              <div key={opt.value} className="mb-2">
                <Checkbox
                  checked={activeFilter === opt.value}
                  onChange={() => toggleFilter(opt.value)}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-gray-400 ml-2">({opt.reach})</span>
                </Checkbox>
              </div>
            ))}
          </div>
          {selectedOption && (
            <Alert
              type="info"
              showIcon
              message={
                <span className="text-xs">
                  Estimated reach: <strong>{selectedOption.reach}</strong>
                </span>
              }
            />
          )}
        </Col>
      </Row>
    </Card>
  )
}

// ── Main MarketingStudioPage ──────────────────────────────────────────────────

export function MarketingStudioPage() {
  return (
    <div>
      <PageHeader
        title="Marketing Studio"
        subtitle="Create posters, generate QR codes, and broadcast messages"
      />
      <TopperPosterSection />
      <QRCodeSection />
      <WhatsAppBroadcastSection />
    </div>
  )
}


