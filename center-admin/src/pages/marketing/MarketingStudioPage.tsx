import {
  DownloadOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Spin,
  message,
} from 'antd'
import { useRef, useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useApi } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth.store'
import type { ExamOption, ExamTopper } from '@/api/endpoints/marketing'

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

// ── types ─────────────────────────────────────────────────────────────────────

interface CourseOption {
  id: string
  name: string
  isActive: boolean
}

// ── TopperPosterSection ───────────────────────────────────────────────────────

function TopperPosterSection() {
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>()
  const [selectedTopper, setSelectedTopper] = useState<ExamTopper | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  const { data: exams, isLoading: examsLoading } = useApi<ExamOption[]>('/exams/published')
  const { data: toppers, isLoading: toppersLoading } = useApi<ExamTopper[]>(
    selectedExamId ? `/exams/${selectedExamId}/toppers?limit=3` : null,
  )

  const selectedExam = exams?.find((e) => e.id === selectedExamId)

  const handleDownload = async () => {
    if (!posterRef.current) return
    try {
      await downloadDiv(posterRef.current, `topper-${selectedTopper?.studentName ?? 'poster'}.png`)
    } catch {
      message.error('Download failed')
    }
  }

  const handleWhatsApp = () => {
    if (!selectedTopper || !selectedExam) return
    const text = `🏆 Congratulations to ${selectedTopper.studentName} for scoring ${selectedTopper.score}/${selectedTopper.totalMarks} in ${selectedExam.name} at ${user?.centerName ?? 'our center'}! #Topper #${selectedExam.courseName?.replace(/\s/g, '')}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Card title="🏆 Topper Poster Generator" className="mb-4">
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <Select
          placeholder="Select exam"
          loading={examsLoading}
          style={{ width: 280 }}
          value={selectedExamId}
          onChange={(v) => { setSelectedExamId(v); setSelectedTopper(null) }}
          options={exams?.map((e) => ({ value: e.id, label: `${e.name} — ${e.courseName}` }))}
        />
      </div>

      {selectedExamId && (
        <div>
          {toppersLoading ? (
            <Spin />
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2">Click a student to generate poster:</p>
              <Row gutter={[12, 12]} className="mb-4">
                {(toppers ?? []).map((t) => (
                  <Col key={t.studentId}>
                    <Button
                      type={selectedTopper?.studentId === t.studentId ? 'primary' : 'default'}
                      onClick={() => setSelectedTopper(t)}
                    >
                      #{t.rank} {t.studentName} — {t.score}/{t.totalMarks}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {selectedTopper && (
            <div>
              {/* Poster preview */}
              <div
                ref={posterRef}
                className="border border-gray-200 rounded-xl overflow-hidden mx-auto mb-4"
                style={{ width: 420, background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%)', padding: 32, fontFamily: 'sans-serif' }}
              >
                {/* Center logo */}
                <div className="flex justify-center mb-4">
                  {user?.centerLogo ? (
                    <img src={user.centerLogo} alt="logo" style={{ height: 56, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ height: 56, width: 100, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 12 }}>CENTER LOGO</span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center', color: 'gold', fontSize: 13, letterSpacing: 2, marginBottom: 4 }}>
                  ★ CONGRATULATIONS ★
                </div>
                <div style={{ textAlign: 'center', color: 'white', fontSize: 11, marginBottom: 16 }}>
                  बधाई हो / Congratulations!
                </div>

                <div style={{ textAlign: 'center', color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                  {selectedTopper.studentName}
                </div>

                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 4 }}>
                  {selectedExam?.courseName}
                </div>
                <div style={{ textAlign: 'center', color: 'gold', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  Score: {selectedTopper.score} / {selectedTopper.totalMarks}
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 20 }}>
                  Rank #{selectedTopper.rank} — {selectedExam?.name}
                </div>

                {/* Bottom strip */}
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{user?.centerName ?? 'Center Name'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>www.brand.in | {user?.centerName}</div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download PNG
                </Button>
                <Button icon={<WhatsAppOutlined />} style={{ background: '#25D366', color: 'white', border: 'none' }} onClick={handleWhatsApp}>
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ── AdmissionBannerSection ────────────────────────────────────────────────────

function AdmissionBannerSection() {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [tagline, setTagline] = useState('Your future starts here!')
  const bannerRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const { data: courses, isLoading: coursesLoading } = useApi<CourseOption[]>('/courses?isActive=true')

  const selectedCourseNames = courses
    ?.filter((c) => selectedCourses.includes(c.id))
    .map((c) => c.name) ?? []

  const handleDownload = async () => {
    if (!bannerRef.current) return
    try {
      await downloadDiv(bannerRef.current, 'admission-banner.png')
    } catch {
      message.error('Download failed')
    }
  }

  const handleWhatsApp = () => {
    const courseList = selectedCourseNames.join(', ') || 'all courses'
    const text = `📢 Admissions Open!\n\nNow enrolling for: ${courseList}\n\n${tagline}\n\n📞 ${user?.centerName ?? 'Our Center'}\nContact us to enroll today!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Card title="📢 Admission Open Banner" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Select Courses</label>
            <Select
              mode="multiple"
              loading={coursesLoading}
              style={{ width: '100%' }}
              placeholder="Choose courses to feature"
              value={selectedCourses}
              onChange={setSelectedCourses}
              options={courses?.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Tagline</label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your tagline here"
            />
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              Download PNG
            </Button>
            <Button icon={<WhatsAppOutlined />} style={{ background: '#25D366', color: 'white', border: 'none' }} onClick={handleWhatsApp}>
              Share on WhatsApp
            </Button>
          </div>
        </Col>

        <Col xs={24} md={14}>
          {/* Banner preview */}
          <div
            ref={bannerRef}
            style={{
              background: 'linear-gradient(135deg, #ff6f00 0%, #ff8f00 50%, #ffa000 100%)',
              borderRadius: 12,
              padding: 28,
              fontFamily: 'sans-serif',
              minHeight: 200,
            }}
          >
            <div style={{ textAlign: 'center', color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Admissions Open!
            </div>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 16 }}>
              प्रवेश शुरू
            </div>

            {selectedCourseNames.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                {selectedCourseNames.map((name) => (
                  <div key={name} style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    ✓ {name}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>
              "{tagline}"
            </div>

            <div style={{ textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 15 }}>
              {user?.centerName ?? 'Center Name'}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

// ── QRPosterSection ───────────────────────────────────────────────────────────

function QRPosterSection() {
  const [enquiryQrDataUrl, setEnquiryQrDataUrl] = useState<string>('')
  const [waQrDataUrl, setWaQrDataUrl] = useState<string>('')
  const [qrType, setQrType] = useState<'enquiry' | 'whatsapp'>('enquiry')
  const enquiryPosterRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const { data: tenant } = useApi<{ slug: string; brandDomain: string }>('/settings/tenant')

  useEffect(() => {
    void (async () => {
      try {
        const QRCode = (await import('qrcode')).default
        const centerSlug = tenant?.slug ?? 'center'
        const brandDomain = tenant?.brandDomain ?? 'brand.in'
        const enquiryUrl = `https://${brandDomain}/c/${centerSlug}?ref=qr`
        const waUrl = `https://wa.me/${user?.centerName ?? ''}` // phone comes from center profile
        const [eq, wq] = await Promise.all([
          QRCode.toDataURL(enquiryUrl, { width: 200, margin: 1 }),
          QRCode.toDataURL(waUrl, { width: 200, margin: 1 }),
        ])
        setEnquiryQrDataUrl(eq)
        setWaQrDataUrl(wq)
      } catch {
        // qrcode not installed yet
      }
    })()
  }, [tenant, user])

  const activeQr = qrType === 'enquiry' ? enquiryQrDataUrl : waQrDataUrl
  const centerSlug = tenant?.slug ?? 'center'
  const brandDomain = tenant?.brandDomain ?? 'brand.in'

  const handleDownload = async () => {
    if (!enquiryPosterRef.current) return
    try {
      await downloadDiv(enquiryPosterRef.current, `qr-poster-${qrType}.png`)
    } catch {
      message.error('Download failed')
    }
  }

  const handleWhatsApp = () => {
    const url =
      qrType === 'enquiry'
        ? `https://${brandDomain}/c/${centerSlug}?ref=qr`
        : `https://wa.me/`
    const text = `📱 Scan our QR code to enquire / enroll at ${user?.centerName ?? 'our center'}!\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Card title="📱 QR Poster Generator">
      <div className="flex gap-2 mb-4">
        <Button
          type={qrType === 'enquiry' ? 'primary' : 'default'}
          onClick={() => setQrType('enquiry')}
        >
          Enquiry QR
        </Button>
        <Button
          type={qrType === 'whatsapp' ? 'primary' : 'default'}
          onClick={() => setQrType('whatsapp')}
          style={qrType === 'whatsapp' ? { background: '#25D366', borderColor: '#25D366', color: 'white' } : {}}
        >
          WhatsApp QR
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <div
            ref={enquiryPosterRef}
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              padding: 28,
              fontFamily: 'sans-serif',
              textAlign: 'center',
              maxWidth: 340,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
              {user?.centerName ?? 'Center Name'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
              {qrType === 'enquiry' ? 'Scan to Enquire / Enroll' : 'Chat with us on WhatsApp'}
            </div>

            {activeQr ? (
              <img src={activeQr} alt="QR Code" style={{ width: 180, height: 180, margin: '0 auto 16px' }} />
            ) : (
              <div style={{ width: 180, height: 180, background: '#f1f5f9', borderRadius: 8, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Loading QR…</span>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#64748b' }}>
              {qrType === 'enquiry'
                ? `${brandDomain}/c/${centerSlug}`
                : 'WhatsApp us directly'}
            </div>
          </div>
        </Col>

        <Col xs={24} md={10} className="flex flex-col gap-2 justify-start pt-2">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} block>
            Download PNG
          </Button>
          <Button icon={<WhatsAppOutlined />} style={{ background: '#25D366', color: 'white', border: 'none' }} onClick={handleWhatsApp} block>
            Share on WhatsApp
          </Button>
        </Col>
      </Row>
    </Card>
  )
}

// ── Main MarketingStudioPage ──────────────────────────────────────────────────

export function MarketingStudioPage() {
  return (
    <div>
      <PageHeader title="Marketing Studio" subtitle="Create posters, banners, and QR codes for your center" />
      <TopperPosterSection />
      <AdmissionBannerSection />
      <QRPosterSection />
    </div>
  )
}
