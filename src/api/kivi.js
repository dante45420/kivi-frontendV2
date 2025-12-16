/**
 * API: Green Market 🌱
 */
import { get, post, put, del } from './client'

export async function fetchRandomTip(category = null) {
  const params = category ? `?category=${category}` : ''
  return get(`/api/kivi/tip/random${params}`)
}

export async function fetchTips(category = null) {
  const params = category ? `?category=${category}` : ''
  return get(`/api/kivi/tips${params}`)
}

export async function createTip(data) {
  return post('/api/kivi/tips', data)
}

export async function updateTip(id, data) {
  return put(`/api/kivi/tips/${id}`, data)
}

export async function deleteTip(id) {
  return del(`/api/kivi/tips/${id}`)
}

export async function chatWithGreenMarket(message, context = null) {
  const response = await post('/api/kivi/chat', { message, context })
  return response.response
}
