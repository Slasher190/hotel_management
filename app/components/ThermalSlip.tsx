import React from 'react'

interface ThermalSlipItem {
    id: string
    name: string
    quantity: number
    amount: number
}

interface ThermalSlipProps {
    lotNumber: string
    dateTime: string
    roomNumber: string
    guestName: string
    attendantName?: string
    items: ThermalSlipItem[]
    subtotal: number
    discount?: number
    total: number
}

export default function ThermalSlip({
    lotNumber,
    dateTime,
    roomNumber,
    guestName,
    attendantName = 'Staff',
    items,
    subtotal,
    discount = 0,
    total,
}: ThermalSlipProps) {
    return (
        <div id="thermal-slip" className="hidden print:block fixed inset-0 bg-white z-[9999] p-0">
            {/* Thermal Receipt Container - 80mm width */}
            <div className="mx-auto bg-white p-4 w-[80mm] font-mono text-xs leading-tight">

                {/* Header */}
                <div className="text-center mb-3 border-b border-dashed border-gray-400 pb-2">
                    <div className="font-bold text-sm uppercase">HOTEL SAMRAT INN</div>
                    <div className="text-[10px] mt-1">Kitchen Bill</div>
                </div>

                {/* Bill Info */}
                <div className="mb-3 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                        <span>LOT NO.</span>
                        <span className="font-bold">{lotNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DATE & TIME</span>
                        <span>{dateTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ROOM NO.</span>
                        <span className="font-bold">{roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>GUEST</span>
                        <span>{guestName}</span>
                    </div>
                    {attendantName && (
                        <div className="flex justify-between">
                            <span>ATTENDANT</span>
                            <span>{attendantName}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 my-2"></div>

                {/* Items Table */}
                <div className="mb-3">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-gray-400">
                                <th className="text-left py-1 w-8">S.N</th>
                                <th className="text-left py-1">PARTICULARS</th>
                                <th className="text-center py-1 w-10">QTY</th>
                                <th className="text-right py-1 w-16">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className="border-b border-dotted border-gray-300">
                                    <td className="py-1.5">{index + 1}</td>
                                    <td className="py-1.5">{item.name}</td>
                                    <td className="text-center py-1.5">{item.quantity}</td>
                                    <td className="text-right py-1.5">₹{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 my-2"></div>

                {/* Billing Summary */}
                <div className="text-[10px] space-y-1 mb-3">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between">
                            <span>Complimentary / Discount</span>
                            <span>-₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-xs border-t border-gray-800 pt-1 mt-1">
                        <span>FINAL TOTAL</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-dashed border-gray-400 pt-2 mt-3 text-center text-[9px]">
                    <div className="font-bold">HOTEL SAMRAT INN</div>
                    <div className="mt-1">Thank you!</div>
                </div>
            </div>

            {/* Thermal Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #thermal-slip, #thermal-slip * {
                        visibility: visible;
                    }
                    #thermal-slip {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        display: block;
                    }
                }
            `}</style>
        </div>
    )
}
