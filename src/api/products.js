/**
 * API: Productos
 */
import { get, post, put, del, uploadFile } from './client'

export async function fetchProducts(filters = {}) {
  const params = new URLSearchParams(filters)
  return get(`/api/products?${params}`)
}

export async function fetchProduct(id) {
  return get(`/api/products/${id}`)
}

export async function createProduct(data) {
  return post('/api/products', data)
}

export async function updateProduct(id, data) {
  return put(`/api/products/${id}`, data)
}

export async function deleteProduct(id) {
  return del(`/api/products/${id}`)
}

export async function uploadProductPhoto(id, file) {
  return uploadFile(`/api/products/${id}/photo`, file)
}

export async function deleteProductPhoto(id) {
  return del(`/api/products/${id}/photo`)
}

export async function fetchPriceHistory(id) {
  return get(`/api/products/${id}/price-history`)
}
