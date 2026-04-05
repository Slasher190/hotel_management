'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/app/components/Modal'
import Pagination from '@/app/components/Pagination'
import ThermalSlip from '@/app/components/ThermalSlip'
import { useUserRole } from '@/lib/useUserRole'

import { getLocalDateISOString } from '@/lib/utils'

interface Staff {
    id: string
    name: string
    role: string
}

interface Expense {
    id: string
    staffId: string
    recipient: string
    description: string
    amount: number
    date: string
    createdAt: string
    user: {
        name: string
        email: string
    }
}

export default function ExpensesPage() {
    const { isStaff } = useUserRole()
    // Expense manager is open to all users
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [viewDescModal, setViewDescModal] = useState<{ isOpen: boolean; description: string }>({
        isOpen: false,
        description: '',
    })
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    })
    const [printExpense, setPrintExpense] = useState<Expense | null>(null)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [itemsPerPage] = useState(10)
    const [totalItems, setTotalItems] = useState(0)

    const [formData, setFormData] = useState({
        staffId: '',
        recipient: '',
        description: '',
        amount: '',
        date: getLocalDateISOString(),
    })

    // Fetch initial data
    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const headers = { Authorization: `Bearer ${token}` }

            const [expensesRes, staffRes] = await Promise.all([
                fetch(`/api/expenses?page=${currentPage}&limit=${itemsPerPage}`, { headers }),
                fetch('/api/staff', { headers }),
            ])

            const [expensesData, staffData] = await Promise.all([
                expensesRes.json(),
                staffRes.json(),
            ])

            if (expensesRes.ok) {
                setExpenses(expensesData.expenses || [])
                setTotalPages(expensesData.pagination?.pages || 1)
                setTotalItems(expensesData.pagination?.total || 0)
            }
            if (staffRes.ok) {
                const staffOnly = (staffData as Staff[]).filter(s => s.role === 'STAFF')
                setStaffList(staffOnly)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [currentPage])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.staffId || !formData.recipient || !formData.amount || !formData.description) {
            toast.error('All fields are required')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setShowAddModal(false)
                setFormData({
                    staffId: '',
                    recipient: '',
                    description: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                })
                fetchData()
                toast.success('Expense added successfully')
            } else {
                toast.error('Failed to add expense')
            }
        } catch (error) {
            console.error('Error adding expense:', error)
            toast.error('An error occurred')
        }
    }

    const handleDelete = async (id: string) => {
        setDeleteModal({ isOpen: true, id })
    }

    const confirmDelete = async () => {
        if (!deleteModal.id) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/expenses/${deleteModal.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                setExpenses(expenses.filter((e) => e.id !== deleteModal.id))
                toast.success('Expense deleted')
                // Refresh to handle pagination updates if needed
                fetchData()
            } else {
                toast.error('Failed to delete expense')
            }
        } catch (error) {
            console.error('Error deleting expense:', error)
            toast.error('An error occurred')
        } finally {
            setDeleteModal({ isOpen: false, id: null })
        }
    }

    const handlePrint = (expense: Expense, index: number) => {
        // Calculate serial number: Total - (Offset + Index)
        // This ensures the newest item (Top of Page 1) has the highest number (e.g. 100),
        // and the oldest item (Bottom of Last Page) has 1.
        // Offset = (currentPage - 1) * itemsPerPage

        const offset = (currentPage - 1) * itemsPerPage
        // Logic: If Total is 100. Page 1, Item 0. 100 - (0 + 0) = 100.
        // Page 1, Item 1. 100 - (0 + 1) = 99.
        // We use Math.max(1, ...) to ensure it never goes below 1 for any reason.
        const serialNumber = Math.max(1, totalItems - (offset + index))

        const printData = {
            ...expense,
            serialNumber: `EXP-${serialNumber.toString().padStart(4, '0')}`
        }

        setPrintExpense(printData as any) // Type assertion
        setTimeout(() => {
            window.print()
        }, 100)
    }

    if (loading) return <div className="text-center py-10">Loading...</div>

    return (
        <div className="space-y-6">
            {/* Thermal Print Component */}
            {printExpense && (
                <ThermalSlip
                    lotNumber={(printExpense as any).serialNumber || `EXP-${printExpense.id.slice(-6).toUpperCase()}`}
                    dateTime={new Date(printExpense.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                    guestLabel="PAID TO"
                    guestName={printExpense.recipient}
                    attendantName={printExpense.user.name}
                    items={[{
                        id: printExpense.id,
                        name: printExpense.description,
                        quantity: 1,
                        amount: printExpense.amount
                    }]}
                    subtotal={printExpense.amount}
                    total={printExpense.amount}
                    title="Expense Bill"
                />
            )}

            <div className="print:hidden space-y-6">
                <Modal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, id: null })}
                    onConfirm={confirmDelete}
                    title="Delete Expense"
                    message="Are you sure you want to delete this expense?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmButtonClass="bg-[#8E0E1C] hover:opacity-90"
                />

                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[#CBD5E1]">
                    <div>
                        <h2 className="text-2xl font-bold text-[#111827]">💸 Expense Manager</h2>
                        <p className="text-[#64748B]">Track and manage daily expenses</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 font-semibold"
                    >
                        ➕ Add Expense
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
                    <table className="min-w-full divide-y divide-[#CBD5E1]">
                        <thead className="bg-[#8E0E1C]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Staff</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">To</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CBD5E1] bg-white">
                            {expenses.map((expense, index) => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-[#111827]">
                                        {new Date(expense.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#111827]">{expense.user.name}</td>
                                    <td className="px-6 py-4 text-sm text-[#111827]">{expense.recipient}</td>
                                    <td className="px-6 py-4 text-sm text-[#64748B] max-w-xs">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{expense.description}</span>
                                            {expense.description.length > 20 && (
                                                <button
                                                    onClick={() => setViewDescModal({ isOpen: true, description: expense.description })}
                                                    className="text-sky-500 hover:text-sky-700 shrink-0 cursor-pointer"
                                                    title="View Full Description"
                                                >
                                                    See More
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#111827] text-right">
                                        ₹{expense.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handlePrint(expense, index)}
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Print"
                                        >
                                            🖨️
                                        </button>
                                        {!isStaff && (
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No expenses found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {expenses.length > 0 && (
                        <div className="border-t border-[#CBD5E1]">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {
                    showAddModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-lg p-5 max-w-lg w-full border border-[#CBD5E1]">
                                <h3 className="text-lg font-bold text-[#111827] mb-4">Add Expense</h3>
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#111827] mb-1">
                                                📅 Date <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#111827] mb-1">
                                                🧑‍💼 {isStaff ? 'Name' : <>Staff Name <span className="text-red-600">*</span></>}
                                            </label>
                                            <select
                                                required
                                                value={formData.staffId}
                                                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm"
                                            >
                                                <option value="">Select Staff</option>
                                                {staffList.map((staff) => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.name} ({staff.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                                            👤 To (Recipient) <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Paid to..."
                                            value={formData.recipient}
                                            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                                            📝 Description <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Expense details..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                                            💰 Amount <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-[#8E0E1C] text-white py-2 rounded-lg hover:opacity-90 font-semibold text-sm"
                                        >
                                            Save Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {
                    viewDescModal.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-lg p-5 max-w-md w-full border border-[#CBD5E1] flex flex-col max-h-[80vh]">
                                <h3 className="text-lg font-bold text-[#111827] mb-4">Expense Description</h3>
                                <div className="flex-1 overflow-y-auto mb-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">
                                    {viewDescModal.description}
                                </div>
                                <div className="flex justify-end pt-2 border-t border-[#CBD5E1]">
                                    <button
                                        onClick={() => setViewDescModal({ isOpen: false, description: '' })}
                                        className="px-6 py-2 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 font-semibold text-sm transition-opacity"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div >
    )
}
