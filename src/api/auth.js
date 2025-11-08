/**
 * API: Autenticación
 */
import { post, get } from './client'

const TOKEN_KEY = 'kivi_token'

export async function login(email, password) {
  const response = await post('/api/auth/login', { email, password })
  if (response.token) {
    localStorage.setItem(TOKEN_KEY, response.token)
  }
  return response
}

export async function verifyToken() {
  const token = getToken()
  if (!token) return { valid: false }
  
  try {
    const response = await get('/api/auth/verify')
    return response
  } catch (error) {
    clearToken()
    return { valid: false }
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function logout() {
  clearToken()
  window.location.href = '/login'
}

