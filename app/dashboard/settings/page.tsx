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
        <div className="text-6xl mb-4">⚙️</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-lg font-semibold text-[#111827] mb-4">Failed to load settings</div>
        <button
          onClick={fetchSettings}
          className="px-6 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px]"
        >
          🔄 Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
      <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">🏨</span>
          Hotel Information
        </h3>
      </div>
      <div className="p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="hotelName" className="block text-sm font-semibold text-[#111827] mb-3">
              🏨 Hotel Name <span className="text-[#8E0E1C]">*</span>
            </label>
            <input
              id="hotelName"
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="hotelAddress" className="block text-sm font-semibold text-[#111827] mb-3">
              📍 Address <span className="text-[#8E0E1C]">*</span>
            </label>
            <textarea
              id="hotelAddress"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label htmlFor="hotelPhone" className="block text-sm font-semibold text-[#111827] mb-3">
              📱 Phone <span className="text-[#8E0E1C]">*</span>
            </label>
            <input
              id="hotelPhone"
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="hotelEmail" className="block text-sm font-semibold text-[#111827] mb-3">
              📧 Email
            </label>
            <input
              id="hotelEmail"
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
            />
          </div>

          <div>
            <label htmlFor="hotelGstin" className="block text-sm font-semibold text-[#111827] mb-3">
              🧾 GSTIN
            </label>
            <input
              id="hotelGstin"
              type="text"
              value={settings.gstin || ''}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full sm:w-auto px-8 py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
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
