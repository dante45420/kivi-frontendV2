/**
 * Página: KPIs Simplificados
 * Dashboard con métricas básicas del negocio
 */
import { useState, useEffect } from 'react'
import Loader from '../components/Loader'
import { createWeeklyCost } from '../api/weeklyCosts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function KPIs() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    avg_order_value: 0,
    total_customers: 0,
    total_orders: 0,
    avg_utility_percent: 0,
    avg_utility_amount: 0,
    avg_orders_per_week: 0
  })
  const [showUtilityDetails, setShowUtilityDetails] = useState(false)
  const [utilityDetails, setUtilityDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [editingCost, setEditingCost] = useState(null) // { itemId, orderIdx, itemIdx, currentCost }
  const [newCostValue, setNewCostValue] = useState('')
  const [savingCost, setSavingCost] = useState(false)
  const [utilityByWeek, setUtilityByWeek] = useState(null)
  const [loadingUtilityByWeek, setLoadingUtilityByWeek] = useState(false)
  const [showCreateCostModal, setShowCreateCostModal] = useState(false)
  const [newCostForm, setNewCostForm] = useState({
    week_start: '',
    category: '',
    amount: '',
    description: ''
  })
  const [creatingCost, setCreatingCost] = useState(false)
  
  useEffect(() => {
    loadKPIs()
    loadUtilityByWeek()
  }, [])
  
  const loadKPIs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/kpis`)
      if (!response.ok) {
        throw new Error('Error cargando KPIs')
      }
      const data = await response.json()
      setKpis(data)
    } catch (error) {
      console.error('Error cargando KPIs:', error)
      alert('Error cargando KPIs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }
  
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea 0
    return new Date(d.setDate(diff))
  }
  
  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  
  const loadUtilityByWeek = async () => {
    setLoadingUtilityByWeek(true)
    try {
      const response = await fetch(`${API_URL}/api/kpis/utility-by-week`)
      if (!response.ok) {
        throw new Error('Error cargando utilidad por semana')
      }
      const data = await response.json()
      setUtilityByWeek(data)
    } catch (error) {
      console.error('Error cargando utilidad por semana:', error)
      alert('Error cargando utilidad por semana: ' + error.message)
    } finally {
      setLoadingUtilityByWeek(false)
    }
  }
  
  const handleCreateCost = async () => {
    if (!newCostForm.week_start || !newCostForm.category || !newCostForm.amount) {
      alert('⚠️ Completa todos los campos requeridos')
      return
    }
    
    const amount = parseInt(newCostForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('⚠️ El monto debe ser un número positivo')
      return
    }
    
    setCreatingCost(true)
    try {
      await createWeeklyCost({
        week_start: newCostForm.week_start,
        category: newCostForm.category,
        amount: amount,
        description: newCostForm.description || null
      })
      
      alert('✅ Costo creado exitosamente')
      setShowCreateCostModal(false)
      setNewCostForm({ week_start: '', category: '', amount: '', description: '' })
      await loadUtilityByWeek()
    } catch (error) {
      console.error('Error creando costo:', error)
      alert('Error: ' + error.message)
    } finally {
      setCreatingCost(false)
    }
  }
  
  const loadUtilityDetails = async () => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`${API_URL}/api/kpis/utility-details`)
      if (!response.ok) {
        throw new Error('Error cargando detalles')
      }
      const data = await response.json()
      setUtilityDetails(data)
      setShowUtilityDetails(true)
    } catch (error) {
      console.error('Error cargando detalles:', error)
      alert('Error cargando detalles: ' + error.message)
    } finally {
      setLoadingDetails(false)
    }
  }
  
  const startEditCost = (itemId, orderIdx, itemIdx, currentCost) => {
    setEditingCost({ itemId, orderIdx, itemIdx })
    setNewCostValue(currentCost ? currentCost.toString() : '')
  }
  
  const cancelEditCost = () => {
    setEditingCost(null)
    setNewCostValue('')
  }
  
  const saveCost = async () => {
    if (!editingCost || !newCostValue) {
      alert('Ingresa un costo válido')
      return
    }
    
    const cost = parseFloat(newCostValue)
    if (isNaN(cost) || cost < 0) {
      alert('El costo debe ser un número positivo')
      return
    }
    
    setSavingCost(true)
    try {
      const response = await fetch(`${API_URL}/api/orders/items/${editingCost.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: cost })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error actualizando costo')
      }
      
      // Actualizar el costo en el estado local
      const updatedOrders = [...utilityDetails.orders]
      const order = updatedOrders[editingCost.orderIdx]
      const item = order.items[editingCost.itemIdx]
      
      // Recalcular valores del item
      const qtyToCharge = item.charged_qty || item.qty
      item.cost = cost
      item.item_cost = qtyToCharge * cost
      item.item_utility = item.item_revenue - item.item_cost
      item.item_utility_percent = item.item_revenue > 0 ? (item.item_utility / item.item_revenue * 100) : 0
      
      // Recalcular totales del pedido
      order.order_cost = order.items.reduce((sum, i) => {
        const qty = i.charged_qty || i.qty
        return sum + (qty * (i.id === editingCost.itemId ? cost : i.cost))
      }, 0)
      order.utility_amount = order.order_total - order.order_cost
      order.utility_percent = order.order_total > 0 ? (order.utility_amount / order.order_total * 100) : 0
      
      setUtilityDetails({ ...utilityDetails, orders: updatedOrders })
      setEditingCost(null)
      setNewCostValue('')
      
      // Recargar KPIs para actualizar el promedio
      await loadKPIs()
      
      alert('✅ Costo actualizado correctamente')
    } catch (error) {
      console.error('Error guardando costo:', error)
      alert('Error: ' + error.message)
    } finally {
      setSavingCost(false)
    }
  }
  
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800,
          margin: 0
        }}>
          📊 KPIs
        </h1>
        
        <button
          onClick={loadKPIs}
          className="button"
        >
          🔄 Actualizar
        </button>
      </div>
      
      {/* Main KPIs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Promedio de tamaño de pedido */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Promedio de Tamaño de Pedido
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {formatCurrency(kpis.avg_order_value)}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Promedio por pedido (con conversiones)
          </div>
        </div>
        
        {/* Total Clientes */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Total Clientes
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {kpis.total_customers}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Clientes registrados
          </div>
        </div>
        
        {/* Total Pedidos */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Total Pedidos
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {kpis.total_orders}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Pedidos con monto facturado &gt; 0
          </div>
        </div>
        
        {/* Utilidad Promedio por Pedido - Porcentaje */}
        <div 
          className="card" 
          onClick={loadUtilityDetails}
          style={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = ''
          }}
        >
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Utilidad Promedio por Pedido
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px', color: 'var(--kivi-green)' }}>
            {formatPercent(kpis.avg_utility_percent)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--kivi-green)', marginTop: '8px' }}>
            {formatCurrency(kpis.avg_utility_amount)}
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
            Solo pedidos con costo registrado
          </div>
          <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '8px', fontWeight: 600 }}>
            👆 Click para ver detalles
          </div>
        </div>
        
        {/* Promedio de Pedidos por Semana */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Pedidos Promedio por Semana
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {kpis.avg_orders_per_week.toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Últimos 30 días / 4 semanas
          </div>
        </div>
      </div>
      
      {/* Info Note */}
      <div style={{
        padding: '16px',
        background: '#FFF4E5',
        borderRadius: 'var(--radius)',
        fontSize: '14px',
        color: '#666',
        lineHeight: 1.6,
        marginBottom: '32px'
      }}>
        <strong>📝 Nota:</strong> Los KPIs se calculan usando los datos registrados en el sistema. 
        La utilidad promedio solo considera pedidos que tienen el costo registrado en los items 
        (pedidos registrados después de implementar esta funcionalidad).
      </div>
      
      {/* Utilidad por Semana */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
            📅 Utilidad por Semana
          </h2>
          <button
            onClick={() => {
              // Por defecto, usar la última semana registrada o la semana actual
              const defaultWeek = utilityByWeek?.last_week?.week_start || 
                new Date().toISOString().split('T')[0]
              setNewCostForm({
                week_start: defaultWeek,
                category: '',
                amount: '',
                description: ''
              })
              setShowCreateCostModal(true)
            }}
            className="button"
          >
            ➕ Crear Costo
          </button>
        </div>
        
        {loadingUtilityByWeek ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader />
          </div>
        ) : utilityByWeek && utilityByWeek.weeks && utilityByWeek.weeks.length > 0 ? (
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e1e7e1',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr 1fr 1fr 1fr 1fr',
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
              <div>Semana</div>
              <div style={{ textAlign: 'right' }}>Utilidad Pedidos</div>
              <div style={{ textAlign: 'right' }}>Costos</div>
              <div style={{ textAlign: 'right' }}>Resultado Final</div>
              <div style={{ textAlign: 'center' }}>Pedidos</div>
              <div style={{ textAlign: 'center' }}>Detalles</div>
            </div>
            
            {utilityByWeek.weeks.map((week, idx) => {
              const isLastWeek = idx === utilityByWeek.weeks.length - 1
              const weekStartDate = new Date(week.week_start)
              const weekEndDate = new Date(weekStartDate)
              weekEndDate.setDate(weekEndDate.getDate() + 6)
              
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 1fr 1fr 1fr 1fr',
                    gap: '12px',
                    padding: '16px 20px',
                    borderBottom: idx < utilityByWeek.weeks.length - 1 ? '1px solid #f0f0f0' : 'none',
                    background: isLastWeek ? '#f0f7ff' : '#fff',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {formatWeekRange(week.week_start)}
                    {isLastWeek && <span style={{ fontSize: '11px', color: '#4caf50', marginLeft: '6px' }}>(Última)</span>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 700, color: 'var(--kivi-green)', fontFamily: 'monospace' }}>
                    {formatCurrency(week.orders_utility)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#f44336' }}>
                      {formatCurrency(week.weekly_costs_total)}
                    </div>
                    {Object.keys(week.weekly_costs).length > 0 && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        {Object.entries(week.weekly_costs).map(([cat, data]) => (
                          <div key={cat}>
                            {cat}: {formatCurrency(data.amount)} ({data.count}x)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: week.final_result >= 0 ? 'var(--kivi-green)' : '#f44336' }}>
                    {formatCurrency(week.final_result)}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                    {week.orders_count}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setNewCostForm({
                          week_start: week.week_start,
                          category: '',
                          amount: '',
                          description: ''
                        })
                        setShowCreateCostModal(true)
                      }}
                      className="button button-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      ➕ Costo
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No hay datos de utilidad por semana
          </div>
        )}
      </div>
      
      {/* Modal Crear Costo */}
      {showCreateCostModal && (
        <>
          <div 
            onClick={() => setShowCreateCostModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '95%',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700 }}>
              ➕ Crear Costo Semanal
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Semana (Lunes) *
                </label>
                <input
                  type="date"
                  className="input"
                  value={newCostForm.week_start}
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    // Ajustar al lunes de esa semana
                    const day = date.getDay()
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
                    const monday = new Date(date.setDate(diff))
                    setNewCostForm({ ...newCostForm, week_start: monday.toISOString().split('T')[0] })
                  }}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Categoría *
                </label>
                <select
                  className="input"
                  value={newCostForm.category}
                  onChange={(e) => setNewCostForm({ ...newCostForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Envíos">Envíos</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Afiliados">Afiliados</option>
                  <option value="Cajas Envíos">Cajas Envíos</option>
                  <option value="Cajas Fruta">Cajas Fruta</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Monto *
                </label>
                <input
                  type="number"
                  className="input"
                  value={newCostForm.amount}
                  onChange={(e) => setNewCostForm({ ...newCostForm, amount: e.target.value })}
                  placeholder="15000"
                  min="1"
                  step="1"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Descripción (opcional)
                </label>
                <textarea
                  className="input"
                  value={newCostForm.description}
                  onChange={(e) => setNewCostForm({ ...newCostForm, description: e.target.value })}
                  placeholder="Descripción del costo..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateCostModal(false)
                  setNewCostForm({ week_start: '', category: '', amount: '', description: '' })
                }}
                className="button ghost"
                style={{ minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCost}
                className="button"
                style={{ minWidth: '120px' }}
                disabled={creatingCost}
              >
                {creatingCost ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Modal de Detalles de Utilidad */}
      {showUtilityDetails && (
        <>
          <div 
            onClick={() => setShowUtilityDetails(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '85vh',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                📊 Detalles de Utilidad por Pedido
              </h2>
              <button 
                onClick={() => setShowUtilityDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.5,
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ 
              maxHeight: 'calc(85vh - 140px)',
              overflowY: 'auto',
              padding: '16px 24px'
            }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader />
                </div>
              ) : utilityDetails && utilityDetails.orders && utilityDetails.orders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ 
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    Total: {utilityDetails.total_orders} pedidos con utilidad calculada
                  </div>
                  
                  {utilityDetails.orders.map((order, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {/* Header del Pedido */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                            Pedido #{order.order_id}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {order.order_date ? new Date(order.order_date).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Sin fecha'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kivi-green)' }}>
                            {formatPercent(order.utility_percent)}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {formatCurrency(order.utility_amount)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Items del Pedido */}
                      <div style={{ marginBottom: '12px' }}>
                        {order.items.map((item, itemIdx) => (
                          <div key={itemIdx} style={{
                            padding: '10px',
                            background: '#fff',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            fontSize: '13px'
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                              {item.product_name}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#666' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>Cantidad:</span> {item.charged_qty || item.qty} {item.charged_unit || item.unit}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600 }}>Precio:</span> {formatCurrency(item.unit_price)}/{item.charged_unit || item.unit}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600 }}>Costo:</span>
                                {editingCost && editingCost.itemId === item.item_id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                      type="number"
                                      value={newCostValue}
                                      onChange={(e) => setNewCostValue(e.target.value)}
                                      style={{
                                        width: '80px',
                                        padding: '4px 6px',
                                        border: '1px solid #4caf50',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={saveCost}
                                      disabled={savingCost}
                                      style={{
                                        padding: '4px 8px',
                                        background: '#4caf50',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: savingCost ? 'not-allowed' : 'pointer',
                                        opacity: savingCost ? 0.6 : 1
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEditCost}
                                      style={{
                                        padding: '4px 8px',
                                        background: '#999',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span>{formatCurrency(item.cost)}/{item.charged_unit || item.unit}</span>
                                    <button
                                      onClick={() => startEditCost(item.item_id, idx, itemIdx, item.cost)}
                                      style={{
                                        padding: '2px 6px',
                                        background: 'transparent',
                                        border: '1px solid #4caf50',
                                        color: '#4caf50',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        cursor: 'pointer',
                                        marginLeft: '4px'
                                      }}
                                      title="Editar costo"
                                    >
                                      ✏️
                                    </button>
                                  </>
                                )}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600 }}>Utilidad:</span> {formatPercent(item.item_utility_percent)}
                              </div>
                            </div>
                            <div style={{ 
                              marginTop: '6px', 
                              paddingTop: '6px', 
                              borderTop: '1px solid #f0f0f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '12px'
                            }}>
                              <span>Ingreso: <strong>{formatCurrency(item.item_revenue)}</strong></span>
                              <span>Costo: <strong>{formatCurrency(item.item_cost)}</strong></span>
                              <span style={{ color: 'var(--kivi-green)' }}>
                                Utilidad: <strong>{formatCurrency(item.item_utility)}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Totales del Pedido */}
                      <div style={{
                        padding: '12px',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                          <div><strong>Subtotal:</strong> {formatCurrency(order.subtotal)}</div>
                          <div><strong>Envío:</strong> {formatCurrency(order.shipping_amount)}</div>
                          <div><strong>Total Ingresos:</strong> {formatCurrency(order.order_total)}</div>
                          <div><strong>Total Costos:</strong> {formatCurrency(order.order_cost)}</div>
                        </div>
                        <div style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '2px solid #e0e0e0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '16px',
                          fontWeight: 700
                        }}>
                          <span>Utilidad Total:</span>
                          <span style={{ color: 'var(--kivi-green)' }}>
                            {formatCurrency(order.utility_amount)} ({formatPercent(order.utility_percent)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No hay pedidos con utilidad calculada
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
