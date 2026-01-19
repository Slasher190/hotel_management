'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'

interface HotelSettings {
  id: string
  name: string
  address: string
  phone: string
  email: string | null
  gstin: string | null
  logoUrl: string | null
}

interface RoomType {
  id: string
  name: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [newRoomType, setNewRoomType] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roomTypeId: string | null; roomTypeName: string }>({
    isOpen: false,
    roomTypeId: null,
    roomTypeName: '',
  })

  useEffect(() => {
    fetchSettings()
    fetchRoomTypes()
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

  const fetchRoomTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/room-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data)
      } else {
        console.error('Failed to fetch room types')
        toast.error('Failed to fetch room types')
      }
    } catch (error) {
      console.error('Error fetching room types:', error)
      toast.error('An error occurred while fetching room types')
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

  const handleAddRoomType = async () => {
    if (!newRoomType.trim()) {
      toast.error('Please enter a room type name')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/room-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomType.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setRoomTypes([...roomTypes, data])
        setNewRoomType('')
        toast.success('Room type added successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add room type')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleDeleteRoomType = async (id: string, name: string) => {
    setDeleteModal({ isOpen: true, roomTypeId: id, roomTypeName: name })
  }

  const confirmDeleteRoomType = async () => {
    if (!deleteModal.roomTypeId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/room-types/${deleteModal.roomTypeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setRoomTypes(roomTypes.filter((rt) => rt.id !== deleteModal.roomTypeId))
        toast.success('Room type deleted successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete room type')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: '' })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Failed to load settings. Please try again.
        </div>
        <button
          onClick={fetchSettings}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: '' })}
        onConfirm={confirmDeleteRoomType}
        title="Delete Room Type"
        message={`Are you sure you want to delete "${deleteModal.roomTypeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Hotel Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name *</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
            <input
              type="text"
              value={settings.gstin || ''}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Hotel Information'}
          </button>
        </div>
      </div>

      {/* Room Types */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Types</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
              placeholder="Enter room type (e.g., AC, Non-AC, Deluxe, Single Bed)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddRoomType()
                }
              }}
            />
            <button
              onClick={handleAddRoomType}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {roomTypes.map((roomType) => (
              <div
                key={roomType.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-900 font-medium">{roomType.name}</span>
                <button
                  onClick={() => handleDeleteRoomType(roomType.id, roomType.name)}
                  className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
