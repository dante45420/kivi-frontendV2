/**
 * Utilidad para normalizar URLs de imágenes
 * Asegura que las URLs relativas se completen con la URL del backend
 */

export function getImageUrl(url) {
  if (!url) return null
  
  // Si ya es una URL completa (http/https), retornarla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Obtener API_URL y normalizar (agregar https:// si falta)
  let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  if (API_URL && !API_URL.match(/^https?:\/\//)) {
    API_URL = `https://${API_URL}`
  }
  API_URL = API_URL.replace(/\/$/, '')
  
  // Asegurar que la URL de la foto empiece con /
  const photoPath = url.startsWith('/') ? url : `/${url}`
  
  return `${API_URL}${photoPath}`
}

