import React from 'react'
import { useCart } from '../hooks/useCart'
import Modal from './Modal'

export default function AddToCartPopover({ product, onClose, onAdd }) {
  const { addItem } = useCart()

  const confirm = (chosenUnit) => {
    const chosenQty = chosenUnit === 'kg' ? 0.25 : 1
    addItem(product, chosenQty, chosenUnit)
    if (onAdd) onAdd(chosenQty, chosenUnit)
    if (onClose) onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Agregar ${product.name}`} size="sm">
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--kivi-text)', 
          marginBottom: '20px',
          lineHeight: 1.5
        }}>
          Selecciona cómo quieres comprar este producto:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="button" 
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 700
            }} 
            onClick={() => confirm('unit')}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📦</div>
            <div>Por unidad</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', fontWeight: 400 }}>
              Ideal para productos individuales
            </div>
          </button>
          
          <button 
            className="button" 
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 700
            }} 
            onClick={() => confirm('kg')}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚖️</div>
            <div>Por kilogramo</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', fontWeight: 400 }}>
              Ideal para productos a granel
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}
