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
    <div className="space-y-6">
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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Room Management</h2>
        <Link
          href="/dashboard/rooms/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add Room
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {room.roomNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {room.roomType.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      room.status === 'AVAILABLE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(room.id, room.roomNumber)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
