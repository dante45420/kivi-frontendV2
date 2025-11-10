/**
 * Página Pública: Home / Landing
 */
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'
import { fetchProducts } from '../../api/products'
import { fetchCategories } from '../../api/categories'
import { fetchWeeklyOffers } from '../../api/weeklyOffers'
import { generateCatalogPDF } from '../../utils/catalogPdf'

export default function Home() {
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  
  const handleDownloadCatalog = async () => {
    setDownloading(true)
    try {
      const [productsData, categoriesData, offersData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchWeeklyOffers(true, true)
      ])
      const products = productsData.filter(p => p.active)
      generateCatalogPDF(products, offersData)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el catálogo PDF')
    } finally {
      setDownloading(false)
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />
      
      {/* Hero */}
      <div style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'var(--kivi-green)'
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
            color: '#fff',
            marginBottom: '16px',
            lineHeight: 1.2
          }}>
            Tu Personal Shopper<br />de Lo Valledor
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#fff',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
            opacity: 0.95
          }}>
            Frutas y verduras frescas directo de Lo Valledor a tu casa.
            Seleccionadas especialmente para ti por Kivi 🐕
          </p>
          <Link to="/catalogo" className="button button-lg" style={{ background: '#fff', color: 'var(--kivi-green)' }}>
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
              Pide hoy y recibe mañana. Delivery coordinado por WhatsApp
            </p>
          </div>
        </div>
      </div>
      
      {/* Descarga Catálogo WhatsApp */}
      <div style={{
        background: 'linear-gradient(135deg, var(--kivi-green-soft) 0%, var(--kivi-mint) 100%)',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--kivi-text-dark)',
            marginBottom: '16px'
          }}>
            ¿Te gusta pedir por WhatsApp?
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'var(--kivi-text)',
            marginBottom: '24px',
            maxWidth: '600px',
            margin: '0 auto 24px'
          }}>
            Descarga nuestro catálogo en PDF y escríbenos directamente
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadCatalog}
              disabled={downloading}
              className="button button-lg"
              style={{ background: 'var(--kivi-green)', color: '#fff' }}
            >
              <span>📥</span>
              <span>{downloading ? 'Generando...' : 'Descargar Catálogo PDF'}</span>
            </button>
            <a
              href="https://wa.me/56969172764?text=Hola%20Kivi!%20Quiero%20hacer%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-lg"
              style={{ background: '#25D366', color: '#fff' }}
            >
              <span>💬</span>
              <span>Escríbenos por WhatsApp</span>
            </a>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--kivi-text)',
            marginTop: '16px',
            opacity: 0.8
          }}>
            +56 9 6917 2764
          </p>
        </div>
      </div>
      
      {/* Preguntas Frecuentes */}
      <div className="container" style={{ padding: '80px 20px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '48px',
          color: 'var(--kivi-text-dark)'
        }}>
          Preguntas Frecuentes
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿Cómo hago un pedido?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Explora nuestro catálogo, agrega productos a tu carrito y completa tu pedido. Te contactaremos por WhatsApp para coordinar la entrega.
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿Cuánto tarda la entrega?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Ofrecemos 3 opciones: <strong>Rápido</strong> (mismo día antes de las 12:00, +10%), <strong>Normal</strong> (día siguiente, +0%), o <strong>Económico</strong> (1-3 días, -10%).
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿Cuál es el costo de envío?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              El envío <strong>Normal</strong> es sin costo adicional. Puedes elegir <strong>Rápido</strong> (+10% al total) para entrega el mismo día, o <strong>Económico</strong> (-10% descuento) para entrega en 1-3 días.
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿De dónde vienen los productos?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Todos nuestros productos vienen directamente de Lo Valledor, seleccionados frescos cada día por nuestro equipo.
            </p>
          </div>
          
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿Qué métodos de pago aceptan?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Aceptamos transferencia bancaria, efectivo al recibir y otros métodos que coordinamos por WhatsApp.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div style={{
        background: 'var(--kivi-green-dark)',
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
            Explora nuestro catálogo y haz tu primer pedido
          </p>
          <Link to="/catalogo" className="button button-lg" style={{ background: '#fff', color: 'var(--kivi-green-dark)' }}>
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

