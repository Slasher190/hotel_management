'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Room {
  id: string
  roomNumber: string
  roomType: {
    name: string
  }
}

export default function BillGeneratorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bookingId: '',
    visitorRegistrationNumber: '', // Auto-generated
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    guestName: '',
    guestAddress: '',
    guestState: '',
    guestNationality: 'Indian',
    guestGstNumber: '',
    guestStateCode: '',
    guestMobile: '',
    idType: 'AADHAAR',
    idNumber: '',
    companyName: '',
    companyCode: '',
    department: '',
    designation: '',
    businessPhoneNumber: '',
    roomNumber: '', // Auto-filled from particulars selection
    particulars: '', // Selection from rooms
    rentPerDay: '',
    numberOfDays: '1',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date().toISOString().split('T')[0],
    adults: '1',
    children: '0',
    totalGuests: '1', // Calculated field
    roomCharges: '',
    tariff: '',
    foodCharges: '0',
    additionalGuestCharges: '0',
    additionalGuests: '0',
    discount: '0',
    gstEnabled: false,
    showGst: false,
    gstPercent: '5',
    gstNumber: '',
    advanceAmount: '0',
    roundOff: '0',
    paymentMode: 'CASH' as 'CASH' | 'ONLINE',
  })
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Fetch rooms for particulars selection
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/rooms', {
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
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchRooms()
  }, [])

  // Auto-generate visitor registration number
  useEffect(() => {
    const generateVisitorRegNumber = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/bills/visitor-registration-count', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const { count } = await response.json()
          const newRegNumber = `VR-${String(count + 1).padStart(6, '0')}`
          setFormData(prev => ({ ...prev, visitorRegistrationNumber: newRegNumber }))
        }
      } catch (error) {
        console.error('Error generating visitor registration number:', error)
      }
    }

    generateVisitorRegNumber()
  }, [])

  // Calculate total guests when adults or children change
  useEffect(() => {
    const adults = parseInt(formData.adults) || 0
    const children = parseInt(formData.children) || 0
    const total = adults + children
    setFormData(prev => ({ ...prev, totalGuests: total.toString() }))
  }, [formData.adults, formData.children])

  // Auto-fill room number when particulars is selected
  const handleParticularsChange = (roomId: string) => {
    const selectedRoom = rooms.find(room => room.id === roomId)
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        particulars: roomId,
        roomNumber: selectedRoom.roomNumber
      }))
    }
  }

  const calculations = useMemo(() => {
    const roomCharges = Number.parseFloat(formData.roomCharges) || 0
    const tariff = Number.parseFloat(formData.tariff) || 0
    const foodCharges = Number.parseFloat(formData.foodCharges) || 0
    const additionalGuestCharges = Number.parseFloat(formData.additionalGuestCharges) || 0
    const additionalGuests = Number.parseInt(formData.additionalGuests) || 0
    const additionalGuestsTotal = additionalGuestCharges * additionalGuests
    const discount = Number.parseFloat(formData.discount) || 0
    const advance = Number.parseFloat(formData.advanceAmount) || 0
    const roundOff = Number.parseFloat(formData.roundOff) || 0
    const gstPercent = Number.parseFloat(formData.gstPercent) || 0
    
    const baseAmount = roomCharges + tariff + foodCharges + additionalGuestsTotal - discount
    const gstAmount = (formData.gstEnabled && formData.showGst) ? (baseAmount * gstPercent) / 100 : 0
    const totalAmount = baseAmount + gstAmount - advance + roundOff

    return {
      roomCharges,
      tariff,
      foodCharges,
      additionalGuestCharges,
      additionalGuests,
      additionalGuestsTotal,
      discount,
      baseAmount,
      gstAmount,
      advance,
      roundOff,
      totalAmount,
    }
  }, [formData])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          roomCharges: calculations.roomCharges,
          tariff: calculations.tariff,
          foodCharges: calculations.foodCharges,
          additionalGuestCharges: calculations.additionalGuestCharges,
          additionalGuests: calculations.additionalGuests,
          discount: calculations.discount,
          gstPercent: parseFloat(formData.gstPercent) || 5,
          advanceAmount: calculations.advance,
          roundOff: calculations.roundOff,
          showGst: formData.showGst,
          adults: parseInt(formData.adults) || 1,
          children: parseInt(formData.children) || 0,
          totalGuests: parseInt(formData.totalGuests) || 1,
          numberOfDays: parseInt(formData.numberOfDays) || 1,
          rentPerDay: parseFloat(formData.rentPerDay) || 0,
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob()
          const url = globalThis.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `bill-${Date.now()}.pdf`
          document.body.appendChild(a)
          a.click()
          globalThis.URL.revokeObjectURL(url)
          a.remove()
          toast.success('Bill generated successfully!')
          router.push('/dashboard/bookings')
        } else {
          const data = await response.json()
          toast.error(data.error || 'Failed to generate bill')
        }
      } else {
        const text = await response.text()
        let errorMessage = 'Failed to generate bill'
        try {
          const data = JSON.parse(text)
          errorMessage = data.error || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        toast.error(errorMessage)
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-6 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            🧾 Generate Bill
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-1 font-medium">Create independent bills with no constraints - completely isolated from booking system</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors duration-150 font-semibold min-h-[44px] text-sm sm:text-base"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Bill Information Section */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
              <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">📄</span>
                  Bill Information
                </h3>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">
                      🔢 Visitor Registration Number <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.visitorRegistrationNumber}
                      readOnly
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] bg-gray-100 font-medium"
                      placeholder="Auto-generated"
                    />
                    <p className="text-xs text-[#64748B] mt-2 font-medium">
                      🤖 Auto-generated serial number
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">
                      🧾 Bill Number <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.billNumber}
                      onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter bill number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">
                      📅 Bill Date <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.billDate}
                      onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information Section */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
              <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">👤</span>
                  Guest Information
                </h3>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#111827] mb-3">
                      👤 Guest Name <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#111827] mb-3">📍 Address</label>
                    <textarea
                      value={formData.guestAddress}
                      onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white resize-none"
                      rows={3}
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🗺️ State/Region</label>
                    <input
                      type="text"
                      value={formData.guestState}
                      onChange={(e) => setFormData({ ...formData, guestState: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter state/region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🌍 Nationality</label>
                    <input
                      type="text"
                      value={formData.guestNationality}
                      onChange={(e) => setFormData({ ...formData, guestNationality: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="e.g., Indian"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🆔 ID Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="DL">Driving License</option>
                      <option value="VOTER_ID">Voter ID</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🔢 ID Number</label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter ID number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">📱 Mobile Number</label>
                    <input
                      type="text"
                      value={formData.guestMobile}
                      onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {formData.showGst && (
                    <div>
                      <label className="block text-sm font-semibold text-[#111827] mb-3">🧾 GST of Guest</label>
                      <input
                        type="text"
                        value={formData.guestGstNumber}
                        onChange={(e) => setFormData({ ...formData, guestGstNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="Enter GST number"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🔢 State Code</label>
                    <input
                      type="text"
                      value={formData.guestStateCode}
                      readOnly
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] bg-gray-100 font-medium"
                      placeholder="Auto-filled"
                    />
                    <p className="text-xs text-[#64748B] mt-2 font-medium">
                      🤖 Auto-filled based on state
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">👥 Adults</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">👶 Children</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">👨‍👩‍👧‍👦 Total Guests</label>
                    <input
                      type="number"
                      value={formData.totalGuests}
                      readOnly
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] bg-gray-100 font-medium"
                    />
                    <p className="text-xs text-[#64748B] mt-2 font-medium">
                      🤖 Auto-calculated (Adults + Children)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
              <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">🏢</span>
                  Company Information
                </h3>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🏢 Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🆔 Company Code/ID</label>
                    <input
                      type="text"
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter company code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🏬 Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">👔 Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter designation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">☎️ Business Phone Number</label>
                    <input
                      type="text"
                      value={formData.businessPhoneNumber}
                      onChange={(e) => setFormData({ ...formData, businessPhoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="Enter business phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Room & Stay Information Section */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
              <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">🏨</span>
                  Room & Stay Information
                </h3>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🏠 Particulars (Room Selection)</label>
                    <select
                      value={formData.particulars}
                      onChange={(e) => handleParticularsChange(e.target.value)}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      disabled={loadingRooms}
                    >
                      <option value="">Select a room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.roomNumber} - {room.roomType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🚪 Room Number</label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      readOnly
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] bg-gray-100 font-medium"
                      placeholder="Auto-filled from room selection"
                    />
                    <p className="text-xs text-[#64748B] mt-2 font-medium">
                      🤖 Auto-filled when room is selected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">💰 Rent Per Day</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.rentPerDay}
                        onChange={(e) => setFormData({ ...formData, rentPerDay: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">📅 Number of Days</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.numberOfDays}
                      onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">📥 Check In Date</label>
                    <input
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">📤 Check Out Date</label>
                    <input
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charges Section */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
              <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">💰</span>
                  Charges & Payment
                </h3>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">
                      🏨 Room Charges <span className="text-[#8E0E1C]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.roomCharges}
                        onChange={(e) => setFormData({ ...formData, roomCharges: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">💵 Tariff</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tariff}
                        onChange={(e) => setFormData({ ...formData, tariff: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🍽️ Food Charges</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.foodCharges}
                        onChange={(e) => setFormData({ ...formData, foodCharges: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">👥 Additional Guests</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.additionalGuests}
                      onChange={(e) => setFormData({ ...formData, additionalGuests: e.target.value })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">💰 Additional Guest Charges (per guest)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.additionalGuestCharges}
                        onChange={(e) => setFormData({ ...formData, additionalGuestCharges: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">💳 Advance Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.advanceAmount}
                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🏷️ Discount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">🔄 Round Off</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#111827] font-bold text-lg">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.roundOff}
                        onChange={(e) => setFormData({ ...formData, roundOff: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-3">💳 Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'CASH' | 'ONLINE' })}
                      className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>

                {/* GST Section */}
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#CBD5E1]">
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1]">
                      <input
                        type="checkbox"
                        id="showGst"
                        checked={formData.showGst}
                        onChange={(e) => setFormData({ ...formData, showGst: e.target.checked })}
                        className="w-5 h-5 text-[#8E0E1C] border-[#CBD5E1] rounded focus:ring-[#8E0E1C] cursor-pointer"
                      />
                      <label htmlFor="showGst" className="ml-3 text-sm font-semibold text-[#111827] cursor-pointer">
                        🧾 Show GST on Bill (Default: Unchecked)
                      </label>
                    </div>
                    <div className="flex items-center p-4 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1]">
                      <input
                        type="checkbox"
                        id="gstEnabled"
                        checked={formData.gstEnabled}
                        onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                        className="w-5 h-5 text-[#8E0E1C] border-[#CBD5E1] rounded focus:ring-[#8E0E1C] cursor-pointer"
                      />
                      <label htmlFor="gstEnabled" className="ml-3 text-sm font-semibold text-[#111827] cursor-pointer">
                        ➕ Include GST in Calculation
                      </label>
                    </div>
                  </div>

                  {formData.showGst && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-[#111827] mb-3">📊 GST Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.gstPercent}
                          onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                          className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#111827] mb-3">🆔 GST Number</label>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                          placeholder="Enter GST number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#8E0E1C] text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Bill...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-xl sm:text-2xl">📄</span>
                    <span>Generate Bill</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-6 sm:p-8 sticky top-6">
            <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-6 flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">📊</span>
              Bill Summary
            </h3>

            <div className="space-y-4 sm:space-y-5">
              <div className="bg-[#F8FAFC] rounded-lg p-4 sm:p-6 border border-[#CBD5E1]">
                  <div className="flex justify-between items-center mb-3 gap-2">
                  <span className="text-sm font-semibold text-[#64748B] flex-shrink-0">🏨 Room Charges</span>
                  <span className="text-sm font-bold text-[#111827] break-words text-right min-w-0">
                    ₹{calculations.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {calculations.tariff > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-[#64748B]">💵 Tariff</span>
                    <span className="text-sm font-bold text-[#111827]">
                      ₹{calculations.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.foodCharges > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-[#64748B]">🍽️ Food Charges</span>
                    <span className="text-sm font-bold text-[#111827]">
                      ₹{calculations.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.additionalGuestsTotal > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-[#64748B]">
                      👥 Additional Guests ({calculations.additionalGuests} × ₹{calculations.additionalGuestCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                    <span className="text-sm font-bold text-[#111827]">
                      ₹{calculations.additionalGuestsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.discount > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-[#64748B]">🏷️ Discount</span>
                    <span className="text-sm font-bold text-[#8E0E1C]">
                      - ₹{calculations.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-[#CBD5E1]">
                  <span className="text-base font-bold text-[#111827]">Subtotal</span>
                  <span className="text-base font-bold text-[#111827]">
                    ₹{calculations.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {(formData.gstEnabled && formData.showGst) && (
                <div className="bg-[#F8FAFC] rounded-lg p-4 sm:p-6 border border-[#CBD5E1]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#64748B]">
                      🧾 GST ({formData.gstPercent}%)
                    </span>
                    <span className="text-sm font-bold text-[#111827]">
                      ₹{calculations.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {(calculations.advance > 0 || calculations.roundOff !== 0) && (
                <div className="bg-[#F8FAFC] rounded-lg p-4 sm:p-6 border border-[#CBD5E1]">
                  {calculations.advance > 0 && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-[#64748B]">💳 Advance Paid</span>
                      <span className="text-sm font-bold text-[#8E0E1C]">
                        - ₹{calculations.advance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {calculations.roundOff !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-[#64748B]">🔄 Round Off</span>
                      <span className={`text-sm font-bold ${calculations.roundOff >= 0 ? 'text-[#111827]' : 'text-[#8E0E1C]'}`}>
                        {calculations.roundOff >= 0 ? '+' : ''}₹{Math.abs(calculations.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#8E0E1C] rounded-lg p-4 sm:p-6 border border-[#8E0E1C]">
                <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-white flex-shrink-0">💰 Total Amount</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words text-right min-w-0">
                    ₹{calculations.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/30">
                  <span className="text-sm text-white/90 font-medium">
                    💳 Payment Mode: <span className="font-bold text-white">{formData.paymentMode}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
