'use client'

import { useState, useEffect } from 'react'

export type UserRole = 'MANAGER' | 'STAFF'

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole | null
    const storedName = localStorage.getItem('userName') || ''
    setRole(storedRole || 'MANAGER')
    setUserName(storedName)
    setLoading(false)
  }, [])

  const isManager = role === 'MANAGER'
  const isStaff = role === 'STAFF'
  const canWrite = role === 'MANAGER'
  const canRead = role === 'MANAGER' || role === 'STAFF'
  const canDelete = role === 'MANAGER'

  return {
    role,
    userName,
    isManager,
    isStaff,
    canWrite,
    canRead,
    canDelete,
    loading,
  }
}
