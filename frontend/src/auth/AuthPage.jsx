import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import authBg from '../assets/ottodrone.jpg'
import ottoLogo from '../assets/otto-logo.svg'

// If your app has a role-selection step before this page, pass the chosen
// role in via router state: navigate('/login', { state: { role: 'Sales Clerk' } })
// and read it with useLocation(). Falls back to a generic label if absent.
export default function AuthPage({ role = 'Sales Clerk', onBackToRoleSelect }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Please enter email and password')
        setLoading(false)
        return
      }

      // Simulate API call delay
      setTimeout(() => {
        login(email)
        navigate('/dashboard', { replace: true })
      }, 800)
    } catch (err) {
      setError('Failed to fetch')
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* TOP/LEFT SIDE — IMAGE (banner on mobile, full side panel from lg up) */}
      <div className="relative h-48 w-full sm:h-56 md:h-64 lg:h-auto lg:w-auto">
        <img
          src={authBg}
          alt="Otto Shoes headquarters"
          className="h-full w-full object-cover"
        />
        {/* MAROON GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7a1f1f]/80 via-[#7a1f1f]/70 to-[#5c1414]/85" />

        {/* COPY */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-6 sm:p-6 sm:pb-8 md:p-10 md:pb-12 lg:p-12 lg:pb-16">
          <h2 className="font-serif text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Crafting
            <br />
            Excellence
            <br />
            Since 1979
          </h2>
          <p className="mt-2 max-w-sm text-xs text-white/90 sm:mt-3 sm:text-sm md:mt-4 md:text-base lg:mt-6">
            Premium handcrafted footwear made with the finest materials.
          </p>
          <p className="mt-1 hidden max-w-sm text-xs text-white/70 md:block md:text-sm">
            Quality leather, timeless design, unmatched comfort.
          </p>
        </div>
      </div>

      {/* BOTTOM/RIGHT SIDE — LOGIN FORM */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f7f4ee] px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12">
        <div className="w-full max-w-sm">
          {/* LOGO */}
          <div className="mb-4 flex flex-col items-center text-center sm:mb-5 md:mb-6">
            <img src={ottoLogo} alt="Otto Shoes" className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16" />
            <p className="mt-2 text-xs font-bold tracking-[0.2em] text-[#7a1f1f] sm:mt-2.5 md:mt-3">
              OTTO SHOES
            </p>
          </div>

          {/* HEADER */}
          <div className="mb-4 text-center sm:mb-5 md:mb-6">
            <h1 className="font-serif text-2xl font-extrabold text-[#2a2a2a] sm:text-2.5xl md:text-3xl">
              Welcome back!
            </h1>
            <p className="mt-2 text-xs text-[#6b6b6b] sm:text-sm">
              Please enter your credentials.
            </p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* EMAIL INPUT */}
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] sm:size-[18px]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-lg border border-[#e2ddd2] bg-white py-2 pl-9 pr-3 text-xs text-[#2a2a2a] placeholder:text-[#b3aea3] focus:border-[#7a1f1f] focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/15 sm:py-2.5 sm:pl-10 sm:text-sm"
              />
            </div>

            {/* PASSWORD INPUT */}
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] sm:size-[18px]"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full rounded-lg border border-[#e2ddd2] bg-white py-2 pl-9 pr-9 text-xs text-[#2a2a2a] placeholder:text-[#b3aea3] focus:border-[#7a1f1f] focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/15 sm:py-2.5 sm:pl-10 sm:pr-10 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-[#6b6b6b]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} className="sm:size-[18px]" /> : <Eye size={16} className="sm:size-[18px]" />}
              </button>
            </div>

            {/* REMEMBER ME + FORGOT PASSWORD */}
            <div className="flex flex-col items-start justify-between gap-2 pt-1 sm:flex-row sm:items-center sm:gap-0">
              <label className="flex items-center gap-2 text-xs text-[#6b6b6b] sm:text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3 w-3 rounded border-[#cfc8b8] text-[#7a1f1f] focus:ring-[#7a1f1f]/30 sm:h-4 sm:w-4"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-xs font-semibold text-[#7a1f1f] hover:text-[#7a1f1f]/80 sm:text-sm"
              >
                Forgot password?
              </a>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7a1f1f] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#671a1a] disabled:opacity-70 sm:py-3 sm:text-sm"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-4 text-center text-[10px] uppercase tracking-wider text-[#bdb6a7] sm:mt-6 sm:text-[11px] md:mt-8">
            Otto Shoes Manufacturing System
          </p>
        </div>
      </div>
    </div>
  )
}