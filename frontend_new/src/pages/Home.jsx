import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Sparkles, Shield, TrendingUp, Zap, Lock,
  LayoutDashboard, Users, Mail, PlusCircle, BarChart3,
  Brain, Target, MessageSquare, CheckCircle, ChevronRight,
  Heart, LineChart, Clock
} from 'lucide-react'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import HeroIllustration from '../components/ui/HeroIllustration'
import { BRAND } from '../utils/brand'
import { isAuthenticated } from '../utils/auth'

const STATS = [
  { value: '40%', label: 'Faster response time' },
  { value: '3×', label: 'More actions taken' },
  { value: '92%', label: 'Sentiment accuracy' },
  { value: '24/7', label: 'Inbox monitoring' },
]

const SERVICES = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    title: 'Command Dashboard',
    description: 'Real-time overview of customer health scores, pending approvals, and portfolio-wide risk at a glance.',
    color: 'violet',
    preview: ['Health score rings', 'At-risk alerts', 'Weekly activity charts'],
  },
  {
    path: '/customers',
    icon: Users,
    title: 'Customer Portfolio',
    description: 'Browse every account with health filters, renewal dates, and one-click access to full interaction history.',
    color: 'blue',
    preview: ['Health filtering', 'Renewal tracking', 'Account profiles'],
  },
  {
    path: '/emails',
    icon: Mail,
    title: 'Inbox Monitor',
    description: 'Live feed of all customer interactions from Gmail — emails, calls, meetings — auto-refreshed in real time.',
    color: 'cyan',
    preview: ['Live email sync', 'Status filtering', 'Sentiment tags'],
  },
  {
    path: '/analyze',
    icon: PlusCircle,
    title: 'Interaction Analyzer',
    description: 'Paste any customer email, call notes, or meeting summary and get AI-ranked next best actions instantly.',
    color: 'emerald',
    preview: ['Multi-step wizard', 'Intent detection', 'Sentiment analysis'],
  },
  {
    path: '/analytics',
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track resolution rates, sentiment trends, channel performance, and portfolio health over time.',
    color: 'amber',
    preview: ['Sentiment breakdown', 'KPI tracking', 'Channel scores'],
  },
]

const STEPS = [
  { icon: MessageSquare, title: 'Capture', desc: 'Emails and interactions flow in automatically from your inbox' },
  { icon: Brain, title: 'Analyze', desc: 'AI reads sentiment, intent, and full customer history in seconds' },
  { icon: Target, title: 'Recommend', desc: 'Ranked next-best-actions with confidence scores and drafts' },
  { icon: CheckCircle, title: 'Act & Retain', desc: 'Approve, edit, or reject — memory updates for every decision' },
]

const USE_CASES = [
  {
    title: 'Renewal at Risk',
    desc: 'A key account sends a frustrated email 30 days before renewal. RetainIQ detects negative sentiment, pulls 6 months of history, and recommends a personalized executive outreach with a draft email.',
    tag: 'Churn Prevention',
  },
  {
    title: 'Scaling Your CS Team',
    desc: 'Your team handles 200+ accounts. RetainIQ prioritizes which interactions need human attention first, so nothing critical slips through the cracks.',
    tag: 'Team Efficiency',
  },
  {
    title: 'Onboarding New CSMs',
    desc: 'New hires get instant context on every account through AI memory summaries — no more digging through scattered notes and old threads.',
    tag: 'Knowledge Transfer',
  },
]

const COLOR_MAP = {
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/25',  glow: 'hover:shadow-violet-500/10' },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25',    glow: 'hover:shadow-blue-500/10' },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/25',    glow: 'hover:shadow-cyan-500/10' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', glow: 'hover:shadow-emerald-500/10' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25',   glow: 'hover:shadow-amber-500/10' },
}

