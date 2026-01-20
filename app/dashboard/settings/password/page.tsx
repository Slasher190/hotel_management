'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function PasswordResetPage() {
  const [mode, setMode] = useState<'old' | 'secret'>('old')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetWithOldPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Password updated successfully!')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResetWithSecret = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          secret,
          newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Password reset successfully!')
        setEmail('')
        setSecret('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to reset password')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#CBD5E1] overflow-hidden">
      <div className="bg-[#8E0E1C] px-6 sm:px-8 py-4 sm:py-5">
        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">🔒</span>
          Password Reset
        </h3>
      </div>
      <div className="p-6 sm:p-8">
        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMode('old')}
              className={`flex-1 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] ${
                mode === 'old'
                  ? 'bg-[#8E0E1C] text-white'
                  : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
            >
              🔑 Reset with Old Password
            </button>
            <button
              onClick={() => setMode('secret')}
              className={`flex-1 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-150 min-h-[44px] ${
                mode === 'secret'
                  ? 'bg-[#8E0E1C] text-white'
                  : 'bg-white text-[#111827] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
            >
              🔐 Reset with Secret (Forgotten Password)
            </button>
          </div>
        </div>

        {mode === 'old' ? (
          <form onSubmit={handleResetWithOldPassword} className="space-y-6">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-semibold text-[#111827] mb-3">
                🔑 Old Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="oldPassword"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label htmlFor="newPasswordOld" className="block text-sm font-semibold text-[#111827] mb-3">
                🔒 New Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="newPasswordOld"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPasswordOld" className="block text-sm font-semibold text-[#111827] mb-3">
                🔒 Confirm New Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="confirmPasswordOld"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 sm:px-8 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetWithSecret} className="space-y-6">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-semibold text-[#111827] mb-3">
                📧 Email <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="secretPassword" className="block text-sm font-semibold text-[#111827] mb-3">
                🔐 Secret Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="secretPassword"
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter secret password"
              />
              <p className="text-xs text-[#64748B] mt-2 font-medium">💡 Contact admin for the secret password</p>
            </div>
            <div>
              <label htmlFor="newPasswordSecret" className="block text-sm font-semibold text-[#111827] mb-3">
                🔒 New Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="newPasswordSecret"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPasswordSecret" className="block text-sm font-semibold text-[#111827] mb-3">
                🔒 Confirm New Password <span className="text-[#8E0E1C]">*</span>
              </label>
              <input
                id="confirmPasswordSecret"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#CBD5E1] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#8E0E1C] focus:border-[#8E0E1C] font-medium bg-white"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 sm:px-8 sm:py-4 bg-[#8E0E1C] text-white rounded-lg hover:opacity-90 transition-opacity duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
