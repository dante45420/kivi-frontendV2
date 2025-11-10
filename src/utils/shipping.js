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
  
  switch (type) {
    case 'fast':
    case 'fastest':
      // Rápido: mismo día antes de las 12, +10% al monto total
      const fastAmount = Math.round(subtotal * 0.10)
      return {
        amount: fastAmount,
        label: 'Envío rápido',
        description: 'Envío el mismo día (solo antes de las 12:00)',
        percentage: '+10%'
      }
    
    case 'normal':
    case 'standard':
      // Normal: día siguiente, +0%
      return {
        amount: 0,
        label: 'Envío normal',
        description: 'Envío al día siguiente',
        percentage: '+0%'
      }
    
    case 'cheap':
    case 'cheapest':
    case 'economico':
      // Económico: 1-3 días, -10%
      const cheapAmount = -Math.round(subtotal * 0.10)
      return {
        amount: cheapAmount,
        label: 'Envío económico',
        description: 'Entrega en 1-3 días',
        percentage: '-10%'
      }
    
    default:
      return {
        amount: 0,
        label: 'Envío normal',
        description: 'Envío al día siguiente',
        percentage: '+0%'
      }
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

