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
      await generateCatalogPDF(products, offersData)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el catálogo PDF')
    } finally {
      setDownloading(false)
    }
  }
  
  const testimonials = [
    {
      name: 'Cora Giugliano',
      text: 'Se nota el tremendo trabajo que hay detrás, está todo exquisito y en perfecta calidad!! Se pasaron!!',
      rating: 5
    },
    {
      name: 'Viviana Werth',
      text: 'Los encuentro realmente espectaculares, productos, presentación, calidad, rapidez y lo eficiente del despacho',
      rating: 5
    },
    {
      name: 'Barbara Valdés',
      text: 'Hola!! Quería escribirles porque ayer recibí mi primera compra con ustedes y estoy feliz. SE PASARON!!! Dan ganas de comer frutas y verduras, están todos deliciosos!!',
      rating: 5
    },
    {
      name: 'Dante Parodi',
      text: 'Todo fantástico, tuve problemas con el pago y al día siguiente se comunicaron conmigo y me dieron opciones para solucionarlo en el momento.',
      rating: 5
    }
  ]
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />
      
      {/* Hero */}
      <div style={{
        padding: '100px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--kivi-green) 0%, var(--kivi-green-dark) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            Fruta Fresca<br />
            La mejor relación precio-calidad<br />
            A domicilio
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: '#fff',
            marginBottom: '32px',
            maxWidth: '700px',
            margin: '0 auto 32px',
            opacity: 0.95,
            lineHeight: 1.5
          }}>
            Pide exactamente lo que quieras, como quieras.<br />
            Directo del campo a tu mesa.
          </p>
          <Link to="/catalogo" className="button button-lg" style={{ background: '#fff', color: 'var(--kivi-green)', fontSize: '18px', padding: '16px 32px' }}>
            <span>🛒</span>
            <span>Ver catálogo</span>
          </Link>
        </div>
        
        {/* Video/Foto de fondo del campo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.15,
          zIndex: 1,
          backgroundImage: 'url(https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      </div>
      
      {/* Galería del Campo */}
      <div style={{
        padding: '60px 20px',
        background: '#fff'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '40px',
            color: 'var(--kivi-text-dark)'
          }}>
            Del campo a tu mesa
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '16/9',
              backgroundImage: 'url(https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '16/9',
              backgroundImage: 'url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '16/9',
              backgroundImage: 'url(https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '16/9',
              backgroundImage: 'url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="container" style={{ padding: '80px 20px' }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '48px',
          color: 'var(--kivi-text-dark)'
        }}>
          ¿Por qué elegirnos?
        </h2>
        
        <div className="grid grid-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🥬</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Fruta fresca
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Productos frescos directo del campo, seleccionados cada día
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Mejor precio-calidad
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Sin intermediarios. La mejor relación precio-calidad del mercado
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚚</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              A domicilio
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Pide exactamente lo que quieras, como quieras. Delivery a tu casa
            </p>
          </div>
        </div>
      </div>
      
      {/* Testimonios */}
      <div style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, var(--kivi-cream) 0%, #fff 100%)'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '48px',
            color: 'var(--kivi-text-dark)'
          }}>
            Lo que dicen nuestros clientes
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card" style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '16px',
                  justifyContent: 'center'
                }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} style={{ fontSize: '20px' }}>⭐</span>
                  ))}
                </div>
                <p style={{
                  color: 'var(--kivi-text)',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                  fontStyle: 'italic'
                }}>
                  "{testimonial.text}"
                </p>
                <p style={{
                  fontWeight: 700,
                  color: 'var(--kivi-text-dark)',
                  fontSize: '14px',
                  textAlign: 'right'
                }}>
                  — {testimonial.name}
                </p>
              </div>
            ))}
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
              Pide hoy y recibe mañana. Coordinamos la entrega contigo por WhatsApp para que llegue en el momento perfecto.
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
              ¿Puedo pedir por kg o por unidades?
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              ¡Por supuesto! Puedes pedir exactamente lo que quieras, como quieras. Por kilogramo o por unidades, tú decides.
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

