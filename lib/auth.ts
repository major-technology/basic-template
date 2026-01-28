import 'server-only'
import { headers } from 'next/headers'

export interface User {
  userId: string
  email: string
  name: string
}

export interface CurrentUserResponse{
    user: User
}

const API_BASE_URL = process.env.MAJOR_API_BASE_URL || 'https://go-api.prod.major.build'

/**
 * Gets the information about the currently authenticated user.
 * @returns Current authenticated user information
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const h = await headers()
  const jwt = h.get('x-major-user-jwt')
  
  if (!jwt) {
    throw new Error('No user JWT found. Ensure x-major-user-jwt header is present.')
  }

  const res = await fetch(`${API_BASE_URL}/internal/apps/v1/me`, {
    headers: { 'x-major-user-jwt': jwt }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }

  const data = await res.json()
  return data as CurrentUserResponse
}