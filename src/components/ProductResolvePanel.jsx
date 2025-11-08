/**
 * Panel para resolver productos no encontrados
 * Permite buscar, asociar o crear nuevos productos
 */
import { useRef, useState } from 'react'

export default function ProductResolvePanel({ items, onResolve, onCancel }) {
  const [saleInputs, setSaleInputs] = useState({})
  const [nameInputs, setNameInputs] = useState({})
  const [unitInputs, setUnitInputs] = useState({}) // unidad de cobro del producto nuevo
  const [liveSugs, setLiveSugs] = useState({}) // key -> [{id,name,score}]
  const timersRef = useRef({})

  function setSale(it, val){
    const key = (it.line_number ?? it.line_index ?? it.index)
    setSaleInputs(v => ({ ...v, [key]: val }))
  }

  async function searchProducts(query) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/api/products/suggest?q=${encodeURIComponent(query)}`)
      if (!response.ok) return []
      return await response.json()
    } catch {
      return []
    }
  }

  return (
    <div style={{ maxHeight:'80vh', overflow:'auto' }}>
      <h3 style={{ margin:'0 0 16px 0', textAlign:'center', fontSize:18 }}>🔍 Resolver Productos</h3>
      
      {items.length === 0 ? (
        <div style={{ textAlign:'center', padding:24, opacity:0.6 }}>
          No hay productos por resolver
        </div>
      ) : (
        <div style={{ display:'grid', gap:16 }}>
          {items.map((it, idx) => {
            const key = (it.line_number ?? it.line_index ?? it.index)
            const sale = saleInputs[key] || ''
            const pname = nameInputs[key] ?? it.product_name
            const dunit = unitInputs[key] || 'kg'
            
            return (
              <div key={idx} className="card" style={{ padding:16 }}>
                {/* Nombre del producto */}
                <h4 style={{ margin:'0 0 12px 0', fontSize:16 }}>
                  {it.qty} {it.unit} de "{it.product_name}"
                </h4>
                
                {/* Buscar producto */}
                <input 
                  className="input" 
                  value={pname}
                  onChange={async e=> {
                    const val = e.target.value
                    setNameInputs(v=>({ ...v, [key]: val }))
                    const q = (val||'').trim()
                    clearTimeout(timersRef.current[key])
                    if (q.length < 2){ setLiveSugs(v=>({ ...v, [key]: [] })); return }
                    timersRef.current[key] = setTimeout(async () => {
                      try{
                        const res = await searchProducts(q)
                        setLiveSugs(v=>({ ...v, [key]: res || [] }))
                      }catch{ /* ignore */ }
                    }, 250)
                  }}
                  placeholder="Buscar producto existente..." 
                  style={{ width:'100%', marginBottom:8 }}
                />
                
                {/* Sugerencias en vivo */}
                {(liveSugs[key]?.length>0) && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                    {liveSugs[key].map(s => (
                      <button 
                        key={s.id} 
                        className="button ghost" 
                        onClick={() => onResolve(it, { product_id: s.id, product_name: s.name })}
                        style={{ fontSize:13 }}
                      >
                        ✓ {s.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Sugerencias automáticas */}
                {it.suggestions?.length > 0 && (
                  <div>
                    <div style={{ fontSize:13, opacity:0.7, marginBottom:6 }}>Sugerencias automáticas:</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                      {it.suggestions.map(s => (
                        <button 
                          key={s.id} 
                          className="button" 
                          onClick={() => onResolve(it, { product_id: s.id, product_name: s.name })}
                          style={{ fontSize:13 }}
                        >
                          {s.name} ({s.score}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Crear nuevo producto */}
                <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, marginTop:12 }}>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>
                    ➕ Crear Producto Nuevo
                  </div>
                  <div style={{ display:'grid', gap:8 }}>
                    <select 
                      className="input" 
                      value={dunit} 
                      onChange={e=> setUnitInputs(v=>({ ...v, [key]: e.target.value }))}
                      style={{ width:'100%' }}
                    >
                      <option value="kg">Se cobra por kilogramo</option>
                      <option value="unit">Se cobra por unidad</option>
                    </select>
                    
                    <input 
                      type="number" 
                      className="input" 
                      placeholder={`Precio por ${dunit === 'kg' ? 'kg' : 'unidad'}`} 
                      value={sale} 
                      onChange={e => setSale(it, e.target.value)} 
                      style={{ width:'100%' }}
                    />
                    
                    <button 
                      className="button" 
                      onClick={() => {
                        const price = parseFloat(sale)
                        if (!sale || isNaN(price) || price <= 0){ 
                          alert('Ingresa precio de venta (>0)'); 
                          return 
                        }
                        onResolve(it, { 
                          create_if_missing: true, 
                          sale_price: price, 
                          product: pname, 
                          default_unit: dunit 
                        })
                      }}
                      style={{ width:'100%' }}
                    >
                      Crear "{pname}"
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      <button 
        className="button ghost" 
        onClick={onCancel} 
        style={{ width:'100%', marginTop:16 }}
      >
        Cerrar
      </button>
    </div>
  )
}

