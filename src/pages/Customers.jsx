/**
 * Página: Clientes
 * CRUD simple de clientes
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomerBalance
} from '../api/customers'
import Modal from '../components/Modal'
import Loader from '../components/Loader'

export default function Customers() {
  const [searchParams] = useSearchParams()
  const autoOpenNew = searchParams.get('action') === 'new'
  
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal
  const [showModal, setShowModal] = useState(autoOpenNew)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    preferences: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadCustomers()
  }, [searchQuery])
  
  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await fetchCustomers(searchQuery)
      setCustomers(data)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenNew = () => {
    setEditingCustomer(null)
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
  
  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      preferences: customer.preferences || '',
      notes: customer.notes || ''
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
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
      } else {
        await createCustomer(formData)
      }
      
      alert('✅ Cliente guardado')
      setShowModal(false)
      loadCustomers()
    } catch (error) {
      alert('Error guardando cliente: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (customer) => {
    if (!confirm(`¿Eliminar ${customer.name}?`)) return
    
    try {
      await deleteCustomer(customer.id)
      alert('✅ Cliente eliminado')
      loadCustomers()
    } catch (error) {
      alert('Error eliminando cliente: ' + error.message)
    }
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
          👥 Clientes
        </h1>
        
        <button onClick={handleOpenNew} className="button">
          <span>➕</span>
          <span>Nuevo cliente</span>
        </button>
      </div>
      
      {/* Buscador */}
      <input
        type="text"
        className="input"
        placeholder="🔍 Buscar por nombre o teléfono..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      
      {/* Lista */}
      {loading ? (
        <Loader message="Cargando clientes..." />
      ) : customers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
            {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {customers.map(customer => (
            <div key={customer.id} className="card">
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
                    {customer.name}
                  </div>
                  
                  {customer.phone && (
                    <div style={{ fontSize: '14px', color: 'var(--kivi-text)', marginBottom: '2px' }}>
                      📞 {customer.phone}
                    </div>
                  )}
                  
                  {customer.email && (
                    <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
                      ✉️ {customer.email}
                    </div>
                  )}
                </div>
              </div>
              
              {customer.address && (
                <div style={{
                  fontSize: '13px',
                  color: '#999',
                  marginBottom: '12px',
                  padding: '8px',
                  background: '#f8f9fa',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  📍 {customer.address}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleEdit(customer)}
                  className="button button-sm ghost"
                  style={{ flex: 1 }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(customer)}
                  className="button button-sm danger"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? `Editar ${editingCustomer.name}` : 'Nuevo cliente'}
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
              placeholder="Dirección de entrega"
            />
          </div>
          
          <div className="form-group">
            <label className="label">Preferencias</label>
            <textarea
              className="input"
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              placeholder="Ej: Prefiere tomates maduros, sin cilantro..."
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
    </div>
  )
}

