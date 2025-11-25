/**
 * Página: KPIs y Métricas Avanzadas
 * Dashboard con métricas de conversión, clicks, pedidos, etc.
 */
import { useState, useEffect } from 'react'
import { fetchOrders, fetchOrder } from '../api/orders'
import { fetchCustomers } from '../api/customers'
import { fetchProducts } from '../api/products'
import Loader from '../components/Loader'

export default function KPIs() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week') // week, month, all
  
  // Data
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  
  // Calculated metrics
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    conversionRate: 0,
    topProducts: [],
    ordersGrowth: 0,
    revenueGrowth: 0,
    avgProductUtilityPercent: 0,
    avgOrderUtilityPercent: 0,
    avgOrderUtilityAmount: 0,
    avgOrdersPerWeek: 0,
    catalogViews: 0, // TODO: Implementar tracking
    catalogClicks: 0, // TODO: Implementar tracking
    clickToOrderRate: 0
  })
  
  useEffect(() => {
    loadData()
  }, [period])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        fetchOrders(),
        fetchCustomers(),
        fetchProducts()
      ])
      
      // Cargar items de cada pedido para cálculos correctos
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          try {
            const data = await fetchOrder(order.id)
            return { ...order, items: data.items || [], total: data.total || 0 }
          } catch {
            return { ...order, items: [], total: 0 }
          }
        })
      )
      
      setOrders(ordersWithItems)
      setCustomers(customersData)
      setProducts(productsData)
      
      calculateMetrics(ordersWithItems, customersData, productsData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }
  
  const calculateMetrics = (ordersData, customersData, productsData) => {
    const now = new Date()
    const periodStart = getPeriodStart(period, now)
    
    // Filtrar orders por período
    const periodOrders = ordersData.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= periodStart
    })
    
    const totalOrders = periodOrders.length
    const totalRevenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Top productos (por cantidad de orders)
    const productCounts = {}
    periodOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const productId = item.product_id
        if (!productCounts[productId]) {
          productCounts[productId] = {
            product: item.product,
            count: 0,
            revenue: 0
          }
        }
        productCounts[productId].count += item.qty
        productCounts[productId].revenue += (item.qty * item.unit_price)
      })
    })
    
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    
    // Conversión (estimado basado en clientes únicos vs total clientes)
    const uniqueCustomersInPeriod = new Set(periodOrders.map(o => o.customer_id)).size
    const conversionRate = customersData.length > 0 
      ? (uniqueCustomersInPeriod / customersData.length) * 100 
      : 0
    
    // Growth (comparar con período anterior)
    const previousPeriodStart = getPeriodStart(period, periodStart)
    const previousPeriodOrders = ordersData.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= previousPeriodStart && orderDate < periodStart
    })
    
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    
    const ordersGrowth = previousPeriodOrders.length > 0 
      ? ((totalOrders - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 
      : 0
    
    // Calcular utilidad por producto (promedio de porcentaje)
    const productUtilities = []
    if (Array.isArray(productsData)) {
      productsData.forEach(product => {
        if (product && product.sale_price && product.purchase_price && product.sale_price > 0) {
          const utility = ((product.sale_price - product.purchase_price) / product.sale_price) * 100
          productUtilities.push(utility)
        }
      })
    }
    const avgProductUtilityPercent = productUtilities.length > 0
      ? productUtilities.reduce((sum, u) => sum + u, 0) / productUtilities.length
      : 0
    
    // Calcular utilidad por pedido (porcentaje y número real)
    const orderUtilities = []
    if (Array.isArray(periodOrders)) {
      periodOrders.forEach(order => {
        if (!order || !order.items) return
        
        let orderRevenue = 0
        let orderCost = 0
        
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (!item || !item.product_id) return
            const product = Array.isArray(productsData) ? productsData.find(p => p && p.id === item.product_id) : null
            if (product) {
              const qty = item.charged_qty || item.qty || 0
              const unitPrice = item.unit_price || 0
              const purchasePrice = product.purchase_price || 0
              const itemRevenue = qty * unitPrice
              const itemCost = qty * purchasePrice
              orderRevenue += itemRevenue
              orderCost += itemCost
            }
          })
        }
        
        if (orderRevenue > 0) {
          const utilityAmount = orderRevenue - orderCost
          const utilityPercent = (utilityAmount / orderRevenue) * 100
          orderUtilities.push({
            amount: utilityAmount,
            percent: utilityPercent
          })
        }
      })
    }
    
    const avgOrderUtilityPercent = orderUtilities.length > 0
      ? orderUtilities.reduce((sum, u) => sum + u.percent, 0) / orderUtilities.length
      : 0
    
    const avgOrderUtilityAmount = orderUtilities.length > 0
      ? orderUtilities.reduce((sum, u) => sum + u.amount, 0) / orderUtilities.length
      : 0
    
    // Calcular promedio de pedidos por semana
    const weeksMap = new Map()
    if (Array.isArray(periodOrders)) {
      periodOrders.forEach(order => {
        if (order && order.created_at) {
          try {
            const orderDate = new Date(order.created_at)
            if (!isNaN(orderDate.getTime())) {
              const weekKey = `${orderDate.getFullYear()}-W${getWeekNumber(orderDate)}`
              const currentCount = weeksMap.get(weekKey) || 0
              weeksMap.set(weekKey, currentCount + 1)
            }
          } catch (err) {
            console.warn('Error procesando fecha de pedido:', err, order)
          }
        }
      })
    }
    
    const avgOrdersPerWeek = weeksMap.size > 0
      ? Array.from(weeksMap.values()).reduce((sum, count) => sum + count, 0) / weeksMap.size
      : 0
    
    setMetrics({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalCustomers: customersData.length,
      conversionRate,
      topProducts,
      ordersGrowth,
      revenueGrowth,
      avgProductUtilityPercent,
      avgOrderUtilityPercent,
      avgOrderUtilityAmount,
      avgOrdersPerWeek,
      catalogViews: 0, // Placeholder
      catalogClicks: 0, // Placeholder
      clickToOrderRate: 0 // Placeholder
    })
  }
  
  const getPeriodStart = (periodType, fromDate) => {
    const date = new Date(fromDate)
    
    switch (periodType) {
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
      case 'all':
        return new Date(0) // Desde el principio
      default:
        date.setDate(date.getDate() - 7)
    }
    
    return date
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
          📊 KPIs & Métricas
        </h1>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPeriod('week')}
            className={`button ${period === 'week' ? '' : 'ghost'}`}
          >
            Última semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`button ${period === 'month' ? '' : 'ghost'}`}
          >
            Último mes
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`button ${period === 'all' ? '' : 'ghost'}`}
          >
            Todo el tiempo
          </button>
        </div>
      </div>
      
      {/* Main KPIs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Total Pedidos */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Total Pedidos
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {metrics.totalOrders}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: metrics.ordersGrowth >= 0 ? 'var(--kivi-green)' : '#E57373',
            fontWeight: 700
          }}>
            {formatPercent(metrics.ordersGrowth)} vs período anterior
          </div>
        </div>
        
        {/* Ingresos Totales */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Ingresos Totales
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: metrics.revenueGrowth >= 0 ? 'var(--kivi-green)' : '#E57373',
            fontWeight: 700
          }}>
            {formatPercent(metrics.revenueGrowth)} vs período anterior
          </div>
        </div>
        
        {/* Valor Promedio Pedido */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Valor Promedio Pedido
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {formatCurrency(metrics.avgOrderValue)}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Promedio por pedido
          </div>
        </div>
        
        {/* Total Clientes */}
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Total Clientes
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {metrics.totalCustomers}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Clientes registrados
          </div>
        </div>
      </div>
      
      {/* Secondary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Conversión */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            🎯 Tasa de Conversión
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
            {metrics.conversionRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Clientes que realizaron pedidos en el período
          </div>
        </div>
        
        {/* Click to Order */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            🖱️ Click a Pedido
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
            {metrics.clickToOrderRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            ⚠️ Implementar tracking de clicks en catálogo
          </div>
        </div>
        
        {/* Promedio de Utilidad por Producto */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            📊 Utilidad Promedio por Producto
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
            {metrics.avgProductUtilityPercent.toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Margen promedio de todos los productos
          </div>
        </div>
        
        {/* Promedio de Utilidad por Pedido */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            💰 Utilidad Promedio por Pedido
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
            {metrics.avgOrderUtilityPercent.toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
            Margen promedio en porcentaje
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--kivi-green)' }}>
            {formatCurrency(metrics.avgOrderUtilityAmount)}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Utilidad promedio en pesos
          </div>
        </div>
        
        {/* Promedio de Pedidos por Semana */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            📅 Pedidos Promedio por Semana
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
            {metrics.avgOrdersPerWeek.toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: '#999' }}>
            Cantidad promedio de pedidos por semana
          </div>
        </div>
      </div>
      
      {/* Top Products */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          🏆 Top 5 Productos por Ingresos
        </h3>
        
        {metrics.topProducts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.topProducts.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid var(--kivi-green)`
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px'
                }}>
                  {idx + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                    {item.product?.name || 'Producto desconocido'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {item.count} unidades vendidas
                  </div>
                </div>
                
                <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--kivi-green)' }}>
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#999',
            fontSize: '14px'
          }}>
            No hay datos de productos en este período
          </div>
        )}
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
        <strong>📝 Nota:</strong> Algunas métricas como "Click a Pedido" requieren implementar 
        tracking de eventos en el catálogo web. Esto se puede agregar con Google Analytics 
        o un sistema de tracking personalizado.
      </div>
    </div>
  )
}

