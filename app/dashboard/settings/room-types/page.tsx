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
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-8 py-5">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🏷️</span>
            Room Types
          </h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                placeholder="Enter room type (e.g., AC, Non-AC, Deluxe, Single Bed)"
                className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRoomType()
                  }
                }}
              />
              <button
                onClick={handleAddRoomType}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ➕ Add
              </button>
            </div>

            <div className="space-y-3">
              {roomTypes.map((roomType) => (
                <div
                  key={roomType.id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 hover:shadow-md transition-all"
                >
                  <span className="text-slate-900 font-bold text-lg">{roomType.name}</span>
                  <button
                    onClick={() => handleDeleteRoomType(roomType.id, roomType.name)}
                    className="px-5 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
              {roomTypes.length === 0 && (
                <div className="text-center py-8 text-slate-500">
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
