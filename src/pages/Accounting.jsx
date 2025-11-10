/**
 * Página: Contabilidad
 * Gestión de pagos agrupada por cliente con conversiones y sin decimales
 */
import { useState, useEffect } from 'react'
import { fetchOrders, fetchOrder, updateOrderItem } from '../api/orders'
import { fetchProducts } from '../api/products'
import { fetchCustomers } from '../api/customers'
import { createPayment } from '../api/payments'
import { generateInvoicePDF } from '../utils/invoicePdf'
import Loader from '../components/Loader'

export default function Accounting() {
  const [loading, setLoading] = useState(true)
  const [accountingData, setAccountingData] = useState([])
  const [products, setProducts] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState(new Set())
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  
  // Modal Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [invoiceData, setInvoiceData] = useState(null)
  
  // Modal Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transferencia')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  
  // Modal Edit Item
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ qty: 0, unit_price: 0 })

  useEffect(() => {
    loadAccountingData()
  }, [])

  async function loadAccountingData() {
    setLoading(true)
    try {
      // Cargar productos
      const allProducts = await fetchProducts()
      const productsMap = {}
      allProducts.forEach(p => { productsMap[p.id] = p })
      setProducts(productsMap)
      
      // Cargar clientes
      const allCustomers = await fetchCustomers()
      const customersMap = {}
      allCustomers.forEach(c => { customersMap[c.id] = c })
      
      // Cargar pedidos finalizados
      const allOrders = await fetchOrders()
      const finalizedOrders = allOrders.filter(o => o.status === 'finalized')
      
      // Cargar items de cada pedido
      const ordersWithItems = []
      for (const order of finalizedOrders) {
        try {
          const data = await fetchOrder(order.id)
          if (Array.isArray(data.items) && data.items.length > 0) {
            ordersWithItems.push({ ...order, items: data.items })
          }
        } catch (err) {
          console.error(`Error cargando orden ${order.id}:`, err)
        }
      }
      
      // Agrupar por cliente
      const byCustomer = {}
      
      ordersWithItems.forEach(order => {
        order.items.forEach(item => {
          const customerId = item.customer_id
          if (!customerId) return
          
          if (!byCustomer[customerId]) {
            byCustomer[customerId] = {
              customer: customersMap[customerId] || { id: customerId, name: 'Cliente desconocido' },
              orders: {}
            }
          }
          
          if (!byCustomer[customerId].orders[order.id]) {
            byCustomer[customerId].orders[order.id] = {
              order_id: order.id,
              date: order.created_at,
              items: [],
              subtotal: 0,
              total_billed: 0,
              total_paid: 0,
              needs_conversion: false,
              shipping_type: order.shipping_type || 'fastest'
            }
          }
          
          // Verificar si necesita conversión
          const product = productsMap[item.product_id]
          const needsConversion = product && item.unit !== product.unit
          const hasConversion = product && product.avg_units_per_kg !== null && product.avg_units_per_kg !== undefined
          
          // Calcular total del item (SIN decimales)
          // Usar unit_price del item (puede incluir precio de oferta) o sale_price del producto
          const effectivePrice = item.unit_price || product?.sale_price || 0
          let itemTotal = 0
          if (needsConversion && hasConversion) {
            // Convertir usando avg_units_per_kg
            if (item.unit === 'unit' && product.unit === 'kg') {
              const kgEquivalent = item.qty / product.avg_units_per_kg
              itemTotal = Math.round(kgEquivalent * effectivePrice)
            } else if (item.unit === 'kg' && product.unit === 'unit') {
              const unitsEquivalent = item.qty * product.avg_units_per_kg
              itemTotal = Math.round(unitsEquivalent * effectivePrice)
            }
          } else {
            itemTotal = Math.round(item.qty * effectivePrice)
          }
          
          // Total pagado del item
          const itemPaid = item.paid ? itemTotal : 0
          
          byCustomer[customerId].orders[order.id].items.push({
            ...item,
            product,
            needs_conversion: needsConversion,
            has_conversion: hasConversion,
            calculated_total: itemTotal,
            paid_amount: itemPaid
          })
          
          byCustomer[customerId].orders[order.id].subtotal += itemTotal
          byCustomer[customerId].orders[order.id].total_paid += itemPaid
          
          if (needsConversion && !hasConversion) {
            byCustomer[customerId].orders[order.id].needs_conversion = true
          }
        })
      })
      
      // Aplicar envío o descuento según shipping_type
      Object.values(byCustomer).forEach(customerData => {
        Object.values(customerData.orders).forEach(order => {
          const subtotal = order.subtotal || 0
          const shippingType = order.shipping_type || 'fastest'
          
          if (shippingType === 'fastest' || shippingType === 'fast') {
            // Envío rápido: +$2.500
            order.total_billed = subtotal + 2500
            order.shipping_amount = 2500
            order.shipping_label = 'Envío rápido'
          } else if (shippingType === 'cheapest' || shippingType === 'cheap') {
            // Envío económico: -5% descuento
            const discount = Math.round(subtotal * 0.05)
            order.total_billed = subtotal - discount
            order.shipping_amount = -discount
            order.shipping_label = 'Descuento 5%'
          } else {
            // Por defecto: sin envío ni descuento
            order.total_billed = subtotal
            order.shipping_amount = 0
            order.shipping_label = null
          }
        })
      })
      
      // Convertir a array
      const accountingArray = Object.values(byCustomer).map(data => ({
        customer: data.customer,
        orders: Object.values(data.orders).sort((a, b) => new Date(b.date) - new Date(a.date)),
        total_billed: Object.values(data.orders).reduce((sum, o) => sum + o.total_billed, 0),
        total_debt: Object.values(data.orders).reduce((sum, o) => sum + (o.total_billed - o.total_paid), 0)
      })).sort((a, b) => b.total_debt - a.total_debt)
      
      setAccountingData(accountingArray)
    } catch (err) {
      console.error('Error cargando contabilidad:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleCustomer(customerId) {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(customerId)) {
        newSet.delete(customerId)
      } else {
        newSet.add(customerId)
      }
      return newSet
    })
  }

  function toggleOrder(orderId) {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  async function openInvoiceModal(customer, customerData) {
    setSelectedCustomer(customer)
    setShowInvoiceModal(true)
    
    // Preparar datos para la nota de cobro
    const unpaidOrders = customerData.orders.filter(o => o.total_billed > o.total_paid)
    const unpaidItems = []
    let subtotal = 0
    let shippingTotal = 0
    
    unpaidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!item.paid) {
          unpaidItems.push({
            ...item,
            order_id: order.order_id,
            order_date: order.date
          })
          subtotal += item.calculated_total || 0
        }
      })
      
      // Agregar envío/descuento del pedido si tiene items sin pagar
      const hasUnpaidItems = order.items.some(item => !item.paid)
      if (hasUnpaidItems && order.shipping_amount) {
        shippingTotal += order.shipping_amount
      }
    })
    
    // Calcular el total correcto: subtotal + shipping
    const calculatedTotal = subtotal + shippingTotal
    
    setInvoiceData({
      customer,
      items: unpaidItems,
      subtotal: subtotal,
      shipping_amount: shippingTotal,
      shipping_type: unpaidOrders.length > 0 ? unpaidOrders[0].shipping_type : null,
      total: calculatedTotal
    })
  }

  function downloadInvoice() {
    if (!invoiceData) return
    
    try {
      generateInvoicePDF(invoiceData)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor intenta nuevamente.')
    }
  }

  function openPaymentModal(customer) {
    setSelectedCustomer(customer)
    setPaymentAmount('')
    setPaymentMethod('transferencia')
    setPaymentReference('')
    setPaymentNotes('')
    setShowPaymentModal(true)
  }

  async function savePayment() {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('⚠️ Ingresa un monto válido')
      return
    }
    
    if (!selectedCustomer || !selectedCustomer.id) {
      alert('⚠️ Error: Cliente no válido')
      return
    }
    
    try {
      const paymentData = {
        customer_id: selectedCustomer.id,
        amount: Math.round(parseFloat(paymentAmount)),
        method: paymentMethod,
        reference: paymentReference || '',
        notes: paymentNotes || '',
        date: new Date().toISOString()
      }
      
      console.log('Enviando pago:', paymentData)
      
      const result = await createPayment(paymentData)
      console.log('Pago registrado:', result)
      
      alert('✅ Pago registrado exitosamente')
      setShowPaymentModal(false)
      loadAccountingData()
    } catch (err) {
      console.error('Error completo:', err)
      alert('Error: ' + err.message)
    }
  }
  
  async function handleEditItem() {
    try {
      await updateOrderItem(editingItem.id, {
        qty: parseFloat(editForm.qty),
        unit_price: parseFloat(editForm.unit_price)
      })
      
      // Recargar datos
      await loadAccountingData()
      
      // Cerrar modal
      setEditingItem(null)
      setEditForm({ qty: 0, unit_price: 0 })
      
      alert('✅ Item actualizado')
    } catch (error) {
      console.error('Error actualizando item:', error)
      alert(`❌ Error al actualizar: ${error.message || 'Error desconocido'}`)
    }
  }

  if (loading) return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <Loader />
    </div>
  )

  const totalGlobalBilled = accountingData.reduce((sum, d) => sum + d.total_billed, 0)
  const totalGlobalDebt = accountingData.reduce((sum, d) => sum + d.total_debt, 0)

  return (
    <>
      <style>{`
        details summary::-webkit-details-marker { display: none; }
        details summary::marker { display: none; }
      `}</style>
      
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header con totales globales */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 800 }}>💰 Contabilidad</h2>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: '200px',
              padding: '20px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid #e1e7e1'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Total Facturado
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#333',
                fontFamily: 'monospace'
              }}>
                ${totalGlobalBilled.toLocaleString('es-CL')}
              </div>
            </div>
            
            <div style={{
              flex: 1,
              minWidth: '200px',
              padding: '20px',
              background: totalGlobalDebt === 0 ? '#e8f5e9' : '#ffebee',
              borderRadius: '12px',
              border: `2px solid ${totalGlobalDebt === 0 ? '#4caf50' : '#f44336'}`
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Deuda Pendiente
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: totalGlobalDebt === 0 ? '#4caf50' : '#f44336',
                fontFamily: 'monospace'
              }}>
                ${totalGlobalDebt.toLocaleString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        {accountingData.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
            No hay pedidos finalizados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {accountingData.map((data, idx) => {
              const isExpanded = expandedCustomers.has(data.customer.id)
              const debtColor = data.total_debt === 0 ? '#4caf50' : '#f44336'
              
              return (
                <div key={idx} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '2px solid #e1e7e1',
                  overflow: 'hidden'
                }}>
                  {/* Header del cliente */}
                  <div 
                    onClick={() => toggleCustomer(data.customer.id)}
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8f9fa' : '#fff',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#fafafa' }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                          {data.customer.name}
                        </h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {data.orders.length} pedido{data.orders.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#999' }}>Facturado</div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#333',
                            fontFamily: 'monospace'
                          }}>
                            ${data.total_billed.toLocaleString('es-CL')}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#999' }}>Deuda</div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            color: debtColor,
                            fontFamily: 'monospace'
                          }}>
                            ${data.total_debt.toLocaleString('es-CL')}
                            {data.orders.some(o => o.needs_conversion) && (
                              <span style={{ color: '#ff6b00', marginLeft: '8px' }}>*</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de pedidos del cliente */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px 20px' }}>
                      {data.orders.map((order, oidx) => {
                        const isOrderExpanded = expandedOrders.has(order.order_id)
                        const orderDebt = order.total_billed - order.total_paid
                        
                        return (
                          <div key={oidx} style={{
                            marginBottom: '12px',
                            border: '1px solid #e8e8e8',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            {/* Header del pedido */}
                            <div
                              onClick={() => toggleOrder(order.order_id)}
                              style={{
                                padding: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isOrderExpanded ? '#f0f0f0' : '#fafafa',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={e => { if (!isOrderExpanded) e.currentTarget.style.background = '#f5f5f5' }}
                              onMouseLeave={e => { if (!isOrderExpanded) e.currentTarget.style.background = '#fafafa' }}
                            >
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                  Pedido #{order.order_id}
                                </span>
                                <span style={{ fontSize: '12px', color: '#999', marginLeft: '12px' }}>
                                  {new Date(order.date).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                  Pagado: ${order.total_paid.toLocaleString('es-CL')}
                                </div>
                                <div style={{
                                  fontSize: '18px',
                                  fontWeight: 800,
                                  color: orderDebt === 0 ? '#4caf50' : 'var(--kivi-green)',
                                  fontFamily: 'monospace'
                                }}>
                                  ${order.total_billed.toLocaleString('es-CL')}
                                  {order.needs_conversion && (
                                    <span style={{ color: '#ff6b00', marginLeft: '6px' }}>*</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Items del pedido */}
                            {isOrderExpanded && (
                              <div style={{ padding: '12px 16px', background: '#fff' }}>
                                {order.items.map((item, iidx) => (
                                  <div key={iidx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 0',
                                    borderBottom: iidx < order.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    gap: '12px'
                                  }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                          {item.product_name || item.product?.name}
                                        </span>
                                        {item.paid && (
                                          <span style={{
                                            background: '#4caf50',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '10px',
                                            fontWeight: 700
                                          }}>
                                            PAGADO
                                          </span>
                                        )}
                                        {item.needs_conversion && !item.has_conversion && (
                                          <span style={{ color: '#ff6b00', marginLeft: '6px' }}>*</span>
                                        )}
                                      </div>
                                      
                                      {/* Mostrar conversión si aplica */}
                                      {item.needs_conversion && item.has_conversion && (
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                          {item.qty} {item.unit} ≈{' '}
                                          {item.unit === 'unit' && item.product?.unit === 'kg' ? (
                                            <>
                                              {(item.qty / item.product.avg_units_per_kg).toFixed(2)} kg
                                            </>
                                          ) : item.unit === 'kg' && item.product?.unit === 'unit' ? (
                                            <>
                                              {(item.qty * item.product.avg_units_per_kg).toFixed(1)} unid
                                            </>
                                          ) : (
                                            `${item.qty} ${item.unit}`
                                          )}
                                          {' '}× ${(item.product?.sale_price || 0).toLocaleString('es-CL')}
                                        </div>
                                      )}
                                      
                                      {item.needs_conversion && !item.has_conversion && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: '#ff6b00',
                                          marginTop: '4px',
                                          fontWeight: 600
                                        }}>
                                          ⚠️ Falta registrar conversión ({item.unit} → {item.product?.unit})
                                        </div>
                                      )}
                                      
                                      {!item.needs_conversion && (
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                          {item.qty} {item.unit} × ${Math.round((item.unit_price || item.product?.sale_price || 0)).toLocaleString('es-CL')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {!item.paid && (
                                        <button 
                                          className="button button-sm" 
                                          onClick={() => {
                                            setEditingItem(item)
                                            setEditForm({
                                              qty: item.charged_qty || item.qty,
                                              unit_price: item.unit_price || item.product?.sale_price || 0
                                            })
                                          }}
                                          style={{ padding:'4px 8px', fontSize:12 }}
                                        >
                                          ✏️ Editar
                                        </button>
                                      )}
                                    <div style={{
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      fontFamily: 'monospace',
                                      color: 'var(--kivi-text-dark)',
                                      minWidth: '100px',
                                      textAlign: 'right'
                                    }}>
                                      ${item.calculated_total.toLocaleString('es-CL')}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      
                      {/* Botones de acción */}
                      {data.total_debt > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '2px solid #e8e8e8'
                        }}>
                          <button 
                            className="button ghost" 
                            style={{ flex: 1 }}
                            onClick={() => openInvoiceModal(data.customer, data)}
                          >
                            📄 Nota de Cobro
                          </button>
                          <button 
                            className="button" 
                            style={{ flex: 1 }}
                            onClick={() => openPaymentModal(data.customer)}
                          >
                            💵 Registrar Pago
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Leyenda del asterisco */}
        {accountingData.some(d => d.orders.some(o => o.needs_conversion)) && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ff9800',
            fontSize: '13px',
            color: '#666'
          }}>
            <strong style={{ color: '#ff6b00' }}>*</strong> Indica que se requiere conversión de unidades.
            Los montos son aproximados hasta que se registre la conversión exacta en Compras.
          </div>
        )}
      </div>
      
      {/* Modal Nota de Cobro */}
      {showInvoiceModal && invoiceData && (
        <>
          <div 
            onClick={() => setShowInvoiceModal(false)}
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
            maxWidth: '700px',
            width: '95%',
            maxHeight: '85vh',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '2px solid #e8e8e8',
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                  📄 Nota de Cobro
                </h2>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {invoiceData.customer.name}
                </div>
              </div>
              <button 
                onClick={() => setShowInvoiceModal(false)}
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
            
            {/* Contenido */}
            <div style={{ 
              maxHeight: 'calc(85vh - 180px)',
              overflowY: 'auto',
              padding: '20px 24px'
            }}>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  Subtotal:
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#333',
                  fontFamily: 'monospace',
                  marginBottom: '8px'
                }}>
                  ${(invoiceData.subtotal || invoiceData.items.reduce((sum, item) => sum + (item.calculated_total || 0), 0)).toLocaleString('es-CL')}
                </div>
                
                {invoiceData.shipping_amount && invoiceData.shipping_amount !== 0 && (
                  <>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                      {invoiceData.shipping_amount > 0 ? 'Envío rápido:' : 'Descuento 5%:'}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: invoiceData.shipping_amount > 0 ? 'var(--kivi-green)' : 'var(--kivi-orange)',
                      fontFamily: 'monospace',
                      marginBottom: '8px'
                    }}>
                      {invoiceData.shipping_amount > 0 ? '+' : ''}${Math.abs(invoiceData.shipping_amount).toLocaleString('es-CL')}
                    </div>
                  </>
                )}
                
                <div style={{
                  borderTop: '2px solid #ddd',
                  paddingTop: '8px',
                  marginTop: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                  Total a Pagar
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--kivi-orange)',
                  fontFamily: 'monospace'
                }}>
                  ${invoiceData.total.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
                Detalle:
              </div>
              
              {invoiceData.items.map((item, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                    {item.product_name || item.product?.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {item.qty} {item.unit} × ${Math.round(item.calculated_total / item.qty).toLocaleString('es-CL')}
                    {item.needs_conversion && item.has_conversion && (
                      <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                        (aprox. {item.unit === 'unit' && item.product?.unit === 'kg'
                          ? `${(item.qty / item.product.avg_units_per_kg).toFixed(2)} kg`
                          : item.unit === 'kg' && item.product?.unit === 'unit'
                          ? `${(item.qty * item.product.avg_units_per_kg).toFixed(1)} unid`
                          : ''})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                    ${item.calculated_total.toLocaleString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '2px solid #e8e8e8',
              background: '#f9f9f9',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="button ghost"
                style={{ minWidth: '100px' }}
              >
                Cerrar
              </button>
              <button
                onClick={downloadInvoice}
                className="button"
                style={{ minWidth: '120px' }}
              >
                📥 Descargar
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Modal Registrar Pago */}
      {showPaymentModal && selectedCustomer && (
        <>
          <div 
            onClick={() => setShowPaymentModal(false)}
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
            padding: '24px',
            maxWidth: '500px',
            width: '95%',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700 }}>
              💵 Registrar Pago
            </h2>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Cliente: <strong>{selectedCustomer.name}</strong>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Monto Pagado *
                </label>
                <input
                  type="number"
                  className="input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="15000"
                  style={{ width: '100%', padding: '10px', fontSize: '15px' }}
                  autoFocus
                />
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Método de Pago
                </label>
                <select
                  className="input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  className="input"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="N° de transferencia, comprobante, etc."
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Notas (opcional)
                </label>
                <textarea
                  className="input"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={2}
                  style={{ width: '100%', padding: '10px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="button ghost"
                style={{ minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button
                onClick={savePayment}
                className="button"
                style={{ minWidth: '120px' }}
              >
                💾 Guardar Pago
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Modal: Editar Item */}
      {editingItem && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              setEditingItem(null)
              setEditForm({ qty: 0, unit_price: 0 })
            }}
          >
          </div>
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              zIndex: 1001,
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 700 }}>
              ✏️ Editar: {editingItem.product_name || editingItem.product?.name}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={editForm.qty}
                    onChange={(e) => setEditForm(v => ({ ...v, qty: parseFloat(e.target.value) || 0 }))}
                    min="0.01"
                    step="0.01"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Precio Unitario
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={editForm.unit_price}
                    onChange={(e) => setEditForm(v => ({ ...v, unit_price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="1"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              <div style={{ 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Total:</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kivi-green)' }}>
                  ${Math.round(editForm.qty * editForm.unit_price).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setEditForm({ qty: 0, unit_price: 0 })
                }}
                className="button ghost"
                style={{ minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditItem}
                className="button"
                style={{ minWidth: '120px' }}
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
