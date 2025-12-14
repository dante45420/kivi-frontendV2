import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  const isActive = (path) => location.pathname === path
  
  const isDropdownActive = (items) => {
    return items.some(item => isActive(item.path))
  }
  
  const menuGroups = [
    {
      label: 'Productos',
      emoji: '🥬',
      items: [
        { path: '/productos', label: 'Productos', emoji: '🥬' },
        { path: '/categorias', label: 'Categorías', emoji: '🏷️' },
        { path: '/ofertas', label: 'Ofertas', emoji: '🎯' },
      ]
    },
    {
      label: 'Pedidos',
      emoji: '📦',
      items: [
        { path: '/pedidos', label: 'Pedidos', emoji: '📦' },
        { path: '/compras', label: 'Compras', emoji: '🛒' },
      ]
    },
    {
      label: 'Clientes',
      emoji: '👥',
      items: [
        { path: '/clientes', label: 'Clientes', emoji: '👥' },
        { path: '/vendedores', label: 'Vendedores', emoji: '👔' },
      ]
    },
  ]
  
  const singleItems = [
    { path: '/contabilidad', label: 'Contabilidad', emoji: '💰' },
    { path: '/kpis', label: 'KPIs', emoji: '📈' },
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
        <Link to="/kpis" style={{
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
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Menús desplegables */}
          {menuGroups.map((group, idx) => (
            <div
              key={idx}
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setOpenDropdown(idx)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className="button button-sm"
                style={{
                  background: isDropdownActive(group.items) ? 'var(--kivi-green)' : 'transparent',
                  color: isDropdownActive(group.items) ? '#fff' : 'var(--kivi-text)',
                  border: isDropdownActive(group.items) ? 'none' : '1px solid #e1e7e1',
                  cursor: 'pointer'
                }}
              >
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </button>
              
              {openDropdown === idx && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    paddingTop: '2px',
                    zIndex: 1000
                  }}
                  onMouseEnter={() => setOpenDropdown(idx)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <div style={{
                    background: '#fff',
                    border: '1px solid #e1e7e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}>
                    {group.items.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          textDecoration: 'none',
                          color: isActive(item.path) ? '#fff' : 'var(--kivi-text)',
                          background: isActive(item.path) ? 'var(--kivi-green)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path)) {
                            e.currentTarget.style.background = '#f8f9fa'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path)) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Items individuales */}
          {singleItems.map(item => (
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
          gap: '8px',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}>
          {/* Menús desplegables móviles */}
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <button
                className="button"
                onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: isDropdownActive(group.items) ? 'var(--kivi-green)' : 'transparent',
                  color: isDropdownActive(group.items) ? '#fff' : 'var(--kivi-text)',
                  border: isDropdownActive(group.items) ? 'none' : '1px solid #e1e7e1'
                }}
              >
                <span>{group.emoji}</span>
                <span style={{ marginLeft: '8px' }}>{group.label}</span>
              </button>
              
              {openDropdown === idx && (
                <div style={{
                  paddingLeft: '16px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {group.items.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="button ghost"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setOpenDropdown(null)
                      }}
                      style={{
                        justifyContent: 'flex-start',
                        background: isActive(item.path) ? 'var(--kivi-green)' : 'transparent',
                        color: isActive(item.path) ? '#fff' : 'var(--kivi-text)',
                        border: isActive(item.path) ? 'none' : '1px solid #e1e7e1'
                      }}
                    >
                      <span>{item.emoji}</span>
                      <span style={{ marginLeft: '8px' }}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Items individuales móviles */}
          {singleItems.map(item => (
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
              <span style={{ marginLeft: '8px' }}>{item.label}</span>
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

