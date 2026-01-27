'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { getLocalDateISOString, getLocalDateTimeISOString } from '@/lib/utils'

interface Room {
  id: string
  roomNumber: string
  roomType: {
    id: string
    name: string
    price: number
  }
  status: 'AVAILABLE' | 'OCCUPIED'
}

interface RoomType {
  id: string
  name: string
  price: number
  category?: 'ROOM' | 'HALL'
}

export default function NewBookingPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [formData, setFormData] = useState({
    roomId: '',
    roomTypeId: '',
    // Bill Details
    billNumber: '',
    billDate: getLocalDateISOString(),
    checkInDate: getLocalDateTimeISOString(),

    // Guest Profile
    guestName: '',
    guestAddress: '',
    guestMobile: '',
    guestGstNumber: '',

    // Corporate Fields
    companyName: '',
    department: '',
    designation: '',

    // Booking Details
    purpose: '',
    idType: 'AADHAAR' as 'AADHAAR' | 'DL' | 'VOTER_ID' | 'PASSPORT' | 'OTHER',
    idNumber: '',

    // Occupancy
    adults: '1',
    children: '0',
    additionalGuests: '0',

    // Calculations
    roomPrice: '', // Rent per day
    numberOfDays: '1',
    discount: '0',
    additionalGuestCharges: '0',
    mattresses: '0',
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
      // Feature: Default Room Rent
      const selectedType = roomTypes.find(rt => rt.id === formData.roomTypeId)
      if (selectedType) {
        setFormData(prev => ({ ...prev, roomPrice: selectedType.price?.toString() || '' }))
      }
    } else {
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.roomTypeId, roomTypes])

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
          additionalGuests: parseInt(formData.additionalGuests) || 0,
          additionalGuestCharges: parseFloat(formData.additionalGuestCharges) || 0,
          mattresses: parseInt(formData.mattresses) || 0,
          roomPrice: parseFloat(formData.roomPrice),
          adults: parseInt(formData.adults) || 1,
          children: parseInt(formData.children) || 0,
          discount: parseFloat(formData.discount) || 0,
          advanceAmount: parseFloat((formData as any).advanceAmount) || 0,
          checkInDate: new Date(formData.checkInDate).toISOString(),
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

  // Calculations
  const rentPerDay = parseFloat(formData.roomPrice) || 0
  const days = parseInt(formData.numberOfDays) || 0
  const discount = parseFloat(formData.discount) || 0
  const addGuestCharges = (parseInt(formData.additionalGuests) || 0) * (parseFloat(formData.additionalGuestCharges) || 0)

  const totalRent = (rentPerDay * days)
  const taxableAmount = totalRent + addGuestCharges - discount
  // GST Logic (Simple 12% for now, or based on price?) 
  // Requirement: "GST calculation". Usually < 1000 is 0%, 1000-7500 is 12%, > 7500 is 18%.
  let gstRate = 0
  if (rentPerDay >= 7500) gstRate = 0.18
  else if (rentPerDay >= 1000) gstRate = 0.12

  const gstAmount = taxableAmount * gstRate
  const totalAmount = taxableAmount + gstAmount

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            ➕ New Booking
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Create a new booking entry</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* 1. Header Info & Bill Details */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden shadow-sm">
          <div className="bg-[#1e293b] px-6 sm:px-8 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📄 Bill Details
            </h3>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#64748B] mb-2">Visitor Registration No</label>
              <div className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#94A3B8] font-mono">
                Auto-serialized
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Bill No</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C]"
                placeholder="Enter bill no"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Bill Date</label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Check In Time</label>
              <input
                type="datetime-local"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C]"
              />
            </div>
            <div>
              {/* Room Selection serves as "Room No" */}
              <label className="block text-sm font-semibold text-[#111827] mb-2">Select Room (Manual)</label>
              <div className="flex gap-2">
                <select
                  required
                  value={formData.roomTypeId}
                  onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value, roomId: '' })}
                  className="w-1/2 px-2 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                >
                  <option value="">Type</option>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-1/2 px-2 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                >
                  <option value="">No.</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} (₹{r.roomType.price})</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Guest Profile */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden shadow-sm">
          <div className="bg-[#1e293b] px-6 sm:px-8 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              👤 Guest Profile
            </h3>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#111827] mb-2">Guest Name <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="Full Name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#111827] mb-2">Address</label>
              <textarea
                value={formData.guestAddress}
                onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="Full Address"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Mobile No</label>
              <input
                type="tel"
                value={formData.guestMobile}
                onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="10-digit number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">GST No</label>
              <input
                type="text"
                value={formData.guestGstNumber}
                onChange={(e) => setFormData({ ...formData, guestGstNumber: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="Optional"
              />
            </div>

            {/* ID Proof */}
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">ID Type <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value as any })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              >
                <option value="AADHAAR">Aadhaar</option>
                <option value="DL">Driving License</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">ID Number</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="ID Number"
              />
            </div>
          </div>
        </div>

        {/* 3. Corporate Fields */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden shadow-sm">
          <div className="bg-[#1e293b] px-6 sm:px-8 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏢 Corporate Details (Optional)
            </h3>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
          </div>
        </div>

        {/* 4. Occupancy & Purpose */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden shadow-sm">
          <div className="bg-[#1e293b] px-6 sm:px-8 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              👥 Occupancy & Purpose
            </h3>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Adults</label>
              <input
                type="number"
                min="1"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Children</label>
              <input
                type="number"
                min="0"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Booking Purpose <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                placeholder="e.g. Business, Tourism"
              />
            </div>

            {/* Additional Guests (legacy or extra?) Keeping as per requirements 'Occupancy' handles basic. */}
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Extra Guests</label>
              <input
                type="number"
                min="0"
                value={formData.additionalGuests}
                onChange={(e) => setFormData({ ...formData, additionalGuests: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
              />
            </div>
          </div>
        </div>

        {/* 5. Financial Calculations */}
        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden shadow-sm">
          <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              💰 Payment Details
            </h3>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Rent per day</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    required
                    type="number"
                    value={formData.roomPrice}
                    onChange={(e) => setFormData({ ...formData, roomPrice: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">No. of Days</label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Discount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Advance Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    type="number"
                    value={(formData as any).advanceAmount || ''}
                    onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value } as any)}
                    className="w-full pl-8 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Extra Guest Charge</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    type="number"
                    value={formData.additionalGuestCharges}
                    onChange={(e) => setFormData({ ...formData, additionalGuestCharges: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C]"
                  />
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="border-t border-dashed border-gray-300 pt-6">
              <div className="flex flex-col gap-2 max-w-md ml-auto">
                <div className="flex justify-between text-gray-600">
                  <span>Total Rent ({days} days):</span>
                  <span>₹{totalRent.toFixed(2)}</span>
                </div>
                {addGuestCharges > 0 && <div className="flex justify-between text-gray-600">
                  <span>Extra Guest Charges:</span>
                  <span>+ ₹{addGuestCharges.toFixed(2)}</span>
                </div>}
                {discount > 0 && <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>}
                <div className="flex justify-between text-gray-600">
                  <span>GST ({gstRate * 100}%):</span>
                  <span>+ ₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[#8E0E1C] border-t border-gray-300 pt-2 mt-2">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity font-bold disabled:opacity-50 text-lg shadow-lg"
          >
            {loading ? 'Creating...' : '✅ Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}
