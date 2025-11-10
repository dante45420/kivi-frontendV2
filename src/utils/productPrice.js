/**
 * Utilidad para obtener el precio efectivo de un producto
 * Considera ofertas semanales activas
 */

/**
 * Obtiene el precio efectivo de un producto
 * @param {Object} product - El producto
 * @param {Array} weeklyOffers - Array de ofertas semanales activas
 * @returns {Number} - El precio efectivo (oferta o precio normal)
 */
export function getEffectivePrice(product, weeklyOffers = []) {
  if (!product) return 0
  
  // Buscar si hay una oferta activa para este producto
  const offer = weeklyOffers.find(o => 
    o.product?.id === product.id || o.product_id === product.id
  )
  
  // Si hay oferta, usar el precio especial, sino el precio de venta
  return offer ? offer.special_price : (product.sale_price || 0)
}

/**
 * Verifica si un producto tiene oferta activa
 * @param {Object} product - El producto
 * @param {Array} weeklyOffers - Array de ofertas semanales activas
 * @returns {Boolean} - true si tiene oferta activa
 */
export function hasActiveOffer(product, weeklyOffers = []) {
  if (!product) return false
  return weeklyOffers.some(o => 
    (o.product?.id === product.id || o.product_id === product.id)
  )
}

/**
 * Obtiene la oferta activa de un producto
 * @param {Object} product - El producto
 * @param {Array} weeklyOffers - Array de ofertas semanales activas
 * @returns {Object|null} - La oferta o null
 */
export function getActiveOffer(product, weeklyOffers = []) {
  if (!product) return null
  return weeklyOffers.find(o => 
    (o.product?.id === product.id || o.product_id === product.id)
  ) || null
}

