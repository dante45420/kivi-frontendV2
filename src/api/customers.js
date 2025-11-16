/**
 * API: Clientes
 */
import { get, post, put, del } from './client'

export async function fetchCustomers(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  return get(`/api/customers${params}`)
}

export async function fetchCustomer(id) {
  return get(`/api/customers/${id}`)
}

export async function createCustomer(data) {
  return post('/api/customers', data)
}

export async function updateCustomer(id, data) {
  return put(`/api/customers/${id}`, data)
}

export async function deleteCustomer(id) {
  return del(`/api/customers/${id}`)
}

export async function fetchCustomerBalance(id) {
  return get(`/api/customers/${id}/balance`)
}

export async function fetchCustomerDebt(id) {
  return get(`/api/customers/${id}/debt`)
}
