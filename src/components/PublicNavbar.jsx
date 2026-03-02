/**
 * Navbar público Kivi — Landing para vendedores
 */
import { Link } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/56969172764?text=Hola%20Kivi!%20Quiero%20ser%20vendedor%20y%20recibir%20más%20información.'

export default function PublicNavbar({ cartCount = 0, onCartClick = null }) {
  return (
    <nav className="kivi-public-nav">
      <div className="kivi-public-nav-inner">
        <Link to="/" className="kivi-public-nav-logo" aria-label="Kivi - Inicio">
          <img src="/kivi-logo.png" alt="Kivi" />
        </Link>
        <div className="kivi-public-nav-actions">
          <Link to="/catalogo" className="kivi-public-nav-link hide-mobile">
            Catálogo
          </Link>
          {onCartClick ? (
            <button
              type="button"
              onClick={onCartClick}
              className="kivi-public-nav-cart"
              aria-label="Ver carrito"
            >
              🛒 Carrito
              {cartCount > 0 && <span className="kivi-public-nav-cart-badge">{cartCount}</span>}
            </button>
          ) : null}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="kivi-public-nav-cta"
          >
            Quiero vender
          </a>
        </div>
      </div>
      <style>{`
        .kivi-public-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .kivi-public-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kivi-public-nav-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .kivi-public-nav-logo img {
          height: 48px;
          width: auto;
        }
        .kivi-public-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .kivi-public-nav-link {
          color: var(--kivi-text-dark);
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          padding: 8px 16px;
          border-radius: 999px;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .kivi-public-nav-link:hover {
          color: #2d6a4f;
          background: rgba(45, 106, 79, 0.08);
        }
        .kivi-public-nav-cta {
          display: inline-flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 999px;
          background: #2d6a4f;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .kivi-public-nav-cta:hover {
          background: #1b4332;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.35);
        }
        .kivi-public-nav-cart {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 2px solid var(--kivi-text-dark);
          background: transparent;
          color: var(--kivi-text-dark);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .kivi-public-nav-cart:hover {
          background: var(--kivi-text-dark);
          color: #fff;
          transform: translateY(-1px);
        }
        .kivi-public-nav-cart-badge {
          background: #2d6a4f;
          color: #fff;
          font-size: 11px;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
        }
        @media (max-width: 768px) {
          .kivi-public-nav-logo img { height: 40px; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
