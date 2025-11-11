/**
 * Página: Compras / Lista Consolidada Global
 * Modal ultra minimalista con conversión obligatoria cuando cambia la unidad
 */
import { useState, useEffect } from 'react'
import { fetchOrders } from '../api/orders'
import { fetchProducts } from '../api/products'
import Loader from '../components/Loader'

export default function Shopping() {
  const [consolidatedList, setConsolidatedList] = useState([])
  const [products, setProducts] = useState({}) // { product_id: product }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // Protección contra doble submit
  const [showModal, setShowModal] = useState(false)
  const [purchaseData, setPurchaseData] = useState({}) // { product_id_unit: { price_total, conversion_qty, ... } }
  const [expandedProducts, setExpandedProducts] = useState(new Set())

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      // Cargar productos
      const allProducts = await fetchProducts()
      const productsMap = {}
      allProducts.forEach(p => { productsMap[p.id] = p })
      setProducts(productsMap)
      
      // Cargar pedidos emitidos
      const allOrders = await fetchOrders()
      const emittedOrders = allOrders.filter(o => o.status === 'emitted')
      
      if (emittedOrders.length === 0) {
        setConsolidatedList([])
        setLoading(false)
        return
      }
      
      // Cargar detalles de cada pedido EN PARALELO (mucho más rápido)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const ordersData = await Promise.all(
        emittedOrders.map(async (order) => {
          try {
            const response = await fetch(`${API_URL}/api/orders/${order.id}`)
            const data = await response.json()
            if (Array.isArray(data.items)) {
              return data.items.map(item => ({ ...item, order_id: order.id }))
            }
            return []
          } catch (err) {
            console.error(`Error cargando orden ${order.id}:`, err)
            return []
          }
        })
      )
      // Aplanar el array de arrays
      const allItems = ordersData.flat()
      
      // Consolidar por producto + unidad
      const byProduct = {}
      
      allItems.forEach(item => {
        const key = `${item.product_id}_${item.unit}`
        if (!byProduct[key]) {
          const product = productsMap[item.product_id]
          byProduct[key] = {
            product_id: item.product_id,
            product_name: item.product_name || item.product?.name || 'Producto',
            unit: item.unit,
            product_default_unit: product?.unit || 'kg',
            total_qty: 0,
            customers: [],
            purchased: false
          }
        }
        
        byProduct[key].total_qty += item.qty || 0
        byProduct[key].customers.push({
          customer_name: item.customer_name || item.customer?.name || 'Cliente',
          qty: item.qty,
          order_id: item.order_id
        })
      })
      
      // Convertir a array y ordenar
      const list = Object.values(byProduct).sort((a, b) => 
        (a.product_name || '').localeCompare(b.product_name || '')
      )
      
      setConsolidatedList(list)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  function downloadList() {
    const text = consolidatedList.map(item => {
      const qty = item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)
      return `${item.product_name}: ${qty} ${item.unit}`
    }).join('\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-compras-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleExpanded(key) {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  function handlePriceChange(key, field, value) {
    setPurchaseData(prev => {
      const item = consolidatedList.find(i => `${i.product_id}_${i.unit}` === key)
      const updated = { ...prev }
      
      if (!updated[key]) updated[key] = {}
      updated[key][field] = value
      
      // Auto-calcular el otro campo de precio
      if (field === 'price_total' && item && value) {
        updated[key].price_per_unit = (parseFloat(value) / item.total_qty).toFixed(0)
      } else if (field === 'price_per_unit' && item && value) {
        updated[key].price_total = (parseFloat(value) * item.total_qty).toFixed(0)
      }
      
      // Si se ingresa conversion_qty y no hay conversion_unit válido, usar el default del producto
      if (field === 'conversion_qty' && value && item) {
        if (!updated[key].conversion_unit || updated[key].conversion_unit === 'undefined') {
          updated[key].conversion_unit = item.product_default_unit
        }
      }
      
      return updated
    })
  }

  async function saveAllPurchases() {
    const toSave = []
    const errors = []
    
    // Primero, limpiar y corregir datos de conversión
    const cleanedPurchaseData = { ...purchaseData }
    consolidatedList.forEach(item => {
      const key = `${item.product_id}_${item.unit}`
      const data = cleanedPurchaseData[key]
      const needsConversion = item.unit !== item.product_default_unit
      
      if (data && needsConversion && data.conversion_qty) {
        // Si hay conversion_qty pero no conversion_unit, asignar el default
        if (!data.conversion_unit || data.conversion_unit === 'undefined') {
          cleanedPurchaseData[key] = {
            ...data,
            conversion_unit: item.product_default_unit
          }
        }
      }
    })
    
    consolidatedList.forEach(item => {
      const key = `${item.product_id}_${item.unit}`
      const data = cleanedPurchaseData[key]
      
      if (data && data.price_total) {
        // Verificar si necesita conversión (unidad del item != unidad del producto)
        const needsConversion = item.unit !== item.product_default_unit
        
        if (needsConversion) {
          const hasConversionQty = data.conversion_qty && data.conversion_qty.toString().trim() !== ''
          const hasConversionUnit = data.conversion_unit && data.conversion_unit !== 'undefined' && data.conversion_unit.trim() !== ''
          
          if (!hasConversionQty || !hasConversionUnit) {
            errors.push(`${item.product_name}: requiere conversión (se pidió en ${item.unit} pero el producto es en ${item.product_default_unit})`)
            return
          }
        }
        
        toSave.push({
          product_id: item.product_id,
          product_name: item.product_name,
          unit: item.unit,
          qty: item.total_qty,
          price_total: parseFloat(data.price_total),
          price_per_unit: parseFloat(data.price_per_unit || data.price_total / item.total_qty),
          conversion_qty: data.conversion_qty ? parseFloat(data.conversion_qty) : null,
          conversion_unit: data.conversion_qty ? data.conversion_unit : null
        })
      }
    })
    
    if (errors.length > 0) {
      // Debug detallado
      console.log('=== DEBUG CONVERSIONES ===')
      consolidatedList.forEach(item => {
        const key = `${item.product_id}_${item.unit}`
        const data = purchaseData[key]
        const needsConversion = item.unit !== item.product_default_unit
        
        console.log(`\nProducto: ${item.product_name}`)
        console.log(`  - Key: ${key}`)
        console.log(`  - Unidad pedido: ${item.unit}`)
        console.log(`  - Unidad producto: ${item.product_default_unit}`)
        console.log(`  - Necesita conversión: ${needsConversion}`)
        if (data) {
          console.log(`  - Data.conversion_qty: "${data.conversion_qty}" (tipo: ${typeof data.conversion_qty})`)
          console.log(`  - Data.conversion_unit: "${data.conversion_unit}" (tipo: ${typeof data.conversion_unit})`)
          console.log(`  - Data completa:`, data)
        } else {
          console.log('  - No hay data')
        }
      })
      
      alert('⚠️ Faltan conversiones obligatorias:\n\n' + errors.join('\n'))
      return
    }
    
    if (toSave.length === 0) {
      alert('⚠️ No hay compras para guardar')
      return
    }
    
    // Protección contra doble submit
    if (saving) {
      console.log('⚠️ Ya se está guardando, ignorando click duplicado')
      return
    }
    
    setSaving(true)
    try {
      // Guardar todas las compras EN PARALELO (mucho más rápido)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      await Promise.all(
        toSave.map(purchase => 
          fetch(`${API_URL}/api/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchase)
          })
        )
      )
      
      alert(`✅ ${toSave.length} compras registradas`)
      setShowModal(false)
      setPurchaseData({})
      
      // Marcar como comprados
      setConsolidatedList(prev => prev.map(item => {
        const key = `${item.product_id}_${item.unit}`
        return purchaseData[key]?.price_total ? { ...item, purchased: true } : item
      }))
      
      // Recargar datos
      await loadAllData()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <Loader />
    </div>
  )

  return (
    <>
      <style>{`
        details summary::-webkit-details-marker { display: none; }
        details summary::marker { display: none; }
      `}</style>
      
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>🛒 Lista de Compras</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="button ghost" onClick={downloadList} disabled={consolidatedList.length === 0}>
              📥 Descargar
            </button>
            <button 
              className="button" 
              onClick={() => setShowModal(true)} 
              disabled={consolidatedList.length === 0}
            >
              📝 Anotar Compras
            </button>
          </div>
        </div>

        {consolidatedList.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
            No hay pedidos emitidos
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e1e7e1' }}>
            {/* Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 120px 80px',
              gap: '16px',
              padding: '16px 20px',
              background: '#f8f9fa',
              borderBottom: '2px solid #e1e7e1',
              fontWeight: 700,
              fontSize: '13px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div>Producto</div>
              <div style={{ textAlign: 'right' }}>Cantidad</div>
              <div style={{ textAlign: 'center' }}>Estado</div>
            </div>

            {/* Items */}
            {consolidatedList.map((item, idx) => {
              const key = `${item.product_id}_${item.unit}`
              const isExpanded = expandedProducts.has(key)
              
              return (
                <div key={idx}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 120px 80px',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center',
                    opacity: item.purchased ? 0.5 : 1,
                    transition: 'background 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpanded(key)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--kivi-text-dark)' }}>
                      {item.product_name}
                    </div>
                    
                    <div style={{ 
                      textAlign: 'right', 
                      fontSize: '20px', 
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: 'var(--kivi-green)'
                    }}>
                      {item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} {item.unit}
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      {item.purchased ? (
                        <span style={{
                          background: '#4caf50',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', opacity: 0.4 }}>—</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Desglose de clientes */}
                  {isExpanded && (
                    <div style={{ 
                      padding: '12px 20px 12px 40px',
                      background: '#f8f9fa',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', opacity: 0.6 }}>
                        Pedidos de clientes:
                      </div>
                      {item.customers.map((c, cidx) => (
                        <div key={cidx} style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          fontSize: '14px',
                          borderBottom: cidx < item.customers.length - 1 ? '1px solid #e8e8e8' : 'none'
                        }}>
                          <span style={{ fontWeight: 600 }}>{c.customer_name}</span>
                          <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>
                            {c.qty} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Modal minimalista para todas las compras */}
      {showModal && (
        <>
          <div 
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '85vh',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                📝 Anotar Compras
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.5,
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Lista de productos */}
            <div style={{ 
              maxHeight: 'calc(85vh - 140px)',
              overflowY: 'auto',
              padding: '16px 24px'
            }}>
              {consolidatedList.map((item, idx) => {
                const key = `${item.product_id}_${item.unit}`
                const data = purchaseData[key] || {}
                const needsConversion = item.unit !== item.product_default_unit
                
                return (
                  <div key={idx} style={{
                    marginBottom: '12px',
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    border: needsConversion && (!data.conversion_qty) ? '2px solid #ff9800' : '1px solid #e8e8e8'
                  }}>
                    {/* Producto y cantidad en una sola línea */}
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 700 }}>
                        {item.product_name}
                      </span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--kivi-green)'
                      }}>
                        {item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} {item.unit}
                      </span>
                    </div>
                    
                    {/* Alerta de conversión obligatoria */}
                    {needsConversion && (
                      <div style={{
                        fontSize: '12px',
                        color: '#ff6b00',
                        background: '#fff3e0',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontWeight: 600
                      }}>
                        ⚠️ Conversión obligatoria (producto base: {item.product_default_unit})
                      </div>
                    )}
                    
                    {/* Campos inline */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          Total $
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={data.price_total || ''}
                          onChange={e => handlePriceChange(key, 'price_total', e.target.value)}
                          placeholder="15000"
                          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          Por {item.unit} $
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={data.price_per_unit || ''}
                          onChange={e => handlePriceChange(key, 'price_per_unit', e.target.value)}
                          placeholder="1500"
                          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                      </div>
                      
                      {needsConversion && (
                        <>
                          <div style={{ flex: 0.7, minWidth: '100px' }}>
                            <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                              Conversión
                            </label>
                            <input
                              type="number"
                              className="input"
                              value={data.conversion_qty || ''}
                              onChange={e => handlePriceChange(key, 'conversion_qty', e.target.value)}
                              placeholder="5"
                              step="0.1"
                              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                          </div>
                          <select
                            className="input"
                            value={data.conversion_unit || item.product_default_unit}
                            onChange={e => handlePriceChange(key, 'conversion_unit', e.target.value)}
                            style={{ width: '80px', padding: '8px', fontSize: '14px', marginBottom: '0' }}
                          >
                            <option value="unit">unid</option>
                            <option value="kg">kg</option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e8e8e8',
              background: '#f9f9f9',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowModal(false)}
                className="button ghost"
                style={{ minWidth: '100px', padding: '10px 16px' }}
              >
                Cancelar
              </button>
              <button
                onClick={saveAllPurchases}
                className="button"
                style={{ minWidth: '100px', padding: '10px 16px' }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
