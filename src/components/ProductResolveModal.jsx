/**
 * Componente: Modal para resolver productos no encontrados en parser
 */
import { useState, useEffect } from 'react'
import { fetchCategories } from '../api/categories'
import { createProduct } from '../api/products'
import Modal from './Modal'

export default function ProductResolveModal({ 
  item, 
  isOpen, 
  onClose, 
  onResolved,
  onCreateNew 
}) {
  const [creating, setCreating] = useState(false)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: item?.product_name || '',
    category_id: '',
    sale_price: '',
    unit: item?.unit || 'kg'
  })
  
  useEffect(() => {
    if (isOpen) {
      loadCategories()
      setFormData({
        name: item?.product_name || '',
        category_id: categories[0]?.id || '',
        sale_price: '',
        unit: item?.unit || 'kg'
      })
    }
  }, [isOpen])
  
  const loadCategories = async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
      if (cats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }))
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }
  
  const handleAcceptSuggestion = (suggestion) => {
    onResolved(item, suggestion.product)
  }
  
  const handleCreateNew = async () => {
    if (!formData.name || !formData.category_id) {
      alert('Completa nombre y categoría')
      return
    }
    
    setCreating(true)
    try {
      const newProduct = await createProduct({
        name: formData.name,
        category_id: parseInt(formData.category_id),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        unit: formData.unit,
        active: true
      })
      
      onCreateNew(item, newProduct)
    } catch (error) {
      alert('Error creando producto: ' + error.message)
    } finally {
      setCreating(false)
    }
  }
  
  if (!item) return null
  
  const hasSuggestions = item.suggestions && item.suggestions.length > 0
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolver: "${item.product_name}"`}
      size="md"
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '12px',
          background: '#FFF4E5',
          borderRadius: 'var(--radius)',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
            Pedido: {item.qty} {item.unit} de "{item.product_name}"
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            {item.customer?.name}
          </div>
        </div>
        
        {hasSuggestions && (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
              ¿Es alguno de estos productos?
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {item.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#fff',
                    border: '2px solid #eee',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--kivi-green)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#eee'}
                >
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      {suggestion.product.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#999' }}>
                      Similaridad: {Math.round(suggestion.similarity * 100)}%
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="button button-sm"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{
              borderTop: '1px solid #eee',
              paddingTop: '16px',
              marginTop: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                O crear producto nuevo:
              </h3>
            </div>
          </>
        )}
        
        {!hasSuggestions && (
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
            Crear nuevo producto:
          </h3>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="label">Nombre del producto</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="label">Categoría</label>
            <select
              className="input"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Precio venta (opcional)</label>
              <input
                type="number"
                className="input"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label className="label">Unidad</label>
              <select
                className="input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">Kilogramo</option>
                <option value="unit">Unidad</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleCreateNew}
            className="button"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={creating}
          >
            {creating ? (
              <>
                <div className="loading"></div>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Crear producto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

