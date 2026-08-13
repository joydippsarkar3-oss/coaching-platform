import { LockOutlined, MobileOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/endpoints/auth'
import { useAuth } from '@/hooks/useAuth'

const { Title } = Typography

type Phase = 'phone' | 'otp'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [phase, setPhase] = useState<Phase>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.sendOtp({ phone })
      setPhase('otp')
    } catch {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    if (index === 5 && value) {
      // auto-submit on 6th digit
      const full = [...next].join('')
      if (full.length === 6) handleVerifyOtp(full)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue ?? otp.join('')
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data: tokens } = await authApi.verifyOtp({ phone, otp: code })
      // Verify returns tokens only; the profile comes from /users/me, which needs
      // the access token to already be in storage for the request interceptor.
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      const { data: user } = await authApi.me()
      login(user, tokens.accessToken, tokens.refreshToken)
    } catch {
      setError('Invalid OTP. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <LockOutlined className="text-white text-2xl" />
          </div>
          <Title level={4} className="!mb-1">
            {t('auth.loginTitle')}
          </Title>
          <p className="text-gray-500 text-sm m-0">
            {phase === 'phone' ? 'Enter your registered mobile number' : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-4" />}

        {phase === 'phone' ? (
          <Form layout="vertical" onFinish={handleSendOtp}>
            <Form.Item label={t('auth.phone')} required>
              <Input
                prefix={<MobileOutlined className="text-gray-400" />}
                addonBefore="+91"
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                size="large"
                inputMode="numeric"
                autoFocus
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="mt-2"
            >
              {t('auth.sendOtp')}
            </Button>
          </Form>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">{t('auth.otp')}</p>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  className="w-11 h-12 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={() => handleVerifyOtp()}
            >
              {t('auth.verifyOtp')}
            </Button>
            <Button
              type="link"
              block
              className="mt-2"
              onClick={() => { setPhase('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
            >
              Change number
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
