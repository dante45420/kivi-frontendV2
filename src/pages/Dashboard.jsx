/**
 * Página: Dashboard
 * Vista general con KPIs principales
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../api/orders'
import { fetchCustomers } from '../api/customers'
import { fetchProducts } from '../api/products'
import Loader from '../components/Loader'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    draftOrders: 0,
    emittedOrders: 0,
    totalCustomers: 0,
    totalProducts: 0
  })
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      const [orders, customers, products] = await Promise.all([
        fetchOrders(),
        fetchCustomers(),
        fetchProducts()
      ])
      
      setStats({
        draftOrders: orders.filter(o => o.status === 'draft').length,
        emittedOrders: orders.filter(o => o.status === 'emitted').length,
        totalCustomers: customers.length,
        totalProducts: products.length
      })
    } catch (error) {
      console.error('Error cargando stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <Loader message="Cargando dashboard..." />
  
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--kivi-text-dark)',
          margin: '0 0 8px 0'
        }}>
          🐕 Bienvenido a Kivi
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--kivi-text)',
          margin: 0
        }}>
          Tu personal shopper de Lo Valledor
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-3" style={{ marginBottom: '32px' }}>
        <Link to="/pedidos?status=draft" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kivi-green)', marginBottom: '4px' }}>
              {stats.draftOrders}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
              Borradores
            </div>
          </div>
        </Link>
        
        <Link to="/pedidos?status=emitted" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚚</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kivi-blue-soft)', marginBottom: '4px' }}>
              {stats.emittedOrders}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
              Pedidos activos
            </div>
          </div>
        </Link>
        
        <Link to="/clientes" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kivi-orange)', marginBottom: '4px' }}>
              {stats.totalCustomers}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
              Clientes
            </div>
          </div>
        </Link>
      </div>
      
      {/* Acciones rápidas */}
      <div className="card">
        <h2 className="card-title">Acciones rápidas</h2>
        
        <div className="grid grid-2" style={{ marginTop: '16px' }}>
          <Link to="/pedidos?action=parse" className="button" style={{ justifyContent: 'center' }}>
            <span>📝</span>
            <span>Parsear pedido de WhatsApp</span>
          </Link>
          
          <Link to="/productos?action=new" className="button secondary" style={{ justifyContent: 'center' }}>
            <span>➕</span>
            <span>Agregar producto</span>
          </Link>
          
          <Link to="/clientes?action=new" className="button ghost" style={{ justifyContent: 'center' }}>
            <span>👤</span>
            <span>Nuevo cliente</span>
          </Link>
          
          <Link to="/contabilidad" className="button ghost" style={{ justifyContent: 'center' }}>
            <span>💰</span>
            <span>Registrar pago</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

