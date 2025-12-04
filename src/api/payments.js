/**
 * API: Pagos
 */
import { get, post, put, del } from './client'

export async function fetchPayments(customerId = null) {
  const params = customerId ? `?customer_id=${customerId}` : ''
  return get(`/api/payments${params}`)
}

export async function fetchPayment(id) {
  return get(`/api/payments/${id}`)
}

export async function createPayment(data) {
  return post('/api/payments', data)
}

export async function updatePayment(id, data) {
  return put(`/api/payments/${id}`, data)
}

export async function deletePayment(id) {
  return del(`/api/payments/${id}`)
}

export async function generateInvoice(customerId) {
  return get(`/api/payments/customer/${customerId}/invoice`)
}
