'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'
import { useUserRole } from '@/lib/useUserRole'

interface FoodItem {
  id: string
  name: string
  category: string
  price: number
  gstPercent: number
  enabled: boolean
}

export default function FoodItemsPage() {
  const { canDelete } = useUserRole()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; foodId: string | null; foodName: string }>({
    isOpen: false,
    foodId: null,
    foodName: '',
  })

  useEffect(() => {
    fetchFoodItems()
  }, [])

  const fetchFoodItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/food', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFoodItems(data)
      }
    } catch (error) {
      console.error('Error fetching food items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/food/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (response.ok) {
        toast.success(`Food item ${enabled ? 'disabled' : 'enabled'} successfully!`)
        fetchFoodItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to toggle food item status')
      }
    } catch (error) {
      console.error('Error toggling food item:', error)
      toast.error('An error occurred while toggling food item status')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🍽️</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading food items...</div>
      </div>
    )
  }

  const confirmDeleteFood = async () => {
    if (!deleteModal.foodId) return
    if (!canDelete) {
      toast.error('You do not have permission to delete food items')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/food/${deleteModal.foodId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        toast.success('Food item deleted successfully!')
        fetchFoodItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete food item')
      }
    } catch {
      toast.error('An error occurred while deleting food item')
    } finally {
      setDeleteModal({ isOpen: false, foodId: null, foodName: '' })
    }
  }

  return (
    <>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, foodId: null, foodName: '' })}
        onConfirm={confirmDeleteFood}
        title="Delete Food Item"
        message={`Are you sure you want to delete "${deleteModal.foodName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-2">
              🍽️ Food Items Management
            </h3>
            <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage your restaurant menu items</p>
          </div>
          <Link
            href="/dashboard/food/new"
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span className="text-xl">➕</span>
            <span>Add Food Item</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🍽️ Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                    📂 Category
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    💰 Price
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
                    🧾 GST %
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    📊 Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#CBD5E1]">
                {foodItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{item.name}</div>
                      <div className="text-xs text-[#64748B] sm:hidden">{item.category}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm font-medium text-[#111827]">{item.category}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">
                        ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm font-medium text-[#64748B]">{item.gstPercent}%</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(item.id, item.enabled)}
                        className={`px-2 py-1 text-xs font-bold rounded-full transition-opacity duration-150 ${item.enabled
                            ? 'bg-[#64748B] text-white'
                            : 'bg-[#CBD5E1] text-[#111827]'
                          }`}
                      >
                        {item.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/food/${item.id}/edit`}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] inline-flex items-center"
                        >
                          ✏️ Edit
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, foodId: item.id, foodName: item.name })}
                            className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px] inline-flex items-center"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {foodItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <div className="text-lg font-semibold text-[#64748B]">No food items found</div>
              <div className="text-sm text-[#94A3B8] mt-2">Add your first food item to get started</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
