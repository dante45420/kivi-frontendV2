const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function fetchKPIs() {
  const response = await fetch(`${API_URL}/api/kpis`)
  if (!response.ok) {
    throw new Error('Error obteniendo KPIs')
  }
  return response.json()
}

export async function fetchUtilityDetails() {
  const response = await fetch(`${API_URL}/api/kpis/utility-details`)
  if (!response.ok) {
    throw new Error('Error obteniendo detalles de utilidad')
  }
  return response.json()
}

export async function fetchUtilityByWeek() {
  const response = await fetch(`${API_URL}/api/kpis/utility-by-week`)
  if (!response.ok) {
    throw new Error('Error obteniendo utilidad por semana')
  }
  return response.json()
}

export async function fetchKPIByWeek(metric) {
  const response = await fetch(`${API_URL}/api/kpis/by-week/${metric}`)
  if (!response.ok) {
    throw new Error(`Error obteniendo ${metric} por semana`)
  }
  return response.json()
}

