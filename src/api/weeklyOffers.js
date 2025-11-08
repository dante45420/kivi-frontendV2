/**
 * API: Ofertas Semanales
 */
import { get, post, put, del } from './client'

export async function fetchWeeklyOffers(activeOnly = true, current = false) {
  const params = new URLSearchParams()
  if (activeOnly) params.append('active', 'true')
  if (current) params.append('current', 'true')
  
  const queryString = params.toString()
  return get(`/api/weekly-offers${queryString ? '?' + queryString : ''}`)
}

export async function createWeeklyOffer(data) {
  return post('/api/weekly-offers', data)
}

export async function updateWeeklyOffer(id, data) {
  return put(`/api/weekly-offers/${id}`, data)
}

export async function deleteWeeklyOffer(id) {
  return del(`/api/weekly-offers/${id}`)
}

export async function scheduleOffers(data) {
  return post('/api/weekly-offers/schedule', data)
}

