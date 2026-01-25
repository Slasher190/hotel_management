'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'
import { useUserRole } from '@/lib/useUserRole'

interface Room {
  id: string
  roomNumber: string
  roomType: {
    name: string
  }
  status: 'AVAILABLE' | 'OCCUPIED'
}

export default function RoomsManagementPage() {
  const { canDelete } = useUserRole()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roomId: string | null; roomNumber: string }>({
    isOpen: false,
    roomId: null,
    roomNumber: '',
  })

  useEffect(() => {
    fetchRooms()
  }, [])

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
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, roomNumber: string) => {
    setDeleteModal({ isOpen: true, roomId: id, roomNumber })
  }

  const confirmDelete = async () => {
    if (!deleteModal.roomId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/rooms/${deleteModal.roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchRooms()
        toast.success('Room deleted successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete room')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('An error occurred while deleting the room')
    } finally {
      setDeleteModal({ isOpen: false, roomId: null, roomNumber: '' })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏨</div>
        <div className="text-lg font-semibold text-[#64748B]">Loading rooms...</div>
      </div>
    )
  }

  return (
    <>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roomId: null, roomNumber: '' })}
        onConfirm={confirmDelete}
        title="Delete Room"
        message={`Are you sure you want to delete room "${deleteModal.roomNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-2">
              🏨 Room Management
            </h3>
            <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage all your hotel rooms and their availability</p>
          </div>
          <Link
            href="/dashboard/rooms/new"
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <span className="text-xl">➕</span>
            <span>Add Room</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#CBD5E1]">
              <thead className="bg-[#8E0E1C]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🏨 Room Number
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    🏷️ Type
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
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#111827]">{room.roomNumber}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#111827]">{room.roomType.name}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${room.status === 'AVAILABLE'
                            ? 'bg-[#64748B] text-white'
                            : 'bg-[#8E0E1C] text-white'
                          }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(room.id, room.roomNumber)}
                          className="px-3 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-semibold text-xs min-h-[44px]"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rooms.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏨</div>
              <div className="text-lg font-semibold text-[#64748B]">No rooms found</div>
              <div className="text-sm text-[#94A3B8] mt-2">Add your first room to get started</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
