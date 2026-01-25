import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    return verifyToken(token)
  } catch (error) {
    console.error('Error in getAuthUser:', error)
    return null
  }
}

/**
 * Check if user can perform delete operations
 * Only MANAGER can delete (SuperAdmin level)
 */
export function canDelete(role: string | undefined): boolean {
  return role === 'MANAGER'
}

/**
 * Helper to return unauthorized response for API routes
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}
