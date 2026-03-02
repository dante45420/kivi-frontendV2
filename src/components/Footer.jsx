/**
 * Footer público Kivi — Marca para vendedores
 */
import { Link } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/56969172764?text=Hola%20Kivi!%20Quiero%20ser%20vendedor%20y%20recibir%20más%20información.'
const INSTAGRAM_URL = 'https://www.instagram.com/kivi.chile/'

export default function Footer() {
  return (
    <footer className="kivi-footer">
      <div className="kivi-footer-inner">
        <div className="kivi-footer-brand">
          <p className="kivi-footer-tagline">
            Frutas y verduras frescas. Vende desde tu casa, nosotros nos encargamos del resto.
          </p>
        </div>
        <div className="kivi-footer-links">
          <Link to="/" className="kivi-footer-link">Inicio</Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="kivi-footer-link">Contactar</a>
        </div>
        <div className="kivi-footer-social">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="kivi-footer-social-btn" title="WhatsApp">
            <img src="/logo_whatsapp-Photoroom.png" alt="WhatsApp" className="kivi-footer-social-icon" />
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="kivi-footer-social-btn" title="Instagram">
            <img src="/logo-instagram.png" alt="Instagram" className="kivi-footer-social-icon" />
          </a>
        </div>
        <p className="kivi-footer-copy">
          © {new Date().getFullYear()} Kivi. Frutas y verduras frescas.
        </p>
      </div>
      <style>{`
        .kivi-footer {
          background: var(--kivi-text-dark);
          color: #fff;
          padding: 48px 20px 28px;
          margin-top: 0;
        }
        .kivi-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .kivi-footer-tagline {
          font-size: 15px;
          line-height: 1.6;
          opacity: 0.85;
          margin-bottom: 28px;
        }
        .kivi-footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
        }
        .kivi-footer-link {
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          opacity: 0.9;
          transition: opacity 0.2s;
        }
        .kivi-footer-link:hover { opacity: 1; }
        .kivi-footer-social {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .kivi-footer-social-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 20px;
          transition: background 0.2s, transform 0.2s;
        }
        .kivi-footer-social-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.08);
        }
        .kivi-footer-social-icon {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .kivi-footer-copy {
          font-size: 13px;
          opacity: 0.6;
          margin: 0;
        }
      `}</style>
    </footer>
  )
}
