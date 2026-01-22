'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('userRole', data.user?.role || 'MANAGER')
      localStorage.setItem('userName', data.user?.name || '')
      document.cookie = `token=${data.token}; path=/; max-age=604800`
      router.push('/dashboard')
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-[#CBD5E1] p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#8E0E1C] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏨</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2">
            Hotel Management
          </h1>
          <p className="text-[#64748B] font-medium">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#111827] mb-2">
              📧 Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] text-[#111827] placeholder:text-[#94A3B8] font-medium bg-white"
              placeholder="manager@hotel.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#111827] mb-2">
              🔒 Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] text-[#111827] placeholder:text-[#94A3B8] font-medium bg-white"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8E0E1C] text-white py-3 rounded-lg font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[#8E0E1C] hover:opacity-80 text-sm font-medium flex items-center justify-center gap-2 transition-opacity duration-150">
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
