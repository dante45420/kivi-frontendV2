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

export async function fetchSellersSummaryWeek() {
  return get('/api/sellers/summary/week')
}

export async function createSellerCosts() {
  return post('/api/sellers/create-costs', {})
}

export async function getSellerConfig() {
  return get('/api/sellers/config')
}

export async function updateSellerConfig(commissionPercent) {
  return put('/api/sellers/config', { commission_percent: commissionPercent })
}

export async function getSellerDebt(id) {
  return get(`/api/sellers/${id}/debt`)
}

export async function getSellerPayments(id) {
  return get(`/api/sellers/${id}/payments`)
}

export async function createSellerPayment(id, paymentData) {
  return post(`/api/sellers/${id}/payments`, paymentData)
}

export async function assignWeeklyBonus(data) {
  return post('/api/sellers/bonus/assign', data)
}

export async function getSellerBonuses(weekStart = null) {
  const params = weekStart ? `?week_start=${weekStart}` : ''
  return get(`/api/sellers/bonus${params}`)
}

export async function getSellerWeekSummary(id, weekStart = null) {
  const params = weekStart ? `?week_start=${weekStart}` : ''
  return get(`/api/sellers/${id}/week-summary${params}`)
}

export async function getSellerGlobalSummary(id) {
  return get(`/api/sellers/${id}/global-summary`)
}

