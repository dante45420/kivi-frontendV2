/**
 * Página: Vendedores
 * Gestión de vendedores con tabla resumen, CRUD y gestión de costos
 */
import { useState, useEffect } from 'react'
import {
  fetchSellers,
  fetchSellersSummary,
  createSeller,
  updateSeller,
  deleteSeller,
  createSellerCosts
} from '../api/sellers'
import Modal from '../components/Modal'
import Loader from '../components/Loader'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default function Sellers() {
  const [loading, setLoading] = useState(true)
  const [sellersSummary, setSellersSummary] = useState([])
  const [sellers, setSellers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllSellers, setShowAllSellers] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  
  // Modal crear/editar
  const [showModal, setShowModal] = useState(false)
  const [editingSeller, setEditingSeller] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    preferences: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Modal crear costos
  const [showCostModal, setShowCostModal] = useState(false)
  const [defaultAmount, setDefaultAmount] = useState('')
  const [creatingCosts, setCreatingCosts] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])
  
  useEffect(() => {
    if (showAllSellers) {
      loadSellers()
    }
  }, [searchQuery, showAllSellers])
  
  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSummary(),
        loadSellers()
      ])
    } finally {
      setLoading(false)
    }
  }
  
  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const data = await fetchSellersSummary()
      setSellersSummary(data.sellers || [])
    } catch (error) {
      console.error('Error cargando resumen:', error)
      alert('Error cargando resumen: ' + error.message)
    } finally {
      setLoadingSummary(false)
    }
  }
  
  const loadSellers = async () => {
    try {
      const data = await fetchSellers(searchQuery)
      setSellers(data)
    } catch (error) {
      console.error('Error cargando vendedores:', error)
    }
  }
  
  const handleOpenNew = () => {
    setEditingSeller(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      preferences: '',
      notes: ''
    })
    setShowModal(true)
  }
  
  const handleEdit = (seller) => {
    setEditingSeller(seller)
    setFormData({
      name: seller.name,
      phone: seller.phone || '',
      email: seller.email || '',
      address: seller.address || '',
      preferences: seller.preferences || '',
      notes: seller.notes || ''
    })
    setShowModal(true)
  }
  
  const handleSave = async () => {
    if (!formData.name) {
      alert('El nombre es obligatorio')
      return
    }
    
    setSaving(true)
    try {
      if (editingSeller) {
        await updateSeller(editingSeller.id, formData)
      } else {
        await createSeller(formData)
      }
      
      alert('✅ Vendedor guardado')
      setShowModal(false)
      loadData()
    } catch (error) {
      alert('Error guardando vendedor: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (seller) => {
    if (!confirm(`¿Eliminar ${seller.name}?`)) return
    
    try {
      await deleteSeller(seller.id)
      alert('✅ Vendedor eliminado')
      loadData()
    } catch (error) {
      alert('Error eliminando vendedor: ' + error.message)
    }
  }
  
  const handleCreateCosts = async () => {
    const amount = parseFloat(defaultAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido mayor a 0')
      return
    }
    
    setCreatingCosts(true)
    try {
      const result = await createSellerCosts(amount)
      alert(`✅ Se crearon ${result.created} costos. ${result.skipped > 0 ? `${result.skipped} pedidos ya tenían costo.` : ''}`)
      setShowCostModal(false)
      setDefaultAmount('')
      loadSummary()
    } catch (error) {
      alert('Error creando costos: ' + error.message)
    } finally {
      setCreatingCosts(false)
    }
  }
  
  // Filtrar resumen por búsqueda
  const filteredSummary = sellersSummary.filter(s => 
    !searchQuery || 
    s.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.seller.phone && s.seller.phone.includes(searchQuery))
  )
  
  // Mostrar primeros 10 o todos según showAllSellers
  const displayedSummary = showAllSellers ? filteredSummary : filteredSummary.slice(0, 10)
  
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }
  
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
          👔 Vendedores
        </h1>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowCostModal(true)} 
            className="button"
            style={{ background: 'var(--kivi-green)' }}
          >
            💰 Crear Costos
          </button>
          <button onClick={handleOpenNew} className="button">
            <span>➕</span>
            <span>Nuevo vendedor</span>
          </button>
        </div>
      </div>
      
      {/* Sección 1: Tabla Resumen */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            margin: 0
          }}>
            📊 Resumen de Vendedores (Ordenados por Monto Facturado)
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px', padding: '8px 12px', fontSize: '14px' }}
            />
            {filteredSummary.length > 10 && (
              <button
                onClick={() => setShowAllSellers(!showAllSellers)}
                className="button ghost"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {showAllSellers ? 'Mostrar primeros 10' : `Mostrar todos (${filteredSummary.length})`}
              </button>
            )}
          </div>
        </div>
        
        {loadingSummary ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader />
          </div>
        ) : displayedSummary.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👔</div>
            <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
              {searchQuery ? 'No se encontraron vendedores' : 'No hay vendedores con pedidos completados'}
            </p>
          </div>
        ) : (
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e1e7e1',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 150px 120px',
              gap: '12px',
              padding: '16px 20px',
              background: '#f8f9fa',
              borderBottom: '2px solid #e1e7e1',
              fontWeight: 700,
              fontSize: '13px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div>Vendedor</div>
              <div style={{ textAlign: 'right' }}>Monto Facturado</div>
              <div style={{ textAlign: 'center' }}>Pedidos Completados</div>
            </div>
            
            {displayedSummary.map((item, idx) => (
              <div 
                key={item.seller.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 150px 120px',
                  gap: '12px',
                  padding: '16px 20px',
                  borderBottom: idx < displayedSummary.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  {item.seller.name}
                </div>
                <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 700, color: 'var(--kivi-green)', fontFamily: 'monospace' }}>
                  {formatCurrency(item.total_revenue)}
                </div>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>
                  {item.completed_orders_count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sección 2: Crear/Editar Vendedores */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          ➕ Crear/Editar Vendedores
        </h2>
        
        {sellers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👔</div>
            <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
              No hay vendedores registrados
            </p>
          </div>
        ) : (
          <div className="grid grid-3">
            {sellers.map(seller => (
              <div key={seller.id} className="card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: 'var(--kivi-text-dark)'
                    }}>
                      {seller.name}
                    </div>
                    
                    {seller.phone && (
                      <div style={{ fontSize: '14px', color: 'var(--kivi-text)', marginBottom: '2px' }}>
                        📞 {seller.phone}
                      </div>
                    )}
                    
                    {seller.email && (
                      <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
                        ✉️ {seller.email}
                      </div>
                    )}
                  </div>
                </div>
                
                {seller.address && (
                  <div style={{
                    fontSize: '13px',
                    color: '#999',
                    marginBottom: '12px',
                    padding: '8px',
                    background: '#f8f9fa',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    📍 {seller.address}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleEdit(seller)}
                    className="button button-sm ghost"
                    style={{ flex: 1 }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(seller)}
                    className="button button-sm danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSeller ? `Editar ${editingSeller.name}` : 'Nuevo vendedor'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Nombre *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre completo"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Teléfono</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+569 1234 5678"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Dirección</label>
            <input
              type="text"
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Preferencias</label>
            <textarea
              className="input"
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              placeholder="Preferencias..."
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label className="label">Notas</label>
            <textarea
              className="input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas..."
              rows={2}
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
      
      {/* Modal Crear Costos */}
      <Modal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        title="💰 Crear Costos para Pedidos Completados"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: '#fff3e0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>⚠️ Nota:</strong> Se crearán costos para todos los pedidos completados con vendedor que no tengan costo asociado. 
            Solo se creará un costo por pedido.
          </div>
          
          <div className="form-group">
            <label className="label">Monto por Defecto *</label>
            <input
              type="number"
              className="input"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="15000"
              min="1"
              step="1"
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Este monto se aplicará a todos los pedidos sin costo
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowCostModal(false)
                setDefaultAmount('')
              }}
              className="button ghost"
              disabled={creatingCosts}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateCosts}
              className="button"
              disabled={creatingCosts}
              style={{ background: 'var(--kivi-green)' }}
            >
              {creatingCosts ? (
                <>
                  <div className="loading"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>💰</span>
                  <span>Crear Costos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
