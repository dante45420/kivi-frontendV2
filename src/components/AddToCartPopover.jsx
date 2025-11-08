import React, { useState } from 'react'
import { useCart } from '../hooks/useCart'

export default function AddToCartPopover({ product, onClose, onAdd }) {
  const { addItem, updateQuantity } = useCart()
  const [unit, setUnit] = useState(product.unit || 'unit')
  // For the simplified UX: show unit selector only. Default qty for unit selection.
  const initial = unit === 'kg' ? 0.25 : 1
  const [qty, setQty] = useState(initial)

  const step = unit === 'kg' ? 0.25 : 1

  // When user confirms selection, immediately add a default quantity and close
  const confirm = (chosenUnit) => {
    const chosenQty = chosenUnit === 'kg' ? 0.25 : 1
    addItem(product, chosenQty, chosenUnit)
    if (onAdd) onAdd(chosenQty, chosenUnit)
    if (onClose) onClose()
  }

  return (
    <div style={{ marginTop: 6 }}>
      <div className="card" style={{ padding: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{product.name}</div>
            <div style={{ fontSize: 13, color: '#666' }}>${product.sale_price.toLocaleString('es-CL')} / {product.unit}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="button" style={{ flex: 1 }} onClick={() => confirm('unit')}>Por unidad</button>
          <button className="button" style={{ flex: 1 }} onClick={() => confirm('kg')}>Por kilogramo</button>
        </div>
      </div>
    </div>
  )
}
