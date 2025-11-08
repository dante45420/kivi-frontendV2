/**
 * Página: Gestión de Ofertas Semanales
 * Crear, editar y gestionar ofertas de la semana
 */
import { useState, useEffect } from 'react'
import { fetchWeeklyOffers, createWeeklyOffer, updateWeeklyOffer, deleteWeeklyOffer } from '../api/weeklyOffers'
import { fetchProducts } from '../api/products'
import Loader from '../components/Loader'

export default function WeeklyOffers() {
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    special_price: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [offersData, productsData] = await Promise.all([
        fetchWeeklyOffers(false, false), // Cargar todas las ofertas
        fetchProducts()
      ])
      setOffers(offersData)
      setProducts(productsData.filter(p => p.active))
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error cargando datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    setEditingOffer(null)
    setFormData({
      product_id: '',
      special_price: '',
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  function openEditModal(offer) {
    setEditingOffer(offer)
    setFormData({
      product_id: offer.product_id,
      special_price: offer.special_price,
      start_date: offer.start_date?.split('T')[0] || '',
      end_date: offer.end_date?.split('T')[0] || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.product_id || !formData.special_price || !formData.start_date || !formData.end_date) {
      alert('Por favor completa todos los campos')
      return
    }

    try {
      const data = {
        product_id: parseInt(formData.product_id),
        special_price: parseInt(formData.special_price),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString()
      }

      if (editingOffer) {
        await updateWeeklyOffer(editingOffer.id, data)
        alert('✅ Oferta actualizada')
      } else {
        await createWeeklyOffer(data)
        alert('✅ Oferta creada')
      }

      setShowModal(false)
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function handleToggleActive(offer) {
    try {
      await updateWeeklyOffer(offer.id, { active: !offer.active })
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function handleDelete(offer) {
    if (!confirm(`¿Eliminar oferta de ${offer.product?.name}?`)) return

    try {
      await deleteWeeklyOffer(offer.id)
      alert('✅ Oferta eliminada')
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }

  // Ofertas activas y vigentes
  const now = new Date()
  const activeOffers = offers.filter(o => 
    o.active && 
    new Date(o.start_date) <= now && 
    new Date(o.end_date) >= now
  )
  
  const upcomingOffers = offers.filter(o => 
    o.active && 
    new Date(o.start_date) > now
  )
  
  const pastOffers = offers.filter(o => 
    new Date(o.end_date) < now || !o.active
  )

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
            🏷️ Ofertas Semanales
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            Gestiona los productos en oferta para el catálogo público
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="button"
          style={{ minWidth: '160px' }}
        >
          <span>➕</span>
          <span>Nueva Oferta</span>
        </button>
      </div>

      {/* Ofertas Activas */}
      {activeOffers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#4caf50' }}>
            ✅ Ofertas Vigentes
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {activeOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() => openEditModal(offer)}
                onToggle={() => handleToggleActive(offer)}
                onDelete={() => handleDelete(offer)}
                status="active"
              />
            ))}
          </div>
        </div>
      )}

      {/* Ofertas Próximas */}
      {upcomingOffers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ff9800' }}>
            📅 Ofertas Próximas
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {upcomingOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() => openEditModal(offer)}
                onToggle={() => handleToggleActive(offer)}
                onDelete={() => handleDelete(offer)}
                status="upcoming"
              />
            ))}
          </div>
        </div>
      )}

      {/* Ofertas Pasadas/Inactivas */}
      {pastOffers.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#999' }}>
            📦 Ofertas Anteriores
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {pastOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() => openEditModal(offer)}
                onToggle={() => handleToggleActive(offer)}
                onDelete={() => handleDelete(offer)}
                status="past"
              />
            ))}
          </div>
        </div>
      )}

      {offers.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            No hay ofertas
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Crea tu primera oferta de la semana
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
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
            padding: '24px',
            maxWidth: '500px',
            width: '95%',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700 }}>
              {editingOffer ? '✏️ Editar Oferta' : '➕ Nueva Oferta'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Producto *</label>
                <select
                  className="input"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                  disabled={!!editingOffer}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.sale_price?.toLocaleString('es-CL')} / {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Precio Especial *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.special_price}
                  onChange={(e) => setFormData({ ...formData, special_price: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label className="label">Fecha Inicio *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Fecha Fin *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button ghost"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button"
                  style={{ flex: 1 }}
                >
                  {editingOffer ? '💾 Actualizar' : '➕ Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function OfferCard({ offer, onEdit, onToggle, onDelete, status }) {
  const statusColors = {
    active: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
    upcoming: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    past: { bg: '#f5f5f5', border: '#ccc', text: '#666' }
  }

  const colors = statusColors[status] || statusColors.past

  return (
    <div className="card" style={{
      padding: '16px',
      background: colors.bg,
      borderColor: colors.border
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {offer.product?.photo_url && (
              <img
                src={offer.product.photo_url}
                alt={offer.product.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {offer.product?.name || 'Producto'}
              </h4>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {new Date(offer.start_date).toLocaleDateString('es-CL')} - {new Date(offer.end_date).toLocaleDateString('es-CL')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#999' }}>Precio Normal</div>
              <div style={{
                fontSize: '14px',
                textDecoration: 'line-through',
                color: '#999'
              }}>
                ${offer.product?.sale_price?.toLocaleString('es-CL')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#999' }}>Precio Oferta</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#ff5722'
              }}>
                ${offer.special_price.toLocaleString('es-CL')}
              </div>
            </div>
            {offer.product?.sale_price && (
              <div style={{
                background: '#ff5722',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                -{Math.round((1 - offer.special_price / offer.product.sale_price) * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            className="button button-sm ghost"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={onToggle}
            className="button button-sm ghost"
            title={offer.active ? 'Desactivar' : 'Activar'}
          >
            {offer.active ? '👁️' : '🚫'}
          </button>
          <button
            onClick={onDelete}
            className="button button-sm ghost"
            title="Eliminar"
            style={{ color: '#f44336' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

