import { NextRequest } from 'next/server'
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
