import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import authBg from '../assets/ottodrone.jpg'
import ottoLogo from '../assets/otto-logo.svg'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Simulate sending reset email
    try {
      console.log('Password reset requested for:', email)

      setTimeout(() => {
        setLoading(false)
        setSubmitted(true)
      }, 1200)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* TOP/LEFT SIDE — IMAGE (short banner on mobile, full side panel from lg up) */}
      <div className="relative h-40 w-full sm:h-56 md:h-64 lg:h-auto lg:w-auto">
        <img
          src={authBg}
          alt="Otto Shoes headquarters"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7a1f1f]/80 via-[#7a1f1f]/70 to-[#5c1414]/85" />

        <div className="absolute inset-0 hidden flex-col justify-end p-6 sm:flex sm:p-8 md:p-10 lg:p-12 lg:pb-16">
          <h2 className="font-serif text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Crafting
            <br className="hidden sm:block" />
            Excellence
            <br className="hidden sm:block" />
            Since 1979
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/90 sm:mt-4 sm:text-base lg:mt-6">
            Premium handcrafted footwear made with the finest materials.
          </p>
          <p className="mt-1 hidden max-w-sm text-sm text-white/70 md:block">
            Quality leather, timeless design, unmatched comfort.
          </p>
        </div>
      </div>

      {/* BOTTOM/RIGHT SIDE — RESET FORM */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f7f4ee] px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="w-full max-w-sm">
          {/* LOGO */}
          <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
            <img src={ottoLogo} alt="Otto Shoes" className="h-12 w-12 sm:h-16 sm:w-16" />
            <p className="mt-2 text-xs font-bold tracking-[0.2em] text-[#7a1f1f] sm:mt-3">
              OTTO SHOES
            </p>
          </div>

          {!submitted ? (
            <>
              {/* HEADER */}
              <div className="mb-4 text-center sm:mb-5 md:mb-6">
                <h1 className="font-serif text-2xl font-extrabold text-[#2a2a2a] sm:text-2.5xl md:text-3xl">
                  Reset Password
                </h1>
                <p className="mt-2 text-xs text-[#6b6b6b] sm:text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] sm:size-[18px]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Clerk@otto.com"
                    required
                    className="w-full rounded-lg border border-[#e2ddd2] bg-white py-2 pl-9 pr-3 text-xs text-[#2a2a2a] placeholder:text-[#b3aea3] focus:border-[#7a1f1f] focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/15 sm:py-2.5 sm:pl-10 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7a1f1f] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#671a1a] disabled:opacity-70 sm:py-3 sm:text-sm"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-3 text-center sm:mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9a9a9a] hover:text-[#6b6b6b] sm:text-sm"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </>
          ) : (
            /* SUCCESS MESSAGE */
            <div className="space-y-3 text-center sm:space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7a1f1f]/10 sm:h-14 sm:w-14 md:h-16 md:w-16">
                <CheckCircle2 size={24} className="text-[#7a1f1f] sm:size-7 md:size-8" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-extrabold text-[#2a2a2a] sm:text-2xl">
                  Check Your Email
                </h2>
                <p className="mt-1.5 text-xs text-[#6b6b6b] sm:mt-2 sm:text-sm">
                  We've sent a password reset link to{' '}
                  <strong className="break-all text-[#2a2a2a]">{email}</strong>. Check your
                  inbox and follow the instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-lg border border-[#7a1f1f] px-4 py-2 text-xs font-semibold text-[#7a1f1f] transition-colors hover:bg-[#7a1f1f] hover:text-white sm:py-2.5 sm:text-sm"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* FOOTER */}
          <p className="mt-4 text-center text-[10px] uppercase tracking-wider text-[#bdb6a7] sm:mt-6 sm:text-[11px] md:mt-8">
            Otto Shoes Manufacturing System
          </p>
        </div>
      </div>
    </div>
  )
}