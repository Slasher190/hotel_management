'use client'

import { useEffect } from 'react'

interface DialogProps {
    readonly isOpen: boolean
    readonly onClose: () => void
    readonly title: string
    readonly children: React.ReactNode
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    children,
}: DialogProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity duration-150"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog Panel */}
            <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 border border-[#CBD5E1] flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-[#CBD5E1]">
                    <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
