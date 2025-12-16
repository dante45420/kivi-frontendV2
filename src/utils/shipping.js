/**
 * Utilidad para calcular costos de envío
 * Mantiene consistencia en todo el sistema
 */

/**
 * Calcula el monto de envío basado en el tipo y el subtotal
 * @param {String} shippingType - Tipo de envío: 'fast', 'normal', 'cheap'
 * @param {Number} subtotal - Subtotal del pedido
 * @returns {Object} - { amount: número, label: string, description: string }
 */
export function calculateShipping(shippingType, subtotal = 0) {
  const type = shippingType || 'normal'
  
  // Siempre usar 'normal' - el único método de envío disponible
  // Normal: día siguiente
  // Si el pedido es menor a 30.000, se cobra 3.000 de envío
  // Si el pedido es >= 30.000, no se cobra envío (0)
  const subtotalNum = parseFloat(subtotal) || 0
  const shippingAmount = subtotalNum < 30000 ? 3000 : 0
  
  return {
    amount: shippingAmount,
    label: 'Envío normal',
    description: subtotalNum < 30000 
      ? 'Envío al día siguiente (+$3.000)' 
      : 'Envío al día siguiente (sin costo adicional)',
    percentage: subtotalNum < 30000 ? '+$3.000' : '+0%'
  }
}

/**
 * Calcula el total final incluyendo el envío
 * @param {Number} subtotal - Subtotal del pedido
 * @param {String} shippingType - Tipo de envío
 * @returns {Number} - Total final
 */
export function calculateTotalWithShipping(subtotal, shippingType) {
  const shipping = calculateShipping(shippingType, subtotal)
  return subtotal + shipping.amount
}

