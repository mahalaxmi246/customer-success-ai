import { useState } from 'react'
import { useNavigate, Navigate, useLocation } from 'react-router-dom'
import { Sparkles, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import { login, isAuthenticated } from '../utils/auth'
import { BRAND } from '../utils/brand'


export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/dashboard'
  const [mode, setMode] = useState('signup')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  if (isAuthenticated()) {
    return <Navigate to={redirectTo} replace />
  }

  const setSignup = (key, val) => setSignupForm(f => ({ ...f, [key]: val }))
  const setLogin = (key, val) => setLoginForm(f => ({ ...f, [key]: val }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)

    if (!signupForm.fullName || !signupForm.email || !signupForm.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))

    login({
      name: signupForm.fullName,
      email: signupForm.email,
    })
    navigate(redirectTo)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    if (!loginForm.email || !loginForm.password) {
      setError('Please enter your email and password.')
      return
    }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    login({
      name: loginForm.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email: loginForm.email,
    })
    navigate(redirectTo)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {mode === 'signup'
              ? 'Start resolving customer issues with AI-powered insights'
              : `Sign in to your ${BRAND.name} workspace`}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6">
            {['signup', 'login'].map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === tab
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <Field icon={User} label="Full Name" required>
                <input
                  value={signupForm.fullName}
                  onChange={e => setSignup('fullName', e.target.value)}
                  placeholder="Jane Smith"
                  className="input-field pl-10"
                />
              </Field>

              <Field icon={Mail} label="Work Email" required>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={e => setSignup('email', e.target.value)}
                  placeholder="jane@company.com"
                  className="input-field pl-10"
                />
              </Field>

              <Field icon={Lock} label="Password" required>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={e => setSignup('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  className="input-field pl-10"
                />
              </Field>

              <Field icon={Lock} label="Confirm Password" required>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={e => setSignup('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className="input-field pl-10"
                />
              </Field>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2">
                {submitting
                  ? <><Loader className="w-4 h-4 animate-spin" /> Creating account...</>
                  : <>Create Account <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field icon={Mail} label="Work Email" required>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLogin('email', e.target.value)}
                  placeholder="you@company.com"
                  className="input-field pl-10"
                />
              </Field>

              <Field icon={Lock} label="Password" required>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLogin('password', e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                />
              </Field>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2">
                {submitting
                  ? <><Loader className="w-4 h-4 animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-6 transition-colors"
        >
          ← Back to home
        </button>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        {children}
      </div>
    </div>
  )
}
