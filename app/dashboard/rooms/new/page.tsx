'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface RoomType {
  id: string
  name: string
}

export default function NewRoomPage() {
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomTypeId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/room-types', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setRoomTypes(data)
        }
      } catch {
        // Error handled by console.error
      }
    }

    fetchRoomTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          roomTypeId: formData.roomTypeId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create room')
        setLoading(false)
        return
      }

      toast.success('Room created successfully!')
      router.push('/dashboard/settings/rooms')
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ➕ Add New Room
          </h2>
          <p className="text-slate-600 font-medium">Create a new room for your hotel</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-5">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🏨</span>
            Room Information
          </h3>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="roomNumber" className="block text-sm font-semibold text-slate-700 mb-3">
                🏨 Room Number <span className="text-red-500">*</span>
              </label>
              <input
                id="roomNumber"
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="e.g., 101, 201, 301"
              />
            </div>

            <div>
              <label htmlFor="roomTypeId" className="block text-sm font-semibold text-slate-700 mb-3">
                🏷️ Room Type <span className="text-red-500">*</span>
              </label>
              <select
                id="roomTypeId"
                required
                value={formData.roomTypeId}
                onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
              >
                <option value="">Select room type</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
              {roomTypes.length === 0 && (
                <div className="mt-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <p className="text-sm font-semibold text-yellow-800">
                    ⚠️ No room types available. Please add room types in{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/settings/room-types')}
                      className="text-indigo-600 hover:text-indigo-800 underline font-bold"
                    >
                      Settings
                    </button>{' '}
                    first.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Create Room</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
