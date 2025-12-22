/**
 * Página: Monto Facturado por Vendedores
 * Muestra gráfico y permite filtrar por mejores/peores vendedores
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import { fetchKPIByWeek, fetchRevenueBySeller } from '../api/kpis'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatWeekRange = (weekStart) => {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  const startStr = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  
  return `${startStr} - ${endStr}`
}

export default function RevenueBySeller() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [data, setData] = useState(null)
  const [sellersData, setSellersData] = useState(null)
  const [viewMode, setViewMode] = useState('graph') // 'graph' o 'sellers'
  const [filter, setFilter] = useState('historical') // 'last_week' o 'historical'
  const [filterMode, setFilterMode] = useState('all') // 'all', 'top', 'bottom'
  const [filterCount, setFilterCount] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (viewMode === 'sellers') {
      loadSellersData()
    }
  }, [viewMode, filter, filterMode, filterCount])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchKPIByWeek('revenue_by_seller')
      setData(result)
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error cargando datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSellersData = async () => {
    setLoadingSellers(true)
    try {
      const result = await fetchRevenueBySeller(filter, filterMode, filterCount)
      setSellersData(result)
    } catch (error) {
      console.error('Error cargando datos de vendedores:', error)
      alert('Error cargando datos de vendedores: ' + error.message)
    } finally {
      setLoadingSellers(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }

  if (!data || !data.weeks || data.weeks.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => navigate('/kpis')} className="button ghost">
            ← Volver a KPIs
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
            No hay datos disponibles para este KPI
          </p>
        </div>
      </div>
    )
  }

  const weeks = data.weeks
  const values = weeks.map(w => w.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1

  // Dimensiones del gráfico
  const width = 1000
  const height = 400
  const padding = { top: 40, right: 40, bottom: 60, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calcular puntos
  const points = values.map((value, index) => {
    const x = padding.left + (index / (values.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight
    return { x, y, value, week: weeks[index] }
  })

  // Crear path para la línea
  const linePath = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  }).join(' ')

  // Calcular estadísticas
  const total = values.reduce((a, b) => a + b, 0)
  const average = total / values.length
  const latest = values[values.length - 1]
  const previous = values.length > 1 ? values[values.length - 2] : latest
  const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/kpis')} className="button ghost" style={{ marginBottom: '16px' }}>
          ← Volver a KPIs
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
          💰 Monto Facturado por Vendedores
        </h1>
      </div>

      {/* Toggle entre gráfico y vendedores */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          className={viewMode === 'graph' ? 'button' : 'button ghost'}
          onClick={() => setViewMode('graph')}
        >
          📊 Gráfico
        </button>
        <button
          className={viewMode === 'sellers' ? 'button' : 'button ghost'}
          onClick={() => setViewMode('sellers')}
        >
          👥 Vendedores
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Último Valor
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4caf50' }}>
            {formatCurrency(latest)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Promedio
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>
            {formatCurrency(average)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Cambio vs Semana Anterior
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: change >= 0 ? 'var(--kivi-green)' : '#f44336' }}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Total de Semanas
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>
            {weeks.length}
          </div>
        </div>
      </div>

      {/* Vista de gráfico */}
      {viewMode === 'graph' && (
        <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
            Evolución Semana a Semana
          </h2>
          
          <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
            {/* Ejes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#ddd"
              strokeWidth="2"
            />
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#ddd"
              strokeWidth="2"
            />

            {/* Grid horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight - (ratio * chartHeight)
              const value = minValue + (ratio * range)
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#666"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              )
            })}

            {/* Línea del gráfico */}
            <path
              d={linePath}
              fill="none"
              stroke="#4caf50"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Puntos */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#4caf50"
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                />
                <title>
                  {formatWeekRange(point.week.week_start)}: {formatCurrency(point.value)}
                </title>
              </g>
            ))}

            {/* Etiquetas de semanas */}
            {points.map((point, index) => {
              const showLabel = index % Math.ceil(points.length / 8) === 0 || index === points.length - 1
              if (!showLabel) return null
              
              return (
                <text
                  key={index}
                  x={point.x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                  transform={`rotate(-45 ${point.x} ${height - padding.bottom + 20})`}
                >
                  {formatWeekRange(point.week.week_start)}
                </text>
              )
            })}
          </svg>

          {/* Leyenda */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '3px', background: '#4caf50' }}></div>
              <span>Monto Facturado por Vendedores</span>
            </div>
          </div>
        </div>
      )}

      {/* Vista de vendedores */}
      {viewMode === 'sellers' && (
        <div>
          {/* Filtros */}
          <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Filtros
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Período
                </label>
                <select
                  className="input"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="last_week">Última Semana</option>
                  <option value="historical">Histórico</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Tipo de Filtro
                </label>
                <select
                  className="input"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="all">Todos</option>
                  <option value="top">Mejores X</option>
                  <option value="bottom">Peores X</option>
                </select>
              </div>
              {(filterMode === 'top' || filterMode === 'bottom') && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={filterCount}
                    onChange={(e) => setFilterCount(parseInt(e.target.value) || 10)}
                    min="1"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabla de vendedores */}
          {loadingSellers ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader />
            </div>
          ) : sellersData && sellersData.sellers && sellersData.sellers.length > 0 ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Vendedores
                </h3>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#4caf50' }}>
                  Total: {formatCurrency(sellersData.total_revenue)}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e1e7e1' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Vendedor</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Monto Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {sellersData.sellers.map((seller, idx) => (
                    <tr key={seller.seller_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>
                        {seller.seller_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(seller.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
                No hay vendedores para mostrar
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

