/**
 * Página: Productos
 * CRUD completo con fotos y gestión de precios
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductPhoto,
  deleteProductPhoto
} from '../api/products'
import { fetchCategories } from '../api/categories'
import { getImageUrl } from '../utils/imageUrl'
import Modal from '../components/Modal'
import ImageUploader from '../components/ImageUploader'
import Loader from '../components/Loader'

export default function Products() {
  const [searchParams] = useSearchParams()
  const autoOpenNew = searchParams.get('action') === 'new'
  
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal
  const [showModal, setShowModal] = useState(autoOpenNew)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sale_price: '',
    purchase_price: '',
    unit: 'kg',
    avg_units_per_kg: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories()
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenNew = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      sale_price: '',
      purchase_price: '',
      unit: 'kg',
      avg_units_per_kg: '',
      notes: ''
    })
    setShowModal(true)
  }
  
  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category_id: product.category_id,
      sale_price: product.sale_price || '',
      purchase_price: product.purchase_price || '',
      unit: product.unit,
      avg_units_per_kg: product.avg_units_per_kg || '',
      notes: product.notes || ''
    })
    setShowModal(true)
  }
  
  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      alert('Completa los campos obligatorios')
      return
    }
    
    setSaving(true)
    try {
      const data = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        unit: formData.unit,
        avg_units_per_kg: formData.avg_units_per_kg ? parseFloat(formData.avg_units_per_kg) : null,
        notes: formData.notes
      }
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
      } else {
        await createProduct(data)
      }
      
      alert('✅ Producto guardado')
      setShowModal(false)
      loadData()
    } catch (error) {
      alert('Error guardando producto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar ${product.name}?`)) return
    
    try {
      await deleteProduct(product.id)
      alert('✅ Producto eliminado')
      loadData()
    } catch (error) {
      alert('Error eliminando producto: ' + error.message)
    }
  }
  
  const handlePhotoUpload = async (file) => {
    if (!editingProduct) return
    
    setUploadingPhoto(true)
    try {
      const result = await uploadProductPhoto(editingProduct.id, file)
      setEditingProduct({ ...editingProduct, photo_url: result.photo_url })
      loadData()
    } catch (error) {
      alert('Error subiendo foto: ' + error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }
  
  const handlePhotoDelete = async () => {
    if (!editingProduct) return
    
    setUploadingPhoto(true)
    try {
      await deleteProductPhoto(editingProduct.id)
      setEditingProduct({ ...editingProduct, photo_url: null })
      loadData()
    } catch (error) {
      alert('Error eliminando foto: ' + error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }
  
  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--kivi-text-dark)',
          margin: 0
        }}>
          🥬 Productos
        </h1>
        
        <button onClick={handleOpenNew} className="button">
          <span>➕</span>
          <span>Nuevo producto</span>
        </button>
      </div>
      
      {/* Filtros */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Buscar producto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '12px' }}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategoryFilter(null)}
            className="button button-sm"
            style={{
              background: !categoryFilter ? 'var(--kivi-green)' : 'transparent',
              color: !categoryFilter ? '#fff' : 'var(--kivi-text)',
              border: !categoryFilter ? 'none' : '1px solid #ddd'
            }}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="button button-sm"
              style={{
                background: categoryFilter === cat.id ? 'var(--kivi-green)' : 'transparent',
                color: categoryFilter === cat.id ? '#fff' : 'var(--kivi-text)',
                border: categoryFilter === cat.id ? 'none' : '1px solid #ddd'
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lista */}
      {loading ? (
        <Loader message="Cargando productos..." />
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥬</div>
          <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
            {searchQuery || categoryFilter ? 'No se encontraron productos' : 'No hay productos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-4">
          {filteredProducts.map(product => {
            // Calcular porcentaje de utilidad
            const profitPercent = product.purchase_price && product.sale_price && product.purchase_price > 0
              ? ((product.sale_price - product.purchase_price) / product.purchase_price) * 100
              : null
            
            return (
              <div key={product.id} className="card" style={{ padding: '12px', position: 'relative' }}>
                {/* Etiquetas en esquinas superiores */}
                {profitPercent !== null && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'var(--kivi-green)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    💰 {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                  </div>
                )}
                
                {product.avg_units_per_kg && product.avg_units_per_kg > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'var(--kivi-orange)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.unit === 'kg' 
                      ? `⚖️ 1kg=${product.avg_units_per_kg.toFixed(1)}u`
                      : `⚖️ ${product.avg_units_per_kg.toFixed(1)}u=1kg`
                    }
                  </div>
                )}
                
                {/* Foto */}
                {product.photo_url ? (
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    background: '#f5f5f5'
                  }}>
                    <img
                      src={getImageUrl(product.photo_url)}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>
                    {product.category?.emoji || '📦'}
                  </div>
                )}
                
                {/* Info */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: 'var(--kivi-text-dark)'
                  }}>
                    {product.name}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                    {product.category?.name}
                  </div>
                  
                  {product.sale_price && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--kivi-green)'
                    }}>
                      ${product.sale_price.toLocaleString('es-CL')} / {product.unit}
                    </div>
                  )}
                </div>
                
                {/* Acciones */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleEdit(product)}
                    className="button button-sm ghost"
                    style={{ flex: 1 }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="button button-sm danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? `Editar ${editingProduct.name}` : 'Nuevo producto'}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Foto (solo en edición) */}
          {editingProduct && (
            <div className="form-group">
              <label className="label">Foto del producto</label>
              <ImageUploader
                currentImage={getImageUrl(editingProduct.photo_url)}
                onUpload={handlePhotoUpload}
                onDelete={handlePhotoDelete}
                loading={uploadingPhoto}
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="label">Nombre *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Tomate"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Categoría *</label>
            <select
              className="input"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Precio Venta</label>
              <input
                type="number"
                className="input"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label className="label">Precio Compra</label>
              <input
                type="number"
                className="input"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Unidad</label>
              <select
                className="input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">Kilogramo (kg)</option>
                <option value="unit">Unidad</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="label">Conversión (unidades/kg)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.avg_units_per_kg}
                onChange={(e) => setFormData({ ...formData, avg_units_per_kg: e.target.value })}
                placeholder="Ej: 5.5"
                title="Promedio de unidades por kilogramo (se actualiza automáticamente al registrar compras)"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Notas</label>
            <textarea
              className="input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowModal(false)}
              className="button ghost"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="loading"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

