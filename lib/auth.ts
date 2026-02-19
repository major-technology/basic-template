import 'server-only'
import { headers } from 'next/headers'

export interface User {
  userId: string
  email: string
  name: string
}

export interface CurrentUserResponse {
  user: User
}

const API_BASE_URL = process.env.MAJOR_API_BASE_URL || 'https://go-api.prod.major.build'

/**
 * Gets the information about the currently authenticated user.
 * @returns Current authenticated user information
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const h = await headers()
  const userJwt = h.get('x-major-user-jwt')
  const majorJwtToken = process.env.MAJOR_JWT_TOKEN

  if (!userJwt && !majorJwtToken) {
    throw new Error('No user JWT found. Ensure x-major-user-jwt header is present.')
  }

  const fetchHeaders: Record<string, string> = {}
  if (userJwt) {
    fetchHeaders['x-major-user-jwt'] = userJwt
  } else {
    fetchHeaders['x-major-jwt'] = majorJwtToken!
  }

  const res = await fetch(`${API_BASE_URL}/internal/apps/v1/me`, {
    headers: fetchHeaders,
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }

  const data = await res.json()
  return data as CurrentUserResponse
}
