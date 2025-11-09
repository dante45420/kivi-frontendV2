import React, { useState } from 'react'
import AddToCartPopover from './AddToCartPopover'
import { useCart } from '../hooks/useCart'
import { getImageUrl } from '../utils/imageUrl'

export default function ProductCard({ product, onAdd }) {
  const [open, setOpen] = useState(false)
  const { updateQuantity, removeItem, cart } = useCart()

  const cartItem = cart.find(i => i.product.id === product.id)
  const inCartCount = cartItem ? cartItem.quantity : 0
  const inCart = inCartCount > 0

  return (
    <div className="card product-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="product-image" style={{ height: 100, background: product.photo_url ? `url(${getImageUrl(product.photo_url)})` : '#f5f5f5', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        {!product.photo_url && (product.category?.emoji || '📦')}
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--kivi-text-dark)', marginBottom: '8px', lineHeight: 1.2 }}>{product.name}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kivi-green)', marginBottom: '12px' }}>${product.sale_price.toLocaleString('es-CL')} / {product.unit}</div>

        {!inCart && (
          <div>
            <button className="button" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 700 }} onClick={() => setOpen(true)}>Agregar</button>
            {open && (
              <AddToCartPopover product={product} onClose={() => setOpen(false)} onAdd={(qty, unit) => { onAdd(product, qty, unit); setOpen(false) }} />
            )}
          </div>
        )}

        {inCart && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <button className="button button-sm" onClick={() => updateQuantity(product.id, Math.max((inCartCount - (cartItem.unit === 'kg' ? 0.25 : 1)), 0), cartItem.unit)} style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>−</button>
            <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800, fontSize: '18px' }}>{inCartCount}</div>
            <button className="button button-sm" onClick={() => updateQuantity(product.id, (inCartCount + (cartItem.unit === 'kg' ? 0.25 : 1)), cartItem.unit)} style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}
