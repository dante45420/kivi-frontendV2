/**
* pagina * Página Pública: Home / Landing
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
  const [itemsPerView, setItemsPerView] = useState(5)
  
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth <= 768) {
        setItemsPerView(3)
      } else if (window.innerWidth <= 1024) {
        setItemsPerView(4)
      } else {
        setItemsPerView(5)
      }
    }
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
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
    const interval = setInterval(() => {
      setStarProductIndex((prev) => {
        const maxIndex = Math.max(0, Math.ceil(starProducts.length / itemsPerView) - 1)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [starProducts.length, itemsPerView])
  
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
      <div className="container" style={{ padding: '60px 20px' }}>
        <h2 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '60px',
          color: 'var(--kivi-text-dark)'
        }}>
          Por qué elegirnos
        </h2>
        
        <div className="values-grid" style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ 
              width: '100%',
              height: '180px',
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/cliente_cercano.jpg" 
                alt="Atención personalizada"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const parent = e.target.parentElement
                  parent.innerHTML = '<div style="font-size: 64px; color: #4caf50; display: flex; align-items: center; justify-content: center; height: 100%;">🤝</div>'
                }}
              />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--kivi-text-dark)' }}>
              Atención personalizada
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '14px', lineHeight: 1.6 }}>
              Atención personalizada y cercana. Estamos aquí para ti, siempre.
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ 
              width: '100%',
              height: '180px',
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/maduracion.png" 
                alt="Maduración a elección"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const parent = e.target.parentElement
                  parent.innerHTML = '<div style="font-size: 64px; color: #4caf50; display: flex; align-items: center; justify-content: center; height: 100%;">🍎</div>'
                }}
              />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--kivi-text-dark)' }}>
              Maduración a elección
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '14px', lineHeight: 1.6 }}>
              Elige el grado de maduración perfecto: para hoy o para 4-5 días. Tú decides.
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ 
              width: '100%',
              height: '180px',
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/envio.avif" 
                alt="Envíos a domicilio"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const parent = e.target.parentElement
                  parent.innerHTML = '<div style="font-size: 64px; color: #4caf50; display: flex; align-items: center; justify-content: center; height: 100%;">🏠</div>'
                }}
              />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--kivi-text-dark)' }}>
              Envíos a domicilio
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '14px', lineHeight: 1.6 }}>
              Delivery directo a tu puerta. Sin salir de casa, productos frescos en tu mesa.
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ 
              width: '100%',
              height: '180px',
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/Reutilizar.jpg" 
                alt="Reutilizamos todo"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const parent = e.target.parentElement
                  parent.innerHTML = '<div style="font-size: 64px; color: #4caf50; display: flex; align-items: center; justify-content: center; height: 100%;">♻️</div>'
                }}
              />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--kivi-text-dark)' }}>
              Reutilizamos TODO
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '14px', lineHeight: 1.6 }}>
              Comprometidos con el planeta. Reutilizamos y reciclamos todo lo posible.
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ 
              width: '100%',
              height: '180px',
              marginBottom: '16px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/Fruta de calidad.jpg" 
                alt="Calidad primero"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const parent = e.target.parentElement
                  parent.innerHTML = '<div style="font-size: 64px; color: #4caf50; display: flex; align-items: center; justify-content: center; height: 100%;">⭐</div>'
                }}
              />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--kivi-text-dark)' }}>
              Calidad primero
            </h3>
            <p style={{ color: 'var(--kivi-text)', fontSize: '14px', lineHeight: 1.6 }}>
              Seleccionamos solo lo mejor. Calidad premium directo del campo.
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
      
      {/* Foto separadora */}
      <div style={{
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        backgroundImage: 'url(https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
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
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              <div 
                className="star-products-carousel"
                style={{
                  display: 'flex',
                  gap: '12px',
                  transition: 'transform 0.5s ease',
                  transform: `translateX(-${starProductIndex * (100 / itemsPerView)}%)`
                }}
              >
                {starProducts.map((product, idx) => (
                  <Link
                    key={product.id}
                    to="/catalogo"
                    className="star-product-item"
                    style={{
                      flex: `0 0 calc(${100 / itemsPerView}% - ${12 * (itemsPerView - 1) / itemsPerView}px)`,
                      textDecoration: 'none',
                      minWidth: 0
                    }}
                  >
                    <div className="catalog-product-card" style={{ padding: '12px', height: '100%' }}>
                      {product.photo_url && (
                        <div className="catalog-image-container">
                          <img
                            src={getImageUrl(product.photo_url)}
                            alt={product.name}
                          />
                        </div>
                      )}
                      <div className="catalog-product-info">
                        <div className="catalog-product-name">{product.name}</div>
                        {product.sale_price && (
                          <div className="catalog-price">
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 800, 
                              color: 'var(--kivi-green)',
                              textAlign: 'center'
                            }}>
                              ${product.sale_price.toLocaleString('es-CL')}
                              <span className="catalog-price-unit-small">
                                / {product.unit === 'kg' ? 'kg' : 'unidad'}
                              </span>
                            </div>
                          </div>
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
      
      <style>{`
        .catalog-product-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        
        .catalog-image-container {
          width: 100%;
          padding-top: 70%;
          position: relative;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #ffffff;
        }
        
        .catalog-image-container img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .catalog-product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .catalog-product-name {
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .catalog-price {
          font-size: 16px;
          font-weight: 800;
          color: var(--kivi-green);
          text-align: center;
          height: auto;
          min-height: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .catalog-price-unit-small {
          font-size: 11px;
          font-weight: 400;
          color: #666;
          margin-left: 4px;
        }
        
        .values-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
        }
        
        @media (max-width: 768px) {
          .values-grid {
            grid-template-columns: 1fr;
          }
          .catalog-image-container {
            padding-top: 50% !important;
          }
          .catalog-product-name {
            font-size: 12px !important;
            min-height: 32px !important;
          }
          .catalog-price {
            font-size: 14px !important;
            height: 28px !important;
          }
        }
      `}</style>
    </div>
  )
}

