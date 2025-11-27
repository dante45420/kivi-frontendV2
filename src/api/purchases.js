/**
 * API: Compras
 */
import { get, post, del } from './client'

export async function fetchPurchases(withCustomers = false) {
  const params = withCustomers ? '?with_customers=true' : ''
  return get(`/api/purchases${params}`)
}

export async function fetchPurchase(id) {
  return get(`/api/purchases/${id}`)
}

export async function createPurchase(data) {
  return post('/api/purchases', data)
}

export async function deletePurchase(id) {
  return del(`/api/purchases/${id}`)
}

