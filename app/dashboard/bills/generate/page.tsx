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
    gstEnabled: false,
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
    const advance = Number.parseFloat(formData.advanceAmount) || 0
    const roundOff = Number.parseFloat(formData.roundOff) || 0
    const gstPercent = Number.parseFloat(formData.gstPercent) || 0
    
    const baseAmount = roomCharges + tariff + foodCharges
    const gstAmount = formData.gstEnabled ? (baseAmount * gstPercent) / 100 : 0
    const totalAmount = baseAmount + gstAmount - advance + roundOff

    return {
      roomCharges,
      tariff,
      foodCharges,
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
          gstPercent: parseFloat(formData.gstPercent) || 5,
          advanceAmount: calculations.advance,
          roundOff: calculations.roundOff,
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
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Generate Bill</h2>
          <p className="text-gray-600 mt-1">Create a new invoice or backdated bill</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Bill Information Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📄</span>
                  Bill Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking ID <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bookingId}
                      onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Leave empty for manual bill"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bill Number
                    </label>
                    <input
                      type="text"
                      value={formData.billNumber}
                      onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Visitor's Register Sr. No."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bill Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.billDate}
                      onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Guest Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Address</label>
                    <textarea
                      value={formData.guestAddress}
                      onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      rows={2}
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
                    <input
                      type="text"
                      value={formData.guestState}
                      onChange={(e) => setFormData({ ...formData, guestState: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter state/region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <input
                      type="text"
                      value={formData.guestNationality}
                      onChange={(e) => setFormData({ ...formData, guestNationality: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="e.g., Indian"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <input
                      type="text"
                      value={formData.guestMobile}
                      onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest GST Number</label>
                    <input
                      type="text"
                      value={formData.guestGstNumber}
                      onChange={(e) => setFormData({ ...formData, guestGstNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State Code</label>
                    <input
                      type="text"
                      value={formData.guestStateCode}
                      onChange={(e) => setFormData({ ...formData, guestStateCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter state code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Code/ID</label>
                    <input
                      type="text"
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter company code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charges Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  Charges & Payment
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Charges <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.roomCharges}
                        onChange={(e) => setFormData({ ...formData, roomCharges: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tariff</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tariff}
                        onChange={(e) => setFormData({ ...formData, tariff: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Food Charges</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.foodCharges}
                        onChange={(e) => setFormData({ ...formData, foodCharges: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.advanceAmount}
                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Round Off</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.roundOff}
                        onChange={(e) => setFormData({ ...formData, roundOff: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'CASH' | 'ONLINE' })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>

                {/* GST Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="gstEnabled"
                      checked={formData.gstEnabled}
                      onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="gstEnabled" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
                      Include GST
                    </label>
                  </div>

                  {formData.gstEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.gstPercent}
                          onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Generating Bill...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>📄</span>
                    Generate Bill
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg border border-indigo-200 p-6 sticky top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Bill Summary
            </h3>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Room Charges</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{calculations.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {calculations.tariff > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Tariff</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{calculations.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculations.foodCharges > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Food Charges</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{calculations.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{calculations.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {formData.gstEnabled && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      GST ({formData.gstPercent}%)
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ₹{calculations.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {(calculations.advance > 0 || calculations.roundOff !== 0) && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  {calculations.advance > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Advance Paid</span>
                      <span className="text-sm font-semibold text-red-600">
                        - ₹{calculations.advance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {calculations.roundOff !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Round Off</span>
                      <span className={`text-sm font-semibold ${calculations.roundOff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculations.roundOff >= 0 ? '+' : ''}₹{Math.abs(calculations.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-5 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-white">
                    ₹{calculations.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-indigo-400">
                  <span className="text-xs text-indigo-100">
                    Payment Mode: <span className="font-semibold">{formData.paymentMode}</span>
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
