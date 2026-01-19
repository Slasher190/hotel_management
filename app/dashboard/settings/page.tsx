'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface HotelSettings {
  id: string
  name: string
  address: string
  phone: string
  email: string | null
  gstin: string | null
  logoUrl: string | null
}

export default function HotelInfoPage() {
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || 'Failed to load settings'
        toast.error(errorMsg)
        console.error('Settings fetch error:', errorMsg)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('An error occurred while loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success('Settings saved successfully!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || 'Failed to save settings'
        toast.error(errorMsg)
        console.error('Settings save error:', errorMsg)
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 animate-pulse">⚙️</div>
        <div className="text-lg font-semibold text-slate-500">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-lg font-semibold text-slate-700 mb-4">Failed to load settings</div>
        <button
          onClick={fetchSettings}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🔄 Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🏨</span>
          Hotel Information
        </h3>
      </div>
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="hotelName" className="block text-sm font-semibold text-slate-700 mb-3">
              🏨 Hotel Name <span className="text-red-500">*</span>
            </label>
            <input
              id="hotelName"
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="hotelAddress" className="block text-sm font-semibold text-slate-700 mb-3">
              📍 Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="hotelAddress"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label htmlFor="hotelPhone" className="block text-sm font-semibold text-slate-700 mb-3">
              📱 Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="hotelPhone"
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="hotelEmail" className="block text-sm font-semibold text-slate-700 mb-3">
              📧 Email
            </label>
            <input
              id="hotelEmail"
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>

          <div>
            <label htmlFor="hotelGstin" className="block text-sm font-semibold text-slate-700 mb-3">
              🧾 GSTIN
            </label>
            <input
              id="hotelGstin"
              type="text"
              value={settings.gstin || ''}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Hotel Information</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
