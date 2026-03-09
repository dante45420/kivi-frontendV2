/**
 * Página: Compras / Lista Consolidada Global
 * Modal ultra minimalista con conversión obligatoria cuando cambia la unidad
 */
import { useState, useEffect } from 'react'
import { fetchOrders } from '../api/orders'
import { fetchProducts } from '../api/products'
import { createPurchase } from '../api/purchases'
import Loader from '../components/Loader'
import { generatePurchasesListPDF } from '../utils/purchasesPdf'
import { generatePurchaseDetailPDF } from '../utils/purchaseDetailPdf'

export default function Shopping() {
  const [consolidatedList, setConsolidatedList] = useState([])
  const [products, setProducts] = useState({}) // { product_id: product }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // Protección contra doble submit
  const [showModal, setShowModal] = useState(false)
  const [purchaseData, setPurchaseData] = useState({}) // { product_id_unit: { price_total, conversion_qty, ... } }
  const [maturityData, setMaturityData] = useState({}) // { product_id_unit: 'para_hoy' | 'para_4_5_dias' | 'sin_especificar' }
  const [expandedProducts, setExpandedProducts] = useState(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [savedPdfs, setSavedPdfs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [ordersData, setOrdersData] = useState({}) // { order_id: items[] }

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
      const ordersDataArray = await Promise.all(
        emittedOrders.map(async (order) => {
          try {
            const response = await fetch(`${API_URL}/api/orders/${order.id}`)
            const data = await response.json()
            if (Array.isArray(data.items)) {
              // Guardar datos del pedido para usar en el PDF
              const orderItems = data.items.map(item => ({ ...item, order_id: order.id }))
              setOrdersData(prev => ({
                ...prev,
                [order.id]: data.items
              }))
              return orderItems
            }
            return []
          } catch (err) {
            console.error(`Error cargando orden ${order.id}:`, err)
            return []
          }
        })
      )
      // Aplanar el array de arrays
      const allItems = ordersDataArray.flat()
      
      // Consolidar por producto + unidad + maturity_note
      const byProduct = {}
      
      allItems.forEach(item => {
        const maturity_note = item.maturity_note || 'sin_especificar'
        const key = `${item.product_id}_${item.unit}_${maturity_note}`
        if (!byProduct[key]) {
          const product = productsMap[item.product_id]
          byProduct[key] = {
            product_id: item.product_id,
            product_name: item.product_name || item.product?.name || 'Producto',
            unit: item.unit,
            product_default_unit: product?.unit || 'kg',
            category_name: product?.category?.name || 'Sin categoría',
            category_id: product?.category_id || 0,
            maturity_note: maturity_note,
            total_qty: 0,
            customers: [],
            purchased: false
          }
        }
        
        byProduct[key].total_qty += item.qty || 0
        byProduct[key].customers.push({
          customer_name: item.customer_name || item.customer?.name || 'Cliente',
          qty: item.qty,
          order_id: item.order_id,
          maturity_note: maturity_note
        })
      })
      
      // Re-consolidar por producto + unidad (agrupando todas las maturity_notes)
      const byProductUnit = {}
      Object.values(byProduct).forEach(item => {
        const key = `${item.product_id}_${item.unit}`
        if (!byProductUnit[key]) {
          byProductUnit[key] = {
            product_id: item.product_id,
            product_name: item.product_name,
            unit: item.unit,
            product_default_unit: item.product_default_unit,
            category_name: item.category_name,
            category_id: item.category_id,
            total_qty: 0,
            customers: [],
            maturity_breakdown: {
              para_hoy: 0,
              para_4_5_dias: 0,
              sin_especificar: 0
            },
            purchased: false
          }
        }
        // Sumar la cantidad según la nota de maduración
        const maturityKey = item.maturity_note === 'para_hoy' ? 'para_hoy' : 
                           item.maturity_note === 'para_4_5_dias' ? 'para_4_5_dias' : 
                           'sin_especificar'
        byProductUnit[key].maturity_breakdown[maturityKey] += item.total_qty
        // Sumar al total
        byProductUnit[key].total_qty += item.total_qty
        // Agregar todos los clientes
        byProductUnit[key].customers.push(...item.customers)
      })
      
      // Convertir de vuelta a array
      const list = Object.values(byProductUnit)
      
      // Ordenar: primero por categoría, luego por nombre de producto, luego kg antes que unidades
      list.sort((a, b) => {
        // Primero por categoría
        const categoryCompare = (a.category_name || 'Sin categoría').localeCompare(b.category_name || 'Sin categoría')
        if (categoryCompare !== 0) return categoryCompare
        // Si la categoría es igual, por nombre de producto
        const nameCompare = (a.product_name || '').localeCompare(b.product_name || '')
        if (nameCompare !== 0) return nameCompare
        // Si el nombre es igual, kg antes que unidades
        if (a.unit === 'kg' && b.unit !== 'kg') return -1
        if (a.unit !== 'kg' && b.unit === 'kg') return 1
        return 0
      })
      
      setConsolidatedList(list)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function downloadList() {
    try {
      await generatePurchasesListPDF(consolidatedList)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor intenta nuevamente.')
    }
  }

  function downloadSimpleList() {
    if (consolidatedList.length === 0) return
    // Agrupar por categoría (sin maduración; ya diferenciado por kg vs unit)
    const byCategory = {}
    consolidatedList.forEach(item => {
      const cat = item.category_name || 'Sin categoría'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(item)
    })
    // Ordenar items dentro de cada categoría: nombre, luego kg antes que unit
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat].sort((a, b) => {
        const nameCmp = (a.product_name || '').localeCompare(b.product_name || '')
        if (nameCmp !== 0) return nameCmp
        return a.unit === 'kg' && b.unit !== 'kg' ? -1 : a.unit !== 'kg' && b.unit === 'kg' ? 1 : 0
      })
    })
    // Construir texto
    const lines = []
    const getCategoryOrder = (name) => {
      const n = (name || '').toUpperCase()
      if (n.startsWith('FRUT')) return 0
      if (n.startsWith('PROT')) return 1
      if (n.startsWith('VERD')) return 2
      return 99
    }
    const sortedCats = Object.keys(byCategory).sort((a, b) => {
      const diff = getCategoryOrder(a) - getCategoryOrder(b)
      if (diff !== 0) return diff
      return (a || '').localeCompare(b || '')
    })
    sortedCats.forEach(cat => {
      lines.push(`=== ${cat} ===`)
      byCategory[cat].forEach(item => {
        const qty = item.total_qty
        const unitLabel = item.unit === 'kg' ? 'kg' : 'unit'
        const qtyStr = item.unit === 'kg'
          ? (Number.isInteger(qty) ? qty.toFixed(1) : qty.toFixed(1))
          : Math.round(qty).toString()
        lines.push(`${item.product_name || 'Producto'}: ${qtyStr} ${unitLabel}`)
      })
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compra-lista-simple-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadDetailList() {
    try {
      // Asegurarse de que ordersData esté actualizado
      const currentOrdersData = { ...ordersData }
      const doc = await generatePurchaseDetailPDF(consolidatedList, products, currentOrdersData)
      const orderIds = new Set()
      consolidatedList.forEach(item => {
        item.customers?.forEach(customer => {
          customer.order_id && orderIds.add(customer.order_id)
        })
      })
      const sortedOrderIds = Array.from(orderIds).sort((a, b) => a - b)
      const orderRange = sortedOrderIds.length > 0 
        ? sortedOrderIds.length === 1 
          ? `Pedido #${sortedOrderIds[0]}`
          : `Pedidos #${sortedOrderIds[0]}-${sortedOrderIds[sortedOrderIds.length - 1]}`
        : 'Sin pedidos'
      
      const filename = `compra-detalle-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor intenta nuevamente.')
    }
  }

  async function loadSavedPdfs() {
    setLoadingHistory(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('kivi_token')
      const response = await fetch(`${API_URL}/api/purchase-pdfs`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error('Error cargando PDFs guardados')
      }
      
      const pdfs = await response.json()
      setSavedPdfs(pdfs)
    } catch (err) {
      console.error('Error cargando PDFs guardados:', err)
      alert('Error cargando compras pasadas: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoadingHistory(false)
    }
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

  // Función para obtener la maduración predominante
  function getPredominantMaturity(breakdown) {
    if (!breakdown) return 'sin_especificar'
    const { para_hoy = 0, para_4_5_dias = 0, sin_especificar = 0 } = breakdown
    if (para_hoy >= para_4_5_dias && para_hoy >= sin_especificar) return 'para_hoy'
    if (para_4_5_dias >= sin_especificar) return 'para_4_5_dias'
    return 'sin_especificar'
  }

  // Función para formatear número en formato contabilidad chilena
  function formatChileanNumber(value) {
    if (!value && value !== 0) return ''
    // Remover todos los puntos (separadores de miles)
    const numericValue = String(value).replace(/\./g, '')
    // Formatear con puntos como separadores de miles
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Función para parsear número desde formato chileno
  function parseChileanNumber(formattedValue) {
    if (!formattedValue) return ''
    // Remover puntos y convertir a número
    return formattedValue.replace(/\./g, '')
  }

  function handlePriceChange(key, field, value) {
    // Si es un campo de precio, parsear el valor formateado
    const numericValue = (field === 'price_total' || field === 'price_per_unit' || field === 'price_per_charged_unit')
      ? parseChileanNumber(value)
      : value
    setPurchaseData(prev => {
      const item = consolidatedList.find(i => `${i.product_id}_${i.unit}` === key)
      const updated = { ...prev }
      
      if (!updated[key]) updated[key] = {}
      updated[key][field] = numericValue
      
      const needsConversion = item.unit !== item.product_default_unit
      const hasConversion = updated[key].conversion_qty && updated[key].conversion_unit
      
      // Auto-calcular el otro campo de precio
      if (field === 'price_total' && item && numericValue) {
        const priceTotal = parseFloat(numericValue)
        if (needsConversion && hasConversion) {
          // Si hay conversión, calcular precio por unidad de cobro usando la conversión
          const conversionQty = parseFloat(updated[key].conversion_qty)
          updated[key].price_per_charged_unit = (priceTotal / conversionQty).toFixed(0)
          // Precio por unidad de compra (en la unidad que se compró)
          updated[key].price_per_unit = (priceTotal / item.total_qty).toFixed(0)
        } else {
          // Sin conversión, calcular normalmente
          updated[key].price_per_unit = (priceTotal / item.total_qty).toFixed(0)
        }
      } else if (field === 'price_per_unit' && item && numericValue && !needsConversion) {
        // Solo permitir editar precio por unidad si NO hay conversión
        updated[key].price_total = (parseFloat(numericValue) * item.total_qty).toFixed(0)
      } else if (field === 'price_per_charged_unit' && item && numericValue && needsConversion && hasConversion) {
        // Si se edita el precio por unidad de cobro, calcular el total usando la conversión
        const pricePerChargedUnit = parseFloat(numericValue)
        const conversionQty = parseFloat(updated[key].conversion_qty)
        updated[key].price_total = (pricePerChargedUnit * conversionQty).toFixed(0)
        // También actualizar precio por unidad de compra
        updated[key].price_per_unit = (parseFloat(updated[key].price_total) / item.total_qty).toFixed(0)
      }
      
      // Si se ingresa conversion_qty y no hay conversion_unit válido, usar el default del producto
      if (field === 'conversion_qty' && value && item) {
        if (!updated[key].conversion_unit || updated[key].conversion_unit === 'undefined') {
          updated[key].conversion_unit = item.product_default_unit
        }
        // Recalcular precios si ya hay price_total
        if (updated[key].price_total) {
          const priceTotal = parseFloat(updated[key].price_total)
          const conversionQty = parseFloat(value)
          updated[key].price_per_charged_unit = (priceTotal / conversionQty).toFixed(0)
        }
      }
      
      // Si se cambia conversion_unit, recalcular si hay datos
      if (field === 'conversion_unit' && updated[key].conversion_qty && updated[key].price_total) {
        const priceTotal = parseFloat(updated[key].price_total)
        const conversionQty = parseFloat(updated[key].conversion_qty)
        updated[key].price_per_charged_unit = (priceTotal / conversionQty).toFixed(0)
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
          price_per_charged_unit: data.price_per_charged_unit ? parseFloat(data.price_per_charged_unit) : null,
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
      // Primero guardar todas las compras en la base de datos
      console.log('💾 Guardando compras en la base de datos...')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('kivi_token')
      
      for (const purchase of toSave) {
        try {
          await fetch(`${API_URL}/api/purchases`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(purchase)
          })
        } catch (err) {
          console.error(`Error guardando compra para ${purchase.product_name}:`, err)
          // Continuar con las demás compras
        }
      }
      
      console.log('✅ Compras guardadas en la base de datos')
      
      // Asegurarse de que ordersData esté actualizado
      const currentOrdersData = { ...ordersData }
      // Generar PDF detallado
      const doc = await generatePurchaseDetailPDF(consolidatedList, products, currentOrdersData)
      
      // Obtener rango de pedidos
      const orderIds = new Set()
      consolidatedList.forEach(item => {
        item.customers?.forEach(customer => {
          customer.order_id && orderIds.add(customer.order_id)
        })
      })
      const sortedOrderIds = Array.from(orderIds).sort((a, b) => a - b)
      const orderRange = sortedOrderIds.length > 0 
        ? sortedOrderIds.length === 1 
          ? `Pedido #${sortedOrderIds[0]}`
          : `Pedidos #${sortedOrderIds[0]}-${sortedOrderIds[sortedOrderIds.length - 1]}`
        : 'Sin pedidos'
      
      // Convertir PDF a blob
      const pdfBlob = doc.output('blob')
      
      // Guardar PDF en el servidor
      const formData = new FormData()
      formData.append('file', pdfBlob, 'compra-detalle.pdf')
      formData.append('metadata', JSON.stringify({
        order_range: orderRange,
        date: new Date().toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }))
      
      const response = await fetch(`${API_URL}/api/purchase-pdfs`, {
            method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error guardando PDF')
      }
      
      const savedPdf = await response.json()
      console.log('✅ PDF guardado:', savedPdf)
      alert(`✅ Compra registrada y PDF guardado exitosamente`)
      setShowModal(false)
      setPurchaseData({})
      
      // Recargar lista de PDFs guardados
      await loadSavedPdfs()
      
      // Recargar datos para ver los cambios (pedidos completados, etc.)
      await loadAllData()
    } catch (err) {
      console.error('Error guardando compra:', err)
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
            <button 
              className="button ghost" 
              onClick={async () => {
                setShowHistory(!showHistory)
                if (!showHistory) {
                  await loadSavedPdfs()
                }
              }}
            >
              📜 Ver Compras Pasadas
            </button>
            <button className="button ghost" onClick={downloadList} disabled={consolidatedList.length === 0}>
              📥 Descargar
            </button>
            <button className="button ghost" onClick={downloadDetailList} disabled={consolidatedList.length === 0}>
              📥 Descargar Detalle Completo
            </button>
            <button className="button ghost" onClick={downloadSimpleList} disabled={consolidatedList.length === 0} title="Lista simple por categoría (kg y unit separados)">
              📄 Descargar Lista Simple
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
        
        {/* Sección de Compras Pasadas */}
        {showHistory && (
          <div style={{ 
            marginBottom: '32px', 
            background: '#fff', 
            borderRadius: '12px', 
            border: '2px solid #e1e7e1',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                📜 Compras Pasadas
            </h3>
            </div>
            
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader />
              </div>
            ) : savedPdfs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No hay compras registradas
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedPdfs.map((pdf, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                      <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                        {pdf.order_range || 'Sin rango de pedidos'}
                        </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {pdf.date || (pdf.created_at ? new Date(pdf.created_at).toLocaleDateString('es-CL', {
                            year: 'numeric', 
                            month: 'long', 
                          day: 'numeric'
                        }) : 'Sin fecha')}
                        </div>
                      </div>
                    <button
                      onClick={async () => {
                        try {
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
                          const token = localStorage.getItem('kivi_token')
                          // El file_path puede ser relativo o absoluto
                          const downloadUrl = pdf.file_path.startsWith('http') 
                            ? pdf.file_path 
                            : `${API_URL}${pdf.file_path.startsWith('/') ? '' : '/'}${pdf.file_path}`
                          
                          const response = await fetch(downloadUrl, {
                            headers: {
                              'Authorization': token ? `Bearer ${token}` : ''
                            }
                          })
                          
                          if (!response.ok) {
                            throw new Error('Error descargando PDF')
                          }
                          
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = pdf.filename || 'compra.pdf'
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } catch (error) {
                          console.error('Error descargando PDF:', error)
                          alert('Error al descargar PDF: ' + (error.message || 'Error desconocido'))
                        }
                      }}
                      className="button"
                      style={{ background: 'var(--kivi-green)', marginLeft: '16px' }}
                    >
                      📥 Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {consolidatedList.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
            No hay pedidos emitidos
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e1e7e1' }}>
            {/* Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 180px 80px',
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
              <div style={{ textAlign: 'right' }}>Cantidad / Maduración</div>
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
                    gridTemplateColumns: '2fr 180px 80px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--kivi-text-dark)' }}>
                      {item.product_name}
                      </span>
                      <select
                        value={maturityData[key] || getPredominantMaturity(item.maturity_breakdown)}
                        onChange={(e) => {
                          setMaturityData(prev => ({ ...prev, [key]: e.target.value }))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          background: '#fff',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        <option value="para_hoy">Para hoy</option>
                        <option value="para_4_5_dias">Para 4-5 días</option>
                        <option value="sin_especificar">Sin especificar</option>
                      </select>
                    </div>
                    
                    <div style={{ 
                      textAlign: 'right', 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px'
                    }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--kivi-green)'
                      }}>
                        {item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} {item.unit}
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '15px', fontWeight: 700 }}>
                        {item.product_name}
                        </span>
                        <select
                          value={maturityData[key] || getPredominantMaturity(item.maturity_breakdown)}
                          onChange={(e) => {
                            setMaturityData(prev => ({ ...prev, [key]: e.target.value }))
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            background: '#fff',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          <option value="para_hoy">Para hoy</option>
                          <option value="para_4_5_dias">Para 4-5 días</option>
                          <option value="sin_especificar">Sin especificar</option>
                        </select>
                      </div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: 'var(--kivi-green)'
                        }}>
                          {item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} {item.unit}
                        </span>
                      </div>
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
                          type="text"
                          className="input"
                          value={data.price_total ? formatChileanNumber(data.price_total) : ''}
                          onChange={e => {
                            const parsed = parseChileanNumber(e.target.value)
                            if (!isNaN(parsed) || parsed === '') {
                              handlePriceChange(key, 'price_total', parsed)
                            }
                          }}
                          placeholder="15.000"
                          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                      </div>
                      
                      {!needsConversion && (
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                            Por {item.unit} $
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={data.price_per_unit ? formatChileanNumber(data.price_per_unit) : ''}
                            onChange={e => {
                              const parsed = parseChileanNumber(e.target.value)
                              if (!isNaN(parsed) || parsed === '') {
                                handlePriceChange(key, 'price_per_unit', parsed)
                              }
                            }}
                            placeholder="1.500"
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                          />
                        </div>
                      )}
                      
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
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                              Precio por {item.product_default_unit} $ (opcional)
                            </label>
                            <input
                              type="text"
                              className="input"
                              value={data.price_per_charged_unit ? formatChileanNumber(data.price_per_charged_unit) : ''}
                              onChange={e => {
                                const parsed = parseChileanNumber(e.target.value)
                                if (!isNaN(parsed) || parsed === '') {
                                  handlePriceChange(key, 'price_per_charged_unit', parsed)
                                }
                              }}
                              placeholder="Ej: 4.000"
                              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                              ⚠️ Precio por {item.product_default_unit}, NO el total. Se calculará el total automáticamente.
                            </div>
                          </div>
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
