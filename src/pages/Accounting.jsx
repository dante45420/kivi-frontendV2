/**
 * Página: Contabilidad
 * Gestión de pagos agrupada por cliente con conversiones y sin decimales
 */
import { useState, useEffect } from 'react'
import { fetchOrders, fetchOrder, updateOrderItem, addOrderItem } from '../api/orders'
import { fetchProducts } from '../api/products'
import { fetchCustomers, fetchCustomerDebt } from '../api/customers'
import { createPayment, fetchPayments, updatePayment, deletePayment } from '../api/payments'
import { generateInvoicePDF } from '../utils/invoicePdf'
import { calculateShipping } from '../utils/shipping'
import { fetchWeeklyOffers } from '../api/weeklyOffers'
import { getEffectivePrice } from '../utils/productPrice'
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
  
  // Modal Add Item
  const [addingItemTo, setAddingItemTo] = useState(null)
  const [newItem, setNewItem] = useState({ 
    product_id: '', 
    qty: 1, 
    unit: 'kg', 
    customer_id: '',
    use_purchase_price: true // Usar precio de compra para remates
  })
  const [allProducts, setAllProducts] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [weeklyOffers, setWeeklyOffers] = useState([])

  useEffect(() => {
    loadAccountingData()
  }, [])

  async function loadAccountingData() {
    setLoading(true)
    try {
      // Cargar productos (para mostrar en modales de edición)
      const allProductsData = await fetchProducts()
      const productsMap = {}
      allProductsData.forEach(p => { productsMap[p.id] = p })
      setProducts(productsMap)
      setAllProducts(allProductsData)
      
      // Cargar clientes
      const allCustomersData = await fetchCustomers()
      const customersMap = {}
      allCustomersData.forEach(c => { customersMap[c.id] = c })
      setAllCustomers(allCustomersData)
      
      // Cargar ofertas semanales (para mostrar en modales de edición)
      const offersData = await fetchWeeklyOffers(true, true)
      setWeeklyOffers(offersData)
      
      // Para cada cliente, cargar deuda y pagos usando el nuevo endpoint simplificado
      const accountingArray = await Promise.all(
        allCustomersData.map(async (customer) => {
          try {
            // Obtener deuda calculada por el backend (incluye conversiones, ofertas, envío)
            const debtData = await fetchCustomerDebt(customer.id)
            
            // Obtener pagos del cliente
            const payments = await fetchPayments(customer.id)
            
            return {
              customer: customer,
              orders: debtData.orders || [],
              total_billed: debtData.total_debt || 0,
              total_paid: debtData.total_paid || 0,
              total_debt: debtData.pending_debt || 0,
              payments: payments || []
            }
          } catch (err) {
            console.error(`Error cargando datos del cliente ${customer.id}:`, err)
            return {
              customer: customer,
              orders: [],
              total_billed: 0,
              total_paid: 0,
              total_debt: 0,
              payments: []
            }
          }
        })
      )
      
      // Filtrar clientes que tienen pedidos o pagos, y ordenar por deuda
      const filtered = accountingArray.filter(data => data.total_billed > 0 || data.payments.length > 0)
      filtered.sort((a, b) => b.total_debt - a.total_debt)
      
      setAccountingData(filtered)
    } catch (err) {
      console.error('Error cargando contabilidad:', err)
      alert('Error cargando datos: ' + (err.message || 'Error desconocido'))
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
    // En el nuevo sistema, mostramos todos los items de todos los pedidos
    const unpaidItems = []
    let subtotal = 0
    let shippingTotal = 0
    
    customerData.orders.forEach(order => {
      order.items.forEach(item => {
        unpaidItems.push({
          ...item,
          order_id: order.order_id,
          order_date: order.order_date
        })
        subtotal += item.total || 0
      })
      
      // Agregar envío del pedido
      if (order.shipping_amount) {
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
  
  async function handleAddItem() {
    if (!newItem.product_id || !newItem.customer_id) {
      alert('Selecciona un producto y cliente')
      return
    }
    
    try {
      const product = allProducts.find(p => p.id === parseInt(newItem.product_id))
      if (!product) {
        alert('Producto no encontrado')
        return
      }
      
      // Para remates: usar precio de compra si está disponible, sino precio de venta
      const unitPrice = newItem.use_purchase_price && product.purchase_price 
        ? product.purchase_price 
        : (product.sale_price || 0)
      
      // Si hay conversión, calcular charged_qty y charged_unit
      let notes = 'Item agregado para remate'
      if (product.avg_units_per_kg && product.avg_units_per_kg > 0) {
        if (newItem.unit === 'unit' && product.unit === 'kg') {
          notes += ` (conversión: ${newItem.qty} unidades = ${(newItem.qty / product.avg_units_per_kg).toFixed(2)} kg)`
        } else if (newItem.unit === 'kg' && product.unit === 'unit') {
          notes += ` (conversión: ${newItem.qty} kg = ${(newItem.qty * product.avg_units_per_kg).toFixed(1)} unidades)`
        }
      }
      
      await addOrderItem(addingItemTo, {
        customer_id: parseInt(newItem.customer_id),
        product_id: parseInt(newItem.product_id),
        qty: parseFloat(newItem.qty),
        unit: newItem.unit,
        unit_price: unitPrice,
        notes: notes
      })
      
      alert('✅ Item agregado al pedido')
      setAddingItemTo(null)
      setNewItem({ product_id: '', qty: 1, unit: 'kg', customer_id: '', use_purchase_price: true })
      loadAccountingData()
    } catch (err) {
      alert('Error al agregar item: ' + (err.message || 'Error desconocido'))
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
  
  // Obtener precio base para edición (precio normal o precio con oferta vigente)
  function getBasePriceForEdit(item) {
    if (!item.product) return 0
    
    // Obtener ofertas vigentes para la fecha del pedido
    const orderDate = item.order_date ? new Date(item.order_date) : new Date()
    const activeOffers = weeklyOffers.filter(offer => {
      if (!offer.active) return false
      const startDate = new Date(offer.start_date)
      const endDate = new Date(offer.end_date)
      return orderDate >= startDate && orderDate <= endDate
    })
    
    return getEffectivePrice(item.product, activeOffers)
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
                        // En el nuevo sistema, no calculamos deuda por pedido, solo a nivel de cliente
                        
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
                                  {order.order_date ? new Date(order.order_date).toLocaleDateString('es-CL') : 'Sin fecha'}
                                </span>
                                {order.order_status && (
                                  <span style={{ 
                                    fontSize: '11px', 
                                    color: order.order_status === 'completed' ? '#4caf50' : '#ff9800',
                                    marginLeft: '8px',
                                    padding: '2px 6px',
                                    background: order.order_status === 'completed' ? '#e8f5e9' : '#fff3e0',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                  }}>
                                    {order.order_status === 'completed' ? '✓ Completado' : '📤 Emitido'}
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {order.shipping_amount !== 0 && (
                                  <div style={{ fontSize: '11px', color: '#666' }}>
                                    {order.shipping_type === 'fast' ? 'Envío rápido (+10%)' : 
                                     order.shipping_type === 'cheap' ? 'Envío económico (-10%)' : 
                                     'Envío normal'}: {order.shipping_amount > 0 ? '+' : ''}${order.shipping_amount.toLocaleString('es-CL')}
                                  </div>
                                )}
                                <div style={{
                                  fontSize: '18px',
                                  fontWeight: 800,
                                  color: 'var(--kivi-green)',
                                  fontFamily: 'monospace'
                                }}>
                                  ${order.total.toLocaleString('es-CL')}
                                </div>
                              </div>
                            </div>
                            
                            {/* Items del pedido */}
                            {isOrderExpanded && (
                              <div style={{ padding: '12px 16px', background: '#fff' }}>
                                {/* Resumen del pedido */}
                                <div style={{ 
                                  marginBottom: '16px', 
                                  padding: '12px', 
                                  background: '#f8f9fa', 
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>
                                    Resumen del Pedido
                                  </div>
                                  <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#666' }}>Subtotal items:</span>
                                      <span style={{ fontFamily: 'monospace' }}>${order.subtotal.toLocaleString('es-CL')}</span>
                                    </div>
                                    {order.shipping_amount !== 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#666' }}>
                                          {order.shipping_type === 'fast' ? 'Envío rápido (+10%)' : 
                                           order.shipping_type === 'cheap' ? 'Envío económico (-10%)' : 
                                           'Envío normal'}:
                                        </span>
                                        <span style={{ 
                                          fontFamily: 'monospace',
                                          color: order.shipping_amount > 0 ? '#4caf50' : '#ff9800'
                                        }}>
                                          {order.shipping_amount > 0 ? '+' : ''}${order.shipping_amount.toLocaleString('es-CL')}
                                        </span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #ddd' }}>
                                      <span style={{ fontWeight: 600 }}>Total facturado:</span>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>${order.total.toLocaleString('es-CL')}</span>
                                    </div>
                                    {order.shipping_amount !== 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ color: '#666', fontSize: '12px' }}>
                                          {order.shipping_type === 'fast' ? 'Envío rápido (+10%)' : 
                                           order.shipping_type === 'cheap' ? 'Envío económico (-10%)' : 
                                           'Envío normal'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Botón para agregar item */}
                                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                                  <button
                                    className="button button-sm"
                                    onClick={() => {
                                      setAddingItemTo(order.order_id)
                                      setNewItem({
                                        product_id: '',
                                        qty: 1,
                                        unit: 'kg',
                                        customer_id: data.customer.id,
                                        use_purchase_price: true
                                      })
                                    }}
                                    style={{ width: '100%' }}
                                  >
                                    ➕ Agregar Item (Remate)
                                  </button>
                                </div>
                                
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
                                        {/* En el nuevo sistema, no mostramos estado de pago por item */}
                                        {item.needs_conversion && !item.has_conversion && (
                                          <span style={{ color: '#ff6b00', marginLeft: '6px' }}>*</span>
                                        )}
                                      </div>
                                      
                                      {/* Mostrar conversión si aplica (solo cuando el pedido está completed) */}
                                      {order.order_status === 'completed' && item.charged_qty && item.charged_qty !== item.qty && (
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                          {item.qty} {item.unit} → {item.charged_qty} {item.charged_unit || item.unit} (conversión aplicada)
                                        </div>
                                      )}
                                      
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        {/* Mostrar cantidad según estado: si está completed y hay charged_qty, usar esa, sino usar qty */}
                                        {order.order_status === 'completed' && item.charged_qty ? item.charged_qty : item.qty} 
                                        {' '}
                                        {order.order_status === 'completed' && item.charged_qty && item.charged_unit ? item.charged_unit : item.unit} 
                                        {' × $'}
                                        {Math.round((item.unit_price || 0)).toLocaleString('es-CL')}
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <button 
                                        className="button button-sm" 
                                        onClick={() => {
                                          setEditingItem(item)
                                          setEditForm({
                                            qty: item.charged_qty || item.qty,
                                            unit_price: item.unit_price || 0
                                          })
                                        }}
                                        style={{ padding:'4px 8px', fontSize:12 }}
                                      >
                                        ✏️ Editar
                                      </button>
                                      <div style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        color: 'var(--kivi-text-dark)',
                                        minWidth: '100px',
                                        textAlign: 'right'
                                      }}>
                                        ${(item.total || 0).toLocaleString('es-CL')}
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
                      
                      {/* Sección de Pagos */}
                      {data.payments && data.payments.length > 0 && (
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e8e8e8' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>
                            💵 Pagos Registrados ({data.payments.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {data.payments.map((payment) => (
                              <div key={payment.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                    ${payment.amount.toLocaleString('es-CL')}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    {payment.method && `Método: ${payment.method}`}
                                    {payment.reference && ` • Ref: ${payment.reference}`}
                                    {payment.date && ` • ${new Date(payment.date).toLocaleDateString('es-CL')}`}
                                  </div>
                                  {payment.notes && (
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                                      {payment.notes}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    className="button button-sm"
                                    onClick={async () => {
                                      if (confirm(`¿Editar pago de $${payment.amount.toLocaleString('es-CL')}?`)) {
                                        const newAmount = prompt('Nuevo monto:', payment.amount)
                                        if (newAmount && !isNaN(newAmount)) {
                                          try {
                                            await updatePayment(payment.id, { amount: parseFloat(newAmount) })
                                            alert('✅ Pago actualizado')
                                            loadAccountingData()
                                          } catch (err) {
                                            alert('Error: ' + err.message)
                                          }
                                        }
                                      }
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="button button-sm"
                                    onClick={async () => {
                                      if (confirm(`¿Eliminar pago de $${payment.amount.toLocaleString('es-CL')}?`)) {
                                        try {
                                          await deletePayment(payment.id)
                                          alert('✅ Pago eliminado')
                                          loadAccountingData()
                                        } catch (err) {
                                          alert('Error: ' + err.message)
                                        }
                                      }
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '12px', background: '#f44336', color: '#fff' }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
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
                  ${(invoiceData.subtotal || invoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0)).toLocaleString('es-CL')}
                </div>
                
                {invoiceData.shipping_amount !== undefined && invoiceData.shipping_amount !== null && (
                  <>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                      {invoiceData.shipping_amount > 0 
                        ? 'Envío rápido:' 
                        : invoiceData.shipping_amount < 0 
                        ? 'Envío económico:' 
                        : 'Envío normal:'}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: invoiceData.shipping_amount > 0 
                        ? 'var(--kivi-green)' 
                        : invoiceData.shipping_amount < 0 
                        ? 'var(--kivi-orange)' 
                        : '#666',
                      fontFamily: 'monospace',
                      marginBottom: '8px'
                    }}>
                      {invoiceData.shipping_amount !== 0 
                        ? `${invoiceData.shipping_amount > 0 ? '+' : ''}$${Math.abs(invoiceData.shipping_amount).toLocaleString('es-CL')}`
                        : 'Sin costo'}
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
                    {item.qty} {item.unit} × ${Math.round((item.total || 0) / (item.qty || 1)).toLocaleString('es-CL')}
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
                    ${(item.total || 0).toLocaleString('es-CL')}
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
            
            {(() => {
              const basePrice = getBasePriceForEdit(editingItem)
              const hasOffer = weeklyOffers.some(offer => 
                offer.product_id === editingItem.product_id && 
                offer.active &&
                new Date(offer.start_date) <= new Date() &&
                new Date(offer.end_date) >= new Date()
              )
              
              return (
                <div style={{ 
                  padding: '12px', 
                  background: '#f0f7ff', 
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Precio base de referencia:</div>
                  <div style={{ color: '#666' }}>
                    {hasOffer ? (
                      <>
                        Precio con oferta: <strong>${basePrice.toLocaleString('es-CL')}</strong>
                        {' '}(Precio normal: ${editingItem.product?.sale_price?.toLocaleString('es-CL') || 0})
                      </>
                    ) : (
                      <>
                        Precio normal: <strong>${basePrice.toLocaleString('es-CL')}</strong>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    Puedes editar el precio para compensaciones, pero debe estar basado en el precio base.
                  </div>
                </div>
              )
            })()}
            
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
      
      {/* Modal: Agregar Item */}
      {addingItemTo && (
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
              setAddingItemTo(null)
              setNewItem({ product_id: '', qty: 1, unit: 'kg', customer_id: '', use_purchase_price: true })
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
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 700 }}>
              ➕ Agregar Item al Pedido #{addingItemTo}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cliente
                </label>
                <select
                  className="input"
                  value={newItem.customer_id}
                  onChange={(e) => setNewItem({ ...newItem, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {allCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Producto
                </label>
                <select
                  className="input"
                  value={newItem.product_id}
                  onChange={(e) => {
                    const product = allProducts.find(p => p.id === parseInt(e.target.value))
                    setNewItem({ 
                      ...newItem, 
                      product_id: e.target.value,
                      unit: product?.unit || 'kg'
                    })
                  }}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                >
                  <option value="">Seleccionar producto...</option>
                  {allProducts.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.purchase_price || p.sale_price || 0}/{p.unit}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseFloat(e.target.value) || 1 })}
                    min="0.01"
                    step="0.01"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Unidad
                  </label>
                  <select
                    className="input"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  >
                    <option value="kg">kg</option>
                    <option value="unit">unidad</option>
                  </select>
                </div>
              </div>
              
              {newItem.product_id && (() => {
                const product = allProducts.find(p => p.id === parseInt(newItem.product_id))
                if (!product) return null
                
                const unitPrice = newItem.use_purchase_price && product.purchase_price 
                  ? product.purchase_price 
                  : (product.sale_price || 0)
                
                return (
                  <div style={{ 
                    padding: '12px', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Precio unitario:</span>
                      <span style={{ fontWeight: 600 }}>
                        ${unitPrice.toLocaleString('es-CL')} / {newItem.unit}
                      </span>
                    </div>
                    {product.avg_units_per_kg && product.avg_units_per_kg > 0 && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Conversión: {newItem.unit === 'unit' && product.unit === 'kg' 
                          ? `${newItem.qty} unidades = ${(newItem.qty / product.avg_units_per_kg).toFixed(2)} kg`
                          : newItem.unit === 'kg' && product.unit === 'unit'
                          ? `${newItem.qty} kg = ${(newItem.qty * product.avg_units_per_kg).toFixed(1)} unidades`
                          : 'Sin conversión necesaria'
                        }
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 700, color: 'var(--kivi-green)' }}>
                      <span>Total:</span>
                      <span>${Math.round(newItem.qty * unitPrice).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAddingItemTo(null)
                  setNewItem({ product_id: '', qty: 1, unit: 'kg', customer_id: '', use_purchase_price: true })
                }}
                className="button ghost"
                style={{ minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="button"
                style={{ minWidth: '120px' }}
                disabled={!newItem.product_id || !newItem.customer_id}
              >
                ➕ Agregar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
