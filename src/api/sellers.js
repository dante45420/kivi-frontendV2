/**
 * API: Vendedores
 */
import { get, post, put, del } from './client'

export async function fetchSellers(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  return get(`/api/sellers${params}`)
}

export async function fetchSeller(id) {
  return get(`/api/sellers/${id}`)
}

export async function createSeller(sellerData) {
  return post('/api/sellers', sellerData)
}

export async function updateSeller(id, sellerData) {
  return put(`/api/sellers/${id}`, sellerData)
}

export async function deleteSeller(id) {
  return del(`/api/sellers/${id}`)
}

export async function fetchSellersSummary() {
  return get('/api/sellers/summary')
}

export async function createSellerCosts(defaultAmount = 0) {
  return post('/api/sellers/create-costs', { default_amount: defaultAmount })
}
