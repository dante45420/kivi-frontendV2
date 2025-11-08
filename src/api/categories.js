/**
 * API: Categorías
 */
import { get } from './client'

export async function fetchCategories() {
  return get('/api/categories')
}
