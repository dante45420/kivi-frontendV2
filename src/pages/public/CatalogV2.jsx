/**
 * Página Pública: Catálogo V2 - Mejorado con mejor UX
 */
import { useState, useEffect } from 'react'
import { fetchProducts } from '../../api/products'
import { fetchCategories } from '../../api/categories'
import { fetchWeeklyOffers } from '../../api/weeklyOffers'
import { createOrder } from '../../api/orders'
import { useCart } from '../../hooks/useCart'
import { generateCatalogPDF } from '../../utils/catalogPdf'
import { getImageUrl } from '../../utils/imageUrl'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'

export default function CatalogV2() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [weeklyOffers, setWeeklyOffers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  
  // Carrito
  const { cart, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const [showCart, setShowCart] = useState(false)
  
  // Checkout
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerData, setCustomerData] = useState({ name: '', phone: '', address: '' })
  const [shippingType, setShippingType] = useState('fastest')
  const [submitting, setSubmitting] = useState(false)
  
  // Adding state (para cada producto)
  const [addingProduct, setAddingProduct] = useState(null) // objeto del producto siendo agregado
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, categoriesData, offersData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchWeeklyOffers(true, true) // Activas y vigentes
      ])
      setProducts(productsData.filter(p => p.active))
      setCategories(categoriesData)
      setWeeklyOffers(offersData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownloadCatalog = () => {
    try {
      generateCatalogPDF(products, weeklyOffers)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el catálogo PDF')
    }
  }
  
  // Filtrado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || 
      product.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })
  
  const getCartItem = (productId, unit = null) => {
    if (unit) {
      return cart.find(item => item.product.id === productId && item.unit === unit)
    }
    return cart.find(item => item.product.id === productId)
  }
  
  const hasProductInCart = (productId) => {
    return cart.some(item => item.product.id === productId)
  }
  
  const handleAddClick = (product) => {
    setAddingProduct(product)
  }
  
  const handleSelectUnit = (product, unit) => {
    const qty = unit === 'kg' ? 0.25 : 1  // Si es kg, empezar con 250g
    addItem(product, qty, unit)
    setAddingProduct(null)
  }
  
  const handleCheckout = async () => {
    if (!customerData.name || !customerData.phone || !customerData.address) {
      alert('Por favor completa tu nombre, teléfono y dirección')
      return
    }
    
    setSubmitting(true)
    try {
      const orderData = {
        customer: customerData,
        items: cart.map(item => ({
          product_id: item.product.id,
          qty: item.quantity,
          unit: item.unit,
          unit_price: item.product.sale_price || 0
        })),
        source: 'web',
        shipping_type: shippingType,
        notes: `Pedido desde catálogo web - ${shippingType === 'fastest' ? 'Envío rápido' : 'Envío económico'}`
      }
      
      await createOrder(orderData)
      
      alert('✅ ¡Pedido enviado! Te contactaremos pronto por WhatsApp.')
      clearCart()
      setShowCheckout(false)
      setShowCart(false)
      setCustomerData({ name: '', phone: '', address: '' })
      setShippingType('fastest')
    } catch (error) {
      alert('Error enviando pedido: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }
  
  return (
    <div className="catalog-page" style={{ minHeight: '100vh', background: 'var(--kivi-cream)', paddingTop: '64px', overflowX: 'hidden', width: '100%' }}>
      <PublicNavbar cartCount={itemCount} onCartClick={() => setShowCart(true)} />
      
      {/* Search Bar Fija */}
      <div className="search-bar-container" style={{
        position: 'sticky',
        top: '64px',
        background: '#fff',
        borderBottom: '2px solid #eee',
        padding: '12px 20px',
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ 
              flex: 1, 
              minWidth: '200px', 
              fontSize: '16px',
              padding: '14px 16px',
              border: '2px solid var(--kivi-green)',
              boxShadow: '0 2px 8px rgba(168, 213, 186, 0.2)',
              fontWeight: 500
            }}
          />
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="button ghost"
              style={{ fontSize: '14px', whiteSpace: 'nowrap' }}
            >
              <span>☰</span>
              <span className="hide-mobile">
                {categoryFilter ? categories.find(c => c.id === categoryFilter)?.name : 'Todas'}
              </span>
            </button>
            
            {showCategoryMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#fff',
                border: '2px solid #eee',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                minWidth: '200px',
                zIndex: 100
              }}>
                <button
                  onClick={() => {
                    setCategoryFilter(null)
                    setShowCategoryMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: !categoryFilter ? '#f0f0f0' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: !categoryFilter ? 700 : 400
                  }}
                >
                  Todas las categorías
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter(cat.id)
                      setShowCategoryMenu(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: categoryFilter === cat.id ? '#f0f0f0' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: categoryFilter === cat.id ? 700 : 400
                    }}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ofertas de la Semana */}
      {weeklyOffers.length > 0 && (
        <div className="weekly-offers-container" style={{ padding: '20px 20px 0', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderRadius: '12px',
            border: '2px solid #ff9800',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '22px',
              fontWeight: 800,
              color: '#e65100',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🏷️</span>
              <span>Ofertas de la Semana</span>
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: '100%'
            }}>
              {weeklyOffers.map(offer => (
                <div
                  key={offer.id}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '2px solid #ff5722',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Badge de descuento */}
                  {offer.product?.sale_price && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#ff5722',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      zIndex: 1
                    }}>
                      -{Math.round((1 - offer.special_price / offer.product.sale_price) * 100)}%
                    </div>
                  )}
                  
                  {/* Imagen */}
                  {offer.product?.photo_url && (
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      marginBottom: '8px'
                    }}>
                      <img
                        src={getImageUrl(offer.product.photo_url)}
                        alt={offer.product.name}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Info */}
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    {offer.product?.name}
                  </div>
                  
                  {/* Precios */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      textDecoration: 'line-through'
                    }}>
                      ${offer.product?.sale_price?.toLocaleString('es-CL')}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ff5722'
                    }}>
                      ${offer.special_price.toLocaleString('es-CL')}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    / {offer.product?.unit === 'kg' ? 'kg' : 'unidad'}
                  </div>
                  
                  {/* Botón agregar */}
                  <button
                    onClick={() => handleAddClick(offer.product)}
                    className="button button-sm"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      justifyContent: 'center'
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Products Grid */}
      <div className="products-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              No se encontraron productos
            </div>
            <div style={{ fontSize: '14px' }}>
              Intenta con otra búsqueda o categoría
            </div>
          </div>
        ) : (
          <div 
            className="products-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: '100%'
            }}
          >
            {filteredProducts.map(product => {
              const inCart = hasProductInCart(product.id)
              const cartItemKg = getCartItem(product.id, 'kg')
              const cartItemUnit = getCartItem(product.id, 'unit')
              const isAdding = addingProduct?.id === product.id
              
              return (
                <div
                  key={product.id}
                  className="card"
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* Image */}
                  {product.photo_url && (
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      background: '#ffffff'
                    }}>
                      <img
                        src={getImageUrl(product.photo_url)}
                        alt={product.name}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {product.name}
                    </div>
                    
                    {product.sale_price && (
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: 'var(--kivi-green)',
                        textAlign: 'center',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        ${product.sale_price.toLocaleString('es-CL')}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 400,
                          color: '#666',
                          marginLeft: '4px'
                        }}>
                          / {product.unit === 'kg' ? 'kg' : 'unidad'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div style={{ 
                    width: '100%',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!inCart && (
                    <button
                      onClick={() => handleAddClick(product)}
                      className="button button-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                          fontSize: '13px',
                          height: '36px'
                      }}
                    >
                      <span>+</span>
                      <span>Agregar</span>
                    </button>
                  )}
                  
                  {inCart && (
                      <>
                      {cartItemKg && (
                          <div className="quantity-selector" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                            gap: '8px',
                            height: '36px',
                            width: '100%'
                        }}>
                          <button
                            onClick={() => updateQuantity(product.id, cartItemKg.quantity - 0.25, 'kg')}
                            className="button button-sm ghost"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              borderRadius: '50%'
                            }}
                          >
                            −
                          </button>
                          
                            <div className="quantity-display" style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            minWidth: '60px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                          }}>
                              <span className="quantity-value">{cartItemKg.quantity}</span>
                              <span className="quantity-unit">kg</span>
                          </div>
                          
                          <button
                            onClick={() => updateQuantity(product.id, cartItemKg.quantity + 0.25, 'kg')}
                            className="button button-sm"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              borderRadius: '50%'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                      
                      {cartItemUnit && (
                          <div className="quantity-selector" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                            gap: '8px',
                            height: '36px',
                            width: '100%'
                        }}>
                          <button
                            onClick={() => updateQuantity(product.id, cartItemUnit.quantity - 1, 'unit')}
                            className="button button-sm ghost"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              borderRadius: '50%'
                            }}
                          >
                            −
                          </button>
                          
                            <div className="quantity-display" style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            minWidth: '60px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                          }}>
                              <span className="quantity-value">{cartItemUnit.quantity}</span>
                              <span className="quantity-unit">u</span>
                          </div>
                          
                          <button
                            onClick={() => updateQuantity(product.id, cartItemUnit.quantity + 1, 'unit')}
                            className="button button-sm"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              borderRadius: '50%'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                      </>
                      )}
                    </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Cart Button Flotante - Centro abajo */}
      {itemCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="button"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '16px',
            fontWeight: 700,
            zIndex: 998,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>🛒</span>
          <span>Carrito</span>
          <div style={{
            background: '#fff',
            color: 'var(--kivi-green)',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '14px',
            fontWeight: 700,
            minWidth: '24px',
            textAlign: 'center'
          }}>
            {itemCount}
          </div>
        </button>
      )}
      
      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div
            onClick={() => setShowCart(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
          
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '400px',
            background: '#fff',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.2)',
            animation: 'slideInRight 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '2px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                🛒 Tu Carrito
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="button button-sm ghost"
              >
                ✕
              </button>
            </div>
            
            {/* Items */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px'
            }}>
              {cart.map(item => (
                <div
                  key={item.product.id}
                  style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '14px' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {item.quantity} {item.unit === 'kg' ? 'kg' : 'unidades'} × ${item.product.sale_price?.toLocaleString('es-CL')}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.unit)}
                      className="button button-sm ghost"
                      style={{ padding: '4px 8px' }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => {
                        const decrement = item.unit === 'kg' ? 0.25 : 1
                        updateQuantity(item.product.id, item.quantity - decrement, item.unit)
                      }}
                      className="button button-sm ghost"
                      style={{
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '50px', textAlign: 'center', fontSize: '14px' }}>
                      {item.quantity} {item.unit === 'kg' ? 'kg' : 'u'}
                    </span>
                    <button
                      onClick={() => {
                        const increment = item.unit === 'kg' ? 0.25 : 1
                        updateQuantity(item.product.id, item.quantity + increment, item.unit)
                      }}
                      className="button button-sm"
                      style={{
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '16px',
              borderTop: '2px solid #eee',
              background: '#fff'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: 800
              }}>
                <span>Total:</span>
                <span style={{ color: 'var(--kivi-green)' }}>
                  ${total.toLocaleString('es-CL')}
                </span>
              </div>
              
              <button
                onClick={() => {
                  setShowCart(false)
                  setShowCheckout(true)
                }}
                className="button"
                style={{
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <span>✅</span>
                <span>Continuar con pedido</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Checkout Modal */}
      {showCheckout && (
        <>
          <div
            onClick={() => setShowCheckout(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
          
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: 'var(--radius)',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>
              Finalizar Pedido
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Tu nombre</label>
              <input
                type="text"
                className="input"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Tu teléfono (WhatsApp)</label>
              <input
                type="tel"
                className="input"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                placeholder="Ej: +56912345678"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Tu dirección de entrega</label>
              <input
                type="text"
                className="input"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                placeholder="Ej: Av. Principal 123, Depto 45"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="label" style={{ marginBottom: '12px', display: 'block' }}>Tipo de envío</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Más Rápido */}
                <div
                  onClick={() => setShippingType('fastest')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${shippingType === 'fastest' ? 'var(--kivi-green)' : '#ddd'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: shippingType === 'fastest' ? '#e8f5e9' : '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Más Rápido</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    ¿Pedido urgente? Recíbelo hoy mismo
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kivi-green)' }}>
                    +$2.500
                  </div>
                </div>

                {/* Más Económico */}
                <div
                  onClick={() => setShippingType('cheapest')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${shippingType === 'cheapest' ? 'var(--kivi-green)' : '#ddd'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: shippingType === 'cheapest' ? '#e8f5e9' : '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Más Económico</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    Consolidamos envíos para mejores precios
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kivi-orange)' }}>
                    5% desc. en todo
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resumen de totales */}
            <div style={{
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>Subtotal:</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>
              {shippingType === 'fastest' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--kivi-green)' }}>
                  <span>Envío rápido:</span>
                  <span>+$2.500</span>
                </div>
              )}
              {shippingType === 'cheapest' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--kivi-orange)' }}>
                  <span>Descuento 5%:</span>
                  <span>-${Math.round(total * 0.05).toLocaleString('es-CL')}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '2px solid #ddd',
                fontSize: '18px',
                fontWeight: 800
              }}>
                <span>Total:</span>
                <span style={{ color: 'var(--kivi-green)' }}>
                  ${shippingType === 'fastest' 
                    ? (total + 2500).toLocaleString('es-CL')
                    : shippingType === 'cheapest'
                    ? (total - Math.round(total * 0.05)).toLocaleString('es-CL')
                    : total.toLocaleString('es-CL')
                  }
                </span>
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              background: '#FFF4E5',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              💡 Te contactaremos por WhatsApp para confirmar tu pedido y coordinar la entrega.
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowCheckout(false)}
                className="button ghost"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                className="button"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loading"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Modal para seleccionar unidad */}
      {addingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setAddingProduct(null)}
          title={`Agregar ${addingProduct.name}`}
          size="sm"
        >
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--kivi-text)', 
              marginBottom: '24px',
              lineHeight: 1.5,
              fontWeight: 600
            }}>
              Selecciona cómo quieres comprar este producto:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="button" 
                style={{ 
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'var(--kivi-green)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }} 
                onClick={() => handleSelectUnit(addingProduct, 'kg')}
              >
                <div style={{ fontSize: '20px' }}>⚖️</div>
                <div>Por kilogramo</div>
              </button>
              
              <button 
                className="button" 
                style={{ 
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'var(--kivi-green)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }} 
                onClick={() => handleSelectUnit(addingProduct, 'unit')}
              >
                <div style={{ fontSize: '20px' }}>📦</div>
                <div>Por unidad</div>
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      <Footer />
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
            position: relative !important;
          }
          .hide-mobile { display: none !important; }
          .catalog-page {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
            position: relative !important;
          }
          .products-container {
            padding: 8px 4px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            width: 100% !important;
            margin: 0 !important;
            position: relative !important;
          }
          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 4px !important;
            justify-items: stretch !important;
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
            position: relative !important;
          }
          .products-grid .card {
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            padding: 4px !important;
            gap: 4px !important;
            margin: 0 !important;
            overflow: hidden !important;
            position: relative !important;
          }
          .products-grid .card > div:first-child {
            padding-top: 60% !important;
            background: #ffffff !important;
          }
          .products-grid .card > div:first-child img {
            border-radius: 4px !important;
            object-fit: contain !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
          }
          .products-grid .card > div:nth-child(2) {
            text-align: center !important;
          }
          .products-grid .card > div:nth-child(2) > div:first-child {
            font-size: 15px !important;
            font-weight: 700 !important;
            margin-bottom: 4px !important;
            line-height: 1.3 !important;
            text-align: center !important;
            min-height: 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .products-grid .card > div:nth-child(2) > div:last-child {
            font-size: 18px !important;
            font-weight: 800 !important;
            text-align: center !important;
            height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .products-grid .card button {
            font-size: 14px !important;
            padding: 10px 6px !important;
            font-weight: 700 !important;
            min-height: 36px !important;
          }
          .products-grid .quantity-selector {
            gap: 0 !important;
          }
          .products-grid .quantity-display {
            flex-direction: column !important;
            gap: 0 !important;
            height: 32px !important;
            min-width: 32px !important;
            justify-content: center !important;
          }
          .products-grid .quantity-value {
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
          .products-grid .quantity-unit {
            font-size: 10px !important;
            line-height: 1 !important;
            opacity: 0.8 !important;
          }
          .weekly-offers-container {
            padding: 8px 4px 0 !important;
            overflow-x: hidden !important;
          }
          .weekly-offers-container > div {
            padding: 12px !important;
          }
          .weekly-offers-container > div > div {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 4px !important;
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          .search-bar-container {
            padding: 8px 4px !important;
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .search-bar-container > div {
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 4px !important;
          }
          .search-bar-container input {
            min-width: 0 !important;
            max-width: 100% !important;
            flex: 1 1 auto !important;
          }
        }
      `}</style>
    </div>
  )
}

