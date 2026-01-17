'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  roomNumber: string
  roomType: {
    id: string
    name: string
  }
  status: 'AVAILABLE' | 'OCCUPIED'
}

interface RoomType {
  id: string
  name: string
}

export default function NewBookingPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [formData, setFormData] = useState({
    roomId: '',
    roomTypeId: '',
    guestName: '',
    idType: 'AADHAAR' as 'AADHAAR' | 'DL' | 'VOTER_ID' | 'PASSPORT' | 'OTHER',
    idNumber: '',
    additionalGuests: '0',
    mattresses: '0',
    roomPrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  useEffect(() => {
    if (formData.roomTypeId) {
      fetchAvailableRooms()
    } else {
      setRooms([])
    }
  }, [formData.roomTypeId])

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
    } catch (error) {
      console.error('Error fetching room types:', error)
    }
  }

  const fetchAvailableRooms = async () => {
    try {
      const token = localStorage.getItem('token')
      const roomType = roomTypes.find((rt) => rt.id === formData.roomTypeId)
      if (!roomType) return

      const response = await fetch(`/api/rooms?type=${roomType.name}&status=AVAILABLE`, {
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
          roomId: formData.roomId,
          guestName: formData.guestName,
          idType: formData.idType,
          idNumber: formData.idNumber || null,
          additionalGuests: parseInt(formData.additionalGuests) || 0,
          mattresses: parseInt(formData.mattresses) || 0,
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
            <label htmlFor="roomTypeId" className="block text-sm font-medium text-gray-700 mb-2">
              Room Type *
            </label>
            <select
              id="roomTypeId"
              required
              value={formData.roomTypeId}
              onChange={(e) => {
                setFormData({ ...formData, roomTypeId: e.target.value, roomId: '' })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select room type</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
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
                  {room.roomNumber} ({room.roomType.name})
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
              <option value="VOTER_ID">Voter ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
              ID Number
            </label>
            <input
              id="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter ID number"
            />
          </div>

          <div>
            <label htmlFor="additionalGuests" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Guests
            </label>
            <input
              id="additionalGuests"
              type="number"
              min="0"
              value={formData.additionalGuests}
              onChange={(e) => setFormData({ ...formData, additionalGuests: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Number of additional guests"
            />
          </div>

          <div>
            <label htmlFor="mattresses" className="block text-sm font-medium text-gray-700 mb-2">
              Mattresses
            </label>
            <input
              id="mattresses"
              type="number"
              min="0"
              value={formData.mattresses}
              onChange={(e) => setFormData({ ...formData, mattresses: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Number of mattresses"
            />
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
