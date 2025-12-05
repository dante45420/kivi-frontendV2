/**
 * Página Pública: Catálogo V3 - Versión limpia con 3 columnas garantizadas
 */
import { useState, useEffect } from 'react'
import { fetchProducts } from '../../api/products'
import { fetchCategories } from '../../api/categories'
import { fetchWeeklyOffers } from '../../api/weeklyOffers'
import { createOrder } from '../../api/orders'
import { useCart } from '../../hooks/useCart'
import { generateCatalogPDF } from '../../utils/catalogPdf'
import { getImageUrl } from '../../utils/imageUrl'
import { getEffectivePrice, hasActiveOffer, getActiveOffer } from '../../utils/productPrice'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'

export default function CatalogV3() {
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
  
  // Calcular total con ofertas
  const cartTotalWithOffers = cart.reduce((sum, item) => {
    const itemPrice = getEffectivePrice(item.product, weeklyOffers)
    return sum + (itemPrice * item.quantity)
  }, 0)
  
  // Checkout
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerData, setCustomerData] = useState({ name: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // Adding state
  const [addingProduct, setAddingProduct] = useState(null)
  
  
  useEffect(() => {
    loadData()
  }, [])
  
  
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showCheckout) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [showCheckout])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, categoriesData, offersData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchWeeklyOffers(true, true)
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
  
  const handleDownloadCatalog = async () => {
    try {
      await generateCatalogPDF(products, weeklyOffers)
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
    const qty = unit === 'kg' ? 0.25 : 1
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
          unit_price: getEffectivePrice(item.product, weeklyOffers)
        })),
        source: 'web',
        shipping_type: 'normal',
        notes: 'Pedido desde catálogo web'
      }
      
      await createOrder(orderData)
      
      alert('✅ ¡Pedido enviado! Te contactaremos pronto por WhatsApp.')
      clearCart()
      setShowCheckout(false)
      setShowCart(false)
      setCustomerData({ name: '', phone: '', address: '' })
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
    <div className="catalog-v3-page">
      <PublicNavbar cartCount={itemCount} onCartClick={() => setShowCart(true)} />
      
      {/* Search Bar */}
      <div className="catalog-search-bar">
        <div className="catalog-search-inner">
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="button ghost"
              style={{ 
                background: '#fff', 
                border: '2px solid var(--kivi-green)',
                color: 'var(--kivi-text-dark)',
                fontWeight: 700
              }}
            >
              <span>📂</span>
              <span className="hide-mobile">
                {categoryFilter ? categories.find(c => c.id === categoryFilter)?.name : 'Filtrar por categoría'}
              </span>
              <span className="hide-desktop">Filtrar</span>
            </button>
            
            {showCategoryMenu && (
              <>
                <div 
                  className="catalog-overlay" 
                  onClick={() => setShowCategoryMenu(false)}
                  style={{ zIndex: 99 }}
                />
                <div className="category-menu" style={{ zIndex: 100 }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #eee',
                    fontWeight: 700,
                    color: 'var(--kivi-text-dark)',
                    fontSize: '14px'
                  }}>
                    Selecciona una categoría:
                  </div>
                  <button
                    onClick={() => {
                      setCategoryFilter(null)
                      setShowCategoryMenu(false)
                    }}
                    className={!categoryFilter ? 'active' : ''}
                    style={{ fontWeight: !categoryFilter ? 700 : 400 }}
                  >
                    📦 Todas las categorías
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategoryFilter(cat.id)
                        setShowCategoryMenu(false)
                      }}
                      className={categoryFilter === cat.id ? 'active' : ''}
                      style={{ fontWeight: categoryFilter === cat.id ? 700 : 400 }}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Ofertas de la Semana */}
      {weeklyOffers.length > 0 && (
        <div className="catalog-offers-section">
          <h2 className="catalog-offers-title-simple">
            <span>🏷️</span>
            <span>Ofertas de la Semana</span>
          </h2>
          
          <div className="catalog-offers-grid-2">
            {weeklyOffers.map(offer => {
                const offerInCart = hasProductInCart(offer.product?.id)
                const offerCartItemKg = getCartItem(offer.product?.id, 'kg')
                const offerCartItemUnit = getCartItem(offer.product?.id, 'unit')
                
                return (
                  <div key={offer.id} className="catalog-offer-card">
                    {offer.product?.sale_price && (
                      <div className="offer-badge">
                        -{Math.round((1 - offer.special_price / offer.product.sale_price) * 100)}%
                      </div>
                    )}
                    
                    {offer.product?.photo_url && (
                      <div className="catalog-image-container">
                        <img
                          src={getImageUrl(offer.product.photo_url)}
                          alt={offer.product.name}
                        />
                      </div>
                    )}
                    
                    <div className="catalog-product-name">{offer.product?.name}</div>
                    
                    <div className="catalog-price-row">
                      <div className="catalog-price-old">
                        ${offer.product?.sale_price?.toLocaleString('es-CL')}
                      </div>
                      <div className="catalog-price-new">
                        ${offer.special_price.toLocaleString('es-CL')}
                      </div>
                    </div>
                    
                    <div className="catalog-price-unit">
                      / {offer.product?.unit === 'kg' ? 'kg' : 'unidad'}
                    </div>
                    
                    <div className="catalog-product-actions">
                      {!offerInCart && (
                        <button
                          onClick={() => handleAddClick(offer.product)}
                          className="button button-sm catalog-add-btn"
                        >
                          + Agregar
                        </button>
                      )}
                      
                      {offerInCart && (
                        <>
                          {offerCartItemKg && (
                            <div className="catalog-quantity-controls">
                              <button
                                onClick={() => updateQuantity(offer.product.id, offerCartItemKg.quantity - 0.25, 'kg')}
                                className="button button-sm ghost catalog-qty-btn"
                              >
                                −
                              </button>
                              <div className="catalog-quantity-display">
                                <span>{offerCartItemKg.quantity}</span>
                                <span>kg</span>
                              </div>
                              <button
                                onClick={() => updateQuantity(offer.product.id, offerCartItemKg.quantity + 0.25, 'kg')}
                                className="button button-sm catalog-qty-btn"
                              >
                                +
                              </button>
                            </div>
                          )}
                          
                          {offerCartItemUnit && (
                            <div className="catalog-quantity-controls">
                              <button
                                onClick={() => updateQuantity(offer.product.id, offerCartItemUnit.quantity - 1, 'unit')}
                                className="button button-sm ghost catalog-qty-btn"
                              >
                                −
                              </button>
                              <div className="catalog-quantity-display">
                                <span>{offerCartItemUnit.quantity}</span>
                                <span>u</span>
                              </div>
                              <button
                                onClick={() => updateQuantity(offer.product.id, offerCartItemUnit.quantity + 1, 'unit')}
                                className="button button-sm catalog-qty-btn"
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
        </div>
      )}
      
      {/* Products Grid */}
      <div className="catalog-products-section">
        {filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <div className="catalog-empty-icon">🔍</div>
            <div className="catalog-empty-title">No se encontraron productos</div>
            <div className="catalog-empty-text">Intenta con otra búsqueda o categoría</div>
          </div>
        ) : (
          <div className="catalog-grid-3">
            {filteredProducts.map(product => {
              const inCart = hasProductInCart(product.id)
              const cartItemKg = getCartItem(product.id, 'kg')
              const cartItemUnit = getCartItem(product.id, 'unit')
              const effectivePrice = getEffectivePrice(product, weeklyOffers)
              const hasOffer = hasActiveOffer(product, weeklyOffers)
              const offer = getActiveOffer(product, weeklyOffers)
              
              return (
                <div key={product.id} className="catalog-product-card">
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
                    
                    {effectivePrice > 0 && (
                      <div className="catalog-price">
                        {hasOffer && product.sale_price && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '4px', 
                            marginBottom: '4px',
                            width: '100%',
                            maxWidth: '100%',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#999', 
                              textDecoration: 'line-through',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              ${product.sale_price.toLocaleString('es-CL')}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              background: '#ff5722', 
                              color: '#fff', 
                              padding: '2px 4px', 
                              borderRadius: '4px', 
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              -{Math.round((1 - offer.special_price / product.sale_price) * 100)}%
                            </span>
                          </div>
                        )}
                        <div style={{ 
                          fontSize: hasOffer ? '16px' : '16px', 
                          fontWeight: 800, 
                          color: hasOffer ? '#ff5722' : 'var(--kivi-green)',
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          ${effectivePrice.toLocaleString('es-CL')}
                          <span className="catalog-price-unit-small">
                            / {product.unit === 'kg' ? 'kg' : 'unidad'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="catalog-product-actions">
                    {!inCart && (
                      <button
                        onClick={() => handleAddClick(product)}
                        className="button button-sm catalog-add-btn"
                      >
                        <span>+</span>
                        <span>Agregar</span>
                      </button>
                    )}
                    
                    {inCart && (
                      <>
                        {cartItemKg && (
                          <div className="catalog-quantity-controls">
                            <button
                              onClick={() => updateQuantity(product.id, cartItemKg.quantity - 0.25, 'kg')}
                              className="button button-sm ghost catalog-qty-btn"
                            >
                              −
                            </button>
                            <div className="catalog-quantity-display">
                              <span>{cartItemKg.quantity}</span>
                              <span>kg</span>
                            </div>
                            <button
                              onClick={() => updateQuantity(product.id, cartItemKg.quantity + 0.25, 'kg')}
                              className="button button-sm catalog-qty-btn"
                            >
                              +
                            </button>
                          </div>
                        )}
                        
                        {cartItemUnit && (
                          <div className="catalog-quantity-controls">
                            <button
                              onClick={() => updateQuantity(product.id, cartItemUnit.quantity - 1, 'unit')}
                              className="button button-sm ghost catalog-qty-btn"
                            >
                              −
                            </button>
                            <div className="catalog-quantity-display">
                              <span>{cartItemUnit.quantity}</span>
                              <span>u</span>
                            </div>
                            <button
                              onClick={() => updateQuantity(product.id, cartItemUnit.quantity + 1, 'unit')}
                              className="button button-sm catalog-qty-btn"
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
      
      {/* Cart Button Flotante */}
      {itemCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="catalog-cart-button"
        >
          <span>🛒</span>
          <span>Carrito</span>
          <div className="catalog-cart-count">{itemCount}</div>
        </button>
      )}
      
      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div className="catalog-overlay" onClick={() => setShowCart(false)} />
          <div className="catalog-cart-sidebar">
            <div className="catalog-cart-header">
              <h2>🛒 Tu Carrito</h2>
              <button
                onClick={() => setShowCart(false)}
                className="button button-sm ghost"
              >
                ✕
              </button>
            </div>
            
            <div className="catalog-cart-items">
              {cart.map(item => {
                const itemEffectivePrice = getEffectivePrice(item.product, weeklyOffers)
                const itemHasOffer = hasActiveOffer(item.product, weeklyOffers)
                const itemOffer = getActiveOffer(item.product, weeklyOffers)
                // Detectar si hay unidad cambiada
                const needsConversion = item.product.unit && item.unit !== item.product.unit
                const hasConversion = item.product.avg_units_per_kg !== null && item.product.avg_units_per_kg !== undefined
                let itemTotal = 0
                let itemTotalText = ''
                
                if (needsConversion && hasConversion) {
                  // Calcular aproximado usando conversión
                  if (item.unit === 'unit' && item.product.unit === 'kg') {
                    const kgEquivalent = item.quantity / item.product.avg_units_per_kg
                    itemTotal = Math.round(kgEquivalent * itemEffectivePrice)
                    itemTotalText = `≈ ${itemTotal.toLocaleString('es-CL')}`
                  } else if (item.unit === 'kg' && item.product.unit === 'unit') {
                    const unitsEquivalent = item.quantity * item.product.avg_units_per_kg
                    itemTotal = Math.round(unitsEquivalent * itemEffectivePrice)
                    itemTotalText = `≈ ${itemTotal.toLocaleString('es-CL')}`
                  }
                } else if (needsConversion && !hasConversion) {
                  itemTotalText = 'Por definir (unidad cambiada)'
                } else {
                  itemTotal = itemEffectivePrice * item.quantity
                  itemTotalText = itemTotal.toLocaleString('es-CL')
                }
                
                return (
                <div key={`${item.product.id}-${item.unit}`} className="catalog-cart-item">
                  <div className="catalog-cart-item-header">
                    <div>
                        <div className="catalog-cart-item-name">{item.product.name}</div>
                        <div className="catalog-cart-item-details">
                          {item.quantity} {item.unit === 'kg' ? 'kg' : 'unidades'} × 
                          {itemHasOffer && item.product.sale_price ? (
                            <span>
                              <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '4px' }}>
                                ${item.product.sale_price.toLocaleString('es-CL')}
                              </span>
                              <span style={{ color: '#ff5722', fontWeight: 700 }}>
                                ${itemEffectivePrice.toLocaleString('es-CL')}
                              </span>
                            </span>
                          ) : (
                            <span> ${itemEffectivePrice.toLocaleString('es-CL')}</span>
                          )}
                        </div>
                        {needsConversion && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: !hasConversion ? '#ff6b00' : '#666', 
                            fontWeight: 700, 
                            marginTop: '2px',
                            background: !hasConversion ? '#fff3e0' : 'transparent',
                            padding: !hasConversion ? '4px 6px' : '4px 6px',
                            borderRadius: '4px'
                          }}>
                            {!hasConversion 
                              ? '⚠️ Por definir (unidad cambiada)'
                              : `≈ $${itemTotalText} (conversión aplicada)`
                            }
                          </div>
                        )}
                        {itemHasOffer && !needsConversion && (
                          <div style={{ fontSize: '11px', color: '#ff5722', fontWeight: 700, marginTop: '2px' }}>
                            🏷️ Oferta: -{Math.round((1 - itemOffer.special_price / item.product.sale_price) * 100)}%
                          </div>
                        )}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.unit)}
                      className="button button-sm ghost"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="catalog-cart-item-controls">
                    <button
                      onClick={() => {
                        const decrement = item.unit === 'kg' ? 0.25 : 1
                        updateQuantity(item.product.id, item.quantity - decrement, item.unit)
                      }}
                      className="button button-sm ghost catalog-cart-qty-btn"
                    >
                      −
                    </button>
                    <span className="catalog-cart-qty-display">
                      {item.quantity} {item.unit === 'kg' ? 'kg' : 'u'}
                    </span>
                    <button
                      onClick={() => {
                        const increment = item.unit === 'kg' ? 0.25 : 1
                        updateQuantity(item.product.id, item.quantity + increment, item.unit)
                      }}
                      className="button button-sm catalog-cart-qty-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
            
            <div className="catalog-cart-footer">
              <div className="catalog-cart-total">
                <span>Total:</span>
                <span>${(() => {
                  let total = 0
                  let hasUndefined = false
                  cart.forEach(item => {
                    const needsConversion = item.product.unit && item.unit !== item.product.unit
                    const hasConversion = item.product.avg_units_per_kg !== null && item.product.avg_units_per_kg !== undefined
                    const itemPrice = getEffectivePrice(item.product, weeklyOffers)
                    
                    if (needsConversion && hasConversion) {
                      if (item.unit === 'unit' && item.product.unit === 'kg') {
                        const kgEquivalent = item.quantity / item.product.avg_units_per_kg
                        total += Math.round(kgEquivalent * itemPrice)
                      } else if (item.unit === 'kg' && item.product.unit === 'unit') {
                        const unitsEquivalent = item.quantity * item.product.avg_units_per_kg
                        total += Math.round(unitsEquivalent * itemPrice)
                      }
                    } else if (needsConversion && !hasConversion) {
                      hasUndefined = true
                    } else {
                      total += itemPrice * item.quantity
                    }
                  })
                  if (hasUndefined) {
                    return 'Por definir'
                  }
                  return total.toLocaleString('es-CL')
                })()}</span>
              </div>
              <button
                onClick={() => {
                  setShowCart(false)
                  setShowCheckout(true)
                }}
                className="button"
                style={{ background: '#333', color: '#fff', fontWeight: 800 }}
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
          <div className="catalog-overlay" onClick={() => setShowCheckout(false)} />
          <div className="catalog-checkout-modal">
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800, flexShrink: 0 }}>Finalizar Pedido</h2>
            
            <div className="catalog-checkout-modal-content">
              <div className="catalog-checkout-field">
                <label className="label">Tu nombre</label>
                <input
                  type="text"
                  className="input"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              
              <div className="catalog-checkout-field">
                <label className="label">Tu teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  className="input"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="Ej: +56912345678"
                />
              </div>
              
              <div className="catalog-checkout-field">
                <label className="label">Tu dirección de entrega</label>
                <input
                  type="text"
                  className="input"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Ej: Av. Principal 123, Depto 45"
                />
              </div>
              
              <div className="catalog-checkout-summary">
                <div className="catalog-summary-row">
                  <span>Total:</span>
                  <span>${cartTotalWithOffers.toLocaleString('es-CL')}</span>
                </div>
              </div>
              
              <div className="catalog-checkout-note">
                💡 Te contactaremos por WhatsApp para confirmar tu pedido y coordinar la entrega.
              </div>
            </div>
            
            <div className="catalog-checkout-buttons" style={{ flexShrink: 0, marginTop: '16px' }}>
              <button
                onClick={() => setShowCheckout(false)}
                className="button ghost"
                disabled={submitting}
                style={{ background: '#fff', color: '#000', border: '2px solid #000', fontWeight: 800 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                className="button"
                disabled={submitting}
                style={{ background: '#333', color: '#fff', fontWeight: 800 }}
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
          <div className="catalog-unit-selector">
            <p>Selecciona cómo quieres comprar este producto:</p>
            <div className="catalog-unit-buttons">
              <button 
                className="button catalog-unit-btn" 
                onClick={() => handleSelectUnit(addingProduct, 'kg')}
              >
                <div>⚖️</div>
                <div>Por kilogramo</div>
              </button>
              <button 
                className="button catalog-unit-btn" 
                onClick={() => handleSelectUnit(addingProduct, 'unit')}
              >
                <div>📦</div>
                <div>Por unidad</div>
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      <Footer />
      
      <style>{`
        /* RESET Y BASE */
        .catalog-v3-page {
          min-height: 100vh;
          background: var(--kivi-cream);
          padding-top: 64px;
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }
        
        /* GRID DE 3 COLUMNAS - GARANTIZADO CON PORCENTAJES FIJOS */
        .catalog-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .catalog-grid-3 > * {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* Search Bar */
        .catalog-search-bar {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          background: #fff;
          border-bottom: 2px solid #eee;
          padding: 12px 20px;
          z-index: 50;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          width: 100%;
          box-sizing: border-box;
        }
        
        .catalog-search-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .catalog-search-inner input {
          flex: 1;
          min-width: 200px;
          font-size: 16px;
          padding: 14px 16px;
          border: 2px solid var(--kivi-green);
          box-shadow: 0 2px 8px rgba(168, 213, 186, 0.2);
          font-weight: 500;
        }
        
        .category-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: #fff;
          border: 2px solid #eee;
          border-radius: var(--radius);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          min-width: 200px;
          z-index: 100;
        }
        
        .category-menu button {
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          font-weight: 400;
          color: var(--kivi-text-dark);
          transition: all 0.2s;
        }
        
        .category-menu button:hover {
          background: #f5f5f5;
        }
        
        .category-menu button.active {
          background: var(--kivi-green);
          color: #fff;
          font-weight: 700;
        }
        
        .hide-desktop {
          display: none;
        }
        
        @media (max-width: 768px) {
          .hide-desktop {
            display: inline;
          }
        }
        
        /* Ofertas */
        .catalog-offers-section {
          padding: 8px 20px 0;
          padding-top: 120px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        
        .catalog-offers-title-simple {
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 800;
          color: var(--kivi-text-dark);
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: center;
          justify-content: center;
        }
        
        .catalog-offers-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .catalog-offers-grid-2 {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        
        .catalog-offer-card {
          background: #fff;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #eee;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .offer-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ff5722;
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          z-index: 1;
        }
        
        /* Products Section */
        .catalog-products-section {
          padding: 8px 20px 20px;
          padding-top: 8px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        
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
        
        .catalog-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .catalog-price-old {
          font-size: 12px;
          color: #999;
          text-decoration: line-through;
        }
        
        .catalog-price-new {
          font-size: 18px;
          font-weight: 800;
          color: #ff5722;
        }
        
        .catalog-price-unit {
          font-size: 11px;
          color: #666;
        }
        
        .catalog-product-actions {
          width: 100%;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .catalog-add-btn {
          width: 100%;
          justify-content: center;
          font-size: 13px;
          height: 36px;
          background: #333 !important;
          color: #fff !important;
          font-weight: 800;
        }
        
        .catalog-quantity-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 36px;
          width: 100%;
        }
        
        .catalog-qty-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border-radius: 50%;
        }
        
        .catalog-quantity-display {
          font-weight: 700;
          font-size: 13px;
          min-width: 60px;
          text-align: center;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        
        /* Empty State */
        .catalog-empty {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        
        .catalog-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .catalog-empty-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .catalog-empty-text {
          font-size: 14px;
        }
        
        /* Cart */
        .catalog-cart-button {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: var(--radius-pill);
          font-size: 16px;
          font-weight: 700;
          z-index: 998;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border: none;
          background: var(--kivi-green);
          color: #fff;
          cursor: pointer;
        }
        
        .catalog-cart-count {
          background: #fff;
          color: var(--kivi-green);
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 14px;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }
        
        .catalog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        
        .catalog-cart-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background: #fff;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 16px rgba(0,0,0,0.2);
          animation: slideInRight 0.3s ease;
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          touch-action: pan-y;
        }
        
        .catalog-cart-sidebar > * {
          flex-shrink: 0;
        }
        
        .catalog-cart-sidebar > .catalog-cart-items {
          flex: 1 1 auto;
          min-height: 0;
        }
        
        @media (max-width: 768px) {
          .catalog-cart-sidebar {
            height: 100vh;
            height: 100dvh;
            max-height: 100vh;
            max-height: 100dvh;
          }
          
          .catalog-cart-footer {
            padding-bottom: calc(16px + max(env(safe-area-inset-bottom, 0px), 100px));
            position: sticky;
            bottom: 0;
          }
          
          .catalog-cart-items {
            padding-bottom: 300px;
          }
          
          .catalog-cart-sidebar {
            display: flex;
            flex-direction: column;
          }
        }
        
        .catalog-cart-header {
          flex-shrink: 0;
        }
        
        .catalog-cart-items {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          padding-bottom: 200px;
          -webkit-overflow-scrolling: touch;
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        .catalog-cart-header {
          padding: 20px;
          border-bottom: 2px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .catalog-cart-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
        }
        
        .catalog-cart-items {
          padding: 16px;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          scroll-behavior: smooth;
        }
        
        .catalog-cart-item {
          padding: 12px;
          background: #f8f9fa;
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
        }
        
        .catalog-cart-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .catalog-cart-item-name {
          font-weight: 700;
          margin-bottom: 4px;
          font-size: 14px;
        }
        
        .catalog-cart-item-details {
          font-size: 13px;
          color: #666;
        }
        
        .catalog-cart-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        
        .catalog-cart-qty-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .catalog-cart-qty-display {
          font-weight: 700;
          min-width: 50px;
          text-align: center;
          font-size: 14px;
        }
        
        .catalog-cart-footer {
          padding: 16px;
          padding-bottom: calc(16px + max(env(safe-area-inset-bottom, 0px), 20px));
          border-top: 2px solid #eee;
          background: #fff;
          box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          min-height: fit-content;
          flex-shrink: 0;
          margin-top: auto;
        }
        
        .catalog-cart-total {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 18px;
          font-weight: 800;
          padding: 8px 0;
          align-items: center;
        }
        
        .catalog-cart-total span:last-child {
          color: var(--kivi-green);
          font-size: 20px;
        }
        
        .catalog-cart-footer .button {
          height: 48px;
          font-size: 16px;
          font-weight: 700;
          padding: 12px 20px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        /* Checkout */
        .catalog-checkout-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: var(--radius);
          padding: 20px;
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        @media (min-width: 769px) {
          .catalog-checkout-modal {
            max-width: 400px;
            width: 400px;
          }
        }
        
        .catalog-checkout-modal-content {
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
        }
        
        .catalog-checkout-modal h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 800;
          flex-shrink: 0;
        }
        
        .catalog-checkout-field {
          margin-bottom: 16px;
        }
        
        .catalog-shipping-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        @media (max-width: 768px) {
          .catalog-shipping-options {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
        
        .catalog-shipping-option {
          padding: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          background: #fff;
          transition: all 0.2s;
        }
        
        .catalog-shipping-option.active {
          border-color: var(--kivi-green);
          background: #e8f5e9;
        }
        
        .catalog-shipping-option.disabled {
          opacity: 0.6;
          cursor: not-allowed !important;
          pointer-events: none;
        }
        
        .catalog-shipping-option.disabled:hover {
          border-color: #ddd;
          background: #fff;
        }
        
        .catalog-shipping-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .catalog-shipping-title {
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .catalog-shipping-desc {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .catalog-shipping-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--kivi-green);
        }
        
        .catalog-shipping-price.discount {
          color: var(--kivi-orange);
        }
        
        .catalog-checkout-summary {
          padding: 16px;
          background: #f8f9fa;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
        }
        
        .catalog-summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .catalog-summary-row.highlight {
          color: var(--kivi-green);
        }
        
        .catalog-summary-row.highlight.discount {
          color: var(--kivi-orange);
        }
        
        .catalog-summary-total {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 2px solid #ddd;
          font-size: 18px;
          font-weight: 800;
        }
        
        .catalog-summary-total span:last-child {
          color: var(--kivi-green);
        }
        
        .catalog-checkout-note {
          padding: 12px;
          background: #FFF4E5;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-size: 13px;
          line-height: 1.5;
        }
        
        .catalog-checkout-buttons {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .catalog-checkout-buttons .button {
          flex: 1;
        }
        
        /* Prevenir scroll del body cuando el modal está abierto */
        body.modal-open {
          overflow: hidden !important;
        }
        
        /* Unit Selector */
        .catalog-unit-selector {
          text-align: center;
          padding: 8px 0;
        }
        
        .catalog-unit-selector p {
          font-size: 18px;
          color: var(--kivi-text);
          margin-bottom: 24px;
          line-height: 1.5;
          font-weight: 600;
        }
        
        .catalog-unit-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .catalog-unit-btn {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          background: #000;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        
        .catalog-unit-btn > div:first-child {
          font-size: 20px;
        }
        
        /* MOBILE - FORZAR 3 COLUMNAS */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          
          .catalog-v3-page {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          
          .hide-mobile {
            display: none !important;
          }
          
          .catalog-search-bar {
            padding: 8px 4px !important;
          }
          
          .catalog-offers-section {
            padding: 4px 4px 0 !important;
            padding-top: 120px !important;
          }
          
          .catalog-offers-box {
            padding: 8px !important;
            margin-bottom: 4px !important;
          }
          
          .catalog-products-section {
            padding: 4px 4px 20px !important;
            padding-top: 4px !important;
          }
          
          /* GARANTIZAR 3 COLUMNAS EN MÓVIL CON GRID */
          .catalog-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4px !important;
            width: 100% !important;
            max-width: 100vw !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          
          .catalog-grid-3 > * {
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          
          .catalog-product-card,
          .catalog-offer-card {
            padding: 4px !important;
            gap: 4px !important;
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
          
          .catalog-add-btn,
          .catalog-qty-btn {
            font-size: 12px !important;
            padding: 6px !important;
            height: 28px !important;
          }
          
          .catalog-quantity-display {
            font-size: 11px !important;
            min-width: 40px !important;
          }
        }
      `}</style>
    </div>
  )
}

