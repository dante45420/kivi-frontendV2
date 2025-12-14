import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path) => location.pathname === path
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { path: '/productos', label: 'Productos', emoji: '🥬' },
    { path: '/categorias', label: 'Categorías', emoji: '🏷️' },
    { path: '/ofertas', label: 'Ofertas', emoji: '🎯' },
    { path: '/pedidos', label: 'Pedidos', emoji: '📦' },
    { path: '/compras', label: 'Compras', emoji: '🛒' },
    { path: '/clientes', label: 'Clientes', emoji: '👥' },
    { path: '/vendedores', label: 'Vendedores', emoji: '👔' },
    { path: '/contabilidad', label: 'Contabilidad', emoji: '💰' },
    { path: '/kpis', label: 'KPIs', emoji: '📈' },
    { path: '/kivi-tips', label: 'Tips Kivi', emoji: '🐕' },
  ]
  
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#fff',
      borderBottom: '2px solid #eee',
      padding: '12px 20px',
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: '18px',
          color: 'var(--kivi-text-dark)'
        }}>
          <span style={{ fontSize: '24px' }}>🐕</span>
          <span>Kivi</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hide-mobile" style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="button button-sm"
              style={{
                background: isActive(item.path) ? 'var(--kivi-green)' : 'transparent',
                color: isActive(item.path) ? '#fff' : 'var(--kivi-text)',
                border: isActive(item.path) ? 'none' : '1px solid #e1e7e1'
              }}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button
            onClick={logout}
            className="button button-sm ghost"
            style={{ marginLeft: '8px' }}
          >
            Salir
          </button>
        </div>
        
        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="button button-sm ghost"
          style={{ display: 'none' }}
          data-mobile-menu-btn="true"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          borderBottom: '2px solid #eee',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: isActive(item.path) ? 'var(--kivi-green)' : 'transparent',
                color: isActive(item.path) ? '#fff' : 'var(--kivi-text)',
                border: isActive(item.path) ? 'none' : '1px solid #e1e7e1',
                justifyContent: 'flex-start'
              }}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button onClick={logout} className="button ghost">
            Salir
          </button>
        </div>
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          [data-mobile-menu-btn] { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

