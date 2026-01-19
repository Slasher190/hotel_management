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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden card-hover">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-8 py-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🔒</span>
          Password Reset
        </h3>
      </div>
      <div className="p-8">
        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setMode('old')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                mode === 'old'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
              }`}
            >
              🔑 Reset with Old Password
            </button>
            <button
              onClick={() => setMode('secret')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                mode === 'secret'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
              }`}
            >
              🔐 Reset with Secret (Forgotten Password)
            </button>
          </div>
        </div>

        {mode === 'old' ? (
          <form onSubmit={handleResetWithOldPassword} className="space-y-6">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-semibold text-slate-700 mb-3">
                🔑 Old Password <span className="text-red-500">*</span>
              </label>
              <input
                id="oldPassword"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label htmlFor="newPasswordOld" className="block text-sm font-semibold text-slate-700 mb-3">
                🔒 New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="newPasswordOld"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPasswordOld" className="block text-sm font-semibold text-slate-700 mb-3">
                🔒 Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPasswordOld"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
              <label htmlFor="resetEmail" className="block text-sm font-semibold text-slate-700 mb-3">
                📧 Email <span className="text-red-500">*</span>
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="secretPassword" className="block text-sm font-semibold text-slate-700 mb-3">
                🔐 Secret Password <span className="text-red-500">*</span>
              </label>
              <input
                id="secretPassword"
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Enter secret password"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">💡 Contact admin for the secret password</p>
            </div>
            <div>
              <label htmlFor="newPasswordSecret" className="block text-sm font-semibold text-slate-700 mb-3">
                🔒 New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="newPasswordSecret"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPasswordSecret" className="block text-sm font-semibold text-slate-700 mb-3">
                🔒 Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPasswordSecret"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white shadow-sm hover:shadow-md transition-all"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
