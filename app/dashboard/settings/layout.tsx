'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const settingsNav = [
  { href: '/dashboard/settings', label: '🏨 Hotel Info', id: 'hotel' },
  { href: '/dashboard/settings/room-types', label: '🏷️ Room Types', id: 'roomTypes' },
  { href: '/dashboard/settings/rooms', label: '🏨 Rooms', id: 'rooms' },
  { href: '/dashboard/settings/food', label: '🍽️ Food Items', id: 'food' },
  { href: '/dashboard/settings/password', label: '🔒 Password', id: 'password' },
]

export default function SettingsLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-6">
        <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">
          ⚙️ Settings
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] font-medium">Manage your hotel settings, rooms, food items, and account</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-2">
        <div className="flex gap-2 flex-wrap">
          {settingsNav.map((nav) => {
            const isActive = pathname === nav.href || (nav.href !== '/dashboard/settings' && pathname?.startsWith(nav.href))
            return (
              <Link
                key={nav.id}
                href={nav.href}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-150 flex items-center gap-2 text-sm sm:text-base min-h-[44px] ${
                  isActive
                    ? 'bg-[#8E0E1C] text-white'
                    : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                }`}
              >
                <span>{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
