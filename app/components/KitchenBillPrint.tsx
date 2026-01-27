import React from 'react'

interface KitchenBillItem {
    id: string
    name: string
    quantity?: number
    amount: number
    orderTime?: string
}

interface KitchenBillPrintProps {
    booking: {
        guestName: string
        room: {
            roomNumber: string
        }
    } | null
    items: KitchenBillItem[]
    subtotal: number
    complimentary: number
    total: number
    attendantName?: string
    checkInDate?: string
}

export default function KitchenBillPrint({
    booking,
    items,
    subtotal,
    complimentary,
    total,
    attendantName = 'Staff',
}: KitchenBillPrintProps) {
    const dateStr = new Date().toLocaleDateString('en-IN')
    const lotNo = `K-${Math.floor(Date.now() / 1000).toString().slice(-6)}`

    // Group items by date 
    const groupedItems: Record<string, KitchenBillItem[]> = {}
    let hasDates = false

    items.forEach(item => {
        if (item.orderTime) {
            hasDates = true
            const date = new Date(item.orderTime).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
            if (!groupedItems[date]) {
                groupedItems[date] = []
            }
            groupedItems[date].push(item)
        } else {
            if (!groupedItems['Items']) {
                groupedItems['Items'] = []
            }
            groupedItems['Items'].push(item)
        }
    })

    return (
        <div id="printable-kitchen-bill" className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 text-black font-serif text-sm leading-normal">
            {/* A4 Container */}
            <div className="mx-auto bg-white p-8 min-h-[297mm] w-[210mm] relative">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="font-bold text-3xl mb-2 uppercase tracking-wide">Hotel Samrat Inn</h1>
                    <p className="text-sm text-gray-600">Master Kitchen Bill Statement</p>
                </div>

                {/* Info Grid */}
                <div className="border border-gray-800 p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><span className="font-bold">Bill No:</span> {lotNo}</p>
                            <p><span className="font-bold">Date:</span> {dateStr}</p>
                            <p><span className="font-bold">Attendant:</span> {attendantName}</p>
                        </div>
                        <div className="text-right">
                            <p><span className="font-bold">Guest Name:</span> {booking?.guestName}</p>
                            <p><span className="font-bold">Room No:</span> {booking?.room.roomNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-800">
                                <th className="py-2 px-2 w-12 text-center border-r border-gray-400">S.N</th>
                                <th className="py-2 px-2 border-r border-gray-400">Item Description</th>
                                <th className="py-2 px-2 w-24 text-center border-r border-gray-400">Time</th>
                                <th className="py-2 px-2 w-16 text-center border-r border-gray-400">Qty</th>
                                <th className="py-2 px-2 w-24 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasDates ? (
                                // Standard View
                                items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="py-2 px-2 text-center border-r border-gray-300">{index + 1}</td>
                                        <td className="py-2 px-2 border-r border-gray-300">{item.name}</td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-600 border-r border-gray-300">
                                            {item.orderTime ? new Date(item.orderTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-2 px-2 text-center border-r border-gray-300">{item.quantity || '-'}</td>
                                        <td className="py-2 px-2 text-right">{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                // Grouped View
                                Object.entries(groupedItems).map(([date, groupItems]) => (
                                    <React.Fragment key={date}>
                                        <tr className="bg-gray-100 border-b border-gray-400">
                                            <td colSpan={5} className="py-2 px-4 font-bold text-center uppercase tracking-wider text-xs text-gray-700">
                                                Date: {date}
                                            </td>
                                        </tr>
                                        {groupItems.map((item, index) => (
                                            <tr key={item.id} className="border-b border-gray-200">
                                                <td className="py-2 px-2 text-center border-r border-gray-300">{index + 1}</td>
                                                <td className="py-2 px-2 border-r border-gray-300">{item.name}</td>
                                                <td className="py-2 px-2 text-center text-xs text-gray-600 border-r border-gray-300">
                                                    {item.orderTime ? new Date(item.orderTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-2 px-2 text-center border-r border-gray-300">{item.quantity || '-'}</td>
                                                <td className="py-2 px-2 text-right">{item.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end mt-8">
                    <div className="w-[80mm] space-y-2">
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{subtotal.toFixed(2)}</span>
                        </div>
                        {complimentary > 0 && (
                            <div className="flex justify-between border-b border-gray-300 pb-1 text-red-600">
                                <span className="font-semibold">Discount / Comp:</span>
                                <span>- {complimentary.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-xl font-bold">
                            <span>Total Amount:</span>
                            <span>{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-8 left-0 right-0 text-center text-gray-500 text-xs">
                    <p>This is a computer generated bill.</p>
                    <p>Thank you for dining with us!</p>
                </div>
            </div>

            {/* A4 Print Styles */}
            <style jsx global>{`
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            body * {
                visibility: hidden;
            }
            #printable-kitchen-bill, #printable-kitchen-bill * {
                visibility: visible;
            }
            #printable-kitchen-bill {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                min-height: 100vh;
                background: white;
                display: block; /* Ensure block display for A4 flow */
            }
        }
      `}</style>
        </div>
    )
}
