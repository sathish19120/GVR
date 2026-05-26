import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function OTPPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const { verifyOTP, sendOTP, loading, error, clearError, language } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const phone = (location.state as any)?.phone || ''

  useEffect(() => {
    if (!phone) navigate('/login')
  }, [phone])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  const handleChange = (val: string, idx: number) => {
    const d = [...digits]; d[idx] = val.slice(-1)
    setDigits(d)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
    if (!val && idx > 0) refs.current[idx - 1]?.focus()
    if (d.every(x => x) && val) handleVerify(d.join(''))
  }

  const handleVerify = async (code?: string) => {
    const otp = code || digits.join('')
    if (otp.length !== 6) return
    try {
      await verifyOTP(phone, otp)
      navigate('/')
    } catch {}
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setCountdown(30)
    setDigits(['', '', '', '', '', ''])
    clearError()
    await sendOTP(phone)
    refs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--gvr-surface)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
               style={{ background: 'var(--gvr-green)' }}>📱</div>
          <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--gvr-text)' }}>
            {language === 'te' ? 'OTP నమోదు చేయండి' : 'Enter OTP'}
          </h2>
          <p className="text-sm text-gray-500">
            {language === 'te' ? `${phone} కి పంపబడింది` : `Sent to +91 ${phone}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-center mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={r => { refs.current[i] = r }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(e.target.value, i)}
              className="w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 transition-all focus:outline-none"
              style={{
                borderColor: d ? 'var(--gvr-green)' : '#E5E7EB',
                background: d ? 'var(--gvr-green-light)' : 'white',
                color: 'var(--gvr-green-dark)'
              }}
            />
          ))}
        </div>

        <button
          onClick={() => handleVerify()}
          disabled={loading || digits.some(d => !d)}
          className="btn-primary w-full mb-4"
        >
          {loading
            ? (language === 'te' ? 'ధృవీకరిస్తోంది…' : 'Verifying…')
            : (language === 'te' ? 'ధృవీకరించు' : 'Verify & Login')}
        </button>

        <button
          onClick={handleResend}
          disabled={countdown > 0}
          className="w-full text-sm text-center py-2 transition-colors"
          style={{ color: countdown > 0 ? '#9CA3AF' : 'var(--gvr-green)' }}
        >
          {countdown > 0
            ? `Resend OTP in ${countdown}s`
            : (language === 'te' ? 'OTP మళ్ళీ పంపండి' : 'Resend OTP')}
        </button>

        <button onClick={() => navigate('/login')}
                className="w-full text-sm text-center text-gray-400 hover:text-gray-600 py-2 mt-1">
          ← Change number
        </button>
      </div>
    </div>
  )
}
