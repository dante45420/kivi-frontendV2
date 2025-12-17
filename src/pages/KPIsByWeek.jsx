/**
 * Página: KPIs por Semana
 * Muestra gráfico de evolución semana a semana
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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

export default function KPIsByWeek() {
  const navigate = useNavigate()
  const [utilityByWeek, setUtilityByWeek] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('final_result') // final_result, orders_utility, orders_count

  useEffect(() => {
    loadUtilityByWeek()
  }, [])

  const loadUtilityByWeek = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/kpis/utility-by-week`)
      if (!response.ok) {
        throw new Error('Error cargando KPIs por semana')
      }
      const data = await response.json()
      setUtilityByWeek(data)
    } catch (error) {
      console.error('Error cargando KPIs por semana:', error)
      alert('Error cargando KPIs por semana: ' + error.message)
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

  if (!utilityByWeek || !utilityByWeek.weeks || utilityByWeek.weeks.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => navigate('/kpis')} className="button ghost">
            ← Volver a KPIs
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--kivi-text)', margin: 0 }}>
            No hay datos de semanas disponibles
          </p>
        </div>
      </div>
    )
  }

  const weeks = utilityByWeek.weeks
  const metricLabels = {
    final_result: 'Resultado Final',
    orders_utility: 'Utilidad de Pedidos',
    orders_count: 'Cantidad de Pedidos'
  }

  // Calcular valores para el gráfico
  const values = weeks.map(week => {
    switch (selectedMetric) {
      case 'final_result':
        return week.final_result
      case 'orders_utility':
        return week.orders_utility
      case 'orders_count':
        return week.orders_count
      default:
        return week.final_result
    }
  })

  // Encontrar min y max para escalar el gráfico
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1 // Evitar división por cero

  // Dimensiones del gráfico
  const width = 1000
  const height = 400
  const padding = { top: 40, right: 40, bottom: 60, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calcular puntos para la línea
  const points = values.map((value, index) => {
    const x = padding.left + (index / (values.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight
    return { x, y, value, week: weeks[index] }
  })

  // Crear path para la línea
  const linePath = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  }).join(' ')

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/kpis')} className="button ghost" style={{ marginBottom: '16px' }}>
          ← Volver a KPIs
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
          📈 KPIs por Semana - Evolución
        </h1>
      </div>

      {/* Selector de métrica */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: 600 }}>Métrica:</label>
        <select
          className="input"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{ width: '200px', padding: '8px 12px' }}
        >
          <option value="final_result">Resultado Final</option>
          <option value="orders_utility">Utilidad de Pedidos</option>
          <option value="orders_count">Cantidad de Pedidos</option>
        </select>
      </div>

      {/* Gráfico */}
      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
          {metricLabels[selectedMetric]} - Evolución Semana a Semana
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
                  {selectedMetric === 'orders_count' 
                    ? Math.round(value)
                    : formatCurrency(value)}
                </text>
              </g>
            )
          })}

          {/* Línea del gráfico */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--kivi-green)"
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
                fill="var(--kivi-green)"
                stroke="#fff"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
              />
              {/* Tooltip al hover */}
              <title>
                {formatWeekRange(point.week.week_start)}: {
                  selectedMetric === 'orders_count'
                    ? `${point.value} pedidos`
                    : formatCurrency(point.value)
                }
              </title>
            </g>
          ))}

          {/* Etiquetas de semanas en el eje X */}
          {points.map((point, index) => {
            // Mostrar solo algunas etiquetas para no saturar
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
            <div style={{ width: '20px', height: '3px', background: 'var(--kivi-green)' }}></div>
            <span>{metricLabels[selectedMetric]}</span>
          </div>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="card" style={{ marginTop: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          Datos Detallados
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e1e7e1' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Semana</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Utilidad Pedidos</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Costos</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Resultado Final</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {formatWeekRange(week.week_start)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', color: 'var(--kivi-green)' }}>
                  {formatCurrency(week.orders_utility)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', color: '#f44336' }}>
                  {formatCurrency(week.weekly_costs_total)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: week.final_result >= 0 ? 'var(--kivi-green)' : '#f44336' }}>
                  {formatCurrency(week.final_result)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                  {week.orders_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

