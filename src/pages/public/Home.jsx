/**
 * Página Pública: Home / Landing
 */
import { Link } from 'react-router-dom'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />
      
      {/* Hero */}
      <div style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--kivi-green-soft) 0%, var(--kivi-blue-soft) 100%)'
      }}>
        <div className="container">
          <img 
            src="/Perro_kivi.PNG" 
            alt="Kivi el perro" 
            style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              margin: '0 auto 24px',
              display: 'block',
              border: '6px solid #fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }} 
          />
          <h1 style={{
            fontSize: '48px',
            fontWeight: 800,
            color: 'var(--kivi-text-dark)',
            marginBottom: '16px',
            lineHeight: 1.2
          }}>
            Tu Personal Shopper<br />de Lo Valledor
          </h1>
          <p style={{
            fontSize: '20px',
            color: 'var(--kivi-text)',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Frutas y verduras frescas directo de Lo Valledor a tu casa.
            Seleccionadas especialmente para ti por Kivi 🐕
          </p>
          <Link to="/catalogo" className="button button-lg">
            <span>🥬</span>
            <span>Ver catálogo</span>
          </Link>
        </div>
      </div>
      
      {/* Features */}
      <div className="container" style={{ padding: '80px 20px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '48px',
          color: 'var(--kivi-text-dark)'
        }}>
          ¿Por qué Kivi?
        </h2>
        
        <div className="grid grid-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🥬</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Frescura garantizada
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Productos frescos directo de Lo Valledor, seleccionados cada día
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Mejores precios
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Sin intermediarios. Los mismos precios de Lo Valledor en tu casa
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚚</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Entrega rápida
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Pedí hoy y recibí mañana. Delivery coordinado por WhatsApp
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div style={{
        background: 'var(--kivi-green)',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '16px'
          }}>
            ¿Listo para probar?
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#fff',
            marginBottom: '24px',
            opacity: 0.9
          }}>
            Explorá nuestro catálogo y hacé tu primer pedido
          </p>
          <Link to="/catalogo" className="button button-lg" style={{ background: '#fff', color: 'var(--kivi-green)' }}>
            <span>🛒</span>
            <span>Ver productos</span>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