export default function Home() {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  const handleServiceClick = (path) => {
    if (loggedIn) navigate(path)
    else navigate('/auth', { state: { from: path } })
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{BRAND.name}</p>
              <p className="text-[11px] text-gray-500">{BRAND.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
            {loggedIn ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/auth')} className="btn-secondary text-sm">Sign In</button>
                <button onClick={() => navigate('/auth')} className="btn-primary text-sm hidden sm:flex">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25 mb-6">
              <Heart className="w-3.5 h-3.5" />
              Built for Customer Success Teams at Scale
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.1] tracking-tight">
              Never lose a customer to a{' '}
              <span className="gradient-text">missed signal</span>
            </h1>

            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl">
              {BRAND.name} transforms emails, calls, and meetings into ranked next-best-actions —
              so your team responds with precision, retains more accounts, and scales without burning out.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={() => loggedIn ? navigate('/dashboard') : navigate('/auth')} className="btn-primary text-base px-8 py-3.5">
                {loggedIn ? 'Open Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <a href="#features" className="btn-secondary text-base px-8 py-3.5 text-center">
                Explore Features
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, text: 'AI next-best-actions' },
                { icon: TrendingUp, text: 'Live health tracking' },
                { icon: Shield, text: 'Enterprise-ready' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/25 to-cyan-500/10 rounded-3xl blur-3xl scale-110" />
            <div className="relative glass-card p-5 sm:p-8 overflow-hidden">
              <HeroIllustration className="w-full h-auto" />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                <p className="text-sm font-semibold text-white">
                  Interactions in → Intelligence out → Customers retained
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  From raw email to approved action in under 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold gradient-text tabular-nums">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Features (visible, login-gated) ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-4">
            <Lock className="w-3 h-3" /> Sign in to access · Preview available below
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything your CS team needs
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Five powerful modules working together — explore each feature below.
            {!loggedIn && ' Create a free account to unlock full access.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => {
            const colors = COLOR_MAP[service.color]
            const Icon = service.icon
            return (
              <button
                key={service.path}
                onClick={() => handleServiceClick(service.path)}
                className={`group text-left glass-card-hover p-6 relative overflow-hidden animate-slide-up shadow-lg ${colors.glow}`}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                {/* Lock overlay hint */}
                {!loggedIn && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] text-gray-400 group-hover:text-violet-300 group-hover:border-violet-500/30 transition-all">
                    <Lock className="w-3 h-3" />
                    Sign in
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-violet-200 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{service.description}</p>

                <ul className="mt-4 space-y-1.5">
                  {service.preview.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                      <ChevronRight className={`w-3 h-3 ${colors.text} shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className={`mt-5 flex items-center gap-1 text-xs font-medium ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {loggedIn ? 'Open module' : 'Sign in to access'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            )
          })}

          {/* CTA card */}
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5">
            <LineChart className="w-10 h-10 text-violet-400 mb-4" />
            <h3 className="text-base font-semibold text-white">Ready to retain smarter?</h3>
            <p className="text-sm text-gray-400 mt-2">Join customer success teams using {BRAND.name} to reduce churn.</p>
            <button
              onClick={() => navigate(loggedIn ? '/dashboard' : '/auth')}
              className="btn-primary mt-5 text-sm w-full justify-center"
            >
              {loggedIn ? 'Go to Dashboard' : 'Create Free Account'}
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative z-10 bg-white/[0.02] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How {BRAND.name} works</h2>
            <p className="text-gray-400 mt-4">From customer message to approved action in four steps</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative glass-card p-6 text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-violet-500/30 z-10" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xs font-bold text-violet-300">{i + 1}</span>
                  </div>
                  <Icon className="w-6 h-6 text-violet-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Built for real CS challenges</h2>
          <p className="text-gray-400 mt-4">See how teams use {BRAND.name} every day</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {USE_CASES.map(({ title, desc, tag }) => (
            <div key={title} className="glass-card p-6 hover:bg-white/[0.04] transition-colors">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25 mb-4 uppercase tracking-wider">
                {tag}
              </span>
              <h3 className="text-base font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="relative z-10 bg-white/[0.02] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Your inbox is full of signals.<br />
              <span className="text-gray-500">Most teams miss half of them.</span>
            </h2>
            <div className="space-y-4">
              {[
                { bad: 'CSMs manually triage hundreds of emails daily', good: 'AI prioritizes what needs attention first' },
                { bad: 'Context scattered across tools and threads', good: 'Persistent AI memory for every account' },
                { bad: 'Reactive firefighting instead of proactive retention', good: 'Ranked actions with ready-to-send drafts' },
                { bad: 'No visibility into portfolio-wide health', good: 'Live dashboard with at-risk account alerts' },
              ].map(({ bad, good }) => (
                <div key={bad} className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                    <span className="text-rose-400 shrink-0 mt-0.5">✗</span>
                    <span className="text-gray-500">{bad}</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-300">{good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 text-center">
            <Clock className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <p className="text-4xl font-bold gradient-text tabular-nums">&lt; 60s</p>
            <p className="text-white font-medium mt-2">From interaction to recommendation</p>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              While your competitor's CSM is still reading the email thread,
              {BRAND.name} has already analyzed sentiment, retrieved history, and drafted the response.
            </p>
            <button
              onClick={() => navigate(loggedIn ? '/analyze' : '/auth', loggedIn ? undefined : { state: { from: '/analyze' } })}
              className="btn-primary mt-6"
            >
              Try the Analyzer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="glass-card p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Start retaining customers smarter today
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto">
              Set up in minutes. No credit card required. Built for B2B customer success teams who can't afford to miss a signal.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate(loggedIn ? '/dashboard' : '/auth')} className="btn-primary text-base px-10 py-3.5">
                {loggedIn ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/auth')} className="btn-secondary text-base px-10 py-3.5">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{BRAND.name}</p>
              <p className="text-[10px] text-gray-600">{BRAND.tagline}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">XLVentures.AI © 2026 · {BRAND.name} Platform</p>
        </div>
      </footer>
    </div>
  )
}
