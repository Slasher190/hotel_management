'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
    additionalGuestCharges: '0',
    mattresses: '0',
    roomPrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    } catch {
      // Error handled by console.error
    }
  }

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  useEffect(() => {
    if (formData.roomTypeId) {
      fetchAvailableRooms()
    } else {
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.roomTypeId])

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
          additionalGuestCharges: parseFloat(formData.additionalGuestCharges) || 0,
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
      toast.success('Booking created successfully!')
      // Redirect to checkout page with the new booking ID
      router.push(`/dashboard/checkout/${bookingData.id}`)
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Calculate total additional guest charges
  const totalAdditionalCharges = (parseInt(formData.additionalGuests) || 0) * (parseFloat(formData.additionalGuestCharges) || 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            ➕ New Check-In
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Create a new booking for a guest</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🏨</span>
            Booking Information
          </h3>
        </div>
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="roomTypeId" className="block text-sm font-semibold text-[#111827] mb-3">
                🏷️ Room Type <span className="text-[#8E0E1C]">*</span>
              </label>
              <select
                id="roomTypeId"
                required
                value={formData.roomTypeId}
                onChange={(e) => {
                  setFormData({ ...formData, roomTypeId: e.target.value, roomId: '' })
                }}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827]"
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
              <label htmlFor="roomId" className="block text-sm font-semibold text-[#111827] mb-3">
                🏨 Select Room <span className="text-[#8E0E1C]">*</span>
              </label>
              <select
                id="roomId"
                required
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827]"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomNumber} ({room.roomType.name})
                  </option>
                ))}
              </select>
              {rooms.length === 0 && formData.roomTypeId && (
                <p className="mt-2 text-sm text-[#64748B] font-medium">No available rooms of this type</p>
              )}
            </div>

            <div>
              <label htmlFor="guestName" className="block text-sm font-semibold text-[#111827] mb-3">
                👤 Guest Name <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                required
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                placeholder="Enter guest name"
              />
            </div>

            <div>
              <label htmlFor="idType" className="block text-sm font-semibold text-[#111827] mb-3">
                🆔 ID Type <span className="text-[#8E0E1C]">*</span>
              </label>
              <select
                id="idType"
                required
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value as 'AADHAAR' | 'DL' | 'VOTER_ID' | 'PASSPORT' | 'OTHER' })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827]"
              >
                <option value="AADHAAR">Aadhaar</option>
                <option value="DL">Driving License</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="idNumber" className="block text-sm font-semibold text-[#111827] mb-3">
                🔢 ID Number
              </label>
              <input
                id="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                placeholder="Enter ID number"
              />
            </div>

            <div>
              <label htmlFor="additionalGuests" className="block text-sm font-semibold text-[#111827] mb-3">
                👥 Additional Guests
              </label>
              <input
                id="additionalGuests"
                type="number"
                min="0"
                value={formData.additionalGuests}
                onChange={(e) => setFormData({ ...formData, additionalGuests: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                placeholder="Number of additional guests"
              />
            </div>

            {parseInt(formData.additionalGuests) > 0 && (
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-4 sm:p-6">
                <div>
                  <label htmlFor="additionalGuestCharges" className="block text-sm font-semibold text-[#111827] mb-3">
                    💰 Additional Guest Charges (₹ per guest) <span className="text-[#8E0E1C]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                    <input
                      id="additionalGuestCharges"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.additionalGuestCharges}
                      onChange={(e) => setFormData({ ...formData, additionalGuestCharges: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                      placeholder="0.00"
                    />
                  </div>
                  {totalAdditionalCharges > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-[#CBD5E1]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-[#64748B]">
                          Total Additional Guest Charges:
                        </span>
                        <span className="text-lg font-bold text-[#111827]">
                          ₹{totalAdditionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 font-medium">
                        ({formData.additionalGuests} guest(s) × ₹{parseFloat(formData.additionalGuestCharges) || 0})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="mattresses" className="block text-sm font-semibold text-[#111827] mb-3">
                🛏️ Mattresses
              </label>
              <input
                id="mattresses"
                type="number"
                min="0"
                value={formData.mattresses}
                onChange={(e) => setFormData({ ...formData, mattresses: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                placeholder="Number of mattresses"
              />
            </div>

            <div>
              <label htmlFor="roomPrice" className="block text-sm font-semibold text-[#111827] mb-3">
                💰 Room Price (₹) <span className="text-[#8E0E1C]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                <input
                  id="roomPrice"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.roomPrice}
                  onChange={(e) => setFormData({ ...formData, roomPrice: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white text-[#111827] placeholder:text-[#94A3B8]"
                  placeholder="Enter room price"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
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
                    <span>Create Booking</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-bold min-h-[44px]"
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
