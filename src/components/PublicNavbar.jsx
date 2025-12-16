/**
 * Componente: Navbar público minimalista
 */
import { Link, useLocation } from 'react-router-dom'

export default function PublicNavbar({ cartCount = 0, onCartClick = null }) {
  const location = useLocation()
  const isInCatalog = location.pathname === '/catalogo'
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#fff',
      borderBottom: '2px solid #eee',
      padding: '16px 20px',
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: 'var(--kivi-text-dark)'
        }}>
          <img 
            src="/Logo_sin_slogan.png" 
            alt="Green Market" 
            style={{ height: '70px' }} 
          />
        </Link>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isInCatalog ? (
            // En Home u otras páginas: ir a catálogo
            <Link to="/catalogo" className="button" style={{ fontSize: '14px' }}>
              <span>🛒</span>
              <span className="hide-mobile">Catálogo</span>
              {cartCount > 0 && (
                <div style={{
                  marginLeft: '4px',
                  background: '#fff',
                  color: 'var(--kivi-green)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {cartCount}
                </div>
              )}
            </Link>
          ) : (
            // En Catálogo: abrir carrito (siempre visible)
            <>
              {onCartClick && (
                <button
                  onClick={onCartClick}
                  className="button"
                  style={{ fontSize: '14px' }}
                >
                  <span>🛒</span>
                  <span>Carrito</span>
                  {cartCount > 0 && (
                    <div style={{
                      marginLeft: '4px',
                      background: '#fff',
                      color: 'var(--kivi-green)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {cartCount}
                    </div>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <style>{`
        @media (min-width: 769px) {
          [data-desktop-only] { display: inline !important; }
        }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

