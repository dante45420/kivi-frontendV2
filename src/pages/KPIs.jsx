/**
 * Página: KPIs Simplificados
 * Dashboard con métricas básicas del negocio
 */
import { useState, useEffect } from 'react'
import Loader from '../components/Loader'

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
  
  useEffect(() => {
    loadKPIs()
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
        <div className="card">
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
        lineHeight: 1.6
      }}>
        <strong>📝 Nota:</strong> Los KPIs se calculan usando los datos registrados en el sistema. 
        La utilidad promedio solo considera pedidos que tienen el costo registrado en los items 
        (pedidos registrados después de implementar esta funcionalidad).
      </div>
    </div>
  )
}
