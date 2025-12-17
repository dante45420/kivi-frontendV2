/**
 * Página: Vendedores
 * Gestión de vendedores con tabla resumen, CRUD y gestión de costos
 */
import { useState, useEffect } from 'react'
import {
  fetchSellers,
  fetchSellersSummary,
  fetchSellersSummaryWeek,
  createSeller,
  updateSeller,
  deleteSeller,
  createSellerCosts,
  getSellerConfig,
  updateSellerConfig,
  getSellerDebt,
  getSellerPayments,
  createSellerPayment,
  assignWeeklyBonus,
  getSellerBonuses,
  getSellerWeekSummary,
  getSellerGlobalSummary
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
  const [sellersSummaryWeek, setSellersSummaryWeek] = useState([])
  const [sellers, setSellers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllSellers, setShowAllSellers] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  
  // Configuración de comisión
  const [commissionPercent, setCommissionPercent] = useState(10)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
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
  const [creatingCosts, setCreatingCosts] = useState(false)
  
  // Sistema de pagos (similar a contabilidad)
  const [selectedSellerForPayment, setSelectedSellerForPayment] = useState(null)
  const [sellerDebtData, setSellerDebtData] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'transferencia',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [expandedSellers, setExpandedSellers] = useState(new Set())
  const [showPaymentsForSeller, setShowPaymentsForSeller] = useState(null)
  const [sellerPayments, setSellerPayments] = useState({}) // { sellerId: [payments] }
  const [globalSummaries, setGlobalSummaries] = useState({}) // { sellerId: summary }
  const [loadingGlobalSummaries, setLoadingGlobalSummaries] = useState(false)
  const [allSellerDebts, setAllSellerDebts] = useState({}) // { sellerId: debtData }
  
  // Sistema de bonos
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [bonusForm, setBonusForm] = useState({
    orders_target: '',
    bonus_percent: '',
    week_start: new Date().toISOString().split('T')[0]
  })
  const [assigningBonus, setAssigningBonus] = useState(false)
  const [bonusResults, setBonusResults] = useState(null)
  const [showBonusResults, setShowBonusResults] = useState(false)
  
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
        loadConfig(),
        loadSummary(),
        loadSummaryWeek(),
        loadSellers()
      ])
    } finally {
      setLoading(false)
    }
  }
  
  const loadConfig = async () => {
    try {
      const config = await getSellerConfig()
      setCommissionPercent(config.commission_percent || 10)
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }
  
  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const data = await fetchSellersSummary()
      setSellersSummary(data.sellers || [])
      // Cargar resúmenes globales y deudas
      await Promise.all([
        loadGlobalSummaries(data.sellers || []),
        loadAllSellerDebts(data.sellers || [])
      ])
    } catch (error) {
      console.error('Error cargando resumen:', error)
      alert('Error cargando resumen: ' + error.message)
    } finally {
      setLoadingSummary(false)
    }
  }
  
  const loadAllSellerDebts = async (sellers) => {
    try {
      const debts = {}
      await Promise.all(
        sellers.map(async (item) => {
          try {
            const debtData = await getSellerDebt(item.seller.id)
            debts[item.seller.id] = debtData
          } catch (error) {
            console.error(`Error cargando deuda de ${item.seller.name}:`, error)
          }
        })
      )
      setAllSellerDebts(debts)
    } catch (error) {
      console.error('Error cargando deudas:', error)
    }
  }
  
  const loadGlobalSummaries = async (sellers) => {
    setLoadingGlobalSummaries(true)
    try {
      const summaries = {}
      await Promise.all(
        sellers.map(async (item) => {
          try {
            const summary = await getSellerGlobalSummary(item.seller.id)
            summaries[item.seller.id] = summary
          } catch (error) {
            console.error(`Error cargando resumen global de ${item.seller.name}:`, error)
          }
        })
      )
      setGlobalSummaries(summaries)
    } catch (error) {
      console.error('Error cargando resúmenes globales:', error)
    } finally {
      setLoadingGlobalSummaries(false)
    }
  }
  
  const loadSummaryWeek = async () => {
    try {
      const data = await fetchSellersSummaryWeek()
      setSellersSummaryWeek(data.sellers || [])
    } catch (error) {
      console.error('Error cargando resumen semanal:', error)
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
  
  const toggleSeller = (sellerId) => {
    setExpandedSellers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sellerId)) {
        newSet.delete(sellerId)
      } else {
        newSet.add(sellerId)
      }
      return newSet
    })
  }
  
  const loadSellerDebt = async (sellerId) => {
    try {
      const data = await getSellerDebt(sellerId)
      setSellerDebtData(data)
      // Cargar pagos del vendedor
      const payments = await getSellerPayments(sellerId)
      setSellerPayments(prev => ({ ...prev, [sellerId]: payments }))
      return data
    } catch (error) {
      console.error('Error cargando deuda:', error)
      alert('Error cargando deuda: ' + error.message)
      return null
    }
  }
  
  const openPaymentModal = async (seller) => {
    setSelectedSellerForPayment(seller)
    const debtData = await loadSellerDebt(seller.id)
    if (debtData) {
      setPaymentForm({
        amount: '',
        method: 'transferencia',
        reference: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })
      setShowPaymentModal(true)
    }
  }
  
  const handleCreatePayment = async () => {
    if (!selectedSellerForPayment) return
    
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido mayor a 0')
      return
    }
    
    setCreatingPayment(true)
    try {
      await createSellerPayment(selectedSellerForPayment.id, paymentForm)
      alert('✅ Pago registrado')
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        method: 'transferencia',
        reference: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })
      // Recargar deuda del vendedor
      await loadSellerDebt(selectedSellerForPayment.id)
      loadSummary()
      // Recargar pagos
      const payments = await getSellerPayments(selectedSellerForPayment.id)
      setSellerPayments(prev => ({ ...prev, [selectedSellerForPayment.id]: payments }))
    } catch (error) {
      alert('Error registrando pago: ' + error.message)
    } finally {
      setCreatingPayment(false)
    }
  }
  
  const handleUpdateConfig = async () => {
    const percent = parseFloat(commissionPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      alert('El porcentaje debe estar entre 0 y 100')
      return
    }
    
    setLoadingConfig(true)
    try {
      await updateSellerConfig(percent)
      alert('✅ Configuración actualizada')
      setShowConfigModal(false)
    } catch (error) {
      alert('Error actualizando configuración: ' + error.message)
    } finally {
      setLoadingConfig(false)
    }
  }
  
  const handleAssignBonus = async () => {
    const ordersTarget = parseInt(bonusForm.orders_target)
    const bonusPercent = parseFloat(bonusForm.bonus_percent)
    
    if (isNaN(ordersTarget) || ordersTarget <= 0) {
      alert('La meta de pedidos debe ser mayor a 0')
      return
    }
    
    if (isNaN(bonusPercent) || bonusPercent < 0) {
      alert('El porcentaje de bono debe ser mayor o igual a 0')
      return
    }
    
    setAssigningBonus(true)
    try {
      const result = await assignWeeklyBonus({
        orders_target: ordersTarget,
        bonus_percent: bonusPercent,
        week_start: bonusForm.week_start
      })
      setBonusResults(result)
      setShowBonusResults(true)
      setShowBonusModal(false)
      loadSummary()
      loadSummaryWeek()
    } catch (error) {
      alert('Error asignando bonos: ' + error.message)
    } finally {
      setAssigningBonus(false)
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
    setCreatingCosts(true)
    try {
      const result = await createSellerCosts()
      alert(`✅ Se crearon ${result.created} costos usando ${result.commission_percent}% de comisión. ${result.skipped > 0 ? `${result.skipped} pedidos ya tenían costo.` : ''}`)
      setShowCostModal(false)
      loadSummary()
      loadSummaryWeek()
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
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowConfigModal(true)} 
            className="button ghost"
          >
            ⚙️ Config (% {commissionPercent})
          </button>
          <button 
            onClick={() => setShowBonusModal(true)} 
            className="button"
            style={{ background: '#ff9800' }}
          >
            🎁 Asignar Bonos
          </button>
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
      
      {/* Sección 3: Mejores Vendedores de la Semana Actual */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          📅 Mejores Vendedores de la Semana Actual
        </h2>
        
        {sellersSummaryWeek.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
              No hay vendedores con pedidos completados esta semana
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
            
            {sellersSummaryWeek.map((item, idx) => (
              <div 
                key={item.seller.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 150px 120px',
                  gap: '12px',
                  padding: '16px 20px',
                  borderBottom: idx < sellersSummaryWeek.length - 1 ? '1px solid #f0f0f0' : 'none',
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
      
      {/* Sección 4: Contabilidad de Vendedores */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          💰 Contabilidad de Vendedores
        </h2>
        
        {sellersSummary.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
              No hay vendedores con costos registrados
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sellersSummary.map((item) => {
              const seller = item.seller
              const isExpanded = expandedSellers.has(seller.id)
              
              return (
                <div key={seller.id} className="card" style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    toggleSeller(seller.id)
                    if (!isExpanded) {
                      loadSellerDebt(seller.id)
                    }
                  }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        {seller.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {item.completed_orders_count} pedidos completados
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>
                        Monto Facturado
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--kivi-green)', fontFamily: 'monospace' }}>
                        {formatCurrency(item.total_revenue)}
                      </div>
                      {allSellerDebts[seller.id] && (
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          marginTop: '4px',
                          color: allSellerDebts[seller.id].pending_debt > 0 ? '#f44336' : '#4caf50',
                          fontFamily: 'monospace'
                        }}>
                          Deuda: {formatCurrency(allSellerDebts[seller.id].pending_debt)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '24px', color: '#999' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                  
                  {isExpanded && sellerDebtData && sellerDebtData.seller.id === seller.id && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '2px solid #e1e7e1'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                            Total Costos
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}>
                            {formatCurrency(sellerDebtData.total_costs)}
                          </div>
                        </div>
                        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                            Total Pagado
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#4caf50', fontFamily: 'monospace' }}>
                            {formatCurrency(sellerDebtData.total_paid)}
                          </div>
                        </div>
                        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                            Deuda Pendiente
                          </div>
                          <div style={{ 
                            fontSize: '20px', 
                            fontWeight: 700, 
                            color: sellerDebtData.pending_debt > 0 ? '#f44336' : '#4caf50',
                            fontFamily: 'monospace' 
                          }}>
                            {formatCurrency(sellerDebtData.pending_debt)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Costos */}
                      {sellerDebtData.costs && sellerDebtData.costs.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Costos Registrados ({sellerDebtData.costs.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sellerDebtData.costs.map((cost, idx) => (
                              <div key={idx} style={{
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>
                                      Pedido #{cost.order_id}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                      {cost.order_date ? new Date(cost.order_date).toLocaleDateString('es-CL') : 'Sin fecha'}
                                    </div>
                                    {cost.commission_percent && (
                                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                        Comisión: {cost.commission_percent}%
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                                      {formatCurrency(cost.cost_amount)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      Venta: {formatCurrency(cost.order_total)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Botones de acción */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {sellerDebtData.pending_debt > 0 && (
                          <button
                            onClick={() => openPaymentModal(seller)}
                            className="button"
                            style={{ flex: 1, background: 'var(--kivi-green)' }}
                          >
                            💵 Registrar Pago
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (showPaymentsForSeller === seller.id) {
                              setShowPaymentsForSeller(null)
                            } else {
                              setShowPaymentsForSeller(seller.id)
                            }
                          }}
                          className="button"
                          disabled={sellerDebtData.total_paid === 0}
                          style={{ 
                            flex: 1,
                            background: showPaymentsForSeller === seller.id ? '#4caf50' : '#2196F3',
                            opacity: sellerDebtData.total_paid === 0 ? 0.5 : 1
                          }}
                        >
                          {showPaymentsForSeller === seller.id ? '👁️ Ocultar Pagos' : '👁️ Ver Pagos'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const weekSummary = await getSellerWeekSummary(seller.id)
                              // Generar PDF del resumen semanal
                              const { jsPDF } = await import('jspdf')
                              const doc = new jsPDF()
                              
                              doc.setFontSize(20)
                              doc.text('Resumen Semanal - Vendedor', 20, 20)
                              doc.setFontSize(14)
                              doc.text(weekSummary.seller_name, 20, 30)
                              
                              const weekStart = new Date(weekSummary.week_start)
                              const weekEnd = new Date(weekSummary.week_end)
                              doc.setFontSize(12)
                              doc.text(
                                `Semana: ${weekStart.toLocaleDateString('es-CL')} - ${weekEnd.toLocaleDateString('es-CL')}`,
                                20,
                                40
                              )
                              
                              let yPos = 55
                              doc.setFontSize(14)
                              doc.text('Cantidad de Pedidos:', 20, yPos)
                              doc.text(weekSummary.orders_count.toString(), 100, yPos)
                              
                              yPos += 10
                              doc.text('Porcentaje de Utilidad:', 20, yPos)
                              doc.text(`${weekSummary.avg_utility_percent.toFixed(2)}%`, 100, yPos)
                              
                              yPos += 10
                              doc.text('Utilidad Total de la Semana:', 20, yPos)
                              doc.text(formatCurrency(weekSummary.total_utility), 100, yPos)
                              
                              doc.save(`resumen_semanal_${seller.name}_${weekSummary.week_start}.pdf`)
                              alert('✅ Resumen descargado')
                            } catch (error) {
                              console.error('Error descargando resumen:', error)
                              alert('Error al descargar resumen: ' + (error.message || 'Error desconocido'))
                            }
                          }}
                          className="button"
                          style={{ 
                            flex: 1,
                            background: '#ff9800'
                          }}
                        >
                          📥 Descargar Resumen Semanal
                        </button>
                      </div>
                      
                      {/* Pagos del vendedor */}
                      {showPaymentsForSeller === seller.id && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e1e7e1' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                            💵 Pagos Registrados
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sellerPayments[seller.id] && sellerPayments[seller.id].length > 0 ? (
                              sellerPayments[seller.id].map((payment) => (
                                <div key={payment.id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px',
                                  background: '#f8f9fa',
                                  borderRadius: '8px'
                                }}>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                      {formatCurrency(payment.amount)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                      {payment.method && `Método: ${payment.method}`}
                                      {payment.date && ` • ${new Date(payment.date).toLocaleDateString('es-CL')}`}
                                    </div>
                                    {payment.reference && (
                                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                        Ref: {payment.reference}
                                      </div>
                                    )}
                                    {payment.notes && (
                                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                        {payment.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No hay pagos registrados
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Estadística Global */}
        {sellersSummary.length > 0 && (
          <div style={{ marginTop: '32px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #e1e7e1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
              📊 Estadística Global (Todo el Periodo)
            </h3>
            {loadingGlobalSummaries ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {sellersSummary.map((item) => {
                  const globalSummary = globalSummaries[item.seller.id]
                  if (!globalSummary) return null
                  
                  return (
                    <div key={item.seller.id} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--kivi-text-dark)' }}>
                        {item.seller.name}
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          Cantidad de Pedidos
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {globalSummary.orders_count}
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          Porcentaje de Utilidad
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--kivi-green)' }}>
                          {globalSummary.avg_utility_percent.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          Utilidad Total
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--kivi-green)' }}>
                          {formatCurrency(globalSummary.total_utility)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modal Configuración */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="⚙️ Configurar Porcentaje de Comisión"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>ℹ️ Nota:</strong> Este porcentaje se aplicará a todos los vendedores al calcular costos automáticamente.
            El cálculo usa el monto total de la nota de cobro (subtotal + envío).
          </div>
          
          <div className="form-group">
            <label className="label">Porcentaje de Comisión (%) *</label>
            <input
              type="number"
              className="input"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              min="0"
              max="100"
              step="0.1"
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Porcentaje que se calculará sobre el total de cada pedido
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowConfigModal(false)}
              className="button ghost"
              disabled={loadingConfig}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateConfig}
              className="button"
              disabled={loadingConfig}
            >
              {loadingConfig ? (
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
            <strong>⚠️ Nota:</strong> Se crearán costos automáticamente para todos los pedidos completados con vendedor que no tengan costo asociado. 
            El costo se calculará como <strong>{commissionPercent}%</strong> del monto total de la nota de cobro (subtotal + envío).
            Solo se creará un costo por pedido.
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCostModal(false)}
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
      
      {/* Modal Registrar Pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`💵 Registrar Pago - ${selectedSellerForPayment?.name || ''}`}
      >
        {sellerDebtData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Costos:</span>
                <strong>{formatCurrency(sellerDebtData.total_costs)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Pagado:</span>
                <strong style={{ color: '#4caf50' }}>{formatCurrency(sellerDebtData.total_paid)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e1e7e1' }}>
                <span style={{ fontWeight: 700 }}>Deuda Pendiente:</span>
                <strong style={{ 
                  color: sellerDebtData.pending_debt > 0 ? '#f44336' : '#4caf50',
                  fontSize: '18px'
                }}>
                  {formatCurrency(sellerDebtData.pending_debt)}
                </strong>
              </div>
            </div>
            
            <div className="form-group">
              <label className="label">Monto *</label>
              <input
                type="number"
                className="input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder={sellerDebtData.pending_debt.toString()}
                min="1"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label className="label">Método de Pago</label>
              <select
                className="input"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="label">Referencia</label>
              <input
                type="text"
                className="input"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Número de transferencia, etc."
              />
            </div>
            
            <div className="form-group">
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="label">Notas</label>
              <textarea
                className="input"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="button ghost"
                disabled={creatingPayment}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePayment}
                className="button"
                disabled={creatingPayment}
                style={{ background: 'var(--kivi-green)' }}
              >
                {creatingPayment ? (
                  <>
                    <div className="loading"></div>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>💵</span>
                    <span>Registrar Pago</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal Asignar Bonos */}
      <Modal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        title="🎁 Asignar Bonos Semanales"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: '#fff3e0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>⚠️ Importante:</strong> Solo se consideran pedidos completados de la semana especificada.
            Si un vendedor alcanza la meta, se actualizará el porcentaje de comisión para los pedidos de esa semana.
          </div>
          
          <div className="form-group">
            <label className="label">Semana (Lunes) *</label>
            <input
              type="date"
              className="input"
              value={bonusForm.week_start}
              onChange={(e) => {
                const date = new Date(e.target.value)
                const day = date.getDay()
                const diff = date.getDate() - day + (day === 0 ? -6 : 1)
                const monday = new Date(date.setDate(diff))
                setBonusForm({ ...bonusForm, week_start: monday.toISOString().split('T')[0] })
              }}
            />
          </div>
          
          <div className="form-group">
            <label className="label">Meta de Pedidos *</label>
            <input
              type="number"
              className="input"
              value={bonusForm.orders_target}
              onChange={(e) => setBonusForm({ ...bonusForm, orders_target: e.target.value })}
              placeholder="5"
              min="1"
              step="1"
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Cantidad mínima de pedidos completados en esa semana para obtener el bono
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Porcentaje de Bono (%) *</label>
            <input
              type="number"
              className="input"
              value={bonusForm.bonus_percent}
              onChange={(e) => setBonusForm({ ...bonusForm, bonus_percent: e.target.value })}
              placeholder="5"
              min="0"
              step="0.1"
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Porcentaje adicional que se sumará al porcentaje base ({commissionPercent}%)
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowBonusModal(false)}
              className="button ghost"
              disabled={assigningBonus}
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignBonus}
              className="button"
              disabled={assigningBonus}
              style={{ background: '#ff9800' }}
            >
              {assigningBonus ? (
                <>
                  <div className="loading"></div>
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <span>🎁</span>
                  <span>Asignar Bonos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal Resultados de Bonos */}
      {showBonusResults && bonusResults && (
        <Modal
          isOpen={showBonusResults}
          onClose={() => {
            setShowBonusResults(false)
            setBonusResults(null)
          }}
          title="🎁 Resultados de Bonos Asignados"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px',
              background: '#e8f5e9',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Semana:</strong> {bonusResults.week_start ? new Date(bonusResults.week_start).toLocaleDateString('es-CL') : 'N/A'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Meta:</strong> {bonusResults.orders_target} pedidos
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Porcentaje Base:</strong> {bonusResults.base_commission_percent}%
              </div>
              <div>
                <strong>Porcentaje Final:</strong> {bonusResults.final_commission_percent}% (base + {bonusResults.bonus_percent}% bono)
              </div>
            </div>
            
            {bonusResults.recipients && bonusResults.recipients.length > 0 ? (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                  Vendedores que Obtuvieron Bono ({bonusResults.count})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {bonusResults.recipients.map((recipient, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e1e7e1'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                        {recipient.seller.name}
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginBottom: '12px',
                        fontSize: '14px'
                      }}>
                        <div>
                          <strong>Pedidos Alcanzados:</strong> {recipient.orders_achieved} / {recipient.orders_target}
                        </div>
                        <div>
                          <strong>Monto Facturado:</strong> {formatCurrency(recipient.week_revenue)}
                        </div>
                        <div>
                          <strong>Comisión Base:</strong> {formatCurrency(recipient.base_commission)}
                        </div>
                        <div>
                          <strong>Bono:</strong> {formatCurrency(recipient.bonus_amount)}
                        </div>
                        <div>
                          <strong>Comisión Final:</strong> {formatCurrency(recipient.final_commission)}
                        </div>
                        <div>
                          <strong>% Comisión:</strong> {recipient.commission_percent}%
                        </div>
                      </div>
                      
                      {recipient.updated_costs && recipient.updated_costs.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e1e7e1' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Costos Actualizados ({recipient.updated_costs.length} pedidos):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                            {recipient.updated_costs.map((cost, costIdx) => (
                              <div key={costIdx} style={{ padding: '6px', background: '#fff', borderRadius: '4px' }}>
                                Pedido #{cost.order_id}: {formatCurrency(cost.old_amount)} → {formatCurrency(cost.new_amount)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {recipient.orders && recipient.orders.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e1e7e1' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Pedidos de la Semana:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                            {recipient.orders.map((order, orderIdx) => (
                              <div key={orderIdx} style={{ padding: '6px', background: '#fff', borderRadius: '4px' }}>
                                Pedido #{order.order_id}: {formatCurrency(order.order_total)}
                                {order.order_date && ` (${new Date(order.order_date).toLocaleDateString('es-CL')})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No hay vendedores que hayan alcanzado la meta
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setShowBonusResults(false)
                  setBonusResults(null)
                }}
                className="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

