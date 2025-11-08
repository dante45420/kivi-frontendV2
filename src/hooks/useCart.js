import { useState, useEffect } from 'react'

export function useCart() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kivi_cart')
    return saved ? JSON.parse(saved) : []
  })
  
  // Guardar en localStorage cuando cambie el carrito
  useEffect(() => {
    localStorage.setItem('kivi_cart', JSON.stringify(cart))
  }, [cart])
  
  const addItem = (product, quantity = 1, unit = 'unit') => {
    setCart(prev => {
      // Buscar item con mismo producto Y misma unidad
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && item.unit === unit
      )
      
      if (existingIndex >= 0) {
        // Si existe, incrementar cantidad
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        }
        return updated
      }
      
      // Si no existe, agregar nuevo
      return [...prev, { product, quantity, unit }]
    })
  }
  
  const removeItem = (productId, unit = null) => {
    setCart(prev => prev.filter(item => {
      if (unit) {
        // Remover solo el item con esa unidad específica
        return !(item.product.id === productId && item.unit === unit)
      }
      // Remover todos los items del producto
      return item.product.id !== productId
    }))
  }
  
  const updateQuantity = (productId, newQuantity, unit = null) => {
    if (newQuantity <= 0) {
      removeItem(productId, unit)
      return
    }
    
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          // Si se especifica unit, solo actualizar ese item
          if (unit && item.unit !== unit) {
            return item
          }
          
          // Para kg, redondear a 0.25
          let finalQty = newQuantity
          if (item.unit === 'kg') {
            finalQty = Math.round(newQuantity * 4) / 4
            finalQty = Math.max(0.25, finalQty)  // Mínimo 250g
          }
          
          return { ...item, quantity: finalQty }
        }
        return item
      })
    )
  }
  
  const clearCart = () => {
    setCart([])
    localStorage.removeItem('kivi_cart')
  }
  
  // Calcular total
  const total = cart.reduce((sum, item) => {
    const price = item.product.sale_price || 0
    return sum + (price * item.quantity)
  }, 0)
  
  // Contar items (cantidad de tipos diferentes, no suma de cantidades)
  const itemCount = cart.length
  
  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount
  }
}
