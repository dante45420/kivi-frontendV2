/**
 * Página: Detalle de KPI
 * Muestra gráfico y resumen detallado de un KPI específico
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import { fetchKPIByWeek } from '../api/kpis'

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

const formatWeekRange = (weekStart) => {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  const startStr = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  
  return `${startStr} - ${endStr}`
}

const KPI_CONFIG = {
  avg_order_value: {
    title: 'Promedio de Tamaño de Pedido',
    format: formatCurrency,
    color: '#4caf50'
  },
  new_customers: {
    title: 'Nuevos Clientes',
    format: (v) => Math.round(v),
    color: '#2196f3'
  },
  total_orders: {
    title: 'Total de Pedidos',
    format: (v) => Math.round(v),
    color: '#ff9800'
  },
  total_revenue: {
    title: 'Monto Total Facturado',
    format: formatCurrency,
    color: '#4caf50'
  },
  avg_utility_percent: {
    title: 'Porcentaje de Utilidad Promedio',
    format: formatPercent,
    color: '#4caf50'
  },
  avg_utility_amount: {
    title: 'Utilidad Promedio por Pedido',
    format: formatCurrency,
    color: '#4caf50'
  },
  completed_orders_by_seller: {
    title: 'Pedidos Completados por Vendedores',
    format: (v) => Math.round(v),
    color: '#9c27b0'
  }
}

export default function KPIDetail() {
  const { metric } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [viewMode, setViewMode] = useState('graph') // 'graph' o 'summary'

  const config = KPI_CONFIG[metric] || {
    title: 'KPI',
    format: (v) => v,
    color: '#4caf50'
  }

  useEffect(() => {
    loadData()
  }, [metric])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchKPIByWeek(metric)
      setData(result)
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error cargando datos: ' + error.message)
    } finally {
      setLoading(false)
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
          📈 {config.title}
        </h1>
      </div>

      {/* Toggle entre gráfico y resumen */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          className={viewMode === 'graph' ? 'button' : 'button ghost'}
          onClick={() => setViewMode('graph')}
        >
          📊 Gráfico
        </button>
        <button
          className={viewMode === 'summary' ? 'button' : 'button ghost'}
          onClick={() => setViewMode('summary')}
        >
          📋 Resumen
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
          <div style={{ fontSize: '24px', fontWeight: 800, color: config.color }}>
            {config.format(latest)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            Promedio
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>
            {config.format(average)}
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
                    {typeof value === 'number' && value % 1 !== 0 
                      ? config.format(value)
                      : Math.round(value)}
                  </text>
                </g>
              )
            })}

            {/* Línea del gráfico */}
            <path
              d={linePath}
              fill="none"
              stroke={config.color}
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
                  fill={config.color}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                />
                <title>
                  {formatWeekRange(point.week.week_start)}: {config.format(point.value)}
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
              <div style={{ width: '20px', height: '3px', background: config.color }}></div>
              <span>{config.title}</span>
            </div>
          </div>
        </div>
      )}

      {/* Vista de resumen */}
      {viewMode === 'summary' && (
        <div className="card" style={{ marginTop: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            Resumen Detallado por Semana
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e1e7e1' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Semana</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Valor</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, idx) => {
                const prevValue = idx > 0 ? weeks[idx - 1].value : week.value
                const change = prevValue !== 0 ? ((week.value - prevValue) / prevValue) * 100 : 0
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {formatWeekRange(week.week_start)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: config.color }}>
                      {config.format(week.value)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', color: change >= 0 ? 'var(--kivi-green)' : '#f44336' }}>
                      {idx === 0 ? '-' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

