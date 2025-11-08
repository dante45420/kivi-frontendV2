/**
 * Cliente API base
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  
  // Agregar token si existe
  const token = localStorage.getItem('kivi_token')
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export function get(endpoint) {
  return request(endpoint, { method: 'GET' })
}

export function post(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function put(endpoint, data) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function del(endpoint) {
  return request(endpoint, { method: 'DELETE' })
}

export function uploadFile(endpoint, file, additionalData = {}) {
  const url = `${API_URL}${endpoint}`
  const token = localStorage.getItem('kivi_token')
  
  const formData = new FormData()
  formData.append('file', file)
  
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key])
  })
  
  // Usar fetch directamente para FormData (no incluir Content-Type, el browser lo setea)
  const config = {
    method: 'POST',
    body: formData,
    headers: {}
  }
  
  // Solo agregar Authorization si existe token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  
  return fetch(url, config)
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(error.error || `HTTP ${response.status}`)
        }).catch(() => {
          throw new Error(`HTTP ${response.status}`)
        })
      }
      return response.json()
    })
    .catch(error => {
      console.error('Upload Error:', error)
      throw error
    })
}
