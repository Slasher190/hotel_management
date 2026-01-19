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
    <div className="space-y-8 fade-in">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          ⚙️ Settings
        </h2>
        <p className="text-slate-600 font-medium">Manage your hotel settings, rooms, food items, and account</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2">
        <div className="flex gap-2 flex-wrap">
          {settingsNav.map((nav) => {
            const isActive = pathname === nav.href || (nav.href !== '/dashboard/settings' && pathname?.startsWith(nav.href))
            return (
              <Link
                key={nav.id}
                href={nav.href}
                className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
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
