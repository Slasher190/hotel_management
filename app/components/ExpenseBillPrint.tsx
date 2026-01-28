import React from 'react'

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

interface ExpenseBillPrintProps {
    expense: Expense | null
}

export default function ExpenseBillPrint({ expense }: ExpenseBillPrintProps) {
    if (!expense) return null

    const dateStr = new Date(expense.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })

    // Generate a simple voucher number from ID or timestamp if not available
    const voucherNo = `EXP-${expense.id.slice(-6).toUpperCase()}`

    return (
        <div id="printable-expense-bill" className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 text-black font-serif text-sm leading-normal">
            {/* A4 Container */}
            <div className="mx-auto bg-white p-8 min-h-[297mm] w-[210mm] relative">

                {/* Header Section */}
                <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                    <h1 className="font-bold text-3xl mb-2 uppercase tracking-wide">Hotel Samrat Inn</h1>
                    <p className="text-sm text-gray-600">Expense Voucher</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <div className="mb-2">
                            <span className="font-bold w-24 inline-block">Voucher No:</span>
                            <span>{voucherNo}</span>
                        </div>
                        <div className="mb-2">
                            <span className="font-bold w-24 inline-block">Date:</span>
                            <span>{dateStr}</span>
                        </div>
                        <div className="mb-2">
                            <span className="font-bold w-24 inline-block">Staff:</span>
                            <span>{expense.user.name}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        {/* Placeholder for any right-aligned info if needed, or keep balanced */}
                    </div>
                </div>

                {/* Main Content Box */}
                <div className="border border-gray-800 p-6 min-h-[300px] flex flex-col">

                    <div className="flex mb-4">
                        <span className="font-bold w-32 text-lg">Paid To:</span>
                        <div className="flex-1 border-b border-dotted border-gray-400 text-lg px-2">
                            {expense.recipient}
                        </div>
                    </div>

                    <div className="flex mb-4">
                        <span className="font-bold w-32 text-lg">Sum of:</span>
                        <div className="flex-1 border-b border-dotted border-gray-400 text-lg px-2 font-bold">
                            ₹ {expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="flex mb-4 flex-1">
                        <span className="font-bold w-32 text-lg">On Account of:</span>
                        <div className="flex-1 border-b border-dotted border-gray-400 text-lg px-2 leading-8">
                            {expense.description}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end pt-16">
                        <div className="text-center w-40">
                            <div className="border-t border-black pt-2">
                                <p className="font-bold">Receiver's Signature</p>
                            </div>
                        </div>
                        <div className="text-center w-40">
                            <div className="border-t border-black pt-2">
                                <p className="font-bold">Manager's Signature</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="absolute bottom-8 left-0 right-0 text-center text-gray-500 text-xs">
                    <p>This is a computer generated voucher.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-expense-bill, #printable-expense-bill * {
                        visibility: visible;
                    }
                    #printable-expense-bill {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        min-height: 100vh;
                        background: white;
                        display: block;
                    }
                }
            `}</style>
        </div>
    )
}
