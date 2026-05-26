import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function OTPPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const { verifyOTP, sendOTP, loading, error, clearError, language } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as any)?.email || ''

  useEffect(() => {
    if (!email) navigate('/login')
    refs.current[0]?.focus()
  }, [email])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  const handleChange = (val: string, idx: number) => {
    const d = [...digits]
    d[idx] = val.replace(/\D/g, '').slice(-1)
    setDigits(d)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
    if (!val && idx > 0) refs.current[idx - 1]?.focus()
    if (d.every(x => x) && val) handleVerify(d.join(''))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const d = pasted.split('')
      setDigits(d)
      refs.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  const handleVerify = async (code?: string) => {
    const otp = code || digits.join('')
    if (otp.length !== 6) return
    try {
      await verifyOTP(email, otp)
      navigate('/')
    } catch {}
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setCountdown(60)
    setDigits(['', '', '', '', '', ''])
    clearError()
    await sendOTP(email)
    refs.current[0]?.focus()
  }

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a: string, b: string, c: string) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : ''

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--gvr-surface)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
               style={{ background: 'var(--gvr-green)' }}>📧</div>
          <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: 'var(--gvr-text)' }}>
            {language === 'te' ? 'కోడ్ నమోదు చేయండి' : 'Check your email'}
          </h2>
          <p className="text-sm text-gray-500">
            {language === 'te'
              ? `${maskedEmail} కి 6-అంకెల కోడ్ పంపబడింది`
              : `We sent a 6-digit code to`}
          </p>
          {language !== 'te' && (
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--gvr-green-dark)' }}>
              {maskedEmail}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* OTP input boxes */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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
            : (language === 'te' ? 'లాగిన్ చేయండి' : 'Login →')}
        </button>

        <button
          onClick={handleResend}
          disabled={countdown > 0}
          className="w-full text-sm text-center py-2 transition-colors rounded-xl"
          style={{
            color: countdown > 0 ? '#9CA3AF' : 'var(--gvr-green)',
            background: countdown > 0 ? 'transparent' : 'var(--gvr-green-light)'
          }}
        >
          {countdown > 0
            ? `Resend code in ${countdown}s`
            : (language === 'te' ? 'కోడ్ మళ్ళీ పంపండి' : 'Resend code')}
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full text-sm text-center text-gray-400 hover:text-gray-600 py-2 mt-2"
        >
          ← Use a different email
        </button>

        {/* Help note */}
        <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700 text-center">
            💡 Check your spam/junk folder if you don't see the email
          </p>
        </div>
      </div>
    </div>
  )
}
