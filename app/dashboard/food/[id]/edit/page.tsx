'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

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
      // Error handled by console.error
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

      router.push('/dashboard/food')
    } catch {
      setError('An error occurred. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading food item...</div>
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Edit Food Item</h2>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="e.g., Biryani, Pizza"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              id="category"
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="e.g., Main Course, Beverages"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) *
            </label>
            <input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Enter price"
            />
          </div>

          <div>
            <label htmlFor="gstPercent" className="block text-sm font-medium text-gray-700 mb-2">
              GST Percentage *
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="e.g., 5, 12, 18"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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
