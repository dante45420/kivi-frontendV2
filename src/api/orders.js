/**
 * API: Pedidos
 */
import { get, post, put, del } from './client'

export async function fetchOrders(status = null) {
  const params = status ? `?status=${status}` : ''
  return get(`/api/orders${params}`)
}

export async function fetchOrder(id) {
  return get(`/api/orders/${id}`)
}

export async function parseOrderText(text) {
  return post('/api/orders/parse', { text })
}

export async function createOrder(data) {
  return post('/api/orders', data)
}

export async function emitOrder(id) {
  return put(`/api/orders/${id}/emit`, {})
}

export async function completeOrder(id) {
  return put(`/api/orders/${id}/complete`, {})
}

export async function addOrderItem(orderId, item) {
  return post(`/api/orders/${orderId}/items`, item)
}

export async function updateOrderItem(itemId, data) {
  return put(`/api/orders/items/${itemId}`, data)
}

export async function deleteOrderItem(itemId) {
  return del(`/api/orders/items/${itemId}`)
}

export async function addExpense(orderId, expense) {
  return post(`/api/orders/${orderId}/expenses`, expense)
}
