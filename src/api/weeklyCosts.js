const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function createWeeklyCost(costData) {
  const response = await fetch(`${API_URL}/api/weekly-costs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(costData)
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(error.error || 'Error creando costo')
  }
  
  return response.json()
}

export async function getWeeklyCosts(weekStart = null) {
  const url = weekStart 
    ? `${API_URL}/api/weekly-costs?week_start=${weekStart}`
    : `${API_URL}/api/weekly-costs`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Error obteniendo costos')
  }
  
  return response.json()
}

export async function getCostsByWeek() {
  const response = await fetch(`${API_URL}/api/weekly-costs/by-week`)
  
  if (!response.ok) {
    throw new Error('Error obteniendo costos por semana')
  }
  
  return response.json()
}

export async function updateWeeklyCost(costId, costData) {
  const response = await fetch(`${API_URL}/api/weekly-costs/${costId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(costData)
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(error.error || 'Error actualizando costo')
  }
  
  return response.json()
}

export async function deleteWeeklyCost(costId) {
  const response = await fetch(`${API_URL}/api/weekly-costs/${costId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(error.error || 'Error eliminando costo')
  }
  
  return response.json()
}

