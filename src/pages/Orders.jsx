/**
 * Página: Pedidos
 * Parser completo con edición, resolución de productos, asignación de clientes y tipo de envío
 */
import { useState, useEffect, useMemo } from 'react'
import { parseOrderText, createOrder, fetchOrders, fetchOrder, emitOrder, addOrderItem, updateOrderItem, deleteOrderItem } from '../api/orders'
import { fetchCustomers, createCustomer } from '../api/customers'
import { fetchSellers, createSeller } from '../api/sellers'
import { fetchCategories } from '../api/categories'
import { fetchProducts } from '../api/products'
import ProductResolvePanel from '../components/ProductResolvePanel'
import Loader from '../components/Loader'

export default function Orders() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [sellers, setSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  
  // Vista: 'parser' o 'list'
  const [view, setView] = useState('parser')
  
  // Pedidos existentes
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [orderDetails, setOrderDetails] = useState({})
  
  // Agregar item a pedido
  const [addingItemTo, setAddingItemTo] = useState(null)
  const [newItem, setNewItem] = useState({ product_id: '', qty: 1, unit: 'kg', customer_name: '' })
  
  // Editar item
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ qty: 0, unit_price: 0, notes: '' })
  
  // Cliente assignment
  const [allName, setAllName] = useState('')
  const [clientsAssigned, setClientsAssigned] = useState(false)
  
  // Vendedor assignment
  const [selectedSellerId, setSelectedSellerId] = useState('')
  
  // Tipo de envío
  const [shippingType, setShippingType] = useState('fastest')
  
  // Modals
  const [resolveOpen, setResolveOpen] = useState(false)
  const [newCustOpen, setNewCustOpen] = useState(false)
  const [newCust, setNewCust] = useState({ name:'', phone:'', address:'' })
  const [newCustError, setNewCustError] = useState('')
  const [newSellerOpen, setNewSellerOpen] = useState(false)
  const [newSeller, setNewSeller] = useState({ name:'', phone:'', address:'' })
  const [newSellerError, setNewSellerError] = useState('')

  useEffect(() => { 
    fetchCustomers().then(setCustomers).catch(() => {})
    fetchSellers().then(setSellers).catch(() => {})
    fetchCategories().then(setCategories).catch(() => {})
    fetchProducts().then(setProducts).catch(() => {})
    loadOrders()
  }, [])
  
  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const allOrders = await fetchOrders()
      setOrders(allOrders.filter(o => o.status === 'draft' || o.status === 'emitted'))
    } catch (err) {
      console.error('Error cargando pedidos:', err)
    } finally {
      setLoadingOrders(false)
    }
  }
  
  async function handleEmitOrder(orderId) {
    if (!confirm('¿Emitir este pedido?')) return
    try {
      await emitOrder(orderId)
      await loadOrders()
      alert('✅ Pedido emitido')
    } catch (err) {
      alert('Error al emitir: ' + (err.message || 'Error desconocido'))
    }
  }
  
  async function toggleOrderExpand(orderId) {
    const isExpanded = expandedOrders[orderId]
    
    if (!isExpanded && !orderDetails[orderId]) {
      // Cargar detalles del pedido
      try {
        const details = await fetchOrder(orderId)
        setOrderDetails(prev => ({ ...prev, [orderId]: details }))
      } catch (err) {
        console.error('Error cargando detalles:', err)
        alert('Error al cargar detalles del pedido')
        return
      }
    }
    
    setExpandedOrders(prev => ({ ...prev, [orderId]: !isExpanded }))
  }
  
  async function handleAddItem() {
    if (!newItem.product_id || !newItem.customer_name) {
      alert('Selecciona un producto y cliente')
      return
    }
    
    try {
      // Buscar el cliente por nombre para obtener su ID
      const customer = customers.find(c => c.name === newItem.customer_name)
      if (!customer) {
        alert('Cliente no encontrado. Por favor selecciona un cliente válido.')
        return
      }
      
      const product = products.find(p => p.id === parseInt(newItem.product_id))
      if (!product) {
        alert('Producto no encontrado')
        return
      }
      
      // Enviar en el formato que espera el backend
      await addOrderItem(addingItemTo, {
        customer_id: customer.id,
        product_id: parseInt(newItem.product_id),
        qty: parseFloat(newItem.qty),
        unit: newItem.unit,
        unit_price: product?.sale_price || 0
      })
      
      // Recargar detalles del pedido
      const details = await fetchOrder(addingItemTo)
      setOrderDetails(prev => ({ ...prev, [addingItemTo]: details }))
      
      // Cerrar modal y resetear
      setAddingItemTo(null)
      setNewItem({ product_id: '', qty: 1, unit: 'kg', customer_name: '' })
      
      alert('✅ Item agregado')
    } catch (err) {
      alert('Error al agregar item: ' + (err.message || 'Error desconocido'))
    }
  }
  
  async function handleEditItem() {
    try {
      await updateOrderItem(editingItem.id, {
        qty: parseFloat(editForm.qty),
        unit_price: parseFloat(editForm.unit_price),
        notes: editForm.notes
      })
      
      // Recargar detalles del pedido
      const details = await fetchOrder(editingItem.order_id)
      setOrderDetails(prev => ({ ...prev, [editingItem.order_id]: details }))
      
      // Cerrar modal
      setEditingItem(null)
      setEditForm({ qty: 0, unit_price: 0, notes: '' })
      
      alert('✅ Item actualizado')
    } catch (err) {
      alert('Error al actualizar item: ' + (err.message || 'Error desconocido'))
    }
  }
  
  async function handleDeleteItem(item) {
    if (!confirm(`¿Eliminar ${item.product_name}?`)) return
    
    try {
      await deleteOrderItem(item.id)
      
      // Recargar detalles del pedido
      const details = await fetchOrder(item.order_id)
      setOrderDetails(prev => ({ ...prev, [item.order_id]: details }))
      
      alert('✅ Item eliminado')
    } catch (err) {
      alert('Error al eliminar item: ' + (err.message || 'Error desconocido'))
    }
  }

  async function parse() {
    setLoading(true)
    try {
      console.log('🔍 Parseando texto:', text)
      const parsed = await parseOrderText(text)
      console.log('✅ Resultado del parse:', parsed)
      setRows(parsed.items || [])
      setClientsAssigned(false)
      setAllName('')
    } catch (err) {
      console.error('❌ Error en parse:', err)
      alert('Error al parsear: ' + (err.message || 'Error desconocido'))
    } finally { 
      setLoading(false) 
    }
  }

  function applyAll() { 
    if(!allName.trim()) return
    setRows(rows.map(r => ({ ...r, customer: allName.trim() })))
    setClientsAssigned(true)
  }

  async function saveToDraft() {
    if (unresolved.length > 0) { 
      alert('⚠️ Resuelve los productos pendientes antes de guardar')
      return 
    }
    
    if (!allRowsHaveCustomer) {
      alert('⚠️ Asigna un cliente a todos los items')
      return
    }

    try {
      const items = rows.map(r => ({
        customer_name: r.customer,
        product_id: r.product_id || null,
        qty: r.qty,
        unit: r.unit,
        notes: r.notes || null,
        sale_unit_price: r.sale_price || null,
        create_if_missing: !!r.create_if_missing,
        product_name: r.product_name || r.product,
        default_unit: r.default_unit || r.unit
      }))
      
      await createOrder({ 
        items, 
        source: 'whatsapp',
        shipping_type: shippingType,
        seller_id: selectedSellerId ? parseInt(selectedSellerId) : null
      })
      
      setRows([])
      setText('')
      setClientsAssigned(false)
      setAllName('')
      setSelectedSellerId('')
      setShippingType('fastest')
      await loadOrders()
      alert('✅ Pedido guardado en borrador')
    } catch (err) {
      alert('Error al guardar: ' + (err.message || 'Error desconocido'))
    }
  }

  const unresolved = useMemo(() => rows.filter(r => r.match_status !== 'exact'), [rows])
  const allRowsHaveCustomer = useMemo(() => rows.length > 0 && rows.every(r => r.customer?.trim()), [rows])

  function statusBadge(r){
    const st = r.match_status
    const label = st === 'exact' ? '✓' : (st === 'similar' ? '~' : '!')
    const cls = st === 'exact' ? 'ok' : (st === 'similar' ? 'warn' : 'danger')
    return (
      <span className={`badge ${cls}`} style={{ fontSize:14, padding:'4px 8px' }}>
        {label}
      </span>
    )
  }

  function handleResolve(item, action){
    setRows(rs => rs.map(x => {
      if ((x.line_number ?? x.line_index ?? x.index) !== (item.line_number ?? item.line_index ?? item.index)) return x
      
      if (action.product_id){
        // Asociar a producto existente
        return { 
          ...x, 
          product_id: action.product_id, 
          product_name: action.product_name || x.product_name, 
          match_status: 'exact' 
        }
      }
      
      if (action.create_if_missing){
        // Crear producto nuevo
        return { 
          ...x, 
          product_name: action.product || x.product_name, 
          create_if_missing: true, 
          sale_price: action.sale_price,
          default_unit: action.default_unit || 'kg',
          match_status: 'exact' 
        }
      }
      
      return x
    }))
  }

  async function handleCreateCustomer() {
    if(!(newCust.name||'').trim() || !(newCust.phone||'').trim()){ 
      setNewCustError('Nombre y teléfono son obligatorios')
      return 
    }
    
    try{
      await createCustomer(newCust)
      const list = await fetchCustomers()
      setCustomers(list)
      setRows(rs=> rs.map(x=> ({ ...x, customer: newCust.name })))
      setAllName(newCust.name)
      setNewCustOpen(false)
    }catch{ 
      setNewCustError('No se pudo crear el cliente') 
    }
  }

  async function handleCreateSeller() {
    if(!(newSeller.name||'').trim()){ 
      setNewSellerError('El nombre es obligatorio')
      return 
    }
    
    try{
      const created = await createSeller(newSeller)
      const list = await fetchSellers()
      setSellers(list)
      setSelectedSellerId(created.id.toString())
      setNewSellerOpen(false)
      setNewSeller({ name:'', phone:'', address:'' })
      setNewSellerError('')
    }catch(err){ 
      setNewSellerError('No se pudo crear el vendedor: ' + (err.message || 'Error desconocido'))
    }
  }

  return (
    <div className="center" style={{ padding:'12px', maxWidth:'100%' }}>
      <h2 style={{ margin:'0 0 16px 0', textAlign:'center' }}>📦 Pedidos</h2>
      
      {/* Toggle entre vistas */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <button 
          className="button" 
          onClick={() => setView('parser')}
          style={{ 
            flex:1, 
            background: view === 'parser' ? 'var(--kivi-green)' : 'transparent',
            color: view === 'parser' ? '#fff' : 'var(--kivi-text)'
          }}
        >
          📝 Parsear Nuevo
        </button>
        <button 
          className="button" 
          onClick={() => setView('list')}
          style={{ 
            flex:1,
            background: view === 'list' ? 'var(--kivi-green)' : 'transparent',
            color: view === 'list' ? '#fff' : 'var(--kivi-text)'
          }}
        >
          📋 Ver Pedidos ({orders.length})
        </button>
      </div>
      
      {view === 'parser' ? (
        <>
          {/* SECCIÓN 1: Pegar pedidos */}
          <div className="card" style={{ padding:16, marginBottom:12 }}>
            <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>📝 Pegar Pedidos</h3>
            <textarea 
              rows={5} 
              className="input" 
              placeholder="Pega aquí los mensajes de pedidos..." 
              value={text} 
              onChange={e => setText(e.target.value)}
              style={{ width:'100%', resize:'vertical' }}
            />
            <button 
              className="button" 
              onClick={parse} 
              disabled={loading || !text.trim()}
              style={{ marginTop:8, width:'100%' }}
            >
              {loading ? 'Parseando...' : 'Parsear'}
            </button>
          </div>

          {/* SECCIÓN 2: Items parseados */}
          {rows.length > 0 && (
            <>
              {/* Asignar cliente */}
              <div className="card" style={{ padding:16, marginBottom:12 }}>
                <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>👤 Asignar Cliente</h3>
                <select 
                  className="input" 
                  value={allName} 
                  onChange={e=>setAllName(e.target.value)} 
                  style={{ width:'100%', marginBottom:8 }}
                >
                  <option value="">Seleccionar cliente…</option>
                  {customers.map(c=> (<option key={c.id} value={c.name}>{c.name}</option>))}
                </select>
                <div style={{ display:'flex', gap:8 }}>
                  <button 
                    className="button" 
                    onClick={applyAll} 
                    disabled={!rows.length || !allName.trim()}
                    style={{ flex:1 }}
                  >
                    Asignar
                  </button>
                  <button 
                    className="button ghost" 
                    onClick={()=>{ 
                      setNewCustOpen(true)
                      setNewCust({ name:'', phone:'', address:'' })
                      setNewCustError('') 
                    }}
                    style={{ flex:1 }}
                  >
                    + Nuevo
                  </button>
                </div>
                {clientsAssigned && allRowsHaveCustomer && (
                  <div style={{ marginTop:8, padding:8, background:'#d4edda', borderRadius:8, textAlign:'center', fontSize:14 }}>
                    ✓ Cliente asignado a todos los items
                  </div>
                )}
              </div>

              {/* Asignar vendedor */}
              <div className="card" style={{ padding:16, marginBottom:12 }}>
                <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>👔 Asignar Vendedor (Opcional)</h3>
                <select 
                  className="input" 
                  value={selectedSellerId} 
                  onChange={e=>setSelectedSellerId(e.target.value)} 
                  style={{ width:'100%', marginBottom:8 }}
                >
                  <option value="">Seleccionar vendedor…</option>
                  {sellers.map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <div style={{ display:'flex', gap:8 }}>
                  <button 
                    className="button ghost" 
                    onClick={()=>{ 
                      setNewSellerOpen(true)
                      setNewSeller({ name:'', phone:'', address:'' })
                      setNewSellerError('') 
                    }}
                    style={{ flex:1 }}
                  >
                    + Nuevo Vendedor
                  </button>
                </div>
                {selectedSellerId && (
                  <div style={{ marginTop:8, padding:8, background:'#e3f2fd', borderRadius:8, textAlign:'center', fontSize:14 }}>
                    ✓ Vendedor asignado al pedido
                  </div>
                )}
              </div>

              {/* Tipo de envío */}
              <div className="card" style={{ padding:16, marginBottom:12 }}>
                <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>🚚 Tipo de Envío</h3>
                <select 
                  className="input" 
                  value={shippingType} 
                  onChange={e => setShippingType(e.target.value)}
                  style={{ width:'100%' }}
                >
                  <option value="fast">⚡ Rápido (mismo día antes de las 12:00, +10%)</option>
                  <option value="normal">📦 Normal (día siguiente, +0%)</option>
                  <option value="cheap">💰 Económico (1-3 días, -10%)</option>
                </select>
                <p style={{ fontSize:12, color:'#666', marginTop:8, marginBottom:0 }}>
                  {shippingType === 'fast' || shippingType === 'fastest'
                    ? 'Envío el mismo día para algunos productos (solo antes de las 12:00). +10% al monto total.' 
                    : shippingType === 'cheap' || shippingType === 'cheapest'
                    ? 'Entrega en 1-3 días. -10% descuento al monto total.'
                    : 'Envío al día siguiente. Sin costo adicional.'}
                </p>
              </div>

              {/* Lista de items */}
              <div className="card" style={{ padding:16, marginBottom:12 }}>
                <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>🛒 Items ({rows.length})</h3>
                <div style={{ display:'grid', gap:12 }}>
                  {rows.map((r, i) => (
                    <div key={i} style={{ padding:12, background:'#f8f9fa', borderRadius:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <input 
                          className="input" 
                          value={r.product_name || ''} 
                          onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, product_name: e.target.value } : x))} 
                          placeholder="Nombre del producto"
                          style={{ flex:1, marginRight:8, padding:'8px 12px' }}
                        />
                        {statusBadge(r)}
                      </div>
                      
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:8, marginBottom:8 }}>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="Cantidad" 
                          value={r.qty} 
                          onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, qty: parseFloat(e.target.value || '0') } : x))} 
                          style={{ padding:'8px 12px' }}
                        />
                        <select 
                          className="input" 
                          value={r.unit} 
                          onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} 
                          style={{ padding:'8px 12px' }}
                        >
                          <option value="kg">kg</option>
                          <option value="unit">unid</option>
                          <option value="g">g</option>
                        </select>
                        <button 
                          className="button ghost" 
                          onClick={() => setRows(rows.filter((_, idx) => idx !== i))} 
                          style={{ padding:'8px' }}
                        >
                          🗑️
                        </button>
                      </div>

                      {r.match_status === 'exact' && r.product && (
                        <div style={{ fontSize:13, color:'#2e7d32', marginTop:4 }}>
                          ✓ {r.product.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="card" style={{ padding:16, marginBottom:12 }}>
                <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>⚡ Acciones</h3>
                <div style={{ display:'grid', gap:8 }}>
                  {unresolved.length>0 && (
                    <button 
                      className="button" 
                      onClick={()=>setResolveOpen(true)}
                      style={{ background:'#ffc107', color:'#000' }}
                    >
                      🔧 Resolver productos ({unresolved.length})
                    </button>
                  )}
                  <button 
                    className="button" 
                    onClick={saveToDraft} 
                    disabled={unresolved.length>0 || !allRowsHaveCustomer}
                    style={{ opacity:(unresolved.length>0 || !allRowsHaveCustomer)?0.5:1 }}
                  >
                    💾 Guardar en borrador
                  </button>
                </div>
                {!allRowsHaveCustomer && (
                  <div style={{ marginTop:8, padding:8, background:'#fff3cd', borderRadius:8, textAlign:'center', fontSize:13 }}>
                    ⚠️ Asigna un cliente para guardar
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Vista de Lista de Pedidos */}
          {loadingOrders ? (
            <div style={{ padding:24, textAlign:'center' }}>
              <Loader />
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding:24, textAlign:'center', opacity:0.6 }}>
              No hay pedidos en borrador o emitidos
            </div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {orders.map(order => {
                const isExpanded = expandedOrders[order.id]
                const details = orderDetails[order.id]
                
                return (
                <div key={order.id} className="card" style={{ padding:16 }}>
                    {/* Header del pedido */}
                    <div 
                      style={{ 
                        display:'flex', 
                        justifyContent:'space-between', 
                        alignItems:'center', 
                        marginBottom:8,
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => toggleOrderExpand(order.id)}
                    >
                    <div>
                        <strong style={{ fontSize:16 }}>
                          {isExpanded ? '▼' : '▶'} Pedido #{order.id}
                        </strong>
                      <span className={`badge ${order.status === 'draft' ? 'warn' : 'ok'}`} style={{ marginLeft:8 }}>
                        {order.status === 'draft' ? '📝 Borrador' : '✓ Emitido'}
                      </span>
                    </div>
                      <div style={{ display:'flex', gap:8 }}>
                    {order.status === 'draft' && (
                      <button 
                        className="button button-sm" 
                            onClick={(e) => { e.stopPropagation(); handleEmitOrder(order.id) }}
                      >
                        ⚡ Emitir
                      </button>
                    )}
                        {order.status === 'emitted' && (
                          <button 
                            className="button button-sm" 
                            onClick={(e) => { e.stopPropagation(); setAddingItemTo(order.id) }}
                          >
                            + Item
                          </button>
                        )}
                      </div>
                  </div>
                    
                    {/* Info básica */}
                    <div style={{ fontSize:14, color:'#666', marginBottom:8 }}>
                    <div>🚚 {order.shipping_type === 'fastest' ? 'Envío rápido' : 'Envío económico'}</div>
                    <div>📅 {new Date(order.created_at).toLocaleString('es-CL')}</div>
                    {order.notes && <div>📝 {order.notes}</div>}
                    </div>
                    
                    {/* Detalles expandidos */}
                    {isExpanded && details && (
                      <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #e0e0e0' }}>
                        {/* Resumen por cliente */}
                        <h4 style={{ margin:'0 0 8px 0', fontSize:14, fontWeight:600 }}>
                          👥 Resumen por Cliente
                        </h4>
                        {Object.entries(
                          details.items.reduce((acc, item) => {
                            const customer = item.customer_name || 'Sin cliente'
                            if (!acc[customer]) {
                              acc[customer] = { items: [], total: 0 }
                            }
                            acc[customer].items.push(item)
                            acc[customer].total += item.total || 0
                            return acc
                          }, {})
                        ).map(([customerName, data]) => (
                          <div key={customerName} style={{ marginBottom:12, padding:12, background:'#f8f9fa', borderRadius:8 }}>
                            <div style={{ fontWeight:600, marginBottom:8, fontSize:14 }}>
                              {customerName}
                              <span style={{ float:'right', color:'var(--kivi-green)' }}>
                                Total: ${data.total.toLocaleString('es-CL')}
                              </span>
                            </div>
                            
                            {/* Items del cliente */}
                            <div style={{ display:'grid', gap:6 }}>
                              {data.items.map((item) => (
                                <div 
                                  key={item.id} 
                                  style={{ 
                                    display:'flex', 
                                    justifyContent:'space-between', 
                                    alignItems:'center',
                                    fontSize:13,
                                    padding:'6px 8px',
                                    background:'#fff',
                                    borderRadius:4,
                                    gap:8
                                  }}
                                >
                                  <div style={{ flex:1 }}>
                                    <span style={{ fontWeight:500 }}>
                                      {item.product_name || item.product?.name || 'Producto sin nombre'}
                                    </span>
                                    <span style={{ color:'#666', marginLeft:8 }}>
                                      {item.qty} {item.unit}
                                      {item.charged_qty && item.charged_qty !== item.qty && (
                                        <span style={{ color:'var(--kivi-orange)', marginLeft:4 }}>
                                          → {item.charged_qty} {item.charged_unit}
                                        </span>
                                      )}
                                      {item.unit_price && (
                                        <span style={{ color:'#999', marginLeft:4 }}>
                                          @ ${item.unit_price}
                                        </span>
                                      )}
                                    </span>
                                    {item.paid && (
                                      <span style={{ 
                                        marginLeft:8, 
                                        padding:'2px 6px', 
                                        background:'#4caf50', 
                                        color:'#fff', 
                                        borderRadius:4,
                                        fontSize:11,
                                        fontWeight:600
                                      }}>
                                        PAGADO
                                      </span>
                                    )}
                                    {item.product?.purchase_price && (
                                      <span style={{ 
                                        marginLeft:8, 
                                        padding:'2px 6px', 
                                        background:'#2196f3', 
                                        color:'#fff', 
                                        borderRadius:4,
                                        fontSize:11,
                                        fontWeight:600
                                      }}>
                                        COMPRADO
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <div style={{ fontWeight:600 }}>
                                      ${(item.total || 0).toLocaleString('es-CL')}
                                    </div>
                                    {order.status === 'emitted' && (
                                      <>
                                        <button 
                                          className="button button-sm" 
                                          onClick={(e) => { 
                                            e.stopPropagation()
                                            setEditingItem(item)
                                            setEditForm({
                                              qty: item.charged_qty || item.qty,
                                              unit_price: item.unit_price || item.product?.sale_price || 0,
                                              notes: item.notes || ''
                                            })
                                          }}
                                          style={{ padding:'4px 8px', fontSize:12 }}
                                        >
                                          ✏️
                                        </button>
                                        <button 
                                          className="button button-sm ghost" 
                                          onClick={(e) => { 
                                            e.stopPropagation()
                                            handleDeleteItem(item)
                                          }}
                                          style={{ padding:'4px 8px', fontSize:12, color:'#d32f2f' }}
                                        >
                                          🗑️
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                  </div>
                </div>
              ))}
                        
                        {/* Total general del pedido */}
                        <div style={{ 
                          marginTop:12, 
                          padding:12, 
                          background:'var(--kivi-green)', 
                          color:'#fff',
                          borderRadius:8,
                          textAlign:'center',
                          fontWeight:700,
                          fontSize:16
                        }}>
                          TOTAL PEDIDO: ${(details.total || 0).toLocaleString('es-CL')}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal: Resolver productos */}
      {resolveOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 680 }}>
            <ProductResolvePanel 
              items={unresolved} 
              onResolve={handleResolve} 
              onCancel={()=>setResolveOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Modal: Nuevo cliente */}
      {newCustOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Nuevo cliente</h3>
            <div style={{ display:'grid', gap:8 }}>
              <label>Nombre completo<input className="input" value={newCust.name} onChange={e=>setNewCust(v=>({ ...v, name:e.target.value }))} /></label>
              <label>Teléfono<input className="input" value={newCust.phone} onChange={e=>setNewCust(v=>({ ...v, phone:e.target.value }))} /></label>
              <label>Dirección (opcional)<input className="input" value={newCust.address} onChange={e=>setNewCust(v=>({ ...v, address:e.target.value }))} /></label>
              {newCustError ? <div style={{ color:'#b02a37', fontSize:12, textAlign:'center' }}>{newCustError}</div> : null}
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button className="button ghost" onClick={()=>setNewCustOpen(false)}>Cancelar</button>
                <button className="button" onClick={handleCreateCustomer}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo vendedor */}
      {newSellerOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Nuevo vendedor</h3>
            <div style={{ display:'grid', gap:8 }}>
              <label>Nombre completo<input className="input" value={newSeller.name} onChange={e=>setNewSeller(v=>({ ...v, name:e.target.value }))} /></label>
              <label>Teléfono (opcional)<input className="input" value={newSeller.phone} onChange={e=>setNewSeller(v=>({ ...v, phone:e.target.value }))} /></label>
              <label>Dirección (opcional)<input className="input" value={newSeller.address} onChange={e=>setNewSeller(v=>({ ...v, address:e.target.value }))} /></label>
              {newSellerError ? <div style={{ color:'#b02a37', fontSize:12, textAlign:'center' }}>{newSellerError}</div> : null}
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button className="button ghost" onClick={()=>{
                  setNewSellerOpen(false)
                  setNewSeller({ name:'', phone:'', address:'' })
                  setNewSellerError('')
                }}>Cancelar</button>
                <button className="button" onClick={handleCreateSeller}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Agregar item a pedido */}
      {addingItemTo && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Agregar Item al Pedido #{addingItemTo}</h3>
            <div style={{ display:'grid', gap:12 }}>
              <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>Cliente</span>
                <select 
                  className="input" 
                  value={newItem.customer_name} 
                  onChange={e => setNewItem(v => ({ ...v, customer_name: e.target.value }))}
                >
                  <option value="">Seleccionar cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>
              
              <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>Producto</span>
                <select 
                  className="input" 
                  value={newItem.product_id} 
                  onChange={e => setNewItem(v => ({ ...v, product_id: e.target.value }))}
                >
                  <option value="">Seleccionar producto...</option>
                  {products.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.sale_price}/{p.unit}
                    </option>
                  ))}
                </select>
              </label>
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>Cantidad</span>
                  <input 
                    type="number" 
                    className="input" 
                    value={newItem.qty} 
                    onChange={e => setNewItem(v => ({ ...v, qty: parseFloat(e.target.value) || 1 }))}
                    min="0.01"
                    step="0.01"
                  />
                </label>
                
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>Unidad</span>
                  <select 
                    className="input" 
                    value={newItem.unit} 
                    onChange={e => setNewItem(v => ({ ...v, unit: e.target.value }))}
                  >
                    <option value="kg">kg</option>
                    <option value="unit">unid</option>
                    <option value="g">g</option>
                  </select>
                </label>
              </div>
              
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8 }}>
                <button 
                  className="button ghost" 
                  onClick={() => {
                    setAddingItemTo(null)
                    setNewItem({ product_id: '', qty: 1, unit: 'kg', customer_name: '' })
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="button" 
                  onClick={handleAddItem}
                  disabled={!newItem.product_id || !newItem.customer_name}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Editar item */}
      {editingItem && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>
              Editar: {editingItem.product_name || editingItem.product?.name}
            </h3>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>Cantidad</span>
                  <input 
                    type="number" 
                    className="input" 
                    value={editForm.qty} 
                    onChange={e => setEditForm(v => ({ ...v, qty: parseFloat(e.target.value) || 0 }))}
                    min="0.01"
                    step="0.01"
                  />
                </label>
                
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>Precio Unitario</span>
                  <input 
                    type="number" 
                    className="input" 
                    value={editForm.unit_price} 
                    onChange={e => setEditForm(v => ({ ...v, unit_price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="1"
                  />
                </label>
              </div>
              
              <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>Notas (opcional)</span>
                <textarea 
                  className="input" 
                  value={editForm.notes} 
                  onChange={e => setEditForm(v => ({ ...v, notes: e.target.value }))}
                  rows={3}
                  placeholder="Agregar notas..."
                />
              </label>
              
              <div style={{ 
                padding:12, 
                background:'#f5f5f5', 
                borderRadius:8,
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center'
              }}>
                <span style={{ fontSize:14, fontWeight:600 }}>Total:</span>
                <span style={{ fontSize:16, fontWeight:700, color:'var(--kivi-green)' }}>
                  ${(editForm.qty * editForm.unit_price).toLocaleString('es-CL')}
                </span>
              </div>
              
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8 }}>
                <button 
                  className="button ghost" 
                  onClick={() => {
                    setEditingItem(null)
                    setEditForm({ qty: 0, unit_price: 0, notes: '' })
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="button" 
                  onClick={handleEditItem}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

