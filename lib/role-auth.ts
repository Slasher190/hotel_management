import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './middleware-auth'

export type UserRole = 'MANAGER' | 'STAFF'

/**
 * Check if user is authenticated and has MANAGER role
 * Returns user object if authorized, null otherwise
 */
export function requireManager(request: NextRequest): { userId: string; email: string; role: string } | null {
  const user = getAuthUser(request)
  if (!user) {
    return null
  }
  if (user.role !== 'MANAGER') {
    return null
  }
  return user
}

/**
 * Check if user is authenticated and has MANAGER or STAFF role
 * Returns user object if authorized, null otherwise
 */
export function requireStaffOrManager(request: NextRequest): { userId: string; email: string; role: string } | null {
  const user = getAuthUser(request)
  if (!user) {
    return null
  }
  if (user.role !== 'MANAGER' && user.role !== 'STAFF') {
    return null
  }
  return user
}

/**
 * Check if user has MANAGER role
 */
export function isManager(role: string | undefined): boolean {
  return role === 'MANAGER'
}

/**
 * Check if user has STAFF role
 */
export function isStaff(role: string | undefined): boolean {
  return role === 'STAFF'
}

/**
 * Check if user can perform write operations (create, update, delete)
 * Only MANAGER can perform write operations
 */
export function canWrite(role: string | undefined): boolean {
  return role === 'MANAGER'
}

/**
 * Check if user can perform read operations (view)
 * Both MANAGER and STAFF can read
 */
export function canRead(role: string | undefined): boolean {
  return role === 'MANAGER' || role === 'STAFF'
}

/**
 * Helper to return unauthorized response for API routes
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
}

/**
 * Helper to return forbidden response for API routes
 */
export function forbiddenResponse(message = 'Forbidden - Insufficient permissions'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}
