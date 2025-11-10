/**
 * Página Pública: Sobre nosotros hecha hoy
 */
import { Link } from 'react-router-dom'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />
      
      {/* Contenido */}
      <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🐕</div>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 800,
            color: 'var(--kivi-text-dark)',
            marginBottom: '16px'
          }}>
            Sobre Kivi
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--kivi-text)',
            lineHeight: 1.6
          }}>
            Tu personal shopper de Lo Valledor
          </p>
        </div>
        
        <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--kivi-text-dark)' }}>
            🥬 ¿Qué es Kivi?
          </h2>
          <p style={{ color: 'var(--kivi-text)', lineHeight: 1.8, marginBottom: '16px' }}>
            Kivi nació de una necesidad simple: llevar los mejores productos de <strong>Lo Valledor</strong> directamente
            a tu casa, sin intermediarios y a los mejores precios.
          </p>
          <p style={{ color: 'var(--kivi-text)', lineHeight: 1.8 }}>
            Comenzamos con <strong>frutas y verduras</strong>, pero poco a poco vamos sumando más productos para que
            tengas todo lo que necesitas en un solo lugar.
          </p>
        </div>
        
        <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--kivi-text-dark)' }}>
            💚 ¿Por qué Lo Valledor?
          </h2>
          <p style={{ color: 'var(--kivi-text)', lineHeight: 1.8, marginBottom: '16px' }}>
            Lo Valledor es el mercado mayorista más grande de Santiago. Allí llegan los productos más frescos,
            directamente de los productores.
          </p>
          <p style={{ color: 'var(--kivi-text)', lineHeight: 1.8 }}>
            Nosotros seleccionamos personalmente cada producto para ti, con el mismo cuidado que lo harías tú mismo.
          </p>
        </div>
        
        <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--kivi-text-dark)' }}>
            🚀 Cómo funciona
          </h2>
          <ol style={{ color: 'var(--kivi-text)', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>Explorá el catálogo</strong> y agregá productos al carrito
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Enviá tu pedido</strong> por WhatsApp con tus datos
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Confirmamos</strong> tu pedido y coordinamos la entrega
            </li>
            <li>
              <strong>Recibís</strong> tus productos frescos en tu casa
            </li>
          </ol>
        </div>
        
        <div className="card" style={{ marginBottom: '24px', padding: '32px', background: 'var(--kivi-green-soft)', border: 'none' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--kivi-text-dark)' }}>
            📞 Contacto
          </h2>
          <p style={{ color: 'var(--kivi-text)', lineHeight: 1.8, marginBottom: '16px' }}>
            ¿Tenés dudas o querés hacer un pedido especial? Escribinos por WhatsApp:
          </p>
          <a
            href="https://wa.me/56912345678"
            className="button"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex' }}
          >
            <span>📱</span>
            <span>WhatsApp</span>
          </a>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/catalogo" className="button button-lg">
            <span>🛒</span>
            <span>Ver catálogo</span>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

