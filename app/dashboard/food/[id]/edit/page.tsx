'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface FoodItem {
  id: string
  name: string
  category: string
  price: number
  gstPercent: number
  enabled: boolean
}

export default function EditFoodPage() {
  const router = useRouter()
  const params = useParams()
  const foodId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    gstPercent: '0',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchFoodItem = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/food', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const item = data.find((item: FoodItem) => item.id === foodId)
        if (item) {
          setFormData({
            name: item.name,
            category: item.category,
            price: item.price.toString(),
            gstPercent: item.gstPercent.toString(),
          })
        } else {
          setError('Food item not found')
        }
      }
    } catch {
      setError('Failed to load food item')
    } finally {
      setLoading(false)
    }
  }, [foodId])

  useEffect(() => {
    if (foodId) {
      fetchFoodItem()
    }
  }, [foodId, fetchFoodItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/food/${foodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          gstPercent: parseFloat(formData.gstPercent),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update food item')
        setSaving(false)
        return
      }

      toast.success('Food item updated successfully!')
      router.push('/dashboard/settings/food')
    } catch {
      setError('An error occurred. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🍽️</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading food item...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
            ✏️ Edit Food Item
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-medium">Update food item details</p>
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
            <span className="text-2xl sm:text-3xl">🍽️</span>
            Food Item Information
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
              <label htmlFor="name" className="block text-sm font-semibold text-[#111827] mb-3">
                🍽️ Item Name <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="e.g., Biryani, Pizza"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-[#111827] mb-3">
                📂 Category <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="category"
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="e.g., Main Course, Beverages"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-[#111827] mb-3">
                💰 Price (₹) <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label htmlFor="gstPercent" className="block text-sm font-semibold text-[#111827] mb-3">
                🧾 GST Percentage <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="gstPercent"
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="e.g., 5, 12, 18"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Changes</span>
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
