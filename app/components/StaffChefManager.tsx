'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import UserForm from './UserForm'
import Dialog from './Dialog'

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface StaffChefManagerProps {
    role: 'STAFF' | 'CHEF'
}

export default function StaffChefManager({ role }: StaffChefManagerProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/users?role=${role}`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            } else {
                toast.error('Failed to load users')
            }
        } catch (error) {
            toast.error('Error loading users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [role])

    const handleSubmit = async (data: any) => {
        setSubmitting(true)
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
            const method = editingUser ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (res.ok) {
                toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`)
                setIsModalOpen(false)
                setEditingUser(null)
                fetchUsers()
            } else {
                const errorData = await res.json()
                toast.error(errorData.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('User deleted successfully')
                fetchUsers()
            } else {
                toast.error('Failed to delete user')
            }
        } catch (error) {
            toast.error('Error deleting user')
        }
    }

    const openAddModal = () => {
        setEditingUser(null)
        setIsModalOpen(true)
    }

    const openEditModal = (user: User) => {
        setEditingUser(user)
        setIsModalOpen(true)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#111827]">{role === 'STAFF' ? 'Staff Members' : 'Chefs'}</h2>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg font-semibold hover:opacity-90"
                >
                    + Add {role === 'STAFF' ? 'Staff' : 'Chef'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white border border-[#CBD5E1] rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-[#CBD5E1]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-[#111827]">Name</th>
                                <th className="px-6 py-4 font-semibold text-[#111827]">Email</th>
                                <th className="px-6 py-4 font-semibold text-[#111827] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CBD5E1]">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No {role.toLowerCase()}s found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-[#111827] font-medium">{user.name}</td>
                                        <td className="px-6 py-4 text-[#64748B]">{user.email}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 
        Using simple modal overlay if generic Modal component usage is complex or different. 
        But assuming standard Modal usage.
      */}
            <Dialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? `Edit ${role === 'STAFF' ? 'Staff' : 'Chef'}` : `Add New ${role === 'STAFF' ? 'Staff' : 'Chef'}`}
            >
                <UserForm
                    role={role}
                    initialData={editingUser}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    loading={submitting}
                />
            </Dialog>
        </div>
    )
}
