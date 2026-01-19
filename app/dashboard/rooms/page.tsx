'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'

interface Room {
  id: string
  roomNumber: string
  roomType: {
    name: string
  }
  status: 'AVAILABLE' | 'OCCUPIED'
}

export default function RoomsPage() {
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
    return <div className="text-center py-8">Loading rooms...</div>
  }

  return (
    <div className="space-y-8 fade-in">
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roomId: null, roomNumber: '' })}
        onConfirm={confirmDelete}
        title="Delete Room"
        message={`Are you sure you want to delete room "${deleteModal.roomNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🏨 Room Management
          </h2>
          <p className="text-slate-600 font-medium">Manage all your hotel rooms and their availability</p>
        </div>
        <Link
          href="/dashboard/rooms/new"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">➕</span>
          <span>Add Room</span>
        </Link>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                🏨 Room Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                🏷️ Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                📊 Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                ⚡ Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">{room.roomNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-700">{room.roomType.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${
                      room.status === 'AVAILABLE'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDelete(room.id, room.roomNumber)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rooms.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏨</div>
            <div className="text-lg font-semibold text-slate-500">No rooms found</div>
            <div className="text-sm text-slate-400 mt-2">Add your first room to get started</div>
          </div>
        )}
      </div>
    </div>
  )
}
