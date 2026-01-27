'use client'

import { useState, useEffect } from 'react'

interface UserFormProps {
    initialData?: any
    role: 'STAFF' | 'CHEF'
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export default function UserForm({ initialData, role, onSubmit, onCancel, loading }: UserFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '', // Don't pre-fill password
            })
        }
    }, [initialData])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({ ...formData, role })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                    Name <span className="text-[#8E0E1C]">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                    Email <span className="text-[#8E0E1C]">*</span>
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                    {initialData ? 'New Password (leave blank to keep current)' : 'Password'} {initialData ? '' : <span className="text-[#8E0E1C]">*</span>}
                </label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                    required={!initialData}
                    minLength={6}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-[#CBD5E1] text-[#64748B] rounded-lg font-semibold hover:bg-gray-50"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-[#8E0E1C] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    )
}
