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
      name: 'María González',
      text: 'Increíble la calidad de las frutas. Llegan frescas y deliciosas, mucho mejor que en el supermercado. El servicio es excelente y muy puntual.',
      rating: 5
    },
    {
      name: 'Carlos Ramírez',
      text: 'Llevo 3 meses comprando y siempre superan mis expectativas. Los precios son justos y la atención personalizada hace toda la diferencia.',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      text: 'Me encanta poder pedir exactamente lo que necesito. La fruta siempre está en perfecto estado y el delivery es muy rápido. Totalmente recomendado.',
      rating: 5
    },
    {
      name: 'Roberto Silva',
      text: 'Excelente relación precio-calidad. Las frutas son de primera y el trato es muy profesional. Ya me convertí en cliente frecuente.',
      rating: 5
    }
  ]
  
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [starProducts, setStarProducts] = useState([])
  const [loadingStars, setLoadingStars] = useState(true)
  const [starProductIndex, setStarProductIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
  
  // Carrusel auto-deslizante de productos estrella
  useEffect(() => {
    if (starProducts.length === 0) return
    const itemsPerView = isMobile ? 1 : 3
    const interval = setInterval(() => {
      setStarProductIndex((prev) => {
        const maxIndex = Math.max(0, starProducts.length - itemsPerView)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [starProducts.length, isMobile])
  
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
      
      // Calcular monto facturado por producto
      for (const order of completedOrders.slice(0, 50)) { // Limitar para performance
        try {
          const response = await fetch(`${API_URL}/api/orders/${order.id}`)
          const orderData = await response.json()
          if (orderData.items) {
            orderData.items.forEach(item => {
              if (item.product_id && item.unit_price) {
                const qty = item.charged_qty || item.qty || 0
                const amount = qty * item.unit_price
                productCounts[item.product_id] = (productCounts[item.product_id] || 0) + amount
              }
            })
          }
        } catch (err) {
          console.error(`Error cargando orden ${order.id}:`, err)
        }
      }
      
      // Ordenar productos por monto facturado
      const sortedProducts = productsData
        .filter(p => p.active && productCounts[p.id] > 0)
        .map(p => ({
          ...p,
          totalAmount: productCounts[p.id] || 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 12) // Top 12 productos
      
      setStarProducts(sortedProducts)
    } catch (error) {
      console.error('Error cargando productos estrella:', error)
    } finally {
      setLoadingStars(false)
    }
  }
  
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
      <div className="container" style={{ padding: '40px 20px' }}>
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
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ 
              width: '100%', 
              height: '200px', 
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundImage: 'url(https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Fruta fresca
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Productos frescos directo del campo, seleccionados cada día
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ 
              width: '100%', 
              height: '200px', 
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundImage: 'url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Mejor precio-calidad
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '15px', lineHeight: 1.6 }}>
              Sin intermediarios. La mejor relación precio-calidad del mercado
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ 
              width: '100%', 
              height: '200px', 
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
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
        padding: '30px 20px',
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
            <div className="card" style={{ 
              padding: '40px', 
              minHeight: '250px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '20px',
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
                marginBottom: '20px',
                fontStyle: 'italic',
                maxWidth: '600px',
                margin: '0 auto 20px'
              }}>
                "{testimonials[testimonialIndex].text}"
              </p>
              <p style={{
                fontWeight: 700,
                color: 'var(--kivi-text-dark)',
                fontSize: '16px'
              }}>
                — {testimonials[testimonialIndex].name}
              </p>
            </div>
            
            {/* Controles del carrusel */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '20px'
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
      
      {/* Video separador */}
      <div style={{
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        backgroundImage: 'url(https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        >
          <source src="https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
            textAlign: 'center',
            padding: '20px',
            lineHeight: 1.3
          }}>
            Frutas frescas del campo<br />
            Directo a tu mesa
          </h2>
        </div>
      </div>
      
      {/* Preguntas Frecuentes - Desplegables */}
      <div className="container" style={{ padding: '40px 20px' }}>
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
        padding: '40px 20px'
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
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <div 
                className="star-products-carousel"
                style={{
                  display: 'flex',
                  gap: '20px',
                  transition: 'transform 0.5s ease',
                  width: isMobile 
                    ? `${starProducts.length * 100}%` 
                    : `${Math.ceil(starProducts.length / 3) * 100}%`,
                  transform: `translateX(-${isMobile 
                    ? starProductIndex * 100 
                    : starProductIndex * (100 / 3)}%)`
                }}
              >
                {starProducts.map((product, idx) => (
                  <Link
                    key={product.id}
                    to="/catalogo"
                    className="star-product-item"
                    style={{
                      flex: `0 0 ${isMobile ? '100%' : 'calc(33.333% - 14px)'}`,
                      textDecoration: 'none',
                      minWidth: 0
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

