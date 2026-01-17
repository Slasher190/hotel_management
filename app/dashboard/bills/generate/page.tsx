'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
          roomCharges: parseFloat(formData.roomCharges) || 0,
          tariff: parseFloat(formData.tariff) || 0,
          foodCharges: parseFloat(formData.foodCharges) || 0,
          gstPercent: parseFloat(formData.gstPercent) || 5,
          advanceAmount: parseFloat(formData.advanceAmount) || 0,
          roundOff: parseFloat(formData.roundOff) || 0,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bill-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        globalThis.URL.revokeObjectURL(url)
        a.remove()
        router.push('/dashboard/bookings')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to generate bill')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generate Bill</h2>

      <div className="bg-white rounded-xl shadow-md p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID (Optional)</label>
              <input
                type="text"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                placeholder="Leave empty for manual bill"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                placeholder="Visitor's Register Sr. No."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Date *</label>
              <input
                type="date"
                required
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
              <input
                type="text"
                required
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Address</label>
              <textarea
                value={formData.guestAddress}
                onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
              <input
                type="text"
                value={formData.guestState}
                onChange={(e) => setFormData({ ...formData, guestState: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
              <input
                type="text"
                value={formData.guestNationality}
                onChange={(e) => setFormData({ ...formData, guestNationality: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest GST Number</label>
              <input
                type="text"
                value={formData.guestGstNumber}
                onChange={(e) => setFormData({ ...formData, guestGstNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State Code</label>
              <input
                type="text"
                value={formData.guestStateCode}
                onChange={(e) => setFormData({ ...formData, guestStateCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <input
                type="text"
                value={formData.guestMobile}
                onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Code/ID</label>
              <input
                type="text"
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Charges (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.roomCharges}
                onChange={(e) => setFormData({ ...formData, roomCharges: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tariff (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tariff}
                onChange={(e) => setFormData({ ...formData, tariff: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Charges (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.foodCharges}
                onChange={(e) => setFormData({ ...formData, foodCharges: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Round Off (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.roundOff}
                onChange={(e) => setFormData({ ...formData, roundOff: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'CASH' | 'ONLINE' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="gstEnabled"
                checked={formData.gstEnabled}
                onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="gstEnabled" className="text-sm font-medium text-gray-900 cursor-pointer">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Bill'}
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
