'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'

interface RoomType {
  id: string
  name: string
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [newRoomType, setNewRoomType] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roomTypeId: string | null; roomTypeName: string }>({
    isOpen: false,
    roomTypeId: null,
    roomTypeName: '',
  })

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/room-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data)
      } else {
        console.error('Failed to fetch room types')
        toast.error('Failed to fetch room types')
      }
    } catch (error) {
      console.error('Error fetching room types:', error)
      toast.error('An error occurred while fetching room types')
    }
  }

  const handleAddRoomType = async () => {
    if (!newRoomType.trim()) {
      toast.error('Please enter a room type name')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/room-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomType.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setRoomTypes([...roomTypes, data])
        setNewRoomType('')
        toast.success('Room type added successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add room type')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleDeleteRoomType = async (id: string, name: string) => {
    setDeleteModal({ isOpen: true, roomTypeId: id, roomTypeName: name })
  }

  const confirmDeleteRoomType = async () => {
    if (!deleteModal.roomTypeId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/room-types/${deleteModal.roomTypeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setRoomTypes(roomTypes.filter((rt) => rt.id !== deleteModal.roomTypeId))
        toast.success('Room type deleted successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete room type')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: '' })
    }
  }

  return (
    <>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: '' })}
        onConfirm={confirmDeleteRoomType}
        title="Delete Room Type"
        message={`Are you sure you want to delete "${deleteModal.roomTypeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />

      <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
        <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🏷️</span>
            Room Types
          </h3>
        </div>
        <div className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                placeholder="Enter room type (e.g., AC, Non-AC, Deluxe, Single Bed)"
                className="flex-1 px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRoomType()
                  }
                }}
              />
              <button
                onClick={handleAddRoomType}
                className="px-6 py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold min-h-[44px]"
              >
                ➕ Add
              </button>
            </div>

            <div className="space-y-3">
              {roomTypes.map((roomType) => (
                <div
                  key={roomType.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1]"
                >
                  <span className="text-[#111827] font-bold text-base sm:text-lg">{roomType.name}</span>
                  <button
                    onClick={() => handleDeleteRoomType(roomType.id, roomType.name)}
                    className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-sm min-h-[44px] w-full sm:w-auto"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
              {roomTypes.length === 0 && (
                <div className="text-center py-8 text-[#64748B]">
                  <div className="text-4xl mb-2">🏷️</div>
                  <div>No room types added yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
