'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function BillGeneratorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bookingId: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    guestName: '',
    guestAddress: '',
    guestState: '',
    guestNationality: 'indian',
    guestGstNumber: '',
    guestStateCode: '',
    guestMobile: '',
    companyName: '',
    companyCode: '',
    roomCharges: '',
    tariff: '',
    foodCharges: '0',
    additionalGuestCharges: '0',
    additionalGuests: '0',
    gstEnabled: false,
    showGst: false, // Default unchecked
    gstPercent: '5',
    gstNumber: '',
    advanceAmount: '0',
    roundOff: '0',
    paymentMode: 'CASH' as 'CASH' | 'ONLINE',
  })
  const [loading, setLoading] = useState(false)

  // Calculate totals in real-time
  const calculations = useMemo(() => {
    const roomCharges = Number.parseFloat(formData.roomCharges) || 0
    const tariff = Number.parseFloat(formData.tariff) || 0
    const foodCharges = Number.parseFloat(formData.foodCharges) || 0
    const additionalGuestCharges = Number.parseFloat(formData.additionalGuestCharges) || 0
    const additionalGuests = Number.parseInt(formData.additionalGuests) || 0
    const additionalGuestsTotal = additionalGuestCharges * additionalGuests
    const advance = Number.parseFloat(formData.advanceAmount) || 0
    const roundOff = Number.parseFloat(formData.roundOff) || 0
    const gstPercent = Number.parseFloat(formData.gstPercent) || 0
    
    const baseAmount = roomCharges + tariff + foodCharges + additionalGuestsTotal
    const gstAmount = (formData.gstEnabled && formData.showGst) ? (baseAmount * gstPercent) / 100 : 0
    const totalAmount = baseAmount + gstAmount - advance + roundOff

    return {
      roomCharges,
      tariff,
      foodCharges,
      additionalGuestCharges,
      additionalGuests,
      additionalGuestsTotal,
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
          gstPercent: parseFloat(formData.gstPercent) || 5,
          advanceAmount: calculations.advance,
          roundOff: calculations.roundOff,
          showGst: formData.showGst,
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
    <div className="max-w-7xl mx-auto space-y-8 pb-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🧾 Generate Bill
          </h2>
          <p className="text-slate-600 mt-1 font-medium">Create independent bills with no constraints - completely isolated from booking system</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Bill Information Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  Bill Information
                </h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      🆔 Booking ID <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bookingId}
                      onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Leave empty for standalone bill"
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      💡 All bills are saved in Bill History
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      🧾 Bill Number
                    </label>
                    <input
                      type="text"
                      value={formData.billNumber}
                      onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Visitor's Register Sr. No."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      📅 Bill Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.billDate}
                      onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-8 py-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">👤</span>
                  Guest Information
                </h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      👤 Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">📍 Guest Address</label>
                    <textarea
                      value={formData.guestAddress}
                      onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all resize-none"
                      rows={3}
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🗺️ State/Region</label>
                    <input
                      type="text"
                      value={formData.guestState}
                      onChange={(e) => setFormData({ ...formData, guestState: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter state/region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🌍 Nationality</label>
                    <input
                      type="text"
                      value={formData.guestNationality}
                      onChange={(e) => setFormData({ ...formData, guestNationality: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="e.g., Indian"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">📱 Mobile Number</label>
                    <input
                      type="text"
                      value={formData.guestMobile}
                      onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {formData.showGst && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">🧾 Guest GST Number</label>
                      <input
                        type="text"
                        value={formData.guestGstNumber}
                        onChange={(e) => setFormData({ ...formData, guestGstNumber: e.target.value })}
                        className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="Enter GST number"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🔢 State Code</label>
                    <input
                      type="text"
                      value={formData.guestStateCode}
                      onChange={(e) => setFormData({ ...formData, guestStateCode: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter state code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🏢 Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🆔 Company Code/ID</label>
                    <input
                      type="text"
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Enter company code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charges Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">💰</span>
                  Charges & Payment
                </h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      🏨 Room Charges <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.roomCharges}
                        onChange={(e) => setFormData({ ...formData, roomCharges: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">💵 Tariff</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tariff}
                        onChange={(e) => setFormData({ ...formData, tariff: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🍽️ Food Charges</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.foodCharges}
                        onChange={(e) => setFormData({ ...formData, foodCharges: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">👥 Additional Guests</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.additionalGuests}
                      onChange={(e) => setFormData({ ...formData, additionalGuests: e.target.value })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">💰 Additional Guest Charges (per guest)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.additionalGuestCharges}
                        onChange={(e) => setFormData({ ...formData, additionalGuestCharges: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">💳 Advance Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.advanceAmount}
                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">🔄 Round Off</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.roundOff}
                        onChange={(e) => setFormData({ ...formData, roundOff: e.target.value })}
                        className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">💳 Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'CASH' | 'ONLINE' })}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>

                {/* GST Section */}
                <div className="mt-8 pt-8 border-t-2 border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="showGst"
                        checked={formData.showGst}
                        onChange={(e) => setFormData({ ...formData, showGst: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="showGst" className="ml-3 text-sm font-semibold text-slate-900 cursor-pointer">
                        🧾 Show GST on Bill (Default: Unchecked)
                      </label>
                    </div>
                    <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="gstEnabled"
                        checked={formData.gstEnabled}
                        onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="gstEnabled" className="ml-3 text-sm font-semibold text-slate-900 cursor-pointer">
                        ➕ Include GST in Calculation
                      </label>
                    </div>
                  </div>

                  {formData.showGst && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">📊 GST Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.gstPercent}
                          onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                          className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">🆔 GST Number</label>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                          className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
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
                className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
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
                    <span className="text-2xl">📄</span>
                    <span>Generate Bill</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl border-2 border-indigo-200 p-8 sticky top-6 card-hover">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
              <span className="text-3xl">📊</span>
              Bill Summary
            </h3>

            <div className="space-y-5">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-600">🏨 Room Charges</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{calculations.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {calculations.tariff > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-600">💵 Tariff</span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{calculations.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.foodCharges > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-600">🍽️ Food Charges</span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{calculations.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.additionalGuestsTotal > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-600">
                      👥 Additional Guests ({calculations.additionalGuests} × ₹{calculations.additionalGuestCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{calculations.additionalGuestsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                  <span className="text-base font-bold text-slate-800">Subtotal</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{calculations.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {(formData.gstEnabled && formData.showGst) && (
                <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">
                      🧾 GST ({formData.gstPercent}%)
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      ₹{calculations.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {(calculations.advance > 0 || calculations.roundOff !== 0) && (
                <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-slate-200">
                  {calculations.advance > 0 && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-slate-600">💳 Advance Paid</span>
                      <span className="text-sm font-bold text-red-600">
                        - ₹{calculations.advance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {calculations.roundOff !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-600">🔄 Round Off</span>
                      <span className={`text-sm font-bold ${calculations.roundOff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculations.roundOff >= 0 ? '+' : ''}₹{Math.abs(calculations.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 shadow-2xl border-2 border-indigo-300">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-white">💰 Total Amount</span>
                  <span className="text-3xl font-bold text-white">
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
