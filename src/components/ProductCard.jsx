import React, { useState } from 'react'
import AddToCartPopover from './AddToCartPopover'
import { useCart } from '../hooks/useCart'

export default function ProductCard({ product, onAdd }) {
  const [open, setOpen] = useState(false)
  const { updateQuantity, removeItem, cart } = useCart()

  const cartItem = cart.find(i => i.product.id === product.id)
  const inCartCount = cartItem ? cartItem.quantity : 0
  const inCart = inCartCount > 0
  
  // Completar URL de foto si es relativa
  const getPhotoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    return `${API_URL}${url}`
  }

  return (
    <div className="card product-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="product-image" style={{ height: 140, background: product.photo_url ? `url(${getPhotoUrl(product.photo_url)})` : '#f5f5f5', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        {!product.photo_url && (product.category?.emoji || '📦')}
      </div>

      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--kivi-text-dark)', marginBottom: 6 }}>{product.name}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--kivi-green)', marginBottom: 10 }}>${product.sale_price.toLocaleString('es-CL')} / {product.unit}</div>

        {!inCart && (
          <div>
            <button className="button" style={{ width: '100%' }} onClick={() => setOpen(true)}>Agregar</button>
            {open && (
              <AddToCartPopover product={product} onClose={() => setOpen(false)} onAdd={(qty, unit) => { onAdd(product, qty, unit); setOpen(false) }} />
            )}
          </div>
        )}

        {inCart && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <button className="button button-sm" onClick={() => updateQuantity(product.id, Math.max((inCartCount - (cartItem.unit === 'kg' ? 0.25 : 1)), 0), cartItem.unit)} style={{ width: 36, height: 36, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <div style={{ minWidth: 56, textAlign: 'center', fontWeight: 800 }}>{inCartCount}</div>
            <button className="button button-sm" onClick={() => updateQuantity(product.id, (inCartCount + (cartItem.unit === 'kg' ? 0.25 : 1)), cartItem.unit)} style={{ width: 36, height: 36, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}
