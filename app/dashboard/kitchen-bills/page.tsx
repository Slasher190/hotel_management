'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Pagination from '@/app/components/Pagination'

interface ActiveKitchenBill {
  id: string
  guestName: string
  roomNumber: string
  totalFoodOrders: number
  totalAmount: number
  status: string
  createdAt: string
}

export default function GlobalKitchenBillsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [historyBills, setHistoryBills] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const itemsPerPage = 10

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = [2024, 2025, 2026, 2027]

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const url = `/api/kitchen-bills?type=history&month=${selectedMonth}&year=${selectedYear}&page=${currentPage}&limit=${itemsPerPage}`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Check if API returns pagination data
          if (data.bills) {
            setHistoryBills(data.bills)
            setTotalPages(data.pagination?.totalPages || 1)
            setTotalRevenue(data.totalRevenue || 0)
          } else {
            // Fallback for old API format
            setHistoryBills(data)
            const total = data.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0)
            setTotalRevenue(total)
            setTotalPages(Math.ceil(data.length / itemsPerPage))
          }
        } else {
          toast.error('Failed to fetch kitchen bills')
        }
      } catch (error) {
        console.error('Error fetching kitchen bills:', error)
        toast.error('An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [router, selectedMonth, selectedYear, currentPage])

  // Reset to page 1 when month/year changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedYear])

  if (loading && historyBills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-lg text-gray-600">Loading kitchen bills...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Bills History</h1>
          <p className="text-gray-600 mt-1">View finalized kitchen bills by month</p>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-[#8E0E1C] to-[#6B0A15] rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-xs text-red-200">{months[selectedMonth]} {selectedYear}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-red-100 mt-1">{historyBills.length} bills</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
        <span className="text-sm font-medium text-gray-700">Filter by period:</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {historyBills.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-medium text-gray-900">No Finalized Bills Found</h3>
            <p className="text-gray-500 mt-1">
              No master kitchen bills found for {months[selectedMonth]} {selectedYear}.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.guestName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.roomNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-600">
                        ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/bookings/${bill.bookingId}/kitchen-bills`}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                        >
                          View Bill
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
