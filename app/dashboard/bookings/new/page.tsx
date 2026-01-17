'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  roomNumber: string
  roomType: 'AC' | 'NON_AC'
  status: 'AVAILABLE' | 'OCCUPIED'
}

export default function NewBookingPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [formData, setFormData] = useState({
    roomId: '',
    roomType: 'AC' as 'AC' | 'NON_AC',
    guestName: '',
    idType: 'AADHAAR' as 'AADHAAR' | 'DL' | 'PASSPORT' | 'OTHER',
    roomPrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAvailableRooms()
  }, [formData.roomType])

  const fetchAvailableRooms = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/rooms?type=${formData.roomType}&status=AVAILABLE`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          roomPrice: parseFloat(formData.roomPrice),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create booking')
        setLoading(false)
        return
      }

      const bookingData = await response.json()
      // Redirect to checkout page with the new booking ID
      router.push(`/dashboard/checkout/${bookingData.id}`)
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">New Check-In</h2>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-2">
              Room Type *
            </label>
            <select
              id="roomType"
              required
              value={formData.roomType}
              onChange={(e) => {
                setFormData({ ...formData, roomType: e.target.value as 'AC' | 'NON_AC', roomId: '' })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="AC">AC</option>
              <option value="NON_AC">Non-AC</option>
            </select>
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Select Room *
            </label>
            <select
              id="roomId"
              required
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.roomNumber}
                </option>
              ))}
            </select>
            {rooms.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">No available rooms of this type</p>
            )}
          </div>

          <div>
            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
              Guest Name *
            </label>
            <input
              id="guestName"
              type="text"
              required
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter guest name"
            />
          </div>

          <div>
            <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-2">
              ID Type *
            </label>
            <select
              id="idType"
              required
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="AADHAAR">Aadhaar</option>
              <option value="DL">Driving License</option>
              <option value="PASSPORT">Passport</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="roomPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Room Price (₹) *
            </label>
            <input
              id="roomPrice"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.roomPrice}
              onChange={(e) => setFormData({ ...formData, roomPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter room price"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
