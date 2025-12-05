/**
 * Página Pública: Home / Landing
 */
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'
import { fetchProducts } from '../../api/products'
import { fetchOrders } from '../../api/orders'
import { getImageUrl } from '../../utils/imageUrl'

export default function Home() {
  const navigate = useNavigate()
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
  
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [starProducts, setStarProducts] = useState([])
  const [loadingStars, setLoadingStars] = useState(true)
  
  // Cargar productos estrella (más pedidos)
  useEffect(() => {
    loadStarProducts()
  }, [])
  
  // Carrusel de testimonios
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])
  
  const loadStarProducts = async () => {
    try {
      const [productsData, ordersData] = await Promise.all([
        fetchProducts(),
        fetchOrders()
      ])
      
      // Contar pedidos por producto
      const productCounts = {}
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      
      // Obtener detalles de pedidos completados/emitidos
      const completedOrders = ordersData.filter(o => 
        o.status === 'completed' || o.status === 'emitted'
      )
      
      // Contar productos de cada pedido
      for (const order of completedOrders.slice(0, 50)) { // Limitar para performance
        try {
          const response = await fetch(`${API_URL}/api/orders/${order.id}`)
          const orderData = await response.json()
          if (orderData.items) {
            orderData.items.forEach(item => {
              if (item.product_id) {
                productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.qty
              }
            })
          }
        } catch (err) {
          console.error(`Error cargando orden ${order.id}:`, err)
        }
      }
      
      // Ordenar productos por cantidad pedida
      const sortedProducts = productsData
        .filter(p => p.active && productCounts[p.id] > 0)
        .map(p => ({
          ...p,
          orderCount: productCounts[p.id] || 0
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 9) // Top 9 productos
      
      setStarProducts(sortedProducts)
    } catch (error) {
      console.error('Error cargando productos estrella:', error)
    } finally {
      setLoadingStars(false)
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
      
      {/* Hero con foto grande */}
      <div style={{
        position: 'relative',
        height: '70vh',
        minHeight: '500px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 2
        }} />
        <div className="container" style={{ 
          position: 'relative', 
          zIndex: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '24px',
            lineHeight: 1.2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
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
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            lineHeight: 1.5
          }}>
            Pide exactamente lo que quieras, como quieras.<br />
            Directo del campo a tu mesa.
          </p>
          <Link to="/catalogo" className="button button-lg" style={{ background: '#fff', color: '#000', fontSize: '18px', padding: '16px 32px', fontWeight: 800, border: 'none' }}>
            <span>🛒</span>
            <span>Ver catálogo</span>
          </Link>
        </div>
      </div>
      
      {/* Features - Valores agregados */}
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
      
      {/* Testimonios - Carrusel */}
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
            position: 'relative',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div className="card" style={{ padding: '40px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px',
                justifyContent: 'center'
              }}>
                {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                  <span key={i} style={{ fontSize: '24px' }}>⭐</span>
                ))}
              </div>
              <p style={{
                color: 'var(--kivi-text)',
                fontSize: '18px',
                lineHeight: 1.8,
                marginBottom: '24px',
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                "{testimonials[testimonialIndex].text}"
              </p>
              <p style={{
                fontWeight: 700,
                color: 'var(--kivi-text-dark)',
                fontSize: '16px',
                textAlign: 'center'
              }}>
                — {testimonials[testimonialIndex].name}
              </p>
            </div>
            
            {/* Controles del carrusel */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '24px'
            }}>
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestimonialIndex(idx)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    background: idx === testimonialIndex ? 'var(--kivi-green)' : '#ddd',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Preguntas Frecuentes - Desplegables */}
      <div className="container" style={{ padding: '80px 20px' }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '48px',
          color: 'var(--kivi-text-dark)'
        }}>
          Preguntas Frecuentes
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {[
            {
              question: '¿Cómo hago un pedido?',
              answer: 'Explora nuestro catálogo, agrega productos a tu carrito y completa tu pedido. Te contactaremos por WhatsApp para coordinar la entrega.'
            },
            {
              question: '¿Cuánto tarda la entrega?',
              answer: 'Pide hoy y recibe mañana. Coordinamos la entrega contigo por WhatsApp para que llegue en el momento perfecto.'
            },
            {
              question: '¿Puedo pedir por kg o por unidades?',
              answer: '¡Por supuesto! Puedes pedir exactamente lo que quieras, como quieras. Por kilogramo o por unidades, tú decides.'
            },
            {
              question: '¿De dónde vienen los productos?',
              answer: 'Todos nuestros productos vienen directamente de Lo Valledor, seleccionados frescos cada día por nuestro equipo.'
            },
            {
              question: '¿Qué métodos de pago aceptan?',
              answer: 'Aceptamos transferencia bancaria, efectivo al recibir y otros métodos que coordinamos por WhatsApp.'
            }
          ].map((faq, idx) => (
            <div key={idx} className="card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kivi-text-dark)', margin: 0 }}>
                  {faq.question}
                </h3>
                <span style={{ fontSize: '24px', color: 'var(--kivi-green)', transition: 'transform 0.3s', transform: expandedFAQ === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedFAQ === idx && (
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Productos Estrella */}
      <div style={{
        background: 'var(--kivi-cream)',
        padding: '80px 20px'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '48px',
            color: 'var(--kivi-text-dark)'
          }}>
            Nuestros productos estrella
          </h2>
          
          {loadingStars ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading loading-lg"></div>
            </div>
          ) : starProducts.length > 0 ? (
            <div style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              padding: '20px 0',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'thin'
            }}>
              {starProducts.map((product, idx) => (
                <Link
                  key={product.id}
                  to="/catalogo"
                  style={{
                    minWidth: '280px',
                    maxWidth: '280px',
                    textDecoration: 'none',
                    scrollSnapAlign: 'start'
                  }}
                >
                  <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                    {product.photo_url && (
                      <div style={{
                        width: '100%',
                        paddingTop: '75%',
                        position: 'relative',
                        background: '#f5f5f5'
                      }}>
                        <img
                          src={getImageUrl(product.photo_url)}
                          alt={product.name}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--kivi-text-dark)' }}>
                        {product.name}
                      </h3>
                      {product.sale_price && (
                        <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kivi-green)', margin: 0 }}>
                          ${product.sale_price.toLocaleString('es-CL')} / {product.unit}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--kivi-text)' }}>
              Pronto mostraremos nuestros productos más populares
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/catalogo" className="button button-lg" style={{ background: '#000', color: '#fff', fontWeight: 800 }}>
              <span>🛒</span>
              <span>Ver todos los productos</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

