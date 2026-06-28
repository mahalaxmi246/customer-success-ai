import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import PageHeader from '../components/ui/PageHeader'
import { useTheme } from '../contexts/ThemeContext'
import {
  Settings as SettingsIcon, Bell, Shield, Database, Palette,
  Globe, Key, Save, Check
} from 'lucide-react'

const SECTIONS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('general')
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    companyName: 'XLVentures.AI',
    apiUrl: 'http://localhost:8000/api',
    autoRefresh: true,
    refreshInterval: 5,
    emailNotifications: true,
    slackNotifications: false,
    gmailConnected: true,
    crmConnected: false,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-violet-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your PulseCS platform"
        actions={
          <button onClick={handleSave} className="btn-primary">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="md:w-48 shrink-0 space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.id
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <GlassCard className="flex-1 p-6 space-y-6">
          {activeSection === 'general' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white">General Settings</h3>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Company Name</label>
                <input
                  value={settings.companyName}
                  onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">API Base URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={settings.apiUrl}
                    onChange={e => setSettings(s => ({ ...s, apiUrl: e.target.value }))}
                    className="input-field pl-10 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">Auto-refresh inbox</p>
                  <p className="text-xs text-gray-500">Poll for new interactions every {settings.refreshInterval}s</p>
                </div>
                <Toggle
                  checked={settings.autoRefresh}
                  onChange={v => setSettings(s => ({ ...s, autoRefresh: v }))}
                />
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
              {[
                { key: 'emailNotifications', label: 'Email notifications', desc: 'Get notified when actions need approval' },
                { key: 'slackNotifications', label: 'Slack notifications', desc: 'Send alerts to your Slack workspace' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={settings[item.key]}
                    onChange={v => setSettings(s => ({ ...s, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white">Connected Integrations</h3>
              {[
                { name: 'Gmail', connected: settings.gmailConnected, desc: 'Email ingestion & monitoring' },
                { name: 'Salesforce CRM', connected: settings.crmConnected, desc: 'Customer data sync' },
                { name: 'Slack', connected: false, desc: 'Team notifications' },
                { name: 'Calendar', connected: false, desc: 'Meeting scheduling' },
              ].map(integration => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <p className="text-sm font-medium text-white">{integration.name}</p>
                    <p className="text-xs text-gray-500">{integration.desc}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    integration.connected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-white/[0.04] text-gray-500 border border-white/[0.08]'
                  }`}>
                    {integration.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white">Security</h3>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-medium text-white">API Key</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value="sk-pulse-••••••••••••••••"
                    readOnly
                    className="input-field font-mono text-xs flex-1"
                  />
                  <button className="btn-secondary text-xs">Regenerate</button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">Two-factor authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white">Appearance</h3>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">Dark mode</p>
                  <p className="text-xs text-gray-500">Use dark theme (recommended)</p>
                </div>
                <Toggle
                  checked={theme === 'dark'}
                  onChange={v => setTheme(v ? 'dark' : 'light')}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">Accent Color</p>
                <div className="flex gap-2">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === '#8b5cf6' ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}